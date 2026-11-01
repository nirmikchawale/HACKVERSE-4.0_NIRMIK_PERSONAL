/** Read-only external Cloudflare diagnosis; no credentials, farm inputs, or fabricated values. */
const hosts=[
  'https://f8508b30-agri-foresight.nirmikchawale1.workers.dev',
  'https://migration-cloudflare-typography-01-agri-foresight.nirmikchawale1.workers.dev'
];
const paths=['/_release.json','/api/health','/api/feasibility-scenarios','/api/government-climate','/feasibility-explorer.js'];
for(const host of hosts){
  console.log('HOST '+host);
  for(const path of paths){
    try{
      const start=Date.now();
      const reply=await fetch(host+path,{headers:{Accept:'application/json,text/plain,*/*'},cache:'no-store',signal:AbortSignal.timeout(10000)});
      const body=await reply.text();
      const isHtml=body.startsWith('<!DOCTYPE')||body.startsWith('<html');
      const example=path==='/api/feasibility-scenarios'&&reply.ok&&!isHtml
        ? (()=>{try{const d=JSON.parse(body);return 'count='+d.count+',kind='+d.data_kind;}catch{return 'invalid JSON';}})()
        : body.replace(/\s+/g,' ').slice(0,190);
      console.log(JSON.stringify({path,status:reply.status,type:reply.headers.get('content-type'),
        ray:reply.headers.get('cf-ray'),elapsed_ms:Date.now()-start,html:isHtml,snippet:example}));
    }catch(error){
      console.log(JSON.stringify({path,network_error:error?.name||'TransportError',message:String(error?.message||'').slice(0,110)}));
    }
  }
}
console.log('Diagnostic is read-only: failures are evidence, not waived release gates.');
