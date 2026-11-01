/** Produce truthful, source-derived public commit receipt on the final Vite build.
 * The generated file belongs only in the build artifact, not source control.
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const gitSha=()=>{
  try{return execFileSync('git',['rev-parse','HEAD'],{
    cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']
  }).trim();}catch{return null;}
};
// The Git metadata of the build is authoritative. A Vercel or Cloudflare
// environment SHA is accepted only if the Git checkout is unavailable.
const verified=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value)?value:null;
const sha=verified(gitSha())||
  verified(process.env.VERCEL_GIT_COMMIT_SHA)||
  verified(process.env.CF_PAGES_COMMIT_SHA)||
  verified(process.env.GITHUB_SHA);
if(!sha){
  // A build without an actual revision must not ship an invented or stale SHA.
  // Preserve the existing public Vercel build if its source archive lacks .git.
  const target=resolve(root,'frontend','public','_release.json');
  try{const {rmSync}=await import('node:fs');rmSync(target,{force:true});}catch{}
  process.stderr.write('No verified Git revision available; release receipt omitted.\\n');
  process.exit(0);
}
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
