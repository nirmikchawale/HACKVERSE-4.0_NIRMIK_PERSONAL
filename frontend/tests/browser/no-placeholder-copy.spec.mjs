import {expect,test} from '@playwright/test';
test('connected six-page MVP avoids stale prototype and simulated-data claims',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#apiConnectionStatus')).not.toContainText('connecting…',{timeout:25000});
 const obsolete=/design prototype|standalone prototype|run local preview|show sample timeline|not connected in preview|this preview uses local drafts|no live weather or backend calculation is connected/i;
 for(let i=0;i<6;i++){
   await page.locator('#navDesktop [data-nav="'+i+'"]').click();
   const visible=await page.locator('body').innerText();
   expect(visible).not.toMatch(obsolete);
 }
 // No hidden/demo weather series should appear in the absence of verified provider data.
 await page.locator('#navDesktop [data-nav="1"]').click();
 await expect(page.locator('#forecastSourceChip')).not.toContainText('SAMPLE');
});
