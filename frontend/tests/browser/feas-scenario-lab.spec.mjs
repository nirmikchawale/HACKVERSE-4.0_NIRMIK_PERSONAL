import { test, expect } from '@playwright/test';

/* CF-FEAS-05: no invented farmer records. The catalog comes from the real
 * Python-built /feasibility-examples-snapshot.json after an intentionally
 * unavailable scenario API. Production source remains FastAPI-first. */
async function openLab(page, mobile = false) {
  await page.route('**/api/feasibility-scenarios',route=>
    route.fulfill({status:503,contentType:'application/json',body:'{"error":"test only: API offline"}'}));
  await page.route('**/api/government-climate**',route=>
    route.fulfill({json:{source:'NASA POWER (US government)',status:'unavailable',days:[],notice:'Test-only provider offline'}}));
  await page.goto('/');
  await page.locator((mobile?'#navMobile':'#navDesktop')+' [data-nav="3"]').click();
  await expect(page.locator('#fw-count-all')).toHaveText('100',{timeout:25000});
  await expect(page.locator('#fwProvenance')).toContainText('Python snapshot');
}
test('scenario lab prioritizes compact working controls and disclosed source limits',async({page})=>{
  await openLab(page);
  await expect(page.locator('#feasibilityWorkbench h2').first()).toHaveText('Scenario lab');
  await expect(page.locator('#feasibilityWorkbench .fw-facet')).toHaveCount(5);
  await expect(page.locator('#feasibilityWorkbench .fw-disclosure')).toHaveCount(0);
  await expect(page.locator('#feasibilityWorkbench .fw-mode-actions')).toHaveCount(0);
  await expect(page.locator('#fwDiagnostic')).toBeHidden();
  await expect(page.locator('.fw-about')).not.toHaveAttribute('open');
  await page.locator('.fw-about summary').click();
  await expect(page.locator('.fw-about')).toHaveAttribute('open','');
  await expect(page.locator('.fw-about')).toContainText('not farmer records');
  await page.locator('#fwCheckAPI').click();
  await expect(page.locator('#fwDiagnostic')).toBeVisible();
});
test('status tabs, variant, search, sorting and reset derive from the 100 verified cases',async({page})=>{
  await openLab(page);
  const facets=page.locator('#feasibilityWorkbench .fw-facet');
  await expect(facets.first()).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#fw-count-feasible')).toHaveText(/\d+/);
  await expect(page.locator('#fw-count-blocked')).toHaveText(/\d+/);
  await expect(page.locator('#fw-count-unknown')).toHaveText(/\d+/);
  await page.locator('#fwVariant').selectOption('baseline');
  await expect(page.locator('#fwListTitle')).toContainText('20 matching cases');
  await page.locator('#fwSearch').fill('JAL-EX-001');
  await expect(page.locator('#fwListTitle')).toHaveText('Browse 1 matching cases');
  await expect(page.locator('#fwCaseList .fw-item')).toHaveCount(1);
  await page.locator('#fwSearch').fill('NOT-EXISTING-CASE');
  await expect(page.locator('#fwListTitle')).toContainText('0 matching cases');
  await expect(page.locator('#fwCaseDetail')).not.toContainText('JAL-EX-001');
  await page.locator('#fwReset').click();
  await expect(page.locator('#fwListTitle')).toContainText('100 matching cases');
  await expect(page.locator('#fwReset')).toBeHidden();
  await facets.filter({hasText:'Blocked'}).click();
  await expect(page.locator('.fw-facet[data-filter="blocked"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#fwListTitle')).not.toContainText('100 matching');
  await facets.filter({hasText:'With changes'}).click();
  await expect(page.locator('.fw-facet[data-filter="packages"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#fwSort').selectOption('shortfall');
  await expect(page.locator('#fwSort')).toHaveValue('shortfall');
  await expect(page.locator('#fwCaseList .fw-item')).not.toHaveCount(0);
});
test('pin and compare show two authentic evaluated case results, without changing farm forms',async({page})=>{
  await openLab(page);
  await expect(page.locator('#fwCaseDetail')).toContainText('JAL-EX-001');
  await page.locator('#fwPin').click();
  await expect(page.locator('#fwComparison')).toContainText('Pinned JAL-EX-001');
  await page.locator('#fwCaseList .fw-item').nth(1).click();
  await expect(page.locator('#fwComparison')).toContainText('Pinned vs selected');
  await expect(page.locator('#fwComparison')).toContainText('JAL-EX-001');
  await expect(page.locator('#fwComparison')).toContainText('JAL-EX-002');
  await expect(page.locator('#fwComparison')).toContainText('Shortfall:');
  await expect(page.locator('#fwComparison')).toContainText('Time margin:');
  await page.locator('#fwClearPin').click();
  await expect(page.locator('#fwComparison')).toBeHidden();
  await page.locator('.fw-my-farm').click();
  await expect(page.locator('section[data-page="2"]')).toHaveClass(/active/);
});
test('CSV retains all 100 non-observational engine examples even when a filter is active',async({page})=>{
  await openLab(page);
  await page.locator('.fw-facet[data-filter="blocked"]').click();
  const pending=page.waitForEvent('download');
  await page.locator('#fwExport').click();
  const download=await pending;
  expect(download.suggestedFilename()).toContain('jalna-100-planning-examples');
  const fs=await import('node:fs/promises');
  const contents=await fs.readFile(await download.path(),'utf8');
  const lines=contents.trim().split('\n');
  expect(lines).toHaveLength(101);
  expect(contents).toContain('configured_example_not_farm_observation');
  expect(contents).toContain('shortfall_handling_units');
});
test('mobile lab stays usable, compact and free of horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openLab(page,true);
  await expect(page.locator('.fw-facet')).toHaveCount(5);
  await page.locator('.fw-facet[data-filter="unknown"]').click();
  await expect(page.locator('.fw-facet[data-filter="unknown"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#fwVariant').selectOption('readiness_review');
  await expect(page.locator('#fwListTitle')).toContainText('matching cases');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.locator('#fwReset').click();
  await expect(page.locator('#fw-count-all')).toHaveText('100');
});
