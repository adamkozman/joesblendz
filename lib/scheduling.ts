export type Service = { id:string; name:string; description:string; duration:number; price:number; active:number };
export type Settings = { timezone:string; currency:string; location:string; contact:string; notice:number; cancellationHours:number; sample:boolean };
export const defaults: Settings = { timezone:'America/Toronto', currency:'CAD', location:'278 Rue du Gouverneur J7V 8H9', contact:'josephaziz023@gmail.com', notice:2, cancellationHours:12, sample:false };
export const sampleServices:Service[] = [
 {id:'signature',name:'Haircut only',description:'A fresh haircut, tailored to your style.',duration:45,price:2500,active:1},
 {id:'full',name:'Haircut and beard',description:'Your haircut and beard, shaped and finished together.',duration:60,price:3000,active:1},
 {id:'beard',name:'Line up (taper only)',description:'A clean line up and taper to keep things sharp.',duration:30,price:2000,active:1},
 {id:'kids',name:'Kids haircut (under 12)',description:'A fresh look for the little ones, ages 11 and under.',duration:30,price:2000,active:1}
];
export const minute=60000;
export function dayKey(ms:number,timezone:string) {return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));}
export function wallTime(date:string,time:string,zone:string):number {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)) throw new Error('Choose a valid date and time.');
 const target=Date.parse(date+'T'+time+':00Z');
 if(!Number.isFinite(target)) throw new Error('Invalid date.');
 let guess=target;
 const f=new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<4;i++) guess+=target-Date.parse(f.format(guess).replace(' ','T')+'Z');
 if(f.format(guess).slice(0,16)!==date+' '+time) throw new Error('This time does not exist in the selected time zone.');
 return guess;
}
export function slotsFor(windows:{start:number;end:number}[],busy:{start:number;end:number}[],duration:number,now:number,notice:number) {
 const slots:number[]=[];
 for(const w of windows) for(let t=w.start;t+duration*minute<=w.end;t+=15*minute) {
  if(t>=now+notice*60*minute && !busy.some(b=>b.start<t+duration*minute && b.end>t)) slots.push(t);
 }
 return [...new Set(slots)].sort((a,b)=>a-b);
}

