import {expect,test} from '@playwright/test';
test('Cloudflare-style grouped sidebar has functional search and exact six destinations',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 await expect(page.locator('#navDesktop [data-nav]')).toHaveCount(6);
 await expect(page.locator('#navDesktop .nav-group-label')).toHaveCount(4);
 await expect(page.locator('.rail .brand-logo')).toBeVisible();
 await expect(page.locator('#railSearch')).toBeVisible();
 await page.keyboard.press('Control+k');
 await expect(page.locator('#railSearch')).toBeFocused();
 await page.locator('#railSearch').fill('feasibility');
 await expect(page.locator('#navDesktop button[data-nav]:visible')).toHaveCount(1);
 await expect(page.locator('#navDesktop button[data-nav="3"]')).toBeVisible();
 await page.locator('#railSearch').press('Enter');
 await expect(page.locator('.section[data-page="3"]')).toHaveClass(/active/);
 await page.locator('#railSearch').fill('not-a-page');
 await expect(page.locator('#navDesktop button[data-nav]:visible')).toHaveCount(0);
 await expect(page.locator('#railSearchFeedback')).toContainText('0 matching pages');
 await page.locator('#railSearch').press('Escape');
 await expect(page.locator('#navDesktop button[data-nav]:visible')).toHaveCount(6);
});
test('Material 3 type scale and Android/Apple system fonts cover every dashboard page',async({page})=>{
 await page.goto('/');
 const values=await page.evaluate(()=>{
  const root=getComputedStyle(document.documentElement);
  const body=getComputedStyle(document.body);
  return {root:parseFloat(root.fontSize),body:parseFloat(body.fontSize),
    title:parseFloat(root.getPropertyValue('--m3-title-large')),
    bodyName:root.getPropertyValue('--af-font')};
 });
 expect(values.root).toBe(16);
 expect(values.body).toBeGreaterThanOrEqual(16);
 expect(values.bodyName).toContain('Roboto');
 expect(values.bodyName).toContain('-apple-system');
 for(let i=0;i<6;i++){
   await page.locator('#navDesktop button[data-nav="'+i+'"]').click();
   await expect(page.locator('.section[data-page="'+i+'"] h1')).toBeVisible();
 }
});
test('mobile still has six accessible pages and readable labels',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('.rail')).toBeHidden();
 await expect(page.locator('#navMobile [data-nav]')).toHaveCount(6);
 const fs=await page.locator('#navMobile button span:last-child').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
 expect(fs).toBeGreaterThanOrEqual(11);
 await page.locator('#navMobile [data-nav="5"]').click();
 await expect(page.locator('.section[data-page="5"]')).toHaveClass(/active/);
});
