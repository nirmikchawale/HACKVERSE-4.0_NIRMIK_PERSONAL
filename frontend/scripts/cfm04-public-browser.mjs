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
    '/source-intelligence.css','/source-print.css','/ex18-climate.css',
    '/agri-typography.css','/agri-sidebar.css','/source-workbench.css'];
  for(const path of cssFiles){
    const result=await page.request.get(origin+path,{timeout:15000});
    assert(result.status()===200,'Missing current theme/feature stylesheet '+path);
    assert((await result.text()).length>100,'Empty CSS asset '+path);
  }

  // JALNA-DATA-01: inspect the actual deployed agricultural-context API and UI.
  const jalnaResponse=await page.request.get(origin+'/api/jalna-agri-context',{timeout:24000});
  assert(jalnaResponse.status()===200,'Jalna agricultural data endpoint must respond');
  const jalna=await jalnaResponse.json();
  assert(jalna.soil?.reference_year===2011 &&
    jalna.soil?.classes?.length===3 &&
    jalna.soil?.soil_type_for_individual_field===null,
    'Historical district soil cannot be substituted for a farmer plot soil test');
  assert(['retrieved_live','cached_recent','unavailable'].includes(jalna.conditions?.status),
    'Model status must be explicit');
  if(jalna.conditions.status==='unavailable')
    assert(jalna.conditions.model===null,'Unavailable source must not manufacture model readings');
  assert(jalna.decision_integration==='context_only_not_used_by_feasibility_engine',
    'Regional context must remain independent from resource feasibility');
  const jalnaAsset=await page.request.get(origin+'/jalna-context.js',{timeout:20000});
  assert(jalnaAsset.status()===200,'Farmer Jalna context client asset missing');

  // FE-01: the clean public app now opens a farmer-focused navigation.
  // Certify that default before switching to the original Detailed workspace
  // for the unchanged grouped-sidebar, evidence, methodology and print checks.
  assert(await page.locator('body').getAttribute('data-experience')==='farmer',
    'Farmer View must be the public default for a clean visitor');
  const farmerNav=page.locator('#navDesktop [data-nav]');
  assert(await farmerNav.count()===6,'Farmer View must expose six real routes');
  const farmerLabels=await farmerNav.allTextContents();
  assert(farmerLabels.some(x=>x.includes('Check Weather'))&&
         farmerLabels.some(x=>x.includes('My Farm Details'))&&
         farmerLabels.some(x=>x.includes('Help')),
    'Farmer View lost weather, farm details or help navigation');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#jalnaContext .jalna-soil-type').first()
    .waitFor({state:'visible',timeout:25000});
  assert((await page.locator('#jalnaContext').textContent()).includes('Jalna'),
    'Farmer Check Weather must display sourced Jalna context');
  await page.locator('#navDesktop [data-nav="0"]').click();
  await page.locator('#experienceSwitch button').filter({hasText:'Detailed View'}).click();
  assert(await page.locator('body').getAttribute('data-experience')==='detailed',
    'Farmer to Detailed switch did not restore the original workspace');
  // The subsequent legacy assertions intentionally inspect Detailed View.
  // Post-font production certificate: verifies approved typography and
  // grouped navigation on the actual clean workers.dev address, not a PR build.
  await page.waitForFunction(() => {
    const rail=document.querySelector('.app>.rail');
    const base=getComputedStyle(document.documentElement);
    return rail && base.getPropertyValue('--af-font').includes('Inter') &&
      getComputedStyle(rail).position==='sticky';
  },null,{timeout:20000});
  const visual=await page.evaluate(() => ({
    font:getComputedStyle(document.body).fontFamily,
    rootSize:parseFloat(getComputedStyle(document.documentElement).fontSize),
    navGroups:document.querySelectorAll('#navDesktop .nav-group-label').length,
    search:!!document.querySelector('#railSearch'),
    interCss:!!document.querySelector('link[href="https://rsms.me/inter/inter.css"]'),
    styleLinks:['/agri-typography.css','/agri-sidebar.css']
      .every(href=>document.querySelectorAll('link[href="'+href+'"]').length===1)
  }));
  assert(visual.font.includes('Inter')&&visual.font.includes('-apple-system'),
    'The approved Inter/Apple font stack is not applied on public production');
  assert(visual.rootSize===16&&visual.navGroups===4&&visual.search&&visual.interCss&&visual.styleLinks,
    'The post-font grouped sidebar and loaded typography links are incomplete');
  await page.keyboard.press('Control+k');
  assert(await page.locator('#railSearch').evaluate(el=>document.activeElement===el),
    'Ctrl+K did not focus actual sidebar search');
  await page.locator('#railSearch').fill('feasibility');
  assert(await page.locator('#navDesktop button[data-nav]:visible').count()===1,
    'Grouped sidebar search does not filter six real routes');
  await page.locator('#railSearch').press('Escape');
  assert(await page.locator('#navDesktop button[data-nav]:visible').count()===6,
    'Esc must restore all workspace routes');

  // CF-OVERVIEW-02: only genuine weather/history receipts belong on Home.
  const cards=page.locator('#evidenceSourceGrid .source-matrix-card');
  await cards.first().waitFor({state:'attached',timeout:25000});
  assert(await cards.count()===3,'Overview must present engine, model and NASA only');
  assert(await page.locator('#evidenceSourceGrid [data-source-id="imd"]').count()===0,'Disconnected IMD tile returned to Overview');
  assert(await page.locator('#evidenceSourceGrid [data-source-id="farm"]').count()===0,'Unverified assessment tile returned to Overview');
  const receipts=page.locator('#sourceActivityRows .source-activity-item');
  assert(await receipts.count()===2,'Only weather and historical source receipts may appear on Overview');
  assert(await page.locator('#sourceActivityRows [data-source="model"]').count()===1,'Forecast receipt missing');
  assert(await page.locator('#sourceActivityRows [data-source="nasa"]').count()===1,'NASA historical receipt missing');
  assert(!(await page.locator('#sourceActivityReceipt').textContent()).includes('No verified server assessment'),
    'Old unfinished server assessment text returned to homepage');
  assert(!(await page.locator('#sourceActivityReceipt').textContent()).includes('IMD official warnings'),
    'Old disconnected official warning text returned to homepage');
  // Check all three filters against one synchronous snapshot. Genuine
  // Open-Meteo and NASA responses may complete between Playwright round trips.
  const partition=await page.evaluate(()=>{
    const grid=document.querySelector('#evidenceSourceGrid');
    const button=key=>document.querySelector('[data-filter="'+key+'"]');
    const visible=()=>[...grid.querySelectorAll('.source-matrix-card')]
      .filter(node=>!node.hidden&&getComputedStyle(node).display!=='none').length;
    const sample=key=>{
      const control=button(key);control.click();
      return {count:visible(),pressed:control.getAttribute('aria-pressed')==='true'};
    };
    return {available:sample('available'),attention:sample('attention'),all:sample('all')};
  });
  assert(partition.available.pressed&&partition.attention.pressed&&partition.all.pressed,
    'Source filter controls do not update selected states: '+JSON.stringify(partition));
  assert(partition.available.count+partition.attention.count===3&&partition.all.count===3,
    'Source filters do not partition one consistent source snapshot: '+JSON.stringify(partition));
  const receiptBoxes=await receipts.evaluateAll(nodes=>nodes.map(node=>({
    left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right,
    y:node.getBoundingClientRect().y,height:node.getBoundingClientRect().height})));
  assert(receiptBoxes.length===2&&Math.abs(receiptBoxes[0].y-receiptBoxes[1].y)<=2,
    'Two expanded evidence receipts must align on desktop');
  // CF-COPY-01: certified public UI must not regress to lengthy static cards.
  assert(await page.locator('section[data-page="0"] [data-i18n="pathBody"]').count()===0,
    'Redundant Overview pathway theory has returned');
  assert(await page.locator('section[data-page="1"] .feature-stripe').count()===0 &&
         await page.locator('section[data-page="1"] .insight-row').count()===0,
    'Passive Weather theory blocks have returned');
  const methodology=page.locator('section[data-page="2"] .resource-method-disclosure');
  assert(await methodology.count()===1&&
    !await methodology.evaluate(e=>e.open),
    'Resource arithmetic must be available but collapsed by default');
  // The disclosure belongs to Page 03; clicking it while Overview is active
  // erroneously times out even though the public app is functioning correctly.
  await page.locator('#navDesktop [data-nav="2"]').click();
  await methodology.locator('summary').waitFor({state:'visible',timeout:12000});
  await methodology.locator('summary').click();
  assert(await methodology.evaluate(e=>e.open),
    'Resource calculation disclosure must work');
  await methodology.locator('summary').click();
  await page.locator('#navDesktop [data-nav="0"]').click();

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
  // WXR-03: public exact-SHA behavioral certificate for the actual Weather page.
  // Source values may be genuinely unavailable; never use test fixtures here.
  const weatherCSS=await page.request.get(origin+'/weather-workspace.css',{timeout:15000});
  assert(weatherCSS.status()===200&&(await weatherCSS.text()).includes('qc-hour-grid'),
    'WXR-03 coverage visualization stylesheet is missing from public Cloudflare');
  assert(source.includes('qcHourGrid')&&source.includes('qcExceptions')&&source.includes('qc-receipt'),
    'Public connected.js does not contain the certified weather workbench');
  await page.locator('#navDesktop [data-nav="1"]').click();
  const weatherPage=page.locator('section.section[data-page="1"]');
  await weatherPage.waitFor({state:'visible',timeout:20000});
  // WXR-04: certify the actual clean Cloudflare production layout and one
  // working navigation control; this is not a mocked forecast or sample farm.
  const wcompact=await page.request.get(origin+'/weather-panel-compact.css',{timeout:15000});
  assert(wcompact.status()===200 && (await wcompact.text()).includes('#deadlineGuideContinue'),
    'WXR-04 compact weather layout stylesheet is missing on production');
  assert(await weatherPage.locator('.source-strip').count()===0,
    'Redundant forecast source/retrieval/timezone strip has returned');
  assert(await weatherPage.locator('.deadline-card .micro-divider').count()===0 &&
    await weatherPage.locator('.deadline-card [data-i18n="weatherCaution"]').count()===0,
    'Redundant deadline footer warning remains');
  await weatherPage.locator('#deadlineGuideContinue').waitFor({state:'visible',timeout:12000});
  assert(await weatherPage.locator('.deadline-card .goto[data-target="2"]').count()===1 &&
    await weatherPage.locator('.deadline-card #deadlineGuideContinue').count()===1,
    'Weather planning must have exactly one original working Resources action');
  assert(await weatherPage.locator('#deadlineGuideContinue').isEnabled(),
    'Existing Resources navigation must not be disabled without a saved deadline');
  const wgeometry=await weatherPage.evaluate(el=>{
    const a=el.querySelector('.forecast-panel').getBoundingClientRect();
    const b=el.querySelector('.deadline-card').getBoundingClientRect();
    return {top:Math.abs(a.top-b.top),bottom:Math.abs(a.bottom-b.bottom)};
  });
  assert(wgeometry.top<3 && wgeometry.bottom<3,
    'Weather Model Evidence and Planning Window are not vertically aligned');
  await weatherPage.locator('#deadlineGuideContinue').click();
  assert(await page.locator('section.section.active').getAttribute('data-page')==='2',
    'The real Continue to resources action does not navigate to Farm resources');
  await page.locator('#navDesktop [data-nav="1"]').click();
  assert(await weatherPage.isVisible(),'Weather page did not restore after resources navigation');
  assert(await weatherPage.locator('.insight-row').count()===0,
    'The three passive Weather summary cards are still present');
  await page.locator('#forecastQualityInspector').waitFor({state:'attached',timeout:20000});
  await page.waitForFunction(()=>{
    const metrics=document.querySelectorAll('#forecastQualityMetrics button.source-qc-item');
    const empty=document.querySelector('#forecastQualityMetrics .source-qc-empty');
    const status=document.querySelector('#apiConnectionStatus')?.textContent||'';
    const button=document.querySelector('#toggleForecast');
    const chip=document.querySelector('#forecastSourceChip')?.textContent||'';
    return status.startsWith('FastAPI connected') && button && !button.disabled &&
      chip!=='FETCHING' && (metrics.length===8||Boolean(empty));
  },null,{timeout:30000});
  let certifiedQualityMode='unavailable';
  const publicMetrics=page.locator('#forecastQualityMetrics button.source-qc-item');
  if(await publicMetrics.count()===8){
    certifiedQualityMode='source-current';
    await page.locator('[data-quality="reported"]').click();
    assert(await page.locator('[data-quality="reported"]').getAttribute('aria-expanded')==='true',
      'The data-quality metric did not open its evidence inspection');
    const modelHours=page.locator('#qcHourGrid button.qc-hour-chip');
    assert(await modelHours.count()>0,'No selectable real model-hour completeness cells');
    await modelHours.first().click();
    assert((await page.locator('#qcHourDetail').textContent()).includes('IST'),
      'Model-hour selection does not show its exact authenticated time');
    await page.locator('[data-qc-view="issues"]').click();
    await page.locator('#qcIssueFilter').selectOption('gap');
    assert((await page.locator('#qcWorkbenchContent').textContent()).length>20,
      'Anomaly inspection failed to render a truthful source-derived state');
    await page.locator('[data-qc-view="receipt"]').click();
    assert((await page.locator('#qcWorkbenchContent').textContent()).includes('Asia/Kolkata'),
      'Current model source receipt does not expose the validated timezone');
    assert(await page.locator('#exportForecastEvidence').isEnabled(),
      'Current authenticated model CSV unexpectedly unavailable');
  }else{
    assert(!(await page.locator('#exportForecastEvidence').isEnabled()),
      'Unavailable model evidence must not enable a misleading CSV');
    assert((await page.locator('#forecastQualityInspector').textContent()).includes('No current validated'),
      'Unavailable model data must display an honest recovery explanation');
  }
  console.log('WXR03_PUBLIC_WEATHER_PASS '+JSON.stringify({
    removedSummaryCards:true,workbench:certifiedQualityMode,sourceNativeOnly:true
  }));

  const leadKeys=['heroBody','weatherLead','resourceLead','feasLead','changesLead','summaryLead'];
  for(let index=0;index<6;index++){
    await page.locator('#navDesktop [data-nav="'+index+'"]').click();
    const lead=await page.locator('section.section.active [data-i18n="'+leadKeys[index]+'"]').first().textContent();
    assert(lead?.trim().length>0&&lead.trim().length<95,
      'Overlong or missing plain-language introduction on page '+(index+1));
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
    languages:['en','mr','hi'],print:true,realBackendSeparateSmoke:true,interactiveSourceWorkbench:true,cleanOverviewReceipts:true,conciseCopy:true
  }));
  await mobile.close();await desktop.close();
}finally{
  await browser.close();
}
