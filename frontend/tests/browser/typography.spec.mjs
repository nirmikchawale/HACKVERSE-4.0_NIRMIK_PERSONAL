import {expect,test} from '@playwright/test';

test('Apple-compatible type scale spans every dashboard page without replacing layout',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/Agri Foresight/);
  const sheet=page.locator('link[href="/agri-typography.css"]');
  await expect(sheet).toHaveCount(1);
  const design=await page.evaluate(()=>{
    const b=getComputedStyle(document.body);
    const h=document.querySelector('.section h1');
    return {
      stack:b.fontFamily, root:parseFloat(getComputedStyle(document.documentElement).fontSize),
      heading:parseFloat(getComputedStyle(h).fontSize),
      responsive:getComputedStyle(document.documentElement).getPropertyValue('--af-page-title').trim(),
    };
  });
  expect(design.root).toBe(16);
  expect(design.stack).toContain('-apple-system');
  expect(design.stack).toContain('Inter');
  expect(design.heading).toBeGreaterThanOrEqual(25);
  expect(design.responsive).toContain('clamp');
  await expect(page.locator('.brand-logo')).toBeVisible();
  // Titles remain legible and present; no fake display-only replacements.
  for(let i=0;i<6;i++){
    await page.locator('#navDesktop [data-nav="'+i+'"]').click();
    await expect(page.locator('section.section[data-page="'+i+'"] h1')).toBeVisible();
  }
});

test('mobile typography keeps six navigation destinations and reachable main content',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.mobile-brand-logo')).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  const metrics=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
    nav:parseFloat(getComputedStyle(document.querySelector('.mobile-nav button')).fontSize),
    title:parseFloat(getComputedStyle(document.querySelector('.section h1')).fontSize),
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport+6);
  expect(metrics.nav).toBeGreaterThanOrEqual(11);
  expect(metrics.title).toBeGreaterThanOrEqual(25);
});
