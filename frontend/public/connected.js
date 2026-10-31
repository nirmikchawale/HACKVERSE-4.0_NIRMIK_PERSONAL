/* Agri Foresight unified six-screen runtime. Uses only source-labelled FastAPI responses.
   No simulated weather, crop-safety thresholds, fabricated farmer data or AI claims. */
(() => {
  "use strict";
  const live={forecast:null,sources:null,health:null,evaluation:null,request:null,comparison:null,replan:null,selectedHour:null,selectedPackage:null,forecastLoading:false,error:null};
  const here=id=>document.getElementById(id);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
  const num=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-IN',{maximumFractionDigits:2}):'Unknown';
  const okLocation=()=>state.place?.state==='Maharashtra'&&state.place?.city?.trim().toLowerCase()==='jalna';
  const statuses=['feasible','blocked','unknown','completed'];
  let previousPlace=state.place.city+'|'+state.place.state;
  const ledger=el('section','live-ledger');
  ledger.id='sourceLedger';
  ledger.setAttribute('aria-label','Verified source ledger');
  document.querySelectorAll('section.section')[5].append(ledger);
  const title=el('h2','', 'Live source ledger');ledger.append(title);
  ledger.append(el('p','', 'Source descriptions are returned by /api/sources. Model output is a forecast, not a measured rain-onset time or safety certification.'));
  const entries=el('div','live-sources','Source registry: connecting…');ledger.append(entries);
  const alert=el('p','live-note','Loading real source and application status…');
  alert.id='apiConnectionStatus';alert.setAttribute('role','status');
  document.querySelectorAll('section.section')[0].append(alert);

  async function json(path,init={}){
    let response;
    try{response=await fetch(path,{...init,headers:{'Accept':'application/json',...(init.headers||{})},cache:'no-store',signal:AbortSignal.timeout(16000)});}
    catch{throw new Error('Backend unreachable. No verified result can be shown.');}
    if(!(response.headers.get('content-type')||'').includes('application/json'))throw new Error('Backend returned an unexpected response.');
    let data;try{data=await response.json();}catch{throw new Error('Backend response was not valid JSON.');}
    if(!response.ok)throw new Error(typeof data?.detail==='string'?data.detail:'Backend HTTP '+response.status);
    return data;
  }
  function validForecast(f){
    if(!f||!['retrieved_live','cached_recent','stale_cache','unavailable'].includes(f.status)||!Array.isArray(f.hours))throw new Error('Forecast schema not recognized.');
    if(f.status==='retrieved_live'||f.status==='cached_recent'){
      if(f.validated?.timezone!=='Asia/Kolkata'||f.validated?.units?.precipitation!=='mm'||f.validated?.units?.precipitation_probability!=='%'||!Date.parse(f.retrieved_at_utc||''))throw new Error('Forecast metadata not validated.');
    }
    if(!f.hours.every(h=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(h.time||'')&&(h.precipitation_mm===null||(Number.isFinite(h.precipitation_mm)&&h.precipitation_mm>=0))&&(h.precipitation_probability_pct===null||(Number.isFinite(h.precipitation_probability_pct)&&h.precipitation_probability_pct>=0&&h.precipitation_probability_pct<=100))))throw new Error('Forecast hours invalid.');
    return f;
  }
  const isCurrent=()=>okLocation()&&['retrieved_live','cached_recent'].includes(live.forecast?.status);
  async function boot(){
    try {
      const [health,sources]=await Promise.all([json('/api/health'),json('/api/sources')]);
      if(health?.ok!==true||!Array.isArray(sources?.sources)||!Array.isArray(sources?.input_categories))throw new Error('Backend returned invalid health or source registry metadata.');
      live.health=health;live.sources=sources;
      alert.textContent='FastAPI connected · '+health.version+' · '+health.disclaimer;
      entries.replaceChildren();
      for(const s of sources.sources){if(typeof s.title!=='string'||typeof s.url!=='string'||!/^https:\/\//.test(s.url))continue;
        const article=el('article','source-entry');const a=el('a','',s.title);a.href=s.url;a.rel='noopener noreferrer';a.target='_blank';article.append(a,el('p','',s.short_supported_statement||''),el('small','',s.limitations||''));entries.append(article);}
      if(!entries.children.length)entries.textContent='No validated source entries returned.';
      await refreshForecast(false);
    } catch(e){live.forecast=null;alert.textContent=e.message;entries.textContent='Source registry unavailable. No source evidence can be assumed.';renderWeather();}
  }
  function clearResult(){
    live.error=null;live.evaluation=null;live.request=null;live.comparison=null;live.replan=null;live.selectedPackage=null;
  }
  const oldNote=noteChange;
  noteChange=function(){clearResult();oldNote();};
  const oldSummaries=updateSummaries;
  updateSummaries=function(){
    const place=state.place.city+'|'+state.place.state;
    if(previousPlace!==place){previousPlace=place;live.forecast=null;live.selectedHour=null;clearResult();}
    oldSummaries();
    here('weatherValue').textContent=live.forecast?(isCurrent()?'Model forecast '+(live.forecast.hours.length)+' h':live.forecast.status.toUpperCase()):'No verified forecast';
  };
  updateWeatherUI=renderWeather;
  function renderWeather(){
    const chart=here('weatherChart'),mode=here('weatherChartMode'),chip=here('forecastSourceChip');
    chart.replaceChildren();here('toggleForecast').textContent='Refresh live forecast';here('clearForecast').textContent='Clear forecast view';
    if(!okLocation()){chip.textContent='UNSUPPORTED LOCATION';mode.textContent='Jalna-only data coverage';chart.append(el('div','weather-empty','Forecast for this location is not supported. Return to Jalna, Maharashtra; no other-location data is fabricated.'));here('weatherValue').textContent='Unsupported';return;}
    const f=live.forecast;
    if(!f){chip.textContent='NOT CONNECTED';mode.textContent='No authenticated model forecast';chart.append(el('div','weather-empty','No real forecast is loaded. Use Refresh live forecast to request Open-Meteo through the backend.'));here('weatherValue').textContent='Not loaded';return;}
    if(!isCurrent()){
      chip.textContent=f.status==='stale_cache'?'STALE · DO NOT USE':'UNAVAILABLE';
      mode.textContent=f.notice||f.error||'No current verified forecast available';
      chart.append(el('div','weather-empty','No current forecast hours can be selected. Manual deadlines remain possible.'));
      here('weatherValue').textContent=f.status;return;
    }
    chip.textContent=f.status==='retrieved_live'?'LIVE MODEL FORECAST':'RECENT VERIFIED CACHE';
    mode.textContent='Open-Meteo • '+(f.hours.length)+' model hours • precipitation (mm), probability (%) • IST';
    const provenance=el('p','live-provenance','Retrieved '+f.retrieved_at_utc+' · age '+num(f.forecast_age_hours)+' h · '+(f.attribution||'Open-Meteo')+'. Model output, not observed rain or safe crop timing.');
    chart.append(provenance);
    const bars=el('div','weather-bars');
    const sample=f.hours.slice(0,24);
    const max=Math.max(0.1,...sample.map(h=>h.precipitation_mm??0));
    for(const h of sample){
      const b=el('button','hour-bar');b.type='button';b.dataset.time=h.time;b.setAttribute('aria-label','Use '+h.time+' IST model hour as proposed deadline');
      b.title=h.time+' IST • '+(h.precipitation_mm===null?'Unknown':h.precipitation_mm+' mm')+' • '+(h.precipitation_probability_pct===null?'Unknown':h.precipitation_probability_pct+'%')+' probability';
      const time=el('span','bar-time',h.time.slice(11));const fill=el('span','bar-fill');fill.style.height=Math.max(5,Math.round(95*(h.precipitation_mm??0)/max))+'%';
      const value=el('span','bar-value',(h.precipitation_mm??'—')+' mm');const chance=el('small','',h.precipitation_probability_pct===null?'Probability unknown':h.precipitation_probability_pct+'%');
      b.append(time,fill,value,chance);b.addEventListener('click',()=>{
        here('deadlineInput').value=h.time;live.selectedHour=h.time;additional.deadlineSource='model';
        here('deadlineOriginPreview').textContent='Candidate hour chosen from verified Open-Meteo forecast; not a rain-onset threshold.';
        here('deadlineNotice').textContent='Model hour chosen. Click Save candidate deadline to apply it.';
      });bars.append(b);
    }
    chart.append(bars);
    if(f.hours.length>24)chart.append(el('small','', 'Showing the first 24 of '+f.hours.length+' forecast hours.'));
    here('weatherValue').textContent=f.status==='retrieved_live'?'Latest model forecast':'Recent model cache';
  }
  async function refreshForecast(refresh){
    if(live.forecastLoading)return;
    live.forecastLoading=true;
    here('toggleForecast').disabled=true;here('forecastSourceChip').textContent='FETCHING';
    try {
      if(!okLocation())throw new Error('Only Jalna is supported by the current forecast service.');
      live.forecast=validForecast(await json('/api/forecast'+(refresh?'?refresh=true':'')));
      live.selectedHour=null;
    } catch(e){live.forecast=null;here('deadlineNotice').textContent=e.message;}
    finally{live.forecastLoading=false;here('toggleForecast').disabled=false;renderWeather();}
  }
  here('toggleForecast').addEventListener('click',e=>{e.stopImmediatePropagation();refreshForecast(true);},true);
  here('clearForecast').addEventListener('click',e=>{e.stopImmediatePropagation();live.forecast=null;live.selectedHour=null;renderWeather();},true);
  here('deadlineInput').addEventListener('input',()=>{live.selectedHour=null;clearResult();renderAssessment();renderPackages();renderSummary();},true);
  // The original editor rebuilt every input on change, destroying still-focused
  // controls before the next value had been committed. Keep active rows mounted.
  const buildChangeRows=renderChangeEditor;
  renderChangeEditor=function(){
    const visibleRows=here('changeEditor').querySelectorAll('.change-row').length;
    if(visibleRows>0&&visibleRows===additional.changes.length)return;
    buildChangeRows();
  };
  const oldResourceUpdate=updateResourceUI;
  updateResourceUI=function(){additional.demoInputs=false;oldResourceUpdate();here('demoDataBanner').style.display='none';};
  here('loadDemoInputs')?.remove();
  here('runAssessment').textContent='Evaluate using FastAPI';
  here('resetAssessment').textContent='Clear assessment';
  here('runAssessment').addEventListener('click',async e=>{e.stopImmediatePropagation();await assess();},true);
  here('resetAssessment').addEventListener('click',e=>{e.stopImmediatePropagation();clearResult();renderAssessment();renderPackages();renderSummary();},true);
  for(const id of ['quantity','capacity','duration','readiness','baseline','confirmInputs']){
    here(id).addEventListener('input',()=>{clearResult();renderAssessment();renderPackages();renderSummary();},true);
  }
  // Update optional resource draft on every input, not only change/blur.
  // The legacy editor re-renders on change, so waiting until blur can lose
  // values typed immediately before pressing another control.
  here('changeEditor').addEventListener('input',event=>{
    const node=event.target, row=node?.closest?.('.change-row'), key=node?.dataset?.x;
    if(!row||!key)return;
    const index=Array.from(here('changeEditor').querySelectorAll('.change-row')).indexOf(row);
    if(index<0||!additional.changes[index])return;
    additional.changes[index][key==='rid'?'rid':key]=node.value;
    saveExtra();clearResult();renderAssessment();renderPackages();renderSummary();
  },true);
  here('changeEditor').addEventListener('change',()=>{clearResult();renderAssessment();renderPackages();renderSummary();},true);
  function requestFromForm(){
    if(!okLocation())throw new Error('The server-authoritative assessment currently supports Jalna, Maharashtra only.');
    if(here('deadlineInput').value!==state.deadline)throw new Error('Save the displayed candidate deadline before evaluating.');
    if(!state.deadline||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(state.deadline))throw new Error('Save a valid candidate deadline on Page 02.');
    if(!here('confirmInputs').checked)throw new Error('Confirm farmer-reported, comparable quantities on Page 03.');
    const toNum=(id,title)=>{const raw=here(id).value;if(raw.trim()==='')throw new Error(title+' is required.');const n=Number(raw);if(!Number.isFinite(n)||n<0)throw new Error(title+' must be nonnegative and finite.');return n;};
    const target=toNum('quantity','Planned work'),capacity=toNum('capacity','Confirmed capacity'),hours=toNum('duration','Required hours');
    const baseline=here('baseline').value.split(',').map(x=>x.trim()).filter(Boolean);
    if(new Set(baseline).size!==baseline.length)throw new Error('Baseline resource identifiers must be unique.');
    const used=new Set(baseline);
    // Capture the actual currently displayed options at submit time so a
    // pending blur/change event cannot silently discard a typed resource ID.
    const rows=Array.from(here('changeEditor').querySelectorAll('.change-row'));
    if(rows.length!==additional.changes.length)throw new Error('Change editor state is out of sync; review the options.');
    const uiChanges=additional.changes.map((c,i)=>{
      const row=rows[i];
      return {...c,type:row.querySelector('[data-x=type]').value,
        amount:row.querySelector('[data-x=amount]').value,
        rid:row.querySelector('[data-x=rid]').value,
        availability:row.querySelector('[data-x=availability]').value};
    });
    additional.changes=uiChanges;saveExtra();
    const changes=uiChanges.map((c,i)=>{
      const value=Number(c.amount);if(!Number.isFinite(value)||value<=0)throw new Error('Option '+(i+1)+' needs a positive amount.');
      const rid=c.type==='add_capacity'?String(c.rid||'').trim():null;
      if(c.type==='add_capacity'&&!rid)throw new Error('Option '+(i+1)+' requires a unique resource identifier.');
      if(rid&&used.has(rid))throw new Error('Resource '+rid+' is already used in this plan.');if(rid)used.add(rid);
      const phase=c.availability==='confirmed'?'confirmed':c.availability==='requested'?'requested':'unknown';
      return {id:c.id||'option-'+(i+1),type:c.type,value,resource_id:rid,
        availability:phase==='confirmed'?'available':'unknown',confirmation_state:phase,unit:'handling_unit',cost:null};
    });
    state.resources={target,capacity,hours,readiness:here('readiness').value,baseline:here('baseline').value};persist();updateSummaries();
    return {target_units:target,capacity_units:capacity,required_hours:hours,
      unit:'handling_unit',readiness:here('readiness').value,now:new Date().toISOString(),
      deadline:state.deadline+':00+05:30',completed:false,baseline_resource_ids:baseline,changes};
  }
  function validateEvaluation(r){
    if(!r||!statuses.includes(r.status)||!r.baseline||!Array.isArray(r.baseline.constraints)||!Array.isArray(r.packages)||!Array.isArray(r.excluded_changes)||r.unit!=='handling_unit')throw new Error('Server assessment schema invalid.');
    if(!r.baseline.constraints.every(c=>['pass','blocked','unknown'].includes(c.status)&&typeof c.explanation==='string'))throw new Error('Server constraint schema invalid.');
    if(!r.packages.every(p=>Array.isArray(p.change_ids)&&p.projected&&statuses.includes(p.projected.status)))throw new Error('Server change package schema invalid.');
    return r;
  }
  async function assess(){
    if(live.busy)return;
    live.busy=true;const button=here('runAssessment');button.disabled=true;button.textContent='Evaluating…';
    clearResult();
    try {
      const req=requestFromForm();
      const result=validateEvaluation(await json('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}));
      live.request=req;live.evaluation=result;
      here('resourceNotice').textContent='Farmer-reported inputs saved for this session; evaluated by FastAPI. Resources are not independently certified.';
    } catch(e){live.error=e.message;here('resourceNotice').textContent=e.message;here('resultReason').textContent=e.message;}
    finally{live.busy=false;button.disabled=false;button.textContent='Evaluate using FastAPI';renderAssessment();renderPackages();renderSummary();}
  }
  updateAssessmentUI=renderAssessment;
  function renderAssessment(){
    const r=live.evaluation,base=r?.baseline;
    here('resultGoal').textContent=base?num(base.projected_target_units):'—';
    here('resultCap').textContent=base?num(base.projected_capacity_units):'—';
    here('resultGap').textContent=base?num(base.shortfall_units):'—';
    here('resultSlack').textContent=base?(base.time_budget?.time_slack_hours===null?'Unknown':num(base.time_budget.time_slack_hours)+' h'):'—';
    here('resultReadiness').textContent=state.resources?.readiness||'Unknown';
    here('resultHero').dataset.kind=r?.status||'not-evaluated';
    here('resultTitle').textContent=r?'API VERIFIED · '+r.status.toUpperCase():'Not evaluated';
    here('resultReason').textContent=r?r.message:(live.error||'Enter farmer-declared resources and a candidate deadline, then evaluate with the real FastAPI engine.');
    here('engineIndicator').textContent=r?'FASTAPI DETERMINISTIC ENGINE · RESPONSE VERIFIED':'FASTAPI ENGINE · NO RESULT';
    const list=here('constraintList');list.replaceChildren();
    if(!r){list.append(el('div','empty',live.error||'No API assessment yet.'));return;}
    for(const c of base.constraints){
      const row=el('div','constraint-line '+(c.status==='pass'?'':c.status==='blocked'?'problem':'unknown'));
      row.append(el('span','symbol',c.status==='pass'?'✓':c.status==='blocked'?'×':'?'));
      const content=el('div');content.append(el('strong','',c.id+' · '+c.status),el('small','',c.explanation),el('small','', 'Provenance: '+c.provenance));row.append(content);list.append(row);
    }
    for(const rejected of r.excluded_changes){list.append(el('div','live-excluded',rejected.id+': '+rejected.reason));}
  }
  updateChangeUI=renderPackages;
  function renderPackages(){
    const list=here('packageList'),compare=here('comparePanel'),packs=live.evaluation?.packages||[];
    here('packageCount').textContent=packs.length+' backend packages';list.replaceChildren();
    if(!live.evaluation){list.append(el('div','empty','Evaluate your inputs on Page 04 to obtain source-authoritative packages.'));}
    else if(!packs.length)list.append(el('div','empty','The backend returned no eligible minimal change package. Check confirmed resources, readiness, timing and available alternatives.'));
    packs.forEach((p,i)=>{
      const b=el('button','package-card'+(live.selectedPackage===i?' selected':''));
      b.type='button';b.append(el('strong','', 'Package '+(i+1)+' · '+p.change_ids.join(', ')));
      b.append(el('p','',p.projected.status.toUpperCase()+' · capacity '+num(p.projected.projected_capacity_units)+' / target '+num(p.projected.projected_target_units)+' handling units'));
      b.append(el('small','',p.warning||'Conditional package; resource confirmation is not a completed action.'));
      b.addEventListener('click',()=>{live.selectedPackage=i;live.comparison=null;live.replan=null;renderPackages();renderSummary();});list.append(b);
    });
    compare.replaceChildren();
    if(live.selectedPackage===null||!packs[live.selectedPackage]){compare.append(el('p','',packs.length?'Select a package, then use Compare / replan with FastAPI.':'No eligible package selected.'));return;}
    const p=packs[live.selectedPackage],a=live.evaluation.baseline,b=p.projected;
    compare.append(el('h3','', 'Selected conditional package'));
    compare.append(el('p','', 'Before: '+a.status.toUpperCase()+' · '+num(a.projected_capacity_units)+' capacity / '+num(a.projected_target_units)+' target.'));
    compare.append(el('p','', 'Projected: '+b.status.toUpperCase()+' · '+num(b.projected_capacity_units)+' capacity / '+num(b.projected_target_units)+' target.'));
    compare.append(el('p','', 'Original work left unhandled: '+num(b.original_target_unhandled_units)+' handling units. '+p.warning));
    if(live.comparison){compare.append(el('p','live-valid','Backend comparison: '+live.comparison.changes.status_before+' → '+live.comparison.changes.status_after+'. '+live.comparison.interpretation));}
    if(live.replan){compare.append(el('p','live-valid','Server-attested forecast-hour replan: '+live.replan.forecast_selection.selected_hour_local+' IST · '+live.replan.forecast_selection.attribution));}
  }
  here('clearPackage').addEventListener('click',e=>{e.stopImmediatePropagation();live.selectedPackage=null;live.comparison=null;live.replan=null;renderPackages();renderSummary();},true);
  const compareButton=el('button','btn primary','Compare / replan with FastAPI');compareButton.id='compareApi';compareButton.type='button';
  here('comparePanel').parentElement.append(compareButton);
  compareButton.addEventListener('click',async()=>{
    const p=live.evaluation?.packages[live.selectedPackage];
    if(!p||!live.request){here('comparePanel').append(el('p','live-note','Select a backend package first.'));return;}
    compareButton.disabled=true;compareButton.textContent='Calculating…';
    try{
      const before={...live.request,changes:[]};
      const after={...before,capacity_units:p.projected.projected_capacity_units,target_units:p.projected.projected_target_units};
      const response=await json('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({before,after})});
      if(!response?.changes||!response.before?.baseline||!response.after?.baseline)throw new Error('Invalid comparison result.');
      live.comparison=response;live.replan=null;
      if(isCurrent()&&live.selectedHour&&state.deadline===live.selectedHour){
        try{
          const replan=await json('/api/replan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({before,after,selected_hour_local:live.selectedHour})});
          if(!replan?.forecast_selection?.selected_hour_local)throw new Error('Invalid forecast attestation.');
          live.replan=replan;
        }catch(e){here('changeValidation').textContent='Current forecast replan unavailable: '+e.message+'. Manual API comparison remains valid.';}
      }
      renderPackages();renderSummary();
    }catch(e){here('changeValidation').textContent='Comparison unavailable: '+e.message;}
    finally{compareButton.disabled=false;compareButton.textContent='Compare / replan with FastAPI';}
  });
  updateSummaryUI=renderSummary;
  function renderSummary(){
    const r=live.evaluation,b=r?.baseline,p=live.selectedPackage===null?null:r?.packages[live.selectedPackage];
    here('summaryAssessment').textContent=r?'FASTAPI · '+r.status.toUpperCase():'Not evaluated';
    here('summaryOutcome').textContent=r?r.message+' This is a conditional resource-feasibility assessment, not farming safety advice.':'No API-backed assessment has been calculated.';
    here('summaryUnhandled').textContent=p?num(p.projected.original_target_unhandled_units)+' handling units':b?num(b.shortfall_units)+' baseline shortfall':'Unknown';
    here('summaryChanges').textContent=p?p.change_ids.join(', '):'None selected';
    here('summaryChecklist').replaceChildren();
    addCheck('Candidate deadline explicitly selected',!!state.deadline);
    addCheck('Farmer input confirmation provided',here('confirmInputs').checked);
    addCheck('Handling location readiness farmer-confirmed',state.resources?.readiness==='yes');
    addCheck('Current source-validated Open-Meteo forecast',isCurrent());
    addCheck('FastAPI evaluation returned verified schema',!!r);
    addCheck('Optional package is a confirmed completed action',false);
    if(live.replan)addCheck('Forecast-hour replan attested by backend',true);
  }
  const download=el('button','btn','Download evidence JSON');download.type='button';download.id='downloadEvidence';
  here('printSummary').insertAdjacentElement('afterend',download);
  download.addEventListener('click',()=>{
    const evidence={generated_at_utc:new Date().toISOString(),location:state.place,model_scope:'Jalna already-picked cotton preparation only',
      disclosure:'Conditional simulation using user declarations and genuine FastAPI output; not field-validated agricultural advice.',
      forecast:live.forecast,source_registry:live.sources,evaluation:live.evaluation,comparison:live.comparison,
      replan:live.replan,selected_package:live.selectedPackage,request:live.request};
    const b=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=el('a');
    a.href=url;a.download='agri-foresight-evidence-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  // A bounded, working rules-based helper; no external generative AI is claimed.
  canned.weather.en='Page 02 shows live or recently cached Open-Meteo model data when validated by FastAPI. If unavailable, no forecast hour is offered.';
  canned.result.en='On Page 04 click Evaluate using FastAPI after saving a deadline and confirmed resources. Page 05 can compare an eligible conditional package with the actual backend.';
  canned.resource.en='Page 03 records farmer-declared, comparable handling units, readiness and separately confirmed alternatives. Requested resources do not count as confirmed.';
  document.querySelector('.assist-foot').textContent='Built-in multilingual FAQ, not a live AI model. Voice input depends on browser support.';
  here('assistantLaunch').title='Open built-in Agri Foresight guide';
  // Remove old prototype-only buttons and labels; leave genuine working navigation and optional browser speech.
  const disclaimers=[
    ['railFootText','Real weather evidence and FastAPI feasibility are available for the supported Jalna scenario only.'],
    ['resultReason','Enter a resource declaration and deadline to obtain the actual Python backend decision.'],
    ['summaryOutcome','No API-backed decision has been calculated.'],
    ['engineIndicator','FASTAPI ENGINE · NO RESULT']
  ];
  for(const [id,msg] of disclaimers)if(here(id))here(id).textContent=msg;
  here('forecastSourceChip').textContent='CONNECTING';
  additional.sampleWeather=false;additional.demoInputs=false;additional.previewResult=null;
  updateAllNew();
  void boot();
  if(location.pathname==='/interactive-review.html')history.replaceState({},'', '/');
})();