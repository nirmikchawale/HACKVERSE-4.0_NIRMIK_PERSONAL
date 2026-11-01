import {test,expect} from '@playwright/test';

test('overview has no duplicated explanatory blocks and retains real backend status',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await expect(page.locator('section.section')).toHaveCount(6);
  await expect(page.locator('.rail .rail-footer')).toHaveCount(0);
  await expect(page.locator('section[data-page="0"] .panel.evidence')).toHaveCount(0);
  await expect(page.locator('section[data-page="0"] .live-note')).toHaveCount(0);
  await expect(page.locator('#apiConnectionStatus')).toBeAttached();
  await expect(page.locator('#apiConnectionStatus')).toHaveClass(/sr-only/);
  await expect(page.locator('#apiConnectionStatus')).toContainText('FastAPI connected',{timeout:25000});
  await expect(page.locator('#sourceLedger')).toBeAttached();
  await expect(page.locator('#snapshotPlace')).toBeAttached();
  await expect(page.locator('#snapshotResource')).toBeAttached();
});

test('preparation snapshot bottom aligns with decision pathway on desktop',async({page})=>{
  for(const width of [1440,1180]){
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    const cards=page.locator('section[data-page="0"] .lower > div > .panel');
    await expect(cards).toHaveCount(2);
    const left=await cards.nth(0).boundingBox();
    const right=await cards.nth(1).boundingBox();
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(Math.abs((left.y+left.height)-(right.y+right.height))).toBeLessThanOrEqual(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
  }
});

test('small screens retain natural stacked cards and working navigation',async({page})=>{
  for(const width of [390,960]){
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    const cards=page.locator('section[data-page="0"] .lower > div > .panel');
    await expect(cards).toHaveCount(2);
    const left=await cards.nth(0).boundingBox();
    const right=await cards.nth(1).boundingBox();
    expect(right.y).toBeGreaterThan(left.y+left.height-2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
    const nav=page.locator(width<=740?'#navMobile [data-nav="5"]':'#navDesktop [data-nav="5"]');
    await nav.click();
    await expect(page.locator('section[data-page="5"]')).toHaveClass(/active/);
  }
});
