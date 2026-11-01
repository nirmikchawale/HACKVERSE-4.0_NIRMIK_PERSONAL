/** Public live test: no API mocks, no farmer account data, no credentials. */
import {chromium} from '@playwright/test';

const origin=(process.env.EDGE_URL||'').replace(/\/$/,'');
const expected=process.env.EXPECTED_SHA||'';
if(!/^https:\/\/[-a-z0-9.]+\.workers\.dev$/.test(origin)||
  !/^[a-f0-9]{40}$/.test(expected)){
  throw Error('Only an explicit Workers HTTPS origin and exact 40-char SHA may be certified.');
}
const assert=(condition,message)=>{if(!condition)throw Error('PUBLIC_BROWSER_FAIL: '+message);};
const browser=await chromium.launch({headless:true});
const errors=[];
try{
  const desktop=await browser.newContext({viewport:{width:1365,height:850}});
  const page=await desktop.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  let response=await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:40000});
  assert(response?.status()===200,'Homepage must return HTTP 200');
  assert((await page.title()).includes('Agri Foresight'),'Application name not loaded');
  assert(await page.locator('section.section').count()===6,'Exactly six pages must share one root');

  const release=await page.request.get(origin+'/_release.json',{timeout:20000});
  assert(release.status()===200,'Missing public exact-source release receipt');
  const receipt=await release.json();
  assert(receipt.git_commit_sha===expected,'Published commit differs from source under certification');
  const js=await page.request.get(origin+'/connected.js',{timeout:20000});
  assert(js.status()===200,'Current connected UI module unavailable');
  const source=await js.text();
  const features={
    F01:'forecastWindowSummary',F05:'historicalModelComparison',F09:'downloadGovernmentCSV',
    F11:'nasaHistoryChart',F12:'evidenceSourceMatrix',F13:'sourceActivityReceipt',
    F17:'decisionDiagnosticNotes',F19:'attestedDeadlineRows',F23:'printEvidenceReceipt',
    F27:'networkEvidenceStatus',manualCompare:'manualDeadlineRows'
  };
  for(const [name,key] of Object.entries(features)){
    assert(source.includes(key),'Main UI build is missing '+name+' / '+key);
  }
  const cssFiles=['/model-evidence.css','/forecast-windows.css',
    '/source-intelligence.css','/source-print.css','/ex18-climate.css'];
  for(const path of cssFiles){
    const result=await page.request.get(origin+path,{timeout:15000});
    assert(result.status()===200,'Missing current theme/feature stylesheet '+path);
    assert((await result.text()).length>100,'Empty CSS asset '+path);
  }

  // Guard core planning controls as well as the newer evidence modules. This
  // frontend-path change also causes the mandatory real-backend gate to run.
  const selectors=['#apiConnectionStatus','#sourceLedger','#deadlineInput',
    '#quantity','#readiness','#packageList','#summaryAssessment','#assistantLaunch',
    '#evidenceSourceMatrix','#sourceActivityReceipt',
    '#historicalModelComparison','#nasaHistoryChart','#networkEvidenceStatus',
    '#decisionDiagnostics','#printEvidenceReceipt','#downloadGovernmentCSV'];
  for(const key of selectors){
    await page.locator(key).waitFor({state:'attached',timeout:20000});
  }
  for(let index=0;index<6;index++){
    await page.locator('#navDesktop [data-nav="'+index+'"]').click();
    await page.locator('section.section.active').waitFor({state:'visible'});
    assert(await page.locator('section.section.active').getAttribute('data-page')===String(index),
      'Desktop navigation did not activate page '+index);
  }
  await page.locator('#language').selectOption('mr');
  assert(await page.locator('html').getAttribute('lang')==='mr','Marathi UI did not activate');
  await page.locator('#language').selectOption('hi');
  assert(await page.locator('html').getAttribute('lang')==='hi','Hindi UI did not activate');
  await page.locator('#language').selectOption('en');
  assert(await page.locator('html').getAttribute('lang')==='en','English UI did not restore');
  await page.emulateMedia({media:'print'});
  const print=page.locator('#printEvidenceReceipt');
  assert(await print.evaluate(e=>getComputedStyle(e).display)!=='none',
    'Print-only evidence receipt cannot be printed');
  await page.emulateMedia({media:'screen'});

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const phone=await mobile.newPage();
  phone.on('pageerror',error=>errors.push(error.message));
  response=await phone.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:40000});
  assert(response?.status()===200,'Mobile homepage did not load');
  for(const index of [1,3,5]){
    await phone.locator('#navMobile [data-nav="'+index+'"]').click();
    assert(await phone.locator('section.section.active').getAttribute('data-page')===String(index),
      'Mobile page '+index+' did not activate');
  }
  assert(errors.length===0,'JavaScript errors: '+errors.slice(0,3).join('; '));
  console.log(JSON.stringify({
    result:'PUBLIC_BROWSER_PASS',url:origin,commit:expected,
    sourceMarkers:Object.keys(features),sixPages:true,desktop:true,mobile:true,
    languages:['en','mr','hi'],print:true,realBackendSeparateSmoke:true
  }));
  await mobile.close();await desktop.close();
}finally{
  await browser.close();
}
