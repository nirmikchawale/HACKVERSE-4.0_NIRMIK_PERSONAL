import {expect,test} from '@playwright/test';

// Isolated browser-only intercepts; production remains source-authenticated.
function hour(ahead){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date(Date.now()+ahead*3_600_000));
  const val=k=>parts.find(p=>p.type===k)?.value;
  return val('year')+'-'+val('month')+'-'+val('day')+'T'+val('hour')+':00';
}
function source(){return {status:'retrieved_live',retrieved_at_utc:new Date().toISOString(),
  forecast_age_hours:0,attribution:'Open-Meteo test-only interception',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:[
    {time:hour(2),precipitation_mm:0,precipitation_probability_pct:15},
    {time:hour(3),precipitation_mm:1.25,precipitation_probability_pct:null},
    {time:hour(3),precipitation_mm:null,precipitation_probability_pct:28},
    {time:hour(5),precipitation_mm:0.5,precipitation_probability_pct:35},
    {time:hour(26),precipitation_mm:0,precipitation_probability_pct:0}
  ]};}
async function openWeather(page,forecast=source()){
  await page.route('**/api/health',r=>r.fulfill({status:200,
    json:{ok:true,version:'test-only',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,
    json:{sources:[],input_categories:['forecast'],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:forecast}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,
    json:{status:'unavailable',source:'NASA POWER (US government)',days:[]}}));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
}
test('WXR-03 removes weather placeholders and retains six pages',async({page})=>{
  await openWeather(page);const section=page.locator('section.section[data-page="1"]');
  await expect(section.locator('.insight-row')).toHaveCount(0);
  await expect(section).not.toContainText('Forecast freshness');
  await expect(section).not.toContainText('Uncertainty matters');
  await expect(page.locator('section.section')).toHaveCount(6);
  await expect(page.locator('#weatherChart')).toBeAttached();
  await expect(page.locator('#forecastQualityPanel')).toBeVisible();
});
test('WXR-03 source coverage reveals null and zero with real hour selection',async({page})=>{
  const f=source();await openWeather(page,f);
  await expect(page.locator('#forecastQualityMetrics button.source-qc-item')).toHaveCount(8);
  await expect(page.locator('#qcHourGrid button')).not.toHaveCount(0);
  const day=f.hours[0].time.slice(0,10);
  await page.locator('#qcEvidenceDate').selectOption(day);
  await expect(page.locator('#qcHourGrid button')).toHaveCount(f.hours.filter(x=>x.time.startsWith(day)).length);
  await expect(page.locator('#qcWorkbenchContent')).toContainText('Precipitation value coverage');
  const i=f.hours.findIndex(x=>x.precipitation_mm===null);
  await page.locator('#qcEvidenceDate').selectOption(f.hours[i].time.slice(0,10));
  const missing=page.locator('[data-qc-hour-index="'+i+'"]');await missing.click();
  await expect(missing).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#qcHourDetail')).toContainText('Unavailable');
  await expect(page.locator('#qcHourDetail')).toContainText('28%');
  const j=f.hours.findIndex(x=>x.precipitation_mm===0);
  await page.locator('#qcEvidenceDate').selectOption(f.hours[j].time.slice(0,10));
  await page.locator('[data-qc-hour-index="'+j+'"]').click();
  await expect(page.locator('#qcHourDetail')).toContainText('0 mm');
});
test('WXR-03 exceptions distinguish missing fields, duplicates and absent hours',async({page})=>{
  await openWeather(page);await page.locator('[data-qc-view="issues"]').click();
  await page.locator('#qcIssueFilter').selectOption('rain');
  await expect(page.locator('#qcExceptionList .qc-exception-row')).toHaveCount(1);
  await page.locator('#qcIssueFilter').selectOption('chance');
  await expect(page.locator('#qcExceptionList .qc-exception-row')).toHaveCount(1);
  await page.locator('#qcIssueFilter').selectOption('duplicate');
  await expect(page.locator('#qcExceptionList .qc-exception-row')).toHaveCount(1);
  await page.locator('#qcIssueFilter').selectOption('gap');
  await expect(page.locator('#qcExceptionList .qc-exception-row')).not.toHaveCount(0);
  await expect(page.locator('#qcExceptionList')).toContainText('A gap is not a 0 mm reading');
  await page.locator('#qcIssueFilter').selectOption('rain');
  await page.locator('#qcExceptionList button').first().click();
  await expect(page.locator('[data-qc-view="hours"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#qcHourDetail')).toContainText('Unavailable');
});
test('WXR-03 metric drilldown preserves keyboard focus and source receipt',async({page})=>{
  await openWeather(page);
  const metric=page.locator('[data-quality="rainCount"]');
  await metric.focus();await page.keyboard.press('Enter');
  await expect(metric).toBeFocused();
  await expect(metric).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#forecastQualityInspector')).toContainText('Affected source hours');
  await page.locator('#forecastQualityInspector .source-qc-drill').click();
  await expect(page.locator('#hourlyEvidenceScope')).toHaveValue('missing-rain');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(1);
  await page.locator('[data-qc-view="receipt"]').click();
  await expect(page.locator('#qcWorkbenchContent')).toContainText('Open-Meteo test-only interception');
  await expect(page.locator('#qcWorkbenchContent')).toContainText('Asia/Kolkata');
  await expect(page.locator('#qcWorkbenchContent')).toContainText('precipitation_probability: %');
  await expect(page.locator('#exportForecastEvidence')).toBeEnabled();
});
test('WXR-03 stale evidence is not displayed as current and CSV stays disabled',async({page})=>{
  const stale=source();stale.status='cached_recent';
  stale.retrieved_at_utc=new Date(Date.now()-4*3600000).toISOString();
  await openWeather(page,stale);
  await expect(page.locator('#qcHourGrid')).toHaveCount(0);
  await expect(page.locator('#forecastQualityInspector')).toContainText('No current validated model response');
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#forecastQualityInspector button')).toContainText('Refresh authentic forecast');
});
test('WXR-03 fits 390px mobile and retains dark theme and language switches',async({page})=>{
  await page.setViewportSize({width:390,height:844});await openWeather(page);
  expect(await page.locator('body').evaluate(el=>el.scrollWidth)).toBeLessThanOrEqual(390);
  const bounds=await page.locator('#qcHourGrid button').evaluateAll(nodes=>
    nodes.map(n=>({x:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})));
  expect(bounds.length).toBeGreaterThan(0);
  expect(bounds.every(x=>x.x>=-1&&x.right<=391)).toBe(true);
  await page.locator('#themeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('[data-qc-view="issues"]')).toContainText('त्रुटी');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('[data-qc-view="receipt"]')).toContainText('स्रोत');
});