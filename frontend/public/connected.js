/* Agri Foresight unified six-screen runtime. Uses only source-labelled FastAPI responses.
   No simulated weather, crop-safety thresholds, fabricated farmer data or AI claims. */
(() => {
  "use strict";
  const live={forecast:null,sources:null,health:null,evaluation:null,request:null,comparison:null,replan:null,selectedHour:null,selectedPackage:null,forecastLoading:false,error:null};
  const here=id=>document.getElementById(id);
  const css04=document.createElement('link');css04.rel='stylesheet';css04.href='/evidence-04.css';document.head.append(css04);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
  const num=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-IN',{maximumFractionDigits:2}):'Unknown';
  const okLocation=()=>state.place?.state==='Maharashtra'&&state.place?.city?.trim().toLowerCase()==='jalna';
  const statuses=['feasible','blocked','unknown','completed'];
  let comparisonGeneration=0,attestedDeadlineRows=[],candidateSignature='';
  let manualGeneration=0,manualDeadlineRows=[];
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
      renderSourceMatrix();
      alert.textContent='FastAPI connected · '+health.version+' · '+health.disclaimer;
      entries.replaceChildren();
      for(const s of sources.sources){if(typeof s.title!=='string'||typeof s.url!=='string'||!/^https:\/\//.test(s.url))continue;
        const article=el('article','source-entry');const a=el('a','',s.title);a.href=s.url;a.rel='noopener noreferrer';a.target='_blank';article.append(a,el('p','',s.short_supported_statement||''),el('small','',s.limitations||''));entries.append(article);}
      if(!entries.children.length)entries.textContent='No validated source entries returned.';
      await refreshForecast(false);
    } catch(e){live.forecast=null;alert.textContent=e.message;entries.textContent='Source registry unavailable. No source evidence can be assumed.';renderWeather();renderSourceMatrix();}
  }
  function clearResult(){
    live.error=null;live.evaluation=null;live.request=null;live.comparison=null;live.replan=null;live.selectedPackage=null;
    resetCandidateComparisons();resetManualComparisons();
    renderSourceMatrix();
  }
  const oldNote=noteChange;
  noteChange=function(){clearResult();oldNote();};
  const oldSummaries=updateSummaries;
  updateSummaries=function(){
    const place=state.place.city+'|'+state.place.state;
    if(previousPlace!==place){previousPlace=place;live.forecast=null;live.selectedHour=null;clearResult();renderSourceMatrix();renderCandidateComparisonChoices();}
    oldSummaries();
    here('weatherValue').textContent=live.forecast?(isCurrent()?'Model forecast '+(live.forecast.hours.length)+' h':live.forecast.status.toUpperCase()):'No verified forecast';
  };
  updateWeatherUI=renderWeather;
  // Descriptive sums of genuine future model hours, never a safety cutoff.
  function renderForecastWindows(chart,forecast){
    const now=Date.now(),seen=new Set();
    const future=forecast.hours.filter(h=>{
      const at=Date.parse(h.time+':00+05:30');
      if(!Number.isFinite(at)||at<now||seen.has(h.time))return false;
      seen.add(h.time);return true;
    }).sort((a,b)=>a.time.localeCompare(b.time));
    if(!future.length){
      chart.append(el('p','forecast-window-label','No future source-native hourly records available; no model totals calculated.'));
      return;
    }
    const start=Date.parse(future[0].time+':00+05:30');
    const byHour=new Map(future.map(h=>[Date.parse(h.time+':00+05:30'),h]));
    chart.append(el('p','forecast-window-label','Upcoming model hours beginning '+
      future[0].time.replace('T',' ')+' IST · descriptive precipitation sums only; no safe-action rainfall threshold.'));
    const grid=el('div','forecast-window-grid');grid.id='forecastWindowSummary';
    for(const n of [6,12,24]){
      const rows=Array.from({length:n},(_,i)=>byHour.get(start+i*3_600_000)).filter(Boolean),
        rain=rows.filter(h=>h.precipitation_mm!==null),
        prob=rows.filter(h=>h.precipitation_probability_pct!==null),
        complete=rows.length===n&&rain.length===n;
      const card=el('article','forecast-window-card');
      card.append(el('strong','','Next '+n+' forecast hours'));
      card.append(el('span','window-value',rain.length?
        (complete?'Modeled rainfall: ':'Known partial rainfall: ')+
        num(rain.reduce((total,h)=>total+h.precipitation_mm,0))+' mm':'Rainfall unavailable'));
      card.append(el('small','','Rainfall coverage: '+rain.length+'/'+n+' hourly values. '+
        (complete?'All requested hours reported.':'Incomplete; missing hours are not dry hours.')));
      card.append(el('small','','Highest individual-hour model probability: '+
        (prob.length?num(Math.max(...prob.map(h=>h.precipitation_probability_pct)))+'%':'Unavailable')+
        '. Not a probability for the whole window.'));
      grid.append(card);
    }
    chart.append(grid);
  }
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
    renderForecastWindows(chart,f);
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
    finally{live.forecastLoading=false;here('toggleForecast').disabled=false;resetCandidateComparisons();renderWeather();renderSourceMatrix();renderPrintEvidence();renderCandidateComparisonChoices();}
  }
  here('toggleForecast').addEventListener('click',e=>{e.stopImmediatePropagation();refreshForecast(true);},true);
  here('clearForecast').addEventListener('click',e=>{e.stopImmediatePropagation();live.forecast=null;live.selectedHour=null;resetCandidateComparisons();renderWeather();renderSourceMatrix();renderCandidateComparisonChoices();},true);
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
    finally{live.busy=false;button.disabled=false;button.textContent='Evaluate using FastAPI';renderAssessment();renderPackages();renderSummary();renderSourceMatrix();}
  }

  // EX-05: all explanations are server-origin fields. Client never ranks or
  // recomputes feasibility, agronomic thresholds, or resource availability.
  const diagnosis=el('section','panel backend-diagnosis');
  diagnosis.id='decisionDiagnostics';
  diagnosis.setAttribute('aria-label','Explain the FastAPI feasibility decision');
  diagnosis.append(el('h3','','Why did the resource assessment return this result?'));
  const decisionNotes=el('div','backend-diagnosis-body');
  decisionNotes.id='decisionDiagnosticNotes';
  decisionNotes.setAttribute('aria-live','polite');
  diagnosis.append(decisionNotes);
  here('constraintList').parentElement.append(diagnosis);
  function renderDecisionDiagnostics(){
    decisionNotes.replaceChildren();
    const report=live.evaluation;
    if(!report){
      decisionNotes.append(el('p','gov-intro',
        'Not evaluated. Save farmer-declared inputs and a candidate deadline, then request a real FastAPI assessment.'));
      return;
    }
    decisionNotes.append(el('p','gov-intro',
      'Server result: '+report.status.toUpperCase()+
      '. This evaluates declared capacity, readiness and timing only; it cannot certify safe cotton storage or protection.'));
    const labels={readiness:'Handling-location readiness',capacity:'Declared handling capacity',timing:'Candidate deadline and time'};
    const constraintResults=report.baseline?.constraints||[];
    let found=0;
    for(const c of constraintResults){
      if(c.status==='pass')continue;
      found++;
      const note=el('article','backend-diagnosis-item');
      note.dataset.status=c.status;
      note.append(el('strong','', (labels[c.id]||c.id)+' · '+c.status.toUpperCase()),
        el('p','',c.explanation),
        el('small','','Source of this assessment: '+(c.provenance||'FastAPI returned constraint')));
      decisionNotes.append(note);
    }
    if(!found){
      decisionNotes.append(el('p','gov-intro',
        report.status==='completed'?
          'Action is farmer-declared completed; the engine has not executed or inspected it.':
          'All returned baseline resource constraints passed; this is not an agronomic or storage-safety guarantee.'));
    }
    for(const x of report.excluded_changes||[]){
      const note=el('article','backend-diagnosis-item');
      note.dataset.status='excluded';
      note.append(el('strong','','Not counted · '+x.id),
        el('p','',x.reason||'The backend did not accept this change as a confirmed available resource.'));
      decisionNotes.append(note);
    }
    decisionNotes.append(el('small','',
      'This explanation preserves the backend decision and explicitly excludes unconfirmed resources. Select alternatives on Page 05 for real API comparison.'));
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
    if(!r){list.append(el('div','empty',live.error||'No API assessment yet.'));renderDecisionDiagnostics();return;}
    for(const c of base.constraints){
      const row=el('div','constraint-line '+(c.status==='pass'?'':c.status==='blocked'?'problem':'unknown'));
      row.append(el('span','symbol',c.status==='pass'?'✓':c.status==='blocked'?'×':'?'));
      const content=el('div');content.append(el('strong','',c.id+' · '+c.status),el('small','',c.explanation),el('small','', 'Provenance: '+c.provenance));row.append(content);list.append(row);
    }
    for(const rejected of r.excluded_changes){list.append(el('div','live-excluded',rejected.id+': '+rejected.reason));}
    renderDecisionDiagnostics();
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
      b.addEventListener('click',()=>{live.selectedPackage=i;live.comparison=null;live.replan=null;resetCandidateComparisons();resetManualComparisons();renderPackages();renderSummary();});list.append(b);
    });
    compare.replaceChildren();
    if(live.selectedPackage===null||!packs[live.selectedPackage]){compare.append(el('p','',packs.length?'Select a package, then use Compare / replan with FastAPI.':'No eligible package selected.'));renderCandidateComparisonChoices();renderManualControls();return;}
    const p=packs[live.selectedPackage],a=live.evaluation.baseline,b=p.projected;
    compare.append(el('h3','', 'Selected conditional package'));
    compare.append(el('p','', 'Before: '+a.status.toUpperCase()+' · '+num(a.projected_capacity_units)+' capacity / '+num(a.projected_target_units)+' target.'));
    compare.append(el('p','', 'Projected: '+b.status.toUpperCase()+' · '+num(b.projected_capacity_units)+' capacity / '+num(b.projected_target_units)+' target.'));
    compare.append(el('p','', 'Original work left unhandled: '+num(b.original_target_unhandled_units)+' handling units. '+p.warning));
    if(live.comparison){compare.append(el('p','live-valid','Backend comparison: '+live.comparison.changes.status_before+' → '+live.comparison.changes.status_after+'. '+live.comparison.interpretation));}
    if(live.replan){compare.append(el('p','live-valid','Server-attested forecast-hour replan: '+live.replan.forecast_selection.selected_hour_local+' IST · '+live.replan.forecast_selection.attribution));}
    renderCandidateComparisonChoices();renderManualControls();
  }
  here('clearPackage').addEventListener('click',e=>{e.stopImmediatePropagation();live.selectedPackage=null;live.comparison=null;live.replan=null;resetCandidateComparisons();resetManualComparisons();renderPackages();renderSummary();},true);
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

  // EX-06: only /api/replan calculates each selected deadline outcome.
  const multiPanel=el('section','panel multi-deadline');
  multiPanel.id='multiDeadlinePanel';
  multiPanel.append(el('h2','','Compare up to 3 model-hour deadlines'));
  multiPanel.append(el('p','multi-disclosure','Select distinct future forecast hours. Each is independently authenticated and evaluated by FastAPI. This is a declared-resource timing comparison, not a rain-onset prediction or crop-safety recommendation.'));
  const multiFields=el('div','multi-fields');
  const multiSelects=[1,2,3].map(n=>{
    const label=el('label','multi-field');
    label.append(el('span','','Candidate '+n+' · India Standard Time'));
    const sel=el('select','multi-select');sel.id='multiCandidate'+n;
    label.append(sel);multiFields.append(label);
    sel.addEventListener('change',resetCandidateComparisons);
    return sel;
  });
  multiPanel.append(multiFields);
  const multiButtons=el('div','multi-buttons');
  const multiRun=el('button','btn primary','Compare with real FastAPI');multiRun.id='runMultiDeadline';multiRun.type='button';
  const multiCsv=el('button','btn','Export attested CSV');multiCsv.id='exportMultiDeadline';multiCsv.type='button';multiCsv.disabled=true;
  multiButtons.append(multiRun,multiCsv);multiPanel.append(multiButtons);
  const multiStatus=el('p','multi-status','A verified model forecast and a completed resource assessment are required.');
  multiStatus.id='multiDeadlineStatus';multiStatus.setAttribute('role','status');
  const multiResults=el('div','multi-results');multiResults.id='multiDeadlineResults';
  multiPanel.append(multiStatus,multiResults);
  here('packageList').closest('.grid2').insertAdjacentElement('afterend',multiPanel);
  function resetCandidateComparisons(){
    comparisonGeneration++;attestedDeadlineRows=[];multiResults.replaceChildren();
    multiCsv.disabled=true;multiRun.textContent='Compare with real FastAPI';
  }
  function candidateHours(){
    const f=live.forecast;
    if(!isCurrent()||!f)return [];
    const age=(Date.now()-Date.parse(f.retrieved_at_utc))/3600000;
    if(!Number.isFinite(age)||age<0||age>2)return [];
    const seen=new Set();
    return f.hours.filter(h=>{
      const timestamp=Date.parse(h.time+':00+05:30');
      if(!Number.isFinite(timestamp)||timestamp<=Date.now()+60000||seen.has(h.time))return false;
      seen.add(h.time);return true;
    }).sort((a,b)=>a.time.localeCompare(b.time)).slice(0,48);
  }
  function renderCandidateComparisonChoices(){
    const hours=candidateHours(),key=hours.map(h=>h.time).join('|');
    if(key!==candidateSignature){
      candidateSignature=key;resetCandidateComparisons();
      for(const sel of multiSelects){
        sel.replaceChildren();
        const blank=el('option','','Choose an authenticated hour');blank.value='';sel.append(blank);
        for(const hour of hours){
          const opt=el('option','',hour.time.replace('T',' ')+' IST · '+
            (hour.precipitation_mm===null?'rainfall unavailable':num(hour.precipitation_mm)+' modeled mm'));
          opt.value=hour.time;sel.append(opt);
        }
      }
    }
    const ready=!!live.request&&!!live.evaluation&&hours.length>0;
    for(const sel of multiSelects)sel.disabled=!ready;
    multiRun.disabled=!ready;
    if(!hours.length)multiStatus.textContent='No recent, source-authenticated future model hours. Comparison unavailable.';
    else if(!ready)multiStatus.textContent='Model forecast available. First evaluate farmer-declared resources on Page 04.';
    else if(!attestedDeadlineRows.length)multiStatus.textContent='Ready · '+
      (live.selectedPackage===null?'baseline resources only':'selected confirmed-resource package')+
      '. Select 1–3 unique hours and request genuine backend calculations.';
  }
  function renderAttestedRows(){
    multiResults.replaceChildren();
    const table=el('table','multi-table'),thead=el('thead'),header=el('tr');
    for(const h of ['Forecast hour (IST)','Server feasibility','Time slack (hours)','Nonpassing constraints','Model rainfall at hour','Server attestation']){
      const th=el('th','',h);th.scope='col';header.append(th);
    }
    thead.append(header);table.append(thead);
    const tbody=el('tbody');
    for(const item of attestedDeadlineRows){
      const tr=el('tr');
      const result=item.value,decision=result?.after?.baseline,source=result?.forecast_selection;
      const blockers=decision?.constraints?.filter(c=>c.status!=='pass').map(c=>c.id+': '+c.status).join(', ');
      const values=[item.hour.replace('T',' '),
        decision?decision.status.toUpperCase():'Unavailable',
        decision?(decision.time_budget.time_slack_hours===null?'Unknown':num(decision.time_budget.time_slack_hours)):'—',
        decision?(blockers||'None reported'):'—',
        source?(source.precipitation_mm===null?'Unknown':num(source.precipitation_mm)+' mm'):'—',
        source?(source.attribution+' · '+source.forecast_status+' · '+source.retrieved_at_utc):(item.error||'No server attestation')];
      values.forEach((v,i)=>{const cell=el(i?'td':'th','',v);if(!i)cell.scope='row';tr.append(cell);});
      tbody.append(tr);
    }
    table.append(tbody);
    const overflow=el('div','multi-overflow');overflow.append(table);multiResults.append(overflow);
    const verified=attestedDeadlineRows.filter(x=>x.value).length;
    multiCsv.disabled=!verified;
    multiStatus.textContent=verified+'/'+attestedDeadlineRows.length+' candidate(s) verified independently by FastAPI. Failed hours remain unavailable. No local feasibility or safety ranking.';
  }
  multiRun.addEventListener('click',async()=>{
    if(multiRun.disabled||!live.request||!live.evaluation)return;
    const hours=multiSelects.map(s=>s.value).filter(Boolean);
    if(!hours.length){multiStatus.textContent='Select at least one forecast hour.';return;}
    if(new Set(hours).size!==hours.length){multiStatus.textContent='Select distinct candidate hours.';return;}
    const allowed=new Set(candidateHours().map(h=>h.time));
    if(!hours.every(h=>allowed.has(h))){resetCandidateComparisons();renderCandidateComparisonChoices();multiStatus.textContent='Source hours changed. Select current hours again.';return;}
    const token=++comparisonGeneration;multiRun.disabled=true;multiCsv.disabled=true;multiRun.textContent='Asking FastAPI…';
    multiResults.replaceChildren();multiStatus.textContent='Requesting '+hours.length+' server attestation(s)…';
    const baseline={...live.request,now:new Date().toISOString(),changes:[]};
    const pack=live.selectedPackage===null?null:live.evaluation.packages[live.selectedPackage];
    const adjusted=pack?{...baseline,target_units:pack.projected.projected_target_units,
      capacity_units:pack.projected.projected_capacity_units}:{...baseline};
    const outcome=await Promise.all(hours.map(async hour=>{
      try{
        const value=await json('/api/replan',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({before:baseline,after:adjusted,selected_hour_local:hour})});
        const source=value?.forecast_selection,decision=value?.after?.baseline;
        if(source?.selected_hour_local!==hour||source?.candidate_deadline!==hour+':00+05:30'||
          !['retrieved_live','cached_recent'].includes(source.forecast_status)||
          !source.attribution?.includes('Open-Meteo')||
          !decision||!statuses.includes(decision.status)||!Array.isArray(decision.constraints)||
          !decision.constraints.every(c=>['pass','blocked','unknown'].includes(c.status))||
          !(decision.time_budget?.time_slack_hours===null||Number.isFinite(decision.time_budget?.time_slack_hours)))
          throw Error('Server result failed source/decision attestation validation.');
        return {hour,value};
      }catch(e){return {hour,error:e.message};}
    }));
    if(token!==comparisonGeneration)return;
    attestedDeadlineRows=outcome;multiRun.disabled=false;multiRun.textContent='Compare with real FastAPI';renderAttestedRows();
  });
  multiCsv.addEventListener('click',()=>{
    const rows=attestedDeadlineRows.filter(x=>x.value);
    if(!rows.length||multiCsv.disabled)return;
    const esc=value=>{
      let v=String(value??'');
      if(/^\s*[=+\-@\t\r]/.test(v))v="'"+v;
      return '"'+v.replace(/"/g,'""')+'"';
    };
    const heading=['hour_ist','backend_status','time_slack_hours','nonpassing_constraints',
      'hour_precipitation_mm','hour_probability_pct','source','retrieved_at_utc','disclosure'];
    const lines=rows.map(({hour,value})=>{
      const d=value.after.baseline,f=value.forecast_selection;
      return [hour,d.status,d.time_budget.time_slack_hours,
        d.constraints.filter(c=>c.status!=='pass').map(c=>c.id+':'+c.status).join('; '),
        f.precipitation_mm,f.precipitation_probability_pct,f.attribution,f.retrieved_at_utc,
        'Model-hour candidate only; not rain onset, agricultural safety or completed activity'].map(esc).join(',');
    });
    const csv='\uFEFF'+heading.join(',')+'\r\n'+lines.join('\r\n')+'\r\n';
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=el('a');link.href=url;
    link.download='agri-foresight-attested-deadlines-'+new Date().toISOString().slice(0,10)+'.csv';
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  // EX-07: explicit user-chosen future times, with NO model/IMD assertion.
  // /api/compare is authoritative even if Open-Meteo is unavailable.
  const manualPanel=el('section','panel manual-time-panel');manualPanel.id='manualDeadlinePanel';
  manualPanel.append(el('h2','','Manual deadline alternatives · no weather required'));
  manualPanel.append(el('p','manual-disclosure',
    'When a reliable model forecast is unavailable, enter up to three distinct future planning deadlines. FastAPI compares declared resources and hours only; these dates are farmer-selected assumptions, not observed or predicted rain onset.'));
  const manualFields=el('div','manual-fields');
  const manualInputs=[1,2,3].map(n=>{
    const label=el('label','manual-field');label.append(el('span','','Candidate '+n+' · IST'));
    const input=el('input','manual-input');input.id='manualDeadline'+n;input.type='datetime-local';
    input.setAttribute('aria-label','Manual candidate '+n+' in India Standard Time');
    input.addEventListener('input',resetManualComparisons);
    label.append(input);manualFields.append(label);return input;
  });
  manualPanel.append(manualFields);
  const manualRun=el('button','btn primary','Compare manual deadlines with FastAPI');
  manualRun.id='compareManualDeadlines';manualRun.type='button';
  const manualStatus=el('p','manual-status','Evaluate farmer-declared resources on Page 04 first.');
  manualStatus.id='manualDeadlineStatus';manualStatus.setAttribute('role','status');
  const manualOutput=el('div','manual-output');manualOutput.id='manualDeadlineResults';
  manualPanel.append(manualRun,manualStatus,manualOutput);
  manualPanel.append(el('small','',
    'No model source, rainfall probability or forecast safety claim is attached to manual comparisons. Successful results are included in Download evidence JSON on Page 06.'));
  multiPanel.insertAdjacentElement('afterend',manualPanel);
  function resetManualComparisons(){
    ++manualGeneration;manualDeadlineRows=[];manualOutput.replaceChildren();
    manualRun.textContent='Compare manual deadlines with FastAPI';
  }
  function renderManualControls(){
    const ready=!!live.request&&!!live.evaluation&&okLocation();
    manualRun.disabled=!ready;
    for(const input of manualInputs)input.disabled=!ready;
    if(!ready)manualStatus.textContent='No current API-backed farmer assessment. Evaluate resources first.';
    else if(!manualDeadlineRows.length)manualStatus.textContent='Ready to compare up to 3 farmer-selected times. No forecast is consulted.';
  }
  function renderManualResults(){
    manualOutput.replaceChildren();
    const table=el('table','multi-table'),head=el('thead'),tr=el('tr');
    for(const label of ['User-selected deadline (IST)','Server result','Time slack (h)','Blocked / unknown constraints','Evidence classification']){
      const th=el('th','',label);th.scope='col';tr.append(th);
    }
    head.append(tr);table.append(head);
    const body=el('tbody');
    for(const entry of manualDeadlineRows){
      const result=entry.response?.after?.baseline;
      const constraints=result?.constraints?.filter(c=>c.status!=='pass').map(c=>c.id+': '+c.status).join(', ');
      const values=[entry.hour.replace('T',' '),
        result?result.status.toUpperCase():'Unavailable',
        result?(result.time_budget.time_slack_hours===null?'Unknown':num(result.time_budget.time_slack_hours)):'—',
        result?(constraints||'None reported'):(entry.error||'No verified server result'),
        'Farmer-selected time only · no forecast attestation'];
      const row=el('tr');
      values.forEach((value,i)=>{
        const cell=el(i?'td':'th','',value);if(!i)cell.scope='row';row.append(cell);
      });
      body.append(row);
    }
    table.append(body);const wrap=el('div','multi-overflow');wrap.append(table);manualOutput.append(wrap);
    const verified=manualDeadlineRows.filter(x=>x.response).length;
    manualStatus.textContent=verified+'/'+manualDeadlineRows.length+
      ' manual deadline(s) returned by FastAPI. Unavailable results are not filled in.';
  }
  manualRun.addEventListener('click',async()=>{
    if(manualRun.disabled||!live.request||!live.evaluation)return;
    const selected=manualInputs.map(i=>i.value).filter(Boolean);
    if(!selected.length){manualStatus.textContent='Enter at least one user-chosen deadline.';return;}
    if(new Set(selected).size!==selected.length){manualStatus.textContent='Enter distinct manual deadlines.';return;}
    if(!selected.every(time=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)&&
      Number.isFinite(Date.parse(time+':00+05:30'))&&Date.parse(time+':00+05:30')>Date.now()+60000)){
      manualStatus.textContent='Each candidate must be a valid future time in IST.';return;
    }
    const token=++manualGeneration;
    manualRun.disabled=true;manualRun.textContent='Checking server…';manualOutput.replaceChildren();
    manualStatus.textContent='Evaluating '+selected.length+' user-declared deadline(s) through FastAPI…';
    const before={...live.request,now:new Date().toISOString(),changes:[]};
    const pack=live.selectedPackage===null?null:live.evaluation.packages[live.selectedPackage];
    const afterBase=pack?{...before,target_units:pack.projected.projected_target_units,
      capacity_units:pack.projected.projected_capacity_units}:{...before};
    const resolved=await Promise.all(selected.map(async hour=>{
      try{
        const response=await json('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({before,after:{...afterBase,deadline:hour+':00+05:30'}})});
        const decision=response?.after?.baseline;
        if(!response?.changes||!decision||!statuses.includes(decision.status)||
          decision.time_budget?.candidate_deadline!==hour+':00+05:30'||
          !Array.isArray(decision.constraints)||
          !decision.constraints.every(c=>['pass','blocked','unknown'].includes(c.status))||
          !(decision.time_budget?.time_slack_hours===null||Number.isFinite(decision.time_budget?.time_slack_hours))){
          throw Error('Manual comparison failed server schema verification.');
        }
        return {hour,response};
      }catch(e){return {hour,error:e.message};}
    }));
    if(token!==manualGeneration)return;
    manualDeadlineRows=resolved;manualRun.disabled=false;
    manualRun.textContent='Compare manual deadlines with FastAPI';renderManualResults();
  });
  // EX-05C: a print-safe, source-separated record of *actual* current state.
  const printReceipt=el('section','panel print-evidence-receipt');
  printReceipt.id='printEvidenceReceipt';
  printReceipt.setAttribute('aria-label','Printable source and decision evidence receipt');
  printReceipt.append(el('h2','','Evidence receipt · model, history, declarations and decision'));
  const printReceiptRows=el('div','print-evidence-rows');
  printReceiptRows.id='printEvidenceReceiptRows';
  printReceipt.append(printReceiptRows);
  printReceipt.append(el('small','',
    'Not a crop-safety certificate, rainfall observation, executed resource action, or guarantee. Data comes only from the current browser session.'));
  document.querySelector('section.section[data-page="5"]').append(printReceipt);
  function renderPrintEvidence(){
    printReceiptRows.replaceChildren();
    const add=(label,value)=>{
      const row=el('div','print-evidence-row');
      row.append(el('strong','',label),el('span','',value));
      printReceiptRows.append(row);
    };
    const supported=okLocation();
    const forecast=live.forecast,history=governmentClimateData;
    const evaluated=live.evaluation;
    add('Geographic scenario',supported?
      'Jalna, Maharashtra · already-picked cotton rain preparedness (district reference, not a farm geolocation)':
      'Current location unsupported by the Jalna-only model/engine');
    add('FastAPI resource decision',evaluated?
      'Server result: '+evaluated.status.toUpperCase()+' · conditional resource/time feasibility only':
      'Not evaluated · no verified result to report');
    const declared=live.request;
    add('Farmer-declared inputs',declared?
      'Target '+num(declared.target_units)+' handling units; capacity '+
      num(declared.capacity_units)+' handling units; required time '+
      num(declared.required_hours)+' h · unverified user declarations':
      'No completed API-backed farmer input submission in this session');
    add('Current forecast',supported&&isCurrent()?
      'Open-Meteo NON-GOVERNMENT-HOSTED MODEL · '+forecast.hours.length+
      ' source hours · retrieved '+forecast.retrieved_at_utc+
      ' · not observed rain or certified rain-onset':
      'No eligible current model forecast for this location/session');
    add('Government climate evidence',supported&&history&&
      ['retrieved_live','cached_recent'].includes(history.status)?
      'NASA POWER US-GOVERNMENT HISTORICAL GRID · latest supplied date '+
      history.latest_data_date+' · retrieved '+history.retrieved_at_utc+
      ' · not farm-measured rainfall':
      'No validated NASA POWER historical grid available for this location/session');
    add('Official IMD warnings','Not connected · official authorized API data not available; no warning is inferred');
    const outstanding=evaluated?.baseline?.constraints?.filter(c=>c.status!=='pass')||[];
    add('Open constraints',evaluated?
      (outstanding.length?outstanding.map(c=>c.id+'='+c.status).join(', '):
      'No backend-reported blocked/unknown baseline constraints')+' · based on declared inputs only':
      'Unknown until FastAPI evaluates the farmer-declared scenario');
    add('Source and action caveat','Confirmed optional resources are conditional proposals, not proof of completed work. Do not use this receipt as agricultural safety advice.');
  }
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
    renderPrintEvidence();
  }
  const download=el('button','btn','Download evidence JSON');download.type='button';download.id='downloadEvidence';
  here('printSummary').insertAdjacentElement('afterend',download);
  download.addEventListener('click',()=>{
    const evidence={generated_at_utc:new Date().toISOString(),location:state.place,model_scope:'Jalna already-picked cotton preparation only',
      disclosure:'Conditional simulation using user declarations and genuine FastAPI output; not field-validated agricultural advice.',
      forecast:live.forecast,source_registry:live.sources,evaluation:live.evaluation,comparison:live.comparison,
      replan:live.replan,selected_package:live.selectedPackage,request:live.request,
      government_climate_historical:governmentClimateData,
      source_attested_model_deadlines:attestedDeadlineRows.filter(x=>x.value).map(x=>({candidate_hour_ist:x.hour,source_type:'Open-Meteo model / FastAPI attested',result:x.value})),
      user_selected_manual_deadlines:manualDeadlineRows.filter(x=>x.response).map(x=>({candidate_hour_ist:x.hour,source_type:'user-declared assumption / FastAPI comparison',result:x.response}))};
    const b=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=el('a');
    a.href=url;a.download='agri-foresight-evidence-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  // Source-separated official government data: historical only, never an
  // operational rainfall forecast or an input to the feasibility engine.
  const govPanel=el('section','panel government-evidence');
  govPanel.id='governmentClimatePanel';
  govPanel.setAttribute('aria-label','Official NASA POWER historical climate evidence');
  const govTitle=el('h2','', 'Government climate evidence · NASA POWER');
  const govIntro=el('p','gov-intro',
    'Historical daily gridded rainfall and temperature from NASA (US government). Not live observed rainfall, a future forecast, or a measurement at your farm.');
  const govActions=el('div','gov-action-row');
  const govRefresh=el('button','btn primary','Refresh official data');
  govRefresh.id='refreshGovernmentClimate';govRefresh.type='button';
  const govStatus=el('span','gov-source-state','Checking official source…');
  govStatus.id='governmentClimateStatus';govStatus.setAttribute('role','status');
  const govRange=el('select','small-select');
  govRange.id='governmentClimateRange';govRange.setAttribute('aria-label','Government history display range');
  const optSeven=el('option','', 'Latest 7 available days');optSeven.value='7';
  const optAll=el('option','', 'All available days');optAll.value='all';
  govRange.append(optSeven,optAll);
  const govDownload=el('button','btn','Download verified NASA JSON');
  govDownload.id='downloadGovernmentClimate';govDownload.type='button';govDownload.disabled=true;
  const govCSV=el('button','btn','Download verified NASA CSV');
  govCSV.id='downloadGovernmentCSV';govCSV.type='button';govCSV.disabled=true;
  govActions.append(govRefresh,govRange,govDownload,govCSV,govStatus);
  const govRows=el('div','gov-history-grid');
  govRows.id='governmentClimateRows';
  const govDetail=el('p','gov-source-detail');
  govDetail.id='governmentClimateProvenance';
  const govSummary=el('p','gov-source-detail');
  govSummary.id='governmentClimateSummary';
  govPanel.append(govTitle,govIntro,govActions,govRows,govSummary,govDetail);
  document.querySelector('section.section[data-page="1"]').append(govPanel);

  let governmentClimateData=null;
  let governmentClimateRequest=0;

  // EX-05: status receipts reflect independent, real source responses.
  // NASA is historical gridded evidence; IMD is reference-only until authorized.
  const sourcePanel=el('section','panel source-matrix');
  sourcePanel.id='evidenceSourceMatrix';
  sourcePanel.setAttribute('aria-label','Verified data source and engine status');
  const sourceTitle=el('h2','','Source status · what is actually verified');
  const sourceIntro=el('p','source-matrix-intro',
    'These sources have different roles. A connected model forecast is not a ground observation; a historical grid is not a future prediction.');
  const sourceGrid=el('div','source-matrix-grid');
  sourceGrid.id='evidenceSourceGrid';
  sourceGrid.setAttribute('aria-live','polite');
  sourcePanel.append(sourceTitle,sourceIntro,sourceGrid);
  document.querySelector('section.section[data-page="0"]').append(sourcePanel);
  function renderSourceMatrix(){
    sourceGrid.replaceChildren();
    const supported=okLocation();
    const addCard=(name,status,detail,kind)=>{
      const card=el('article','source-matrix-card');
      card.dataset.kind=kind;
      card.append(el('strong','',name),el('span','source-matrix-state',status),el('small','',detail));
      sourceGrid.append(card);
    };
    addCard('FastAPI decision engine',live.health?.ok===true?'Connected':'Not verified',
      live.health?.ok===true?('Source registry connected · '+(live.health.disclaimer||'field safety not validated')):
        'The real API has not returned a verified health response.',
      live.health?.ok===true?'ready':'unavailable');
    if(!supported){
      addCard('Open-Meteo model forecast','Unsupported location','The current pilot serves Jalna, Maharashtra only.','unavailable');
      addCard('NASA POWER government history','Unsupported location','Jalna gridded history cannot be shown for another place.','unavailable');
    } else {
      const f=live.forecast;
      const forecastCurrent=isCurrent();
      addCard('Open-Meteo model forecast',forecastCurrent?'Verified model hours':
          f?.status==='stale_cache'?'Stale · not selectable':
          live.forecastLoading?'Retrieving model source':'Unavailable / not loaded',
        forecastCurrent?('Model forecast only · '+f.hours.length+' hourly records · '+f.retrieved_at_utc+' UTC retrieval timestamp'):
          f?.status==='stale_cache'?'Previous model output cannot establish a current candidate hour.':
          'No source-attested current forecast hours can be assumed.',
        forecastCurrent?'model':'unavailable');
      const g=governmentClimateData;
      const historyValid=g&&['retrieved_live','cached_recent'].includes(g.status);
      addCard('NASA POWER government history',historyValid?'Verified historical grid':
          govStatus.textContent==='Contacting NASA POWER…'?'Retrieving historical grid':'Unavailable / not loaded',
        historyValid?('Latest available historical day '+g.latest_data_date+
          ' · retrieved '+g.retrieved_at_utc+' · not farm measurements or future rain'):
          'No verified daily historical grid available at this moment.',
        historyValid?'historical':'unavailable');
    }
    addCard('IMD official warnings','Not connected',
      'Official APIs require verified authorization and Jalna district coverage. No current IMD warning is inferred.',
      'unavailable');
    const result=live.evaluation;
    addCard('Farmer resource assessment',result?'Backend-attested: '+result.status.toUpperCase():'Not evaluated',
      result?'Computed from declared inputs only; not verified farm availability or crop-safety advice.':
        'A farmer-declared scenario and successful FastAPI evaluation are needed.',
      result?'decision':'unavailable');
  }

  function renderGovernmentClimate(data){
    govRows.replaceChildren();
    const count=govRange.value==='all'?data.days.length:7;
    const items=data.days.slice(-count);
    const rain=items.filter(x=>x.precipitation_mm_day!==null);
    const air=items.filter(x=>x.temperature_c!==null);
    govSummary.textContent='NASA historical grid, '+items.length+' available calendar days · '+
      (rain.length?'Rainfall: '+num(rain.reduce((n,x)=>n+x.precipitation_mm_day,0))+
      ' mm across '+rain.length+'/'+items.length+' days with values':'Rainfall unavailable')+
      ' · '+(air.length?'Mean of available daily temperatures: '+
      num(air.reduce((n,x)=>n+x.temperature_c,0)/air.length)+' °C ('+air.length+'/'+items.length+
      ' days)':'Temperature unavailable')+
      '. These are arithmetic summaries of historical government grid values, NOT operational forecasts.';
    for(const item of [...items].reverse()){
      const card=el('article','gov-day');
      const date=el('time','',item.date);date.dateTime=item.date;
      card.append(date,
        el('b','',item.precipitation_mm_day===null?'Rainfall: unavailable':'Rainfall: '+num(item.precipitation_mm_day)+' mm/day'),
        el('small','',item.temperature_c===null?'Air temperature: unavailable':'Mean air temperature: '+num(item.temperature_c)+' °C'));
      govRows.append(card);
    }
  }
  async function loadGovernmentClimate(refresh=false){
    const token=++governmentClimateRequest;
    governmentClimateData=null;
    govDownload.disabled=true;
    govCSV.disabled=true;
    govSummary.textContent='';
    govRows.replaceChildren();
    if(!okLocation()){
      govStatus.textContent='Unavailable for selected location';
      renderSourceMatrix();renderPrintEvidence();
      govRows.append(el('p','gov-intro','Official Jalna reference data cannot be applied to the selected place.'));
      govDetail.textContent='Switch to Jalna, Maharashtra to retrieve its government historical context.';
      return;
    }
    govRefresh.disabled=true;
    govStatus.textContent='Contacting NASA POWER…';
    try{
      const data=await json('/api/government-climate'+(refresh?'?refresh=true':''));
      if(token!==governmentClimateRequest||!okLocation())return;
      if(!['retrieved_live','cached_recent','unavailable'].includes(data?.status)||!Array.isArray(data.days)||data.source!=='NASA POWER (US government)'){
        throw new Error('Government climate schema could not be verified.');
      }
      if(data.status==='unavailable'){
        if(data.days.length)throw new Error('Unavailable NASA response unexpectedly contained values.');
        govStatus.textContent='Official source unavailable';
        govRows.append(el('p','gov-intro',data.notice||'NASA POWER unavailable. No values are shown.'));
        govDetail.replaceChildren();
        const link=el('a','', 'NASA POWER official documentation');link.href='https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
        link.target='_blank';link.rel='noopener noreferrer';govDetail.append(link);
        return;
      }
      if(data.data_kind!=='government_gridded_historical'||!data.retrieved_at_utc||
        !data.days.length||data.days.length>40||
        !data.days.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&
          (x.precipitation_mm_day===null||(Number.isFinite(x.precipitation_mm_day)&&x.precipitation_mm_day>=0))&&
          (x.temperature_c===null||Number.isFinite(x.temperature_c)))){
        throw new Error('Government climate values or provenance failed validation.');
      }
      govStatus.textContent=(data.status==='cached_recent'?'Verified recent response':'Verified government response')+' · '+data.days.length+' historical days';
      governmentClimateData=data;
      govDownload.disabled=false;
       govCSV.disabled=false;      renderGovernmentClimate(data);
      govDetail.replaceChildren();
      const link=el('a','','NASA POWER official daily API');link.href='https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
      link.rel='noopener noreferrer';link.target='_blank';
      govDetail.append('Source: ',link,' · Latest provided day: '+data.latest_data_date+
        ' · Retrieved (UTC): '+data.retrieved_at_utc+'. '+data.notice);
    }catch(e){
      if(token!==governmentClimateRequest)return;
      govStatus.textContent='Could not verify official data';
      govRows.replaceChildren(el('p','gov-intro','No government climate values displayed: '+e.message));
      govDetail.textContent='Only verified NASA POWER responses are eligible; no offline example is substituted.';
    }finally{if(token===governmentClimateRequest){govRefresh.disabled=false;renderSourceMatrix();renderPrintEvidence();}}
  }
  govRefresh.addEventListener('click',()=>{void loadGovernmentClimate(true);});
  govRange.addEventListener('change',()=>{if(governmentClimateData&&okLocation())renderGovernmentClimate(governmentClimateData);});
  govDownload.addEventListener('click',()=>{
    if(!governmentClimateData||!okLocation())return;
    const exported={...governmentClimateData,exported_at_utc:new Date().toISOString(),
      disclosure:'NASA POWER historical government grid values only; not future rainfall or farm measurements.'};
    const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=el('a');
    link.href=url;link.download='agri-foresight-nasa-jalna-'+governmentClimateData.latest_data_date+'.json';
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  govCSV.addEventListener('click',()=>{
    if(!governmentClimateData||!okLocation()||govCSV.disabled)return;
    const d=governmentClimateData;
    const columns=['date','precipitation_mm_day','temperature_c','source','data_kind','retrieved_at_utc','source_url'];
    const txt=value=>{
      let out=String(value??'');
      if(/^\s*[=+\-@\t\r]/.test(out))out="'"+out;
      return '"'+out.replace(/"/g,'""')+'"';
    };
    const n=value=>typeof value==='number'&&Number.isFinite(value)?String(value):'';
    const lines=d.days.map(day=>[txt(day.date),n(day.precipitation_mm_day),n(day.temperature_c),
      txt(d.source),txt(d.data_kind),txt(d.retrieved_at_utc),
      txt(d.source_url||'https://power.larc.nasa.gov/docs/services/api/temporal/daily/')].join(','));
    const content='\uFEFF'+columns.join(',')+'\r\n'+lines.join('\r\n')+'\r\n';
    const blob=new Blob([content],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),anchor=el('a');
    anchor.href=url;anchor.download='agri-foresight-nasa-jalna-'+d.latest_data_date+'.csv';
    anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  let governmentLocation=state.place.city+'|'+state.place.state;
  const updateSummaryAndLocation=updateSummaries;
  updateSummaries=function(){
    const place=state.place.city+'|'+state.place.state;
    updateSummaryAndLocation();
    if(place!==governmentLocation){
      governmentLocation=place;
      renderSourceMatrix();
      renderSourceMatrix();
  void loadGovernmentClimate(false);
    }
  };
  void loadGovernmentClimate(false);

  // Override obsolete offline-prototype copy, including on language changes.
  // Model outputs remain labeled; no simulated values appear in the real UI.
  Object.assign(dict.en,{
    runPreview:'Evaluate using FastAPI',
    showSample:'Refresh live forecast',
    clearSample:'Clear forecast view',
    clearAssessment:'Clear result',
    timelineIntro:'Only source-validated Open-Meteo model hours are displayed. No sample or estimated weather is substituted.',
    weatherTruthDesc:'A live FastAPI service retrieves hourly Open-Meteo model data with source and age labels.',
    noTimeline:'Verified hours appear when the provider is available. No values are fabricated.',
    railFootText:'Live weather and FastAPI calculations are source-labeled. Farmer declarations are not independently measured.',
    feasCaution:'The connected Python engine validates declared units, blockers and confirmed changes; it does not certify field safety.',
    simDisclosure:'FastAPI evaluates user-declared constraints; this is not a crop safety or weather suitability certification.',
    noForecastLedger:'See the timestamped Open-Meteo model timeline on Page 02.',
    calculationEvidenceDesc:'Only server-validated FastAPI calculations count as actual results.',
    optionsDesc:'Only explicitly confirmed optional changes are evaluated; requested/unknown changes remain excluded.',
    replanStep2:'Recalculate the actual backend plan',
    noPackagesBody:'Submit confirmed options and evaluate through FastAPI.',
    selectPackage:'Select a server-returned conditional package.',
  });
  Object.assign(dict.mr,{
    runPreview:'FastAPI वापरून मूल्यमापन करा',
    showSample:'हवामान अंदाज पुन्हा मिळवा',
    clearSample:'हवामान दृश्य रिकामे करा',
    timelineIntro:'इथे फक्त स्रोत-पडताळणी झालेला हवामान अंदाज दाखवला जातो; कृत्रिम आकडे दाखवले जात नाहीत.',
    weatherTruthDesc:'FastAPI द्वारे स्रोत आणि वेळेसह Open-Meteo चा हवामान अंदाज मिळतो.',
    railFootText:'हवामान आणि गणना स्रोतांसह दाखवली जाते; शेतकऱ्याची नोंद स्वतंत्ररीत्या तपासलेली नाही.',
    simDisclosure:'FastAPI फक्त घोषित संसाधने आणि वेळ तपासते; शेती सुरक्षिततेचे प्रमाणपत्र नाही.',
  });
  Object.assign(dict.hi,{
    runPreview:'FastAPI से मूल्यांकन करें',
    showSample:'मौसम पूर्वानुमान अपडेट करें',
    clearSample:'मौसम दृश्य साफ करें',
    timelineIntro:'यहाँ केवल स्रोत-सत्यापित मौसम पूर्वानुमान दिखता है; कोई बनावटी आँकड़े नहीं दिखाए जाते।',
    weatherTruthDesc:'FastAPI से स्रोत और समय के साथ Open-Meteo का मौसम पूर्वानुमान आता है।',
    railFootText:'मौसम और गणना स्रोत सहित दिखते हैं; किसान की जानकारी स्वतंत्र रूप से सत्यापित नहीं है।',
    simDisclosure:'FastAPI केवल बताए गए संसाधनों और समय का आकलन करता है; यह कृषि सुरक्षा प्रमाणपत्र नहीं है।',
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
  changeLanguage();
  updateAllNew();
  void boot();
  if(location.pathname==='/interactive-review.html')history.replaceState({},'', '/');
})();