import { expect, test } from '@playwright/test';

// Run with a genuine FastAPI process via existing B-03 integration harness.
// No API route interception, no mocked weather or precomputed browser decision.
test.describe('Feasibility 20-case explorer: actual FastAPI', () => {
  test.skip(process.env.B03_INTEGRATION !== 'true', 'Needs the real backend integration harness.');

  test('server returns 20 source-labelled example decisions', async ({ request }) => {
    const res = await request.get('/api/feasibility-scenarios');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.data_kind).toBe('illustrative_planning_cases');
    expect(data.count).toBe(20);
    expect(data.records).toHaveLength(20);
    expect(new Set(data.records.map(row => row.id)).size).toBe(20);
    expect(data.records.every(row => row.input_kind === 'configured_example_not_farm_observation')).toBe(true);
    expect(data.records.some(row => row.result.status === 'feasible')).toBe(true);
    expect(data.records.some(row => row.result.status === 'blocked')).toBe(true);
    expect(data.records.some(row => row.result.status === 'unknown')).toBe(true);
  });

  test('page 04 provides interactive, honest scenario source and detailed results', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav="3"]').first().click();
    const workbench = page.locator('#feasibilityWorkbench');
    await expect(workbench).toBeVisible();
    await expect(workbench.locator('.fw-item')).toHaveCount(20);
    await expect(workbench.locator('#fwCaseDetail')).toContainText('configured example');
    await expect(workbench).toContainText('not actual farmer records');
    await workbench.locator('.fw-filter').selectOption('unknown');
    const unknowns = workbench.locator('.fw-item');
    await expect(unknowns.first()).toContainText('UNKNOWN');
    await unknowns.first().click();
    await expect(workbench.locator('#fwCaseDetail')).toContainText('readiness');
    // A demo outcome never silently turns into a farmer-submitted result.
    await expect(page.locator('#resultTitle')).toContainText('Not evaluated');
  });

  test('NASA historical view never displays invented readings on failed provider calls', async ({ request }) => {
    const res = await request.get('/api/government-climate');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(['retrieved_live', 'cached_recent', 'unavailable']).toContain(data.status);
    if (data.status === 'unavailable') expect(data.days).toEqual([]);
    else expect(data.days.length).toBeLessThanOrEqual(20);
  });
});
