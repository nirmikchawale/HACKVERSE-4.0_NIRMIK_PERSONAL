import { expect, test } from '@playwright/test';

// Authenticates 100 server-calculated scenarios using the genuine FastAPI
// process and Vite proxy. No API routes are mocked, including NASA POWER.
test.describe('Page 04: one hundred Cloudflare-compatible, real-engine examples', () => {
  test.skip(process.env.B03_INTEGRATION !== 'true', 'Requires running genuine FastAPI service.');

  test('100 distinct labeled examples; five traceable variants from each of twenty seeds', async ({ request }) => {
    const response = await request.get('/api/feasibility-scenarios');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('calculated');
    expect(data.data_kind).toBe('illustrative_planning_cases');
    expect(data.count).toBe(100);
    expect(data.records).toHaveLength(100);
    expect(new Set(data.records.map(r => r.id)).size).toBe(100);
    expect(data.records.every(r => r.input_kind === 'configured_example_not_farm_observation')).toBe(true);
    for (const type of ['baseline', 'compressed_window', 'capacity_resilience', 'readiness_review', 'support_confirmation']) {
      expect(data.records.filter(r => r.variant === type)).toHaveLength(20);
    }
    for (const outcome of ['feasible', 'blocked', 'unknown']) {
      expect(data.records.some(r => r.result.status === outcome)).toBe(true);
    }
  });

  test('Page 04 supports paging, search, status filter and real server explanations', async ({ page }) => {
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="3"]').click();
    const workbench = page.locator('#feasibilityWorkbench');
    await expect(workbench).toBeVisible();
    await expect(workbench).toContainText('not real farms');
    await expect(workbench.locator('.fw-item')).toHaveCount(20);
    await expect(workbench.locator('#fwPageMeta')).toContainText('of 100 matched cases');

    await workbench.locator('#fwNextPage').click();
    await expect(workbench.locator('#fwPageMeta')).toContainText('page 2 of 5');
    await expect(workbench.locator('.fw-item').first()).toContainText('JAL-EX-021');

    await workbench.locator('.fw-search').fill('JAL-EX-100');
    await expect(workbench.locator('.fw-item')).toHaveCount(1);
    await expect(workbench.locator('#fwCaseDetail')).toContainText('JAL-EX-100');

    await workbench.locator('.fw-search').fill('');
    await workbench.locator('.fw-facet[data-outcome="unknown"]').click();
    await expect(workbench.locator('.fw-facet[data-outcome="unknown"]')).toHaveAttribute('aria-pressed','true');
    await expect(workbench.locator('.fw-item').first()).toContainText('UNKNOWN');
    await workbench.locator('.fw-item').first().click();
    await expect(workbench.locator('#fwCaseDetail')).toContainText('readiness');

    // Examples never become farmer-submitted inputs.
    await expect(page.locator('#resultTitle')).toContainText('Not evaluated');
  });

  test('CSV export carries all 100 case IDs plus configured provenance', async ({ page }) => {
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="3"]').click();
    const workbench = page.locator('#feasibilityWorkbench');
    await expect(workbench.locator('.fw-item')).toHaveCount(20);
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      workbench.getByRole('button', { name: 'Export assessed cases CSV' }).click(),
    ]);
    const { readFile } = await import('node:fs/promises');
    const csv = await readFile(await file.path(), 'utf8');
    expect(csv).toContain('configured_example_not_farm_observation');
    expect(csv).toContain('JAL-EX-001');
    expect(csv).toContain('JAL-EX-100');
    expect(csv.trim().split('\n')).toHaveLength(101);
  });

  test('NASA historical values remain genuine, capped and never substituted', async ({ request }) => {
    const response = await request.get('/api/government-climate');
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(['retrieved_live', 'cached_recent', 'unavailable']).toContain(result.status);
    if (result.status === 'unavailable') expect(result.days).toEqual([]);
    else {
      expect(result.data_kind).toBe('government_gridded_historical');
      expect(result.days.length).toBeGreaterThan(0);
      expect(result.days.length).toBeLessThanOrEqual(20);
    }
  });
});
