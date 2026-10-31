import { expect, test } from '@playwright/test';

async function checkPage(page, width, height, label) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width, height });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/UnlockPlan/);
  await expect(page.locator('h1')).toContainText('Weather changes.');
  // A foundation-only preview stays pending. On the integration branch,
  // an authentic FastAPI response may legitimately move status to connected.
  await expect(page.locator('#forecast-status')).not.toHaveText('Checking source', {timeout:15000});
  const runtime = page.locator('#runtime-status');
  await expect(runtime).toHaveAttribute('data-state', /^(foundation|connected)$/);
  if (await runtime.getAttribute('data-state') === 'connected') {
    await expect(runtime).toContainText('Forecast API connected');
    await expect(page.locator('.step-card:first-child .card-foot')).toContainText('Model hours:');
  } else {
    await expect(runtime).toContainText('Python API and live forecast integration are pending');
  }
  for (const id of ['step-weather-title', 'step-time-title', 'step-resources-title', 'step-results-title']) {
    await expect(page.locator('#' + id)).toBeVisible();
  }
  // Never assert that live data is unavailable after an authentic API connection.
  if (await runtime.getAttribute('data-state') !== 'connected') {
    await expect(page.getByText('Live data: unavailable')).toBeVisible();
  }
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
