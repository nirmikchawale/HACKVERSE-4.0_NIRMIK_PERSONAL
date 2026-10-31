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
