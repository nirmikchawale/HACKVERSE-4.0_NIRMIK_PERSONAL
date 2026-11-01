/* Jalna agriculture evidence: current Open-Meteo model + 2011 ICAR soil profile.
 * Presentation only; never changes forecast planning or feasibility results. */
(() => {
  'use strict';
  const page = document.querySelector('section.section[data-page="1"]');
  if (!page || document.querySelector('#jalnaContext')) return;
  const d = document;
  const make = (tag, cls, value) => {
    const el = d.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  const copy = {
    en: {
      title: 'Weather and soil around Jalna', scope: 'Jalna city reference area — not your farm',
      weather: 'Weather model near Jalna', soil: 'Soil types found across Jalna district',
      temperature: 'Air temperature', humidity: 'Humidity', wind: 'Wind speed',
      soiltemp: 'Soil surface temperature', soilwater: 'Modeled surface soil moisture',
      soilDeep: 'Deep black soil', soilMedium: 'Medium-deep soil', soilShallow: 'Shallow soil',
      loading: 'Checking available Jalna data…', refreshed: 'Update this information',
      loadingButton: 'Updating…', unavailable: 'Current model readings are unavailable. Please try again.',
      unknown: 'Not available', sourceTime: 'Model time (India)', modelNotice:
        'These are weather-model estimates around Jalna, not measurements on your field or soil test results.',
      soilNotice: 'These percentages come from a 2011 district report. They do not identify the soil in your own field.',
      details: 'Where do these figures come from?', detailsExtra:
        'The official district plan lists deep black, medium-deep and shallow soils. It also contains differing area totals, so percentages are shown as reported, not recalculated. For your field, get a soil test.',
      sources: 'Sources: Open-Meteo model and ICAR-CRIDA district plan',
      readForecast: 'Rainfall forecast is shown above. These extra readings do not change the work-plan decision.',
      sourceOpen: 'Weather source', official: 'Soil report',
      soilReading: 'Not a soil moisture sensor',
      missingSoil: 'No modeled surface soil reading returned',
    },
    mr: {
      title: 'जालना भागातलं हवामान आणि माती', scope: 'जालना शहराजवळचा अंदाज — तुमच्या शेताची मोजणी नाही',
      weather: 'जालना भागातलं हवामान', soil: 'जालना जिल्ह्यात आढळणाऱ्या माती',
      temperature: 'हवेचं तापमान', humidity: 'हवेतील ओलावा', wind: 'वाऱ्याचा वेग',
      soiltemp: 'जमिनीच्या वरचं तापमान', soilwater: 'वरच्या मातीतील ओलाव्याचा अंदाज',
      soilDeep: 'खोल काळी माती', soilMedium: 'मध्यम खोल माती', soilShallow: 'उथळ माती',
      loading: 'जालन्याची माहिती तपासत आहोत…', refreshed: 'माहिती पुन्हा मिळवा',
      loadingButton: 'माहिती मिळवत आहोत…', unavailable: 'सध्याची माहिती मिळाली नाही. पुन्हा प्रयत्न करा.',
      unknown: 'माहिती नाही', sourceTime: 'अंदाजाची वेळ (भारत)', modelNotice:
        'ही जालना भागासाठी हवामान मॉडेलची माहिती आहे; तुमच्या शेतात मोजलेली नाही.',
      soilNotice: 'मातीचे हे आकडे २०११ मधल्या जिल्ह्याच्या अहवालातून आहेत. तुमच्या शेतात नेमकी कोणती माती आहे ते यातून समजत नाही.',
      details: 'ही माहिती कुठून आली?', detailsExtra:
        'जुन्या सरकारी अहवालात खोल काळी, मध्यम खोल आणि उथळ मातीची नोंद आहे. वेगवेगळ्या तक्त्यांतील जमिनीचं एकूण क्षेत्र जुळत नाही. आपल्या शेतासाठी माती तपासून घ्या.',
      sources: 'स्रोत: Open-Meteo हवामान मॉडेल आणि ICAR-CRIDA अहवाल',
      readForecast: 'पावसाचा अंदाज वर दिसतो. या वेगळ्या आकड्यांवरून काम सुरक्षित आहे असं ठरत नाही.',
      sourceOpen: 'हवामानाचा स्रोत', official: 'मातीचा अहवाल',
      soilReading: 'शेतातल्या ओलाव्याची प्रत्यक्ष मोजणी नाही',
      missingSoil: 'मातीतील ओलाव्याचा अंदाज उपलब्ध नाही',
    },
    hi: {
      title: 'जालना का मौसम और मिट्टी', scope: 'जालना शहर के आसपास का अनुमान — आपके खेत की माप नहीं',
      weather: 'जालना के आसपास का मौसम', soil: 'जालना जिले में पाई जाने वाली मिट्टी',
      temperature: 'हवा का तापमान', humidity: 'हवा में नमी', wind: 'हवा की रफ्तार',
      soiltemp: 'ऊपरी मिट्टी का तापमान', soilwater: 'ऊपरी मिट्टी की नमी का अनुमान',
      soilDeep: 'गहरी काली मिट्टी', soilMedium: 'मध्यम गहरी मिट्टी', soilShallow: 'कम गहरी मिट्टी',
      loading: 'जालना की जानकारी जाँच रहे हैं…', refreshed: 'जानकारी दोबारा लें',
      loadingButton: 'जानकारी ले रहे हैं…', unavailable: 'अभी मॉडल की जानकारी नहीं मिली। फिर कोशिश करें।',
      unknown: 'जानकारी नहीं', sourceTime: 'मॉडल का समय (भारत)', modelNotice:
        'ये जालना के आसपास के मौसम मॉडल के आँकड़े हैं, आपके खेत की माप या मिट्टी की जाँच नहीं।',
      soilNotice: 'मिट्टी के ये आँकड़े जिले की 2011 की रिपोर्ट से हैं। इनसे आपके खेत की मिट्टी का प्रकार पता नहीं चलता।',
      details: 'ये आँकड़े कहाँ से आए?', detailsExtra:
        'पुरानी सरकारी रिपोर्ट में गहरी काली, मध्यम गहरी और कम गहरी मिट्टी बताई गई है। उसके क्षेत्रफल के अलग आँकड़े पूरी तरह मेल नहीं खाते। अपने खेत की मिट्टी की जाँच कराएँ।',
      sources: 'स्रोत: Open-Meteo मॉडल और ICAR-CRIDA जिला रिपोर्ट',
      readForecast: 'बारिश का अनुमान ऊपर दिखता है। इन अतिरिक्त आँकड़ों से काम सुरक्षित होने की गारंटी नहीं मिलती।',
      sourceOpen: 'मौसम का स्रोत', official: 'मिट्टी की रिपोर्ट',
      soilReading: 'खेत में नमी की असली माप नहीं',
      missingSoil: 'मिट्टी की नमी का मॉडल अनुमान नहीं मिला',
    },
  };
  const lang = () => ['en','mr','hi'].includes(d.querySelector('#language')?.value)
    ? d.querySelector('#language').value : 'en';
  const text = key => (copy[lang()] || copy.en)[key] || copy.en[key];
  const root = make('section','panel jalna-context');
  root.id = 'jalnaContext';
  root.setAttribute('aria-label','Jalna weather and soil context');
  const head = make('div','jalna-context-head');
  const headCopy=make('div','jalna-context-head-copy');
  const heading=make('h2'),scope=make('small'),refresh=make('button','btn');
  refresh.id='refreshJalnaContext';refresh.type='button';
  headCopy.append(heading,scope);head.append(headCopy,refresh);
  const status=make('p','jalna-context-status');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const grid=make('div','jalna-context-grid');
  const weather=make('div','jalna-context-half');
  const wTitle=make('h3'),wTime=make('small'),weatherMetrics=make('dl','jalna-metrics'),wNotice=make('small','jalna-limits');
  weather.append(wTitle,wTime,weatherMetrics,wNotice);
  const soil=make('div','jalna-context-half');
  const soilTitle=make('h3'),soilTypes=make('dl','jalna-soils'),soilNotice=make('small','jalna-limits');
  const info=make('details','jalna-sources');const summary=make('summary'),body=make('div');
  const extra=make('p');
  const weatherLink=make('a'),soilLink=make('a');
  weatherLink.href='https://open-meteo.com/en/docs';
  soilLink.href='https://www.icar-crida.res.in/CP-2012/statewiseplans/Maharastra%28Pdf%29/MAU%2C%20Parbhani/Maharashtra%2033-Jalna-31-12-2011.pdf';
  for(const link of [weatherLink,soilLink]){link.target='_blank';link.rel='noopener noreferrer';}
  body.append(extra,weatherLink,soilLink);info.append(summary,body);
  soil.append(soilTitle,soilTypes,soilNotice,info);grid.append(weather,soil);
  const footer=make('small','jalna-limits');
  root.append(head,status,grid,footer);
  const layout=page.querySelector('.weather-layout');
  if(!layout)return;
  layout.insertAdjacentElement('afterend',root);
  let payload=null,busy=false,requestCount=0;
  const value=(field,unit,labels) => {
    const row=make('div','jalna-reading'),name=make('dt','',text(labels)),item=make('dd');
    const raw=payload?.conditions?.model?.values?.[field];
    const valid=typeof raw==='number'&&Number.isFinite(raw);
    item.textContent=valid?raw.toLocaleString('en-IN',{maximumFractionDigits:2})+' '+unit:text('unknown');
    row.append(name,item);return row;
  };
  const soilType=(record,labelKey)=>{
    const item=make('div','jalna-soil-type');
    item.append(make('dt','',text(labelKey)),
      make('dd','',typeof record?.reported_percent==='number'
        ?record.reported_percent.toLocaleString('en-IN')+'%':'—'));
    return item;
  };
  function render(){
    heading.textContent=text('title');scope.textContent=text('scope');
    refresh.textContent=text(busy?'loadingButton':'refreshed');refresh.disabled=busy;
    status.textContent=busy?text('loading'):
      !payload?text('unavailable'):
      payload.conditions.status==='unavailable'?text('unavailable'):'';
    wTitle.textContent=text('weather');soilTitle.textContent=text('soil');
    const model=payload?.conditions?.model;
    wTime.textContent=model?.valid_time_local?text('sourceTime')+': '+model.valid_time_local.replace('T',' '):'';
    weatherMetrics.replaceChildren();
    for(const [k,unit,label] of [
      ['temperature_2m','°C','temperature'],['relative_humidity_2m','%','humidity'],
      ['wind_speed_10m','km/h','wind'],['soil_temperature_0cm','°C','soiltemp'],
      ['soil_moisture_0_to_1cm','m³/m³','soilwater']
    ])weatherMetrics.append(value(k,unit,label));
    wNotice.textContent=text('modelNotice')+' '+text('soilReading');
    soilTypes.replaceChildren();
    const classes=payload?.soil?.classes||[];
    for(const [id,key] of [['deep_black','soilDeep'],['medium_deep','soilMedium'],['shallow','soilShallow']]){
      soilTypes.append(soilType(classes.find(x=>x.id===id),key));
    }
    soilNotice.textContent=text('soilNotice');
    summary.textContent=text('details');extra.textContent=text('detailsExtra');
    weatherLink.textContent=text('sourceOpen');soilLink.textContent=text('official');
    footer.textContent=text('readForecast');
    root.hidden=false;
  }
  async function load(refreshFlag=false){
    if(busy)return;
    busy=true;const call=++requestCount;render();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch('/api/jalna-agri-context'+(refreshFlag?'?refresh=true':''),
        {headers:{Accept:'application/json'},signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const answer=await response.json();
      if(!answer?.soil?.classes || !answer?.conditions?.status)throw Error('Invalid agriculture context');
      if(call===requestCount)payload=answer;
    }catch(_){
      if(call===requestCount)payload=null;
    }finally{
      clearTimeout(timer);if(call===requestCount){busy=false;render();}
    }
  }
  refresh.addEventListener('click',()=>load(true));
  d.querySelector('#language')?.addEventListener('change',()=>render());
  new MutationObserver(()=>render()).observe(d.body,{attributes:true,attributeFilter:['data-experience']});
  render();load(false);
})();