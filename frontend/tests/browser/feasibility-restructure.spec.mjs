import { expect, test } from '@playwright/test';

test.describe('CF-FEAS-04: interactive feasibility and honest source resilience', () => {
  test('build-time Python snapshot is 100 traceable, real-engine results', async ({ request }) => {
    const reply = await request.get('/feasibility-examples-snapshot.json');
    expect(reply.status()).toBe(200);
    const result = await reply.json();
    expect(result.catalog_source).toBe('prebuilt_python_engine_snapshot');
    expect(result.count).toBe(100);
    expect(result.records).toHaveLength(100);
    expect(new Set(result.records.map(row => row.id)).size).toBe(100);
    expect(result.records.every(row => row.input_kind === 'configured_example_not_farm_observation')).toBe(true);
    for (const status of ['feasible','blocked','unknown'])
      expect(result.records.some(row => row.result.status === status)).toBe(true);
    expect(result.snapshot_notice).toContain('NOT live farm assessments');
    expect(result.snapshot_generated_at_utc).toBe(result.evaluated_at_utc);
  });

  test('API down: 100 engine-calculated teaching cases still browse without fake live result', async ({ page }) => {
    await page.route('**/api/feasibility-scenarios', route => route.abort('failed'));
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="3"]').click();
    const workbench = page.locator('#feasibilityWorkbench');
    await expect(workbench).toBeVisible();
    await expect(workbench).toContainText('Python-built planning examples', {timeout:15000});
    await expect(workbench).toContainText('NOT a personal evaluation');
    await expect(workbench.locator('.fw-item')).toHaveCount(20);
    await expect(workbench.locator('#fwPageMeta')).toContainText('of 100 matched cases');
    await expect(workbench.locator('.fw-stat-action')).toHaveCount(5);
    await workbench.locator('.fw-stat-action[data-outcome="blocked"]').click();
    await expect(workbench.locator('.fw-item').first()).toContainText('BLOCKED');
    await workbench.locator('.fw-stat-action[data-outcome="all"]').click();
    await workbench.locator('.fw-search').fill('JAL-EX-100');
    await expect(workbench.locator('.fw-item')).toHaveCount(1);
    await workbench.locator('.fw-item').click();
    await workbench.locator('.fw-metric-action').first().click();
    await expect(workbench.locator('.fw-inline-note')).toContainText(/Example target in handling units/i);
    await expect(page.locator('#resultTitle')).toContainText('Not evaluated');
    // Example inspection must never manufacture the user's personal assessment.
    await expect(page.locator('#farmResultMetrics')).toBeHidden();
    await expect(page.locator('#farmResultPanel')).toBeHidden();
  });

  test('all farmer readiness and metrics can open relevant inputs by mouse and keyboard', async ({ page }) => {
    await page.route('**/api/feasibility-scenarios', route => route.abort('failed'));
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="3"]').click();
    const metric = page.locator('#feasResourcesAction');
    await expect(metric).toHaveAttribute('type','button');
    await metric.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
    await page.locator('#navDesktop [data-nav="3"]').click();
    const readiness = page.locator('#feasPlanningAction');
    await expect(readiness).toHaveAttribute('type','button');
    await readiness.click();
    await expect(page.locator('section.section[data-page="1"]')).toHaveClass(/active/);
  });

  test('real-world government source failure never becomes a fabricated historical reading', async ({ page }) => {
    await page.route('**/api/government-climate**', route => route.abort('failed'));
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="3"]').click();
    await expect(page.locator('#fwClimateStatus')).toContainText('Unable to verify',{timeout:15000});
    await expect(page.locator('#fwClimateList')).toContainText('No replacement readings were generated');
    await page.getByRole('button',{name:'Explain verified vs unavailable data'}).click();
    await expect(page.locator('#fwClimateInfo')).toBeVisible();
    await expect(page.locator('#fwClimateInfo')).toContainText('not a farm sensor');
    expect(await page.locator('#fwClimateList .fw-history-action').count()).toBe(0);
  });

  test('no mobile horizontal overflow in recovery mode', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.route('**/api/feasibility-scenarios', route => route.abort('failed'));
    await page.goto('/');
    await page.locator('#navMobile [data-nav="3"]').click();
    await expect(page.locator('#feasibilityWorkbench .fw-item')).toHaveCount(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});
