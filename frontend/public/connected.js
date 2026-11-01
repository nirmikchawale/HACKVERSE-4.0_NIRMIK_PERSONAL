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

  // EX-09B: page-local translations; values never change numeric source facts.
  const evidenceLanguages={
    en:{
      dayExportNote:'Choose one IST date to export only those verified model hours.',
      dayExport:'Export selected day (CSV)',
      qualityTitle:'Forecast evidence quality',
      qualityIntro:'Open-Meteo provides modeled weather, not a field rain gauge or a crop-safe onset threshold. Missing hours and missing values are never interpreted as dry weather.',
      qualityExport:'Export verified modeled hours (CSV)',
      qualityFoot:'Export is available only for the supported Jalna pilot and a validated current model response. No farmer declarations are included.',
      qualityMissing:'No validated current model readings to audit or export. Refresh the forecast to retrieve genuine evidence.',
      qualityUnsupported:'Not available for this location. Jalna, Maharashtra is the only supported pilot.',
      provenance:'Provenance',retrieved:'Retrieved (UTC)',elapsed:'Elapsed since retrieval',
      reported:'Reported hourly records',rainCount:'Rainfall values',chanceCount:'Rain-probability values',
      duplicates:'Timestamp duplicates',gaps:'Hourly timestamp gaps',
      cached:'Recent backend-validated model cache',fetched:'Backend-retrieved model forecast',
      minutes:'minute(s), calculated from the provided timestamp',
      rainValues:'hours reported a modeled millimeter value',chanceValues:'hours reported a model probability',
      duplicateUnits:'duplicate record(s)',gapUnits:'absent hourly position(s)',
      gapLong:'Range too long to verify in this view',
      timeline:'Full model-hour timeline',timelineIntro:'Source-native modeled rain in millimeters and hourly probability, not observed rain or a crop-safety threshold.',
      filter:'Filter by model date (IST)',allDates:'All available model dates',dateSuffix:'(IST)',
      timeHeader:'Model hour · IST',rainHeader:'Modeled rain · mm',chanceHeader:'Model rain probability · %',actionHeader:'Planning action',
      hourAction:'Use as proposed deadline',unavailable:'Unavailable',pastHour:'Past/current model hours cannot be selected as future deadlines.',
      hourlyNoData:'No eligible current model forecast. Refresh weather to inspect genuine source hours.',
      hourlyWrongPlace:'Hourly model data is unavailable for locations outside the Jalna pilot.',
      hourlyEmpty:'Unavailable, expired and unsupported sources never display sample data.',
      showing:'Displaying',of:'of',records:'authenticated model hour record(s); all times are IST. Each selected hour is only a proposed planning deadline.',
      selected:'Model hour selected. Click Save candidate deadline to confirm this assumption.',
      selectedSource:'Proposed hour chosen from source-validated Open-Meteo model evidence. Not a safe-rain threshold.',
      expiredHour:'The model hour is no longer valid. Refresh the forecast before selecting another.'
    },
    mr:{
      dayExportNote:'फक्त त्या दिवसाचे पडताळलेले मॉडेल तास मिळवण्यासाठी IST दिवस निवडा.',
      dayExport:'निवडलेल्या दिवसाचा CSV घ्या',
      qualityTitle:'हवामान अंदाजाच्या पुराव्याची गुणवत्ता',
      qualityIntro:'Open-Meteo चे हवामान आकडे हे मॉडेलचे अंदाज आहेत; शेतातील मोजमाप किंवा सुरक्षित पावसाची वेळ नाही. नसलेला डेटा म्हणजे पाऊस शून्य असा अर्थ नाही.',
      qualityExport:'पडताळलेल्या हवामान अंदाजाचा CSV घ्या',
      qualityFoot:'फक्त जालना आणि पडताळलेल्या ताज्या मॉडेल अंदाजासाठी निर्यात उपलब्ध आहे. शेतकऱ्याची वैयक्तिक माहिती यात नाही.',
      qualityMissing:'सध्या पडताळलेला ताजा अंदाज नाही. वास्तविक डेटा मिळवण्यासाठी अंदाज पुन्हा मिळवा.',
      qualityUnsupported:'या ठिकाणासाठी उपलब्ध नाही. हा पायलट फक्त जालना, महाराष्ट्र येथे चालतो.',
      provenance:'माहितीचा स्रोत',retrieved:'मिळाल्याची वेळ (UTC)',elapsed:'मिळाल्यापासूनचा कालावधी',
      reported:'नोंदवलेले तास',rainCount:'पावसाचे उपलब्ध आकडे',chanceCount:'पावसाच्या शक्यतेचे आकडे',
      duplicates:'सारखी वेळ पुन्हा',gaps:'तासांच्या नोंदीतील अंतर',
      cached:'अलीकडे पडताळलेला मॉडेल कॅश',fetched:'Backend कडून मिळालेला मॉडेल अंदाज',
      minutes:'मिनिटे; स्रोताच्या वेळेवरून मोजलेले',
      rainValues:'तासांसाठी मॉडेल पावसाचे मिमी आकडे',chanceValues:'तासांसाठी मॉडेल पावसाची शक्यता',
      duplicateUnits:'दुबार नोंदी',gapUnits:'नसलेल्या तासांच्या नोंदी',
      gapLong:'या दृश्यात वेळेची व्याप्ती तपासता येत नाही',
      timeline:'सर्व तासांचा हवामान अंदाज',
      timelineIntro:'मॉडेलनुसार प्रत्येक तासातील पाऊस (मिमी) व शक्यता; हे प्रत्यक्ष निरीक्षण किंवा सुरक्षिततेचे प्रमाणपत्र नाही.',
      filter:'मॉडेलचा दिवस निवडा (IST)',allDates:'सर्व उपलब्ध दिवस',dateSuffix:'(IST)',
      timeHeader:'मॉडेलचा तास · IST',rainHeader:'अंदाजित पाऊस · मिमी',chanceHeader:'पावसाची शक्यता · %',actionHeader:'नियोजनाची कृती',
      hourAction:'नियोजनाची वेळ निवडा',unavailable:'उपलब्ध नाही',
      pastHour:'गेलेला किंवा सध्याचा तास भविष्यातील अंतिम वेळ म्हणून वापरता येत नाही.',
      hourlyNoData:'सध्या ताजा पडताळलेला मॉडेल अंदाज नाही. खरा डेटा मिळवण्यासाठी हवामान पुन्हा मिळवा.',
      hourlyWrongPlace:'जालना व्यतिरिक्त ठिकाणांसाठी तासांचा अंदाज उपलब्ध नाही.',
      hourlyEmpty:'नसलेला किंवा कालबाह्य डेटा असल्यास नमुन्याचे बनावट आकडे दाखवत नाही.',
      showing:'दाखवत आहे',of:'एकूण',records:'पडताळलेल्या तासांच्या नोंदी; सर्व वेळा IST आहेत. निवडलेली वेळ ही केवळ नियोजनासाठी आहे.',
      selected:'मॉडेलचा तास निवडला. ही वेळ जतन करण्यासाठी Save candidate deadline दाबा.',
      selectedSource:'Open-Meteo मॉडेलमधून निवडलेली संभाव्य वेळ; हा सुरक्षित पावसाचा निकष नाही.',
      expiredHour:'निवडलेली वेळ आता वैध नाही. हवामान अंदाज पुन्हा मिळवा.'
    },
    hi:{
      dayExportNote:'केवल उस तारीख के सत्यापित मॉडल घंटे पाने के लिए IST तारीख चुनें.',
      dayExport:'चुनी गई तारीख का CSV लें',
      qualityTitle:'मौसम पूर्वानुमान साक्ष्य की गुणवत्ता',
      qualityIntro:'Open-Meteo के आँकड़े मॉडल पूर्वानुमान हैं, खेत के माप या सुरक्षित वर्षा की सीमा नहीं। लापता जानकारी को शून्य वर्षा नहीं माना जाता।',
      qualityExport:'सत्यापित मौसम पूर्वानुमान CSV लें',
      qualityFoot:'निर्यात केवल जालना के ताज़ा सत्यापित मॉडल डेटा के लिए है। इसमें किसान की निजी जानकारी नहीं है।',
      qualityMissing:'अभी कोई ताज़ा सत्यापित मॉडल डेटा नहीं है। वास्तविक डेटा के लिए पूर्वानुमान रीफ़्रेश करें।',
      qualityUnsupported:'इस स्थान के लिए उपलब्ध नहीं। पायलट केवल जालना, महाराष्ट्र के लिए है।',
      provenance:'जानकारी का स्रोत',retrieved:'प्राप्ति समय (UTC)',elapsed:'प्राप्ति के बाद बीता समय',
      reported:'रिपोर्ट किए गए घंटे',rainCount:'वर्षा के उपलब्ध आँकड़े',chanceCount:'वर्षा संभावना के आँकड़े',
      duplicates:'दोहराए गए समय',gaps:'घंटों की अनुपस्थित प्रविष्टियाँ',
      cached:'हाल में सत्यापित मॉडल कैश',fetched:'Backend से प्राप्त मॉडल पूर्वानुमान',
      minutes:'मिनट; स्रोत के समय से गणना',
      rainValues:'घंटों के लिए मॉडल वर्षा के मिमी मान',chanceValues:'घंटों के लिए मॉडल वर्षा संभावना',
      duplicateUnits:'दोहराई गई प्रविष्टियाँ',gapUnits:'अनुपस्थित घंटे',
      gapLong:'इस दृश्य में इतनी लंबी अवधि सत्यापित नहीं की जा सकती',
      timeline:'सभी घंटों का मौसम पूर्वानुमान',
      timelineIntro:'मॉडल के अनुसार प्रत्येक घंटे में वर्षा (मिमी) और संभावना; न कि वास्तविक माप या सुरक्षित कृषि समय।',
      filter:'मॉडल की तारीख चुनें (IST)',allDates:'सभी उपलब्ध तारीखें',dateSuffix:'(IST)',
      timeHeader:'मॉडल घंटा · IST',rainHeader:'मॉडल वर्षा · मिमी',chanceHeader:'वर्षा संभावना · %',actionHeader:'नियोजन विकल्प',
      hourAction:'प्रस्तावित समय चुनें',unavailable:'उपलब्ध नहीं',
      pastHour:'बीता या वर्तमान घंटा भविष्य की समय-सीमा नहीं हो सकता।',
      hourlyNoData:'अभी कोई ताज़ा सत्यापित मॉडल घंटा नहीं है। वास्तविक डेटा के लिए मौसम रीफ़्रेश करें।',
      hourlyWrongPlace:'जालना से बाहर के स्थानों के लिए यह घंटेवार मॉडल उपलब्ध नहीं है।',
      hourlyEmpty:'अनुपलब्ध या पुराने डेटा की जगह काल्पनिक आँकड़े नहीं दिखाए जाते।',
      showing:'दिखा रहे हैं',of:'कुल',records:'सत्यापित घंटे; सभी समय IST में हैं। चुना घंटा केवल प्रस्तावित नियोजन समय है।',
      selected:'मॉडल घंटा चुना गया। पुष्टि के लिए Save candidate deadline दबाएँ।',
      selectedSource:'सत्यापित Open-Meteo मॉडल से चुना प्रस्तावित घंटा; सुरक्षित वर्षा की सीमा नहीं।',
      expiredHour:'यह घंटा अब मान्य नहीं है। नया पूर्वानुमान लाएँ।'
    }
  };
  const evidenceText=k=>(evidenceLanguages[state.lang]||evidenceLanguages.en)[k]||evidenceLanguages.en[k]||k;

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
  // The Python backend's STALE_AFTER_HOURS is 2. A stale-but-mislabeled
  // response must never make interactive forecast deadlines look current.
  const forecastAgeMilliseconds=()=>Date.now()-Date.parse(live.forecast?.retrieved_at_utc||'');
  const isCurrent=()=>{
    if(!okLocation()||!['retrieved_live','cached_recent'].includes(live.forecast?.status))return false;
    const age=forecastAgeMilliseconds();
    return Number.isFinite(age)&&age>=0&&age<=2*60*60*1000;
  };
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
  const hourlyDayExport=el('button','btn','Export selected day (CSV)');
  hourlyDayExport.id='exportSelectedModelDay';hourlyDayExport.type='button';hourlyDayExport.disabled=true;
  hourlyControls.append(hourlyDayExport);
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
    hourlyTitle.textContent=evidenceText('timeline');hourlyIntro.textContent=evidenceText('timelineIntro');
    hourlyLabel.querySelector('span').textContent=evidenceText('filter');
    hourlyDayExport.textContent=evidenceText('dayExport');
    hourlyTableContainer.replaceChildren();
    const evidence=forecastCoverage(),source=evidence?.source;
    const hours=source?.hours||[];
    const distinctDates=[...new Set(hours.map(h=>h.time.slice(0,10)))];
    const retained=hourlyDate.value;
    hourlyDate.replaceChildren();
    const all=el('option','',evidenceText('allDates'));all.value='all';hourlyDate.append(all);
    for(const date of distinctDates){
      const option=el('option','',date+' '+evidenceText('dateSuffix'));option.value=date;hourlyDate.append(option);
    }
    hourlyDate.value=distinctDates.includes(retained)?retained:'all';
    hourlyDate.disabled=!evidence;
    hourlyDayExport.disabled=!evidence||hourlyDate.value==='all';
    hourlyDayExport.title=evidenceText('dayExportNote');
    if(!evidence){
      hourlySummary.textContent=okLocation()?evidenceText('hourlyNoData'):evidenceText('hourlyWrongPlace');
      hourlyTableContainer.append(el('p','hourly-evidence-note',evidenceText('hourlyEmpty')));
      return;
    }
    const filtered=hours.filter(h=>hourlyDate.value==='all'||h.time.startsWith(hourlyDate.value));
    hourlySummary.textContent=evidenceText('showing')+' '+filtered.length+' '+evidenceText('of')+' '+hours.length+' '+evidenceText('records');
    const table=el('table','hourly-evidence-table');
    const head=el('thead'),heading=el('tr');
    for(const value of ['timeHeader','rainHeader','chanceHeader','actionHeader'].map(evidenceText)){
      const th=el('th','',value);th.scope='col';heading.append(th);
    }
    head.append(heading);table.append(head);
    const body=el('tbody');
    for(const hour of filtered){
      const tr=el('tr');
      const timeCell=el('th','',hour.time.replace('T',' '));timeCell.scope='row';
      tr.append(timeCell);
      tr.append(el('td','',hour.precipitation_mm===null?evidenceText('unavailable'):num(hour.precipitation_mm)+' mm'));
      tr.append(el('td','',hour.precipitation_probability_pct===null?evidenceText('unavailable'):
        num(hour.precipitation_probability_pct)+'%'));
      const actionCell=el('td');
      const action=el('button','btn hourly-evidence-action',evidenceText('hourAction'));
      action.type='button';action.dataset.hour=hour.time;
      const validFuture=Number.isFinite(Date.parse(hour.time+':00+05:30'))&&
        Date.parse(hour.time+':00+05:30')>Date.now()+60000;
      action.disabled=!validFuture;
      action.setAttribute('aria-label','Use '+hour.time.replace('T',' ')+' IST as a proposed, not verified-safe, planning deadline');
      if(!validFuture)action.title=evidenceText('pastHour');
      action.addEventListener('click',()=>{
        const fresh=forecastCoverage();
        const stamp=Date.parse(hour.time+':00+05:30');
        if(!fresh||!fresh.source.hours.some(h=>h.time===hour.time)||
          !Number.isFinite(stamp)||stamp<=Date.now()+60000){
          renderWeather();
          here('deadlineNotice').textContent=evidenceText('expiredHour');
          return;
        }
        here('deadlineInput').value=hour.time;
        live.selectedHour=hour.time;
        additional.deadlineSource='model';
        here('deadlineOriginPreview').textContent=evidenceText('selectedSource');
        here('deadlineNotice').textContent=evidenceText('selected');
      });
      actionCell.append(action);tr.append(actionCell);body.append(tr);
    }
    table.append(body);hourlyTableContainer.append(table);
  }

  hourlyDayExport.addEventListener('click',()=>{
    const evidence=forecastCoverage();
    const date=hourlyDate.value;
    if(!evidence||hourlyDayExport.disabled||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    const rows=evidence.source.hours.filter(h=>h.time.startsWith(date));
    if(!rows.length)return;
    const safe=value=>{
      let content=String(value??'');
      if(/^\s*[=+\-@\t\r]/.test(content))content="'"+content;
      return '"'+content.replace(/"/g,'""')+'"';
    };
    const numValue=value=>typeof value==='number'&&Number.isFinite(value)?String(value):'';
    const cols=['hour_ist','modeled_precipitation_mm','modeled_probability_pct',
      'source_type','source_attribution','source_status','retrieved_at_utc','evidence_disclosure'];
    const lines=rows.map(h=>[
      safe(h.time),numValue(h.precipitation_mm),numValue(h.precipitation_probability_pct),
      safe('external_model_forecast'),safe(evidence.source.attribution||'Open-Meteo'),
      safe(evidence.source.status),safe(evidence.source.retrieved_at_utc),
      safe('Selected-day source-native model hours only; not measured rainfall or agricultural safety')
    ].join(','));
    const data='\uFEFF'+cols.join(',')+'\r\n'+lines.join('\r\n')+'\r\n';
    const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
    const link=el('a');link.href=url;
    link.download='agri-foresight-model-hours-jalna-'+date+'.csv';
    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  function renderForecastQuality(){
    qcPanel.querySelector('h2').textContent=evidenceText('qualityTitle');
    qcPanel.querySelector('p.source-qc-disclosure').textContent=evidenceText('qualityIntro');
    qcExport.textContent=evidenceText('qualityExport');
    qcPanel.querySelector('small.source-qc-disclosure').textContent=evidenceText('qualityFoot');
    qcMetrics.replaceChildren();
    const d=forecastCoverage();
    qcExport.disabled=!d;
    if(!d){
      qcMetrics.append(el('p','source-qc-empty',
        okLocation()?evidenceText('qualityMissing'):evidenceText('qualityUnsupported')));
      return;
    }
    const add=(label,value)=>{
      const item=el('div','source-qc-item');item.append(el('strong','',label),el('span','',value));
      qcMetrics.append(item);
    };
    add(evidenceText('provenance'),d.source.status==='cached_recent'?evidenceText('cached'):evidenceText('fetched'));
    add(evidenceText('retrieved'),d.source.retrieved_at_utc);
    add(evidenceText('elapsed'),d.ageMinutes+' '+evidenceText('minutes'));
    add(evidenceText('reported'),String(d.records));
    add(evidenceText('rainCount'),d.rainCount+'/'+d.records+' '+evidenceText('rainValues'));
    add(evidenceText('chanceCount'),d.chanceCount+'/'+d.records+' '+evidenceText('chanceValues'));
    add(evidenceText('duplicates'),String(d.duplicateHours)+' '+evidenceText('duplicateUnits'));
    add(evidenceText('gaps'),d.gapCount===null?evidenceText('gapLong'):
      String(d.gapCount)+' '+evidenceText('gapUnits'));
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
      const old=Number.isFinite(forecastAgeMilliseconds())&&forecastAgeMilliseconds()>2*60*60*1000;
      chip.textContent=f.status==='stale_cache'||old?'STALE · DO NOT USE':'UNAVAILABLE';
      mode.textContent=old?'Model forecast age exceeds the backend two-hour current-data limit. Refresh to retrieve genuine evidence.':
        f.notice||f.error||'No current verified forecast available';
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
      const at=Date.parse(h.time+':00+05:30');
      const candidateFuture=Number.isFinite(at)&&at>Date.now()+60_000;
      b.disabled=!candidateFuture;
      if(!candidateFuture)b.title='Past/current model hour · for evidence only, not a future planning deadline.';
      const time=el('span','bar-time',h.time.slice(11));const fill=el('span','bar-fill');fill.style.height=Math.max(5,Math.round(95*(h.precipitation_mm??0)/max))+'%';
      const value=el('span','bar-value',(h.precipitation_mm??'—')+' mm');const chance=el('small','',h.precipitation_probability_pct===null?'Probability unknown':h.precipitation_probability_pct+'%');
      b.append(time,fill,value,chance);b.addEventListener('click',()=>{
        const then=Date.parse(h.time+':00+05:30');
        if(!isCurrent()||!live.forecast?.hours.some(row=>row.time===h.time)||
          !Number.isFinite(then)||then<=Date.now()+60_000){
          renderWeather();
          here('deadlineNotice').textContent='That model hour is no longer an eligible future candidate. Refresh genuine weather evidence.';
          return;
        }
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

  // EX-11: translate presentation only; NASA source name, units, numbers and
  // downloaded raw JSON remain exact, unmodified government data.
  const historyLanguage={
    en:{
      title:'Government climate evidence · NASA POWER',
      intro:'Historical daily gridded rainfall and temperature from NASA (US government). Not live observed rainfall, a future forecast, or a measurement at your farm.',
      refresh:'Refresh official data',fetching:'Contacting NASA POWER…',
      range:'Government history display range',seven:'Latest 7 available days',all:'All available days',
      download:'Download verified NASA JSON',
      grid:'NASA historical grid',days:'available calendar days',rain:'Rainfall',rainUnknown:'Rainfall: unavailable',
      air:'Mean air temperature',airUnknown:'Air temperature unavailable',dayUnit:'days with values',
      avg:'Mean of available daily temperatures',dayRain:'mm/day',historic:'These are arithmetic summaries of historical government grid values, NOT operational forecasts.',
      retrieved:'Verified government response',cached:'Verified recent response',historyDays:'historical days',
      unsupported:'Unavailable for selected location',unsupportedIntro:'Official Jalna reference data cannot be applied to the selected place.',
      unsupportedDetail:'Switch to Jalna, Maharashtra to retrieve its government historical context.',
      unavailable:'Official source unavailable',unavailableIntro:'NASA POWER unavailable. No values are shown.',
      invalid:'Could not verify official data',invalidIntro:'No government climate values displayed',
      invalidDetail:'Only verified NASA POWER responses are eligible; no offline example is substituted.',
      source:'Source',latest:'Latest provided day',retrievedUtc:'Retrieved (UTC)'
    },
    mr:{
      title:'सरकारी ऐतिहासिक हवामान माहिती · NASA POWER',
      intro:'NASA (अमेरिकन सरकार) कडील मागील दिवसांचा ग्रीड-आधारित पाऊस आणि तापमान. हे शेतातील थेट मोजमाप, भविष्यातील अंदाज किंवा सुरक्षिततेचे प्रमाणपत्र नाही.',
      refresh:'सरकारी माहिती पुन्हा मिळवा',fetching:'NASA POWER शी संपर्क सुरू…',
      range:'ऐतिहासिक दिवसांची व्याप्ती',seven:'अलीकडील ७ उपलब्ध दिवस',all:'सर्व उपलब्ध दिवस',
      download:'पडताळलेला NASA JSON घ्या',
      grid:'NASA ऐतिहासिक ग्रीड',days:'उपलब्ध दिवस',rain:'पाऊस',rainUnknown:'पावसाचा डेटा उपलब्ध नाही',
      air:'सरासरी हवेचे तापमान',airUnknown:'तापमान उपलब्ध नाही',dayUnit:'मूल्य असलेले दिवस',
      avg:'उपलब्ध दिवसांचे सरासरी तापमान',dayRain:'मिमी/दिवस',
      historic:'ही ऐतिहासिक सरकारी ग्रीडमधील अंकगणितीय माहिती आहे; भविष्यातील अंदाज नाही.',
      retrieved:'पडताळलेला सरकारी डेटा',cached:'अलीकडे पडताळलेला डेटा',historyDays:'ऐतिहासिक दिवस',
      unsupported:'या ठिकाणासाठी उपलब्ध नाही',unsupportedIntro:'जालना येथील माहिती इतर ठिकाणाला लागू करता येत नाही.',
      unsupportedDetail:'जालना, महाराष्ट्र निवडल्यानंतरच येथील ऐतिहासिक माहिती मिळेल.',
      unavailable:'सरकारी स्रोत सध्या उपलब्ध नाही',unavailableIntro:'NASA POWER उपलब्ध नाही. कोणतीही बनावट मूल्ये दाखवलेली नाहीत.',
      invalid:'सरकारी माहिती पडताळता आली नाही',invalidIntro:'सरकारी आकडे दाखवू शकत नाही',
      invalidDetail:'फक्त पडताळलेला NASA POWER डेटा वापरता येतो; कृत्रिम उदाहरणे नाहीत.',
      source:'स्रोत',latest:'उपलब्ध शेवटचा दिवस',retrievedUtc:'माहिती मिळाल्याची वेळ (UTC)'
    },
    hi:{
      title:'सरकारी ऐतिहासिक मौसम जानकारी · NASA POWER',
      intro:'NASA (अमेरिकी सरकार) से पिछले दिनों की ग्रिड-आधारित वर्षा और तापमान। यह खेत पर वास्तविक माप, भविष्य का पूर्वानुमान या सुरक्षा प्रमाणपत्र नहीं है।',
      refresh:'सरकारी डेटा फिर प्राप्त करें',fetching:'NASA POWER से संपर्क हो रहा है…',
      range:'ऐतिहासिक दिनों की सीमा',seven:'हाल के ७ उपलब्ध दिन',all:'सभी उपलब्ध दिन',
      download:'सत्यापित NASA JSON डाउनलोड करें',
      grid:'NASA ऐतिहासिक ग्रिड',days:'उपलब्ध दिन',rain:'वर्षा',rainUnknown:'वर्षा जानकारी उपलब्ध नहीं',
      air:'औसत वायु तापमान',airUnknown:'तापमान उपलब्ध नहीं',dayUnit:'मान वाले दिन',
      avg:'उपलब्ध दिनों का औसत तापमान',dayRain:'मिमी/दिन',
      historic:'यह सरकारी ऐतिहासिक ग्रिड का गणितीय सारांश है, भविष्य का मौसम पूर्वानुमान नहीं।',
      retrieved:'सत्यापित सरकारी जानकारी',cached:'हाल में सत्यापित जानकारी',historyDays:'ऐतिहासिक दिन',
      unsupported:'इस स्थान के लिए उपलब्ध नहीं',unsupportedIntro:'जालना की ऐतिहासिक जानकारी दूसरे स्थान पर लागू नहीं की जा सकती।',
      unsupportedDetail:'ऐतिहासिक संदर्भ देखने के लिए जालना, महाराष्ट्र चुनें।',
      unavailable:'सरकारी स्रोत उपलब्ध नहीं',unavailableIntro:'NASA POWER उपलब्ध नहीं। कोई काल्पनिक मान नहीं दिखाए जाते।',
      invalid:'सरकारी डेटा सत्यापित नहीं हुआ',invalidIntro:'सरकारी मान नहीं दिखा सकते',
      invalidDetail:'केवल सत्यापित NASA POWER परिणाम स्वीकार हैं; कोई नकली उदाहरण नहीं।',
      source:'स्रोत',latest:'उपलब्ध अंतिम दिन',retrievedUtc:'प्राप्ति समय (UTC)'
    }
  };
  const historyText=k=>(historyLanguage[state.lang]||historyLanguage.en)[k]||historyLanguage.en[k]||k;
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
  let governmentClimateVisibleState='loading';
  let governmentClimateErrorMessage='';
  function translateGovernmentPanel(){
    govTitle.textContent=historyText('title');
    govIntro.textContent=historyText('intro');
    govRefresh.textContent=govRefresh.disabled?historyText('fetching'):historyText('refresh');
    govRange.setAttribute('aria-label',historyText('range'));
    optSeven.textContent=historyText('seven');
    optAll.textContent=historyText('all');
    govDownload.textContent=historyText('download');
    if(governmentClimateData&&okLocation()){
      govStatus.textContent=(governmentClimateData.status==='cached_recent'?
        historyText('cached'):historyText('retrieved'))+' · '+
        governmentClimateData.days.length+' '+historyText('historyDays');
      renderGovernmentClimate(governmentClimateData);
      govDetail.replaceChildren();
      const sourceLink=el('a','','NASA POWER official daily API');
      sourceLink.href='https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
      sourceLink.rel='noopener noreferrer';sourceLink.target='_blank';
      govDetail.append(historyText('source')+': ',sourceLink,' · '+historyText('latest')+': '+
        governmentClimateData.latest_data_date+' · '+historyText('retrievedUtc')+': '+
        governmentClimateData.retrieved_at_utc+'. '+governmentClimateData.notice);
      return;
    }
    if(!okLocation()){
      govStatus.textContent=historyText('unsupported');
      govRows.replaceChildren(el('p','gov-intro',historyText('unsupportedIntro')));
      govDetail.textContent=historyText('unsupportedDetail');
    }else if(governmentClimateVisibleState==='unavailable'){
      govStatus.textContent=historyText('unavailable');
      govRows.replaceChildren(el('p','gov-intro',
        historyText('unavailableIntro')+(governmentClimateErrorMessage?' · '+governmentClimateErrorMessage:'')));
    }else if(governmentClimateVisibleState==='invalid'){
      govStatus.textContent=historyText('invalid');
      govRows.replaceChildren(el('p','gov-intro',historyText('invalidIntro')+
        (governmentClimateErrorMessage?': '+governmentClimateErrorMessage:'')));
      govDetail.textContent=historyText('invalidDetail');
    }else if(governmentClimateVisibleState==='loading'){
      govStatus.textContent=historyText('fetching');
    }
  }
  function renderGovernmentClimate(data){
    govRows.replaceChildren();
    const count=govRange.value==='all'?data.days.length:7;
    const items=data.days.slice(-count);
    const rain=items.filter(x=>x.precipitation_mm_day!==null);
    const air=items.filter(x=>x.temperature_c!==null);
    govSummary.textContent=historyText('grid')+', '+items.length+' '+historyText('days')+' · '+
      (rain.length?historyText('rain')+': '+num(rain.reduce((n,x)=>n+x.precipitation_mm_day,0))+
        ' mm ('+rain.length+'/'+items.length+' '+historyText('dayUnit')+')':historyText('rainUnknown'))+
      ' · '+(air.length?historyText('avg')+': '+
        num(air.reduce((n,x)=>n+x.temperature_c,0)/air.length)+' °C ('+
        air.length+'/'+items.length+' '+historyText('dayUnit')+')':historyText('airUnknown'))+
      '. '+historyText('historic');
    for(const item of [...items].reverse()){
      const card=el('article','gov-day');
      const date=el('time','',item.date);date.dateTime=item.date;
      card.append(date,
        el('b','',item.precipitation_mm_day===null?historyText('rainUnknown'):
          historyText('rain')+': '+num(item.precipitation_mm_day)+' '+historyText('dayRain')),
        el('small','',item.temperature_c===null?historyText('airUnknown'):
          historyText('air')+': '+num(item.temperature_c)+' °C'));
      govRows.append(card);
    }
  }
  async function loadGovernmentClimate(refresh=false){
    const token=++governmentClimateRequest;
    governmentClimateData=null;governmentClimateVisibleState='loading';governmentClimateErrorMessage='';
    govDownload.disabled=true;
    govSummary.textContent='';
    govRows.replaceChildren();
    if(!okLocation()){
      governmentClimateVisibleState='unsupported';
      govStatus.textContent=historyText('unsupported');
      govRows.append(el('p','gov-intro',historyText('unsupportedIntro')));
      govDetail.textContent=historyText('unsupportedDetail');
      return;
    }
    govRefresh.disabled=true;
    govStatus.textContent=historyText('fetching');
    try{
      const data=await json('/api/government-climate'+(refresh?'?refresh=true':''));
      if(token!==governmentClimateRequest||!okLocation())return;
      if(!['retrieved_live','cached_recent','unavailable'].includes(data?.status)||!Array.isArray(data.days)||data.source!=='NASA POWER (US government)'){
        throw new Error('Government climate schema could not be verified.');
      }
      if(data.status==='unavailable'){
        if(data.days.length)throw new Error('Unavailable NASA response unexpectedly contained values.');
        governmentClimateVisibleState='unavailable';governmentClimateErrorMessage=data.notice||'';
        govStatus.textContent=historyText('unavailable');
        govRows.append(el('p','gov-intro',historyText('unavailableIntro')+(data.notice?' · '+data.notice:'')));
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
      govStatus.textContent=(data.status==='cached_recent'?historyText('cached'):historyText('retrieved'))+' · '+data.days.length+' '+historyText('historyDays');
      governmentClimateVisibleState='verified';
      governmentClimateData=data;
      govDownload.disabled=false;
      renderGovernmentClimate(data);
      govDetail.replaceChildren();
      const link=el('a','','NASA POWER official daily API');link.href='https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
      link.rel='noopener noreferrer';link.target='_blank';
      govDetail.append(historyText('source')+': ',link,' · '+historyText('latest')+': '+data.latest_data_date+
        ' · '+historyText('retrievedUtc')+': '+data.retrieved_at_utc+'. '+data.notice);
    }catch(e){
      if(token!==governmentClimateRequest)return;
      governmentClimateVisibleState='invalid';governmentClimateErrorMessage=e.message;
      govStatus.textContent=historyText('invalid');
      govRows.replaceChildren(el('p','gov-intro',historyText('invalidIntro')+': '+e.message));
      govDetail.textContent=historyText('invalidDetail');
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
  here('language').addEventListener('change',translateGovernmentPanel);
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

  here('language').addEventListener('change',()=>{renderForecastQuality();renderHourlyEvidence();});

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