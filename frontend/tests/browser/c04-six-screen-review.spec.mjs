import {expect,test} from '@playwright/test';
test('six pages share one root; navigation, themes and languages operate',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('section.section')).toHaveCount(6);
 await page.locator('#navDesktop [data-nav="1"]').click();await expect(page.locator('section.section.active')).toContainText('Weather & planning window');
 await page.locator('#navDesktop [data-nav="5"]').click();await expect(page.locator('section.section.active')).toContainText('Plan summary & evidence');
 await page.locator('#themeButton').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('#language').selectOption('mr');await expect(page.locator('html')).toHaveAttribute('lang','mr');
 await expect(page.locator('#downloadEvidence')).toBeAttached();
 expect(errors).toEqual([]);
});
test('assistant Enter and Send work; unsupported location never shows forecast',async({page})=>{
 await page.goto('/');await page.locator('#assistantLaunch').click();
 await page.locator('#chatText').fill('resources');await page.locator('#chatText').press('Enter');
 await expect(page.locator('#chatlog')).toContainText('resources');
 await page.locator('#chatText').fill('weather');await page.locator('#assistantSend').click();
 await expect(page.locator('#chatlog')).toContainText('weather');
 await page.locator('#closeAssistant').click();
 page.on('dialog',d=>d.accept());
 await page.locator('#locationButton').click();await page.locator('#stateSelect').selectOption('Gujarat');
 await page.locator('#otherCity').fill('Surat');await page.locator('#confirmPlace').click();
 await expect(page.locator('#forecastSourceChip')).toHaveText('UNSUPPORTED LOCATION');
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
});
