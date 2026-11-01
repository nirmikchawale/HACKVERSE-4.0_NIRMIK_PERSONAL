import {expect,test} from '@playwright/test';
async function smoke(page,width,height,label){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height});
 expect((await page.goto('/',{waitUntil:'domcontentloaded'}))?.status()).toBe(200);
 await expect(page).toHaveTitle(/Agri Foresight/);
 await expect(page.locator('.brand-logo')).toHaveAttribute('src','/agri-foresight-logo.webp');
 if(width<=740)await expect(page.locator('.mobile-brand-logo')).toBeVisible();
 const imageLoaded=await page.locator(width<=740?'.mobile-brand-logo':'.brand-logo').evaluate(img=>img.complete&&img.naturalWidth>0);
 expect(imageLoaded).toBe(true);
 await expect(page.locator('section.section')).toHaveCount(6);
 await expect(page.locator('#navDesktop [data-nav]')).toHaveCount(6);
 await expect(page.locator('#runAssessment')).toHaveText('Evaluate using FastAPI');
 await expect(page.locator('#toggleForecast')).toHaveText(/Refresh (live )?forecast/);
 await expect(page.locator('#sourceLedger')).toBeAttached();
 await expect(page.locator('#resultTitle')).toHaveText('Not evaluated');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/b01-'+label+'.png',fullPage:true});
}
test('desktop six-screen UI',async({page})=>smoke(page,1440,900,'desktop'));
test('mobile six-screen UI',async({page})=>smoke(page,390,844,'mobile'));
