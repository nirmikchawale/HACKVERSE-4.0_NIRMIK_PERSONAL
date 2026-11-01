/* Farmer-first presentation layer. All decisions continue to come from FastAPI.
   This file changes no engine inputs, resource units, or API endpoints. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const savedMode=()=>{try{return localStorage.getItem('agri-experience-v1')==='detailed'?'detailed':'farmer';}catch{return 'farmer';}};
  let experience=savedMode(),advanced=false;
  const words={
    en:{
      farmer:'Farmer View',detailed:'Detailed View',home:'Home',weather:'Check Weather',farm:'My Farm Details',check:'Check My Plan',action:'My Action Plan',help:'Help',
      workQ:'1. How much picked cotton needs attention?',capacityQ:'2. How much can you manage right now?',hoursQ:'3. How many hours will the work take?',deadlineQ:'4. When do you want to finish?',readyQ:'5. Is your work area ready?',confirmQ:'6. Have you checked your answers?',
      workHint:'Enter the total work in your own consistent counting units.',capacityHint:'Use exactly the same counting units as question 1. Count only capacity you can confirm.',hoursHint:'For example, 2.5 means two and a half hours of work.',deadlineHint:'Choose the time you want to finish (Indian time). This is your choice, not a guaranteed rain time.',readyHint:'Answer for your handling place. This does not separately verify people or equipment.',confirmHint:'These are your own entries. We have not independently checked them.',
      unitCaution:'Use one comparable work unit for both amounts. Bags, quintals and work batches are NOT automatically interchangeable.',deadlineChoose:'Choose or change finish time',deadlineMissing:'No finish time saved yet',advancedShow:'Show extra settings and optional changes',advancedHide:'Hide extra settings',advancedCount:'Extra change options already recorded: ',advancedNote:'Options saved here may affect your result. Review them if you need to change or remove one.',
      summaryTitle:'Your answers so far',answered:' of 6 questions answered',missing:'Next, answer:',allAnswered:'Your six answers are entered. The server still needs to check your plan.',next:'Continue',review:'Check my plan',weatherNote:'The rain forecast comes from a weather model. It is not a promise that rain will start at a certain time or that the cotton is safe.',
      statusEmpty:'Your plan has not been checked yet',statusBusy:'Checking your plan…',statusError:'The plan could not be checked. Review your inputs or try again.',statusFeasible:'Your declared plan meets the checked conditions',statusBlocked:'Your plan has a problem to resolve',statusUnknown:'The system still needs an answer',statusCompleted:'This work was marked completed',
      what:'What did we find?',why:'Why?',nextAction:'What can you do next?',whyNoResult:'Enter your amounts, finish time and readiness, then run the check.',whyFeasible:'The Python engine accepted the entered amount, capacity, time and readiness under your stated assumptions.',whyBlocked:'The Python engine found one or more conditions that do not pass.',whyUnknown:'The Python engine could not confirm all the required conditions.',whyCompleted:'The engine returned a completed status for this request.',
      declared:'You entered',canHandle:'and said you can handle',gap:'The engine reports a shortfall of',slack:'Time remaining after the declared work:',hoursUnit:'hours',units:'matching work units',unverified:'The forecast and resource statements are not independently checked on the farm. This is not a crop-safety guarantee.',
      edit:'Edit my farm details',seeAction:'See my action plan',run:'Run the plan check',tryAgain:'Try the check again',actionHeading:'What can I do now?',noAction:'Check your plan first to see any possible adjustments.',noPackages:'The engine did not return an eligible change package for these entries.',option:'Possible change',selected:'Selected',choose:'Select this change',remaining:'Original work still left:',notBooked:'Selecting an option does not bring workers, equipment or transport. Only confirmed additions are counted by the engine.',noApplied:'No change selected yet. Your original result is shown.',showDetail:'Open detailed tools',helpTitle:'Help with your plan',helpText:'Follow these steps. You can always return to a previous answer without losing it.',helpWeather:'First, check the forecast and choose a finish time.',helpFarm:'Then, enter your work and available help.',helpCheck:'Next, check the plan using the Python calculation.',helpAction:'Finally, review any possible changes and what remains unfinished.',helpAsk:'Open question helper',helpLimit:'Current pilot: already-picked cotton in Jalna, Maharashtra. Other locations are not supported for this assessment.',resultReason:'Server-calculated result only; no rain-onset or crop-safety promise.',readinessUnknown:'Not checked yet',readinessYes:'Yes, I confirm it is ready',readinessNo:'No, it is not ready',advancedLabel:'Technical resource identifiers (optional)',nextWeather:'Check Weather →',nextFarm:'Enter Farm Details →',nextCheck:'Check My Plan →',nextActionButton:'See My Action Plan →',
      errorTime:'Save a valid finish time on the Weather page.',errorConfirm:'Tick question 6 before checking your plan.',errorAmount:'Enter a valid number for each required amount.',errorScope:'Only Jalna, Maharashtra is supported in this pilot.'
    },
    mr:{
      farmer:'शेतकऱ्यांसाठी',detailed:'सविस्तर माहिती',home:'मुख्य पान',weather:'हवामान पाहा',farm:'माझ्या शेताची माहिती',check:'माझा बेत तपासा',action:'आता काय करायचं?',help:'मदत',
      workQ:'१. वेचलेला किती कापूस हाताळायचा आहे?',capacityQ:'२. सध्या किती कापसाचं काम करू शकता?',hoursQ:'३. हे काम करायला किती तास लागतील?',deadlineQ:'४. काम कधीपर्यंत संपवायचं आहे?',readyQ:'५. कामाची जागा तयार आहे का?',confirmQ:'६. भरलेली माहिती तपासली का?',
      workHint:'किती काम आहे ते एकाच मोजमापात लिहा.',capacityHint:'पहिल्या प्रश्नातलं तेच मोजमाप वापरा. खात्रीचीच क्षमता लिहा.',hoursHint:'उदा. २.५ म्हणजे अडीच तास.',deadlineHint:'काम संपवायची वेळ तुम्ही ठरवा. पाऊस नक्की कधी येईल हे यातून कळत नाही.',readyHint:'कापूस हाताळायची जागा तयार आहे का ते सांगा. माणसं व साधनांची वेगळी खात्री यात होत नाही.',confirmHint:'ही माहिती तुम्ही दिली आहे. आम्ही शेतावर येऊन तपासलेली नाही.',
      unitCaution:'दोन्ही प्रमाणांसाठी एकच मोजमाप वापरा. पोती, क्विंटल आणि कामाचे भाग एकसारखे समजू नका.',deadlineChoose:'काम संपवायची वेळ निवडा',deadlineMissing:'अजून वेळ जतन केलेली नाही',advancedShow:'इतर पर्याय आणि सविस्तर सेटिंग्ज',advancedHide:'इतर सेटिंग्ज लपवा',advancedCount:'आधी नोंदवलेले इतर पर्याय: ',advancedNote:'हे पर्याय निकालावर परिणाम करू शकतात. बदलायचे असतील तर तपासा.',
      summaryTitle:'तुमची माहिती',answered:' पैकी ६ प्रश्नांची उत्तरं',missing:'आता हे भरा:',allAnswered:'सहा उत्तरं भरली आहेत. आता संगणकावर बेत तपासायचा आहे.',next:'पुढे',review:'माझा बेत तपासा',weatherNote:'हवामानाचा अंदाज संगणकीय मॉडेलवरून येतो. पाऊस नेमका कधी पडेल किंवा कापूस सुरक्षित राहील याची हमी नाही.',
      statusEmpty:'तुमचा बेत अजून तपासलेला नाही',statusBusy:'तुमचा बेत तपासत आहोत…',statusError:'बेत तपासता आला नाही. माहिती पुन्हा पाहा आणि प्रयत्न करा.',statusFeasible:'तुमच्या माहितीनुसार बेतातील अटी जुळतात',statusBlocked:'तुमच्या बेतात अडचण आहे',statusUnknown:'अजून काही माहिती पक्की नाही',statusCompleted:'हे काम पूर्ण झाल्याची नोंद आहे',
      what:'काय कळलं?',why:'असं का?',nextAction:'आता काय कराल?',whyNoResult:'कापसाचं प्रमाण, वेळ आणि तयारी भरा. मग बेत तपासा.',whyFeasible:'तुम्ही भरलेलं प्रमाण, क्षमता, वेळ आणि तयारी या अटी संगणकाच्या तपासणीत जुळल्या.',whyBlocked:'तुम्ही भरलेल्या माहितीत एक किंवा अधिक अटी जुळल्या नाहीत.',whyUnknown:'काही अटींबद्दल अजून खात्री झालेली नाही.',whyCompleted:'संगणकाच्या उत्तरात काम पूर्ण झाल्याची नोंद आहे.',
      declared:'तुम्ही लिहिलं',canHandle:'आणि हाताळू शकता असं सांगितलं',gap:'संगणकानुसार उरलेलं काम',slack:'कामाचे तास वजा केल्यावर उरलेली वेळ:',hoursUnit:'तास',units:'एकसारख्या कामाच्या एककात',unverified:'शेतावरची साधनं आणि हवामानाची खात्री यात झालेली नाही. हा कापूस सुरक्षित राहण्याचा दाखला नाही.',
      edit:'शेताची माहिती बदला',seeAction:'पुढचा बेत पाहा',run:'बेत तपासा',tryAgain:'पुन्हा तपासा',actionHeading:'आता कोणता पर्याय आहे?',noAction:'आधी बेत तपासा. मग शक्य बदल दिसतील.',noPackages:'या माहितीनुसार संगणकाला योग्य बदलांचा संच मिळाला नाही.',option:'शक्य बदल',selected:'निवडलेला',choose:'हा बदल निवडा',remaining:'मूळ कामापैकी अजून उरलेलं:',notBooked:'पर्याय निवडल्याने माणसं, वाहनं किंवा साधनं आपोआप मिळत नाहीत. खात्री झालेले पर्यायच मोजले जातात.',noApplied:'अजून बदल निवडलेला नाही. आधीचा निकालच दाखवला आहे.',showDetail:'सविस्तर साधनं पाहा',helpTitle:'बेत समजून घ्या',helpText:'एकेक पाऊल पूर्ण करा. आधीची उत्तरं न पुसता परत बदलता येतील.',helpWeather:'आधी हवामान पाहा आणि काम संपवायची वेळ ठरवा.',helpFarm:'मग कामाचं प्रमाण आणि उपलब्ध मदत भरा.',helpCheck:'यानंतर संगणकावर बेत तपासा.',helpAction:'शेवटी शक्य बदल आणि उरलेलं काम पाहा.',helpAsk:'प्रश्न विचारण्यासाठी मदत उघडा',helpLimit:'सध्या फक्त जालना, महाराष्ट्र येथील वेचलेल्या कापसासाठी हे नियोजन आहे.',resultReason:'हा संगणकाने काढलेला सशर्त निकाल आहे; पाऊस किंवा कापूस सुरक्षिततेची हमी नाही.',readinessUnknown:'अजून खात्री नाही',readinessYes:'हो, जागा तयार आहे',readinessNo:'नाही, जागा तयार नाही',advancedLabel:'साधनांची ओळख (ऐच्छिक)',nextWeather:'हवामान पाहा →',nextFarm:'शेताची माहिती भरा →',nextCheck:'बेत तपासा →',nextActionButton:'पुढचा बेत पाहा →',
      errorTime:'हवामानाच्या पानावर काम संपवायची योग्य वेळ जतन करा.',errorConfirm:'बेत तपासण्याआधी सहाव्या प्रश्नाला खूण करा.',errorAmount:'सगळ्या आवश्यक प्रश्नांत योग्य अंक भरा.',errorScope:'सध्या फक्त जालना, महाराष्ट्रासाठी हा बेत तपासता येतो.'
    },
    hi:{
      farmer:'किसान के लिए',detailed:'पूरी जानकारी',home:'मुख्य पेज',weather:'मौसम देखें',farm:'मेरे खेत की जानकारी',check:'मेरी योजना जाँचें',action:'अब क्या करूँ?',help:'मदद',
      workQ:'१. चुनी हुई कितनी कपास सँभालनी है?',capacityQ:'२. अभी कितनी कपास का काम कर सकते हैं?',hoursQ:'३. काम में कितने घंटे लगेंगे?',deadlineQ:'४. काम कब तक पूरा करना है?',readyQ:'५. काम करने की जगह तैयार है?',confirmQ:'६. क्या आपने अपने जवाब जाँच लिए?',
      workHint:'कुल काम एक ही तरह की इकाई में भरें।',capacityHint:'पहले सवाल वाली इकाई ही इस्तेमाल करें। पक्की क्षमता ही भरें।',hoursHint:'जैसे २.५ का मतलब ढाई घंटे है।',deadlineHint:'काम पूरा करने का समय आप चुनें। यह बारिश आने का पक्का समय नहीं है।',readyHint:'कपास सँभालने की जगह तैयार है या नहीं बताएं। लोगों और उपकरणों की अलग जाँच इसमें नहीं हुई है।',confirmHint:'जानकारी आपने दी है। खेत पर इसकी अलग जाँच नहीं हुई है।',
      unitCaution:'दोनों मात्राओं में एक जैसी इकाई रखें। बोरे, क्विंटल और काम के हिस्से अपने-आप बराबर नहीं होते।',deadlineChoose:'काम खत्म करने का समय चुनें',deadlineMissing:'अभी समय सेव नहीं किया',advancedShow:'अतिरिक्त विकल्प और सेटिंग',advancedHide:'अतिरिक्त सेटिंग छिपाएँ',advancedCount:'पहले से दर्ज अतिरिक्त विकल्प: ',advancedNote:'ये विकल्प नतीजे को बदल सकते हैं। बदलने के लिए देख लें।',
      summaryTitle:'आपके जवाब',answered:' में से ६ सवालों के जवाब',missing:'अब यह भरें:',allAnswered:'छहों जवाब भर गए। अब सिस्टम से योजना जाँचें।',next:'आगे',review:'मेरी योजना जाँचें',weatherNote:'मौसम की जानकारी एक मॉडल से आती है। बारिश कब शुरू होगी या कपास सुरक्षित रहेगी, इसकी गारंटी नहीं है।',
      statusEmpty:'आपकी योजना अभी नहीं जाँची गई',statusBusy:'योजना जाँच रहे हैं…',statusError:'योजना जाँच नहीं पाए। जानकारी देखकर दोबारा कोशिश करें।',statusFeasible:'दी गई जानकारी पर योजना की शर्तें पूरी हैं',statusBlocked:'योजना में एक समस्या है',statusUnknown:'अभी कुछ जानकारी पक्की नहीं है',statusCompleted:'यह काम पूरा होने का दर्ज है',
      what:'क्या पता चला?',why:'ऐसा क्यों?',nextAction:'अब क्या करें?',whyNoResult:'कपास की मात्रा, समय और तैयारी भरें। फिर योजना जाँचें।',whyFeasible:'आपकी भरी मात्रा, क्षमता, समय और तैयारी की शर्तें सिस्टम की जाँच में पूरी हुईं।',whyBlocked:'दी गई जानकारी में एक या अधिक शर्तें पूरी नहीं हुईं।',whyUnknown:'कुछ बातों की पुष्टि अभी बाकी है।',whyCompleted:'सिस्टम के जवाब में काम पूरा दर्ज है।',
      declared:'आपने लिखा',canHandle:'और सँभाल सकते हैं बताया',gap:'सिस्टम के अनुसार बाकी काम',slack:'काम के घंटे घटाने के बाद बचा समय:',hoursUnit:'घंटे',units:'एक जैसी काम की इकाई में',unverified:'खेत के संसाधन और मौसम की अलग जाँच नहीं हुई। यह कपास की सुरक्षा का प्रमाण नहीं है।',
      edit:'मेरे खेत की जानकारी बदलें',seeAction:'आगे की योजना देखें',run:'योजना जाँचें',tryAgain:'फिर जाँचें',actionHeading:'अब कौन सा विकल्प है?',noAction:'पहले योजना जाँचें। फिर संभव बदलाव दिखेंगे।',noPackages:'इन जवाबों पर सिस्टम ने कोई योग्य बदलाव नहीं लौटाया।',option:'संभव बदलाव',selected:'चुना हुआ',choose:'यह बदलाव चुनें',remaining:'मूल काम में अब भी बाकी:',notBooked:'विकल्प चुनने से लोग, वाहन या साधन अपने-आप नहीं मिलते। सिस्टम केवल पक्के विकल्प गिनता है।',noApplied:'अभी कोई बदलाव नहीं चुना। मूल नतीजा दिखाया गया है।',showDetail:'पूरे जाँच उपकरण देखें',helpTitle:'अपनी योजना समझें',helpText:'एक-एक कदम पूरा करें। पुरानी जानकारी बिना मिटाए बदल सकते हैं।',helpWeather:'पहले मौसम देखें और काम पूरा करने का समय चुनें।',helpFarm:'फिर काम और उपलब्ध मदद की जानकारी भरें।',helpCheck:'उसके बाद सिस्टम से योजना जाँचें।',helpAction:'आखिर में संभव बदलाव और बाकी काम देखें।',helpAsk:'सवाल पूछने वाला सहायक खोलें',helpLimit:'अभी सिर्फ जालना, महाराष्ट्र में चुनी हुई कपास के लिए यह योजना है।',resultReason:'यह सिस्टम से मिला सशर्त नतीजा है; बारिश या कपास की सुरक्षा की गारंटी नहीं है।',readinessUnknown:'अभी पता नहीं',readinessYes:'हाँ, जगह तैयार है',readinessNo:'नहीं, जगह तैयार नहीं',advancedLabel:'संसाधनों की पहचान (वैकल्पिक)',nextWeather:'मौसम देखें →',nextFarm:'खेत की जानकारी भरें →',nextCheck:'योजना जाँचें →',nextActionButton:'आगे की योजना देखें →',
      errorTime:'मौसम पेज पर सही खत्म करने का समय सेव करें।',errorConfirm:'योजना जाँचने से पहले छठे सवाल पर निशान लगाएँ।',errorAmount:'हर जरूरी सवाल में सही संख्या भरें।',errorScope:'अभी सिर्फ जालना, महाराष्ट्र में योजना जाँच सकते हैं।'
    }
  };
  const t=k=>(words[state.lang]||words.en)[k]||words.en[k]||k;
  const node=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
  const button=(txt,action,cls='btn primary')=>{const b=node('button',cls,txt);b.type='button';b.addEventListener('click',action);return b;};
  const showPage=n=>goto(n);
  const focusField=id=>{if(id==='deadlineInput'){showPage(1);byId(id)?.focus();}else if(id==='runAssessment'){showPage(3);byId(id)?.focus();}else{showPage(2);byId(id)?.focus();}};
  function createOnce(){
    const rail=document.querySelector('.rail');
    if(rail&&!byId('experienceSwitch')){
      const w=node('div','experience-switch');w.id='experienceSwitch';w.setAttribute('role','group');w.setAttribute('aria-label','Choose farmer or detailed experience');rail.querySelector('.brand').insertAdjacentElement('afterend',w);
    }
    if(!byId('farmerDeadlineRow')){
      const form=document.querySelector('section[data-page="2"] .form-grid');
      const block=node('div','farmer-deadline-row');block.id='farmerDeadlineRow';form.insertAdjacentElement('afterend',block);
    }
    if(!byId('farmerAdvancedToggle')){
      const panel=document.querySelector('section[data-page="2"] .resource-layout > .panel');
      const toggle=button('',()=>{advanced=!advanced;paint();},'btn farmer-advanced-toggle');
      toggle.id='farmerAdvancedToggle';panel.querySelector('#baseline').closest('label').insertAdjacentElement('beforebegin',toggle);
    }
    if(!byId('farmerResourceSummary')){
      const block=node('aside','panel farmer-progress');block.id='farmerResourceSummary';block.setAttribute('aria-live','polite');
      document.querySelector('.resource-side').prepend(block);
    }
    if(!byId('farmerWeatherNote')){
      const p=node('p','farmer-weather-note');p.id='farmerWeatherNote';document.querySelector('.deadline-card').appendChild(p);
    }
    if(!byId('farmerCheckCard')){
      const block=node('section','panel farmer-decision');block.id='farmerCheckCard';block.setAttribute('aria-live','polite');
      document.querySelector('section[data-page="3"] .page-head').insertAdjacentElement('afterend',block);
    }
    if(!byId('farmerActionCard')){
      const block=node('section','panel farmer-action');block.id='farmerActionCard';block.setAttribute('aria-live','polite');
      document.querySelector('section[data-page="4"] .page-head').insertAdjacentElement('afterend',block);
    }
    if(!byId('farmerHelpPanel')){
      const block=node('div','panel farmer-help');block.id='farmerHelpPanel';
      document.querySelector('section[data-page="5"]').prepend(block);
    }
    document.querySelectorAll('section.section').forEach((section,i)=>{
      if(!section.querySelector('.farmer-step-link')&&i<4){
        const next=[1,2,3,4][i];
        const b=button('',()=>showPage(next),'btn primary farmer-step-link');
        b.dataset.next=String(next);
        section.append(b);
      }
    });
  }
  function paintNav(){
    if(experience!=='farmer')return;
    const names=[t('home'),t('weather'),t('farm'),t('check'),t('action'),t('help')];
    const symbols=['⌂','☁','♧','✓','▤','?'];
    for(const [id,mobile] of [['navDesktop',false],['navMobile',true]]){
      const target=byId(id);target.replaceChildren();
      names.forEach((label,i)=>{
        const b=node('button','farmer-nav'+(state.page===i?' active':''));b.type='button';
        b.dataset.nav=String(i);b.setAttribute('aria-current',state.page===i?'page':'false');
        const symbol=node('span','nav-ico',symbols[i]);symbol.setAttribute('aria-hidden','true');
        b.append(symbol,node('span','farmer-nav-label',label));
        b.addEventListener('click',()=>showPage(i));target.appendChild(b);
      });
    }
    byId('crumbTitle').textContent=names[state.page];
    byId('railSearch').placeholder=t('help')+' / '+t('farm')+'…';
    byId('railSearchFeedback').textContent=names.length+' pages';
  }
  function paintSwitch(){
    const root=byId('experienceSwitch');root.replaceChildren();
    for(const view of ['farmer','detailed']){
      const b=button(t(view),()=>{
        if(experience===view)return;
        experience=view;advanced=false;
        try{localStorage.setItem('agri-experience-v1',view);}catch{}
        goto(state.page);
      },'experience-choice'+(experience===view?' is-active':''));
      b.setAttribute('aria-pressed',String(experience===view));
      root.append(b);
    }
  }
  function paintLabels(){
    const pairs=[['quantity','workQ','workHint'],['capacity','capacityQ','capacityHint'],['duration','hoursQ','hoursHint'],['readiness','readyQ','readyHint']];
    for(const [id,key,hint] of pairs){
      const label=byId(id)?.closest('label');if(!label)continue;
      const title=label.querySelector('span[data-i18n]');if(title)title.textContent=t(key);
      let small=label.querySelector('.farmer-field-hint');
      if(!small){small=node('small','farmer-field-hint');label.append(small);}
      small.textContent=t(hint);
    }
    const confirm=byId('confirmInputs')?.closest('label');
    if(confirm){const s=confirm.querySelector('span[data-i18n]');if(s)s.textContent=t('confirmQ');
      let note=confirm.querySelector('.farmer-confirm-hint');if(!note){note=node('small','farmer-confirm-hint');confirm.append(note);}note.textContent=t('confirmHint');}
    const baseline=byId('baseline')?.closest('label');if(baseline){const s=baseline.querySelector('span[data-i18n]');if(s)s.textContent=t('advancedLabel');}
    const option=byId('readiness');if(option){for(const [i,key] of [['unknown','readinessUnknown'],['yes','readinessYes'],['no','readinessNo']]){const el=option.querySelector('option[value="'+i+'"]');if(el)el.textContent=t(key);}}
    const intro=document.querySelector('section[data-page="2"] [data-i18n="unitsIntro"]');
    if(intro)intro.textContent=t('unitCaution');
    const q=byId('farmerDeadlineRow');q.replaceChildren();
    const info=node('div','');info.append(node('strong','',t('deadlineQ')),node('small','',state.deadline?(state.deadline.replace('T',' ')+' IST'):t('deadlineMissing')),node('small','',t('deadlineHint')));
    q.append(info,button(t('deadlineChoose'),()=>focusField('deadlineInput'),'btn'));
    const av=byId('farmerAdvancedToggle');av.textContent=t(advanced?'advancedHide':'advancedShow');av.setAttribute('aria-expanded',String(advanced));
    byId('farmerWeatherNote').textContent=t('weatherNote');
    for(const b of document.querySelectorAll('.farmer-step-link')){
      const target=Number(b.dataset.next);b.textContent=t(['','nextWeather','nextFarm','nextCheck','nextActionButton'][target]);
    }
  }
  const isNumber=id=>{const val=byId(id)?.value?.trim();return val!==''&&Number.isFinite(Number(val))&&Number(val)>=0;};
  function paintResources(){
    const target=byId('farmerResourceSummary');target.replaceChildren();
    const ready=byId('readiness')?.value,finished=Boolean(state.deadline&&state.deadline===byId('deadlineInput')?.value);
    const answers=[isNumber('quantity'),isNumber('capacity'),isNumber('duration'),finished,ready==='yes'||ready==='no',byId('confirmInputs')?.checked];
    const count=answers.filter(Boolean).length;
    target.append(node('h2','',t('summaryTitle')),node('strong','farmer-progress-count',count+t('answered')));
    const p=node('p','',t('unitCaution'));target.append(p);
    const names=['workQ','capacityQ','hoursQ','deadlineQ','readyQ','confirmQ'];
    const fields=['quantity','capacity','duration','deadlineInput','readiness','confirmInputs'];
    const idx=answers.findIndex(x=>!x);
    target.append(node('p','',idx>=0?t('missing')+' '+t(names[idx]):t('allAnswered')));
    const actions=node('div','farmer-cta');
    actions.append(button(idx>=0?t('next'):t('review'),()=>focusField(idx>=0?fields[idx]:'runAssessment')));
    target.append(actions);
    const opts=document.querySelectorAll('#changeEditor .change-row').length;
    if(opts)target.append(node('p','farmer-options-note',t('advancedCount')+opts+'. '+t('advancedNote')));
  }
  function snapshot(){
    try{return typeof window.agriFarmerSnapshot==='function'?window.agriFarmerSnapshot():null;}
    catch{return null;}
  }
  function explanationInfo(){
    const s=snapshot(),r=s?.evaluation,root=byId('farmerCheckCard');
    root.replaceChildren();
    const heading=node('h2','',t('check'));root.append(heading);
    const status=s?.busy?t('statusBusy'):r?t('status'+({feasible:'Feasible',blocked:'Blocked',unknown:'Unknown',completed:'Completed'}[r.status]||'Unknown')):s?.error?t('statusError'):t('statusEmpty');
    root.append(node('h3','farmer-decision-state',status));
    const section=(head,content)=>{const div=node('div','farmer-answer');div.append(node('strong','',t(head)),node('p','',content));root.append(div);};
    section('what',r?status:s?.busy?t('statusBusy'):s?.error?t('statusError'):t('statusEmpty'));
    if(r){
      const b=r.baseline||{},req=s.request||{};
      let message=t('why'+({feasible:'Feasible',blocked:'Blocked',unknown:'Unknown',completed:'Completed'}[r.status]||'Unknown'));
      if(Number.isFinite(req.target_units)&&Number.isFinite(req.capacity_units))
        message+=' '+t('declared')+' '+req.target_units+' '+t('units')+' '+t('canHandle')+' '+req.capacity_units+'.';
      if(typeof b.shortfall_units==='number'&&b.shortfall_units>0)
        message+=' '+t('gap')+': '+b.shortfall_units+' '+t('units')+'.';
      if(typeof b.time_budget?.time_slack_hours==='number')
        message+=' '+t('slack')+' '+Number(b.time_budget.time_slack_hours.toFixed(2))+' '+t('hoursUnit')+'.';
      section('why',message);
    }else section('why',s?.error?friendlyError(s.error):t('whyNoResult'));
    const next=node('div','farmer-cta');
    if(!r){
      next.append(button(t('edit'),()=>showPage(2),'btn'),button(t(s?.error?'tryAgain':'run'),()=>byId('runAssessment').click()));
    }else{
      next.append(button(t('edit'),()=>showPage(2),'btn'),button(t('seeAction'),()=>showPage(4)));
    }
    root.append(node('strong','',t('nextAction')),next,node('p','farmer-limitation',t('unverified')));
  }
  function friendlyError(raw){
    const s=String(raw||'');
    if(/location|Jalna|supported/i.test(s))return t('errorScope');
    if(/deadline|timestamp|date/i.test(s))return t('errorTime');
    if(/acknowledge|confirm|comparable/i.test(s))return t('errorConfirm');
    if(/number|negative|positive|amount|required|capacity|hours/i.test(s))return t('errorAmount');
    return t('statusError');
  }
  function paintAction(){
    const s=snapshot(),r=s?.evaluation,root=byId('farmerActionCard');root.replaceChildren();
    root.append(node('h2','',t('actionHeading')));
    if(!r){root.append(node('p','',t('noAction')),button(t('run'),()=>showPage(3)));return;}
    const pkgs=r.packages||[],current=Number.isInteger(s.selectedPackage)?pkgs[s.selectedPackage]:null;
    const block=node('p','farmer-action-result',t('status'+({feasible:'Feasible',blocked:'Blocked',unknown:'Unknown',completed:'Completed'}[r.status]||'Unknown')));
    root.append(block);
    if(current){
      root.append(node('p','',t('selected')+': '+current.change_ids.join(', ')));
      if(typeof current.projected?.original_target_unhandled_units==='number')
        root.append(node('strong','',t('remaining')+' '+current.projected.original_target_unhandled_units+' '+t('units')));
    }else if(typeof r.baseline?.shortfall_units==='number')
      root.append(node('p','',t('noApplied')+' '+t('gap')+': '+r.baseline.shortfall_units+' '+t('units')+'.'));
    if(pkgs.length){
      const group=node('div','farmer-package-buttons');
      pkgs.forEach((p,i)=>{
        const amount=typeof p.projected?.original_target_unhandled_units==='number'?p.projected.original_target_unhandled_units:'?';
        const title=t('option')+' '+(i+1)+' · '+t('remaining')+' '+amount;
        const b=button(title,()=>{
          const engineButton=byId('packageList')?.querySelectorAll('button.package-card')?.[i];
          if(engineButton)engineButton.click();
        },'farmer-package-option'+(s.selectedPackage===i?' selected':''));
        b.setAttribute('aria-pressed',String(s.selectedPackage===i));group.append(b);
      });root.append(group);
    }else root.append(node('p','',t('noPackages')));
    root.append(node('p','farmer-limitation',t('notBooked')),node('p','farmer-limitation',t('unverified')));
    const actions=node('div','farmer-cta');actions.append(button(t('edit'),()=>showPage(2),'btn'));
    actions.append(button(t('showDetail'),()=>{experience='detailed';try{localStorage.setItem('agri-experience-v1','detailed')}catch{}goto(4)},'btn'));
    root.append(actions);
  }
  function paintHelp(){
    const root=byId('farmerHelpPanel');root.replaceChildren();
    root.append(node('h1','',t('helpTitle')),node('p','',t('helpText')));
    const steps=[['helpWeather',1],['helpFarm',2],['helpCheck',3],['helpAction',4]];
    steps.forEach(([label,page],i)=>{
      root.append(button((i+1)+'. '+t(label),()=>showPage(page),'farmer-help-step'));
    });
    root.append(button(t('helpAsk'),()=>byId('assistantLaunch')?.click(),'btn primary'));
    root.append(node('p','farmer-limitation',t('helpLimit')));
  }
  function paint(){
    createOnce();document.body.dataset.experience=experience;
    document.body.dataset.advanced=advanced?'open':'closed';
    paintSwitch();paintLabels();paintNav();paintResources();
    explanationInfo();paintAction();paintHelp();
  }
  const originalGoto=goto;
  goto=function(n){originalGoto(n);paint();};
  const originalLanguage=changeLanguage;
  changeLanguage=function(){originalLanguage();paint();};
  ['input','change'].forEach(evt=>document.addEventListener(evt,e=>{
    if(['quantity','capacity','duration','readiness','confirmInputs','deadlineInput'].includes(e.target?.id))paintResources();
  }));
  for(const id of ['resultTitle','packageCount','summaryOutcome','resultReason']){
    const el=byId(id);if(el)new MutationObserver(()=>{explanationInfo();paintAction();}).observe(el,{childList:true,characterData:true,subtree:true});
  }
  document.addEventListener('agri:farmer-update',()=>{explanationInfo();paintAction();});
  paint();
})();
