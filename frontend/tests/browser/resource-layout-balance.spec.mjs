import { test, expect } from '@playwright/test';

/**
 * CF-RES-04 visual acceptance tests.
 * This is intentionally layout-only: no data or API mocks, no changes to farmer
 * declarations, and no assumptions that a user entered any farm quantities.
 */
const findBoxes = async page => page.evaluate(() => {
  const farm = document.querySelector('section.section[data-page="2"]');
  const box = selector => {
    const el = farm.querySelector(selector);
    if (!el) throw new Error('Missing layout landmark: ' + selector);
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      top: rect.top, right: rect.right, bottom: rect.bottom };
  };
  return {
    planned:box('.resource-layout > .panel'),
    prepared:box('.resource-side > .preparedness-card'),
    evidence:box('.resource-side > .resource-evidence'),
    alternatives:box('.options-panel'),
    grid:box('.resource-layout'),
    gridColumns:getComputedStyle(farm.querySelector('.resource-layout')).gridTemplateColumns,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
});

test.describe('CF-RES-04 Farm Resources spatial balance', () => {
  for (const width of [1649, 1440, 1200]) {
    test('desktop '+width+': planned work compact, evidence fills below, readiness aligned', async ({page}) => {
      await page.setViewportSize({width,height:900});
      await page.goto('/');
      await page.locator('#navDesktop [data-nav="2"]').click();
      await expect(page.locator('link[href="/resource-layout-balance.css"]')).toHaveCount(1);
      const p=await findBoxes(page);
      expect(p.gridColumns.split(' ').length).toBe(2);
      expect(Math.abs(p.planned.top-p.prepared.top)).toBeLessThan(4);
      expect(p.planned.height).toBeLessThan(p.prepared.height - 20);
      expect(p.evidence.top).toBeGreaterThanOrEqual(p.planned.bottom + 10);
      expect(Math.abs(p.evidence.bottom-p.prepared.bottom)).toBeLessThan(4);
      expect(p.evidence.x).toBeCloseTo(p.planned.x,0);
      expect(p.alternatives.top).toBeGreaterThanOrEqual(p.prepared.bottom+10);
      expect(p.alternatives.width).toBeGreaterThan(p.planned.width);
      expect(p.overflow).toBe(false);
    });
  }
  for(const width of [1024, 768, 390]) {
    test('narrow '+width+': planned -> preparedness -> evidence -> alternatives', async ({page}) => {
      await page.setViewportSize({width,height:844});
      await page.goto('/');
      const nav = width<=740 ? '#navMobile [data-nav="2"]' : '#navDesktop [data-nav="2"]';
      await page.locator(nav).click();
      const p=await findBoxes(page);
      expect(p.gridColumns.split(' ').length).toBe(1);
      expect(p.planned.bottom).toBeLessThan(p.prepared.top);
      expect(p.prepared.bottom).toBeLessThan(p.evidence.top);
      expect(p.evidence.bottom).toBeLessThan(p.alternatives.top);
      expect(p.overflow).toBe(false);
    });
  }
  test('all original farm input actions and declared-data labels remain available',async({page})=>{
    await page.goto('/');
    await page.locator('#navDesktop [data-nav="2"]').click();
    await expect(page.locator('#quantity')).toHaveAttribute('type','number');
    await expect(page.locator('#capacity')).toHaveAttribute('type','number');
    await expect(page.locator('#duration')).toHaveAttribute('type','number');
    await expect(page.locator('#readiness option')).toHaveCount(3);
    await expect(page.locator('#confirmInputs')).toHaveAttribute('type','checkbox');
    await expect(page.locator('#saveResources')).toBeVisible();
    await expect(page.locator('#resourceNextAction')).toBeVisible();
    await expect(page.locator('#addChange')).toBeVisible();
    await expect(page.locator('.resource-evidence-grid > .resource-proof-card')).toHaveCount(2);
    await expect(page.locator('.options-panel')).toContainText('Additional changes');
  });
});
