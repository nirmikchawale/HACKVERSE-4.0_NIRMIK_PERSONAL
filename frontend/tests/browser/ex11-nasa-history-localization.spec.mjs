import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';

// Browser-only source fixtures; the production app keeps real government data.
const nasa={
 status:'retrieved_live',data_kind:'government_gridded_historical',
 source:'NASA POWER (US government)',retrieved_at_utc:'2026-11-01T07:00:00+00:00',
 latest_data_date:'2026-10-26',notice:'Historical grid, not a forecast.',
 days:[{date:'2026-10-25',precipitation_mm_day:7.25,temperature_c:24.1},
       {date:'2026-10-26',precipitation_mm_day:null,temperature_c:25.2}]
};
test('switching English Marathi Hindi translates history controls but leaves NASA source values unchanged',async({page})=>{
 let govRequests=0;
 await page.route('**/api/government-climate*',r=>{
   govRequests++;return r.fulfill({status:200,json:nasa});
 });
 await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
 const panel=page.locator('#governmentClimatePanel');
 await expect(panel).toContainText('7.25 mm/day');
 await expect(panel).toContainText('Rainfall: unavailable');
 await page.locator('#language').selectOption('mr');
 await expect(panel.locator('h2')).toContainText('सरकारी ऐतिहासिक हवामान माहिती');
 await expect(page.locator('#governmentClimateRange')).toContainText('अलीकडील ७ उपलब्ध दिवस');
 await expect(page.locator('#downloadGovernmentClimate')).toContainText('पडताळलेला NASA JSON');
 await expect(page.locator('#governmentClimateRows')).toContainText('7.25 मिमी/दिवस');
 await expect(page.locator('#governmentClimateSummary')).toContainText('ऐतिहासिक');
 await expect(page.locator('#governmentClimateProvenance')).toContainText('स्रोत');
 await page.locator('#language').selectOption('hi');
 await expect(panel.locator('h2')).toContainText('सरकारी ऐतिहासिक मौसम जानकारी');
 await expect(page.locator('#governmentClimateRows')).toContainText('7.25 मिमी/दिन');
 await expect(page.locator('#governmentClimateSummary')).toContainText('भविष्य का मौसम पूर्वानुमान नहीं');
 await expect(page.locator('#governmentClimateStatus')).toContainText('सत्यापित सरकारी जानकारी');
 await page.locator('#language').selectOption('en');
 await expect(page.locator('#governmentClimateRows')).toContainText('Rainfall: unavailable');
 expect(govRequests).toBe(1);
 const d=page.waitForEvent('download');
 await page.locator('#downloadGovernmentClimate').click();
 const file=await d,data=JSON.parse(await readFile(await file.path(),'utf8'));
 expect(data.days).toEqual(nasa.days);
 expect(data.source).toBe('NASA POWER (US government)');
 expect(data.latest_data_date).toBe('2026-10-26');
});
test('unavailable NASA source remains empty in Marathi and its original provider notice is retained',async({page})=>{
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
   status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'NASA upstream unavailable'
 }}));
 await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
 await page.locator('#language').selectOption('mr');
 await expect(page.locator('#governmentClimateStatus')).toContainText('सरकारी स्रोत सध्या उपलब्ध नाही');
 await expect(page.locator('#governmentClimateRows')).toContainText('NASA upstream unavailable');
 await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(0);
 await expect(page.locator('#downloadGovernmentClimate')).toBeDisabled();
});
test('changing to unsupported city clears Jalna values and translates the unavailability explanation',async({page})=>{
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:nasa}));
 await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
 await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(2);
 page.on('dialog',d=>d.accept());
 await page.locator('#locationButton').click();
 await page.locator('#stateSelect').selectOption('Gujarat');
 await page.locator('#otherCity').fill('Surat');
 await page.locator('#confirmPlace').click();
 await page.locator('#language').selectOption('hi');
 await expect(page.locator('#governmentClimateStatus')).toContainText('इस स्थान के लिए उपलब्ध नहीं');
 await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(0);
 await expect(page.locator('#downloadGovernmentClimate')).toBeDisabled();
});
