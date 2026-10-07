import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:5173', password=fs.readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD=([a-f0-9]{64})$/m)?.[1];
assert(password);
const post=(body,headers={})=>fetch(base+'/api/auth',{method:'POST',headers:{'content-type':'application/json',origin:base,...headers},body:JSON.stringify(body)});
assert.equal((await post({action:'login',password:'incorrect'})).status,401);
assert.equal((await post({action:'login',password},{origin:'https://untrusted.example'})).status,403);
assert.equal((await post({action:'login',password},{origin:''})).status,403);
assert.equal((await fetch(base+'/api?action=admin',{headers:{'x-owner-id':'owner','x-owner-email':'owner@example.test'}})).status,403);
assert.equal((await fetch(base+'/api?action=admin',{headers:{cookie:'joesblendz_owner='+'a'.repeat(64)}})).status,403);
const login=await post({action:'login',password});assert.equal(login.status,200);
const header=login.headers.get('set-cookie');assert(header.includes('HttpOnly')&&header.includes('SameSite=Strict')&&header.includes('Max-Age=43200'));
const cookie=header.split(';')[0];
assert.equal((await fetch(base+'/api?action=admin',{headers:{cookie}})).status,200);
assert.equal((await post({action:'logout'},{cookie})).status,200);
assert.equal((await fetch(base+'/api?action=admin',{headers:{cookie}})).status,403,'Logout invalidates the server session');
let last;for(let i=0;i<11;i++)last=await post({action:'login',password:'incorrect'});assert.equal(last.status,429);
console.log('PASS: password login, cookie protections, logout revocation, CSRF rejection, forged identity headers, forged cookies, login rate limiting.');

