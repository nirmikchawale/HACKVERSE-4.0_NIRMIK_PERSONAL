/**
 * Public, read-only release gate; never sends credentials or synthetic climate.
 * Waits for Cloudflare's own newly built Preview and checks exact Git revision.
 * Runs on GitHub Actions, not inside the cloud runtime or user browser.
 */
const base=(process.env.EDGE_URL||'').replace(/\/$/,'');
const sha=process.env.EXPECTED_SHA||'';
if(!/^https:\/\/[^/]+\.workers\.dev$/.test(base))throw Error('A real HTTPS Cloudflare preview URL is required');
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Missing exact 40-hex Git commit');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let last='Not contacted';
for(let i=0;i<36;i++){
 try{
  const res=await fetch(base+'/_release.json?sha='+sha.slice(0,12),{
    cache:'no-store',headers:{'Accept':'application/json'},
    signal:AbortSignal.timeout(12000)
  });
  if(!res.ok){last='Release receipt HTTP '+res.status;}
  else {
   const result=await res.json();
   if(result?.git_commit_sha!==sha){
     last='Preview SHA mismatch: '+String(result?.git_commit_sha||'missing').slice(0,40);
   } else {
     const health=await fetch(base+'/api/health',{
       cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)
     });
     const data=health.ok?await health.json():null;
     if(health.ok&&data?.ok===true){
       console.log(JSON.stringify({gate:'PUBLIC_READY',sha,host:base,health:'ok'}));
       process.exit(0);
     }
     last='API health '+health.status;
   }
  }
 }catch(e){last='Transport '+String(e?.name||'Error');}
 if(i%6===0)console.log('Preview poll '+(i+1)+'/36: '+last);
 if(i<35)await sleep(10000);
}
console.error('PUBLIC_GATE_FAILED '+last+'; last certified SHA not served by preview');
process.exit(1);
