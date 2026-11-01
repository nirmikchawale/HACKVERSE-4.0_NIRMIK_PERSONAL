import {expect,test} from '@playwright/test';

// Test-only mock responses: production always requests authentic FastAPI data.
function hour(delta){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(Date.now()+delta*3600000));
  const get=k=>parts.find(x=>x.type===k)?.value;
  return get('year')+'-'+get('month')+'-'+get('day')+'T'+get('hour')+':00';
}
const readings=()=>[
  {time:hour(-3),precipitation_mm:0,precipitation_probability_pct:10},
  {time:hour(4),precipitation_mm:2.75,precipitation_probability_pct:50}
];
const model=(retrieved,status='retrieved_live')=>({
  status, retrieved_at_utc:retrieved,forecast_age_hours:0,
  attribution:'Open-Meteo model test fixture',validated:{timezone:'Asia/Kolkata',
    units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:readings()
});
async function setup(page,modelResponse){
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{
    ok:true,version:'P0',disclaimer:'Not field validated'
  }}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{
    sources:[],input_categories:['forecast'],operational_rules:[]
  }}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:modelResponse}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
    status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Unavailable'
  }}));
}
test('mislabeled live model older than two hours is stale and no model hour remains selectable',async({page})=>{
  await setup(page,model(new Date(Date.now()-3*3600000).toISOString(),'retrieved_live'));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#forecastSourceChip')).toHaveText('STALE · DO NOT USE');
  await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#weatherChartMode')).toContainText('2 hours old');
});
test('mislabeled recent cache older than two hours cannot authorize model deadline selection',async({page})=>{
  await setup(page,model(new Date(Date.now()-2.5*3600000).toISOString(),'cached_recent'));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#forecastSourceChip')).toHaveText('STALE · DO NOT USE');
  await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
});
test('future-dated purported retrieval is unavailable and never offers model hours',async({page})=>{
  await setup(page,model(new Date(Date.now()+10*60000).toISOString()));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#forecastSourceChip')).toHaveText('UNAVAILABLE');
  await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
});
test('past model hour remains readable but disabled; future hour only fills the proposed deadline',async({page})=>{
  const readingsNow=model(new Date().toISOString());
  await setup(page,readingsNow);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const bars=page.locator('#weatherChart .hour-bar');
  await expect(bars).toHaveCount(2);
  await expect(bars.nth(0)).toBeDisabled();
  await expect(bars.nth(1)).toBeEnabled();
  await bars.nth(1).click();
  await expect(page.locator('#deadlineInput')).toHaveValue(readingsNow.hours[1].time);
  await expect(page.locator('#deadlineNotice')).toContainText('Click Save candidate deadline');
});
test('a previously eligible rendered hour fails closed if it becomes stale before click',async({page})=>{
  await setup(page,model(new Date().toISOString()));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const future=page.locator('#weatherChart .hour-bar').nth(1);
  await expect(future).toBeEnabled();
  await page.evaluate(()=>{
    const original=Date.now.bind(Date);
    Date.now=()=>original()+3*3600000;
  });
  await future.click();
  await expect(page.locator('#forecastSourceChip')).toHaveText('STALE · DO NOT USE');
  await expect(page.locator('#deadlineNotice')).toContainText('no longer an eligible future candidate');
  await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
});
