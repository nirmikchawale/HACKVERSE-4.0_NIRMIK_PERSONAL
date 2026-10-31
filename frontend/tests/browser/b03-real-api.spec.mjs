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

  test('browser uses genuine health, source and evaluation API; changing inputs triggers compare', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#api-health')).toContainText('FastAPI /api/health: connected');
    await expect(page.locator('#source-register .source-entry').first()).toBeVisible();
    await page.locator('#deadline').fill('2099-01-01T12:00');
    await page.locator('#target').fill('10');
    await page.locator('#capacity').fill('6');
    await page.locator('#hours').fill('4');
    await page.locator('#readiness').selectOption('yes');
    await page.locator('#input-confirm').check();
    await page.locator('#add-option').click();
    await page.locator('.opt-amount').fill('4');
    await page.locator('.opt-resource').fill('real-typed-test-resource');
    await page.locator('.opt-availability').selectOption('available');
    await page.locator('.opt-confirmation').selectOption('confirmed');
    await page.locator('#evaluate').click();
    await expect(page.locator('#result-status')).toHaveText('BLOCKED');
    await expect(page.locator('.package-card')).toHaveCount(1);
    await expect(page.locator('#result-content')).toContainText('Python deterministic feasibility engine');
    await page.locator('#capacity').fill('10');
    await page.locator('#evaluate').click();
    await expect(page.locator('#result-status')).toHaveText('FEASIBLE');
    await expect(page.locator('#result-content')).toContainText('Manual before/after comparison');
    expect(errors).toEqual([]);
  });
  test('real browser forecast selection triggers server-attested replan when current', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    const forecastStatus = page.locator('#forecast-status');
    await expect(forecastStatus).not.toHaveText('Checking source', { timeout: 25_000 });
    const status = (await forecastStatus.textContent()) ?? '';
    if (status === 'Retrieved live' || status === 'Recent authentic cache') {
      const select = page.getByRole('button', { name: 'Use as candidate deadline' }).first();
      await expect(select).toBeVisible();
      await select.click();
      await page.locator('#target').fill('10');
      await page.locator('#capacity').fill('10');
      await page.locator('#hours').fill('1');
      await page.locator('#readiness').selectOption('yes');
      await page.locator('#input-confirm').check();
      await page.locator('#evaluate').click();
      await expect(page.locator('#result-status')).toHaveText(/FEASIBLE|BLOCKED/, { timeout: 25_000 });
      await expect(page.locator('#result-content')).toContainText('Server-attested forecast-hour replan');
      await expect(page.locator('#result-content')).toContainText('Open-Meteo');
    } else {
      // This branch certifies honest degradation, not successful weather replanning.
      await expect(page.locator('#forecast-hours button')).toHaveCount(0);
      await expect(page.locator('#forecast-message')).toContainText(/unavailable|stale|not configured|not reachable/i);
    }
  });

});
