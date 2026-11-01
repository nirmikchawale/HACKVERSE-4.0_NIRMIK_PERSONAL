/** Verify a *deployed* Cloudflare release rather than a GitHub source commit.
 * No user declarations, fabricated weather, credentials or destructive actions.
 */
const base=(process.env.EDGE_URL||'').replace(/\/$/,'');
const expected=process.env.EXPECTED_SHA||'';
if (!/^https:\/\/[a-zA-Z0-9.-]+\.workers\.dev$/.test(base)) throw Error('Expected public Cloudflare workers.dev URL.');
if (!/^[a-f0-9]{40}$/.test(expected)) throw Error('Expected an exact Git commit SHA.');
const get=async path=>{
 const resp=await fetch(base+path,{cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(16000)});
 const type=resp.headers.get('content-type')||'';
 const body=await resp.text();
 if (!resp.ok || !type.includes('application/json'))
   throw Error(path+' HTTP '+resp.status+' content-type '+type+' excerpt '+body.replace(/\s+/g,' ').slice(0,130));
 try {return JSON.parse(body);} catch {throw Error(path+' not valid JSON');}
};
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const run=async()=>{
 const receipt=await get('/_release.json');
 assert(receipt.git_commit_sha===expected,'DEPLOYED_SHA_MISMATCH: '+receipt.git_commit_sha+' != '+expected);
 const snapshot=await get('/feasibility-examples-snapshot.json');
 assert(snapshot.snapshot_source_sha===expected,'SNAPSHOT_SHA_MISMATCH: '+snapshot.snapshot_source_sha);
 assert(snapshot.catalog_source==='prebuilt_python_engine_snapshot','Build-time source is not Python-certified');
 assert(snapshot.count===100&&snapshot.records?.length===100,'100-case static snapshot not served');
 assert(snapshot.records.every(r=>r.input_kind==='configured_example_not_farm_observation'),'Teaching-source label missing');
 assert(new Set(snapshot.records.map(r=>r.id)).size===100,'Duplicate IDs');
 const health=await get('/api/health');
 assert(health.ok===true,'Cloudflare FastAPI health not confirmed');
 const catalog=await get('/api/feasibility-scenarios');
 assert(catalog.count===100&&catalog.records?.length===100,'Live Python catalog not available');
 assert(catalog.data_kind==='illustrative_planning_cases','Live catalog provenance missing');
 const historical=await get('/api/government-climate');
 assert(['retrieved_live','cached_recent','unavailable'].includes(historical.status),'Government status invalid');
 assert(Array.isArray(historical.days),'Government days not an array');
 if(historical.status==='unavailable')assert(historical.days.length===0,'Government missingness was fabricated');
 else assert(historical.data_kind==='government_gridded_historical'&&historical.days.length<=20&&historical.days.length>0,
 'Government data must be source-native at most 20 dates');
 console.log(JSON.stringify({certificate:'PASS',url:base,sha:expected,assets:'100 verified Python teaching cases',
  live_api:'healthy / 100 results',government_source_status:historical.status,government_day_count:historical.days.length,
  farmer_input_modified:false,synthetic_weather_generated:false},null,2));
};
run().catch(e=>{console.error('CLOUDFLARE_HOSTED_CERT_FAILED '+String(e));process.exitCode=1;});
