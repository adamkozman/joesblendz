import {spawnSync} from 'node:child_process';
import {projectRoot} from './runtime-env.mjs';
if(!process.env.npm_execpath) throw new Error('Run npm run install:ci.');
const r=spawnSync(process.execPath,[process.env.npm_execpath,'ci','--prefix',projectRoot,'--workspaces=false','--include=dev','--include=optional','--no-audit','--no-fund'],{stdio:'inherit'});
if(r.error)throw r.error;
process.exit(r.status??1);
