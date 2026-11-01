/* Agri Foresight unified six-screen runtime. Uses only source-labelled FastAPI responses.
   No simulated weather, crop-safety thresholds, fabricated farmer data or AI claims. */
(() => {
  "use strict";
  const live={forecast:null,sources:null,health:null,evaluation:null,request:null,comparison:null,replan:null,selectedHour:null,selectedPackage:null,forecastLoading:false,error:null,evaluatedAtUtc:null};
  const here=id=>document.getElementById(id);
  const evidenceStyle=document.createElement('link');
  evidenceStyle.rel='stylesheet';evidenceStyle.href='/model-evidence.css';
  document.head.append(evidenceStyle);
  const workspaceStyle=document.createElement('link');workspaceStyle.rel='stylesheet';workspaceStyle.href='/weather-workspace.css';document.head.append(workspaceStyle);
  // One shared responsive type scale for all six dashboard pages.
  // Original palette, layout and source-native data remain untouched.
  const typographyStyle=document.createElement('link');
  typographyStyle.rel='stylesheet';typographyStyle.href='/agri-typography.css';
  if(!document.querySelector('link[href="/agri-typography.css"]'))document.head.append(typographyStyle);
  const deadlineStyles=document.createElement('link');
  deadlineStyles.rel='stylesheet';deadlineStyles.href='/deadline-comparisons.css';
  document.head.append(deadlineStyles);
  const windowsStyle=document.createElement('link');
  windowsStyle.rel='stylesheet';windowsStyle.href='/forecast-windows.css';
  document.head.append(windowsStyle);
  const intelligenceStyle=document.createElement('link');
  intelligenceStyle.rel='stylesheet';intelligenceStyle.href='/source-intelligence.css';
  document.head.append(intelligenceStyle);
  const receiptStyles=document.createElement('link');
  receiptStyles.rel='stylesheet';receiptStyles.href='/source-print.css';
  document.head.append(receiptStyles);
  const climateStyle=document.createElement('link');
  climateStyle.rel='stylesheet';climateStyle.href='/ex18-climate.css';
  document.head.append(climateStyle);
  const overviewLayoutStyle=document.createElement('link');
  overviewLayoutStyle.rel='stylesheet';overviewLayoutStyle.href='/overview-layout.css';
  if(!document.querySelector('link[href="/overview-layout.css"]'))document.head.append(overviewLayoutStyle);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
  const num=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-IN',{maximumFractionDigits:2}):'Unknown';
  const okLocation=()=>state.place?.state==='Maharashtra'&&state.place?.city?.trim().toLowerCase()==='jalna';
  const statuses=['feasible','blocked','unknown','completed'];
  // EX-18: labels vary with language; NASA/model source values never do.
  const climateText={
    en:{
      contrastTitle:'Model forecast and historical grid · different periods',
      contrastIntro:'These datasets do not represent the same dates, observations or farm location. The two rainfall totals must not be treated as a model validation or a safety comparison.',
      forecastTitle:'Next 24 forecast hours · Open-Meteo MODEL',historicalTitle:'Up to 20 historical days · NASA POWER GRID',
      modelData:'Known modeled rainfall',historyData:'Available historical gridded rainfall',
      modelMissing:'No verified future model hours',historyMissing:'No verified historical grid',
      rainCoverage:'Rainfall data coverage',days:'calendar days',hours:'hours',
      period:'Period',future:'Future hours (IST)',past:'Historical dates',
      gap:'Missing or unavailable readings are unknown, not zero',
      noComparison:'No matching period or field rain gauge is provided; do not compare these as equivalent weather observations.',
      chartTitle:'NASA POWER · historical rainfall and temperature',
      chartIntro:'A visual record of up to 20 validated historical grid dates; never a forecast or farm measurement. Missing readings are shown as unavailable.',
      barTitle:'Historical daily rainfall · mm/day',
      lineTitle:'Historical daily mean air temperature · °C',
      showTable:'Show all source-native values as a table',date:'Date',rain:'Rainfall (mm/day)',temperature:'Temperature (°C)',
      missing:'Unavailable',chartEmpty:'Verified historical climate data is not available.',
      offlineTitle:'Network and last successful source receipts',
      offline:'Browser reports offline',browserOnline:'Browser reports online; provider connectivity unverified',
      lastModel:'Last Open-Meteo receipt',lastNASA:'Last NASA POWER receipt',
      noSaved:'No successful source receipt saved on this browser',metadata:'Only source timestamps are retained locally; no farmer inputs or weather readings are cached. These receipts are not current weather evidence.',
      offlineNotice:'Offline: refresh requests may fail; no substitute forecast will be shown.',
      connectedNotice:'Use the existing source Refresh buttons to verify providers. Online status does not prove API availability.'
    },
    mr:{
      contrastTitle:'मॉडेल अंदाज व ऐतिहासिक ग्रिड · वेगळे कालखंड',
      contrastIntro:'हे दोन्ही स्रोत समान दिवस, मोजमाप किंवा शेत दाखवत नाहीत. दोन पावसाच्या बेरजांची सुरक्षिततेसाठी तुलना करू नका.',
      forecastTitle:'पुढील २४ तास · Open-Meteo मॉडेल',historicalTitle:'मागील कमाल २० दिवस · NASA POWER ग्रिड',
      modelData:'उपलब्ध मॉडेल पाऊस',historyData:'उपलब्ध ऐतिहासिक ग्रिड पाऊस',
      modelMissing:'पडताळलेले पुढील मॉडेल तास नाहीत',historyMissing:'पडताळलेला ऐतिहासिक डेटा नाही',
      rainCoverage:'पावसाच्या नोंदी',days:'दिवस',hours:'तास',
      period:'कालावधी',future:'पुढील तास (IST)',past:'ऐतिहासिक तारखा',
      gap:'गहाळ नोंदी म्हणजे शून्य पाऊस नाही',
      noComparison:'समान कालावधी किंवा शेतातील मोजमाप नाही; यांना समान हवामान निरीक्षणे समजू नका.',
      chartTitle:'NASA POWER · ऐतिहासिक पाऊस व तापमान',
      chartIntro:'कमाल २० पडताळलेल्या ऐतिहासिक ग्रिड तारखा; अंदाज किंवा शेतातील मोजमाप नाही. गहाळ आकडे उपलब्ध नाहीत असे दाखवले आहेत.',
      barTitle:'ऐतिहासिक दररोजचा पाऊस · मिमी/दिवस',
      lineTitle:'ऐतिहासिक हवेचे सरासरी तापमान · °C',
      showTable:'स्रोताचे सर्व आकडे तक्त्यात पाहा',date:'तारीख',rain:'पाऊस (मिमी/दिवस)',temperature:'तापमान (°C)',
      missing:'उपलब्ध नाही',chartEmpty:'ऐतिहासिक माहिती पडताळता आली नाही.',
      offlineTitle:'नेटवर्क व शेवटच्या स्रोत नोंदी',
      offline:'ब्राउझर ऑफलाइन दाखवतो',browserOnline:'ब्राउझर ऑनलाइन दाखवतो; स्रोत उपलब्धतेची खात्री नाही',
      lastModel:'शेवटची Open-Meteo नोंद',lastNASA:'शेवटची NASA POWER नोंद',
      noSaved:'या ब्राउझरमध्ये यशस्वी स्रोत नोंद नाही',metadata:'फक्त स्रोत वेळा स्थानिकरीत्या नोंदवल्या आहेत; शेतकरी माहिती व हवामान आकडे साठवलेले नाहीत. हे चालू हवामानाचे पुरावे नाहीत.',
      offlineNotice:'ऑफलाइन: नवीन स्रोत उपलब्ध नसेल; बनावट अंदाज दाखवला जाणार नाही.',
      connectedNotice:'स्रोत उपलब्ध आहेत का ते तपासण्यासाठी Refresh वापरा. ऑनलाइन म्हणजे API चालूच आहे असे नाही.'
    },
    hi:{
      contrastTitle:'मॉडल पूर्वानुमान और ऐतिहासिक ग्रिड · अलग अवधियाँ',
      contrastIntro:'दोनों स्रोत एक ही तारीख, अवलोकन या खेत की जानकारी नहीं हैं। वर्षा के योग से मॉडल सुरक्षा या सत्यापन निष्कर्ष न निकालें।',
      forecastTitle:'अगले २४ घंटे · Open-Meteo मॉडल',historicalTitle:'पिछले अधिकतम २० दिन · NASA POWER ग्रिड',
      modelData:'उपलब्ध मॉडल वर्षा',historyData:'उपलब्ध ऐतिहासिक ग्रिड वर्षा',
      modelMissing:'वर्तमान सत्यापित मॉडल घंटे नहीं हैं',historyMissing:'सत्यापित ऐतिहासिक ग्रिड नहीं है',
      rainCoverage:'वर्षा डेटा कवरेज',days:'दिन',hours:'घंटे',
      period:'अवधि',future:'आने वाले घंटे (IST)',past:'ऐतिहासिक तारीखें',
      gap:'उपलब्ध न होना शून्य वर्षा नहीं है',
      noComparison:'एक समान समय अवधि या खेत का वर्षामापी नहीं है; इन्हें समान मौसम अवलोकन न मानें।',
      chartTitle:'NASA POWER · ऐतिहासिक वर्षा और तापमान',
      chartIntro:'अधिकतम २० सत्यापित ऐतिहासिक ग्रिड दिन; पूर्वानुमान या खेत का माप नहीं। गायब आँकड़े अनुपलब्ध हैं।',
      barTitle:'ऐतिहासिक दैनिक वर्षा · मिमी/दिन',
      lineTitle:'ऐतिहासिक दैनिक औसत तापमान · °C',
      showTable:'सभी स्रोत मान तालिका में दिखाएँ',date:'तारीख',rain:'वर्षा (मिमी/दिन)',temperature:'तापमान (°C)',
      missing:'अनुपलब्ध',chartEmpty:'सत्यापित ऐतिहासिक मौसम उपलब्ध नहीं है।',
      offlineTitle:'नेटवर्क तथा अंतिम सफल स्रोत रिकॉर्ड',
      offline:'ब्राउज़र ऑफलाइन दिखाता है',browserOnline:'ब्राउज़र ऑनलाइन दिखाता है; API उपलब्धता सत्यापित नहीं',
      lastModel:'अंतिम Open-Meteo रिकॉर्ड',lastNASA:'अंतिम NASA POWER रिकॉर्ड',
      noSaved:'इस ब्राउज़र में कोई सफल स्रोत रिकॉर्ड नहीं',metadata:'केवल स्रोत समय स्थानीय रूप से रखे हैं; किसान विवरण या मौसम आँकड़े संग्रहीत नहीं हैं। यह वर्तमान मौसम प्रमाण नहीं है।',
      offlineNotice:'ऑफलाइन: स्रोत रिफ्रेश असफल हो सकता है; काल्पनिक पूर्वानुमान नहीं दिखेगा।',
      connectedNotice:'वास्तविक स्रोत जाँचने के लिए Refresh दबाएँ। ऑनलाइन होना API उपलब्धता की गारंटी नहीं है।'
    }
  };
  const climateL=()=>climateText[state.lang]||climateText.en;

  // EX-17: source data/units are not modified when changing languages.
  const receiptStrings={
   en:{title:'Source activity · exact timestamps',help:'Provider retrieval time differs from the browser check. Recalculating ages does not retrieve new weather.',check:'Browser checked at',again:'Recalculate displayed ages',
    model:'Open-Meteo modeled forecast',history:'NASA POWER historical grid',decision:'FastAPI assessment',imd:'IMD official warnings',
    notAvailable:'No verified response',unsupported:'Unsupported location · Jalna data unavailable',stale:'Expired forecast · do not use',valid:'Verified current model source',
    historic:'Verified government historical data, not a forecast',retrieved:'Provider retrieved (UTC)',latest:'Latest historical day',
    received:'Browser received server decision (UTC)',notAssessed:'No verified server assessment',unconnected:'Not connected · no official live warnings',
    age:'minutes old',future:'invalid future timestamp',docsModel:'Model provider documentation',docsNASA:'NASA POWER official documentation',
    printTitle:'Agri Foresight · evidence and decision receipt',summary:'Jalna already-picked cotton preparedness. Not a safety, rainfall-onset, yield or loss-prevention certificate.',
    made:'Browser report created (UTC)',place:'Scenario location',result:'FastAPI decision',noResult:'NOT EVALUATED · no validated backend assessment',
    input:'Actual farmer inputs submitted',noInput:'No completed FastAPI submission',deadline:'Candidate deadline (IST)',
    forecast:'External model forecast',noForecast:'No currently verified model hours',nasa:'Government historical climate',noHistory:'No validated NASA history',
    warnings:'Official IMD warnings',noIMD:'No authorized live IMD warning connection; no warning inferred',
    constraints:'Unresolved backend constraints',noConstraint:'No blocked/unknown constraints returned',unknownConstraint:'No backend evaluation to establish constraints',
    excluded:'Unconfirmed/excluded options',noExcluded:'No backend exclusions',selected:'Selected conditional package',noSelected:'None selected or certified completed',
    comparisons:'Server-verified candidate comparisons',caution:'This records only user-declared resources and server output. Open-Meteo is a non-government-hosted MODEL, not observed rainfall. NASA POWER is historical government gridded evidence. No change is automatically executed.'},
   mr:{title:'स्रोताची वेळ व तपशील',help:'स्रोताकडून माहिती मिळाल्याची वेळ आणि ब्राउझरची तपासणी वेगळी आहे. वेळ तपासल्याने नवीन हवामान मिळत नाही.',check:'ब्राउझर तपासणी वेळ',again:'वेळ पुन्हा मोजा',
    model:'Open-Meteo मॉडेल अंदाज',history:'NASA POWER ऐतिहासिक डेटा',decision:'FastAPI मूल्यमापन',imd:'IMD अधिकृत इशारे',
    notAvailable:'पडताळलेला डेटा नाही',unsupported:'हे ठिकाण समर्थित नाही · जालनाचा डेटा नाही',stale:'जुना अंदाज · वापरू नका',valid:'अलीकडील मॉडेल पडताळले',
    historic:'सरकारी ऐतिहासिक डेटा · भविष्यातील अंदाज नाही',retrieved:'स्रोत माहिती UTC',latest:'शेवटचा ऐतिहासिक दिवस',
    received:'सर्व्हरचा निकाल ब्राउझरला प्राप्त (UTC)',notAssessed:'मूल्यमापन पडताळलेले नाही',unconnected:'जोडलेले नाही · अधिकृत इशारे नाहीत',
    age:'मिनिटांपूर्वी',future:'चुकीची भविष्यातील वेळ',docsModel:'मॉडेल स्रोत दस्तऐवज',docsNASA:'NASA POWER दस्तऐवज',
    printTitle:'Agri Foresight · पुरावा आणि निर्णय नोंद',summary:'जालन्यातील वेचलेल्या कापसाची तयारी. शेत सुरक्षा, पावसाची सुरुवात किंवा नुकसान टाळण्याची खात्री नाही.',
    made:'ब्राउझर अहवाल वेळ (UTC)',place:'निवडलेले ठिकाण',result:'FastAPI निकाल',noResult:'मूल्यमापन नाही · सर्व्हर निर्णय उपलब्ध नाही',
    input:'FastAPI ला दिलेल्या शेतकरी नोंदी',noInput:'FastAPI कडे नोंद दिलेली नाही',deadline:'नियोजन अंतिम वेळ (IST)',
    forecast:'बाह्य मॉडेल अंदाज',noForecast:'अलीकडील पडताळलेले मॉडेल तास नाहीत',nasa:'सरकारी ऐतिहासिक हवामान',noHistory:'NASA इतिहास पडताळलेला नाही',
    warnings:'IMD अधिकृत इशारे',noIMD:'अधिकृत IMD इशारे जोडलेले नाहीत; कोणताही इशारा गृहित नाही',
    constraints:'सर्व्हरचे उर्वरित निर्बंध',noConstraint:'अडथळे/अज्ञात निर्बंध नोंदलेले नाहीत',unknownConstraint:'मूल्यमापनापूर्वी निर्बंध उपलब्ध नाहीत',
    excluded:'वगळलेले पर्याय',noExcluded:'वगळलेले पर्याय नाहीत',selected:'निवडलेला अटींसह पर्याय',noSelected:'निवडलेला किंवा पूर्ण झालेला पर्याय नाही',
    comparisons:'सर्व्हरने पडताळलेल्या वेळ-तुलना',caution:'शेतकऱ्याने दिलेली माहिती व सर्व्हर निकाल. Open-Meteo मॉडेल प्रत्यक्ष पाऊस नाही; NASA इतिहास आहे. कोणताही पर्याय आपोआप पूर्ण होत नाही.'},
   hi:{title:'स्रोत का समय और विवरण',help:'स्रोत से डेटा आने और ब्राउज़र की जाँच का समय अलग है। समय जाँचने से नया मौसम नहीं मिलता।',check:'ब्राउज़र जाँच का समय',again:'समय का अंतर फिर जाँचें',
    model:'Open-Meteo मॉडल मौसम',history:'NASA POWER ऐतिहासिक ग्रिड',decision:'FastAPI मूल्यांकन',imd:'IMD आधिकारिक चेतावनी',
    notAvailable:'सत्यापित परिणाम नहीं',unsupported:'स्थान समर्थित नहीं · जालना डेटा नहीं',stale:'पुराना पूर्वानुमान · उपयोग न करें',valid:'वर्तमान मॉडल डेटा सत्यापित',
    historic:'सत्यापित सरकारी ऐतिहासिक डेटा, भविष्यवाणी नहीं',retrieved:'स्रोत प्राप्ति UTC समय',latest:'अंतिम ऐतिहासिक दिन',
    received:'ब्राउज़र को सर्वर परिणाम मिला (UTC)',notAssessed:'सर्वर मूल्यांकन नहीं हुआ',unconnected:'जुड़ा नहीं · आधिकारिक चेतावनी नहीं',
    age:'मिनट पुराना',future:'भविष्य का गलत समय',docsModel:'मॉडल स्रोत दस्तावेज़',docsNASA:'NASA POWER दस्तावेज़',
    printTitle:'Agri Foresight · प्रमाण और निर्णय रिपोर्ट',summary:'जालना में चुनी हुई कपास की तैयारी। खेत सुरक्षा या फसल नुकसान रोकने का प्रमाण नहीं।',
    made:'ब्राउज़र रिपोर्ट का समय (UTC)',place:'चुना स्थान',result:'FastAPI परिणाम',noResult:'NOT EVALUATED · सत्यापित सर्वर परिणाम नहीं',
    input:'FastAPI को भेजे किसान विवरण',noInput:'FastAPI मूल्यांकन के लिए विवरण नहीं भेजे गए',deadline:'नियोजित समय (IST)',
    forecast:'बाहरी मॉडल पूर्वानुमान',noForecast:'वर्तमान सत्यापित मॉडल घंटे नहीं',nasa:'सरकारी ऐतिहासिक जलवायु',noHistory:'सत्यापित NASA इतिहास नहीं',
    warnings:'IMD आधिकारिक चेतावनी',noIMD:'अधिकृत IMD चेतावनी सेवा जुड़ी नहीं; कोई चेतावनी अनुमानित नहीं',
    constraints:'सर्वर की अधूरी शर्तें',noConstraint:'कोई बाधित/अज्ञात शर्त नहीं मिली',unknownConstraint:'मूल्यांकन से पहले शर्तें अज्ञात',
    excluded:'अस्वीकृत विकल्प',noExcluded:'कोई अस्वीकृत विकल्प नहीं',selected:'चुना गया सशर्त विकल्प',noSelected:'कोई विकल्प पूरा या चुना नहीं',
    comparisons:'सर्वर-सत्यापित समय तुलनाएँ',caution:'केवल किसान के विवरण और सर्वर परिणाम। Open-Meteo मॉडल वास्तविक वर्षा नहीं; NASA ऐतिहासिक ग्रिड है। कोई परिवर्तन अपने-आप नहीं किया गया।'}
  };
  const receiptLanguage=()=>receiptStrings[state.lang]||receiptStrings.en;

  const intelligenceLabels={
  en:{title:'Verified sources · independent status',intro:'Model forecasts, government history, and declared resource decisions are separate forms of evidence.',
   api:'FastAPI decision engine',model:'Open-Meteo weather model',nasa:'NASA POWER historical grid',imd:'IMD official warnings',farm:'Farmer resource assessment',
   connected:'Connected',missing:'Unavailable / not loaded',unverified:'Not verified',pending:'Retrieving source',verified:'Verified model hours',cache:'Verified recent model cache',stale:'Stale · do not use',
   hist:'Verified historical grid',histcache:'Verified recent history',unsupported:'Unsupported location',notconnected:'Not connected',unevaluated:'Not evaluated',
   engineDetail:'Backend source registry verified; no field-safety validation.',engineMissing:'A valid backend health and source response is missing.',
   pilot:'The pilot serves Jalna, Maharashtra only.',forecastDetail:'Modeled hours only, not observed rain. Retrieved: ',forecastMissing:'No current model hours verified.',
   historyDetail:'Latest historical day ',historyTail:' · not a field measurement or a future forecast.',historyMissing:'No verified NASA historical grid available.',
   imdDetail:'Official live warning data is not connected; no warning or clearance may be inferred.',
   assessmentDetail:'Computed from farmer declarations only, not verified physical availability or crop safety.',assessmentMissing:'Requires farmer declarations and a real FastAPI evaluation.',
   backend:'Backend assessment: ',diag:'Why did FastAPI return this result?',notassessed:'Not evaluated. Save declarations and a candidate deadline, then run FastAPI.',
   outcome:'Server result: ',outcomeFoot:'. Declared-resource/time feasibility only, not a crop-safety certificate.',
   readiness:'Handling-location readiness',capacity:'Declared handling capacity',timing:'Candidate deadline and time',
   provenance:'Backend provenance: ',none:'No blocked/unknown constraints returned. This does not prove field safety.',completed:'Completed is farmer-declared, not physically verified.',
   excluded:'Not counted · ',rejected:'The backend did not accept this as a confirmed resource.',receipt:'Farmer declarations evaluated by FastAPI',
   target:'Target',resource:'Capacity',hours:'Required hours',deadline:'Deadline',ready:'Readiness',units:'handling units',
   foot:'All constraints and exclusions are from FastAPI; no resource is automatically confirmed.'},
  mr:{title:'स्वतंत्र स्रोत स्थिती',intro:'हवामान मॉडेल, सरकारी इतिहास आणि शेतकरी नोंदी वेगवेगळे पुरावे आहेत.',
   api:'FastAPI निर्णय इंजिन',model:'Open-Meteo हवामान मॉडेल',nasa:'NASA POWER ऐतिहासिक ग्रिड',imd:'IMD अधिकृत इशारे',farm:'शेतकरी संसाधन मूल्यमापन',
   connected:'जोडलेले',missing:'उपलब्ध नाही',unverified:'पडताळले नाही',pending:'माहिती घेत आहे',verified:'मॉडेल तास पडताळले',cache:'अलीकडील मॉडेल कॅश',stale:'जुने · वापरू नका',
   hist:'ऐतिहासिक ग्रिड पडताळले',histcache:'अलीकडील इतिहास',unsupported:'ठिकाण समर्थित नाही',notconnected:'जोडलेले नाही',unevaluated:'मूल्यमापन नाही',
   engineDetail:'बॅकएंड स्रोत नोंद पडताळली; शेतातील सुरक्षितता पडताळलेली नाही.',engineMissing:'बॅकएंड आरोग्य/स्रोत नोंद पडताळलेली नाही.',
   pilot:'हा पायलट फक्त जालना, महाराष्ट्र येथे चालतो.',forecastDetail:'मॉडेल तास; प्रत्यक्ष पाऊस नाही. वेळ: ',forecastMissing:'सध्या पडताळलेले मॉडेल तास नाहीत.',
   historyDetail:'शेवटचा ऐतिहासिक दिवस ',historyTail:' · शेतातील मोजमाप किंवा भविष्यातील अंदाज नाही.',historyMissing:'पडताळलेला NASA इतिहास नाही.',
   imdDetail:'IMD इशारे जोडलेले नाहीत; चालू इशारा किंवा सुरक्षिततेचा दावा नाही.',
   assessmentDetail:'फक्त शेतकऱ्याच्या नोंदींवर गणना; प्रत्यक्ष उपलब्धता/सुरक्षिततेचा पुरावा नाही.',assessmentMissing:'FastAPI मूल्यमापनासाठी शेतकरी नोंदी आवश्यक.',
   backend:'बॅकएंड निकाल: ',diag:'FastAPI ने हा निकाल का दिला?',notassessed:'मूल्यमापन नाही. वेळ व संसाधने नोंदवून FastAPI चालवा.',
   outcome:'सर्व्हर निकाल: ',outcomeFoot:'. फक्त संसाधन/वेळ मूल्यमापन; पीक सुरक्षिततेचे प्रमाणपत्र नाही.',
   readiness:'ठिकाणाची तयारी',capacity:'घोषित क्षमता',timing:'नियोजन अंतिम वेळ',
   provenance:'बॅकएंड स्रोत: ',none:'अडथळे नोंदलेले नाहीत; शेत सुरक्षा सिद्ध होत नाही.',completed:'पूर्ण झाले ही शेतकऱ्याची नोंद; स्वतंत्र पडताळणी नाही.',
   excluded:'मोजलेले नाही · ',rejected:'बॅकएंडने हे पुष्टी केलेले संसाधन मानले नाही.',receipt:'FastAPI ला दिलेल्या शेतकरी नोंदी',
   target:'लक्ष्य',resource:'क्षमता',hours:'लागणारे तास',deadline:'अंतिम वेळ',ready:'तयारी',units:'हाताळणी एकके',
   foot:'सर्व निर्बंध आणि नाकारलेल्या बाबी FastAPI कडून; संसाधने आपोआप पुष्टी होत नाहीत.'},
  hi:{title:'स्वतंत्र स्रोत की स्थिति',intro:'मौसम मॉडल, सरकारी इतिहास और किसान विवरण अलग-अलग प्रमाण हैं।',
   api:'FastAPI निर्णय इंजन',model:'Open-Meteo मौसम मॉडल',nasa:'NASA POWER ऐतिहासिक ग्रिड',imd:'IMD आधिकारिक चेतावनियाँ',farm:'किसान संसाधन मूल्यांकन',
   connected:'जुड़ा हुआ',missing:'अनुपलब्ध',unverified:'सत्यापित नहीं',pending:'स्रोत प्राप्त हो रहा है',verified:'मॉडल घंटे सत्यापित',cache:'हालिया मॉडल कैश',stale:'पुराना · उपयोग न करें',
   hist:'ऐतिहासिक ग्रिड सत्यापित',histcache:'हालिया इतिहास',unsupported:'यह स्थान समर्थित नहीं',notconnected:'जुड़ा नहीं',unevaluated:'मूल्यांकन नहीं',
   engineDetail:'बैकएंड स्रोत सूची सत्यापित; खेत की सुरक्षा सत्यापित नहीं।',engineMissing:'सत्यापित बैकएंड स्वास्थ्य/स्रोत नहीं हैं।',
   pilot:'केवल जालना, महाराष्ट्र समर्थित है।',forecastDetail:'केवल मॉडल घंटे, वास्तविक बारिश नहीं। समय: ',forecastMissing:'कोई वर्तमान सत्यापित मॉडल घंटे नहीं हैं।',
   historyDetail:'अंतिम ऐतिहासिक दिन ',historyTail:' · खेत का माप या भविष्यवाणी नहीं।',historyMissing:'सत्यापित NASA इतिहास उपलब्ध नहीं है।',
   imdDetail:'IMD चेतावनियाँ जुड़ी नहीं हैं; वर्तमान चेतावनी या सुरक्षित होने का दावा नहीं है।',
   assessmentDetail:'केवल किसान के विवरण से गणना; वास्तविक उपलब्धता या फसल सुरक्षा का प्रमाण नहीं।',assessmentMissing:'FastAPI गणना के लिए किसान विवरण दें।',
   backend:'बैकएंड परिणाम: ',diag:'FastAPI ने यह परिणाम क्यों दिया?',notassessed:'मूल्यांकन नहीं। समय और संसाधन सहेजकर FastAPI चलाएँ।',
   outcome:'सर्वर परिणाम: ',outcomeFoot:'. केवल संसाधन/समय की व्यवहार्यता; फसल सुरक्षा का प्रमाण नहीं।',
   readiness:'स्थान की तैयारी',capacity:'बताई गई क्षमता',timing:'नियोजित अंतिम समय',
   provenance:'बैकएंड स्रोत: ',none:'कोई बाधा नहीं बताई गई; खेत की सुरक्षा सिद्ध नहीं।',completed:'पूरा होने का किसान विवरण; स्वतंत्र जाँच नहीं।',
   excluded:'शामिल नहीं · ',rejected:'बैकएंड ने इसे पुष्टि किया संसाधन नहीं माना।',receipt:'FastAPI को दिए किसान विवरण',
   target:'लक्ष्य',resource:'क्षमता',hours:'आवश्यक घंटे',deadline:'अंतिम समय',ready:'तैयारी',units:'हैंडलिंग इकाइयाँ',
   foot:'सभी प्रतिबंध और अस्वीकृत विकल्प FastAPI से हैं; संसाधन स्वतः पुष्टि नहीं होते।'}
  };
  const intel=()=>intelligenceLabels[state.lang]||intelligenceLabels.en;

  let comparisonGeneration=0,attestedDeadlineRows=[],candidateSignature='';
  let manualGeneration=0,manualDeadlineRows=[];

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
  const alert=el('span','sr-only','Checking FastAPI connection…');
  alert.id='apiConnectionStatus';alert.setAttribute('role','status');
  document.querySelectorAll('section.section')[5].append(alert);

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
      renderSourceMatrix();
      alert.textContent='FastAPI connected · '+health.version+' · '+health.disclaimer;
      entries.replaceChildren();
      for(const s of sources.sources){if(typeof s.title!=='string'||typeof s.url!=='string'||!/^https:\/\//.test(s.url))continue;
        const article=el('article','source-entry');const a=el('a','',s.title);a.href=s.url;a.rel='noopener noreferrer';a.target='_blank';article.append(a,el('p','',s.short_supported_statement||''),el('small','',s.limitations||''));entries.append(article);}
      if(!entries.children.length)entries.textContent='No validated source entries returned.';
      await refreshForecast(false);
    } catch(e){live.health=null;live.sources=null;live.forecast=null;alert.textContent=e.message;entries.textContent='Source registry unavailable. No source evidence can be assumed.';renderWeather();renderSourceMatrix();}
  }
  function clearResult(){
    live.error=null;live.evaluation=null;live.request=null;live.comparison=null;live.replan=null;live.selectedPackage=null;
    resetCandidateComparisons();resetManualComparisons();
    live.evaluatedAtUtc=null;
    renderSourceMatrix();renderDecisionDiagnostics();
  }
  const oldNote=noteChange;
  noteChange=function(){clearResult();oldNote();};
  const oldSummaries=updateSummaries;
  updateSummaries=function(){
    const place=state.place.city+'|'+state.place.state;
    if(previousPlace!==place){previousPlace=place;live.forecast=null;live.selectedHour=null;clearResult();}
    oldSummaries();
    renderForecastQuality();
    renderHourlyEvidence();renderSourceMatrix();
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
  const qcInspector=el('section','source-qc-inspector');
  qcInspector.id='forecastQualityInspector';
  qcInspector.setAttribute('role','status');
  qcInspector.setAttribute('aria-live','polite');
  qcPanel.append(qcInspector);
  let qcFocus='reported';
  const qcHelp={
    provenance:'This is an Open-Meteo numerical forecast, not a field station observation or official IMD warning.',
    retrieved:'UTC indicates when the backend retrieved the model, not when rainfall occurred.',
    elapsed:'Forecasts older than 120 minutes cannot supply selectable candidate deadlines.',
    reported:'These are source-native modeled hours. Only future hours can become candidate deadlines.',
    rainCount:'Unavailable precipitation values are unknown, never 0 mm. Modeled 0 mm never guarantees a dry field.',
    chanceCount:'Hourly probabilities must not be summed or interpreted as a probability for the whole period.',
    duplicates:'Duplicate timestamps could distort evidence and are reported for inspection.',
    gaps:'A missing timestamp is missing evidence, not evidence of zero rainfall.'
  };
  function showQcDetail(d){
    qcInspector.replaceChildren();
    if(!d){qcInspector.append(el('p','','No current validated Jalna model. Refresh the forecast for quality inspection; manually chosen deadlines remain possible.'));return;}
    const current=qcMetrics.querySelector('[data-quality="'+qcFocus+'"] strong');
    qcInspector.append(el('strong','',current?.textContent||'Quality inspection'),el('p','',qcHelp[qcFocus]));
    let affected=[];
    if(qcFocus==='rainCount')affected=d.source.hours.filter(h=>h.precipitation_mm===null).map(h=>h.time);
    if(qcFocus==='chanceCount')affected=d.source.hours.filter(h=>h.precipitation_probability_pct===null).map(h=>h.time);
    if(qcFocus==='duplicates'){
      const seen=new Set();affected=d.source.hours.filter(h=>seen.has(h.time)||!seen.add(h.time)).map(h=>h.time);
    }
    if(['rainCount','chanceCount','duplicates'].includes(qcFocus)){
      qcInspector.append(el('p','',affected.length?'Affected source hours: '+affected.slice(0,12).join(' · ')+
        (affected.length>12?' · '+(affected.length-12)+' more':''):
        'No affected model hours were found in this data-quality category.'));
    }
    if(qcFocus==='rainCount'||qcFocus==='chanceCount'){
      const action=el('button','btn source-qc-drill',
        qcFocus==='rainCount'?'Inspect missing rainfall hours':'Inspect missing probability hours');
      action.type='button';
      action.addEventListener('click',()=>{
        hourlyScope.value=qcFocus==='rainCount'?'missing-rain':'missing-chance';
        hourlyDate.value='all';renderHourlyEvidence();
        hourlyPanel.scrollIntoView({behavior:'smooth',block:'start'});
      });qcInspector.append(action);
    }
    const link=el('a','source-qc-reference','Open-Meteo model documentation');
    link.href='https://open-meteo.com/en/docs';link.target='_blank';link.rel='noopener noreferrer';
    qcInspector.append(link);
  }
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
  const hourlyScopeLabel=el('label','hourly-evidence-filter');
  const hourlyScope=el('select','hourly-evidence-select');hourlyScope.id='hourlyEvidenceScope';
  for(const [value,label] of [['all','All hours · future first'],['upcoming','Upcoming candidate hours'],
    ['past','Past hours · evidence only'],['missing-rain','Missing rainfall values'],
    ['missing-chance','Missing probability values']]){
    const option=el('option','',label);option.value=value;hourlyScope.append(option);
  }
  hourlyScopeLabel.append(el('span','','Inspect model hours'),hourlyScope);hourlyControls.append(hourlyScopeLabel);
  hourlyScope.addEventListener('change',renderHourlyEvidence);
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
    hourlyDayExport.title=hourlyDate.value==='all'?'Choose one IST date to enable selected-day CSV.':evidenceText('dayExportNote');
    if(!evidence){
      hourlySummary.textContent=okLocation()?evidenceText('hourlyNoData'):evidenceText('hourlyWrongPlace');
      hourlyTableContainer.append(el('p','hourly-evidence-note',evidenceText('hourlyEmpty')));
      return;
    }
    const isFuture=h=>Date.parse(h.time+':00+05:30')>Date.now()+60000;
    const filtered=hours.filter(h=>(hourlyDate.value==='all'||h.time.startsWith(hourlyDate.value))&&
      (hourlyScope.value==='all'||(hourlyScope.value==='upcoming'&&isFuture(h))||
       (hourlyScope.value==='past'&&!isFuture(h))||
       (hourlyScope.value==='missing-rain'&&h.precipitation_mm===null)||
       (hourlyScope.value==='missing-chance'&&h.precipitation_probability_pct===null)))
      .sort((a,b)=>Number(isFuture(b))-Number(isFuture(a))||a.time.localeCompare(b.time));
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
    table.append(body);
    if(!filtered.length)hourlyTableContainer.append(el('p','hourly-evidence-note',
      'No model records match these filters. This does not establish dry weather.'));
    else hourlyTableContainer.append(table);
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
      showQcDetail(null);return;
    }
    const add=(key,label,value)=>{
      const item=el('button','source-qc-item');item.type='button';item.dataset.quality=key;
      item.setAttribute('aria-controls','forecastQualityInspector');
      item.setAttribute('aria-expanded',String(key===qcFocus));
      if(key===qcFocus)item.classList.add('is-active');
      item.append(el('strong','',label),el('span','',value));
      item.addEventListener('click',()=>{qcFocus=key;renderForecastQuality();});
      qcMetrics.append(item);
    };
    add('provenance',evidenceText('provenance'),d.source.status==='cached_recent'?evidenceText('cached'):evidenceText('fetched'));
    add('retrieved',evidenceText('retrieved'),d.source.retrieved_at_utc);
    add('elapsed',evidenceText('elapsed'),d.ageMinutes+' '+evidenceText('minutes'));
    add('reported',evidenceText('reported'),String(d.records));
    add('rainCount',evidenceText('rainCount'),d.rainCount+'/'+d.records+' '+evidenceText('rainValues'));
    add('chanceCount',evidenceText('chanceCount'),d.chanceCount+'/'+d.records+' '+evidenceText('chanceValues'));
    add('duplicates',evidenceText('duplicates'),String(d.duplicateHours)+' '+evidenceText('duplicateUnits'));
    add('gaps',evidenceText('gaps'),d.gapCount===null?evidenceText('gapLong'):
      String(d.gapCount)+' '+evidenceText('gapUnits'));
    showQcDetail(d);
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
  const windowI18n={
    en:{start:'Upcoming model hours beginning ',window:'Next ',hours:' forecast hours',
      modeled:'Modeled rainfall: ',partial:'Known partial rainfall: ',none:'Rainfall unavailable',
      coverage:'Rainfall coverage: ',units:' hourly values. ',complete:'All requested hours reported.',
      incomplete:'Incomplete; missing hours are not dry hours.',
      maximum:'Highest individual-hour model probability: ',unavailable:'Unavailable',
      probability:'. Not a probability for the whole window.',
      note:' IST · descriptive precipitation sums only; no safe-action rainfall threshold.',
      empty:'No future source-native hourly records available; no model totals calculated.'},
    mr:{start:'मॉडेलचे पुढील तास: ',window:'पुढील ',hours:' हवामान अंदाज तास',
      modeled:'मॉडेलनुसार पाऊस: ',partial:'उपलब्ध तासांतील पाऊस: ',none:'पावसाचा डेटा उपलब्ध नाही',
      coverage:'पावसाच्या नोंदी: ',units:' तास. ',complete:'सर्व तासांची नोंद उपलब्ध.',
      incomplete:'अपूर्ण; माहिती नसणे म्हणजे पाऊस नाही असे नाही.',
      maximum:'एका तासातील सर्वाधिक मॉडेल शक्यता: ',unavailable:'उपलब्ध नाही',
      probability:'. ही संपूर्ण कालावधीची शक्यता नाही.',
      note:' IST · केवळ वर्णनात्मक मॉडेल आकडे; सुरक्षित शेतीचा निकष नाही.',
      empty:'पुढील मॉडेल तास उपलब्ध नाहीत; कोणतीही बेरीज दाखवलेली नाही.'},
    hi:{start:'मॉडल का आगामी समय: ',window:'अगले ',hours:' पूर्वानुमान घंटे',
      modeled:'मॉडल वर्षा: ',partial:'उपलब्ध घंटों की वर्षा: ',none:'वर्षा डेटा उपलब्ध नहीं',
      coverage:'वर्षा डेटा उपलब्ध: ',units:' घंटे। ',complete:'सभी घंटे उपलब्ध हैं।',
      incomplete:'अधूरा डेटा; अनुपस्थित घंटे शून्य वर्षा नहीं हैं।',
      maximum:'एक घंटे की अधिकतम मॉडल संभावना: ',unavailable:'उपलब्ध नहीं',
      probability:'. यह पूरे समय की संभावना नहीं है।',
      note:' IST · केवल मॉडल अनुमान; सुरक्षित खेती की सीमा नहीं।',
      empty:'आगामी मॉडल घंटे उपलब्ध नहीं; कोई कुल वर्षा नहीं दिखाई गई।'}
  };
  // Descriptive sums of genuine future model hours, never a safety cutoff.
  function renderForecastWindows(chart,forecast){
    const tr=windowI18n[state.lang]||windowI18n.en;
    const now=Date.now(),seen=new Set();
    const future=forecast.hours.filter(h=>{
      const at=Date.parse(h.time+':00+05:30');
      if(!Number.isFinite(at)||at<now||seen.has(h.time))return false;
      seen.add(h.time);return true;
    }).sort((a,b)=>a.time.localeCompare(b.time));
    if(!future.length){
      chart.append(el('p','forecast-window-label',tr.empty));
      return;
    }
    const start=Date.parse(future[0].time+':00+05:30');
    const byHour=new Map(future.map(h=>[Date.parse(h.time+':00+05:30'),h]));
    chart.append(el('p','forecast-window-label',tr.start+
      future[0].time.replace('T',' ') +tr.note));
    const grid=el('div','forecast-window-grid');grid.id='forecastWindowSummary';
    for(const n of [6,12,24]){
      const rows=Array.from({length:n},(_,i)=>byHour.get(start+i*3_600_000)).filter(Boolean),
        rain=rows.filter(h=>h.precipitation_mm!==null),
        prob=rows.filter(h=>h.precipitation_probability_pct!==null),
        complete=rows.length===n&&rain.length===n;
      const card=el('article','forecast-window-card');
      card.append(el('strong','',tr.window+n+tr.hours));
      card.append(el('span','window-value',rain.length?
        (complete?tr.modeled:tr.partial)+
        num(rain.reduce((total,h)=>total+h.precipitation_mm,0))+' mm':tr.none));
      card.append(el('small','',tr.coverage+rain.length+'/'+n+tr.units+
        (complete?tr.complete:tr.incomplete)));
      card.append(el('small','',tr.maximum+
        (prob.length?num(Math.max(...prob.map(h=>h.precipitation_probability_pct)))+'%':tr.unavailable)+
        tr.probability));
      grid.append(card);
    }
    chart.append(grid);
  }
  // F27: persist ONLY last-success metadata, never API payloads or farmer inputs.
  const lastSourceKey='agri-foresight-source-receipts-v1';
  const safeReceiptTime=value=>{
    const ms=Date.parse(value||'');
    return Number.isFinite(ms)&&ms<=Date.now()+60000&&
      ms>=Date.now()-90*86400000?new Date(ms).toISOString():null;
  };
  const readLastReceipts=()=>{
    try{
      const raw=localStorage.getItem(lastSourceKey);
      if(!raw||raw.length>700)return {};
      const value=JSON.parse(raw);
      if(value?.version!==1||typeof value!=='object')return {};
      return {model:safeReceiptTime(value.model),nasa:safeReceiptTime(value.nasa)};
    }catch{return {};}
  };
  const recordSourceReceipt=kind=>{
    const at=new Date().toISOString(),existing=readLastReceipts();
    const next={version:1,model:existing.model||null,nasa:existing.nasa||null};
    next[kind]=at;
    try{localStorage.setItem(lastSourceKey,JSON.stringify(next));}catch{}
    renderConnectivity();
  };
  const connectivity=el('section','network-evidence');
  connectivity.id='networkEvidenceStatus';
  connectivity.setAttribute('aria-label','Offline status and last successful provider receipt');
  const networkTitle=el('h3'),networkState=el('strong','network-state'),networkDetails=el('p','network-details');
  const networkReceipt=el('div','network-receipts'),networkDisclosure=el('small','network-disclosure');
  connectivity.append(networkTitle,networkState,networkDetails,networkReceipt,networkDisclosure);
  here('weatherChart').insertAdjacentElement('afterend',connectivity);
  function renderConnectivity(){
    const t=climateL(),receipts=readLastReceipts(),offline=navigator.onLine===false;
    connectivity.dataset.network=offline?'offline':'unverified';
    networkTitle.textContent=t.offlineTitle;
    networkState.textContent=offline?t.offline:t.browserOnline;
    networkDetails.textContent=offline?t.offlineNotice:t.connectedNotice;
    networkReceipt.replaceChildren();
    const line=(label,stamp)=>{
      const p=el('p','network-receipt-line',label+': '+(stamp||t.noSaved));
      networkReceipt.append(p);
    };
    line(t.lastModel,receipts.model);line(t.lastNASA,receipts.nasa);
    networkDisclosure.textContent=t.metadata;
  }
  window.addEventListener('online',()=>{renderConnectivity();renderEvidenceContrast();renderWeather();});
  window.addEventListener('offline',()=>{renderConnectivity();renderEvidenceContrast();renderWeather();});
  function renderWeather(){
    renderSourceMatrix();
    renderConnectivity();
    renderEvidenceContrast();
    renderCandidateComparisonChoices();
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
    chip.textContent=navigator.onLine===false?'OFFLINE · LAST-RECEIVED MODEL':
      f.status==='retrieved_live'?'LIVE MODEL FORECAST':'RECENT VERIFIED CACHE';
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
      if(okLocation()&&isCurrent()&&live.forecast.hours.length)recordSourceReceipt('model');
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
  // Reject impossible calendar dates before sending a timestamp to FastAPI.
  // IST is fixed UTC+05:30; Date.parse alone can normalize invalid day numbers.
  function isValidISTDeadline(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return false;
    const [year,month,day,hour,minute]=value.match(/\d+/g).map(Number);
    if(year<1||month<1||month>12||hour>23||minute>59)return false;
    const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
    if(day<1||day>daysInMonth)return false;
    const timestamp=Date.parse(value+':00+05:30');
    return Number.isFinite(timestamp);
  }
  function requestFromForm(){
    if(!okLocation())throw new Error('The server-authoritative assessment currently supports Jalna, Maharashtra only.');
    if(here('deadlineInput').value!==state.deadline)throw new Error('Save the displayed candidate deadline before evaluating.');
    if(!isValidISTDeadline(state.deadline))throw new Error('Save a valid candidate deadline on Page 02.');
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
      live.request=req;live.evaluation=result;live.evaluatedAtUtc=new Date().toISOString();
      here('resourceNotice').textContent='Farmer-reported inputs saved for this session; evaluated by FastAPI. Resources are not independently certified.';
    } catch(e){live.error=e.message;here('resourceNotice').textContent=e.message;here('resultReason').textContent=e.message;}
    finally{live.busy=false;button.disabled=false;button.textContent='Evaluate using FastAPI';renderAssessment();renderPackages();renderSummary();renderSourceMatrix();}
  }
  // EX-16 / F17 — organize, never recompute, FastAPI explanations.
  const diagnosis=el('section','backend-diagnosis');
  diagnosis.id='decisionDiagnostics';
  diagnosis.setAttribute('aria-label','FastAPI feasibility explanation and input lineage');
  const diagnosisTitle=el('h3','','Why did FastAPI return this result?');
  const decisionNotes=el('div','backend-diagnosis-body');
  decisionNotes.id='decisionDiagnosticNotes';
  decisionNotes.setAttribute('aria-live','polite');
  diagnosis.append(diagnosisTitle,decisionNotes);
  here('constraintList').insertAdjacentElement('afterend',diagnosis);
  function renderDecisionDiagnostics(){
    const t=intel(),report=live.evaluation,request=live.request;
    diagnosisTitle.textContent=t.diag;decisionNotes.replaceChildren();
    if(!report||!request){
      decisionNotes.append(el('p','gov-intro',t.notassessed));return;
    }
    decisionNotes.append(el('p','gov-intro',t.outcome+report.status.toUpperCase()+t.outcomeFoot));
    const receipt=el('article','backend-diagnosis-item');
    receipt.dataset.status='declared';
    receipt.append(el('strong','',t.receipt));
    receipt.append(el('p','',[
      t.target+': '+num(request.target_units)+' '+t.units,
      t.resource+': '+num(request.capacity_units)+' '+t.units,
      t.hours+': '+num(request.required_hours),
      t.deadline+': '+request.deadline,
      t.ready+': '+String(request.readiness)
    ].join(' · ')));
    decisionNotes.append(receipt);
    const names={readiness:t.readiness,capacity:t.capacity,timing:t.timing};
    let found=0;
    for(const c of report.baseline?.constraints||[]){
      if(c.status==='pass')continue;
      ++found;
      const note=el('article','backend-diagnosis-item');
      note.dataset.status=c.status;
      note.append(el('strong','',(names[c.id]||c.id)+' · '+c.status.toUpperCase()),
        el('p','',c.explanation),el('small','',t.provenance+(c.provenance||'FastAPI')));
      decisionNotes.append(note);
    }
    if(!found)decisionNotes.append(el('p','gov-intro',
      report.status==='completed'?t.completed:t.none));
    for(const x of report.excluded_changes||[]){
      const note=el('article','backend-diagnosis-item');
      note.dataset.status='excluded';
      note.append(el('strong','',t.excluded+x.id),el('p','',x.reason||t.rejected));
      decisionNotes.append(note);
    }
    decisionNotes.append(el('small','',t.foot));
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
    if(live.selectedPackage===null||!packs[live.selectedPackage]){compare.append(el('p','',packs.length?'Select a package, then use Compare / replan with FastAPI.':'No eligible package selected.'));return;}
    const p=packs[live.selectedPackage],a=live.evaluation.baseline,b=p.projected;
    compare.append(el('h3','', 'Selected conditional package'));
    compare.append(el('p','', 'Before: '+a.status.toUpperCase()+' · '+num(a.projected_capacity_units)+' capacity / '+num(a.projected_target_units)+' target.'));
    compare.append(el('p','', 'Projected: '+b.status.toUpperCase()+' · '+num(b.projected_capacity_units)+' capacity / '+num(b.projected_target_units)+' target.'));
    compare.append(el('p','', 'Original work left unhandled: '+num(b.original_target_unhandled_units)+' handling units. '+p.warning));
    if(live.comparison){compare.append(el('p','live-valid','Backend comparison: '+live.comparison.changes.status_before+' → '+live.comparison.changes.status_after+'. '+live.comparison.interpretation));}
    if(live.replan){compare.append(el('p','live-valid','Server-attested forecast-hour replan: '+live.replan.forecast_selection.selected_hour_local+' IST · '+live.replan.forecast_selection.attribution));}
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
    multiRun.disabled=!(live.request&&live.evaluation&&candidateHours().length);
    multiStatus.textContent=multiRun.disabled?
      'Current authenticated model hours and evaluated resources are required.':
      'Selection changed. Submit selected hours for fresh FastAPI attestation.';
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
    const hours=candidateHours(),key=(live.forecast?.retrieved_at_utc||'')+'|'+hours.map(h=>h.time).join('|');
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
    manualRun.disabled=!(live.request&&live.evaluation&&okLocation());
    manualStatus.textContent=manualRun.disabled?
      'Evaluate farmer-declared resources before comparing manual deadlines.':
      'Selection changed. Compare user-selected times again with FastAPI.';
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
    if(!selected.every(time=>isValidISTDeadline(time)&&Date.parse(time+':00+05:30')>Date.now()+60000)){
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
  updateSummaryUI=renderSummary;
  function renderSummary(){
    renderCandidateComparisonChoices();renderManualControls();
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
  // F23: a standalone print-ready record of currently verified source state.
  const printPanel=el('section','panel print-evidence-receipt');
  printPanel.id='printEvidenceReceipt';
  printPanel.setAttribute('aria-label','Print-ready science evidence report');
  const printHeading=el('h2'),printIntro=el('p','print-receipt-note');
  const printRows=el('div','print-evidence-rows');printRows.id='printEvidenceReceiptRows';
  const printDisclosure=el('p','print-receipt-note');
  printPanel.append(printHeading,printIntro,printRows,printDisclosure);
  document.querySelector('section.section[data-page="5"]').append(printPanel);
  function renderPrintEvidence(){
    const t=receiptLanguage(),supported=okLocation(),f=live.forecast,g=governmentClimateData;
    const report=live.evaluation,request=live.request,valid=!!(report&&request);
    printHeading.textContent=t.printTitle;printIntro.textContent=t.summary;
    printDisclosure.textContent=t.caution;
    printRows.replaceChildren();
    const add=(key,value)=>{const row=el('div','print-evidence-row');
      row.append(el('strong','',key),el('span','',value));printRows.append(row);};
    add(t.made,new Date().toISOString());
    add(t.place,supported?'Jalna, Maharashtra · already-picked cotton · district reference':
      t.unsupported);
    add(t.result,valid?'FastAPI · '+report.status.toUpperCase()+' · '+report.message:t.noResult);
    add(t.input,valid?
      'Target: '+num(request.target_units)+' handling units · Capacity: '+
      num(request.capacity_units)+' handling units · Required hours: '+
      num(request.required_hours)+' · Readiness: '+request.readiness:t.noInput);
    add(t.deadline,valid?request.deadline:t.noInput);
    add(t.forecast,supported&&isCurrent()&&f?.hours?.length?
      'NON-GOVERNMENT HOSTED MODEL · '+f.hours.length+' source hours · retrieved '+
      f.retrieved_at_utc+' · '+(f.attribution||'Open-Meteo'):t.noForecast);
    const historical=supported&&governmentClimateVisibleState==='verified'&&
      g?.source==='NASA POWER (US government)'&&g.data_kind==='government_gridded_historical'&&
      ['retrieved_live','cached_recent'].includes(g.status)&&g.days?.length>0;
    add(t.nasa,historical?'NASA POWER US-GOVERNMENT HISTORICAL GRID · latest '+
      g.latest_data_date+' · retrieved '+g.retrieved_at_utc:t.noHistory);
    add(t.warnings,t.noIMD);
    const constrained=report?.baseline?.constraints?.filter(c=>c.status!=='pass')||[];
    add(t.constraints,valid?(constrained.length?
      constrained.map(c=>c.id+' ['+c.status+']: '+c.explanation).join(' | '):t.noConstraint):
      t.unknownConstraint);
    const excluded=report?.excluded_changes||[];
    add(t.excluded,valid?(excluded.length?excluded.map(c=>c.id+': '+c.reason).join(' | '):
      t.noExcluded):t.unknownConstraint);
    const selected=valid&&live.selectedPackage!==null?report.packages?.[live.selectedPackage]:null;
    add(t.selected,selected?selected.change_ids.join(', ')+
      ' · '+selected.projected.status.toUpperCase()+' · conditional only':t.noSelected);
    add(t.comparisons,'Open-Meteo/FastAPI: '+attestedDeadlineRows.filter(x=>x.value).length+
      ' · User-selected/FastAPI: '+manualDeadlineRows.filter(x=>x.response).length+
      ' · counts of successful responses, not completed farm actions');
  }
  // The existing HTML print handler remains in charge of invoking the OS dialog.
  here('printSummary').addEventListener('click',renderPrintEvidence,true);
  window.addEventListener('beforeprint',renderPrintEvidence);
  const download=el('button','btn','Download evidence JSON');download.type='button';download.id='downloadEvidence';
  here('printSummary').insertAdjacentElement('afterend',download);
  download.addEventListener('click',()=>{
    const evidence={generated_at_utc:new Date().toISOString(),location:state.place,model_scope:'Jalna already-picked cotton preparation only',
      disclosure:'Conditional simulation using user declarations and genuine FastAPI output; not field-validated agricultural advice.',
      forecast:live.forecast,source_registry:live.sources,evaluation:live.evaluation,comparison:live.comparison,
      replan:live.replan,selected_package:live.selectedPackage,request:live.request,
      government_climate_historical:governmentClimateData,
      source_attested_model_deadlines:attestedDeadlineRows.filter(x=>x.value).map(x=>({
        candidate_hour_ist:x.hour,source_type:'Open-Meteo model / FastAPI replan',
        server_response:x.value
      })),
      user_selected_manual_deadlines:manualDeadlineRows.filter(x=>x.response).map(x=>({
        candidate_hour_ist:x.hour,source_type:'user-declared IST / FastAPI compare',
        server_response:x.response
      }))};
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
      download:'Download verified NASA JSON',csv:'Download verified NASA CSV',
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
      download:'पडताळलेला NASA JSON घ्या',csv:'पडताळलेला NASA CSV घ्या',
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
      download:'सत्यापित NASA JSON डाउनलोड करें',csv:'सत्यापित NASA CSV डाउनलोड करें',
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
  // F05: category-separated *period summaries*, never a forecast-versus-observation score.
  const evidenceCompare=el('section','evidence-contrast');
  evidenceCompare.id='historicalModelComparison';
  evidenceCompare.setAttribute('aria-label','Forecast and historical climate evidence periods');
  const compareHeading=el('h3'),compareIntro=el('p','evidence-disclosure');
  const compareGrid=el('div','evidence-contrast-grid');
  const compareCaution=el('small','evidence-disclosure');
  evidenceCompare.append(compareHeading,compareIntro,compareGrid,compareCaution);
  govPanel.insertBefore(evidenceCompare,govRows);
  function renderEvidenceContrast(){
    const t=climateL(),f=live.forecast,g=governmentClimateData;
    compareHeading.textContent=t.contrastTitle;
    compareIntro.textContent=t.contrastIntro;
    compareCaution.textContent=t.noComparison;
    compareGrid.replaceChildren();
    const card=(label,period,quantity,coverage,note,kind)=>{
      const node=el('article','evidence-contrast-card');
      node.dataset.kind=kind;
      node.append(el('strong','',label),el('small','',t.period+': '+period),
        el('span','contrast-value',quantity),el('small','',coverage),
        el('small','',note));
      compareGrid.append(node);
    };
    const now=Date.now(),m=isCurrent()&&Array.isArray(f?.hours);
    const future=m?f.hours.filter(h=>{
      const time=Date.parse(h.time+':00+05:30');
      return Number.isFinite(time)&&time>=now;
    }).sort((a,b)=>a.time.localeCompare(b.time)):[];
    // Start the 24-hour span at the first actual future source hour,
    // using absolute IST hourly slots; absent hours remain missing.
    const start=future.length?Date.parse(future[0].time+':00+05:30'):NaN;
    const byHour=new Map(future.map(h=>[Date.parse(h.time+':00+05:30'),h]));
    const selected=Number.isFinite(start)?
      Array.from({length:24},(_,i)=>byHour.get(start+i*3600000)):new Array(24);
    const rain=selected.filter(h=>h&&Number.isFinite(h.precipitation_mm));
    const modelPeriod=future.length?future[0].time.replace('T',' ')+' IST → '+
      new Date(start+23*3600000).toLocaleString('en-GB',{timeZone:'Asia/Kolkata',
        year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' IST':
      t.modelMissing;
    card(t.forecastTitle,modelPeriod,rain.length?
      t.modelData+': '+num(rain.reduce((sum,h)=>sum+h.precipitation_mm,0))+' mm':
      t.modelMissing,t.rainCoverage+': '+rain.length+'/24 '+t.hours,
      t.gap,'model');
    const historical=okLocation()&&governmentClimateVisibleState==='verified'&&g&&
      ['retrieved_live','cached_recent'].includes(g.status)&&
      g.source==='NASA POWER (US government)'&&g.data_kind==='government_gridded_historical'&&
      Array.isArray(g.days)&&g.days.length>0;
    const days=historical?g.days.slice(-14):[];
    const rainDays=days.filter(d=>Number.isFinite(d.precipitation_mm_day));
    card(t.historicalTitle,days.length?
      days[0].date+' → '+days[days.length-1].date:t.historyMissing,
      rainDays.length?t.historyData+': '+
        num(rainDays.reduce((sum,d)=>sum+d.precipitation_mm_day,0))+' mm':
        t.historyMissing,t.rainCoverage+': '+rainDays.length+'/'+days.length+' '+t.days,
      t.gap,'historical');
  }
  // F11: source-native daily charts plus accessible exact-value table.
  const historyPlot=el('section','nasa-history-plot');
  historyPlot.id='nasaHistoryChart';historyPlot.hidden=true;
  historyPlot.setAttribute('aria-label','NASA historical daily rainfall and temperature chart');
  const historyPlotTitle=el('h3'),historyPlotInfo=el('p','evidence-disclosure');
  const rainTitle=el('h4'),rainBars=el('div','nasa-bars');
  rainBars.id='nasaRainChart';
  const tempTitle=el('h4'),tempPlot=el('div','nasa-temperature-wrap');
  const chartTable=el('details','nasa-chart-data'),tableSummary=el('summary');
  const dataTable=el('table','nasa-data-table');dataTable.id='nasaChartTable';
  chartTable.append(tableSummary,dataTable);
  historyPlot.append(historyPlotTitle,historyPlotInfo,rainTitle,rainBars,
    tempTitle,tempPlot,chartTable);
  govPanel.insertBefore(historyPlot,govRows);
  const svgNS='http://www.w3.org/2000/svg';
  const svgPart=(name,attrs={})=>{
    const element=document.createElementNS(svgNS,name);
    for(const [k,v] of Object.entries(attrs))element.setAttribute(k,String(v));
    return element;
  };
  function clearHistoricalChart(){
    historyPlot.hidden=true;rainBars.replaceChildren();tempPlot.replaceChildren();
    dataTable.replaceChildren();renderEvidenceContrast();
  }
  function renderHistoricalChart(data){
    if(!okLocation()||!data||data.data_kind!=='government_gridded_historical'||
      !['retrieved_live','cached_recent'].includes(data.status)||!Array.isArray(data.days)){
      clearHistoricalChart();return;
    }
    const t=climateL(),rows=data.days.slice(-14);
    if(!rows.length){clearHistoricalChart();return;}
    historyPlot.hidden=false;
    historyPlotTitle.textContent=t.chartTitle;
    historyPlotInfo.textContent=t.chartIntro;
    rainTitle.textContent=t.barTitle;
    tempTitle.textContent=t.lineTitle;
    tableSummary.textContent=t.showTable;
    rainBars.replaceChildren();tempPlot.replaceChildren();dataTable.replaceChildren();
    const maxRain=Math.max(0,...rows.filter(d=>Number.isFinite(d.precipitation_mm_day))
      .map(d=>d.precipitation_mm_day));
    rows.forEach(row=>{
      const item=el('div','nasa-bar-day');
      const track=el('div','nasa-bar-track');
      const filled=Number.isFinite(row.precipitation_mm_day);
      if(filled){
        const bar=el('div','nasa-bar-fill');
        bar.style.height=(maxRain>0?Math.max(0,row.precipitation_mm_day/maxRain*100):0)+'%';
        track.append(bar);
      }else track.append(el('span','nasa-bar-gap','—'));
      item.setAttribute('aria-label',row.date+': '+(filled?row.precipitation_mm_day+' mm/day':t.missing));
      item.append(track,el('small','',row.date.slice(5)));
      rainBars.append(item);
    });
    const temps=rows.map(row=>row.temperature_c).filter(Number.isFinite);
    if(temps.length){
      const lo=Math.min(...temps),hi=Math.max(...temps);
      const span=Math.max(hi-lo,1),svg=svgPart('svg',{
        viewBox:'0 0 700 150',role:'img','aria-label':t.lineTitle,
        preserveAspectRatio:'xMidYMid meet'
      });
      const title=svgPart('title');title.textContent=t.lineTitle;svg.append(title);
      const y=value=>120-(value-lo)/span*95;
      const x=i=>25+i*650/Math.max(rows.length-1,1);
      // Never draw across an unknown temperature or missing calendar day.
      let segment=[];
      const flush=()=>{
        if(segment.length>1)svg.append(svgPart('polyline',{
          points:segment.map(v=>v.join(',')).join(' '),fill:'none',
          stroke:'currentColor','stroke-width':3,'stroke-linecap':'round',
          'stroke-linejoin':'round'
        }));
        segment=[];
      };
      rows.forEach((row,i)=>{
        if(!Number.isFinite(row.temperature_c)){flush();return;}
        if(i&&Number.isFinite(rows[i-1].temperature_c)&&
          Date.parse(row.date)-Date.parse(rows[i-1].date)!==86400000)flush();
        const cx=x(i),cy=y(row.temperature_c);
        segment.push([cx,cy]);
        const circle=svgPart('circle',{cx,cy,r:4,fill:'currentColor'});
        const pointLabel=svgPart('title');pointLabel.textContent=row.date+': '+row.temperature_c+' °C';
        circle.append(pointLabel);svg.append(circle);
      });
      flush();
      const high=svgPart('text',{x:2,y:14,'font-size':13,fill:'currentColor'});
      high.textContent=num(hi)+'°';
      const low=svgPart('text',{x:2,y:142,'font-size':13,fill:'currentColor'});
      low.textContent=num(lo)+'°';
      svg.append(high,low);tempPlot.append(svg);
    }else tempPlot.append(el('p','evidence-disclosure',t.missing));
    const head=el('thead'),headerRow=el('tr');
    [t.date,t.rain,t.temperature].forEach(text=>headerRow.append(el('th','',text)));
    head.append(headerRow);
    const body=el('tbody');
    rows.forEach(row=>{
      const tr=el('tr');
      tr.append(el('th','',row.date),
        el('td','',Number.isFinite(row.precipitation_mm_day)?
          num(row.precipitation_mm_day):t.missing),
        el('td','',Number.isFinite(row.temperature_c)?
          num(row.temperature_c):t.missing));
      body.append(tr);
    });
    dataTable.append(head,body);
  }


  let governmentClimateData=null;
  let governmentClimateRequest=0;
  let governmentClimateVisibleState='loading';
  let governmentClimateErrorMessage='';
  // EX-16 / F12 — five independent data/source status receipts.
  const sourcePanel=el('section','panel source-matrix');
  sourcePanel.id='evidenceSourceMatrix';
  sourcePanel.setAttribute('aria-label','Verified data source and engine status');
  const sourceTitle=el('h2','','Verified sources');
  const sourceIntro=el('p','source-matrix-intro');
  const sourceGrid=el('div','source-matrix-grid');
  sourceGrid.id='evidenceSourceGrid';
  sourceGrid.setAttribute('aria-live','polite');
  sourcePanel.append(sourceTitle,sourceIntro,sourceGrid);
  document.querySelector('section.section[data-page="0"]').append(sourcePanel);
  function renderSourceMatrix(){
    const t=intel(),supported=okLocation();
    sourceTitle.textContent=t.title;sourceIntro.textContent=t.intro;
    sourceGrid.replaceChildren();
    const add=(name,status,detail,kind)=>{
      const card=el('article','source-matrix-card');card.dataset.kind=kind;
      card.append(el('strong','',name),el('span','source-matrix-state',status),el('small','',detail));
      sourceGrid.append(card);
    };
    const connected=live.health?.ok===true&&Array.isArray(live.sources?.sources);
    add(t.api,connected?t.connected:t.unverified,connected?t.engineDetail:t.engineMissing,
      connected?'ready':'unavailable');
    if(!supported){
      add(t.model,t.unsupported,t.pilot,'unavailable');
      add(t.nasa,t.unsupported,t.pilot,'unavailable');
    }else{
      const f=live.forecast,current=isCurrent()&&Array.isArray(f?.hours)&&f.hours.length>0;
      const stale=f&&['retrieved_live','cached_recent','stale_cache'].includes(f.status)&&
        (!isCurrent()||f.status==='stale_cache');
      add(t.model,current?(f.status==='cached_recent'?t.cache:t.verified):
        stale?t.stale:live.forecastLoading?t.pending:t.missing,
        current?t.forecastDetail+f.retrieved_at_utc+' · '+f.hours.length+' h':t.forecastMissing,
        current?'model':'unavailable');
      const g=governmentClimateData;
      const verified=governmentClimateVisibleState==='verified'&&g&&
        ['retrieved_live','cached_recent'].includes(g.status)&&
        g.data_kind==='government_gridded_historical'&&
        g.source==='NASA POWER (US government)'&&
        Array.isArray(g.days)&&g.days.length>0;
      add(t.nasa,verified?(g.status==='cached_recent'?t.histcache:t.hist):
        governmentClimateVisibleState==='loading'?t.pending:t.missing,
        verified?t.historyDetail+g.latest_data_date+' · '+g.retrieved_at_utc+t.historyTail:
        t.historyMissing,verified?'historical':'unavailable');
    }
    add(t.imd,t.notconnected,t.imdDetail,'unavailable');
    const result=live.evaluation;
    add(t.farm,result?t.backend+result.status.toUpperCase():t.unevaluated,
      result?t.assessmentDetail:t.assessmentMissing,result?'decision':'unavailable');
    renderSourceActivity();renderPrintEvidence();
  }
  // F13: independent source timestamps. Recalculate = no new API requests.
  const sourceActivity=el('section','source-activity');
  sourceActivity.id='sourceActivityReceipt';
  sourceActivity.setAttribute('aria-label','Evidence source timing and freshness');
  const activityTitle=el('h3');
  const activityHelp=el('p','source-matrix-intro');
  const activityChecked=el('time','activity-checked');
  activityChecked.id='sourceActivityChecked';
  const activityRows=el('div','source-activity-rows');activityRows.id='sourceActivityRows';
  const recalc=el('button','btn','Recalculate displayed ages');
  recalc.type='button';recalc.id='recheckSourceAges';
  sourceActivity.append(activityTitle,activityHelp,activityChecked,activityRows,recalc);
  sourcePanel.append(sourceActivity);
  function renderSourceActivity(){
    const t=receiptLanguage(),now=Date.now(),supported=okLocation(),forecast=live.forecast;
    activityTitle.textContent=t.title;activityHelp.textContent=t.help;recalc.textContent=t.again;
    activityChecked.dateTime=new Date(now).toISOString();
    activityChecked.textContent=t.check+': '+activityChecked.dateTime;
    activityRows.replaceChildren();
    const add=(title,status,detail,stamp,link,titleLink)=>{
      const row=el('article','source-activity-item');
      row.append(el('strong','',title),el('span','source-activity-status',status),el('small','',detail));
      if(stamp&&Number.isFinite(Date.parse(stamp))){
        const time=el('time','',t.retrieved+': '+stamp);time.dateTime=stamp;row.append(time);
      }
      if(link){const anchor=el('a','',titleLink);anchor.href=link;
        anchor.rel='noopener noreferrer';anchor.target='_blank';row.append(anchor);}
      activityRows.append(row);
    };
    const ftime=Date.parse(forecast?.retrieved_at_utc||''),ms=now-ftime;
    const valid= supported&&isCurrent()&&forecast?.hours?.length>0;
    const expired=supported&&forecast&&['retrieved_live','cached_recent','stale_cache'].includes(forecast.status)&&
      (!valid||ms>2*60*60*1000);
    const age=Number.isFinite(ms)&&ms>=0?Math.floor(ms/60000)+' '+t.age:t.future;
    add(t.model,!supported?t.unsupported:valid?t.valid:expired?t.stale:t.notAvailable,
      valid?t.retrieved+': '+forecast.retrieved_at_utc+' · '+age:
      expired?t.stale+': '+(forecast.retrieved_at_utc||'—'):t.notAvailable,
      supported?forecast?.retrieved_at_utc:null,
      'https://open-meteo.com/en/docs',t.docsModel);
    const gov=governmentClimateData,verified=supported&&governmentClimateVisibleState==='verified'&&
      gov?.source==='NASA POWER (US government)'&&gov?.data_kind==='government_gridded_historical'&&
      ['retrieved_live','cached_recent'].includes(gov.status)&&gov.days?.length>0;
    add(t.history,verified?t.historic:!supported?t.unsupported:t.notAvailable,
      verified?t.latest+': '+gov.latest_data_date+' · '+t.retrieved+': '+gov.retrieved_at_utc:t.notAvailable,
      verified?gov.retrieved_at_utc:null,'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',t.docsNASA);
    const assessed=live.request&&live.evaluation&&live.evaluatedAtUtc;
    add(t.decision,assessed?'FastAPI · '+live.evaluation.status.toUpperCase():t.notAssessed,
      assessed?t.received+': '+live.evaluatedAtUtc:t.notAssessed,assessed?live.evaluatedAtUtc:null,null,null);
    add(t.imd,t.unconnected,t.unconnected,null,null,null);
  }
  recalc.addEventListener('click',()=>{renderSourceMatrix();renderPrintEvidence();});
  function translateGovernmentPanel(){
    govTitle.textContent=historyText('title');
    govIntro.textContent=historyText('intro');
    govRefresh.textContent=govRefresh.disabled?historyText('fetching'):historyText('refresh');
    govRange.setAttribute('aria-label',historyText('range'));
    optSeven.textContent=historyText('seven');
    optAll.textContent=historyText('all');
    govDownload.textContent=historyText('download');
    govCSV.textContent=historyText('csv');
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
    renderHistoricalChart(data);renderEvidenceContrast();
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
    clearHistoricalChart();
    renderSourceMatrix();
    govDownload.disabled=true;
    govCSV.disabled=true;
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
      recordSourceReceipt('nasa');
      renderSourceMatrix();
      govDownload.disabled=false;
      govCSV.disabled=false;
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
    }finally{if(token===governmentClimateRequest){govRefresh.disabled=false;renderSourceMatrix();}}
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
  here('language').addEventListener('change',()=>{renderEvidenceContrast();renderHistoricalChart(governmentClimateData);renderConnectivity();});
  here('language').addEventListener('change',()=>{renderSourceActivity();renderPrintEvidence();});
  here('language').addEventListener('change',()=>{renderSourceMatrix();renderDecisionDiagnostics();});
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
      void loadGovernmentClimate(false);
    }
  };
  void loadGovernmentClimate(false);

  here('language').addEventListener('change',()=>{renderForecastQuality();renderHourlyEvidence();renderWeather();});

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
  // HOME-01: overview is a projection of existing authoritative state, never
  // a sample farm, forecast substitute, automatic deadline or local assessment.
  const homeLanguage={
    en:{
      pilot:'Already-picked cotton · Jalna pilot · model weather is not a field observation',
      unsupported:'Jalna-only evidence',outside:'Return to Jalna to use the actual planning sources',
      weatherLoading:'Checking Open-Meteo',weatherMissing:'Refresh weather evidence',
      weatherMissingNote:'Source readings cannot be verified; refresh on Weather',
      rainHours:'future model hours',rainNote:'Open-Meteo · {count}/24 upcoming rainfall values · IST',
      completeRain:'mm / 24h',completeNote:'Open-Meteo · 24/24 source hours · fetched {time} IST',
      missingFuture:'Inspect weather timeline',missingFutureNote:'No eligible future model hours in the current response',
      deadlineChosenNote:'Farmer-chosen candidate · {hours} h remaining · not a rain threshold',
      deadlinePast:'Review past deadline',deadlinePastNote:'The saved candidate has passed; propose a future IST time',
      modelWindow:'24h model outlook',modelWindowNote:'Compare 6 / 12 / 24h windows; then choose your deadline',
      manualWindow:'Plan an IST deadline',manualWindowNote:'A manual candidate is possible without model weather',
      resources:'4 planning inputs',resourcesNote:'Target · capacity · duration · site readiness',
      draft:'resource fields drafted',draftNote:'Review and save your declarations before evaluation',
      reported:'units',reportedNote:'Farmer-reported capacity / target · {hours}h duration · readiness: {ready}',
      verifySaved:'Review resource draft',verifySavedNote:'Reconfirm locally saved quantities before evaluating',
      legacy:'Review old demo inputs',legacyNote:'Earlier example values must be replaced with genuine farmer declarations',
      evalError:'Review assessment request',evalErrorNote:'FastAPI did not return a valid evaluation; inspect your inputs',evalErrorSnap:'Engine reachable · request needs review',
      readyYes:'yes',readyNo:'no',readyUnknown:'unknown',
      apiLoading:'Connecting FastAPI',apiMissing:'Check Python service',
      apiMissingNote:'The real assessment service must be reachable',
      apiReady:'FastAPI ready',apiReadyNote:'Submit saved deadline and confirmed farmer declarations',
      apiOutcome:'· conditional',apiResultNote:'FastAPI · {constraints} checked constraints · {gap} unit shortfall',
      snapshotWindow:'Next 6 / 12 / 24h model views',snapshotManual:'Manual IST planning available',
      snapshotResource:'Target · capacity · hours · readiness',
      snapshotReady:'Engine ready · farmer inputs required',snapshotLink:'FastAPI connection check',
      snapshotReported:'{capacity}/{target} units · {hours}h (reported)',
      snapshotResult:'FastAPI · {status} · {gap} units shortfall'
    },
    mr:{
      pilot:'आधी वेचलेला कापूस · जालना पायलट · मॉडेल म्हणजे शेतातील मोजमाप नाही',
      unsupported:'फक्त जालना विभाग',outside:'मूळ नियोजन स्रोतांसाठी जालना निवडा',
      weatherLoading:'Open-Meteo तपासत आहे',weatherMissing:'हवामान माहिती ताजी करा',
      weatherMissingNote:'स्रोत पडताळता आला नाही; हवामान पानावर पुन्हा मिळवा',
      rainHours:'भविष्यातील मॉडेल तास',rainNote:'Open-Meteo · पुढील २४ तासांपैकी {count}/24 पर्जन्यमान नोंदी · IST',
      completeRain:'मिमी / २४ तास',completeNote:'Open-Meteo मॉडेल पाऊस · 24/24 तास · {time} IST',
      missingFuture:'हवामान वेळापत्रक पाहा',missingFutureNote:'सध्याच्या डेटात पुढील मॉडेल तास नाहीत',
      deadlineChosenNote:'शेतकऱ्याची संभाव्य वेळ · {hours} तास बाकी · सुरक्षिततेचा निकष नाही',
      deadlinePast:'मागील वेळ बदला',deadlinePastNote:'मागील संभाव्य वेळ संपली आहे; पुढची IST वेळ निवडा',
      modelWindow:'पुढील २४ तासांचा अंदाज',modelWindowNote:'६ / १२ / २४ तास तपासा; स्वतः अंतिम वेळ निवडा',
      manualWindow:'IST वेळ ठरवा',manualWindowNote:'मॉडेल डेटा नसतानाही स्वतः वेळ निवडता येते',
      resources:'४ नियोजन माहिती',resourcesNote:'प्रमाण · क्षमता · कालावधी · जागेची तयारी',
      draft:'साधनांचा मसुदा',draftNote:'माहिती तपासा आणि गणनेपूर्वी जतन करा',
      reported:'एकके',reportedNote:'शेतकऱ्याने सांगितलेली क्षमता / लक्ष्य · {hours} तास · तयारी: {ready}',
      verifySaved:'साधनांची माहिती तपासा',verifySavedNote:'गणनेपूर्वी जतन केलेली माहिती पुन्हा खात्री करा',
      legacy:'जुनी नमुना माहिती तपासा',legacyNote:'आधीचा नमुना बदलून शेतकऱ्याची खरी माहिती द्या',
      evalError:'मूल्यमापन विनंती तपासा',evalErrorNote:'FastAPI कडून वैध निकाल मिळाला नाही; माहिती तपासा',evalErrorSnap:'इंजिन जोडले आहे · विनंती तपासा',
      readyYes:'होय',readyNo:'नाही',readyUnknown:'अज्ञात',
      apiLoading:'FastAPI जोडत आहे',apiMissing:'Python सेवा तपासा',apiMissingNote:'खरे मूल्यमापन करण्यासाठी सेवा आवश्यक आहे',
      apiReady:'FastAPI तयार',apiReadyNote:'स्वतः निवडलेली वेळ आणि पुष्टी केलेली माहिती पाठवा',
      apiOutcome:'· अटींसह',apiResultNote:'FastAPI · {constraints} अटी तपासल्या · {gap} एककांची कमतरता',
      snapshotWindow:'६ / १२ / २४ तासांचे मॉडेल दृश्य',snapshotManual:'स्वतः IST वेळ निवडू शकता',
      snapshotResource:'प्रमाण · क्षमता · वेळ · तयारी',snapshotReady:'इंजिन तयार · शेतकऱ्याची माहिती आवश्यक',
      snapshotLink:'FastAPI जोडणी तपासा',snapshotReported:'{capacity}/{target} एकके · {hours} तास (घोषित)',
      snapshotResult:'FastAPI · {status} · {gap} एककांची कमतरता'
    },
    hi:{
      pilot:'पहले से चुनी गई कपास · जालना पायलट · मॉडल खेत का माप नहीं',
      unsupported:'केवल जालना क्षेत्र',outside:'असल योजना स्रोतों के लिए जालना चुनें',
      weatherLoading:'Open-Meteo जाँचा जा रहा है',weatherMissing:'मौसम डेटा रीफ्रेश करें',
      weatherMissingNote:'स्रोत की पुष्टि नहीं हुई; मौसम पेज पर दोबारा देखें',
      rainHours:'आने वाले मॉडल घंटे',rainNote:'Open-Meteo · अगले २४ घंटे में {count}/24 वर्षा मान · IST',
      completeRain:'मिमी / २४ घंटे',completeNote:'Open-Meteo मॉडल बारिश · 24/24 घंटे · {time} IST',
      missingFuture:'मौसम टाइमलाइन देखें',missingFutureNote:'मौजूदा डेटा में आगे के मॉडल घंटे नहीं हैं',
      deadlineChosenNote:'किसान की चुनी समय सीमा · {hours} घंटे बाकी · सुरक्षा मानक नहीं',
      deadlinePast:'समय सीमा बदलें',deadlinePastNote:'पुरानी समय सीमा बीत गई; नई IST समय सीमा चुनें',
      modelWindow:'अगले २४ घंटे का मॉडल',modelWindowNote:'६ / १२ / २४ घंटे देखें; फिर अपना समय तय करें',
      manualWindow:'IST समय तय करें',manualWindowNote:'मॉडल के बिना भी समय चुना जा सकता है',
      resources:'४ जरूरी जानकारी',resourcesNote:'लक्ष्य · क्षमता · अवधि · जगह की तैयारी',
      draft:'साधनों का मसौदा',draftNote:'पुष्टि से पहले जानकारी जाँचकर सहेजें',
      reported:'इकाई',reportedNote:'किसान की बताई क्षमता / लक्ष्य · {hours} घंटे · तैयारी: {ready}',
      verifySaved:'साधन विवरण जाँचें',verifySavedNote:'गणना से पहले सहेजी जानकारी की पुष्टि करें',
      legacy:'पुराने नमूना डेटा जाँचें',legacyNote:'पुराने उदाहरण को असली किसान जानकारी से बदलें',
      evalError:'आकलन अनुरोध जाँचें',evalErrorNote:'FastAPI से वैध नतीजा नहीं मिला; विवरण जाँचें',evalErrorSnap:'इंजन जुड़ा है · अनुरोध जाँचें',
      readyYes:'हाँ',readyNo:'नहीं',readyUnknown:'अज्ञात',
      apiLoading:'FastAPI जुड़ रहा है',apiMissing:'Python सेवा जाँचें',apiMissingNote:'असली गणना के लिए सेवा चाहिए',
      apiReady:'FastAPI तैयार',apiReadyNote:'चुना समय और पुष्टि किए विवरण भेजें',
      apiOutcome:'· शर्तों सहित',apiResultNote:'FastAPI · {constraints} शर्तें जाँचीं · {gap} इकाइयों की कमी',
      snapshotWindow:'६ / १२ / २४ घंटे का मॉडल',snapshotManual:'मैनुअल IST समय चुन सकते हैं',
      snapshotResource:'लक्ष्य · क्षमता · समय · तैयारी',snapshotReady:'इंजन तैयार · किसान विवरण जरूरी',
      snapshotLink:'FastAPI कनेक्शन जाँचें',snapshotReported:'{capacity}/{target} इकाई · {hours} घंटे (बताए गए)',
      snapshotResult:'FastAPI · {status} · {gap} इकाई की कमी'
    }
  };
  function renderHomepageReadiness(){
    const t=homeLanguage[state.lang]||homeLanguage.en;
    const set=(id,value)=>{const node=here(id);if(node)node.textContent=value;};
    const fill=(template,values)=>template.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
    const stamp=value=>{
      const when=Date.parse(value);
      return Number.isFinite(when)?new Intl.DateTimeFormat(state.lang==='mr'?'mr-IN':state.lang==='hi'?'hi-IN':'en-IN',
        {timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(when):'';
    };
    set('homepageScope',t.pilot);
    const supported=okLocation();
    const current=supported&&isCurrent();
    const validTime=hour=>Date.parse(String(hour?.time||'')+':00+05:30');
    // A contiguous set of 24 source-native hours is required before a 24h
    // precipitation total can be displayed. Nulls or gaps are not zero rain.
    const future=current?live.forecast.hours.filter(h=>{
      const time=validTime(h);return Number.isFinite(time)&&time>Date.now()+60_000;
    }).sort((a,b)=>a.time.localeCompare(b.time)).filter((h,i,a)=>i===0||h.time!==a[i-1].time):[];
    const start=future.length?validTime(future[0]):NaN;
    const next24=future.slice(0,24);
    const complete=next24.length===24&&next24.every((h,i)=>
      validTime(h)===start+i*3_600_000&&typeof h.precipitation_mm==='number'&&Number.isFinite(h.precipitation_mm));
    const rainCoverage=future.filter(h=>validTime(h)<Date.now()+24*3_600_000&&typeof h.precipitation_mm==='number').length;
    if(!supported){
      set('weatherValue',t.unsupported);set('weatherEvidenceNote',t.outside);
    }else if(complete){
      set('weatherValue',num(next24.reduce((total,h)=>total+h.precipitation_mm,0))+' '+t.completeRain);
      set('weatherEvidenceNote',fill(t.completeNote,{time:stamp(live.forecast.retrieved_at_utc)}));
    }else if(future.length){
      set('weatherValue',future.length+' '+t.rainHours);
      set('weatherEvidenceNote',fill(t.rainNote,{count:Math.min(rainCoverage,24)}));
    }else if(current){
      set('weatherValue',t.missingFuture);set('weatherEvidenceNote',t.missingFutureNote);
    }else{
      set('weatherValue',live.forecastLoading?t.weatherLoading:t.weatherMissing);
      set('weatherEvidenceNote',t.weatherMissingNote);
    }
    const deadline=state.deadline;
    const when=typeof deadline==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(deadline)?
      Date.parse(deadline+':00+05:30'):NaN;
    if(Number.isFinite(when)&&when>Date.now()){
      const readable=stamp(new Date(when).toISOString())+' IST';
      set('deadlineValue',readable);set('snapshotDeadline',readable);
      set('deadlineEvidenceNote',fill(t.deadlineChosenNote,{hours:num(Math.max(0,(when-Date.now())/3_600_000))}));
    }else if(Number.isFinite(when)){
      set('deadlineValue',t.deadlinePast);set('deadlineEvidenceNote',t.deadlinePastNote);
      set('snapshotDeadline',t.deadlinePast);
    }else if(current&&future.length){
      set('deadlineValue',t.modelWindow);set('deadlineEvidenceNote',t.modelWindowNote);
      set('snapshotDeadline',t.snapshotWindow);
    }else{
      set('deadlineValue',t.manualWindow);set('deadlineEvidenceNote',t.manualWindowNote);
      set('snapshotDeadline',t.snapshotManual);
    }
    const r=state.resources;
    const numbersValid=!!r&&[r.target,r.capacity,r.hours].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0);
    const acknowledged=!!here('confirmInputs')?.checked;
    // The retired prototype previously persisted this exact illustrative set;
    // never promote it silently to an actual farmer inventory.
    const legacyExample=numbersValid&&r.target===80&&r.capacity===60&&r.hours===2.5&&
      r.readiness==='yes'&&r.baseline==='worker-baseline';
    const formMatches=numbersValid&&[['quantity',r.target],['capacity',r.capacity],['duration',r.hours]].every(([id,value])=>
      here(id)?.value.trim()!==''&&Number(here(id).value)===value)&&here('readiness')?.value===r.readiness&&
      (here('baseline')?.value||'')===(r.baseline||'');
    if(legacyExample){
      set('resourcesValue',t.legacy);set('resourcesEvidenceNote',t.legacyNote);
      set('snapshotResource',t.snapshotResource);
    }else if(numbersValid&&acknowledged&&formMatches){
      const values={target:num(r.target),capacity:num(r.capacity),hours:num(r.hours),
        ready:t[r.readiness==='yes'?'readyYes':r.readiness==='no'?'readyNo':'readyUnknown']};
      set('resourcesValue',values.capacity+' / '+values.target+' '+t.reported);
      set('resourcesEvidenceNote',fill(t.reportedNote,values));
      set('snapshotResource',fill(t.snapshotReported,values));
    }else if(numbersValid){
      set('resourcesValue',t.verifySaved);set('resourcesEvidenceNote',t.verifySavedNote);
      set('snapshotResource',t.snapshotResource);
    }else{
      const filled=['quantity','capacity','duration'].filter(id=>here(id)?.value.trim()!=='').length+
        (['yes','no'].includes(here('readiness')?.value)?1:0);
      set('resourcesValue',filled?filled+'/4 '+t.draft:t.resources);
      set('resourcesEvidenceNote',filled?t.draftNote:t.resourcesNote);
      set('snapshotResource',t.snapshotResource);
    }
    const assessment=live.evaluation;
    if(assessment&&statuses.includes(assessment.status)&&!legacyExample){
      const values={status:assessment.status.toUpperCase(),constraints:assessment.baseline?.constraints?.length??0,
        gap:typeof assessment.baseline?.shortfall_units==='number'?num(assessment.baseline.shortfall_units):'?'};
      set('feasibilityValue',values.status+' '+t.apiOutcome);
      set('feasibilityEvidenceNote',fill(t.apiResultNote,values));
      set('snapshotAssessment',fill(t.snapshotResult,values));
    }else if(live.error){
      set('feasibilityValue',t.evalError);set('feasibilityEvidenceNote',t.evalErrorNote);
      set('snapshotAssessment',t.evalErrorSnap);
    }else if(live.health?.ok===true){
      set('feasibilityValue',t.apiReady);set('feasibilityEvidenceNote',t.apiReadyNote);
      set('snapshotAssessment',t.snapshotReady);
    }else{
      set('feasibilityValue',live.forecastLoading?t.apiLoading:t.apiMissing);
      set('feasibilityEvidenceNote',t.apiMissingNote);set('snapshotAssessment',t.snapshotLink);
    }
  }
  // Keep the overview synchronized with refreshes, changed farmer inputs,
  // language changes, resets, and genuine server responses.
  const precedingSummary=updateSummaries;
  updateSummaries=function(){precedingSummary();renderHomepageReadiness();};
  const precedingWeather=renderWeather;
  renderWeather=function(){precedingWeather();renderHomepageReadiness();};
  updateWeatherUI=renderWeather;
  const precedingAssessment=renderAssessment;
  renderAssessment=function(){precedingAssessment();renderHomepageReadiness();};
  updateAssessmentUI=renderAssessment;
  renderHomepageReadiness();
  // Source-age display only; never fetches or invents data on a timer.
  window.setInterval(renderHomepageReadiness,60_000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderHomepageReadiness();});
  changeLanguage();
  updateAllNew();
  renderConnectivity();renderEvidenceContrast();
  renderSourceMatrix();renderDecisionDiagnostics();renderPrintEvidence();
  window.setInterval(()=>{if(!document.hidden){renderSourceMatrix();renderPrintEvidence();}},60000);
  void boot();
  if(location.pathname==='/interactive-review.html')history.replaceState({},'', '/');
})();