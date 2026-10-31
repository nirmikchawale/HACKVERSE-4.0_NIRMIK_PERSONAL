import {expect,test} from '@playwright/test';

// Fixtures below are synthetic test data, intercepted in Playwright only.
const verified={
 status:'retrieved_live',data_kind:'government_gridded_historical',
 source:'NASA POWER (US government)',retrieved_at_utc:'2026-11-01T07:00:00+00:00',
 latest_data_date:'2026-10-26',notice:'Historical gridded data, not a forecast.',
 days:[{date:'2026-10-25',precipitation_mm_day:7.25,temperature_c:24.1},
       {date:'2026-10-26',precipitation_mm_day:null,temperature_c:25.2}],
};

test('NASA historical panel shows verified values separate from future forecast',async({page})=>{
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:verified}));
 await page.goto('/');
 await page.locator('#navDesktop [data-nav="1"]').click();
 await expect(page.locator('#governmentClimatePanel')).toBeVisible();
 await expect(page.locator('#governmentClimateStatus')).toContainText('Verified government response');
 await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(2);
 await expect(page.locator('#governmentClimateRows')).toContainText('7.25 mm/day');
 await expect(page.locator('#governmentClimateRows')).toContainText('Rainfall: unavailable');
 await expect(page.locator('#governmentClimateProvenance')).toContainText('not a forecast');
});
test('government source failure renders empty status, never test numbers',async({page})=>{
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
   status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Official upstream unreachable'
 }}));
 await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
 await expect(page.locator('#governmentClimateStatus')).toHaveText('Official source unavailable');
 await expect(page.locator('#governmentClimateRows .gov-day')).toHaveCount(0);
 await expect(page.locator('#governmentClimateRows')).toContainText('Official upstream unreachable');
});
