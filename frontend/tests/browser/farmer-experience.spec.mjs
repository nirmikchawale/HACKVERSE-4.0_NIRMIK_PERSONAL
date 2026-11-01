import { test, expect } from '@playwright/test';

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
});
