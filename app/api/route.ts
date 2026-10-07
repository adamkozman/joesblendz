import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { isOwner } from '../../lib/owner-auth';
import { defaults, sampleServices, slotsFor, wallTime, type Settings, type Service } from '../../lib/scheduling';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
class Problem extends Error {constructor(message:string,public status=400){super(message);}}
const db=()=>{if(!env.DB) throw new Problem('The booking database is unavailable.',503);return env.DB;};
async function config():Promise<Settings>{const row=await db().prepare('SELECT value FROM settings WHERE id=1').first<{value:string}>();return row?{...defaults,...JSON.parse(row.value)}:defaults;}
async function owner(){return isOwner((await headers()).get('cookie'));}
async function requireOwner(){if(!await owner())throw new Problem('Sign in with Joe’s authorized account to access the dashboard.',403);}
function field(v:unknown,name:string,max:number,min=0){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)throw new Problem('Enter a valid '+name+'.');return v.trim();}
async function hash(v:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),x=>x.toString(16).padStart(2,'0')).join('');}
async function throttle(req:Request){
 const now=Date.now(),key=await hash((req.headers.get('cf-connecting-ip')||'local')+':'+Math.floor(now/3600000));
 const row=await db().prepare('INSERT INTO limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+7200000).first<{count:number}>();
 await db().prepare('DELETE FROM limits WHERE expires < ?').bind(now).run();
 if((row?.count||0)>30)throw new Problem('Too many requests. Please try again in an hour.',429);
}
export async function GET(req:Request){
 try{
 const action=new URL(req.url).searchParams.get('action')||'public',settings=await config();
 if(action==='identity')return json({isOwner:await owner()});
 if(action==='admin'){
  await requireOwner();
  const [a,b,s]=await Promise.all([
   db().prepare('SELECT * FROM availability WHERE end>? ORDER BY start').bind(Date.now()).all(),
   db().prepare('SELECT id,service_name,currency,price,start,end,name,email,phone,note,status,created FROM bookings ORDER BY start DESC LIMIT 1000').all(),
   db().prepare("SELECT * FROM services ORDER BY CASE id WHEN 'signature' THEN 0 WHEN 'full' THEN 1 WHEN 'beard' THEN 2 WHEN 'kids' THEN 3 ELSE 4 END, rowid").all()
  ]);
  return json({settings,availability:a.results,bookings:b.results,services:s.results});
 }
 if(action!=='public')throw new Problem('Not found.',404);
 const services=(await db().prepare("SELECT * FROM services WHERE active=1 ORDER BY CASE id WHEN 'signature' THEN 0 WHEN 'full' THEN 1 WHEN 'beard' THEN 2 WHEN 'kids' THEN 3 ELSE 4 END, rowid").all<Service>()).results,now=Date.now();
 const windows=(await db().prepare('SELECT start,end FROM availability WHERE end>? AND start<? ORDER BY start').bind(now,now+90*86400000).all<{start:number;end:number}>()).results;
 const busy=(await db().prepare("SELECT start,end FROM bookings WHERE status='confirmed' AND end>?").bind(now).all<{start:number;end:number}>()).results;
 return json({settings,services,slots:Object.fromEntries(services.map(s=>[s.id,slotsFor(windows,busy,s.duration,now,settings.notice)])),isOwner:await owner()});
 }catch(e){return fail(e);}
}
export async function POST(req:Request){
 try{
  const origin=req.headers.get('origin');
  if(origin&&origin!==new URL(req.url).origin)throw new Problem('Invalid request origin.',403);
  if(!req.headers.get('content-type')?.includes('application/json'))throw new Problem('JSON is required.',415);
  const raw=await req.text();if(raw.length>20000)throw new Problem('Request is too large.',413);
  let b;try{b=JSON.parse(raw);}catch{throw new Problem('Invalid request.');}
  if(!b||typeof b!=='object')throw new Problem('Invalid request.');
  const settings=await config(),now=Date.now();
  if(b.action==='book'){
   await throttle(req);
   const name=field(b.name,'name',80,2),email=field(b.email,'email address',180,3).toLowerCase(),phone=field(b.phone,'phone number',35,7),note=field(b.note??'','note',500);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[+()\d\s.\-]{7,35}$/.test(phone))throw new Problem('Check your email address and phone number.');
   if(b.website)throw new Problem('Unable to accept this booking.');
   const s=await db().prepare('SELECT * FROM services WHERE id=? AND active=1').bind(field(b.serviceId,'service',60,1)).first<Service>();
   if(!s)throw new Problem('This service is no longer available.',409);
   if(b.quotedPrice!==s.price||b.quotedDuration!==s.duration||b.quotedCurrency!==settings.currency)throw new Problem('This service or price has changed. Review the updated details and try again.',409);
   if(!Number.isSafeInteger(b.start)||b.start<now+settings.notice*3600000||b.start>now+90*86400000)throw new Problem('Choose a future available appointment.');
   const end=b.start+s.duration*60000,id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
   // A single conditional SQLite insert serializes competing reservations.
   const r=await db().prepare("INSERT INTO bookings (id,token_hash,service_id,service_name,currency,timezone,location,price,start,end,name,email,phone,note,status,created) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,'confirmed',? WHERE EXISTS(SELECT 1 FROM availability WHERE start<=? AND end>=? AND (? - start) % 900000 = 0) AND EXISTS(SELECT 1 FROM services WHERE id=? AND active=1 AND duration=? AND price=?) AND NOT EXISTS(SELECT 1 FROM bookings WHERE status='confirmed' AND start<? AND end>?)")
    .bind(id,await hash(token),s.id,s.name,settings.currency,settings.timezone,settings.location,s.price,b.start,end,name,email,phone,note,now,b.start,end,b.start,s.id,s.duration,s.price,end,b.start).run();
   if(!r.meta.changes)throw new Problem('That time was just booked or changed. Please choose another available time.',409);
   return json({id,token,service_name:s.name,price:s.price,start:b.start,end,name,status:'confirmed',settings},201);
  }
  if(b.action==='manage'||b.action==='cancel'){
   await throttle(req);const token=field(b.token,'booking link',100,60);
   const booking=await db().prepare('SELECT id,service_name,currency,timezone,location,price,start,end,name,status FROM bookings WHERE token_hash=?').bind(await hash(token)).first<{id:string;start:number;status:string;currency:string;timezone:string;location:string}>();
   if(!booking)throw new Problem('This booking link could not be found.',404);
   if(b.action==='cancel'){
    if(booking.status==='confirmed'&&booking.start<now+settings.cancellationHours*3600000)throw new Problem('Online cancellations close '+settings.cancellationHours+' hours before your appointment. Please contact Joe.',409);
    await db().prepare("UPDATE bookings SET status='cancelled' WHERE id=?").bind(booking.id).run();booking.status='cancelled';
   }
   return json({...booking,settings:{...settings,currency:booking.currency,timezone:booking.timezone,location:booking.location}});
  }
  await requireOwner();
  if(b.action==='initialize'){
   await db().batch(sampleServices.map(s=>db().prepare('INSERT OR IGNORE INTO services (id,name,description,duration,price,active) VALUES (?,?,?,?,?,1)').bind(s.id,s.name,s.description,s.duration,s.price)));
   return json({ok:true});
  }
  if(b.action==='availability'){
   let start:number,end:number;
   try{start=wallTime(field(b.date,'date',10,10),field(b.from,'start time',5,5),settings.timezone);end=wallTime(b.date,field(b.to,'end time',5,5),settings.timezone);}catch(e){throw new Problem(e instanceof Error?e.message:'Invalid date.');}
   if(start<now||start>now+365*86400000||end<=start||end-start>16*3600000)throw new Problem('Choose a future window of up to 16 hours, within the next year.');
   if(!/:(00|15|30|45)$/.test(b.from)||!/:(00|15|30|45)$/.test(b.to))throw new Problem('Use 15-minute increments.');
   const r=await db().prepare('INSERT INTO availability (id,start,end) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM availability WHERE start<? AND end>?)').bind(crypto.randomUUID(),start,end,end,start).run();
   if(!r.meta.changes)throw new Problem('This window overlaps availability you have already added.',409);return json({ok:true});
  }
  if(b.action==='removeAvailability'){
   const r=await db().prepare("DELETE FROM availability WHERE id=? AND NOT EXISTS(SELECT 1 FROM bookings WHERE status='confirmed' AND bookings.start<availability.end AND bookings.end>availability.start)").bind(field(b.id,'availability',80,1)).run();
   if(!r.meta.changes)throw new Problem('This window has a confirmed booking. Cancel that booking first, then remove the window.',409);return json({ok:true});
  }
  if(b.action==='cancelAdmin'){await db().prepare("UPDATE bookings SET status='cancelled' WHERE id=?").bind(field(b.id,'booking',80,1)).run();return json({ok:true});}
  if(b.action==='settings'){
   const s=b.settings;
   if(!s||!Number.isInteger(s.notice)||s.notice<0||s.notice>168||!Number.isInteger(s.cancellationHours)||s.cancellationHours<0||s.cancellationHours>168||typeof s.sample!=='boolean')throw new Problem('Notice and cancellation limits must be between 0 and 168 hours.');
   try{new Intl.DateTimeFormat('en',{timeZone:s.timezone}).format();}catch{throw new Problem('Enter a valid time zone, such as America/Toronto.');}
   if(!['CAD','USD','EUR','GBP'].includes(s.currency))throw new Problem('Choose a supported currency.');
   const clean:Settings={timezone:field(s.timezone,'time zone',80,1),currency:s.currency,location:field(s.location,'location',250),contact:field(s.contact,'contact details',180),notice:s.notice,cancellationHours:s.cancellationHours,sample:s.sample};
   await db().prepare('INSERT INTO settings (id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind(JSON.stringify(clean)).run();return json({ok:true});
  }
  if(b.action==='service'){
   const s=b.service;
   if(!s||!Number.isInteger(s.duration)||s.duration<15||s.duration>240||s.duration%15||!Number.isInteger(s.price)||s.price<0||s.price>100000||![0,1].includes(s.active))throw new Problem('Use a duration in 15-minute increments and a price between 0 and 1,000.');
   await db().prepare('INSERT INTO services (id,name,description,duration,price,active) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,duration=excluded.duration,price=excluded.price,active=excluded.active').bind(field(s.id||crypto.randomUUID(),'service ID',60,1),field(s.name,'service name',70,2),field(s.description,'description',180),s.duration,s.price,s.active).run();return json({ok:true});
  }
  throw new Problem('Not found.',404);
 }catch(e){return fail(e);}
}
function fail(e:unknown){if(e instanceof Problem)return json({error:e.message},e.status);console.error(e);return json({error:'Something went wrong. Please try again.'},500);}

