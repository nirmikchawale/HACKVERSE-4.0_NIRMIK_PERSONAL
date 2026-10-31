import { expect, test } from '@playwright/test';

// This is the separately labeled OFFLINE design review, not the certified API planner.
test('six-screen prototype loads all routes and keeps standalone sample weather separated', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('link', {name: /Open six-page interactive review/})).toBeVisible();
  await page.getByRole('link', {name: /Open six-page interactive review/}).click();
  await expect(page).toHaveURL(/\/interactive-review\.html$/);
  await expect(page).toHaveTitle(/Complete Six-Screen Interactive Review/);
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('.section')).toHaveCount(6);
  await expect(page.locator('#navDesktop [data-nav]')).toHaveCount(6);
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('.section.active')).toContainText('Weather & planning window');
  await expect(page.locator('#weatherChartMode')).toContainText('No forecast loaded');
  await page.locator('#toggleForecast').click();
  await expect(page.locator('#forecastSourceChip')).toContainText('SAMPLE DATA · NOT LIVE');
  await page.locator('#clearForecast').click();
  await expect(page.locator('#forecastSourceChip')).toContainText('NOT CONNECTED');
  await expect(page.getByRole('link', {name:/Connected API planner/})).toHaveAttribute('href','/');
  expect(errors).toEqual([]);
});
test('six-screen offline assistant responds to Enter and explicit Send; theme and mobile navigation work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto('/interactive-review.html');
  await page.locator('#assistantLaunch').click();
  await expect(page.locator('#assistPanel')).toHaveClass(/open/);
  await page.locator('#chatText').fill('Where is the forecast?');
  await page.locator('#chatText').press('Enter');
  await expect(page.locator('#chatlog')).toContainText('Where is the forecast?');
  await expect(page.locator('#chatText')).toHaveValue('');
  await page.locator('#chatText').fill('resources');
  await page.locator('#assistantSend').click();
  await expect(page.locator('#chatlog')).toContainText('resources');
  await page.locator('#closeAssistant').click();
  await page.locator('#themeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('#navMobile [data-nav]')).toHaveCount(6);
  await page.locator('#navMobile [data-nav="5"]').click();
  await expect(page.locator('.section.active')).toContainText('Plan summary & evidence');
  expect(errors).toEqual([]);
});
