import { test, expect } from '@playwright/test';

const preview = new URL(process.env.VERCEL_PREVIEW_URL);
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!secret) throw new Error('Missing reviewer-approved preview credential.');
const headers = { 'x-vercel-protection-bypass': secret };
const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

// Restrict the bypass header to this exact HTTPS preview origin; never send it to external sources.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== preview.origin) {
      await route.continue();
    } else {
      await route.continue({ headers: { ...route.request().headers(), ...headers } });
    }
  });
});

function testCase() {
  return {
    now: new Date().toISOString(),
    deadline: '2099-01-01T12:00:00+05:30',
    target_units: 10, capacity_units: 6, required_hours: 4, readiness: 'yes',
    unit: 'handling_unit', completed: false, baseline_resource_ids: [],
    changes: [{
      id:'int03-A', type:'add_capacity', value:4, unit:'handling_unit',
      availability:'available', confirmation_state:'confirmed',
      resource_id:'int03-test-confirmed-unique', cost:null,
    }],
  };
}

test('protected deployed APIs: six real routes and three genuine POSTs', async ({ request }) => {
  // Disable redirects: otherwise Vercel's login HTML can masquerade as HTTP 200.
  const get = (path) => request.get(preview.origin + path, {headers,maxRedirects:0});
  const post = (path,data) => request.post(preview.origin + path, {headers:jsonHeaders,data});

  const health = await get('/api/health');
  // HTTP 200 can mean a Vercel login HTML page; require real JSON as well.
  expect(health.status(), 'Vercel preview protection should accept owner-approved authorization').toBe(200);
  expect(health.headers()['content-type'] ?? '',
    'INT03_AUTHORIZATION_DENIED: expected FastAPI JSON; HTML means Vercel protection/login, invalid or stale bypass credential, or an unexpected redirect.').toContain('application/json');
  const h = await health.json();
  expect(h.ok).toBe(true);
  expect(h.disclaimer).toContain('Not field validated');

  const src = await get('/api/sources');
  expect(src.status()).toBe(200);
  expect((await src.json()).sources.length).toBeGreaterThan(0);

  const forecast = await get('/api/forecast');
  expect(forecast.status()).toBe(200);
  const weather = await forecast.json();
  expect(['retrieved_live','cached_recent','stale_cache','unavailable']).toContain(weather.status);
  if (['retrieved_live','cached_recent'].includes(weather.status)) {
    expect(weather.hours.length).toBeGreaterThan(0);
    expect(weather.attribution).toContain('Open-Meteo');
    expect(weather.validated.timezone).toBe('Asia/Kolkata');
    expect(weather.validated.units.precipitation).toBe('mm');
  }

  const schema = await get('/openapi.json');
  expect(schema.status()).toBe(200);
  const paths = Object.keys((await schema.json()).paths);
  for (const name of ['/api/health','/api/sources','/api/forecast','/api/evaluate','/api/compare','/api/replan']) {
    expect(paths).toContain(name);
  }

  // Explicit SYNTHETIC_TEST_ONLY abstract inputs are used only by automation.
  const before = testCase();
  const after = {...before, capacity_units:10};
  const evaluated = await post('/api/evaluate',before);
  expect(evaluated.status()).toBe(200);
  const ev=await evaluated.json();
  expect(ev.status).toBe('blocked');
  expect(ev.baseline.shortfall_units).toBe(4);
  expect(ev.packages.map(p=>p.change_ids)).toContainEqual(['int03-A']);

  const compared = await post('/api/compare',{before,after});
  expect(compared.status()).toBe(200);
  const cmp=await compared.json();
  expect(cmp.changes.status_before).toBe('blocked');
  expect(cmp.changes.status_after).toBe('feasible');
  expect(cmp.changes.changed_fields).toContain('capacity_units');

  const bad=await post('/api/evaluate',{...before,capacity_units:-1});
  expect(bad.status()).toBe(422);
  const malformed=await post('/api/replan',{before,after,selected_hour_local:'INVALID'});
  expect(malformed.status()).toBe(422);

  const candidates=(weather.hours??[]).filter(row=>
    new Date(row.time+':00+05:30').getTime()>Date.now()+60_000);
  if (['retrieved_live','cached_recent'].includes(weather.status)&&candidates.length) {
    const chosen=candidates[0].time;
    const replanned=await post('/api/replan',{before,after,selected_hour_local:chosen});
    expect(replanned.status(), 'Deployed replan must verify current forecast across serverless invocations').toBe(200);
    const body=await replanned.json();
    expect(body.forecast_selection.selected_hour_local).toBe(chosen);
    expect(body.forecast_selection.attribution).toContain('Open-Meteo');
  } else {
    const response=await post('/api/replan',{before,after,selected_hour_local:'2099-01-01T12:00'});
    expect([409,422]).toContain(response.status());
  }
});

for (const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
  test('authenticated deployed '+viewport.name+' UI: native Python assessment and comparison', async ({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Vercel's documented browser flow uses a short-lived bypass cookie.
    // Request only the pinned preview origin; never follow cross-origin redirects
    // or store an authenticated browser state as an artifact.
    const auth = await page.context().request.get(preview.origin+'/', {
      headers: {...headers,'x-vercel-set-bypass-cookie':'true'},
      maxRedirects:0,
    });
    const cookies = await page.context().cookies(preview.origin);
    const granted = cookies.some(c => c.name === '_vercel_jwt' &&
      c.secure && (c.domain.startsWith('.') ? c.domain.slice(1) : c.domain) === preview.hostname);
    if (!granted) {
      throw new Error('INT03_AUTHORIZATION_DENIED: bypass did not establish the required Vercel browser cookie. '+
        'HTTP '+auth.status()+'; content-type '+(auth.headers()['content-type']||'unknown')+
        '. Check the copied Vercel token matches this project and has not been rotated; '+
        'do not rerun before correcting authorization.');
    }
    const response=await page.goto(preview.origin+'/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#api-health')).toContainText('FastAPI /api/health: connected');
    await expect(page.locator('#source-register .source-entry').first()).toBeVisible();
    await expect(page.locator('#comparison-panel')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    expect(overflow,'No horizontal overflow at '+viewport.width+'px').toBe(false);

    await page.locator('#deadline').fill('2099-01-01T12:00');
    await page.locator('#target').fill('10');
    await page.locator('#capacity').fill('6');
    await page.locator('#hours').fill('4');
    await page.locator('#readiness').selectOption('yes');
    await page.locator('#input-confirm').check();
    await page.locator('#add-option').click();
    await page.locator('.opt-amount').fill('4');
    await page.locator('.opt-resource').fill('int03-browser-resource');
    await page.locator('.opt-availability').selectOption('available');
    await page.locator('.opt-confirmation').selectOption('confirmed');
    await page.locator('#evaluate').click();
    await expect(page.locator('#result-status')).toHaveText('BLOCKED');
    await expect(page.locator('.package-card')).toHaveCount(1);
    await page.locator('#capacity').fill('10');
    await page.locator('#evaluate').click();
    await expect(page.locator('#result-status')).toHaveText('FEASIBLE');
    await expect(page.locator('#comparison-content')).toContainText('BLOCKED → FEASIBLE');
    await expect(page.locator('#comparison-content')).toContainText('Resolved blockers: capacity');
    expect(errors).toEqual([]);
  });
}
