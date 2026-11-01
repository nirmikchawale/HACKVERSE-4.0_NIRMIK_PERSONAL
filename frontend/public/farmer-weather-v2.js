/* FE-02 | Farmer weather journey. Genuine API data only; detailed science stays untouched. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const root=document.querySelector('section.section[data-page="1"]');
  if(!root||$('farmerWeatherV2'))return;
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
  const copy={
    en:{
      header:'What does the forecast say around Jalna?',sub:'Real model information for Jalna, not rain measured on your farm.',
      crop:'Default crop: already-picked cotton',choose:'1. Check the rain forecast',
      period:'Forecast day',today:'Today',tomorrow:'Tomorrow',date:'Date',
      rain:'Modeled rainfall in the available hours',chance:'Chance of rain at this hour',
      hourly:'Rainfall hour by hour',noValues:'Not reported',missing:'Some hours are missing. Missing does not mean no rain.',
      source:'Source: Open-Meteo weather model',fresh:'Forecast received',cached:'Recent verified forecast',stale:'The forecast is old or unavailable. Refresh to check again.',
      noForecast:'Could not get the current forecast. You can still choose your own finish time.',
      loading:'Getting the Jalna forecast…',refresh:'Update rain forecast',
      scope:'Forecast service currently supports Jalna, Maharashtra only.',
      selectJalna:'Show Jalna weather',chooseTime:'2. When do you want to finish your cotton work?',
      timeIntro:'Pick the time you want to finish. We will check your reported work and resources against it. This is NOT a predicted safe time.',
      finish:'Your chosen finish date and time (IST)',saved:'Finish time saved',notSaved:'Choose and save a finish time',invalid:'Choose a future date and time in India.',
      continue:'Save my time and enter farm details',next:'3. Next: tell us about your cotton work',
      disclaimer:'No rainfall probability or amount proves that cotton is safe. Weather may change.',
      details:'More about weather, soil and sources',hours:'forecast hours',partial:'available values',
      more:'Show more hourly readings',less:'Show fewer hourly readings',unavailable:'Data not available',
      status:'How old is this forecast?',forecastUncertain:'Hourly rain chance is not the probability for the entire day.'
    },
    mr:{
      header:'जालना भागात पावसाचा काय अंदाज आहे?',sub:'हा जालना भागासाठी हवामानाचा अंदाज आहे, तुमच्या शेतात मोजलेला पाऊस नाही.',
      crop:'सध्या वेचलेला कापूस — हेच पीक निवडलेलं आहे',choose:'१. पावसाचा अंदाज पाहा',
      period:'कोणत्या दिवशी?',today:'आज',tomorrow:'उद्या',date:'तारीख',
      rain:'दिसणाऱ्या तासांत अंदाजे पाऊस',chance:'या तासात पावसाची शक्यता',
      hourly:'तासागणिक पावसाचा अंदाज',noValues:'माहिती नाही',missing:'काही तासांची माहिती नाही. याचा अर्थ पाऊस पडणार नाही असा नाही.',
      source:'स्रोत: Open-Meteo हवामान मॉडेल',fresh:'ताजा अंदाज मिळाला',cached:'अलीकडे मिळालेला अंदाज',stale:'अंदाज जुना आहे किंवा मिळाला नाही. पुन्हा तपासा.',
      noForecast:'सध्या पावसाचा अंदाज मिळाला नाही. तरीही तुम्ही काम संपवायची वेळ ठरवू शकता.',
      loading:'जालन्याचा पावसाचा अंदाज मिळवत आहोत…',refresh:'पावसाचा अंदाज पुन्हा पाहा',
      scope:'सध्या फक्त जालना, महाराष्ट्रसाठी पावसाची माहिती मिळते.',
      selectJalna:'जालन्याचा पाऊस पाहा',chooseTime:'२. कापसाचं काम कधीपर्यंत संपवायचं?',
      timeIntro:'काम संपवायची वेळ तुम्ही ठरवा. त्याआधी काम पूर्ण होईल का ते तपासू. ही सुरक्षित वेळेची हमी नाही.',
      finish:'काम संपवायची तारीख आणि वेळ (IST)',saved:'वेळ जतन झाली',notSaved:'काम संपवायची वेळ निवडा',invalid:'भारतीय वेळेनुसार पुढची योग्य तारीख आणि वेळ निवडा.',
      continue:'वेळ जतन करा आणि माझ्या कामाची माहिती भरा',next:'३. पुढे: तुमच्या कापसाच्या कामाची माहिती',
      disclaimer:'पावसाच्या अंदाजावरून कापूस सुरक्षित राहील अशी खात्री देता येत नाही. हवामान बदलू शकतं.',
      details:'हवामान, माती आणि स्रोताबद्दल आणखी माहिती',hours:'तासांचा अंदाज',partial:'उपलब्ध नोंदी',
      more:'आणखी तास पाहा',less:'कमी तास पाहा',unavailable:'माहिती मिळाली नाही',
      status:'हा अंदाज किती जुना आहे?',forecastUncertain:'एका तासाची पावसाची शक्यता म्हणजे संपूर्ण दिवसाची शक्यता नाही.'
    },
    hi:{
      header:'जालना के आसपास बारिश का क्या अनुमान है?',sub:'यह जालना का मौसम अनुमान है, आपके खेत पर मापी गई बारिश नहीं।',
      crop:'फिलहाल चुनी हुई कपास ही डिफ़ॉल्ट फसल है',choose:'१. बारिश का अनुमान देखें',
      period:'कौन-सा दिन?',today:'आज',tomorrow:'कल',date:'तारीख',
      rain:'दिखाए गए घंटों में अनुमानित बारिश',chance:'इस घंटे में बारिश की संभावना',
      hourly:'हर घंटे का बारिश अनुमान',noValues:'जानकारी नहीं',missing:'कुछ घंटों की जानकारी नहीं मिली। इसका मतलब बारिश नहीं होगी, ऐसा नहीं है।',
      source:'स्रोत: Open-Meteo मौसम मॉडल',fresh:'नया अनुमान मिला',cached:'हाल में मिला अनुमान',stale:'मौसम अनुमान पुराना है या नहीं मिला। फिर जाँचें।',
      noForecast:'अभी बारिश का अनुमान नहीं मिला। फिर भी आप काम पूरा करने का समय चुन सकते हैं।',
      loading:'जालना का मौसम अनुमान देख रहे हैं…',refresh:'बारिश का अनुमान दोबारा देखें',
      scope:'अभी सिर्फ जालना, महाराष्ट्र के लिए मौसम जानकारी उपलब्ध है।',
      selectJalna:'जालना का मौसम देखें',chooseTime:'२. कपास का काम कब तक खत्म करना है?',
      timeIntro:'काम खत्म करने का समय आप तय करें। ऐप देखेगा कि बताए हुए साधनों से काम हो पाएगा या नहीं। यह सुरक्षित समय की गारंटी नहीं है।',
      finish:'काम पूरा करने की तारीख और समय (IST)',saved:'समय सेव हो गया',notSaved:'काम पूरा करने का समय चुनें',invalid:'भारतीय समय के हिसाब से आगे की सही तारीख और समय चुनें।',
      continue:'समय सेव करें और खेत की जानकारी भरें',next:'३. आगे: अपने कपास के काम की जानकारी',disclaimer:'मौसम अनुमान से कपास के सुरक्षित रहने की गारंटी नहीं मिलती। मौसम बदल सकता है।',
      details:'मौसम, मिट्टी और स्रोत के बारे में अधिक जानकारी',hours:'अनुमानित घंटे',partial:'उपलब्ध डेटा',
      more:'और घंटे देखें',less:'कम घंटे देखें',unavailable:'जानकारी नहीं मिली',
      status:'यह अनुमान कब लिया गया?',forecastUncertain:'एक घंटे की बारिश की संभावना पूरे दिन की संभावना नहीं है.'
    }
  };
  const lang=()=>['en','mr','hi'].includes($('language')?.value)?$('language').value:'en';
  const t=k=>(copy[lang()]||copy.en)[k]||copy.en[k]||k;
  const scopeOk=()=>state.place?.state==='Maharashtra'&&state.place?.city?.trim().toLowerCase()==='jalna';
  const fmt=n=>n.toLocaleString('en-IN',{maximumFractionDigits:2});
  const panel=make('section','panel farmer-weather-v2');panel.id='farmerWeatherV2';
  const heading=make('h2'),sub=make('p','fw-sub'),crop=make('span','fw-crop');
  const title=make('h3'),days=make('div','fw-days'),weatherSummary=make('div','fw-summary'),
        hoursTitle=make('h4'),hourGrid=make('div','fw-hour-grid'),
        expand=make('button','btn fw-more'),source=make('small','fw-source'),
        message=make('p','fw-message'),refresh=make('button','btn fw-refresh');
  refresh.type='button';expand.type='button';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const forecastBlock=make('div','fw-weather-card');
  forecastBlock.append(title,days,weatherSummary,hoursTitle,hourGrid,expand,source,message,refresh);
  const deadlineCard=make('div','fw-deadline-card'),deadlineTitle=make('h3'),
        deadlineInfo=make('p'),timeLabel=make('label','field'),timeCaption=make('span'),
        time=make('input'),timeStatus=make('small','fw-time-status'),
        continueButton=make('button','btn primary fw-continue'),next=make('p','fw-next'),
        caution=make('p','fw-caution');
  time.id='farmerFinishTime';time.type='datetime-local';timeLabel.append(timeCaption,time);
  continueButton.type='button';
  deadlineCard.append(deadlineTitle,deadlineInfo,timeLabel,timeStatus,continueButton,next,caution);
  const layout=make('div','fw-layout');
  layout.append(forecastBlock,deadlineCard);
  panel.append(heading,sub,crop,layout);
  const old=root.querySelector('.weather-layout');
  old.insertAdjacentElement('beforebegin',panel);
  // Always preserve the original detailed source panel and its network/quality inspectors.
  const jalna=$('jalnaContext');
  let moreRegion=null;
  if(jalna){
    moreRegion=make('details','fw-extra');moreRegion.id='farmerJalnaMore';
    const summary=make('summary');moreRegion.append(summary);
    jalna.insertAdjacentElement('beforebegin',moreRegion);
    moreRegion.append(jalna);
  }
  let model=null,status='loading',selectedDay='',expanded=false,busy=false;
  let loadCount=0,loadedAt='',problem='';
  function dayKey(local){return local.slice(0,10);}
  function todayIST(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const obj={};for(const p of parts)obj[p.type]=p.value;
    return [obj.year,obj.month,obj.day].join('-');
  }
  const datePlus=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  function dailyName(key){
    const today=todayIST();
    if(key===today)return t('today');
    if(key===datePlus(today,1))return t('tomorrow');
    return key.split('-').reverse().join('-');
  }
  const validStamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
  function cleanForecast(raw){
    if(!raw||!['retrieved_live','cached_recent'].includes(raw.status)||
       !Array.isArray(raw.hours)||!raw.hours.length)return null;
    const date=Date.parse(raw.retrieved_at_utc||'');
    if(!Number.isFinite(date)||date>Date.now()+60000||Date.now()-date>7200000)return null;
    const rows=[];
    for(const h of raw.hours){
      if(!validStamp(h.time))return null;
      const mm=h.precipitation_mm,pct=h.precipitation_probability_pct;
      if(mm!==null&&(typeof mm!=='number'||!Number.isFinite(mm)||mm<0))return null;
      if(pct!==null&&(typeof pct!=='number'||pct<0||pct>100||!Number.isFinite(pct)))return null;
      const epoch=Date.parse(h.time+':00+05:30');
      if(!Number.isFinite(epoch))return null;
      if(epoch>Date.now())rows.push({time:h.time,epoch,mm,pct});
    }
    rows.sort((a,b)=>a.epoch-b.epoch);
    return {rows,age:date,status:raw.status};
  }
  function paint(){
    heading.textContent=t('header');sub.textContent=t('sub');crop.textContent=t('crop');
    title.textContent=t('choose');hoursTitle.textContent=t('hourly');
    refresh.textContent=t('refresh');deadlineTitle.textContent=t('chooseTime');
    deadlineInfo.textContent=t('timeIntro');timeCaption.textContent=t('finish');
    next.textContent=t('next');caution.textContent=t('disclaimer');
    const existing=$('deadlineInput')?.value||state.deadline||'';
    if(document.activeElement!==time&&time.value!==existing)time.value=existing;
    timeStatus.textContent=existing&&state.deadline===existing?t('saved'):t('notSaved');
    continueButton.textContent=t('continue');
    if(moreRegion){moreRegion.querySelector(':scope > summary').textContent=t('details');moreRegion.open=document.body.dataset.experience==='detailed';}
    days.replaceChildren();weatherSummary.replaceChildren();hourGrid.replaceChildren();
    expand.hidden=true;source.textContent='';
    if(!scopeOk()){
      message.textContent=t('scope');
      const b=make('button','btn primary',t('selectJalna'));b.type='button';
      b.addEventListener('click',()=>{
        state.place={city:'Jalna',state:'Maharashtra'};
        persist();updateSummaries();if(typeof noteChange==='function')noteChange();
        $('toggleForecast')?.click();load(true);
      });
      weatherSummary.append(b);return;
    }
    if(busy){message.textContent=t('loading');return;}
    if(!model){
      message.textContent=problem||t('noForecast');
      return;
    }
    message.textContent='';
    const map=new Map();
    for(const h of model.rows){
      const key=dayKey(h.time);
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(h);
    }
    const keys=[...map.keys()].sort();
    if(!keys.includes(selectedDay))selectedDay=keys[0]||'';
    for(const key of keys){
      const b=make('button','fw-day'+(key===selectedDay?' is-selected':''),dailyName(key));
      b.type='button';b.dataset.day=key;b.setAttribute('aria-pressed',String(key===selectedDay));
      b.addEventListener('click',()=>{selectedDay=key;expanded=false;paint();});
      days.append(b);
    }
    const rows=map.get(selectedDay)||[],withRain=rows.filter(h=>h.mm!==null);
    const rainSum=withRain.reduce((acc,h)=>acc+h.mm,0);
    const r=make('div','fw-metric'),rTitle=make('span','',t('rain')),
          rValue=make('strong','',withRain.length?fmt(rainSum)+' mm':t('noValues')),
          rCaveat=make('small','',withRain.length+'/'+rows.length+' '+t('hours'));
    r.append(rTitle,rValue,rCaveat);weatherSummary.append(r);
    if(rows.length!==withRain.length)weatherSummary.append(make('p','fw-warning',t('missing')));
    const shown=expanded?rows:rows.slice(0,8);
    for(const h of shown){
      const card=make('div','fw-hour');
      card.append(make('strong','',h.time.slice(11)+' IST'),
        make('span','',h.mm===null?t('noValues'):fmt(h.mm)+' mm'),
        make('small','',h.pct===null?t('noValues'):fmt(h.pct)+'% · '+t('chance')));
      hourGrid.append(card);
    }
    expand.hidden=rows.length<=8;
    expand.textContent=t(expanded?'less':'more');
    source.textContent=t('source')+' · '+t('status')+' '+new Date(model.age).toLocaleString(lang()==='mr'?'mr-IN':lang()==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' · '+t('forecastUncertain');
  }
  async function load(force=false){
    if(busy)return;
    if(!scopeOk()){model=null;status='scope';paint();return;}
    busy=true;problem='';paint();const id=++loadCount;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
    try{
      const response=await fetch('/api/forecast'+(force?'?refresh=true':''),{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw Error('forecast API status '+response.status);
      const json=await response.json();
      if(id!==loadCount)return;
      model=cleanForecast(json);loadedAt=json.retrieved_at_utc||'';
      if(!model)problem=t('noForecast');
    }catch(error){if(id===loadCount){model=null;problem=t('noForecast');}}
    finally{clearTimeout(timeout);if(id===loadCount){busy=false;paint();}}
  }
  function saveAndContinue(){
    const val=time.value;
    const stamp=Date.parse(val+':00+05:30');
    if(!validStamp(val)||!Number.isFinite(stamp)||stamp<Date.now()+60000){
      timeStatus.textContent=t('invalid');time.focus();return;
    }
    const original=$('deadlineInput');
    original.value=val;
    original.dispatchEvent(new Event('input',{bubbles:true}));
    original.dispatchEvent(new Event('change',{bubbles:true}));
    const button=$('saveDeadline');if(button.disabled&&state.deadline!==val)button.disabled=false;
    button.click();
    if(state.deadline!==val){timeStatus.textContent=t('invalid');return;}
    timeStatus.textContent=t('saved');
    goto(2);
  }
  time.addEventListener('input',()=>{timeStatus.textContent=t('notSaved');});
  continueButton.addEventListener('click',saveAndContinue);
  refresh.addEventListener('click',()=>{load(true);$('toggleForecast')?.click();});
  expand.addEventListener('click',()=>{expanded=!expanded;paint();});
  $('language')?.addEventListener('change',()=>queueMicrotask(paint));
  new MutationObserver(()=>paint()).observe(document.body,{attributes:true,attributeFilter:['data-experience']});
  document.addEventListener('agri:farmer-update',()=>queueMicrotask(paint));
  paint();load(false);
})();
