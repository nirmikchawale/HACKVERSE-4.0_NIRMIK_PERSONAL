import {test,expect} from '@playwright/test';

// FE-02/03 farmer-first checks. No fake data is served by production.
// Technical regression suites continue to run with their existing Detailed View.
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.removeItem('agri-experience-v1');
    localStorage.removeItem('unlockplan-page01-v1');
    localStorage.removeItem('agri-cotton-weight-v2');
    localStorage.removeItem('unlockplan-full-extras');
  });
});
test('Home clearly explains purpose and cotton scope, with full Detailed View preserved',async({page})=>{
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-experience','farmer');
  await expect(page.locator('.fv2-home-name')).toHaveText('AgriForesight');
  await expect(page.locator('#farmerPurpose')).toContainText('picked cotton');
  await expect(page.locator('#farmerCrop')).toContainText('already-picked cotton');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#farmerWeatherV2')).toBeVisible();
  await expect(page.locator('section[data-page="1"] .weather-layout')).toBeHidden();
  await expect(page.locator('#farmerFinishTime')).toBeVisible();
  await expect(page.locator('#farmerWeatherV2')).toContainText('not rain measured on your farm');
  await page.locator('#experienceSwitch button').nth(1).click();
  await expect(page.locator('body')).toHaveAttribute('data-experience','detailed');
  await expect(page.locator('#farmerWeatherV2')).toBeHidden();
  await expect(page.locator('section[data-page="1"] .weather-layout')).toBeVisible();
  await expect(page.locator('#weatherChart')).toBeVisible();
});
test('current weather unavailable is never displayed as invented live rainfall',async({page})=>{
  await page.route('**/api/forecast**',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({status:'unavailable',hours:[],notice:'No current forecast'}),
  }));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#farmerWeatherV2')).toContainText('Could not get the current forecast');
  await expect(page.locator('#farmerWeatherV2 .fw-day')).toHaveCount(0);
});
test('quintal and kilogram inputs normalize consistently without inventing work productivity',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#farmerTargetWeight').fill('10');
  await page.locator('#farmerCapacityWeight').fill('6');
  await expect(page.locator('#quantity')).toHaveValue('1000');
  await expect(page.locator('#capacity')).toHaveValue('600');
  await page.locator('#farmerWeightUnit').selectOption('kg');
  await expect(page.locator('#farmerTargetWeight')).toHaveValue('1000');
  await expect(page.locator('#farmerCapacityWeight')).toHaveValue('600');
  await expect(page.locator('#quantity')).toHaveValue('1000');
  await page.locator('#farmerWeightUnit').selectOption('quintal');
  await expect(page.locator('#farmerTargetWeight')).toHaveValue('10');
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('#farmerWeightForm')).toContainText('१ क्विंटल');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('#farmerWeightForm')).toContainText('कपास');
});
test('a farmer selects their own finish time and can continue without suggested safe-hour claims',async({page})=>{
  await page.route('**/api/forecast**',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({status:'unavailable',hours:[]}),
  }));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  const stamp=await page.evaluate(()=>{
    const future=new Date(Date.now()+5*3600000);
    const arr=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',
      day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(future);
    const obj={};arr.forEach(x=>obj[x.type]=x.value);
    return obj.year+'-'+obj.month+'-'+obj.day+'T'+obj.hour+':'+obj.minute;
  });
  await page.locator('#farmerFinishTime').fill(stamp);
  await page.locator('.fw-continue').click();
  await expect(page.locator('section.section.active')).toHaveAttribute('data-page','2');
  await expect(page.locator('#deadlineInput')).toHaveValue(stamp);
  expect(await page.evaluate(()=>state.deadline)).toBe(stamp);
});
test('real FastAPI example yields a blocked baseline and a conditional confirmed-help action plan',async({page})=>{
  test.skip(process.env.B03_INTEGRATION!=='true','Requires real local FastAPI and Cloudflare-compatible integration');
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="2"]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#farmerExample').click();
  await expect(page.locator('#resultTitle')).toContainText('BLOCKED',{timeout:20000});
  await expect(page.locator('#farmerActionV2')).toContainText('Possible change',{timeout:20000});
  await expect(page.locator('#farmerActionV2')).toContainText('4 quintals');
  await expect(page.locator('#farmerActionV2')).toContainText('After this change');
  await expect(page.locator('#farmerActionV2')).toContainText('fits');
  await expect(page.locator('section.section.active')).toHaveAttribute('data-page','4');
  await expect(page.locator('#farmerActionV2')).toContainText('educational');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#farmerRestore').click();
  await expect(page.locator('#farmerTargetWeight')).toHaveValue('');
});
