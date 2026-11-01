/** Produce truthful, source-derived public commit receipt on the final Vite build.
 * The generated file belongs only in the build artifact, not source control.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Missing validated Git commit SHA; build receipt cannot be created');
const receipt={
  app:'Agri Foresight',
  git_commit_sha:sha,
  generated_from:'git',
  built_at_utc:new Date().toISOString(),
  environment:'Cloudflare Worker build candidate',
  disclosure:'Build provenance only. Contains no farmer declarations, weather data or credentials.'
};
const dest=resolve(root,'frontend','public','_release.json');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify(receipt,null,2)+'\n',{encoding:'utf8',mode:0o644});
process.stdout.write('Release manifest prepared from Git SHA '+sha+'\n');
