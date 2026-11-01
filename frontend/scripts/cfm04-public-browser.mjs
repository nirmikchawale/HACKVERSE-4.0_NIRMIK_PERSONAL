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
  await page.locator('[data-filter="available"]').click();
  const available=await page.locator('#evidenceSourceGrid .source-matrix-card:visible').count();
  await page.locator('[data-filter="attention"]').click();
  const needReview=await page.locator('#evidenceSourceGrid .source-matrix-card:visible').count();
  assert(available+needReview===3,'Active evidence filters must partition three source choices');
  await page.locator('[data-filter="all"]').click();
  assert(await page.locator('#evidenceSourceGrid .source-matrix-card:visible').count()===3,
    'All three interactive sources must be restored');
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
  await methodology.locator('summary').click();
  assert(await methodology.evaluate(e=>e.open),
    'Resource calculation disclosure must work');
  await methodology.locator('summary').click();

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
  // WXR-04 public exact-source functional verification, no intercepted API responses.
  const compact=page.locator('.wx-workspace-compact');
  await compact.waitFor({state:'visible',timeout:20000});
  const a=await compact.locator('.forecast-panel').boundingBox();
  const b=await compact.locator('.deadline-card').boundingBox();
  assert(a&&b&&Math.abs(a.width-b.width)<=3&&Math.abs(a.height-b.height)<=3,
    'WXR-04 evidence and planning cards must be equal-width and matched-height');
  assert(a.height<570,'WXR-04 panels must be compact, not a full-page static receipt');
  assert(await compact.locator('.network-evidence,.source-strip,.wx-guide-steps,.live-provenance').count()===0,
    'Static receipts or redundant planning stepper appear in compact cards');
  assert(await compact.locator('#saveDeadline').count()===1&&
    await compact.locator('#deadlineGuideSave').count()===0,
    'Duplicate Save action remains in planning card');
  assert(await page.locator('#weatherNetworkDetails').count()===1,
    'Source receipt disclosure missing from separate evidence section');
  let quality='unavailable';
  if(await page.locator('#forecastWindowSummary .wx-horizon-button').count()===3){
    quality='source-current';
    for(const [h,expected] of [[6,6],[12,12],[24,24]]){
      await page.locator('[data-horizon="'+h+'"]').click();
      assert(await page.locator('#weatherChart .hour-bar').count()===expected,
        'Authentic model-range button failed for '+h+' hours');
    }
    await page.locator('#forecastExploreMetric').selectOption('precipitation_probability_pct');
    assert((await page.locator('#weatherChart .bar-value').first().textContent()).includes('%'),
      'Probability control does not change the source measure');
    const hour=page.locator('#weatherChart .hour-bar:not(:disabled)').first();
    assert(await hour.count()>0,'Authenticated future model should permit an hour selection');
    await hour.click();
    assert((await page.locator('#deadlineInput').inputValue()).length>0,
      'Future model hour did not draft a candidate deadline');
    assert(await page.locator('#saveDeadline').isEnabled() &&
      !(await page.locator('#deadlineGuideContinue').isEnabled()),
      'Deadline did not begin as an unsaved candidate');
    await page.locator('#saveDeadline').click();
    assert(await page.locator('#deadlineGuideContinue').isEnabled(),
      'Saved candidate did not enable resource continuation');
  }else{
    assert(await page.locator('#weatherChart .hour-bar').count()===0 &&
      !(await page.locator('#deadlineGuideNextHour').isEnabled()),
      'Unavailable forecast has misleading actionable model hours');
    assert(await page.locator('#deadlineInput').isEnabled(),
      'Manual candidate must remain available');
  }
  console.log('WXR04_PUBLIC_COMPACT_PASS '+JSON.stringify({matchedCards:true,singleSave:true,modelStatus:quality}));

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
