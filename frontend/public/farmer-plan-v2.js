/* FE-03 | Farmer cotton inputs and plain-language FastAPI explanations.
   kg/quintal inputs normalize to kg-equivalent comparable quantities; this
   NEVER estimates labour speed, soil safety, rain onset or farmer productivity. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
const lang=()=>['en','mr','hi'].includes($('language')?.value)?$('language').value:'en';
const copy={
 en:{
   purpose:'AgriForesight helps you check the Jalna rain forecast, plan work for already-picked cotton, and see whether your reported time and help are enough. If not, it shows possible changes you have confirmed.',
   crop:'Default and currently supported crop: already-picked cotton · Jalna, Maharashtra',
   unit:'How are you weighing your picked cotton?',kg:'Kilograms (kg)',q:'Quintals (100 kg)',unitHelp:'1 quintal = 100 kg. Use the same unit for both amounts. We compare farmer-reported weights; we do not estimate how fast workers handle cotton.',
   target:'How much picked cotton needs attention?',cap:'How much picked cotton can you manage with the help you already have?',
   targetHint:'Enter the full weight you want to manage.',capHint:'Only count the weight you can manage with the available people and equipment.',
   extraTitle:'Do you need any extra help?',extraInfo:'Only answer this if the cotton needing attention is more than your current capacity. We never assume how many kilograms an extra worker can manage.',
   none:'No extra help available',requested:'Maybe — not confirmed',confirmed:'Yes — definitely available',
   extraAmount:'How much extra cotton could that help handle?',extraHelp:'Name or identify this extra help (optional)',
   extraHint:'This additional capacity is your estimate. Workers and equipment are not automatically booked.',
   example:'Try a complete example with a real server result',exampleWarning:'This replaces the current form and its optional changes with clearly marked example inputs. Your own entries are not verified or submitted as real farm observations.',
   exampleConfirm:'Try the educational cotton example? This temporarily replaces your current form values. You can restore them afterwards.',
   exampleCaption:'EXAMPLE ONLY — 10 quintals to handle; 6 quintals current capacity; 4 hours work; 6 hours before finish time; work area ready; 4 quintals extra help confirmed.',
   restore:'Restore my previous entries',clear:'Example only — replace these values with your own before using this plan.',
   missing:'Enter both cotton amounts in the same unit, the hours needed and your work-area readiness.',
   missingUnit:'Enter valid, nonnegative weights. The amount needing attention must be more than zero.',
   missingDeadline:'Choose your finish time in Check Weather, then return here.',
   missingCheck:'Please check your answers and tick the confirmation box.',
   legacy:'Your saved Detailed View contains additional options in old abstract units. Review or remove them in Detailed View before checking a weight-based plan.',
   advanced:'Review other saved options in Detailed View',
   check:'Save my answers and check my plan',edit:'Change my answers',
   resultTitle:'What does your plan mean?',waiting:'Your plan has not been checked yet.',waitingAction:'First check your plan. Possible changes will appear only after the real server responds.',checking:'Checking your answers using the real Python engine…',failed:'The plan check did not work. Check your details and try again.',
   ready:'Based on your answers, the work plan fits.',blocked:'Your plan needs a change.',unknown:'Some details still need checking.',completed:'You said this work is already completed.',
   why:'Why?',next:'What can you do?',good:'Your declared capacity and working time meet the engine checks. This does not confirm the cotton will be safe from rain.',
   gap:'You need to manage {a} {u}, but you can currently handle {b} {u}. That leaves {g} {u} needing a plan.',
   time:'You need {h} hours of work, but only {a} hours are left before your chosen finish time.',
   readyNo:'You said the work area is not ready. Prepare it before relying on this plan.',
   readyUnknown:'You have not confirmed whether the work area is ready.',
   noMore:'No confirmed change solves the remaining problem yet. Recheck your time, capacity or available help.',
   availability:'Only confirmed, permitted and nonduplicate help is considered. Unconfirmed help is NOT counted.',
   actions:'Possible next steps from your confirmed options',pkg:'Possible change',pkgStatus:'After this change',remaining:'Still not handled from original total',
   add:'Extra help could handle another {n} {u}, based only on what you confirmed.',
   reduce:'Handle {n} {u} less for now. This is postponing work, NOT finishing it.',
   pkgExplain:'This option meets the engine conditions only if the declared resources really are available.',
   noPackages:'The engine found no complete eligible change using the options you entered.',
   choose:'Select this possible change',selected:'Selected possible change',view:'See my action plan',again:'Check this plan again',
   disclosure:'Weather predictions, local soil context and farmer answers do not independently prove crop safety. No workers, vehicles or protection are automatically arranged.',
   demo:'Educational example: the inputs are configured, but the result and change packages come from the real FastAPI engine.',
   note:'The calculations compare your reported cotton weights in a common kilogram-equivalent scale. They do not validate handling rates, workers, rain safety or crop loss.',
   nextAction:'Next: review the possible action plan',readyDone:'Review your entries and weather information before acting.',
 },
 mr:{
   purpose:'AgriForesight मध्ये जालन्याचा पावसाचा अंदाज पाहता येतो. वेचलेल्या कापसाचं काम, उपलब्ध माणसं-साधनं आणि वेळ भरल्यावर काम जमेल का ते तपासता येतं. नसेल तर तुम्ही खात्री दिलेले बदल पाहता येतात.',
   crop:'सध्या वेचलेला कापूस हेच पीक आहे · जालना, महाराष्ट्र',
   unit:'वेचलेला कापूस कशात मोजता?',kg:'किलो (kg)',q:'क्विंटल (१०० किलो)',unitHelp:'१ क्विंटल = १०० किलो. दोन्ही प्रश्नांत एकच मोजमाप वापरा. माणसं किती वेगाने काम करतील हे अ‍ॅप स्वतः ठरवत नाही.',
   target:'वेचलेला किती कापूस हाताळायचा आहे?',cap:'सध्या असलेल्या माणसांनी आणि साधनांनी किती कापूस हाताळू शकता?',
   targetHint:'सगळ्या कापसाचं वजन भरा.',capHint:'फक्त उपलब्ध माणसं-साधनांनी नक्की होईल तेवढंच वजन भरा.',
   extraTitle:'आणखी मदत मिळू शकते का?',extraInfo:'सध्या हाताळू शकता त्यापेक्षा जास्त कापूस असेल तरच हा भाग भरा. एका माणसाने किती काम होईल ते अ‍ॅप गृहीत धरत नाही.',
   none:'आणखी मदत नाही',requested:'कदाचित, खात्री नाही',confirmed:'हो, नक्की मिळेल',
   extraAmount:'त्या मदतीने आणखी किती कापूस हाताळता येईल?',extraHelp:'त्या मदतीचं नाव (हवं असल्यास)',
   extraHint:'ही क्षमता तुमचा अंदाज आहे. माणसं किंवा वाहनं आपोआप मिळणार नाहीत.',
   example:'खऱ्या सर्व्हरवर तपासलेलं उदाहरण पाहा',exampleWarning:'हे उदाहरण सध्याची माहिती तात्पुरती बदलेल. नंतर आधीची माहिती परत आणता येईल.',
   exampleConfirm:'कापसाचं शैक्षणिक उदाहरण वापरायचं? सध्याच्या फॉर्ममधली माहिती तात्पुरती बदलेल.',
   exampleCaption:'फक्त उदाहरण — १० क्विंटल कापूस; ६ क्विंटल क्षमता; ४ तास काम; ६ तास उपलब्ध; जागा तयार; ४ क्विंटल जास्त मदतीची खात्री.',
   restore:'माझी आधीची माहिती परत आणा',clear:'हे उदाहरण आहे. स्वतःचा प्लॅन वापरण्याआधी खरी माहिती भरा.',
   missing:'कापसाचं वजन, कामाचे तास आणि जागेची तयारी भरा.',
   missingUnit:'योग्य वजन भरा. हाताळायचा कापूस शून्यापेक्षा जास्त हवा.',
   missingDeadline:'हवामानाच्या पानावर काम संपवायची वेळ निवडा.',
   missingCheck:'दिलेली माहिती तपासा आणि खात्रीच्या चौकटीत खूण करा.',
   legacy:'सविस्तर माहितीत आधीचे वेगळे पर्याय आहेत. वजनाचा नवीन प्लॅन तपासण्याआधी ते पर्याय पाहा.',
   advanced:'इतर पर्याय सविस्तर माहितीत पाहा',
   check:'माहिती जतन करा आणि माझा प्लॅन तपासा',edit:'माझी माहिती बदला',
   resultTitle:'तुमच्या प्लॅनचा अर्थ काय?',waiting:'तुमचा प्लॅन अजून तपासलेला नाही.',waitingAction:'आधी प्लॅन तपासा. खरा सर्व्हर उत्तर दिल्यावरच शक्य बदल दिसतील.',checking:'तुमची माहिती सर्व्हरवर तपासत आहोत…',failed:'प्लॅन तपासता आला नाही. माहिती पुन्हा पाहा.',
   ready:'तुम्ही सांगितलेल्या माहितीनुसार हे काम जमू शकतं.',blocked:'प्लॅनमध्ये काही बदल हवेत.',unknown:'अजून काही गोष्टींची खात्री हवी.',completed:'तुम्ही काम झालं असं सांगितलं आहे.',
   why:'असं का?',next:'आता काय करता येईल?',good:'तुम्ही दिलेली क्षमता आणि वेळ या अटी जुळल्या. पण कापूस पावसापासून सुरक्षित राहील याची हमी नाही.',
   gap:'तुम्हाला {a} {u} कापूस हाताळायचा आहे. सध्या {b} {u} होऊ शकतो. अजून {g} {u} कापसाचा प्लॅन हवा.',
   time:'कामाला {h} तास लागणार आहेत. पण तुम्ही ठरवलेल्या वेळेपर्यंत फक्त {a} तास उरलेत.',
   readyNo:'तुम्ही सांगितलं की कामाची जागा तयार नाही. आधी ती तयार करा.',
   readyUnknown:'कामाची जागा तयार आहे की नाही, याची अजून खात्री नाही.',
   noMore:'सध्या खात्रीचा बदल सापडलेला नाही. वेळ, उपलब्ध मदत आणि क्षमता पुन्हा पाहा.',
   availability:'फक्त खात्रीची आणि वेगळी मदत मोजली जाते. अनिश्चित मदत मोजली जात नाही.',
   actions:'तुम्ही सांगितलेल्या मदतीतून शक्य बदल',pkg:'शक्य बदल',pkgStatus:'बदल केल्यावर',remaining:'मूळ कापसापैकी अजून बाकी',
   add:'खात्री दिलेल्या मदतीने आणखी {n} {u} कापूस हाताळता येऊ शकतो.',
   reduce:'आत्ता {n} {u} कापूस कमी हाताळाल. ते काम पुढे बाकीच राहील.',
   pkgExplain:'तुम्ही सांगितलेली मदत खरंच मिळाली, तरच हा प्लॅन जमू शकतो.',
   noPackages:'तुम्ही सांगितलेल्या पर्यायांतून पूर्ण कामासाठी योग्य बदल सापडला नाही.',
   choose:'हा बदल निवडा',selected:'हा बदल निवडलेला आहे',view:'माझा पुढचा प्लॅन पाहा',again:'प्लॅन पुन्हा तपासा',
   disclosure:'पावसाचा अंदाज किंवा शेताची माहिती कापूस सुरक्षित राहील याची खात्री देत नाही. माणसं-साधनं आपोआप मिळणार नाहीत.',
   demo:'हे शैक्षणिक उदाहरण आहे. माहिती उदाहरणाची आहे; निकाल खऱ्या FastAPI सर्व्हरवरून येतो.',
   note:'तुम्ही सांगितलेलं वजन किलोमध्ये मोजून हिशोब होतो. कामाचा वेग किंवा सुरक्षितता अ‍ॅप स्वतः ठरवत नाही.',
   nextAction:'पुढे: शक्य बदल पाहा',readyDone:'काम सुरू करण्याआधी माहिती आणि पावसाचा अंदाज पुन्हा पाहा.'
 },
 hi:{
   purpose:'AgriForesight में जालना की बारिश का अनुमान देखकर चुनी हुई कपास का काम प्लान कर सकते हैं। कपास की मात्रा, समय और उपलब्ध मदद भरने पर ऐप जाँचता है कि काम हो पाएगा या नहीं। जरूरत पड़ने पर पक्के विकल्प दिखाता है।',
   crop:'अभी डिफ़ॉल्ट फसल: चुनी हुई कपास · जालना, महाराष्ट्र',
   unit:'कपास का वजन किसमें भरेंगे?',kg:'किलोग्राम (kg)',q:'क्विंटल (100 किलो)',unitHelp:'1 क्विंटल = 100 किलो। दोनों सवालों में एक ही इकाई रखें। ऐप खुद मजदूरों के काम की रफ्तार नहीं मानता।',
   target:'कितनी चुनी हुई कपास संभालनी है?',cap:'अभी मौजूद लोगों और साधनों से कितनी कपास संभाल सकते हैं?',
   targetHint:'कपास का पूरा वजन भरें।',capHint:'जितना काम सच में कर सकते हैं उतना ही भरें।',
   extraTitle:'क्या और मदद मिल सकती है?',extraInfo:'यह तभी भरें जब काम आपकी मौजूदा क्षमता से ज्यादा है। ऐप मजदूर की क्षमता खुद तय नहीं करता।',
   none:'और मदद नहीं',requested:'शायद, पक्की नहीं',confirmed:'हाँ, पक्की मिलेगी',
   extraAmount:'उस मदद से कितना और कपास संभाला जा सकता है?',extraHelp:'मदद का नाम (चाहें तो)',
   extraHint:'यह आपकी बताई क्षमता है। लोग या वाहन अपने आप नहीं मिलेंगे।',
   example:'सर्वर से जाँचा गया पूरा उदाहरण देखें',exampleWarning:'यह उदाहरण अभी भरी जानकारी को कुछ देर के लिए बदलेगा। पुरानी जानकारी वापस ला सकते हैं।',
   exampleConfirm:'कपास का उदाहरण खोलें? अभी भरे फॉर्म का डेटा थोड़ी देर के लिए बदलेगा।',
   exampleCaption:'सिर्फ उदाहरण — 10 क्विंटल कपास; 6 क्विंटल क्षमता; 4 घंटे काम; 6 घंटे बाकी; जगह तैयार; 4 क्विंटल अतिरिक्त मदद पक्की।',
   restore:'मेरी पुरानी जानकारी वापस लाएँ',clear:'यह सिर्फ उदाहरण है। अपना प्लान देखने के लिए खुद की सही जानकारी भरें।',
   missing:'कपास की मात्रा, काम के घंटे और जगह की तैयारी भरें।',
   missingUnit:'सही वजन भरें। संभालने वाली कपास शून्य से ज्यादा होनी चाहिए।',
   missingDeadline:'मौसम पेज पर काम पूरा करने का समय चुनें।',
   missingCheck:'जवाब देखकर पुष्टि के बॉक्स में निशान लगाएँ।',
   legacy:'पूरी जानकारी में पुराने दूसरे विकल्प मौजूद हैं। वजन वाला प्लान जाँचने से पहले उन्हें देखें।',
   advanced:'पुराने विकल्प पूरी जानकारी में देखें',
   check:'मेरे जवाब सेव करके प्लान जाँचें',edit:'मेरे जवाब बदलें',
   resultTitle:'मेरे प्लान का क्या मतलब है?',waiting:'आपका प्लान अभी जाँचा नहीं गया है।',waitingAction:'पहले प्लान जाँचें। असली सर्वर का जवाब आने के बाद ही बदलाव दिखेंगे।',checking:'असली सर्वर से प्लान जाँच रहे हैं…',failed:'प्लान जाँच नहीं पाया। अपने जवाब दोबारा देखें।',
   ready:'आपके दिए हिसाब से काम हो सकता है।',blocked:'प्लान में कुछ बदलाव जरूरी हैं।',unknown:'कुछ बातों की अभी पुष्टि चाहिए।',completed:'आपने बताया कि काम पूरा हो गया।',
   why:'ऐसा क्यों?',next:'अब क्या करें?',good:'आपकी बताई क्षमता और समय का हिसाब ठीक है। इससे कपास बारिश से सुरक्षित होने की गारंटी नहीं है।',
   gap:'आपको {a} {u} कपास संभालना है, लेकिन अभी {b} {u} संभाल सकते हैं। बाकी {g} {u} के लिए प्लान चाहिए।',
   time:'काम में {h} घंटे लगेंगे, लेकिन तय समय तक सिर्फ {a} घंटे बचे हैं।',
   readyNo:'आपने बताया कि काम की जगह तैयार नहीं है। पहले उसे तैयार करें।',
   readyUnknown:'काम की जगह तैयार होने की अभी पुष्टि नहीं है।',
   noMore:'कोई पक्का बदलाव नहीं मिला। समय, क्षमता और उपलब्ध मदद फिर देखें।',
   availability:'सिर्फ वही मदद गिनी जाती है जिसकी पुष्टि है। शायद मिलने वाली मदद नहीं गिनी जाती।',
   actions:'पक्की मदद के आधार पर संभव बदलाव',pkg:'संभव बदलाव',pkgStatus:'बदलाव के बाद',remaining:'मूल काम में अभी बाकी',
   add:'पक्की अतिरिक्त मदद से {n} {u} कपास और संभाल सकते हैं।',
   reduce:'अभी {n} {u} कपास कम संभालेंगे। वह काम आगे बाकी रहेगा।',
   pkgExplain:'यह प्लान तभी संभव है जब बताई गई मदद सच में मिले।',
   noPackages:'दी गई मदद से अभी कोई पूरा बदलाव नहीं मिला।',
   choose:'यह बदलाव चुनें',selected:'यह बदलाव चुना गया है',view:'मेरा अगला प्लान देखें',again:'प्लान दोबारा जाँचें',
   disclosure:'मौसम अनुमान या आपके जवाब कपास की सुरक्षा की गारंटी नहीं हैं। मदद अपने आप नहीं मिलेगी।',
   demo:'यह सीखने वाला उदाहरण है। जानकारी उदाहरण की है; नतीजा असली FastAPI सर्वर से आता है।',
   note:'आपके बताए वजन को किलो में बदलकर हिसाब होता है। ऐप काम की रफ्तार या सुरक्षा खुद तय नहीं करता।',
   nextAction:'आगे: संभव बदलाव देखें',readyDone:'काम शुरू करने से पहले जवाब और मौसम का अनुमान फिर देखें.'
 }
};
const t=k=>(copy[lang()]||copy.en)[k]||copy.en[k]||k;
const isFarmer=()=>document.body.dataset.experience==='farmer';
const fmt=n=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const fill=(template,obj)=>template.replace(/\{(\w+)\}/g,(_,key)=>String(obj[key]??'—'));
const storeKey='agri-cotton-weight-v2';
const read=()=>{try{const obj=JSON.parse(localStorage.getItem(storeKey)||'null');return obj&&['kg','quintal'].includes(obj.unit)?obj:null;}catch{return null;}};
let meta=read()||{unit:'quintal',targetKg:null,capacityKg:null};
let restoring=false,internal=false,demo=false,previous=null;
const factor=()=>meta.unit==='quintal'?100:1;
const toDisplay=kg=>Number.isFinite(kg)?fmt(Number((kg/factor()).toFixed(5))).replace(/,/g,''):'';
const quantityUnit=()=>meta.unit==='quintal'?(lang()==='en'?'quintals':t('q').split(' ')[0]):(lang()==='en'?'kg':t('kg').split(' ')[0]);
const safeValue=v=>typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1e9;
const toKg=v=>{const n=Number(v)*factor();return Number.isFinite(n)&&n<=1e11?Number(n.toFixed(6)):null;};
const persistMeta=()=>{try{localStorage.setItem(storeKey,JSON.stringify(meta));}catch{}};
function emit(id,value){
 const field=$(id);field.value=value;
 internal=true;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));internal=false;
}
function validMeta(){
 if(!Number.isFinite(meta.targetKg)||meta.targetKg<=0||!Number.isFinite(meta.capacityKg)||meta.capacityKg<0)return false;
 const a=Number($('quantity')?.value),b=Number($('capacity')?.value);
 return $('quantity').value!==''&&$('capacity').value!==''&&Math.abs(a-meta.targetKg)<1e-5&&Math.abs(b-meta.capacityKg)<1e-5;
}
function oldOptions(){
 return additional.changes.filter(c=>c.id!=='cotton-extra-help'&&
   !(c.id==='starter-option'&&String(c.amount||'').trim()===''&&String(c.rid||'').trim()===''));
}
function snapshot(){try{return window.agriFarmerSnapshot?.()||null;}catch{return null;}}
const home=document.querySelector('section.section[data-page="0"] .hero .content');
const purpose=make('p','fv2-purpose');purpose.id='farmerPurpose';
const crop=make('p','fv2-crop');crop.id='farmerCrop';
const nameOnHome=make('h2','fv2-home-name','AgriForesight');
home?.prepend(nameOnHome);
nameOnHome.insertAdjacentElement('afterend',purpose);
purpose.insertAdjacentElement('afterend',crop);
const panel=document.querySelector('section.section[data-page="2"] .resource-layout > .panel');
const form=make('div','fv2-weight-form');form.id='farmerWeightForm';
const unitLabel=make('label','field'),unitTitle=make('span'),unitSelect=make('select');
unitSelect.id='farmerWeightUnit';
for(const unit of ['kg','quintal']){const o=make('option');o.value=unit;unitSelect.append(o);}
unitLabel.append(unitTitle,unitSelect);
const unitHelp=make('small','fv2-unit-help');
const inputs=make('div','fv2-weight-grid');
const targetLabel=make('label','field'),targetTitle=make('span'),targetInput=make('input'),
      capacityLabel=make('label','field'),capacityTitle=make('span'),capacityInput=make('input');
targetInput.id='farmerTargetWeight';capacityInput.id='farmerCapacityWeight';
for(const x of [targetInput,capacityInput]){x.type='number';x.min='0';x.step='any';x.inputMode='decimal';}
const targetHint=make('small'),capacityHint=make('small');
targetLabel.append(targetTitle,targetInput,targetHint);
capacityLabel.append(capacityTitle,capacityInput,capacityHint);
inputs.append(targetLabel,capacityLabel);
form.append(unitLabel,unitHelp,inputs);
panel.querySelector('.form-grid').insertAdjacentElement('beforebegin',form);
// Optional extra help is only brought into the decision when the farmer confirms it.
const extra=make('section','fv2-extra'),extraTitle=make('h3'),extraInfo=make('p'),
      extraLabel=make('label','field'),extraSelect=make('select'),amountLabel=make('label','field'),
      amountTitle=make('span'),amountInput=make('input'),nameLabel=make('label','field'),
      nameTitle=make('span'),nameInput=make('input'),extraHint=make('small'),legacy=make('p','fv2-legacy');
extra.id='farmerExtraHelp';extraSelect.id='farmerExtraStatus';amountInput.id='farmerExtraAmount';nameInput.id='farmerExtraName';
extraSelect.append(...['none','requested','confirmed'].map(value=>{const x=make('option');x.value=value;return x;}));
extraSelect.value='none';amountInput.type='number';amountInput.min='0';amountInput.step='any';
extraLabel.append(extraSelect);amountLabel.append(amountTitle,amountInput);nameLabel.append(nameTitle,nameInput);
extra.append(extraTitle,extraInfo,extraLabel,amountLabel,nameLabel,extraHint,legacy);
panel.querySelector('.declaration').insertAdjacentElement('beforebegin',extra);
const controls=make('div','fv2-controls'),check=make('button','btn primary'),example=make('button','btn'),restore=make('button','btn'),notice=make('p','fv2-notice');
check.id='farmerSaveAndCheck';example.id='farmerExample';restore.id='farmerRestore';
for(const b of [check,example,restore])b.type='button';
notice.id='farmerV2Notice';notice.setAttribute('role','status');
controls.append(check,example,restore,notice);panel.append(controls);
const checkPage=document.querySelector('section.section[data-page="3"]');
const actionPage=document.querySelector('section.section[data-page="4"]');
const decision=make('section','panel fv2-decision'),action=make('section','panel fv2-decision');
decision.id='farmerDecisionV2';action.id='farmerActionV2';
checkPage.querySelector('.page-head').insertAdjacentElement('afterend',decision);
actionPage.querySelector('.page-head').insertAdjacentElement('afterend',action);
const option=(id)=>additional.changes.find(c=>c.id===id);
let waitingForDemo=false,viewedDemo=false;
function syncWeight(which){
 const id=which==='target'?'quantity':'capacity',field=which==='target'?targetInput:capacityInput;
 if(!safeValue(field.value)){
   meta[which==='target'?'targetKg':'capacityKg']=null;emit(id,'');persistMeta();return;
 }
 const normalized=toKg(field.value);
 meta[which==='target'?'targetKg':'capacityKg']=normalized;
 emit(id,normalized===null?'':String(normalized));
 persistMeta();
}
function setUnit(v){
 if(!['kg','quintal'].includes(v))return;
 // Switch the visual unit without changing the normalized kilograms used by FastAPI.
 const oldFactor=factor();
 const extraKg=safeValue(amountInput.value)?Number(amountInput.value)*oldFactor:null;
 meta.unit=v;unitSelect.value=v;
 targetInput.value=toDisplay(meta.targetKg);capacityInput.value=toDisplay(meta.capacityKg);
 if(extraKg!==null)amountInput.value=String(Number((extraKg/factor()).toFixed(5)));
 persistMeta();paintWords();
}
function syncExtra(){
 additional.changes=additional.changes.filter(c=>c.id!=='cotton-extra-help');
 const status=extraSelect.value;
 if(status!=='none'){
   if(!safeValue(amountInput.value)||Number(amountInput.value)<=0)return false;
   const amount=toKg(amountInput.value);
   if(amount===null||amount<=0)return false;
   const requested=status==='requested';
   additional.changes.push({
     id:'cotton-extra-help',type:'add_capacity',amount:String(amount),
     rid:String(nameInput.value||'Extra helper').trim().slice(0,55)||'Extra helper',
     availability:requested?'requested':'confirmed'
   });
 }
 // Re-render old adapter editor from the documented additional.changes data.
 $('changeEditor').replaceChildren();noteChange();
 return true;
}
function validateFarmer(){
 if(!validMeta())return t('missingUnit');
 if(!safeValue($('duration').value)||Number($('duration').value)<=0)return t('missing');
 if(!['yes','no','unknown'].includes($('readiness').value))return t('missing');
 if(!$('confirmInputs').checked)return t('missingCheck');
 if(!$('deadlineInput').value||state.deadline!==$('deadlineInput').value)return t('missingDeadline');
 if(oldOptions().length>0)return t('legacy');
 if(extraSelect.value!=='none'&&(!safeValue(amountInput.value)||Number(amountInput.value)<=0))return t('missing');
 return null;
}
function runPlan(){
 const problem=validateFarmer();
 if(problem){notice.textContent=problem;notice.scrollIntoView({behavior:'smooth',block:'center'});return false;}
 if(!syncExtra()){notice.textContent=t('missing');return false;}
 notice.textContent=demo?t('demo'):t('checking');
 $('saveResources').click();
 goto(3);
 $('runAssessment').click();
 return true;
}
const statusKey={feasible:'ready',blocked:'blocked',unknown:'unknown',completed:'completed'};
function displayKg(n){return Number.isFinite(n)?fmt(n/factor())+' '+quantityUnit():'—';}
function explain(r,s){
 const baseline=r?.baseline,req=s?.request;
 const lines=[];
 const constraints=baseline?.constraints||[];
 const failed=id=>constraints.find(c=>c.id===id)?.status;
 if(req&&typeof baseline?.shortfall_units==='number'&&baseline.shortfall_units>0&&
    Number.isFinite(req.target_units)&&Number.isFinite(req.capacity_units)){
   lines.push(fill(t('gap'),{a:fmt(req.target_units/factor()),b:fmt(req.capacity_units/factor()),g:fmt(baseline.shortfall_units/factor()),u:quantityUnit()}));
 }
 if(failed('timing')==='blocked'){
   const available=baseline.time_budget?.available_hours;
   if(typeof available==='number')lines.push(fill(t('time'),{h:fmt(req.required_hours),a:fmt(Math.max(0,available))}));
 }
 if(failed('readiness')==='blocked')lines.push(t('readyNo'));
 if(failed('readiness')==='unknown')lines.push(t('readyUnknown'));
 if(r.status==='feasible'&&!lines.length)lines.push(t('good'));
 if(!lines.length)lines.push(t('noMore'));
 return lines;
}
function conclusion(){
 const s=snapshot(),r=s?.evaluation;
 decision.replaceChildren();action.replaceChildren();
 decision.append(make('h2','',t('resultTitle')));
 action.append(make('h2','',t('actions')));
 const rstatus=make('h3','fv2-status');
 rstatus.textContent=s?.busy?t('checking'):r?t(statusKey[r.status]||'unknown'):s?.error?t('failed'):t('waiting');
 decision.append(rstatus);
 if(!r){
   decision.append(make('p','',s?.error?t('failed'):t('waiting')));
   const b=make('button','btn primary',t('again'));b.type='button';b.addEventListener('click',runPlan);decision.append(b);
   action.append(make('p','',t('waitingAction')));
   return;
 }
 decision.append(make('h3','',t('why')));
 for(const sentence of explain(r,s))decision.append(make('p','fv2-result-line',sentence));
 decision.append(make('h3','',t('next')));
 decision.append(make('p','',r.status==='feasible'?t('readyDone'):r.packages?.length?t('availability'):t('noMore')));
 const go=make('button','btn primary',t('view'));go.type='button';go.addEventListener('click',()=>goto(4));decision.append(go);
 decision.append(make('p','fv2-disclosure',t('disclosure')));
 const packs=r.packages||[];
 if(!packs.length)action.append(make('p','',t('noPackages')));
 for(const [i,p] of packs.entries()){
   const box=make('div','fv2-package');
   box.append(make('h3','',t('pkg')+' '+(i+1)));
   for(const id of p.change_ids){
     const ch=s.request?.changes?.find(v=>v.id===id);
     if(!ch)continue;
     const number=Number(ch.value);
     const key=ch.type==='reduce_target'?'reduce':'add';
     if(Number.isFinite(number))box.append(make('p','',fill(t(key),{n:fmt(number/factor()),u:quantityUnit()})));
   }
   box.append(make('p','',t('pkgStatus')+': '+t(statusKey[p.projected.status]||'unknown')));
   if(typeof p.projected?.original_target_unhandled_units==='number')
      box.append(make('p','',t('remaining')+': '+displayKg(p.projected.original_target_unhandled_units)));
   box.append(make('small','fv2-disclosure',t('pkgExplain')));
   const button=make('button','btn'+(s.selectedPackage===i?' primary':''),t(s.selectedPackage===i?'selected':'choose'));
   button.type='button';button.setAttribute('aria-pressed',String(s.selectedPackage===i));
   button.addEventListener('click',()=>{
     $('packageList')?.querySelectorAll('.package-card')?.[i]?.click();
     queueMicrotask(conclusion);
   });
   box.append(button);action.append(box);
 }
 action.append(make('p','fv2-disclosure',t('disclosure')));
 const change=make('button','btn',t('edit'));change.type='button';change.addEventListener('click',()=>goto(2));action.append(change);
 if(demo){
   decision.append(make('p','fv2-demo',t('demo')));
   action.append(make('p','fv2-demo',t('demo')));
 }
 if(waitingForDemo&&r&&!viewedDemo){
   viewedDemo=true;waitingForDemo=false;
   queueMicrotask(()=>goto(4));
 }
}
function paintWords(){
 purpose.textContent=t('purpose');crop.textContent=t('crop');
 unitTitle.textContent=t('unit');
 unitSelect.querySelector('[value="kg"]').textContent=t('kg');
 unitSelect.querySelector('[value="quintal"]').textContent=t('q');
 unitHelp.textContent=t('unitHelp');
 targetTitle.textContent=t('target');capacityTitle.textContent=t('cap');
 targetHint.textContent=t('targetHint');capacityHint.textContent=t('capHint');
 extraTitle.textContent=t('extraTitle');extraInfo.textContent=t('extraInfo');
 extraSelect.setAttribute('aria-label',t('extraTitle'));
 for(const v of ['none','requested','confirmed'])extraSelect.querySelector('[value="'+v+'"]').textContent=t(v);
 const showExtra=extraSelect.value!=='none';
 amountLabel.hidden=!showExtra;nameLabel.hidden=!showExtra;extraHint.hidden=!showExtra;
 amountTitle.textContent=t('extraAmount');nameTitle.textContent=t('extraHelp');extraHint.textContent=t('extraHint');
 legacy.textContent=oldOptions().length?t('legacy'):'';
 check.textContent=t('check');example.textContent=t('example');
 restore.textContent=t('restore');restore.hidden=!previous;
 if(demo)notice.textContent=t('clear');
 conclusion();
}
function clearExampleByHuman(){
 if(!demo)return;
 demo=false;waitingForDemo=false;viewedDemo=false;
 notice.textContent='';
}
function loadExample(){
 if(!window.confirm(t('exampleConfirm')))return;
 previous={
   mass:{...meta},unit:unitSelect.value,weight1:targetInput.value,weight2:capacityInput.value,
   rawQuantity:$('quantity').value,rawCapacity:$('capacity').value,hours:$('duration').value,
   readiness:$('readiness').value,confirmed:$('confirmInputs').checked,
   deadline:$('deadlineInput').value,savedDeadline:state.deadline,
   resources:state.resources?{...state.resources}:null,place:{...state.place},
   changes:JSON.parse(JSON.stringify(additional.changes)),extraStatus:extraSelect.value,
   extraAmount:amountInput.value,extraName:nameInput.value
 };
 demo=true;viewedDemo=false;waitingForDemo=true;
 meta={unit:'quintal',targetKg:1000,capacityKg:600};
 unitSelect.value='quintal';targetInput.value='10';capacityInput.value='6';persistMeta();
 emit('quantity','1000');emit('capacity','600');emit('duration','4');
 $('readiness').value='yes';$('readiness').dispatchEvent(new Event('change',{bubbles:true}));
 $('confirmInputs').checked=true;$('confirmInputs').dispatchEvent(new Event('change',{bubbles:true}));
 state.place={city:'Jalna',state:'Maharashtra'};persist();updateSummaries();
 // Local Indian clock, not the browser's timezone or a weather-safety threshold.
 const when=new Date(Date.now()+6*3600000);
 const fmtPart=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(when);
 const date={};fmtPart.forEach(p=>{date[p.type]=p.value;});
 const iso=[date.year,date.month,date.day].join('-')+'T'+date.hour+':'+date.minute;
 $('deadlineInput').value=iso;$('deadlineInput').dispatchEvent(new Event('input',{bubbles:true}));
 $('deadlineInput').dispatchEvent(new Event('change',{bubbles:true}));
 $('saveDeadline').disabled=false;$('saveDeadline').click();
 additional.changes=[{id:'cotton-extra-help',type:'add_capacity',amount:'400',rid:'example-extra-help',availability:'confirmed'}];
 extraSelect.value='confirmed';amountInput.value='4';nameInput.value='example-extra-help';
 $('changeEditor').replaceChildren();noteChange();
 notice.textContent=t('exampleCaption');
 paintWords();runPlan();
}
function restoreExample(){
 if(!previous)return;
 restoring=true;const old=previous;previous=null;demo=false;waitingForDemo=false;viewedDemo=false;
 meta={...old.mass};unitSelect.value=old.unit;targetInput.value=old.weight1;capacityInput.value=old.weight2;
 emit('quantity',old.rawQuantity);emit('capacity',old.rawCapacity);emit('duration',old.hours);
 $('readiness').value=old.readiness;$('readiness').dispatchEvent(new Event('change',{bubbles:true}));
 $('confirmInputs').checked=old.confirmed;
 $('deadlineInput').value=old.deadline;state.deadline=old.savedDeadline;
 state.resources=old.resources;state.place=old.place;persist();updateSummaries();
 additional.changes=old.changes;extraSelect.value=old.extraStatus;amountInput.value=old.extraAmount;nameInput.value=old.extraName;
 $('changeEditor').replaceChildren();noteChange();persistMeta();
 restoring=false;notice.textContent='';paintWords();goto(2);
}
unitSelect.addEventListener('change',()=>{setUnit(unitSelect.value);clearExampleByHuman();});
for(const [which,field] of [['target',targetInput],['capacity',capacityInput]]){
 field.addEventListener('input',()=>{syncWeight(which);clearExampleByHuman();conclusion();});
}
for(const id of ['quantity','capacity']){
 $(id).addEventListener('input',()=>{
   if(internal)return;
   // Detailed View edits invalidate previously asserted physical units.
   if(isFarmer())return;
   meta={unit:unitSelect.value,targetKg:null,capacityKg:null};
   targetInput.value='';capacityInput.value='';persistMeta();
 });
}
for(const node of [extraSelect,amountInput,nameInput]){
 node.addEventListener('input',()=>{clearExampleByHuman();paintWords();});
 node.addEventListener('change',()=>{clearExampleByHuman();paintWords();});
}
check.addEventListener('click',()=>{clearExampleByHuman();runPlan();});
example.addEventListener('click',loadExample);restore.addEventListener('click',restoreExample);
$('language')?.addEventListener('change',()=>queueMicrotask(paintWords));
new MutationObserver(paintWords).observe(document.body,{attributes:true,attributeFilter:['data-experience']});
for(const id of ['resultTitle','packageCount','summaryOutcome']){
 const node=$(id);
 if(node)new MutationObserver(conclusion).observe(node,{childList:true,characterData:true,subtree:true});
}
document.addEventListener('agri:farmer-update',conclusion);
const saved=read();
if(saved&&Number.isFinite(saved.targetKg)&&Number.isFinite(saved.capacityKg)&&
 $('quantity').value!==''&&$('capacity').value!==''&&
 Math.abs(Number($('quantity').value)-saved.targetKg)<1e-5&&Math.abs(Number($('capacity').value)-saved.capacityKg)<1e-5){
 targetInput.value=toDisplay(saved.targetKg);capacityInput.value=toDisplay(saved.capacityKg);
}else{
 meta={unit:saved?.unit||'quintal',targetKg:null,capacityKg:null};
 targetInput.value='';capacityInput.value='';
}
unitSelect.value=meta.unit;
const priorExtra=option('cotton-extra-help');
if(priorExtra){extraSelect.value=priorExtra.availability==='confirmed'?'confirmed':'requested';amountInput.value=toDisplay(Number(priorExtra.amount));nameInput.value=priorExtra.rid||'';}
paintWords();
})();
