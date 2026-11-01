import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// SYNTHETIC FIXTURES ARE TEST-ONLY: /api/forecast and /api/government-climate
// are never replaced or mocked in the runtime application.
function istHour(ahead) {
  const instant = new Date(Date.now() + ahead * 3_600_000);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(instant);
  const at = key => parts.find(p=>p.type===key)?.value;
  return at('year')+'-'+at('month')+'-'+at('day')+'T'+at('hour')+':00';
}
const forecast = () => ({
  status:'retrieved_live',
  retrieved_at_utc:new Date().toISOString(),forecast_age_hours:0,
  attribution:'Open-Meteo — test-only intercepted source',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:Array.from({length:30},(_,i)=>({
    time:istHour(i+2),
    precipitation_mm:i===2?null:1,
    precipitation_probability_pct:i===4?null:15+i
  }))
});
const nasa={
  status:'retrieved_live',data_kind:'government_gridded_historical',
  source:'NASA POWER (US government)',
  retrieved_at_utc:'2026-11-01T07:00:00+00:00',
  latest_data_date:'2026-10-26',source_url:'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',
  notice:'Historical grid only; no operational forecast.',
  days:[
    {date:'2026-10-25',precipitation_mm_day:7.25,temperature_c:-2.1},
    {date:'2026-10-26',precipitation_mm_day:null,temperature_c:25.2}
  ]
};
test('future model window sums distinguish missing readings from zero and never show safe crop advice',async({page})=>{
  // The unified frontend first validates health and sources before fetching weather.
  // These are test-only interceptions, not runtime fallback data.
  await page.route('**/api/health',route=>route.fulfill({status:200,json:{
    ok:true,version:'P0',disclaimer:'Not field validated.'
  }}));
  await page.route('**/api/sources',route=>route.fulfill({status:200,json:{
    sources:[],operational_rules:[],input_categories:['forecast']
  }}));
  await page.route('**/api/forecast*',route=>route.fulfill({status:200,json:forecast()}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  const cards=page.locator('#forecastWindowSummary .forecast-window-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('Known partial rainfall: 5 mm');
  await expect(cards.nth(0)).toContainText('Rainfall coverage: 5/6 hourly values');
  await expect(cards.nth(1)).toContainText('Known partial rainfall: 11 mm');
  await expect(cards.nth(2)).toContainText('Known partial rainfall: 23 mm');
  await expect(page.locator('#forecastWindowSummary')).not.toContainText(/safe for storage|crop loss avoided|rainfall safety/i);
  await page.locator('#clearForecast').click();
  await expect(page.locator('#forecastWindowSummary')).toHaveCount(0);
});
test('NASA CSV preserves actual source metadata, null as blank and negative temperature',async({page})=>{
  await page.route('**/api/government-climate*',route=>route.fulfill({status:200,json:nasa}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  const button=page.locator('#downloadGovernmentCSV');
  await expect(button).toBeEnabled();
  const p=page.waitForEvent('download');
  await button.click();
  const download=await p;
  expect(download.suggestedFilename()).toBe('agri-foresight-nasa-jalna-2026-10-26.csv');
  const csv=await readFile(await download.path(),'utf8');
  expect(csv).toContain('date,precipitation_mm_day,temperature_c,source');
  expect(csv).toContain('"2026-10-25",7.25,-2.1');
  expect(csv).toContain('"2026-10-26",,25.2');
  expect(csv).toContain('NASA POWER (US government)');
  expect(csv).not.toContain(',-999,');
});
test('government unavailability or unsupported location prevents historical CSV export and source leakage',async({page})=>{
  await page.route('**/api/government-climate*',route=>route.fulfill({status:200,json:nasa}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#downloadGovernmentCSV')).toBeEnabled();
  page.on('dialog',d=>d.accept());
  await page.locator('#locationButton').click();
  await page.locator('#stateSelect').selectOption('Gujarat');
  await page.locator('#otherCity').fill('Surat');
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#downloadGovernmentCSV')).toBeDisabled();
  await expect(page.locator('#forecastWindowSummary')).toHaveCount(0);
});
test('provider failures never create synthetic window totals or an export',async({page})=>{
  await page.route('**/api/forecast*',route=>route.fulfill({status:200,json:{status:'unavailable',hours:[],notice:'Forecast unavailable'}}));
  await page.route('**/api/government-climate*',route=>route.fulfill({status:200,json:{
    status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'NASA upstream unavailable'
  }}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#forecastWindowSummary')).toHaveCount(0);
  await expect(page.locator('#downloadGovernmentCSV')).toBeDisabled();
  await expect(page.locator('#governmentClimateRows')).toContainText('NASA upstream unavailable');
});

test('a missing forecast timestamp is not silently skipped when calculating six-hour coverage',async({page})=>{
  const sparse=forecast();
  sparse.hours=sparse.hours.filter((_,i)=>i!==1);
  await page.route('**/api/health',route=>route.fulfill({status:200,json:{
    ok:true,version:'P0',disclaimer:'Not field validated.'
  }}));
  await page.route('**/api/sources',route=>route.fulfill({status:200,json:{
    sources:[],operational_rules:[],input_categories:['forecast']
  }}));
  await page.route('**/api/forecast*',route=>route.fulfill({status:200,json:sparse}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  const first=page.locator('#forecastWindowSummary .forecast-window-card').first();
  await expect(first).toContainText('Rainfall coverage: 4/6 hourly values');
  await expect(first).toContainText('Known partial rainfall: 4 mm');
});

// Responsive acceptance: the extra evidence must not destroy the established
// three-column desktop / one-column phone hierarchy or hide the NASA CSV action.
test('model cards retain responsive layout, focusable NASA export and language-safe readings',async({page})=>{
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'P0',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[],input_categories:[],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:forecast()}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:nasa}));
  await page.setViewportSize({width:1280,height:850});
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const grid=page.locator('#forecastWindowSummary');
  await expect(grid.locator('article')).toHaveCount(3);
  const desktop=await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(desktop).toBe(3);
  const modelValues=await grid.locator('.window-value').allTextContents();
  await page.locator('#language').selectOption('mr');
  await expect(grid).toContainText('पुढील 6');
  expect(await grid.locator('.window-value').allTextContents()).not.toEqual([]);
  await page.locator('#language').selectOption('en');
  expect(await grid.locator('.window-value').allTextContents()).toEqual(modelValues);
  await page.locator('#downloadGovernmentCSV').focus();
  await expect(page.locator('#downloadGovernmentCSV')).toBeFocused();
  await page.setViewportSize({width:390,height:844});
  const mobile=await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(mobile).toBe(1);
  const widths=await grid.locator('article').evaluateAll(els=>els.map(x=>({width:x.getBoundingClientRect().width,left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right})));
  expect(widths.every(x=>x.right<=390&&x.left>=0&&x.width>100)).toBe(true);
  await expect(page.locator('#downloadGovernmentCSV')).toBeEnabled();
});
test('expired forecast does not create misleading source window cards',async({page})=>{
  const expired=forecast();
  expired.retrieved_at_utc=new Date(Date.now()-4*3600_000).toISOString();
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'P0',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[],input_categories:[],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:expired}));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#forecastWindowSummary')).toHaveCount(0);
  await expect(page.locator('#forecastSourceChip')).toContainText('STALE');
});
