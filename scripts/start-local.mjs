import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
function run(args){const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(r.status!==0)process.exit(r.status||1);}
if(!fs.existsSync('node_modules/vinext/dist/cli.js')){
 const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 if(!fs.existsSync(npm))throw new Error('Run npm ci in this directory, then try again.');
 process.env.npm_config_cache=path.join(root,'.runtime/npm-cache');
 run([npm,'--prefix','.', '--workspaces=false','run','install:ci']);
}
if(!fs.existsSync('.dev.vars'))run(['scripts/cloudflare.mjs','setup-local']);
fs.mkdirSync('.runtime',{recursive:true});
const ledger='.runtime/local-migrations.json';
let applied=fs.existsSync(ledger)?JSON.parse(fs.readFileSync(ledger,'utf8')):[];
for(const name of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort()){
 if(applied.includes(name))continue;
 run(['--import','./scripts/runtime-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.json','--persist-to','.wrangler/state','--file','drizzle/'+name]);
 applied.push(name);fs.writeFileSync(ledger,JSON.stringify(applied));
}
console.log('\nJoesblendz local preview. Nothing is published.\nOpen http://127.0.0.1:5173/ and /admin for Joe’s dashboard.\nPress Ctrl+C to stop.\n');
const child=spawn(process.execPath,['scripts/run-framework.mjs','dev','--hostname','127.0.0.1'],{stdio:'inherit',env:process.env});
process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));
child.on('exit',code=>process.exit(code||0));

