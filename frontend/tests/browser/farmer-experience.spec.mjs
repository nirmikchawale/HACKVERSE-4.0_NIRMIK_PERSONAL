import { test, expect } from '@playwright/test';

// These are user-facing tests: no stored Detailed View preference.
test.use({storageState:{cookies:[],origins:[]}});

test.describe('FX-01 farmer-first experience', () => {
  test('farmer view is default; detailed view retains every technical page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-farmer-view','on');
    await expect(page.locator('#farmerNav')).toBeVisible();
    await expect(page.locator('#navDesktop')).toBeHidden();
    await page.locator('#farmerNav button[data-to="2"]').click();
    await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
    await expect(page.locator('#farmerResourceSummary')).toBeVisible();
    await expect(page.locator('section.section[data-page="2"] .preparedness-card')).toBeHidden();
    await page.locator('#quantity').fill('80');
    await page.locator('.farmer-view-switch button').nth(1).click();
    await expect(page.locator('html')).toHaveAttribute('data-farmer-view','off');
    await expect(page.locator('#navDesktop')).toBeVisible();
    await expect(page.locator('#navDesktop button[data-nav]')).toHaveCount(6);
    await expect(page.locator('#quantity')).toHaveValue('80');
    await page.locator('.farmer-view-switch button').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-farmer-view','on');
    await expect(page.locator('#quantity')).toHaveValue('80');
  });

  test('plain village-friendly Marathi and Hindi do not change inputs', async ({ page }) => {
    await page.goto('/');
    await page.locator('#farmerNav button[data-to="2"]').click();
    await page.locator('#quantity').fill('100');
    await page.locator('#capacity').fill('60');
    await page.locator('#language').selectOption('mr');
    await expect(page.locator('#farmerResourceSummary')).toContainText('तुम्ही दिलेली माहिती');
    await expect(page.locator('#farmerResourceSummary')).toContainText('40');
    await expect(page.locator('#quantity')).toHaveValue('100');
    await page.locator('#language').selectOption('hi');
    await expect(page.locator('#farmerResourceSummary')).toContainText('आपकी दी हुई जानकारी');
    await expect(page.locator('#capacity')).toHaveValue('60');
    await page.locator('#language').selectOption('en');
    await expect(page.locator('#farmerResourceSummary')).toContainText('Your answers at a glance');
    await expect(page.locator('#farmerResourceSummary')).toContainText('40');
  });

  test('does not claim verified success before FastAPI responds', async ({ page }) => {
    await page.goto('/');
    await page.locator('#farmerNav button[data-to="3"]').click();
    await expect(page.locator('.farmer-info-card[role="status"]')).toContainText('Your plan has not been checked yet');
    await expect(page.locator('#engineIndicator')).not.toContainText('RESPONSE VERIFIED');
  });

  test('mobile has a visible mode control and keeps six-step navigation', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    await expect(page.locator('#farmerTopToggle')).toBeVisible();
    await expect(page.locator('#navMobile button[data-nav]')).toHaveCount(6);
    await page.locator('#farmerTopToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-farmer-view','off');
    await page.locator('#farmerTopToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-farmer-view','on');
  });
  test('genuine FastAPI response appears in plain-language Farmer View', async ({ page }) => {
    test.skip(process.env.B03_INTEGRATION !== 'true', 'Requires the verified local FastAPI integration environment');
    await page.goto('/');
    await page.locator('#farmerNav button[data-to="1"]').click();
    await page.locator('#deadlineInput').fill('2099-01-01T12:00');
    await page.locator('#saveDeadline').click();
    await page.locator('#farmerNav button[data-to="2"]').click();
    await page.locator('#quantity').fill('10');
    await page.locator('#capacity').fill('6');
    await page.locator('#duration').fill('1');
    await page.locator('#readiness').selectOption('yes');
    await page.locator('#confirmInputs').check();
    await page.locator('#saveResources').click();
    await page.locator('#language').selectOption('mr');
    await page.locator('#farmerNav button[data-to="3"]').click();
    await page.locator('#runAssessment').click();
    await expect(page.locator('#engineIndicator')).toContainText('RESPONSE VERIFIED',{timeout:20000});
    await expect(page.locator('.farmer-info-card[role="status"]')).toContainText('प्लॅनमध्ये थोडा बदल');
    await expect(page.locator('.farmer-info-card[role="status"]')).toContainText('4');
    await expect(page.locator('#resultHero')).toHaveAttribute('data-kind','blocked');
  });

});
