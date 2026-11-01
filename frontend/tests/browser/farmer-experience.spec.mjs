import { test, expect } from '@playwright/test';

// FE-01: test the new public farmer experience, not an illustrative calculation.
// Legacy feature suites exercise Detailed View separately.
test.beforeEach(async ({page})=>{
  await page.addInitScript(()=>{
    localStorage.removeItem('agri-experience-v1');
    localStorage.removeItem('unlockplan-page01-v1');
  });
});
test('fresh visitor sees six simple farmer links and a real detailed-view switch',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-experience','farmer');
  await expect(page.locator('#navDesktop [data-nav]')).toHaveCount(6);
  const expected=['Home','Check Weather','My Farm Details','Check My Plan','My Action Plan','Help'];
  for(let i=0;i<expected.length;i++)
    await expect(page.locator('#navDesktop [data-nav="'+i+'"]')).toContainText(expected[i]);
  await page.locator('#navDesktop [data-nav="2"]').click();
  await expect(page.locator('#farmerResourceSummary')).toBeVisible();
  await expect(page.locator('.preparedness-card')).toBeHidden();
  await expect(page.locator('#farmerDeadlineRow')).toContainText('When do you want to finish?');
  await expect(page.locator('section[data-page="2"] .farmer-field-hint')).toHaveCount(4);
  await page.locator('#experienceSwitch button').nth(1).click();
  await expect(page.locator('body')).toHaveAttribute('data-experience','detailed');
  await expect(page.locator('#navDesktop [data-nav="3"]')).toContainText('Feasibility');
  await expect(page.locator('.preparedness-card')).toBeVisible();
});
test('six-answer progress updates without equating handling units with bags or quintals',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="2"]').click();
  const summary=page.locator('#farmerResourceSummary');
  await expect(summary).toContainText('0 of 6');
  await expect(page.locator('#farmerWeightForm')).toContainText('1 quintal = 100 kg');
  await page.locator('#farmerTargetWeight').fill('9');
  await page.locator('#farmerCapacityWeight').fill('7');
  await expect(page.locator('#quantity')).toHaveValue('900');
  await expect(page.locator('#capacity')).toHaveValue('700');
  await page.locator('#duration').fill('2.5');
  await expect(summary).toContainText('3 of 6');
  await page.locator('#readiness').selectOption('no');
  await page.locator('#confirmInputs').check();
  await expect(summary).toContainText('5 of 6');
  await expect(page.locator('#farmerAdvancedToggle')).toBeVisible();
  await expect(page.locator('label:has(#baseline)')).toBeHidden();
  await page.locator('#farmerAdvancedToggle').click();
  await expect(page.locator('label:has(#baseline)')).toBeVisible();
});
test('navigation and language changes never erase farmer-entered numbers',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#farmerTargetWeight').fill('9');
  await page.locator('#farmerCapacityWeight').fill('7');
  await page.locator('#duration').fill('3.5');
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('#farmerResourceSummary')).toContainText('पैकी ६');
  await expect(page.locator('#navDesktop [data-nav="3"]')).toContainText('माझा बेत तपासा');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await expect(page.locator('#farmerTargetWeight')).toHaveValue('9');
  await expect(page.locator('#farmerCapacityWeight')).toHaveValue('7');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('section[data-page="2"] [data-i18n="quantity"]')).toContainText('कपास');
  await expect(page.locator('#farmerTargetWeight')).toHaveValue('9');
  await page.locator('#experienceSwitch button').nth(1).click();
  await page.locator('#experienceSwitch button').first().click();
  await expect(page.locator('#duration')).toHaveValue('3.5');
});
test('mobile switch and Help work without hiding the only navigation controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('#mobileExperienceSwitch')).toBeVisible();
  await page.locator('#navMobile [data-nav="5"]').click();
  await expect(page.locator('#farmerHelpPanel h2')).toBeVisible();
  await page.locator('#farmerHelpPanel .farmer-help-step').nth(1).click();
  await expect(page.locator('section.section.active')).toHaveAttribute('data-page','2');
  await page.locator('#mobileExperienceSwitch button').nth(1).click();
  await expect(page.locator('body')).toHaveAttribute('data-experience','detailed');
  await expect(page.locator('#navMobile [data-nav]')).toHaveCount(6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
test('no invented feasibility result is shown before a real server assessment',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(page.locator('#farmerDecisionV2')).toBeVisible();
  await expect(page.locator('#farmerDecisionV2')).toContainText('has not been checked');
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await page.locator('#navDesktop [data-nav="4"]').click();
  await expect(page.locator('#farmerActionV2')).toContainText('First check your plan');
});
