import {expect,test} from '@playwright/test';

const health={ok:true,version:'P0',disclaimer:'Not field validated'};
const sources={sources:[],input_categories:[],operational_rules:[]};
const forecast={
  status:'retrieved_live',hours:[{time:'2099-01-01T12:00',precipitation_mm:2,precipitation_probability_pct:30}],
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  retrieved_at_utc:'2026-11-01T04:00:00+00:00',forecast_age_hours:0,attribution:'Open-Meteo'
};
const nasa={
  status:'retrieved_live',data_kind:'government_gridded_historical',
  source:'NASA POWER (US government)',latest_data_date:'2026-10-26',
  retrieved_at_utc:'2026-11-01T03:00:00+00:00',notice:'Historical only',
  days:[{date:'2026-10-26',precipitation_mm_day:null,temperature_c:21}]
};
test('print receipt distinguishes server result, farmer declarations, model and historical grid',async({page})=>{
  await page.route('**/api/health',r=>r.fulfill({status:200,json:health}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:sources}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:forecast}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:nasa}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="5"]').click();
  const report=page.locator('#printEvidenceReceipt');
  await expect(report).toBeVisible();
  await expect(report).toContainText('Not evaluated');
  await expect(report).toContainText('Open-Meteo NON-GOVERNMENT-HOSTED MODEL');
  await expect(report).toContainText('NASA POWER US-GOVERNMENT HISTORICAL GRID');
  await expect(report).toContainText('IMD warnings');
  await expect(report).toContainText('Not connected');
  await expect(report).not.toContainText('Crop safety certified');
  await page.emulateMedia({media:'print'});
  await expect(report).toBeVisible();
});
test('missing sources produce an honest empty paper receipt',async({page})=>{
  await page.route('**/api/health',r=>r.fulfill({status:200,json:health}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:sources}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:{status:'unavailable',hours:[],notice:'Unavailable'}}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Unavailable'}}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="5"]').click();
  const report=page.locator('#printEvidenceReceipt');
  await expect(report).toContainText('No eligible current model forecast');
  await expect(report).toContainText('No validated NASA POWER historical grid');
  await expect(report).toContainText('Not evaluated');
  await expect(report).not.toContainText('2026-10-26');
});
