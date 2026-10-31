import { expect, test } from '@playwright/test';

// No route interception in this suite: the Vite preview proxy forwards
// browser requests into a genuine FastAPI/Uvicorn process in GitHub CI.
test.describe('B-03 genuine FastAPI and browser integration', () => {
  test.skip(process.env.B03_INTEGRATION !== 'true', 'Requires running genuine FastAPI at 127.0.0.1:8000.');

  const baseCase = () => ({
    now: new Date().toISOString(),
    deadline: '2099-01-01T12:00:00+05:30',
    target_units: 10, capacity_units: 6, required_hours: 4, readiness: 'yes',
    unit: 'handling_unit', completed: false, baseline_resource_ids: [], changes: [
      {
        id: 'resource-A', type: 'add_capacity', value: 4, unit: 'handling_unit',
        availability: 'available', confirmation_state: 'confirmed',
        resource_id: 'separate-confirmed-cover', cost: null,
      },
    ],
  });

  test('six real API paths, request validations and manual comparison', async ({ request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    const h = await health.json();
    expect(h.ok).toBe(true);
    expect(h.disclaimer).toContain('Not field validated');

    const sources = await request.get('/api/sources');
    expect(sources.status()).toBe(200);
    const refs = await sources.json();
    expect(refs.sources.length).toBeGreaterThan(0);
    expect(refs.input_categories).toContain('user-reported');

    const forecast = await request.get('/api/forecast');
    expect(forecast.status()).toBe(200);
    const weather = await forecast.json();
    expect(['retrieved_live','cached_recent','stale_cache','unavailable']).toContain(weather.status);
    if (weather.status === 'retrieved_live' || weather.status === 'cached_recent') {
      expect(weather.validated.timezone).toBe('Asia/Kolkata');
      expect(weather.validated.units.precipitation).toBe('mm');
      expect(weather.attribution).toContain('Open-Meteo');
      expect(weather.hours.length).toBeGreaterThan(0);
    } else if (weather.status === 'unavailable') {
      expect(weather.hours).toEqual([]);
    }

    const original = baseCase();
    const r = await request.post('/api/evaluate', { data: original });
    expect(r.status()).toBe(200);
    const evaluated = await r.json();
    expect(evaluated.status).toBe('blocked');
    expect(evaluated.baseline.shortfall_units).toBe(4);
    expect(evaluated.packages.map(p => p.change_ids)).toContainEqual(['resource-A']);

    const after = { ...original, capacity_units: 10 };
    const compared = await request.post('/api/compare', { data: { before: original, after } });
    expect(compared.status()).toBe(200);
    const comparison = await compared.json();
    expect(comparison.changes.changed_fields).toContain('capacity_units');
    expect(comparison.after.status).toBe('feasible');

    const bad = await request.post('/api/evaluate', { data: { ...original, capacity_units: -10 } });
    expect(bad.status()).toBe(422);
    const malformed = await request.post('/api/replan', { data: { before: original, after, selected_hour_local: 'not-an-hour' } });
    expect(malformed.status()).toBe(422);

    const candidates = (weather.hours ?? []).filter(
      item => new Date(item.time + ':00+05:30').getTime() > Date.now() + 60_000,
    );
    if ((weather.status === 'retrieved_live' || weather.status === 'cached_recent') && candidates.length) {
      const hour = candidates[0].time;
      const replanned = await request.post('/api/replan', { data: { before: original, after, selected_hour_local: hour } });
      // A source-current forecast must be accepted by the server on this
      // same-process local integration path. This test does not replace
      // missing genuine weather with a fixture.
      expect(replanned.status()).toBe(200);
      const data = await replanned.json();
      expect(data.forecast_selection.selected_hour_local).toBe(hour);
      expect(data.forecast_selection.forecast_status).toMatch(/retrieved_live|cached_recent/);
      expect(data.forecast_selection.attribution).toContain('Open-Meteo');
      expect(data.after.baseline.time_budget.candidate_deadline).toContain(hour + ':00+05:30');
    }
  });


test('unified desktop uses genuine FastAPI and returns minimal packages',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#apiConnectionStatus')).toContainText('FastAPI connected',{timeout:25000});
 await expect(page.locator('#sourceLedger .source-entry').first()).toBeVisible();
 await page.locator('#navDesktop [data-nav="1"]').click();await page.locator('#deadlineInput').fill('2099-01-01T12:00');await page.locator('#saveDeadline').click();
 await page.locator('#navDesktop [data-nav="2"]').click();await page.locator('#quantity').fill('10');await page.locator('#capacity').fill('6');
 await page.locator('#duration').fill('1');await page.locator('#readiness').selectOption('yes');
 await page.locator('#confirmInputs').check();await page.locator('#saveResources').click();
 await page.locator('#addChange').click();await page.locator('#changeEditor [data-x=amount]').fill('4');
 await page.locator('#changeEditor [data-x=rid]').fill('genuine-extra');
 await page.locator('#changeEditor [data-x=availability]').selectOption('confirmed');
 await page.locator('#navDesktop [data-nav="3"]').click();await page.locator('#runAssessment').click();
 await expect(page.locator('#resultTitle')).toHaveText('API VERIFIED · BLOCKED',{timeout:20000});
 await expect(page.locator('#packageList .package-card')).toHaveCount(1);
 await page.locator('#navDesktop [data-nav="4"]').click();await page.locator('#packageList .package-card').click();await page.locator('#compareApi').click();
 await expect(page.locator('#comparePanel')).toContainText('Backend comparison',{timeout:20000});
 expect(errors).toEqual([]);
});
test('unified mobile actual API status and no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('#apiConnectionStatus')).toContainText('FastAPI connected',{timeout:25000});
 await expect(page.locator('#navMobile [data-nav]')).toHaveCount(6);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
});
test('current forecast is labelled or unavailable without fabrication',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#forecastSourceChip')).not.toHaveText('FETCHING',{timeout:25000});
 const status=(await page.locator('#forecastSourceChip').textContent())||'';
 expect(['LIVE MODEL FORECAST','RECENT VERIFIED CACHE','UNAVAILABLE','NOT CONNECTED','STALE · DO NOT USE']).toContain(status);
 if(status==='LIVE MODEL FORECAST'||status==='RECENT VERIFIED CACHE')
  await expect(page.locator('#weatherChart .live-provenance')).toContainText('Open-Meteo');
 else await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
});
});
