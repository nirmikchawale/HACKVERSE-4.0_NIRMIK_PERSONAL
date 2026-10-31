import { appendFileSync } from 'node:fs';
// Fail closed: only the exact GitHub head at this project is certified.
const token=process.env.VERCEL_TOKEN, expected=process.env.GITHUB_SHA;
if (!token || !process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    !/^[0-9a-f]{40}$/i.test(expected||'')) {
  throw new Error('B-04 blocked: reviewed commit and both GitHub Actions secrets are required.');
}
const project='prj_F1BiKEp23G1G8nxmJx4CAIPjdMLa';
const team='team_H3oREM1Wjb9g8b6SJp4k3c5I';
const alias='hackverse-40nirmikpersonal-git-feat-b08f1a-nirmikchawale1-4179.vercel.app';
const endpoint='https://api.vercel.com/v13/deployments/'+encodeURIComponent(alias)+'?teamId='+encodeURIComponent(team);
let found=null;
for(let i=0;i<18;i++){
  const r=await fetch(endpoint,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error('Vercel metadata HTTP '+r.status);
  const d=await r.json();
  if ((d.projectId??d.project?.id)!==project) throw new Error('Incorrect Vercel project.');
  if(d.target==='production') throw new Error('Production deployment is forbidden in B-04.');
  if(d.meta?.githubCommitRef!=='feat/unlockplan-app-deploy') throw new Error('Incorrect source branch.');
  if(d.meta?.githubCommitSha===expected && (d.readyState==='READY'||d.state==='READY')) {found=d;break;}
  if(d.meta?.githubCommitSha===expected&&(d.readyState==='ERROR'||d.state==='ERROR')) throw new Error('Exact SHA build failed.');
  if(i<17) await new Promise(resolve=>setTimeout(resolve,10000));
}
if(!found) throw new Error('Exact SHA preview was not READY within bounded polling window.');
const target=new URL('https://'+found.url);
if(target.protocol!=='https:'||!target.hostname.endsWith('.vercel.app')||target.pathname!=='/'||target.search)
  throw new Error('Invalid immutable deployed URL.');
if(!process.env.GITHUB_ENV) throw new Error('Missing GitHub Actions environment file.');
appendFileSync(process.env.GITHUB_ENV,'B04_PREVIEW_URL='+target.origin+'\n');
console.log('B-04 deployment:',found.id,'HEAD:',expected,'environment: preview');
