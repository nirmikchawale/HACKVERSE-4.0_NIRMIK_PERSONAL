import {test,expect} from '@playwright/test';
// WXR-04 companion tests: compact layout and guarded single-save. No forecast mocks.
async function weather(page,width=1440){
 await page.setViewportSize({width,height:900});await page.goto('/');
 await page.locator((width<=740?'#navMobile':'#navDesktop')+' [data-nav="1"]').click();
 await expect(page.locator('section.section[data-page="1"]')).toHaveClass(/active/);
}
test('one candidate Save and one gated Continue, with no static stepper',async({page})=>{
 await weather(page);
 const root=page.locator('.wx-workspace-compact');
 await expect(root.locator('#saveDeadline')).toHaveCount(1);
 await expect(root.locator('#deadlineGuideSave')).toHaveCount(0);
 await expect(root.locator('#deadlineGuideContinue')).toHaveCount(1);
 await expect(root.locator('.wx-guide-steps,.source-strip,.network-evidence')).toHaveCount(0);
 await expect(page.locator('#deadlineGuideContinue')).toBeEnabled();
 await expect(page.locator('#saveDeadline')).toBeDisabled();
 await page.locator('#deadlineInput').fill('2099-01-01T12:00');
 await expect(page.locator('#saveDeadline')).toBeEnabled();
 await page.locator('#saveDeadline').click();
 await expect(page.locator('#deadlineGuideContinue')).toBeEnabled();
 await page.locator('#deadlineGuideContinue').click();
 await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
});
test('two compact cards align on desktop, receipt remains outside',async({page})=>{
 await weather(page,1440);
 const box=page.locator('.wx-workspace-compact');
 const a=await box.locator('.forecast-panel').boundingBox();
 const b=await box.locator('.deadline-card').boundingBox();
 expect(Math.abs(a.width-b.width)).toBeLessThanOrEqual(3);
 expect(Math.abs(a.height-b.height)).toBeLessThanOrEqual(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await expect(page.locator('#weatherNetworkDetails')).toBeAttached();
});
test('phone layout stacks without full-page horizontal scrolling',async({page})=>{
 await weather(page,390);
 const a=await page.locator('.wx-workspace-compact .forecast-panel').boundingBox();
 const b=await page.locator('.wx-workspace-compact .deadline-card').boundingBox();
 expect(a.y+a.height).toBeLessThan(b.y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await expect(page.locator('#deadlineInput')).toBeEnabled();
});
