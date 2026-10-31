'use strict';
const $ = (s) => document.querySelector(s);
const escapeHTML = (s) => String(s??'').replace(/[&<>"']/g, x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const changes = [
 {id:'A',type:'add_capacity',value:null,unit:'handling_unit',resource_id:'optional-cover-A',availability:'unknown',confirmation_state:'unknown',cost:null,enabled:false,title:'A · Additional handling capacity',description:'Enter user-reported capacity; independently confirm the resource'},
 {id:'B',type:'add_capacity',value:null,unit:'handling_unit',resource_id:'optional-cover-B',availability:'unknown',confirmation_state:'unknown',cost:null,enabled:false,title:'B · Another capacity option',description:'Enter capacity in the same handling units; do not duplicate resource A'},
 {id:'C',type:'reduce_target',value:null,unit:'handling_unit',resource_id:null,availability:'unknown',confirmation_state:'unknown',cost:null,enabled:false,title:'C · Reduce this action’s target',description:'Explicitly changes objective; remainder must be disclosed'},
 {id:'D',type:'add_capacity',value:null,unit:'handling_unit',resource_id:'requested-cover-D',availability:'unknown',confirmation_state:'requested',cost:null,enabled:false,title:'D · Requested capacity (not confirmed)',description:'Enter requested amount; excluded until genuinely confirmed'},
];
let latestEvaluation=null;let lastWeather=null;let selectedIds=null;
const status = (el,txt,kind) => {el.textContent=txt;el.className='status status-'+kind};
const statusCls=s=>s==='feasible'?'good':s==='unknown'?'unknown':s==='blocked'?'bad':'loading';
const localIST = dt => {
 const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(dt);
 const f=n=>parts.find(p=>p.type===n)?.value;
 return `${f('year')}-${f('month')}-${f('day')}T${f('hour')}:${f('minute')}`;
};
const istOffset = s=>s?`${s}:00+05:30`:null;
function initDeadline(){ $('#deadline').value=''; }
function renderChanges(){
 $('#change-list').innerHTML=changes.map((c,i)=>`<div class="change-row">
   <label aria-label="Permit change ${escapeHTML(c.id)}"><input data-index="${i}" data-attr="enabled" type="checkbox" ${c.enabled?'checked':''}/></label>
   <div><div class="ch-title">${escapeHTML(c.title)}</div><div class="ch-desc">${escapeHTML(c.description)}</div></div>
   <div class="sel-field"><span class="mini-label">Change units</span><input class="change-amount" type="number" min="0" step="1" aria-label="Change amount for ${c.id}" data-index="${i}" data-attr="value" value="${c.value??''}"/></div>
   <div class="sel-field"><span class="mini-label">Availability</span><select aria-label="Availability for ${c.id}" data-index="${i}" data-attr="availability">${['available','unavailable','unknown'].map(v=>`<option value="${v}" ${c.availability===v?'selected':''}>${v}</option>`).join('')}</select></div>
   <div class="sel-field"><span class="mini-label">Confirmation</span><select aria-label="Confirmation for ${c.id}" data-index="${i}" data-attr="confirmation_state">${['confirmed','requested','unknown'].map(v=>`<option value="${v}" ${c.confirmation_state===v?'selected':''}>${v}</option>`).join('')}</select></div>
 </div>`).join('');
 $('#change-list').addEventListener('change',e=>{
   const node=e.target;if(!('index' in node.dataset))return;
   const c=changes[Number(node.dataset.index)];c[node.dataset.attr]=node.type==='checkbox'?node.checked:(node.type==='number'?(node.value===''?null:Number(node.value)):node.value);
   latestEvaluation=null;selectedIds=null;$('#selection-content').innerHTML='<div class="empty-state compact">Inputs changed. Re-evaluate before selecting a package.</div>';
 });
}
async function forecast(force=false){
 const btn=$('#refresh-forecast');btn.disabled=true;status($('#forecast-status'),'Connecting…','loading');
 $('#weather-message').textContent='Checking the public forecast source; synthetic data is never substituted for live weather.';
 try {
   const response=await fetch('/api/forecast'+(force?'?refresh=true':''),{cache:'no-store'});
   if(!response.ok)throw new Error('Forecast endpoint HTTP '+response.status);
   const data=await response.json();lastWeather=data;
   const kind=data.status==='retrieved_live'?'good':data.status==='cached_recent'?'unknown':'bad';
   const labels={retrieved_live:'Retrieved live',cached_recent:'Actual data · recent cache',stale_cache:'Stale cache',unavailable:'Unavailable'};
   status($('#forecast-status'),labels[data.status]||data.status,kind);
   $('#weather-message').textContent=data.status==='unavailable'?'No authentic forecast available. Continue only as a resource-planning sandbox.':
       data.status==='stale_cache'?'Cached authentic forecast is stale. Do not treat as current climate advice.':
       data.validated?.positive_precipitation_hours===0 && data.validated?.missing_precipitation===0?'No positive hourly modeled precipitation in the retrieved window. No rain alert inferred.':
       'Public model forecast retrieved. Choose your own planning deadline; no automatic safety threshold is applied.';
   const details=[];
   if(data.retrieved_at_utc)details.push('Retrieved '+new Date(data.retrieved_at_utc).toLocaleString());
   if(data.error)details.push('Fetch issue: '+data.error);
   details.push('Jalna approximate 19.84°N, 75.89°E · Asia/Kolkata');
   $('#weather-meta').textContent=details.join(' · ');
   const hours=(data.hours||[]).filter(h=>h.precipitation_mm!==null).slice(0,12);
   $('#weather-hours').innerHTML=hours.map(h=>`<div class="hour-card"><div class="clock">${escapeHTML(h.time.replace('T',' '))} IST</div><strong>${escapeHTML(h.precipitation_mm)} mm</strong><small>Precip. probability ${h.precipitation_probability_pct===null?'unknown':escapeHTML(h.precipitation_probability_pct)+'%'}</small><button type="button" class="weather-select" data-forecast-time="${escapeHTML(h.time)}">Use this hour as candidate deadline</button></div>`).join('');
   if(data.status==='unavailable'||data.status==='stale_cache')$('#weather-hours').innerHTML='';
 } catch(err){lastWeather=null;status($('#forecast-status'),'Unavailable','bad');$('#weather-message').textContent='Forecast integration unavailable; no synthetic response presented as live.';$('#weather-meta').textContent=String(err);$('#weather-hours').innerHTML='';}
 finally{btn.disabled=false;}
}
function num(id){const el=$('#'+id);if(!el.value.trim())throw new Error(id+' is required.');const n=Number(el.value);if(!Number.isFinite(n)||n<0)throw new Error(id+' must be a finite nonnegative number.');return n;}
function currentCase(){
 if(!$('#deadline').value)throw new Error('Enter your own candidate preparation deadline.');
 if(!$('#input-confirm').checked)throw new Error('Confirm that quantities are user-reported and comparable before evaluation.');
 return {target_units:num('target'),capacity_units:num('capacity'),required_hours:num('hours'),unit:'handling_unit',readiness:$('#readiness').value,
 baseline_resource_ids:$('#baseline-resources').value.split(',').map(x=>x.trim()).filter(Boolean),
 deadline:istOffset($('#deadline').value),now:new Date().toISOString(),completed:false,
 changes:changes.filter(c=>c.enabled).map(({title,description,enabled,...other})=>({...other}))};
}
function paintConstraints(constraints){return `<div class="rule-list">${constraints.map(r=>`<div class="rule-row"><span class="tag">${r.status==='pass'?'✓':r.status==='unknown'?'?':'×'} ${escapeHTML(r.id)}</span><div><p>${escapeHTML(r.explanation)}</p><small class="muted">Source: ${escapeHTML(r.provenance)}</small></div></div>`).join('')}</div>`}
function updateSummary(pkg){
 if(!latestEvaluation)return;
 const r=latestEvaluation;const c=r.baseline;
 let body='<div class="summary-note"><strong>Conditional planning summary</strong><p>Decision: prepare protected handling of already-picked cotton. This document does not authorize, acquire, or execute resources.</p></div>';
 if(pkg){body+=`<div class="summary-grid"><div><span>Selected changes</span><strong>${escapeHTML(pkg.change_ids.join(' + '))}</strong></div><div><span>Projected remaining shortfall</span><strong>${pkg.projected.shortfall_units} units</strong></div><div><span>Original target not covered by this action</span><strong>${pkg.projected.original_target_unhandled_units} units</strong></div><div><span>Current weather evidence</span><strong style="font-size:12px">${escapeHTML(lastWeather?.status||'unavailable')}</strong></div></div>`;
 }else{body+='<p class="footnote">No change package selected. Baseline status: '+escapeHTML(r.status)+'.</p>'}
 body+='<div class="banner safety"><strong>Action is NOT confirmed complete.</strong> All figures are abstract. Resources must be independently confirmed at execution, and handling-location suitability requires local review.</div>';
 $('#selection-content').innerHTML=body;
}
function renderResult(r){
 status($('#result-status'),r.status.toUpperCase(),statusCls(r.status));
 let lead=r.status==='feasible'?'Feasible under declared assumptions':r.status==='blocked'?'The original plan has blockers':r.status==='unknown'?'Required evidence is missing':'The action has been completed';
 let html=`<div class="assessment-intro"><span class="big">${r.status==='feasible'?'✓':r.status==='blocked'?'!':r.status==='unknown'?'?':'✓'}</span><div><strong>${escapeHTML(lead)}</strong><p>${escapeHTML(r.message)}</p></div></div>`;
 html+=paintConstraints(r.baseline.constraints);
 if(r.packages.length){html+=`<div class="package-title">${r.packages.length} inclusion-minimal conditional package${r.packages.length!==1?'s':''}</div>`;
  for(const pkg of r.packages){html+=`<div class="package"><div><strong>{${escapeHTML(pkg.change_ids.join(', '))}}</strong><p>Projected capacity ${pkg.projected.projected_capacity_units} / revised target ${pkg.projected.projected_target_units} abstract units${pkg.objective_changed?`; ${pkg.projected.original_target_unhandled_units} original units left outside this action`:''}.</p><p>Not cheapest or globally optimal; availability is not completion.</p></div><button class="choose" data-ids="${escapeHTML(pkg.change_ids.join(','))}">Select option →</button></div>`;}}
 else if(r.status==='blocked')html+='<div class="banner safety"><strong>No feasible package under the currently confirmed options.</strong> Do not assume missing resources can be obtained.</div>';
 if(r.excluded_changes?.length)html+=`<p class="footnote">Excluded from packages: ${escapeHTML(r.excluded_changes.map(c=>c.id+' ('+c.confirmation_state+')').join(', '))}. Unconfirmed/requested changes do not count.</p>`;
 html+='<p class="footnote">All feasibility is conditional on declared assumptions. A feasible plan is not proof of effective cotton protection or safe storage.</p>';
 $('#result-content').innerHTML=html;
 document.querySelectorAll('.choose').forEach(btn=>btn.addEventListener('click',()=>{
  const ids=btn.dataset.ids.split(',');selectedIds=ids;
  const pkg=r.packages.find(p=>p.change_ids.join(',')===ids.join(','));updateSummary(pkg);
  $('#summary').scrollIntoView({behavior:'smooth',block:'start'});
 }));
 updateSummary(null);
}
async function evaluatePlan(){
 const btn=$('#evaluate');$('#error').hidden=true;try{
   const request=currentCase();btn.disabled=true;btn.textContent='Evaluating…';
   const resp=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
   const data=await resp.json();if(!resp.ok)throw new Error(data.detail||('HTTP '+resp.status));
   latestEvaluation=data;renderResult(data);$('#results').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){$('#error').hidden=false;$('#error').textContent=err.message||String(err);}
 finally{btn.disabled=false;btn.innerHTML='Evaluate feasibility <span aria-hidden="true">→</span>';}
}
async function loadSources(){
 try{const r=await fetch('/api/sources');const d=await r.json();$('#source-list').innerHTML=d.sources.map(s=>`<div class="source-card"><strong>${escapeHTML(s.title)}</strong><p>${escapeHTML(s.short_supported_statement)}</p><p>Scope: ${escapeHTML(s.limitations)}</p><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">Read source ↗</a></div>`).join('');}
 catch(_){$('#source-list').textContent='Source register temporarily unavailable. See README and the original public sources.';}
}
function wire(){
 initDeadline();renderChanges();$('#refresh-forecast').addEventListener('click',()=>forecast(true));
 $('#weather-hours').addEventListener('click',e=>{
  const b=e.target.closest('button[data-forecast-time]'); if(!b)return;
  $('#deadline').value=b.dataset.forecastTime.slice(0,16);
  latestEvaluation=null; selectedIds=null;
  $('#selection-content').innerHTML='<div class="empty-state compact">Candidate deadline changed from a real forecast hour. Re-evaluate before selecting.</div>';
  $('#weather-message').textContent='User selected a forecast hour as a candidate planning deadline. This is not an agronomic safety threshold or an exact rain onset.';
 });
 $('#evaluate').addEventListener('click',evaluatePlan);
 for(const id of ['target','capacity'])$('#'+id).addEventListener('change',()=>$('#origin-'+id).textContent='User-reported');
 forecast(true);loadSources();
}
wire();
