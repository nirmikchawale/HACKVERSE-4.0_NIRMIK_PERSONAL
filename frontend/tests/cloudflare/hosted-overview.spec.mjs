import {test,expect} from '@playwright/test';

function futureIST(hoursAhead){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(Date.now()+hoursAhead*3600000));
  const k=id=>parts.find(p=>p.type===id)?.value;
  return k('year')+'-'+k('month')+'-'+k('day')+'T'+k('hour')+':00';
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear()});
});
test('public Cloudflare preview serves four populated source-aware cards, actual APIs and a responsive snapshot',async({page,request})=>{
  const [health,forecast]=await Promise.all([
    request.get('/api/health'),request.get('/api/forecast')
  ]);
  expect(health.status()).toBe(200);
  expect((await health.json()).ok).toBe(true);
  expect(forecast.status()).toBe(200);
  const model=await forecast.json();
  expect(['retrieved_live','cached_recent']).toContain(model.status);
  expect(model.validated?.timezone).toBe('Asia/Kolkata');
  expect(model.validated?.units?.precipitation).toBe('mm');
  expect(model.attribution).toContain('Open-Meteo');
  expect(model.hours.length).toBeGreaterThan(24);
  await page.setViewportSize({width:1440,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  expect((await page.goto('/'))?.status()).toBe(200);
  await expect(page.locator('#apiConnectionStatus')).toContainText('FastAPI connected');
  await expect(page.locator('section.section')).toHaveCount(6);
  const overview=page.locator('section[data-page="0"]');
  await expect(overview.locator('.kpi')).toHaveCount(4);
  await expect(page.locator('#weatherValue')).not.toHaveText(/Checking Open-Meteo|Refresh weather evidence/);
  await expect(page.locator('#weatherEvidenceNote')).toContainText('Open-Meteo');
  await expect(page.locator('#deadlineValue')).toHaveText('24h model outlook');
  await expect(page.locator('#resourcesValue')).toHaveText('4 planning inputs');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  await expect(page.locator('#snapshotPlace')).toContainText('Jalna');
  await expect(page.locator('#snapshotDeadline')).toContainText('6 / 12 / 24h');
  await expect(page.locator('#snapshotResource')).toContainText('Target');
  await expect(page.locator('#snapshotAssessment')).toContainText('Engine ready');
  await expect(overview.locator('.kpis')).not.toContainText(/Not entered|Not selected|Not evaluated/);
  const left=await overview.locator('.lower > div > .panel').nth(0).boundingBox();
  const right=await overview.locator('.lower > div > .panel').nth(1).boundingBox();
  expect(Math.abs((left.y+left.height)-(right.y+right.height))).toBeLessThanOrEqual(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/cloudflare-hosted/overview-desktop.png',fullPage:true});
});
test('live Cloudflare FastAPI response updates card four and preparation assessment without invented farmer inputs',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill(futureIST(7));
  await page.locator('#saveDeadline').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#quantity').fill('10');
  await page.locator('#capacity').fill('6');
  await page.locator('#duration').fill('1');
  await page.locator('#readiness').selectOption('yes');
  await page.locator('#confirmInputs').check();
  await page.locator('#saveResources').click();
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#runAssessment').click();
  await expect(page.locator('#resultTitle')).toHaveText('API VERIFIED · BLOCKED',{timeout:30000});
  await page.locator('#navDesktop [data-nav="0"]').click();
  await expect(page.locator('#resourcesValue')).toContainText('6 / 10');
  await expect(page.locator('#feasibilityValue')).toContainText('BLOCKED');
  await expect(page.locator('#feasibilityEvidenceNote')).toContainText('4 unit shortfall');
  await expect(page.locator('#snapshotAssessment')).toContainText('FastAPI · BLOCKED');
  await page.screenshot({path:'test-results/cloudflare-hosted/overview-after-real-api.png',fullPage:true});
});
test('Cloudflare hosted mobile cards remain readable without horizontal scrolling',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  await expect(page.locator('#weatherValue')).not.toContainText('Not loaded');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.screenshot({path:'test-results/cloudflare-hosted/overview-mobile.png',fullPage:true});
});
