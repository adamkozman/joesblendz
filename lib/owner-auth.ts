import { env } from 'cloudflare:workers';
export const cookieName='joesblendz_owner';
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
export function configured(){return typeof env.ADMIN_PASSWORD==='string' && /^[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD);}
export function sessionToken(cookie:string|null){return cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
export async function isOwner(cookie:string|null){
 if(!configured()||!env.DB)return false;
 const token=sessionToken(cookie);if(!/^[a-f0-9]{64}$/.test(token))return false;
 const row=await env.DB.prepare('SELECT expires,password_tag FROM owner_sessions WHERE token_hash=?').bind(await digest(token)).first<{expires:number;password_tag:string}>();
 return !!row&&row.expires>Date.now()&&row.password_tag===await digest('owner-password:'+env.ADMIN_PASSWORD);
}
export function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');}
export async function matchesPassword(input:string){
 if(!configured())return false;
 const a=await digest(input),b=await digest(env.ADMIN_PASSWORD!);let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;
}

