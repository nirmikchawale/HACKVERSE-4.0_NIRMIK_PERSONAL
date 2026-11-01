import {expect,test} from '@playwright/test';

// No synthetic data appears in production: all fixtures below are browser-network intercepts.
const health={ok:true,version:'P0',disclaimer:'Not field validated.'};
const registry={sources:[],input_categories:[],operational_rules:[]};
const days=Array.from({length:14},(_,i)=>{
  const d=new Date(Date.UTC(2026,9,13+i)).toISOString().slice(0,10);
  return {date:d,precipitation_mm_day:i===2?null:i===0?0:2+i/10,
    temperature_c:i===4?null:i===0?-2:22+i/10};
});
const nasa={status:'retrieved_live',data_kind:'government_gridded_historical',
  source:'NASA POWER (US government)',retrieved_at_utc:new Date().toISOString(),
  latest_data_date:'2026-10-26',
  days,notice:'Source-native historical grid, not operational rain.'};
const forecast=(age=3)=>({
  status:'retrieved_live',retrieved_at_utc:new Date(Date.now()-age*60000).toISOString(),
  forecast_age_hours:age/60,attribution:'Open-Meteo test interception model',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:[{time:'2099-01-01T09:00',precipitation_mm:0,precipitation_probability_pct:40},
         {time:'2099-01-01T10:00',precipitation_mm:3,precipitation_probability_pct:50},
         {time:'2099-01-01T11:00',precipitation_mm:null,precipitation_probability_pct:null}]
});
async function setup(page,{f=forecast(),g=nasa}={}){
  await page.route('**/api/health',r=>r.fulfill({status:200,json:health}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:registry}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:f}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:g}));
}
async function weatherPage(page){
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
}
test('F05 shows period-separated source rainfall, missing coverage and non-equivalence warning',async({page})=>{
  await setup(page);await weatherPage(page);
  const cards=page.locator('#historicalModelComparison .evidence-contrast-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Next 24 forecast hours');
  await expect(cards.nth(0)).toContainText('Known modeled rainfall: 3 mm');
  await expect(cards.nth(0)).toContainText('2/24');
  await expect(cards.nth(1)).toContainText('Up to 20 historical days');
  await expect(cards.nth(1)).toContainText('13/14');
  await expect(cards.nth(1)).toContainText('2026-10-13');
  await expect(page.locator('#historicalModelComparison')).toContainText('must not be treated as a model validation');
});
test('F05 fails closed for stale Open-Meteo while preserving independently valid NASA history',async({page})=>{
  await setup(page,{f:forecast(240)});await weatherPage(page);
  const cards=page.locator('#historicalModelComparison .evidence-contrast-card');
  await expect(cards.nth(0)).toContainText('No verified future model hours');
  await expect(cards.nth(0)).not.toContainText('Known modeled rainfall: 3 mm');
  await expect(cards.nth(1)).toContainText('13/14');
});
test('F11 displays 14 authentic calendar rows with missing rain and negative temperature',async({page})=>{
  await setup(page);await weatherPage(page);
  const chart=page.locator('#nasaHistoryChart');
  await expect(chart).toBeVisible();
  await expect(page.locator('#nasaRainChart .nasa-bar-day')).toHaveCount(14);
  await expect(page.locator('#nasaRainChart .nasa-bar-gap')).toHaveCount(1);
  await expect(chart.locator('svg circle')).toHaveCount(13);
  await expect(chart).toContainText('historical rainfall and temperature');
  await chart.locator('details summary').click();
  await expect(page.locator('#nasaChartTable tbody tr')).toHaveCount(14);
  await expect(page.locator('#nasaChartTable')).toContainText('-2');
  await expect(page.locator('#nasaChartTable')).toContainText('Unavailable');
  await page.locator('#governmentClimateRange').selectOption('7');
  await expect(page.locator('#nasaChartTable tbody tr')).toHaveCount(14);
  await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(7);
});
test('F11 clears historical chart and F05 numbers on a genuine provider outage',async({page})=>{
  await setup(page);await weatherPage(page);
  await expect(page.locator('#nasaHistoryChart')).toBeVisible();
  await page.route('**/api/government-climate*',r=>r.fulfill({
    status:200,json:{status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Unavailable'}
  }));
  await page.locator('#refreshGovernmentClimate').click();
  await expect(page.locator('#nasaHistoryChart')).toBeHidden();
  await expect(page.locator('#historicalModelComparison .evidence-contrast-card').nth(1)).toContainText('No verified historical grid');
  await expect(page.locator('#downloadGovernmentCSV')).toBeDisabled();
});
test('unsupported geography clears prior NASA charts and both period summaries',async({page})=>{
  await setup(page);await weatherPage(page);
  page.on('dialog',d=>d.accept());
  await page.locator('#locationButton').click();
  await page.locator('#stateSelect').selectOption('Gujarat');
  await page.locator('#otherCity').fill('Surat');
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#nasaHistoryChart')).toBeHidden();
  await expect(page.locator('#historicalModelComparison .evidence-contrast-card').nth(0)).toContainText('No verified future model hours');
  await expect(page.locator('#historicalModelComparison .evidence-contrast-card').nth(1)).toContainText('No verified historical grid');
});
test('F27 records only bounded last successful source timestamps; no weather or farmer payloads',async({page})=>{
  await setup(page);await weatherPage(page);
  const network=page.locator('#networkEvidenceStatus');
  await expect(network).toContainText('Browser reports online; provider connectivity unverified');
  await expect(network).toContainText('Last Open-Meteo receipt');
  await expect(network).toContainText('Last NASA POWER receipt');
  const stored=await page.evaluate(()=>localStorage.getItem('agri-foresight-source-receipts-v1'));
  const receipt=JSON.parse(stored);
  expect(Object.keys(receipt).sort()).toEqual(['model','nasa','version']);
  expect(receipt.version).toBe(1);
  expect(Date.parse(receipt.model)).toBeGreaterThan(0);
  expect(Date.parse(receipt.nasa)).toBeGreaterThan(0);
  expect(stored).not.toContain('precipitation');
  expect(stored).not.toContain('capacity');
  expect(stored).not.toContain('Jalna');
});
test('F27 offline indicator is truthful and identifies previous source values as last received',async({page})=>{
  await setup(page);await weatherPage(page);
  await page.context().setOffline(true);
  const network=page.locator('#networkEvidenceStatus');
  await expect(network).toContainText('Browser reports offline');
  await expect(page.locator('#forecastSourceChip')).toContainText('OFFLINE');
  await expect(network).toContainText('Only source timestamps are retained locally');
  await page.context().setOffline(false);
  await expect(network).toContainText('Browser reports online; provider connectivity unverified');
});
test('F27 metadata alone never rehydrates an unavailable forecast after reload',async({page})=>{
  await setup(page);await weatherPage(page);
  await page.route('**/api/forecast*',r=>r.fulfill({
    status:200,json:{status:'unavailable',hours:[],notice:'Provider unavailable'}
  }));
  await page.reload();
  await expect(page.locator('#networkEvidenceStatus')).toContainText('Last Open-Meteo receipt');
  await expect(page.locator('#weatherChart')).not.toContainText('3 mm');
  await expect(page.locator('#historicalModelComparison .evidence-contrast-card').nth(0)).toContainText('No verified future model hours');
});
test('F05/F11/F27 preserve translations, semantic source values and mobile bounds',async({page})=>{
  await setup(page);
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('#networkEvidenceStatus')).toContainText('नेटवर्क');
  await expect(page.locator('#historicalModelComparison')).toContainText('मॉडेल अंदाज');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('#nasaHistoryChart')).toContainText('ऐतिहासिक वर्षा');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#nasaRainChart .nasa-bar-day')).toHaveCount(14);
  // Mobile page 02 must be visible before measuring its layout (hidden pages have 0-width rects).
  await page.locator('#navMobile [data-nav="1"]').click();
  await expect(page.locator('#historicalModelComparison')).toBeVisible();
  const bounds=await page.locator('#historicalModelComparison .evidence-contrast-card').evaluateAll(
    els=>els.map(x=>({left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right,width:x.getBoundingClientRect().width})));
  expect(bounds.every(x=>x.left>=0&&x.right<=390&&x.width>100)).toBe(true);
});
