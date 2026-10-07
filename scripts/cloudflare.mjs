import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import './runtime-env.mjs';
const [command,...args]=process.argv.slice(2);
const readConfig=()=>JSON.parse(fs.readFileSync('wrangler.json','utf8').replace(/^\uFEFF/,''));
function run(argv){const r=spawnSync(process.execPath,argv,{stdio:'inherit',env:process.env});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
function wrangler(...argv){run(['--import','./scripts/runtime-env.mjs','node_modules/wrangler/bin/wrangler.js',...argv]);}
function ensureDatabase(){const id=readConfig().d1_databases[0].database_id;if(!/^[0-9a-f-]{36}$/i.test(id)||id==='00000000-0000-4000-8000-000000000000')throw new Error('First create the database and run: node scripts/cloudflare.mjs bind YOUR_DATABASE_ID');}
switch(command){
 case 'login':wrangler('login');break;
 case 'create-db':wrangler('d1','create','joesblendz-bookings','--config','wrangler.json');break;
 case 'bind':{
  const id=args[0];if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||id==='00000000-0000-4000-8000-000000000000')throw new Error('Paste the actual database_id returned by Cloudflare.');
  const c=readConfig();c.d1_databases[0].database_id=id;fs.writeFileSync('wrangler.json',JSON.stringify(c,null,2)+'\n');console.log('Cloudflare database ID saved.');break;
 }
 case 'password':console.log('Save this owner password in your password manager. Do not paste it into chat.\n\n'+randomBytes(32).toString('hex')+'\n\nUse it for ADMIN_PASSWORD and the dashboard login.');break;
 case 'secret':wrangler('secret','put','ADMIN_PASSWORD','--config','wrangler.json');break;
 case 'build':run(['scripts/run-framework.mjs','build']);break;
 case 'deploy-private':
 case 'publish':{
  ensureDatabase();
  const c=readConfig();c.vars.SITE_PUBLIC=command==='publish'?'true':'false';
  fs.writeFileSync('wrangler.json',JSON.stringify(c,null,2)+'\n');
  run(['scripts/run-framework.mjs','build']);
  wrangler('d1','migrations','apply','DB','--remote','--config','wrangler.json');
  wrangler('deploy','--config','dist/server/wrangler.json');
  console.log(command==='publish'?'Public deployment requested. Test the live URL before sharing.':'Private setup deployed. Set ADMIN_PASSWORD next, then open the printed URL followed by /admin.');
  break;
 }
 case 'setup-local':{
  if(fs.existsSync('.dev.vars')){console.log('Local settings already exist; preserved.');break;}
  fs.writeFileSync('.dev.vars','ADMIN_PASSWORD='+randomBytes(32).toString('hex')+'\nSITE_PUBLIC=true\n',{mode:0o600});
  console.log('Created a local owner password in ignored .dev.vars. Run node scripts/cloudflare.mjs local-password to view it on your own terminal.');break;
 }
 case 'local-password':{
  const s=fs.readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD=([a-f0-9]{64})$/m);
  if(!s)throw new Error('Run setup-local first.');console.log('LOCAL PREVIEW ONLY — save privately:\n'+s[1]);break;
 }
 default:console.log('Commands: login, create-db, bind DATABASE_ID, password, deploy-private, secret, publish, build, setup-local, local-password');
}

