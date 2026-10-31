import { expect, test } from '@playwright/test';

async function checkPage(page, width, height, label) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width, height });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/UnlockPlan/);
  await expect(page.locator('h1')).toContainText('Weather changes.');
  await expect(page.locator('#runtime-status')).toHaveAttribute('data-state', 'foundation');
  await expect(page.locator('#runtime-status')).toContainText('Python API and live forecast integration are pending');
  for (const id of ['step-weather-title', 'step-time-title', 'step-resources-title', 'step-results-title']) {
    await expect(page.locator('#' + id)).toBeVisible();
  }
  await expect(page.getByText('Live data: unavailable')).toBeVisible();
  await expect(page.getByText('Decision: not calculated')).toBeVisible();
  const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflowing, `Horizontal overflow in ${label} viewport`).toBe(false);
  expect(pageErrors).toEqual([]);
  await page.screenshot({ path: `test-results/b01-${label}.png`, fullPage: true });
}

test('desktop — correctly rendered static foundation', async ({ page }) => {
  await checkPage(page, 1440, 900, 'desktop');
});

test('mobile — legible responsive static foundation', async ({ page }) => {
  await checkPage(page, 390, 844, 'mobile');
});
