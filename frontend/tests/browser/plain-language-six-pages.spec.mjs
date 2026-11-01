import {test,expect} from '@playwright/test';

// CF-COPY-01 — check visible copy, available controls and disclosure in the
// actual six-page frontend, not just string replacement in source files.
const leadKeys=['heroBody','weatherLead','resourceLead','feasLead','changesLead','summaryLead'];
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{(localStorage.clear(),localStorage.setItem('agri-experience-v1','detailed'));sessionStorage.clear()});
});
test('all six dashboards stay navigable with shorter action-first introductions',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await expect(page.locator('section.section')).toHaveCount(6);
  const nav=page.locator('#navDesktop [data-nav]');
  await expect(nav).toHaveCount(6);
  for(let i=0;i<6;i++){
    await nav.nth(i).click();
    const screen=page.locator('section.section[data-page="'+i+'"]');
    await expect(screen).toHaveClass(/active/);
    await expect(screen.locator('h1').first()).toBeVisible();
    const key=leadKeys[i];
    const lead=screen.locator('[data-i18n="'+key+'"]').first();
    await expect(lead).toBeVisible();
    const words=(await lead.textContent()).trim();
    expect(words.length,'Overlong page '+(i+1)+' lead: '+words).toBeLessThan(95);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
test('Overview and Weather have no duplicated passive theory cards, but weather limits stay visible',async({page})=>{
  await page.goto('/');
  await expect(page.locator('section[data-page="0"] [data-i18n="pathBody"]')).toHaveCount(0);
  await expect(page.locator('[data-i18n="heroBody"]')).toContainText('model forecasts');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('section[data-page="1"] .feature-stripe')).toHaveCount(0);
  await expect(page.locator('section[data-page="1"] .insight-row')).toHaveCount(0);
  await expect(page.locator('[data-i18n="deadlineExplanation"]')).toHaveCount(0);
  await expect(page.locator('#deadlineGuideNextHour')).toBeAttached();
  await expect(page.locator('#deadlineInput')).toBeVisible();
  await expect(page.locator('#toggleForecast')).toBeVisible();
  await expect(page.locator('#saveDeadline')).toBeVisible();
  await expect(page.locator('section[data-page="1"]')).not.toContainText('standalone file');
  await expect(page.locator('section[data-page="1"]')).not.toContainText('Show sample timeline');
});
test('Farm Resources hides optional formula until requested but preserves units and declaration',async({page})=>{
  await page.goto('/');await page.locator('#navDesktop [data-nav="2"]').click();
  const panel=page.locator('.resource-method-disclosure');
  await expect(panel).toHaveCount(1);
  await expect(panel).not.toHaveAttribute('open',/.+/);
  const formula=panel.locator('[data-i18n="resourceMethod"]');
  await expect(formula).not.toBeVisible();
  await panel.locator('summary').click();
  await expect(formula).toBeVisible();
  await expect(formula).toContainText('shortfall');
  await expect(page.locator('#quantity')).toBeVisible();
  await expect(page.locator('#capacity')).toBeVisible();
  await expect(page.locator('#confirmInputs')).toHaveCount(1);
});
test('all three languages keep concise page copy and translated method disclosure',async({page})=>{
  await page.goto('/');
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('[data-i18n="heroBody"]')).toContainText('वेचलेल्या');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await expect(page.locator('.resource-method-disclosure summary')).toContainText('आकडेवारी कशी');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('.resource-method-disclosure summary')).toContainText('संख्याएँ कैसे');
  await page.locator('#navDesktop [data-nav="0"]').click();
  await expect(page.locator('[data-i18n="heroBody"]')).toContainText('मौसम अनुमान');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('[data-i18n="heroBody"]')).toContainText('model forecasts');
});
test('mobile retains all six interactive pages without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  for(let i=0;i<6;i++){
    // This app uses the real mobile nav state machine, not hash routing.
    await page.locator('#navMobile [data-nav="'+i+'"]').click();
    const active=page.locator('section.section.active');
    await expect(active).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),
      'Horizontal overflow on mobile route '+i).toBe(false);
  }
});
