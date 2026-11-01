/* FX-01: farmer-friendly interface for the existing Cloudflare FastAPI application.
   Presentation only: never changes API requests, server decisions, or evidence. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const make = (tag,cls,text) => {const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  const texts = {
    en:{
      simple:'Farmer View',detailed:'Detailed View',home:'Home',weather:'Check Weather',farm:'My Farm Details',check:'Check My Plan',changes:'Possible Changes',action:'My Action Plan',help:'Help',
      titleFarm:'My farm details',titleWeather:'Check the weather',titleCheck:'Can I finish this work?',titleChanges:'What could I change?',titleAction:'My action plan',
      quantity:'How much cotton needs attention?',capacity:'How much can you manage now?',duration:'How many hours will the work take?',readiness:'Is your place and equipment ready?',
      declaration:'I have checked the information I entered.',deadline:'When do you want this work finished?',baseline:'Add worker or equipment details (optional)',save:'Save my answers',run:'Check my plan',next:'See my action plan',
      readyYes:'Yes, ready',readyNo:'No, not ready',readyUnknown:'Not sure yet',
      count:'questions answered',youCan:'You can currently manage',still:'Still needs attention',resourceSummary:'Your answers at a glance',
      unitCaution:'Use the same equal-sized work parts in both boxes; they are not kilograms or bags unless the system supports that unit.',
      planOption:'Possible plan',planConditional:'Only resources confirmed in your answers are counted. Tap to view this plan.',chosenOption:'Selected plan',inputHelpQuantity:'Count your planned work in equal-sized parts. Do not enter kilograms as handling units.',inputHelpCapacity:'How many of the same work parts can you handle using resources you already have?',inputHelpTime:'Enter your own estimate for completing the work.',inputHelpReadiness:'Say whether your required work area and equipment are already ready.',quantityCaution:'This is arithmetic from your entries, not a crop-safety score.',
      statusWaiting:'Your plan has not been checked yet',statusBlocked:'Your plan needs some changes',statusFeasible:'Your plan looks workable from the details you gave',statusUnknown:'We need a little more information',statusCompleted:'You reported that the work is completed',
      why:'What does this mean?',nextStep:'What can you do next?',waitingWhy:'Enter your work details and a deadline, then select Check my plan.',waitingNext:'The system will explain its result after the Python engine responds.',
      gapWhy:'You entered {target} equal-sized work parts. Your available capacity covers {capacity}, leaving {gap} parts to plan for.',
      timeWhy:'Your chosen deadline leaves less time than you said the work needs.',readinessWhy:'You reported that the work area is not ready yet.',
      blockedWhy:'One or more conditions were not met. Check the detailed engine checks for the exact reason.',
      unknownWhy:'Some necessary details or resource availability are not confirmed, so the plan cannot be confirmed.',
      feasibleWhy:'The declared resources, time and readiness passed the planning checks. This does not prove crop or storage safety.',
      completedWhy:'You said the work is completed, but the system has not independently inspected it.',
      gapNext:'Check whether more workers or equipment really are available. Only confirmed changes count.',
      timeNext:'Check the work hours and your chosen deadline again. Weather models cannot promise safe conditions.',
      generalNext:'Review any unanswered questions, confirm available resources, then check the plan again.',
      feasibleNext:'Review the result and evidence before acting. Weather can change.',
      completedNext:'Review your own records and the plan summary.',
      evidence:'This explanation comes from a verified FastAPI response. It is not field-safety advice.',
      noEvidence:'No verified API result. No feasibility claim has been made.',
      reveal:'Show the technical checks',hide:'Hide the technical checks',
      weatherNote:'The weather shown here is a model forecast, not rain measured on your farm. Choose your own deadline; the app does not certify a rain-safe window.',
      optionsWaiting:'First check your plan. Then you can review possible confirmed changes.',
      optionsNone:'No confirmed suitable change package was returned by the backend. Check readiness, time and which resources really are available.',
      optionsFound:'The backend returned {count} possible change plan(s). These depend on confirmed resources; nothing is automatically arranged.',
      summaryWaiting:'Your action plan will appear after you enter your information and check the plan.',
      summaryReady:'Review the verified result, permitted changes and any work left. Nothing here guarantees crop protection.',
      detailsNote:'The original six technical pages, evidence, and calculations remain available in Detailed View.',
      errors:'Please enter valid amounts and confirm that these are your own answers.',saved:'Answers saved. Check my plan to get a server result.',
      farmerScope:'This planning pilot currently supports already-picked cotton in Jalna only.',
      optionType:'What would you change?',optionAmount:'How much would it change?',optionAvailability:'Is it really available?',resourceIdentifier:'Worker/equipment label (optional)'
    },
    mr:{
      simple:'शेतकऱ्यांसाठी',detailed:'सविस्तर माहिती',home:'मुख्य पान',weather:'पाऊस कधी येईल?',farm:'माझ्या कामाची माहिती',check:'माझा प्लॅन तपासा',changes:'काय बदल करू?',action:'आता काय करायचं?',help:'मदत',
      titleFarm:'माझ्या कामाची माहिती',titleWeather:'पावसाचा अंदाज पाहा',titleCheck:'हे काम वेळेत होईल का?',titleChanges:'काय बदल करता येतील?',titleAction:'माझा पुढचा प्लॅन',
      quantity:'किती कापसाचं काम करायचं आहे?',capacity:'सध्या किती कापूस सांभाळू शकता?',duration:'कामाला किती तास लागतील?',readiness:'जागा आणि साधनं तयार आहेत का?',
      declaration:'मी दिलेली माहिती तपासली आहे.',deadline:'काम कधीपर्यंत संपवायचं आहे?',baseline:'माणसं किंवा साधनांची माहिती (हवी असल्यास)',save:'माझी माहिती जतन करा',run:'माझा प्लॅन तपासा',next:'माझा पुढचा प्लॅन पाहा',
      readyYes:'हो, तयार आहे',readyNo:'नाही, तयार नाही',readyUnknown:'माहीत नाही',
      count:'प्रश्न भरले',youCan:'सध्या हाताळू शकता',still:'अजून बाकी आहे',resourceSummary:'तुम्ही दिलेली माहिती',
      unitCaution:'दोन्ही ठिकाणी सारख्या आकाराचे भाग मोजा. ही कामाची मोजणी आहे; वजन किंवा गोण्यांची मोजणी नाही.',
      planOption:'शक्य प्लॅन',planConditional:'तुम्ही खात्री दिलेलीच माणसं-साधनं मोजली आहेत. प्लॅन पाहण्यासाठी इथे दाबा.',chosenOption:'निवडलेला प्लॅन',inputHelpQuantity:'कामाचे समान आकाराचे भाग मोजा. ही किलोग्रॅमची मोजणी नाही.',inputHelpCapacity:'तुमच्याकडे आत्ता असलेली माणसं-साधनं वापरून त्यातले किती भाग हाताळू शकता?',inputHelpTime:'काम पूर्ण व्हायला तुमच्या अंदाजाने किती तास लागतील ते भरा.',inputHelpReadiness:'कामाची जागा आणि लागणारी साधनं आत्ता तयार आहेत का ते सांगा.',
      quantityCaution:'हा तुमच्या आकड्यांचा हिशोब आहे. यावरून कापूस सुरक्षित राहील असं ठरत नाही.',
      statusWaiting:'तुमचा प्लॅन अजून तपासलेला नाही',statusBlocked:'प्लॅनमध्ये थोडा बदल करावा लागेल',statusFeasible:'तुम्ही दिलेल्या माहितीनुसार हा प्लॅन जमू शकतो',statusUnknown:'अजून थोडी माहिती हवी आहे',statusCompleted:'तुम्ही काम पूर्ण झालं असं सांगितलं आहे',
      why:'असं का सांगितलं?',nextStep:'आता काय करता येईल?',waitingWhy:'कामाची माहिती आणि पूर्ण करायची वेळ भरा. मग प्लॅन तपासा.',waitingNext:'सर्व्हरवरून उत्तर आल्यावर इथे सोप्या भाषेत समजावून सांगू.',
      gapWhy:'तुम्ही {target} समान भागांचं काम सांगितलं. पण सध्या {capacity} भागांचं काम होऊ शकतं. अजून {gap} भागांसाठी प्लॅन हवा.',
      timeWhy:'तुम्ही ठरवलेल्या वेळेआधी काम संपवायला पुरेसा वेळ नाही.',readinessWhy:'तुम्ही सांगितलं की जागा किंवा साधनं अजून तयार नाहीत.',
      blockedWhy:'तुम्ही दिलेल्या काही गोष्टी जुळत नाहीत. नेमकं कारण पाहण्यासाठी सविस्तर तपासणी उघडा.',
      unknownWhy:'काही महत्त्वाची माहिती किंवा साधनांची खात्री झालेली नाही. त्यामुळे काम जमेल असं आत्ता सांगता येत नाही.',
      feasibleWhy:'तुम्ही सांगितलेली साधनं, वेळ आणि तयारी यांचा हिशोब जुळतो. पण कापूस सुरक्षित राहील याची हमी नाही.',
      completedWhy:'काम खरोखर पूर्ण झालं का, हे अ‍ॅपने स्वतः तपासलेलं नाही.',
      gapNext:'आणखी माणसं किंवा साधनं मिळणार आहेत का ते तपासा. खात्री असेल तरच ती मोजा.',
      timeNext:'कामाचे तास आणि तुम्ही ठरवलेली वेळ पुन्हा पाहा. पावसाचा अंदाज पक्का नसतो.',
      generalNext:'राहिलेली माहिती भरा, साधनांची खात्री करा आणि प्लॅन पुन्हा तपासा.',
      feasibleNext:'काम सुरू करण्याआधी निकाल आणि माहिती पाहा. हवामान बदलू शकतं.',
      completedNext:'तुमच्या नोंदी आणि प्लॅनचा सारांश पुन्हा तपासा.',
      evidence:'हे तुमच्या माहितीतून FastAPI सर्व्हरने दिलेलं उत्तर आहे; शेताच्या सुरक्षिततेची हमी नाही.',
      noEvidence:'सर्व्हरचा निकाल अजून आलेला नाही. काम जमेल असा दावा केलेला नाही.',
      reveal:'सविस्तर तपासणी पाहा',hide:'सविस्तर तपासणी लपवा',
      weatherNote:'हा हवामानाचा अंदाज आहे; तुमच्या शेतात मोजलेला पाऊस नाही. काम कधी संपवायचं ते तुम्ही ठरवा. सुरक्षित वेळेची हमी नाही.',
      optionsWaiting:'आधी प्लॅन तपासा. मग शक्य असलेले बदल दिसतील.',
      optionsNone:'सर्व्हरला अजून खात्रीचा बदल सापडलेला नाही. वेळ, तयारी आणि उपलब्ध माणसं-साधनं तपासा.',
      optionsFound:'सर्व्हरला खात्री असलेल्या पर्यायांतून {count} बदलांचे प्लॅन सापडले. कोणतंही काम आपोआप झालेलं नाही.',
      summaryWaiting:'तुमची माहिती तपासल्यावर पुढचा प्लॅन इथे दिसेल.',
      summaryReady:'निकाल, खात्रीचे बदल आणि बाकी काम पाहा. कापूस सुरक्षित राहील अशी हमी नाही.',
      detailsNote:'जुनी सगळी सविस्तर पानं, गणित आणि पुरावे सविस्तर माहितीमध्ये आहेत.',
      errors:'योग्य आकडे भरा आणि ही तुमचीच माहिती आहे याची खात्री करा.',saved:'माहिती जतन झाली. आता प्लॅन तपासा.',
      farmerScope:'सध्या जालन्यातील आधी वेचलेल्या कापसासाठीच हा प्लॅन आहे.',
      optionType:'काय बदलायचं आहे?',optionAmount:'किती फरक पडेल?',optionAvailability:'ते खरंच मिळणार आहे का?',resourceIdentifier:'माणूस किंवा साधनाचं नाव (हवं असल्यास)'
    },
    hi:{
      simple:'किसानों के लिए',detailed:'पूरी जानकारी',home:'मुख्य पेज',weather:'बारिश कब होगी?',farm:'मेरे खेत का काम',check:'मेरा प्लान जाँचें',changes:'क्या बदलें?',action:'अब क्या करना है?',help:'मदद',
      titleFarm:'मेरे खेत के काम की जानकारी',titleWeather:'बारिश का अनुमान देखें',titleCheck:'क्या काम समय पर होगा?',titleChanges:'क्या बदलाव कर सकते हैं?',titleAction:'मेरा अगला प्लान',
      quantity:'कितना कपास संभालना है?',capacity:'अभी कितना कपास संभाल सकते हैं?',duration:'काम में कितने घंटे लगेंगे?',readiness:'जगह और साधन तैयार हैं?',
      declaration:'मैंने अपनी दी हुई जानकारी जाँच ली है।',deadline:'काम कब तक पूरा करना है?',baseline:'लोगों या साधनों की जानकारी (चाहें तो)',save:'मेरी जानकारी सहेजें',run:'मेरा प्लान जाँचें',next:'मेरा अगला प्लान देखें',
      readyYes:'हाँ, तैयार',readyNo:'नहीं, तैयार नहीं',readyUnknown:'पता नहीं',
      count:'सवाल भरे',youCan:'अभी संभाल सकते हैं',still:'अभी काम बाकी है',resourceSummary:'आपकी दी हुई जानकारी',
      unitCaution:'दोनों जगह बराबर आकार के हिस्से गिनें। यह काम की गिनती है, वजन या बोरियों की नहीं।',
      planOption:'संभव प्लान',planConditional:'सिर्फ वही लोग और साधन गिने गए हैं जिनकी आपने पुष्टि की है। प्लान देखने के लिए दबाएँ।',chosenOption:'चुना हुआ प्लान',inputHelpQuantity:'काम के बराबर आकार के हिस्से गिनें। यह किलोग्राम की गिनती नहीं है।',inputHelpCapacity:'आपके पास मौजूद लोगों और साधनों से ऐसे कितने हिस्से संभाले जा सकते हैं?',inputHelpTime:'आपके अनुमान से काम पूरा करने में कितने घंटे लगेंगे?',inputHelpReadiness:'बताएँ कि काम की जगह और ज़रूरी साधन अभी तैयार हैं या नहीं।',
      quantityCaution:'यह हिसाब आपके दिए आँकड़ों से है। इससे कपास सुरक्षित होने की गारंटी नहीं मिलती।',
      statusWaiting:'आपका प्लान अभी जाँचा नहीं गया',statusBlocked:'आपके प्लान में कुछ बदलाव ज़रूरी हैं',statusFeasible:'आपकी जानकारी के हिसाब से प्लान संभव दिखता है',statusUnknown:'अभी थोड़ी और जानकारी चाहिए',statusCompleted:'आपने बताया कि काम पूरा हो गया',
      why:'ऐसा क्यों बताया?',nextStep:'अब क्या कर सकते हैं?',waitingWhy:'अपने काम की जानकारी और पूरा करने का समय भरें। फिर प्लान जाँचें।',waitingNext:'सर्वर का जवाब मिलने पर यहाँ आसान भाषा में समझाएँगे।',
      gapWhy:'आपने {target} बराबर हिस्सों का काम बताया। अभी {capacity} हिस्से संभाल सकते हैं। बाकी {gap} हिस्सों की योजना चाहिए।',
      timeWhy:'आपके चुने समय तक काम खत्म करने के लिए पर्याप्त समय नहीं है.',readinessWhy:'आपने बताया कि जगह या साधन तैयार नहीं हैं।',
      blockedWhy:'आपके दिए विवरण में कुछ शर्तें पूरी नहीं हुईं। पूरी जाँच खोलकर कारण देखें।',
      unknownWhy:'कुछ ज़रूरी जानकारी या साधन की पुष्टि नहीं हुई है। इसलिए अभी काम हो जाएगा, ऐसा नहीं कह सकते।',
      feasibleWhy:'आपके बताए साधन, समय और तैयारी का हिसाब ठीक है। लेकिन कपास सुरक्षित रहने की गारंटी नहीं है।',
      completedWhy:'ऐप ने खुद जाँच नहीं की कि काम सच में पूरा हुआ है।',
      gapNext:'देखें कि और लोग या साधन सच में मिल सकते हैं या नहीं। सिर्फ पक्के साधन गिनें।',
      timeNext:'काम के घंटे और अपना चुना समय फिर देखें। बारिश का अनुमान पक्का नहीं होता।',
      generalNext:'बाकी जानकारी भरें, साधन पक्के करें और प्लान फिर जाँचें।',
      feasibleNext:'काम शुरू करने से पहले नतीजा और जानकारी देखें। मौसम बदल सकता है।',
      completedNext:'अपने रिकॉर्ड और प्लान का सारांश फिर जाँचें।',
      evidence:'यह आपके विवरण पर FastAPI सर्वर का असली जवाब है, खेत की सुरक्षा की गारंटी नहीं।',
      noEvidence:'सर्वर का नतीजा अभी नहीं मिला। कोई सफलता का दावा नहीं किया गया।',
      reveal:'पूरी जाँच देखें',hide:'पूरी जाँच छुपाएँ',
      weatherNote:'यह मौसम का अनुमान है, आपके खेत में नापी गई बारिश नहीं। काम कब खत्म करना है, आप तय करें। सुरक्षित समय की गारंटी नहीं।',
      optionsWaiting:'पहले प्लान जाँचें। फिर संभव बदलाव दिखेंगे।',
      optionsNone:'सर्वर को अभी कोई पक्का बदलाव नहीं मिला। समय, तैयारी और उपलब्ध लोग-साधन देखें।',
      optionsFound:'सर्वर को पक्के विकल्पों में से {count} बदलाव वाले प्लान मिले। कोई काम अपने आप नहीं हुआ है।',
      summaryWaiting:'आपके जवाब जाँचने के बाद अगला प्लान यहाँ दिखेगा।',
      summaryReady:'नतीजा, पक्के बदलाव और बाकी काम देखें। कपास सुरक्षित रहने की गारंटी नहीं है।',
      detailsNote:'पुराने सभी विस्तृत पेज, हिसाब और सबूत पूरी जानकारी में मौजूद हैं।',
      errors:'सही संख्या भरें और बताएँ कि ये आपके अपने जवाब हैं।',saved:'जानकारी सहेजी गई। अब प्लान जाँचें।',
      farmerScope:'अभी सिर्फ जालना के पहले तोड़े गए कपास का प्लान जाँचा जाता है।',
      optionType:'क्या बदलना है?',optionAmount:'कितना फर्क पड़ेगा?',optionAvailability:'क्या यह सच में उपलब्ध है?',resourceIdentifier:'व्यक्ति या साधन का नाम (चाहें तो)'
    }
  };
  /* Plain-language labels for the remaining dashboard and planning pages. */
  const moreCopy = {
    en:{forecastKpi:'Upcoming weather',deadlineKpi:'When will you finish?',resourcesKpi:'My farm details',feasKpi:'My plan result',
      begin:'Start my plan',weatherAction:'Check the weather',enterFarm:'Enter my farm details',
      pathTitle:'How to make your plan',stepWeather:'Check the weather',stepResources:'Tell us about your work',stepFeas:'Check your plan',stepChanges:'See what you can change',
      weatherLead:'See the rain forecast and choose the time you want to finish.',deadlineLabel:'Finish my work by (IST)',saveDeadline:'Save my finish time',
      workingDetails:'My work',unitsIntro:'Use the same equal-sized work parts for both numbers.',
      optionalChanges:'Extra help you may be able to arrange',optionsDesc:'Only add help you are sure you can get.',
      whyDecision:'Why did this happen?',minimality:'Each suggested change is needed',minimalityDesc:'The engine returned these only from confirmed options; they may not be the cheapest.',
      packageOptions:'Possible changes',scenarioComparison:'Compare the original plan and changed plan',
      replanGuidance:'How to change your plan',reviewPlan:'Review my plan',noPackages:'No confirmed changes found',
      noPackagesBody:'Check the help you can actually arrange, then check your plan again.'},
    mr:{forecastKpi:'पावसाचा अंदाज',deadlineKpi:'काम कधी संपवायचं?',resourcesKpi:'माझ्या कामाची माहिती',feasKpi:'माझा प्लॅन कसा आहे?',
      begin:'प्लॅन सुरू करा',weatherAction:'पाऊस कधी येईल ते पाहा',enterFarm:'माझ्या कामाची माहिती भरा',
      pathTitle:'प्लॅन कसा करायचा?',stepWeather:'पावसाचा अंदाज पाहा',stepResources:'तुमच्या कामाची माहिती भरा',stepFeas:'प्लॅन तपासा',stepChanges:'शक्य बदल पाहा',
      weatherLead:'पावसाचा अंदाज पाहा आणि काम कधी संपवायचं ते ठरवा.',deadlineLabel:'काम कधीपर्यंत संपवायचं? (IST)',saveDeadline:'कामाची वेळ जतन करा',
      workingDetails:'माझ्या कामाची माहिती',unitsIntro:'दोन्ही ठिकाणी सारख्या आकाराचे भाग मोजा.',
      optionalChanges:'आणखी काय मदत मिळू शकते?',optionsDesc:'खात्रीने मिळणारी माणसं किंवा साधनंच भरा.',
      whyDecision:'असं का सांगितलं?',minimality:'सुचवलेल्या प्रत्येक बदलाची गरज आहे',minimalityDesc:'हे बदल खात्रीच्या पर्यायांतूनच आले आहेत; ते सर्वात स्वस्त असतीलच असं नाही.',
      packageOptions:'शक्य बदल',scenarioComparison:'आधीचा आणि बदललेला प्लॅन पाहा',
      replanGuidance:'प्लॅन कसा बदलायचा?',reviewPlan:'माझा प्लॅन पुन्हा पाहा',noPackages:'खात्रीचा बदल सापडला नाही',
      noPackagesBody:'खरंच कोणती मदत मिळेल ते तपासा आणि प्लॅन पुन्हा पाहा.'},
    hi:{forecastKpi:'बारिश का अनुमान',deadlineKpi:'काम कब खत्म करना है?',resourcesKpi:'मेरे खेत का काम',feasKpi:'मेरे प्लान का नतीजा',
      begin:'प्लान शुरू करें',weatherAction:'बारिश का अनुमान देखें',enterFarm:'मेरे खेत का काम भरें',
      pathTitle:'प्लान कैसे बनाएँ?',stepWeather:'बारिश का अनुमान देखें',stepResources:'काम की जानकारी भरें',stepFeas:'प्लान जाँचें',stepChanges:'संभव बदलाव देखें',
      weatherLead:'बारिश का अनुमान देखें और काम पूरा करने का समय चुनें।',deadlineLabel:'काम कब तक पूरा करना है? (IST)',saveDeadline:'काम का समय सहेजें',
      workingDetails:'मेरे काम की जानकारी',unitsIntro:'दोनों जगह बराबर आकार के हिस्से गिनें।',
      optionalChanges:'और कैसी मदद मिल सकती है?',optionsDesc:'सिर्फ वही लोग या साधन गिनें जो पक्के मिलेंगे।',
      whyDecision:'ऐसा क्यों हुआ?',minimality:'हर सुझाया बदलाव ज़रूरी है',minimalityDesc:'ये बदलाव पक्के विकल्पों से आए हैं; ज़रूरी नहीं ये सबसे सस्ते हों।',
      packageOptions:'संभव बदलाव',scenarioComparison:'पहले और बदले प्लान को देखें',
      replanGuidance:'प्लान कैसे बदलें?',reviewPlan:'मेरा प्लान फिर देखें',noPackages:'अभी कोई पक्का बदलाव नहीं मिला',
      noPackagesBody:'देखें कि सच में क्या मदद मिलेगी, फिर प्लान जाँचें।'}
  };
  const lang=()=>['en','mr','hi'].includes(byId('language')?.value)?byId('language').value:'en';
  const t=key=>texts[lang()][key]||moreCopy[lang()][key]||texts.en[key]||moreCopy.en[key]||key;
  let mode='farmer',showTechnical=false,showResource=false;
  try{mode=localStorage.getItem('agri-foresight-view')==='detailed'?'detailed':'farmer';}catch(_){}
  const nav=byId('navDesktop'),rail=document.querySelector('aside.rail');
  if(!nav||!rail)return;
  const selector=make('div','farmer-view-switch');
  selector.setAttribute('role','group');selector.setAttribute('aria-label','Navigation experience');
  const farmerButton=make('button','farmer-view-option'),detailButton=make('button','farmer-view-option');
  [farmerButton,detailButton].forEach(b=>b.type='button');
  selector.append(farmerButton,detailButton);
  rail.querySelector('.brand')?.insertAdjacentElement('afterend',selector);
  const farmerNav=make('nav','farmer-nav');
  farmerNav.id='farmerNav';farmerNav.setAttribute('aria-label','Simple farmer pages');
  nav.insertAdjacentElement('beforebegin',farmerNav);
  const mobileMode=make('button','pill farmer-top-toggle');
  mobileMode.type='button';mobileMode.id='farmerTopToggle';document.querySelector('.barcontrols')?.append(mobileMode);
  const links=[['home',0,'⌂'],['weather',1,'☁'],['farm',2,'♧'],['check',3,'✓'],['changes',4,'↔'],['action',5,'▤'],['help','help','?']];
  const go=page=>{
    if(page==='help'){byId('assistantLaunch')?.click();return;}
    (nav.querySelector('[data-nav="'+page+'"]')||document.querySelector('.goto[data-target="'+page+'"]'))?.click();
  };
  for(const [key,page,icon] of links){
    const b=make('button','farmer-nav-link');b.type='button';b.dataset.to=String(page);
    b.append(make('span','farmer-nav-icon',icon),make('span','farmer-nav-label'));
    b.addEventListener('click',()=>go(page));farmerNav.append(b);
  }
  const advanced=byId('baseline')?.closest('label');advanced?.classList.add('farmer-advanced-resource');
  const moreResource=make('button','btn farmer-detail-toggle');moreResource.type='button';
  advanced?.insertAdjacentElement('beforebegin',moreResource);
  moreResource.addEventListener('click',()=>{showResource=!showResource;refresh();});
  const resourceBox=make('section','farmer-info-card');resourceBox.id='farmerResourceSummary';
  resourceBox.setAttribute('aria-live','polite');
  const resourceTitle=make('h3'),resourceCount=make('p','farmer-progress'),resourceValues=make('div','farmer-simple-counts'),
        amount1=make('div'),amount2=make('div'),resourceWarning=make('p','farmer-disclaimer');
  resourceValues.append(amount1,amount2);resourceBox.append(resourceTitle,resourceCount,resourceValues,resourceWarning);
  document.querySelector('section.section[data-page="2"] .resource-layout > .panel')?.append(resourceBox);
  const weatherBox=make('aside','farmer-info-card');
  document.querySelector('section.section[data-page="1"] .page-head')?.insertAdjacentElement('afterend',weatherBox);
  const resultBox=make('section','farmer-info-card');resultBox.setAttribute('role','status');resultBox.setAttribute('aria-live','polite');
  const resultTitle=make('h2'),whyTitle=make('h3'),why=make('p'),nextTitle=make('h3'),next=make('p'),proof=make('small','farmer-disclaimer');
  resultBox.append(resultTitle,whyTitle,why,nextTitle,next,proof);
  byId('resultHero')?.insertAdjacentElement('beforebegin',resultBox);
  const technical=make('button','btn farmer-detail-toggle');technical.type='button';technical.setAttribute('aria-expanded','false');
  resultBox.insertAdjacentElement('afterend',technical);
  technical.addEventListener('click',()=>{showTechnical=!showTechnical;refresh();});
  const tipBox=make('div','farmer-input-hints');
  const hints={};
  for(const [id,key] of [['quantity','inputHelpQuantity'],['capacity','inputHelpCapacity'],['duration','inputHelpTime'],['readiness','inputHelpReadiness']]){
    const label=byId(id)?.closest('label');if(!label)continue;
    const p=make('small','farmer-input-tip');p.dataset.farmerHelp=key;label.append(p);hints[key]=p;
  }
  const originalPackages=byId('packageList');
  const quickPackages=make('div','farmer-quick-packages');
  if(originalPackages)originalPackages.insertAdjacentElement('beforebegin',quickPackages);
  function renderQuickPackages(){
    quickPackages.replaceChildren();
    if(!verified()){quickPackages.textContent=t('optionsWaiting');return;}
    const buttons=[...(originalPackages?.querySelectorAll('button.package-card')||[])];
    if(!buttons.length){quickPackages.textContent=t('optionsNone');return;}
    buttons.forEach((original,i)=>{
      const button=make('button','farmer-package-btn');button.type='button';
      const title=make('strong','',t('planOption')+' '+(i+1));
      const sub=make('small','',t('planConditional'));
      button.append(title,sub);
      if(original.classList.contains('selected')){
        button.classList.add('selected');button.setAttribute('aria-pressed','true');title.textContent+=' ✓ '+t('chosenOption');
      }else button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>original.click());
      quickPackages.append(button);
    });
  }
  if(originalPackages)new MutationObserver(renderQuickPackages).observe(originalPackages,{childList:true,subtree:true});
  const changesBox=make('section','farmer-info-card');changesBox.setAttribute('aria-live','polite');
  document.querySelector('section.section[data-page="4"] .page-head')?.insertAdjacentElement('afterend',changesBox);
  const summaryBox=make('section','farmer-info-card');summaryBox.setAttribute('aria-live','polite');
  document.querySelector('section.section[data-page="5"] .page-head')?.insertAdjacentElement('afterend',summaryBox);
  const headings={1:'titleWeather',2:'titleFarm',3:'titleCheck',4:'titleChanges',5:'titleAction'};
  const translationKeys={
    quantity:'quantity',capacity:'capacity',duration:'duration',readiness:'readiness',confirmText:'declaration',
    baseline:'baseline',saveResourceButton:'save',nextFeasibility:'run',runPreview:'run',
    weatherStatus:'forecastKpi',deadlineStatus:'deadlineKpi',resourcesStatus:'resourcesKpi',feasibilityStatus:'feasKpi',
    begin:'begin',forecast:'weatherAction',nextResources:'enterFarm',pathTitle:'pathTitle',stepWeather:'stepWeather',stepResources:'stepResources',stepFeas:'stepFeas',stepChanges:'stepChanges',
    weatherLead:'weatherLead',deadlineLabel:'deadlineLabel',saveDeadline:'saveDeadline',workingDetails:'workingDetails',unitsIntro:'unitsIntro',
    optionalChanges:'optionalChanges',optionsDesc:'optionsDesc',whyDecision:'whyDecision',minimality:'minimality',minimalityDesc:'minimalityDesc',
    packageOptions:'packageOptions',scenarioComparison:'scenarioComparison',replanGuidance:'replanGuidance',reviewPlan:'reviewPlan',noPackages:'noPackages',noPackagesBody:'noPackagesBody',
    viewSummary:'next',optionType:'optionType',optionAmount:'optionAmount',
    optionAvailability:'optionAvailability',resourceIdentifier:'resourceIdentifier'
  };
  function verified(){
    return ['feasible','blocked','unknown','completed'].includes(byId('resultHero')?.dataset.kind)&&
      (byId('engineIndicator')?.textContent||'').includes('RESPONSE VERIFIED');
  }
  const fmt=n=>Number.isFinite(n)?n.toLocaleString('en-IN',{maximumFractionDigits:2}):'—';
  const number=id=>{const raw=byId(id)?.value?.trim();if(!raw)return null;const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;};
  const parsed=id=>{const s=byId(id)?.textContent||'';if(s==='—'||s==='Unknown')return null;const v=Number(s.replace(/[^0-9.\-]/g,''));return Number.isFinite(v)?v:null;};
  const replace=(s,vals)=>s.replace(/\{(target|capacity|gap|count)\}/g,(_,key)=>String(vals[key]??'—'));
  function showResources(){
    const a=number('quantity'),b=number('capacity'),h=number('duration'),r=byId('readiness')?.value;
    const saved=typeof state!=='undefined'&&Boolean(state.deadline)&&byId('deadlineInput')?.value===state.deadline;
    const count=[a!==null&&a>0,b!==null,h!==null&&h>0,saved,r==='yes'||r==='no',byId('confirmInputs')?.checked].filter(Boolean).length;
    resourceTitle.textContent=t('resourceSummary');resourceCount.textContent=count+'/6 '+t('count');
    amount1.textContent=t('youCan')+': '+(a!==null&&b!==null?fmt(Math.min(a,b)):'—');
    amount2.textContent=t('still')+': '+(a!==null&&b!==null?fmt(Math.max(0,a-b)):'—');
    resourceWarning.textContent=t('quantityCaution')+' '+t('unitCaution');
    moreResource.textContent=t('baseline');moreResource.setAttribute('aria-expanded',String(showResource));
    const rsel=byId('readiness');if(rsel)for(const o of rsel.options)o.textContent=t(o.value==='yes'?'readyYes':o.value==='no'?'readyNo':'readyUnknown');
  }
  function showResult(){
    const status=verified()?byId('resultHero').dataset.kind:null;
    resultTitle.textContent=t(status?'status'+status.charAt(0).toUpperCase()+status.slice(1):'statusWaiting');
    whyTitle.textContent=t('why');nextTitle.textContent=t('nextStep');
    if(!status){why.textContent=t('waitingWhy');next.textContent=t('waitingNext');proof.textContent=t('noEvidence');return;}
    const target=parsed('resultGoal'),cap=parsed('resultCap'),gap=parsed('resultGap'),slack=parsed('resultSlack');
    if(status==='blocked'){
      why.textContent=gap!==null&&gap>0&&target!==null&&cap!==null?
        replace(t('gapWhy'),{target:fmt(target),capacity:fmt(cap),gap:fmt(gap)}):
        slack!==null&&slack<0?t('timeWhy'):byId('readiness')?.value==='no'?t('readinessWhy'):t('blockedWhy');
      next.textContent=gap!==null&&gap>0?t('gapNext'):slack!==null&&slack<0?t('timeNext'):t('generalNext');
    }else{
      why.textContent=t(status+'Why');next.textContent=t(status==='feasible'?'feasibleNext':status==='completed'?'completedNext':'generalNext');
    }
    proof.textContent=t('evidence');
  }
  function showPlans(){
    const status=verified(),count=parseInt(byId('packageCount')?.textContent||'',10)||0;
    changesBox.textContent=status?(count>0?replace(t('optionsFound'),{count}):t('optionsNone')):t('optionsWaiting');
    summaryBox.textContent=status?t('summaryReady'):t('summaryWaiting');
  }
  function showNavigation(){
    farmerButton.textContent=t('simple');detailButton.textContent=t('detailed');
    farmerButton.setAttribute('aria-pressed',String(mode==='farmer'));
    detailButton.setAttribute('aria-pressed',String(mode==='detailed'));
    mobileMode.textContent=mode==='farmer'?t('detailed'):t('simple');
    const active=Number(document.querySelector('.section.active')?.dataset.page||0);
    farmerNav.querySelectorAll('button').forEach((b,i)=>{
      const [key,route]=links[i];b.querySelector('.farmer-nav-label').textContent=t(key);
      const selected=route===active;b.classList.toggle('active',selected);
      b.setAttribute('aria-current',selected?'page':'false');
    });
    if(mode==='farmer')byId('navMobile')?.querySelectorAll('button[data-nav]').forEach((b,i)=>{
      const key=links[i]?.[0];if(!key)return;const label=b.querySelector('span:last-child');
      if(label)label.textContent=t(key);b.title=t(key);
    });
  }
  function showWords(){
    if(mode!=='farmer')return;
    const current=Number(document.querySelector('.section.active')?.dataset.page||0);
    for(const [p,key] of Object.entries(headings))document.querySelector('.section[data-page="'+p+'"] .page-head h1')?.setAttribute('data-farmer-heading',key);
    for(const node of document.querySelectorAll('[data-i18n]')){
      const key=translationKeys[node.dataset.i18n];
      if(key&&t(key)!==key&&node.textContent!==t(key))node.textContent=t(key);
    }
    for(const [p,key] of Object.entries(headings)){
      const node=document.querySelector('.section[data-page="'+p+'"] .page-head h1');
      if(node&&node.textContent!==t(key))node.textContent=t(key);
    }
    for(const [id,key] of [['quantity','quantity'],['capacity','capacity'],['duration','duration'],['readiness','readiness'],['baseline','baseline']]){
      const span=byId(id)?.closest('label')?.querySelector('span[data-i18n]');
      if(span&&span.textContent!==t(key))span.textContent=t(key);
    }
    const target=byId('saveResources');if(target)target.textContent=t('save');
    const assess=byId('runAssessment');if(assess&&!assess.disabled)assess.textContent=t('run');
    const notice=byId('resourceNotice');if(notice){
      if(notice.textContent.startsWith('Enter valid nonnegative'))notice.textContent=t('errors');
      else if(notice.textContent.startsWith('Resource draft saved'))notice.textContent=t('saved');
    }
    weatherBox.textContent=t('weatherNote')+' '+t('farmerScope');
    technical.textContent=t(showTechnical?'hide':'reveal');
    technical.setAttribute('aria-expanded',String(showTechnical));
  }
  function refresh(){
    document.documentElement.dataset.farmerView=mode==='farmer'?'on':'off';
    document.documentElement.dataset.farmerDetails=showTechnical?'on':'off';
    document.documentElement.dataset.farmerResourceDetail=showResource?'on':'off';
    showNavigation();showWords();showResources();showResult();showPlans();renderQuickPackages();
    for(const [key,node] of Object.entries(hints))node.textContent=t(key);
  }
  function setMode(value){
    mode=value==='detailed'?'detailed':'farmer';
    try{localStorage.setItem('agri-foresight-view',mode);}catch(_){}
    if(mode==='detailed'&&typeof changeLanguage==='function')changeLanguage();
    refresh();
  }
  farmerButton.addEventListener('click',()=>setMode('farmer'));
  detailButton.addEventListener('click',()=>setMode('detailed'));
  mobileMode.addEventListener('click',()=>setMode(mode==='farmer'?'detailed':'farmer'));
  if(typeof goto==='function'){
    const original=goto;goto=function(p){const ret=original(p);queueMicrotask(refresh);return ret;};
  }
  if(typeof changeLanguage==='function'){
    const original=changeLanguage;changeLanguage=function(){const ret=original();queueMicrotask(refresh);return ret;};
  }
  byId('language')?.addEventListener('change',()=>queueMicrotask(refresh));
  for(const id of ['quantity','capacity','duration','readiness','baseline','deadlineInput','confirmInputs']){
    byId(id)?.addEventListener('input',()=>queueMicrotask(()=>{showResources();showResult();}));
    byId(id)?.addEventListener('change',()=>queueMicrotask(()=>{showResources();showResult();}));
  }
  for(const id of ['saveDeadline','saveResources','runAssessment','resetAssessment']){
    byId(id)?.addEventListener('click',()=>queueMicrotask(refresh));
  }
  const hero=byId('resultHero');
  if(hero)new MutationObserver(()=>{showResult();showPlans();})
    .observe(hero,{attributes:true,attributeFilter:['data-kind'],childList:true,subtree:true,characterData:true});
  const count=byId('packageCount');
  if(count)new MutationObserver(showPlans).observe(count,{childList:true,subtree:true,characterData:true});
  refresh();
})();