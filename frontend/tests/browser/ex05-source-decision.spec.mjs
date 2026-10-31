import {expect,test} from '@playwright/test';

// All external data below are isolated browser-test fixtures, NEVER runtime.
const health={ok:true,version:'P0',disclaimer:'Not field validated; no guaranteed crop protection.'};
const sources={sources:[{id:'open_meteo_forecast',title:'Open-Meteo model forecast',url:'https://open-meteo.com/en/docs'}],input_categories:['forecast'],operational_rules:[]};
const historical={
  status:'retrieved_live',data_kind:'government_gridded_historical',
  source:'NASA POWER (US government)',
  retrieved_at_utc:'2026-11-01T01:00:00+00:00',latest_data_date:'2026-10-26',
  notice:'Historical grid only; not an operational forecast.',
  days:[{date:'2026-10-26',precipitation_mm_day:1,temperature_c:23}]
};
const forecast={
  status:'retrieved_live',hours:[{time:'2099-01-01T09:00',precipitation_mm:2,precipitation_probability_pct:40}],
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  retrieved_at_utc:'2026-11-01T01:00:00+00:00',forecast_age_hours:0,attribution:'Open-Meteo model'
};
const base={
  status:'unknown',known_blockers:['capacity'],
  constraints:[
    {id:'readiness',status:'unknown',explanation:'Handling-location readiness has not been confirmed.',provenance:'user-reported'},
    {id:'capacity',status:'blocked',explanation:'Backend confirmed capacity shortfall of 4.',provenance:'user-reported + configured assumption'},
    {id:'timing',status:'pass',explanation:'Candidate user deadline includes sufficient time.',provenance:'user-reported'}
  ],
  time_budget:{time_slack_hours:2,available_hours:3,required_hours:1},
  projected_target_units:10,projected_capacity_units:6,shortfall_units:4,original_target_unhandled_units:0
};
const assessment={
  status:'unknown',baseline:base,packages:[],unit:'handling_unit',
  message:'Insufficient evidence for feasible result.',
  excluded_changes:[{id:'optional-worker',reason:'Not counted: availability and confirmation must both be explicitly confirmed (requested ≠ confirmed).'}]
};
async function setup(page, options={}){
  await page.route('**/api/health',r=>r.fulfill({status:200,json:health}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:sources}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:options.forecast??forecast}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:options.historical??historical}));
}
test('overview differentiates backend, model forecast, historical government grid and unconnected IMD',async({page})=>{
  await setup(page);
  await page.goto('/');
  const list=page.locator('#evidenceSourceGrid .source-matrix-card');
  await expect(list).toHaveCount(5);
  await expect(list.nth(0)).toContainText('Connected');
  await expect(list.nth(1)).toContainText('Verified model hours');
  await expect(list.nth(2)).toContainText('Verified historical grid');
  await expect(list.nth(2)).toContainText('2026-10-26');
  await expect(list.nth(3)).toContainText('Not connected');
  await expect(list.nth(4)).toContainText('Not evaluated');
  await expect(page.locator('#evidenceSourceMatrix')).not.toContainText('All sources live');
});
test('unsupported city clears previously verified Jalna-only source receipt',async({page})=>{
  await setup(page);await page.goto('/');
  await expect(page.locator('#evidenceSourceGrid')).toContainText('Verified historical grid');
  page.on('dialog',d=>d.accept());
  await page.locator('#locationButton').click();
  await page.locator('#stateSelect').selectOption('Gujarat');
  await page.locator('#otherCity').fill('Surat');
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#evidenceSourceGrid')).toContainText('Unsupported location');
  await expect(page.locator('#evidenceSourceGrid')).not.toContainText('Verified historical grid');
  await expect(page.locator('#evidenceSourceGrid')).not.toContainText('Verified model hours');
});
test('missing sources never claim verified NASA or usable current forecast',async({page})=>{
  await setup(page,{historical:{status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Official source unavailable'},
    forecast:{status:'unavailable',hours:[],notice:'Model unavailable'}});
  await page.goto('/');
  await expect(page.locator('#evidenceSourceGrid')).toContainText('Unavailable / not loaded');
  await expect(page.locator('#evidenceSourceGrid')).toContainText('Not connected');
  await expect(page.locator('#evidenceSourceGrid')).not.toContainText('Verified historical grid');
});
test('backend constraint explanation shows both blocked and unknown statuses without overwriting them',async({page})=>{
  await setup(page);
  await page.route('**/api/evaluate',r=>r.fulfill({status:200,json:assessment}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill('2099-01-01T12:00');
  await page.locator('#saveDeadline').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#quantity').fill('10');
  await page.locator('#capacity').fill('6');
  await page.locator('#duration').fill('1');
  await page.locator('#readiness').selectOption('unknown');
  await page.locator('#confirmInputs').check();
  await page.locator('#saveResources').click();
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#runAssessment').click();
  const notes=page.locator('#decisionDiagnosticNotes');
  await expect(notes).toContainText('Server result: UNKNOWN');
  await expect(notes).toContainText('Handling-location readiness · UNKNOWN');
  await expect(notes).toContainText('Declared handling capacity · BLOCKED');
  await expect(notes).toContainText('Backend confirmed capacity shortfall of 4');
  await expect(notes).toContainText('Not counted · optional-worker');
  await expect(notes).not.toContainText('Candidate deadline and time · BLOCKED');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#capacity').fill('10');
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(notes).toContainText('Not evaluated');
  await expect(notes).not.toContainText('Backend confirmed capacity shortfall of 4');
});

test('location directory provider outage does not throw when optional credit element is absent',async({page})=>{
  await setup(page);
  await page.route('**/Indian-Cities-JSON/master/cities.json',r=>r.fulfill({
    status:503,headers:{'Access-Control-Allow-Origin':'*'},body:'unavailable'
  }));
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const request=page.waitForResponse(x=>x.url().includes('Indian-Cities-JSON')&&x.status()===503);
  await page.locator('#locationButton').click();
  await request;
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  await expect(page.locator('#placeDialog')).toBeVisible();
});
