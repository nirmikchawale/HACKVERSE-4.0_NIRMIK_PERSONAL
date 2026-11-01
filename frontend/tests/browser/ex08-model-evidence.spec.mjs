import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';

// Source-response fixtures ONLY in Playwright: production never synthesizes weather.
function hour(plus){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(Date.now()+plus*3600000));
  const val=key=>parts.find(item=>item.type===key)?.value;
  return val('year')+'-'+val('month')+'-'+val('day')+'T'+val('hour')+':00';
}
const mockedForecast=()=>({
  status:'retrieved_live',retrieved_at_utc:new Date(Date.now()-3*60*1000).toISOString(),
  forecast_age_hours:0.05,attribution:'Open-Meteo Model Weather (test-only response)',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:[
    {time:hour(2),precipitation_mm:0,precipitation_probability_pct:40},
    {time:hour(3),precipitation_mm:2,precipitation_probability_pct:null},
    {time:hour(3),precipitation_mm:null,precipitation_probability_pct:55},
    {time:hour(5),precipitation_mm:1.5,precipitation_probability_pct:66},
  ]
});
async function intercept(page,forecast){
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{
    ok:true,version:'P0',disclaimer:'Not field validated'
  }}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{
    sources:[],input_categories:['forecast'],operational_rules:[]
  }}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:forecast}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
    status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Unavailable'
  }}));
}
test('source data-quality receipt counts nulls, duplicated timestamps and missing hourly positions',async({page})=>{
  await intercept(page,mockedForecast());
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const quality=page.locator('#forecastQualityPanel');
  await expect(quality).toBeVisible();
  await expect(quality).toContainText('Backend-retrieved model forecast');
  await expect(quality).toContainText('4');
  await expect(quality).toContainText('3/4 hours reported a modeled millimeter value');
  await expect(quality).toContainText('3/4 hours reported a model probability');
  await expect(quality).toContainText('1 duplicate record(s)');
  await expect(quality).toContainText('1 absent hourly position(s)');
  await expect(quality).toContainText('not a field rain gauge');
});
test('CSV is downloadable from verified model readings; zero is not missing and null stays blank',async({page})=>{
  const source=mockedForecast();
  await intercept(page,source);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const button=page.locator('#exportForecastEvidence');
  await expect(button).toBeEnabled();
  const pending=page.waitForEvent('download');await button.click();
  const file=await pending,body=await readFile(await file.path(),'utf8');
  expect(file.suggestedFilename()).toMatch(/^agri-foresight-open-meteo-jalna-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(body).toContain('modeled_precipitation_mm,modeled_precipitation_probability_pct');
  expect(body).toContain('"'+source.hours[0].time+'",0,40');
  expect(body).toContain('"'+source.hours[2].time+'",,55');
  expect(body).toContain('Open-Meteo Model Weather (test-only response)');
  expect(body).toContain('Model values, not a station observation or crop-safety threshold');
  expect(body).not.toContain(',-999,');
});
test('unavailable/stale model never enables export or implies a valid receipt',async({page})=>{
  await intercept(page,{status:'stale_cache',hours:[],notice:'Previous model cache expired'});
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#forecastQualityMetrics')).toContainText('No validated current model readings');
  await expect(page.locator('#forecastQualityMetrics')).not.toContainText('reported a modeled millimeter value');
});
test('unsupported location clears verified Jalna quality receipt and disables export',async({page})=>{
  await intercept(page,mockedForecast());
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#exportForecastEvidence')).toBeEnabled();
  page.on('dialog',d=>d.accept());
  await page.locator('#locationButton').click();
  await page.locator('#stateSelect').selectOption('Gujarat');
  await page.locator('#otherCity').fill('Surat');
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#forecastQualityMetrics')).toContainText('Not available for this location');
});
test('future-dated purported retrieval fails source-age validation and has no export',async({page})=>{
  const future=mockedForecast();
  future.retrieved_at_utc=new Date(Date.now()+10*60*1000).toISOString();
  await intercept(page,future);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#forecastQualityMetrics')).toContainText('No validated current model readings');
});

test('claimed recent model cache older than backend 2-hour TTL cannot be exported as current',async({page})=>{
  const cached=mockedForecast();
  cached.status='cached_recent';
  cached.retrieved_at_utc=new Date(Date.now()-3*60*60*1000).toISOString();
  await intercept(page,cached);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#exportForecastEvidence')).toBeDisabled();
  await expect(page.locator('#forecastQualityMetrics')).toContainText('No validated current model readings');
});
