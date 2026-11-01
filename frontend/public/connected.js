/* Agri Foresight unified six-screen runtime. Uses only source-labelled FastAPI responses.
   No simulated weather, crop-safety thresholds, fabricated farmer data or AI claims. */
(() => {
  "use strict";
  const live={forecast:null,sources:null,health:null,evaluation:null,request:null,comparison:null,replan:null,selectedHour:null,selectedPackage:null,forecastLoading:false,error:null};
  const here=id=>document.getElementById(id);
  const evidenceStyle=document.createElement('link');
  evidenceStyle.rel='stylesheet';evidenceStyle.href='/model-evidence.css';
  document.head.append(evidenceStyle);
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
    renderForecastQuality();
    renderHourlyEvidence();
    here('weatherValue').textContent=live.forecast?(isCurrent()?'Model forecast '+(live.forecast.hours.length)+' h':live.forecast.status.toUpperCase()):'No verified forecast';
  };
  updateWeatherUI=renderWeather;

  // EX-08 — descriptive data-quality receipt for the genuine forecast,
  // separate from agronomic suitability, observed rainfall, and deadline advice.
  const qcPanel=el('section','panel source-qc-panel');
  qcPanel.id='forecastQualityPanel';
  qcPanel.setAttribute('aria-label','Forecast data coverage and export');
  qcPanel.append(el('h2','','Forecast evidence quality'));
  qcPanel.append(el('p','source-qc-disclosure',
    'Open-Meteo provides modeled weather, not a field rain gauge or a crop-safe onset threshold. Missing hours and missing values are never interpreted as dry weather.'));
  const qcMetrics=el('div','source-qc-metrics');
  qcMetrics.id='forecastQualityMetrics';qcMetrics.setAttribute('aria-live','polite');
  qcPanel.append(qcMetrics);
  const qcExport=el('button','btn','Export verified modeled hours (CSV)');
  qcExport.id='exportForecastEvidence';qcExport.type='button';qcExport.disabled=true;
  qcPanel.append(qcExport);
  qcPanel.append(el('small','source-qc-disclosure',
    'Export is available only for the supported Jalna pilot and a validated current model response. No farmer declarations are included.'));
  document.querySelector('section.section[data-page="1"]').append(qcPanel);
  function forecastCoverage(){
    if(!isCurrent())return null;
    const f=live.forecast;
    const ageMs=Date.now()-Date.parse(f.retrieved_at_utc||'');
    // Match the authoritative backend's two-hour STALE_AFTER_HOURS contract.
    // A wrongly labelled old cache must never become a "current" CSV receipt.
    if(!Number.isFinite(ageMs)||ageMs<0||ageMs>2*60*60*1000||
      !Array.isArray(f.hours)||!f.hours.length)return null;
    const timeKeys=f.hours.map(h=>Date.parse(h.time+':00+05:30'));
    if(timeKeys.some(t=>!Number.isFinite(t)))return null;
    const unique=new Set(timeKeys), sorted=[...unique].sort((a,b)=>a-b);
    const withinSpan=(sorted[sorted.length-1]-sorted[0])/3600000+1;
    const gapCount=withinSpan<=1000?Math.max(0,Math.round(withinSpan)-sorted.length):null;
    return {source:f,ageMinutes:Math.floor(ageMs/60000),records:f.hours.length,
      rainCount:f.hours.filter(h=>h.precipitation_mm!==null).length,
      chanceCount:f.hours.filter(h=>h.precipitation_probability_pct!==null).length,
      duplicateHours:f.hours.length-unique.size,gapCount};
  }

  // EX-09: inspect every returned model hour, not just the first 24 bars.
  // Values are already validated by FastAPI; no local weather prediction.
  const hourlyPanel=el('section','panel hourly-evidence-panel');
  hourlyPanel.id='hourlyEvidencePanel';
  hourlyPanel.setAttribute('aria-label','All verified modeled forecast hours');
  const hourlyTitle=el('h2','','Full model-hour timeline');
  const hourlyIntro=el('p','hourly-evidence-note',
    'Source-native modeled rain in millimeters and hourly probability, not observed rain or a crop-safety threshold.');
  const hourlyControls=el('div','hourly-evidence-controls');
  const hourlyLabel=el('label','hourly-evidence-filter');
  hourlyLabel.append(el('span','','Filter by model date (IST)'));
  const hourlyDate=el('select','hourly-evidence-select');hourlyDate.id='hourlyEvidenceDate';
  hourlyDate.setAttribute('aria-label','Filter hourly model evidence by Indian date');
  hourlyLabel.append(hourlyDate);hourlyControls.append(hourlyLabel);
  const hourlySummary=el('p','hourly-evidence-summary','No current verified model hours.');
  hourlySummary.id='hourlyEvidenceStatus';hourlySummary.setAttribute('role','status');
  hourlyControls.append(hourlySummary);
  const hourlyTableContainer=el('div','hourly-evidence-scroll');
  hourlyTableContainer.id='hourlyEvidenceTable';
  hourlyTableContainer.setAttribute('tabindex','0');
  hourlyTableContainer.setAttribute('aria-label','Horizontally scrollable forecast hour table');
  hourlyPanel.append(hourlyTitle,hourlyIntro,hourlyControls,hourlyTableContainer);
  qcPanel.insertAdjacentElement('afterend',hourlyPanel);
  hourlyDate.addEventListener('change',renderHourlyEvidence);
  function renderHourlyEvidence(){
    hourlyTableContainer.replaceChildren();
    const evidence=forecastCoverage(),source=evidence?.source;
    const hours=source?.hours||[];
    const distinctDates=[...new Set(hours.map(h=>h.time.slice(0,10)))];
    const retained=hourlyDate.value;
    hourlyDate.replaceChildren();
    const all=el('option','','All available model dates');all.value='all';hourlyDate.append(all);
    for(const date of distinctDates){
      const option=el('option','',date+' (IST)');option.value=date;hourlyDate.append(option);
    }
    hourlyDate.value=distinctDates.includes(retained)?retained:'all';
    hourlyDate.disabled=!evidence;
    if(!evidence){
      hourlySummary.textContent=okLocation()?
        'No eligible current model forecast. Refresh weather to inspect genuine source hours.':
        'Hourly model data is unavailable for locations outside the Jalna pilot.';
      hourlyTableContainer.append(el('p','hourly-evidence-note','Unavailable, expired and unsupported sources never display sample data.'));
      return;
    }
    const filtered=hours.filter(h=>hourlyDate.value==='all'||h.time.startsWith(hourlyDate.value));
    hourlySummary.textContent='Displaying '+filtered.length+' of '+hours.length+
      ' authenticated model hour record(s); all times are IST. Each selected hour is only a proposed planning deadline.';
    const table=el('table','hourly-evidence-table');
    const head=el('thead'),heading=el('tr');
    for(const value of ['Model hour · IST','Modeled rain · mm','Model rain probability · %','Planning action']){
      const th=el('th','',value);th.scope='col';heading.append(th);
    }
    head.append(heading);table.append(head);
    const body=el('tbody');
    for(const hour of filtered){
      const tr=el('tr');
      const timeCell=el('th','',hour.time.replace('T',' '));timeCell.scope='row';
      tr.append(timeCell);
      tr.append(el('td','',hour.precipitation_mm===null?'Unavailable':num(hour.precipitation_mm)+' mm'));
      tr.append(el('td','',hour.precipitation_probability_pct===null?'Unavailable':
        num(hour.precipitation_probability_pct)+'%'));
      const actionCell=el('td');
      const action=el('button','btn hourly-evidence-action','Use as proposed deadline');
      action.type='button';action.dataset.hour=hour.time;
      const validFuture=Number.isFinite(Date.parse(hour.time+':00+05:30'))&&
        Date.parse(hour.time+':00+05:30')>Date.now()+60000;
      action.disabled=!validFuture;
      action.setAttribute('aria-label','Use '+hour.time.replace('T',' ')+' IST as a proposed, not verified-safe, planning deadline');
      if(!validFuture)action.title='Past/current model hours cannot be selected as future deadlines.';
      action.addEventListener('click',()=>{
        const fresh=forecastCoverage();
        const stamp=Date.parse(hour.time+':00+05:30');
        if(!fresh||!fresh.source.hours.some(h=>h.time===hour.time)||
          !Number.isFinite(stamp)||stamp<=Date.now()+60000){
          renderWeather();
          here('deadlineNotice').textContent='The model hour is no longer valid. Refresh the forecast before selecting another.';
          return;
        }
        here('deadlineInput').value=hour.time;
        live.selectedHour=hour.time;
        additional.deadlineSource='model';
        here('deadlineOriginPreview').textContent='Proposed hour chosen from source-validated Open-Meteo model evidence. Not a safe-rain threshold.';
        here('deadlineNotice').textContent='Model hour selected. Click Save candidate deadline to confirm this assumption.';
      });
      actionCell.append(action);tr.append(actionCell);body.append(tr);
    }
    table.append(body);hourlyTableContainer.append(table);
  }
  function renderForecastQuality(){
    qcMetrics.replaceChildren();
    const d=forecastCoverage();
    qcExport.disabled=!d;
    if(!d){
      qcMetrics.append(el('p','source-qc-empty',
        okLocation()?'No validated current model readings to audit or export. Refresh the forecast to retrieve genuine evidence.':
          'Not available for this location. Jalna, Maharashtra is the only supported pilot.'));
      return;
    }
    const add=(label,value)=>{
      const item=el('div','source-qc-item');item.append(el('strong','',label),el('span','',value));
      qcMetrics.append(item);
    };
    add('Provenance',d.source.status==='cached_recent'?'Recent backend-validated model cache':'Backend-retrieved model forecast');
    add('Retrieved (UTC)',d.source.retrieved_at_utc);
    add('Elapsed since retrieval',d.ageMinutes+' minute(s), calculated from the provided timestamp');
    add('Reported hourly records',String(d.records));
    add('Rainfall values',d.rainCount+'/'+d.records+' hours reported a modeled millimeter value');
    add('Rain-probability values',d.chanceCount+'/'+d.records+' hours reported a model probability');
    add('Timestamp duplicates',String(d.duplicateHours)+' duplicate record(s)');
    add('Hourly timestamp gaps',d.gapCount===null?'Range too long to verify in this view':String(d.gapCount)+' absent hourly position(s)');
  }
  qcExport.addEventListener('click',()=>{
    const d=forecastCoverage();
    if(!d||qcExport.disabled)return;
    const source=d.source;
    const headers=['hour_ist','modeled_precipitation_mm','modeled_precipitation_probability_pct',
      'source_type','source_attribution','source_status','retrieved_at_utc','data_disclosure'];
    const quote=value=>{
      let text=String(value??'');
      if(/^\s*[=+\-@\t\r]/.test(text))text="'"+text;
      return '"'+text.replace(/"/g,'""')+'"';
    };
    const numberCell=value=>typeof value==='number'&&Number.isFinite(value)?String(value):'';
    const lines=source.hours.map(h=>[
      quote(h.time),numberCell(h.precipitation_mm),numberCell(h.precipitation_probability_pct),
      quote('external_model_forecast'),quote(source.attribution||'Open-Meteo'),
      quote(source.status),quote(source.retrieved_at_utc),
      quote('Model values, not a station observation or crop-safety threshold')
    ].join(','));
    const csv='\uFEFF'+headers.join(',')+'\r\n'+lines.join('\r\n')+'\r\n';
    const uri=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=el('a');link.href=uri;
    link.download='agri-foresight-open-meteo-jalna-'+
      new Date().toISOString().slice(0,10)+'.csv';
    link.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
  });
  function renderWeather(){
    renderForecastQuality();
    renderHourlyEvidence();
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
      replan:live.replan,selected_package:live.selectedPackage,request:live.request,
      government_climate_historical:governmentClimateData};
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
  govActions.append(govRefresh,govRange,govDownload,govStatus);
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
    govSummary.textContent='';
    govRows.replaceChildren();
    if(!okLocation()){
      govStatus.textContent='Unavailable for selected location';
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
      renderGovernmentClimate(data);
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
    }finally{if(token===governmentClimateRequest)govRefresh.disabled=false;}
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
  let governmentLocation=state.place.city+'|'+state.place.state;
  const updateSummaryAndLocation=updateSummaries;
  updateSummaries=function(){
    const place=state.place.city+'|'+state.place.state;
    updateSummaryAndLocation();
    if(place!==governmentLocation){
      governmentLocation=place;
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