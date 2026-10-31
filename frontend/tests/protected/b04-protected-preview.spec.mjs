import { expect, test } from '@playwright/test';

const target = new URL(process.env.B04_PREVIEW_URL);
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!secret || target.protocol !== 'https:' || !target.hostname.endsWith('.vercel.app'))
  throw new Error('B-04 requires verified exact-preview origin and private CI credentials.');

const buildCase = (capacity = 6, now = new Date().toISOString(), deadline = new Date(Date.now()+86400000).toISOString()) => ({
  target_units: 10, capacity_units: capacity, required_hours: 1, readiness: 'yes',
  now, deadline, completed: false, unit: 'handling_unit', baseline_resource_ids: [],
  changes: [{ id: 'b04-A', type: 'add_capacity', value: 4, unit: 'handling_unit',
    availability: 'available', confirmation_state: 'confirmed',
    resource_id: 'distinct-b04-extra', cost: null }],
});

test('deployed FastAPI six routes: real evaluation, comparison, forecast replan and validation', async ({ playwright }) => {
  const api = await playwright.request.newContext({
    baseURL: target.origin,
    extraHTTPHeaders: { 'x-vercel-protection-bypass': secret, Accept: 'application/json' },
  });
  try {
    const get = async path => api.get(path, { maxRedirects: 0 });
    const post = async (path, data) => api.post(path, { data, maxRedirects: 0 });
    const health = await get('/api/health');
    expect(health.status()).toBe(200);
    expect(health.headers()['content-type']).toContain('application/json');
    expect((await health.json()).ok).toBe(true);

    const registry = await get('/api/sources');
    expect(registry.status()).toBe(200);
    expect((await registry.json()).sources.length).toBeGreaterThan(0);
    const schema = await get('/openapi.json');
    expect(schema.status()).toBe(200);
    const paths = (await schema.json()).paths;
    for (const name of ['/api/health','/api/sources','/api/forecast','/api/evaluate','/api/compare','/api/replan'])
      expect(paths).toHaveProperty(name);

    const forecast = await get('/api/forecast');
    expect(forecast.status()).toBe(200);
    const weather = await forecast.json();
    expect(['retrieved_live','cached_recent','stale_cache','unavailable']).toContain(weather.status);
    if (weather.status === 'retrieved_live' || weather.status === 'cached_recent') {
      expect(weather.validated.timezone).toBe('Asia/Kolkata');
      expect(weather.validated.units.precipitation).toBe('mm');
      expect(weather.validated.units.precipitation_probability).toBe('%');
      expect(weather.request_url).toMatch(/^https:\/\/api\.open-meteo\.com\//);
      expect(weather.attribution).toContain('Open-Meteo');
    } else if (weather.status === 'unavailable') expect(weather.hours).toEqual([]);

    const before = buildCase();
    const after = buildCase(10,before.now,before.deadline);
    const evaluated = await post('/api/evaluate',before);
    expect(evaluated.status()).toBe(200);
    const evalData=await evaluated.json();
    expect(evalData.status).toBe('blocked');
    expect(evalData.baseline.shortfall_units).toBe(4);
    expect(evalData.packages.some(p=>p.change_ids.includes('b04-A'))).toBe(true);

    const comparison = await post('/api/compare',{before,after});
    expect(comparison.status()).toBe(200);
    const diff=await comparison.json();
    expect(diff.after.status).toBe('feasible');
    expect(diff.changes.changed_fields).toContain('capacity_units');

    const invalid = await post('/api/evaluate',{...before,capacity_units:-1});
    expect(invalid.status()).toBe(422);
    expect((await invalid.json()).detail).toBeTruthy();
    const badHour = await post('/api/replan',{before,after,selected_hour_local:'bad-hour'});
    expect(badHour.status()).toBe(422);

    const future = (weather.hours ?? []).find(h => Date.parse(h.time+':00+05:30') > Date.now()+7200000);
    if ((weather.status==='retrieved_live'||weather.status==='cached_recent') && future) {
      const replanned=await post('/api/replan',{before,after,selected_hour_local:future.time});
      expect(replanned.status()).toBe(200);
      const data=await replanned.json();
      expect(data.forecast_selection.selected_hour_local).toBe(future.time);
      expect(data.forecast_selection.attribution).toContain('Open-Meteo');
      expect(data.forecast_selection.forecast_status).toMatch(/retrieved_live|cached_recent/);
    } else {
      console.log('Authentic forecast not current; server-attested replan cannot be certified in this run.');
      const blocked=await post('/api/replan',{before,after,selected_hour_local:'2099-01-01T00:00'});
      expect([409,422]).toContain(blocked.status());
    }
  } finally { await api.dispose(); }
});

for (const view of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
  test('real protected '+view.name+' UI evaluates and recalculates without mocks',async ({browser},testInfo)=>{
    const ctx=await browser.newContext({viewport:{width:view.width,height:view.height}});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // No mocking or fulfill; the header is only injected for this one preview origin,
    // preventing credentials leaking to external font, telemetry, or source requests.
    await page.route('**/*',route=>{
      const request=route.request();
      if(new URL(request.url()).origin!==target.origin) return route.continue();
      return route.continue({headers:{...request.headers(),'x-vercel-protection-bypass':secret}});
    });
    try {
      const response=await page.goto(target.origin+'/',{waitUntil:'domcontentloaded'});
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/UnlockPlan/);
      await expect(page.locator('h1')).toContainText('Weather changes.');
      await expect(page.locator('#api-health')).toContainText('FastAPI /api/health: connected');
      await expect(page.locator('.source-entry').first()).toBeVisible();
      await expect(page.locator('#forecast-status')).not.toHaveText('Checking source');
      for(const x of ['weather','deadline','resources','results'])
        await expect(page.locator('#'+x+'-step-state')).toBeVisible();

      await page.locator('#target').fill('10');
      await page.locator('#capacity').fill('6');
      await page.locator('#hours').fill('1');
      await page.locator('#deadline').fill('2099-01-01T12:00');
      await page.locator('#readiness').selectOption('yes');
      await page.locator('#input-confirm').check();
      await page.locator('#add-option').click();
      await page.locator('.opt-amount').fill('4');
      await page.locator('.opt-resource').fill('b04-'+view.name+'-distinct');
      await page.locator('.opt-availability').selectOption('available');
      await page.locator('.opt-confirmation').selectOption('confirmed');
      await page.locator('#evaluate').click();
      await expect(page.locator('#result-status')).toHaveText('BLOCKED');
      await expect(page.locator('.package-card')).toHaveCount(1);
      await page.locator('#capacity').fill('10');
      await page.locator('#evaluate').click();
      await expect(page.locator('#result-status')).toHaveText('FEASIBLE');
      await expect(page.locator('#result-content')).toContainText('Manual before/after comparison');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
      expect(errors).toEqual([]);
      await page.screenshot({path:testInfo.outputPath('b04-'+view.name+'.png'),fullPage:true});
    } finally {await ctx.close();}
  });
}
