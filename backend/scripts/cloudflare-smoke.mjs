// Local Cloudflare Pyodide smoke only. Artificial farm declarations stay in CI.
// All provider data, if available, are fetched from real upstream endpoints.
const origin=process.env.EDGE_URL||'http://127.0.0.1:8787';

async function get(path){
  const res=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});
  const text=await res.text();
  if(!res.ok)throw Error('GET '+path+' returned '+res.status+' '+text.slice(0,150));
  return {status:res.status,text};
}
async function post(path,data){
  const res=await fetch(origin+path,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data),signal:AbortSignal.timeout(20000)
  });
  return {status:res.status,body:await res.json()};
}
const caseData={
  now:'2026-11-01T09:00:00+00:00',
  deadline:'2099-01-01T12:00:00+05:30',
  target_units:10,capacity_units:6,required_hours:1,readiness:'yes',
  unit:'handling_unit',completed:false,baseline_resource_ids:[],changes:[]
};
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const run=async()=>{
 const h=JSON.parse((await get('/api/health')).text);
 assert(h.ok===true,'Worker real health not okay');
 const html=(await get('/')).text;
 assert(html.includes('Agri Foresight')&&html.includes('/connected.js'),
   'Six-page HTML and typography asset must be present');
 const release=JSON.parse((await get('/_release.json')).text);
 assert(/^[a-f0-9]{40}$/.test(release.git_commit_sha), 'Deployment revision must be actual 40-char Git SHA');
 assert(release.app==='Agri Foresight' && release.generated_from==='git', 'Release provenance invalid');
 if(process.env.EXPECTED_SHA)assert(release.git_commit_sha===process.env.EXPECTED_SHA,
   'DEPLOYMENT_MISMATCH: live revision '+release.git_commit_sha+
   ' is not certified commit '+process.env.EXPECTED_SHA);
 const stylesheet=(await get('/model-evidence.css')).text;
 assert(stylesheet.length>20,'Main UI evidence stylesheet missing');
 const api=JSON.parse((await get('/api/sources')).text);
 assert(api.sources.some(x=>x.id==='nasa_power_agroclimate'),'Official NASA source missing');
 const e=await post('/api/evaluate',caseData);
 assert(e.status===200&&e.body.status==='blocked','Genuine Python engine failed blocked case');
 assert(e.body.baseline.shortfall_units===4,'Genuine Python engine changed capacity arithmetic');
 const c=await post('/api/compare',{before:caseData,after:{...caseData,capacity_units:10}});
 assert(c.status===200&&c.body.changes.status_after==='feasible','Python comparison contract changed');
 const invalid=await post('/api/evaluate',{...caseData,target_units:-1});
 assert(invalid.status===422,'Invalid plan was not rejected');
 const badReplan=await post('/api/replan',{
  before:caseData,after:caseData,selected_hour_local:'bad'
 });
 assert(badReplan.status===422,'Malformed forecast hour was not rejected');
 const [f,n]=await Promise.all([
   get('/api/forecast').then(x=>JSON.parse(x.text)),
   get('/api/government-climate').then(x=>JSON.parse(x.text))
 ]);
 assert(['retrieved_live','cached_recent','unavailable'].includes(f.status),'Forecast status invalid');
 assert(['retrieved_live','cached_recent','unavailable'].includes(n.status),'NASA status invalid');
 assert(f.status!=='unavailable'||f.hours.length===0,'Fabricated forecast data returned');
 assert(n.status!=='unavailable'||n.days.length===0,'Fabricated government data returned');
 assert(n.status==='unavailable'||n.data_kind==='government_gridded_historical','NASA provenance missing');
 if(process.env.REQUIRE_LIVE_CLIMATE==='1'){
   assert(['retrieved_live','cached_recent'].includes(f.status),
     'PUBLIC_GATE: verified Open-Meteo future model is not available');
   assert(['retrieved_live','cached_recent'].includes(n.status) && n.days.length>0,
     'PUBLIC_GATE: verified NASA POWER historical government data is not available');
 }
 console.log(JSON.stringify({result:'PASS',host:'local Cloudflare Python Worker',forms:'real FastAPI',
   forecast:f.status,forecast_error_type:f.status==='unavailable'?f.error:null,forecast_error_stage:f.status==='unavailable'?f.error_stage:null,forecast_notice:f.notice,government:n.status,government_days:n.days.length,synthetic_live_data:false}));
};
run().catch(error=>{console.error('MIGRATION_SMOKE_FAIL '+String(error));process.exitCode=1});
