import { test, expect } from '@playwright/test';

// WXR-04: frontend visual and real navigation checks. Test does not simulate
// rainfall, certify agricultural safety, or override the server's decision.
const weather = page => page.locator('section.section[data-page="1"]');
async function openWeather(page, width=1440) {
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  const nav=width<=740?'#navMobile [data-nav="1"]':'#navDesktop [data-nav="1"]';
  await page.locator(nav).click();
  await expect(weather(page)).toHaveClass(/active/);
  await expect(page.locator('#deadlineGuideContinue')).toBeVisible();
}
const boxes = async page => page.evaluate(() => {
 const root=document.querySelector('section.section[data-page="1"]');
 const rect=sel=>{
   const el=root.querySelector(sel);
   if(!el) throw Error('Missing '+sel);
   const r=el.getBoundingClientRect();
   return {top:r.top,bottom:r.bottom,height:r.height,x:r.left,width:r.width};
 };
 return {forecast:rect('.forecast-panel'),deadline:rect('.deadline-card'),
  chart:rect('#weatherChart'),guide:rect('#deadlinePlanningGuide'),
  action:rect('#deadlineGuideContinue'),
  overflow:document.documentElement.scrollWidth>window.innerWidth+1};
});
test.describe('WXR-04 lean model and deadline panels',()=>{
 test('removes the redundant source strip and bottom disclaimer while keeping source evidence elsewhere',async({page})=>{
   await openWeather(page);
   const root=weather(page);
   await expect(root.locator('.source-strip')).toHaveCount(0);
   await expect(root.locator('.deadline-card .micro-divider')).toHaveCount(0);
   await expect(root.locator('.deadline-card [data-i18n="weatherCaution"]')).toHaveCount(0);
   await expect(root.locator('.deadline-card .goto[data-target="2"]')).toHaveCount(1);
   await expect(root.locator('.wx-guide-actions #deadlineGuideContinue')).toHaveCount(1);
   await expect(root.locator('#weatherChart')).toBeVisible();
   await expect(root.locator('#forecastSourceChip')).toBeVisible();
   await expect(root.locator('#deadlineInput')).toBeEnabled();
   await expect(page.locator('link[href="/weather-panel-compact.css"]')).toHaveCount(1);
 });
 test('the original resources action is clickable without a deadline and navigates without inventing inputs',async({page})=>{
   await openWeather(page);
   const button=page.locator('#deadlineGuideContinue');
   await expect(button).toBeEnabled();
   await expect(button).toHaveAttribute('data-target','2');
   await button.click();
   await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
   await expect(page.locator('#quantity')).toHaveValue('');
   await expect(page.locator('#resourceCheckBadge')).toHaveText('0/6');
 });
 test('re-rendering deadline guide retains one original working control',async({page})=>{
   await openWeather(page);
   const field=page.locator('#deadlineInput');
   // A future input re-renders the guide repeatedly; it must not duplicate,
   // destroy, or disable the moved original navigation button.
   const date=new Date(Date.now()+6*3600*1000);
   const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',
      month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
     .formatToParts(date);
   const val=k=>parts.find(p=>p.type===k)?.value;
   const candidate=val('year')+'-'+val('month')+'-'+val('day')+'T'+val('hour')+':00';
   await field.fill(candidate);
   await expect(page.locator('#deadlineGuideContinue')).toHaveCount(1);
   await expect(page.locator('#deadlineGuideSave')).toBeEnabled();
   await page.locator('#deadlineGuideSave').click();
   await expect(page.locator('#deadlineGuideContinue')).toBeEnabled();
   await page.locator('#deadlineGuideContinue').focus();
   await page.keyboard.press('Enter');
   await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
 });
 for(const width of [1649,1440,1200]){
  test('desktop '+width+'px: equal card bottoms and no unused bottom strip',async({page})=>{
    await openWeather(page,width);
    const b=await boxes(page);
    expect(Math.abs(b.forecast.top-b.deadline.top)).toBeLessThan(3);
    expect(Math.abs(b.forecast.bottom-b.deadline.bottom)).toBeLessThan(3);
    expect(b.chart.height).toBeGreaterThanOrEqual(200);
    expect(b.action.bottom).toBeLessThanOrEqual(b.deadline.bottom-4);
    expect(b.deadline.bottom-b.action.bottom).toBeLessThan(40);
    expect(b.overflow).toBe(false);
  });
 }
 for(const width of [1024,768,390]){
  test('responsive '+width+'px: natural stacking, no blank footer or side-scrolling',async({page})=>{
    await openWeather(page,width);
    const b=await boxes(page);
    expect(b.forecast.bottom).toBeLessThan(b.deadline.top);
    expect(b.overflow).toBe(false);
    await expect(weather(page).locator('#deadlineGuideContinue')).toBeEnabled();
    await expect(weather(page).locator('#deadlineGuideContinue')).toHaveCount(1);
    await weather(page).locator('#deadlineGuideContinue').click();
    await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
  });
 }
});
