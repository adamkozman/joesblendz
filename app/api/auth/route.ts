import { env } from 'cloudflare:workers';
import {configured,cookieName,digest,isOwner,matchesPassword,randomToken,sessionToken} from '../../../lib/owner-auth';
export const dynamic='force-dynamic';
const reply=(value:unknown,status=200,cookie?:string)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
export async function POST(req:Request){
 try{
 const url=new URL(req.url);
 if(req.headers.get('origin')!==url.origin)return reply({error:'Invalid request origin.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'JSON is required.'},415);
 const raw=await req.text();if(raw.length>2048)return reply({error:'Request too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
 if(!body||typeof body!=='object')return reply({error:'Invalid request.'},400);
 const secure=url.protocol==='https:'?'; Secure':'';
 if(body.action==='logout'){
  const token=sessionToken(req.headers.get('cookie'));
  if(token&&env.DB)await env.DB.prepare('DELETE FROM owner_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return reply({ok:true},200,cookieName+'=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+secure);
 }
 if(body.action!=='login')return reply({error:'Not found.'},404);
 if(!configured()||!env.DB)return reply({error:'Owner login is not configured yet. Follow the Cloudflare setup guide.'},503);
 const now=Date.now(),key='login:'+await digest((req.headers.get('cf-connecting-ip')||'local')+':'+Math.floor(now/900000));
 const attempt=await env.DB.prepare('INSERT INTO limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+1800000).first<{count:number}>();
 if((attempt?.count||0)>10)return reply({error:'Too many sign-in attempts. Try again in 15 minutes.'},429);
 if(typeof body.password!=='string'||body.password.length>256||!await matchesPassword(body.password))return reply({error:'Incorrect owner password.'},401);
 const token=randomToken(),expires=now+12*3600000;
 await env.DB.batch([
  env.DB.prepare('DELETE FROM owner_sessions WHERE expires<?').bind(now),
  env.DB.prepare('DELETE FROM limits WHERE expires<?').bind(now),
  env.DB.prepare('INSERT INTO owner_sessions (token_hash,expires,password_tag) VALUES (?,?,?)').bind(await digest(token),expires,await digest('owner-password:'+env.ADMIN_PASSWORD)),
 ]);
 return reply({ok:true},200,cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200'+secure);
 }catch(e){console.error('Owner authentication failed');return reply({error:'Unable to sign in. Please try again.'},500);}
}
export async function GET(req:Request){return reply({isOwner:await isOwner(req.headers.get('cookie'))});}

