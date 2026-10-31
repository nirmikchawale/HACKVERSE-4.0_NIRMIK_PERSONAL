import { expect, test } from '@playwright/test';

// SYNTHETIC_TEST_ONLY. Fixtures are intercepted by Playwright; never live data.
const now = new Date().toISOString();
const futureLocal = () => {
  const d = new Date(Date.now() + 48 * 3600 * 1000);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const val = key => parts.find(p => p.type === key)?.value;
  return val('year') + '-' + val('month') + '-' + val('day') + 'T' + val('hour') + ':00';
};
const sampleForecast = () => ({
  status: 'retrieved_live',
  retrieved_at_utc: now, forecast_age_hours: 0,
  validated: { timezone: 'Asia/Kolkata', units: { time: 'iso8601', precipitation: 'mm', precipitation_probability: '%' } },
  hours: [{ time: futureLocal(), precipitation_mm: 0.8, precipitation_probability_pct: 30 }],
  source: 'Open-Meteo public model forecast', attribution: 'Open-Meteo.com CC BY 4.0',
  notice: 'External model forecast; no safety threshold.',
});
const assessment = (status, shortfall, capacity, target) => ({
  status, constraints: [
    { id: 'readiness', status: 'pass', explanation: 'Farmer-declared ready. Not safety certification.', provenance: 'user-reported' },
    { id: 'capacity', status: shortfall ? 'blocked' : 'pass', explanation: 'Declared quantities.', provenance: 'user-reported + configured assumption' },
    { id: 'timing', status: 'pass', explanation: 'User-selected candidate deadline.', provenance: 'user-reported + configured assumption' },
  ],
  known_blockers: shortfall ? ['capacity'] : [],
  time_budget: {
    candidate_deadline: '2099-01-01T12:00:00+05:30', evaluated_at: now,
    available_hours: 100, required_hours: 4, time_slack_hours: 96, basis: 'user-selected deadline',
  },
  projected_capacity_units: capacity, projected_target_units: target,
  original_target_unhandled_units: 0, shortfall_units: shortfall,
});
const sampleEvaluation = () => ({
  status: 'blocked', message: 'One declared capacity constraint is blocked.',
  meaning: 'resource-feasibility only; no agricultural safety certification', unit: 'handling_unit',
  baseline: assessment('blocked', 4, 6, 10),
  packages: [{
    change_ids: ['option-1'], projected: assessment('feasible', 0, 10, 10),
    objective_changed: false, warning: 'Projected only; capacity availability is not completion.',
  }],
  excluded_changes: [],
});
async function fillForm(page) {
  await page.locator('#target').fill('10');
  await page.locator('#capacity').fill('6');
  await page.locator('#hours').fill('4');
  await page.locator('#deadline').fill('2099-01-01T12:00');
  await page.locator('#readiness').selectOption('yes');
  await page.locator('#input-confirm').check();
}
test('B-02 shows honest fallback and never invents an engine result', async ({ page }) => {
  await page.route('**/api/forecast', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Source not connected' }),
  }));
  await page.route('**/api/evaluate', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Backend is not connected' }),
  }));
  await page.goto('/');
  await expect(page.locator('#forecast-status')).toHaveText('API not connected');
  await expect(page.locator('#forecast-hours')).not.toContainText('0.8 mm');
  await fillForm(page);
  await page.locator('#evaluate').click();
  await expect(page.locator('#result-status')).toHaveText('Calculation unavailable');
  await expect(page.locator('#result-content')).toContainText('Backend is not connected');
  await expect(page.locator('#result-content')).not.toContainText('Feasible under declared assumptions');
});
test('B-02 only offers candidate hours when source metadata validates', async ({ page }) => {
  await page.route('**/api/forecast', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(sampleForecast()),
  }));
  await page.goto('/');
  await expect(page.locator('#forecast-status')).toHaveText('Retrieved live');
  await expect(page.locator('.hour-cell')).toHaveCount(1);
  await expect(page.locator('.hour-cell')).toContainText('0.8 mm');
  await page.getByRole('button', { name: 'Use as candidate deadline' }).click();
  await expect(page.locator('#deadline')).toHaveValue(futureLocal());
  await expect(page.locator('#deadline-origin')).toContainText('not an agronomic threshold');
});
test('B-02 sends user inputs and renders only backend-returned packages', async ({ page }) => {
  let submitted;
  await page.route('**/api/forecast', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ status: 'unavailable', hours: [], notice: 'No network forecast' }),
  }));
  await page.route('**/api/evaluate', route => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sampleEvaluation()) });
  });
  await page.goto('/');
  await fillForm(page);
  await page.locator('#add-option').click();
  await page.locator('.opt-amount').fill('4');
  await page.locator('.opt-resource').fill('cover-from-farmer');
  await page.locator('.opt-availability').selectOption('available');
  await page.locator('.opt-confirmation').selectOption('confirmed');
  await page.locator('#evaluate').click();
  await expect(page.locator('#result-status')).toHaveText('BLOCKED');
  await expect(page.locator('.package-card')).toHaveCount(1);
  expect(submitted?.unit).toBe('handling_unit');
  expect(submitted?.target_units).toBe(10);
  expect(submitted?.capacity_units).toBe(6);
  expect(submitted?.deadline).toBe('2099-01-01T12:00:00+05:30');
  expect(submitted?.changes).toEqual([{
    id: 'option-1', type: 'add_capacity', value: 4, resource_id: 'cover-from-farmer',
    availability: 'available', confirmation_state: 'confirmed', unit: 'handling_unit', cost: null,
  }]);
  await page.getByRole('button', { name: 'Select conditional option' }).click();
  await expect(page.locator('#selection-content')).toContainText('Selected conditional option: option-1');
  await page.locator('#capacity').fill('7');
  await expect(page.locator('#result-status')).toHaveText('Not evaluated');
  await expect(page.locator('.package-card')).toHaveCount(0);
});
test('B-02 rejects missing declarations and malformed API responses', async ({ page }) => {
  await page.route('**/api/forecast', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ status: 'retrieved_live', hours: [{ time: futureLocal(), precipitation_mm: -3, precipitation_probability_pct: 900 }] }),
  }));
  await page.route('**/api/evaluate', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'feasible', message: 'Untrusted malformed response' }),
  }));
  await page.goto('/');
  await expect(page.locator('#forecast-status')).toHaveText('API not connected');
  await page.locator('#evaluate').click();
  await expect(page.locator('#form-error')).toContainText('Confirm the quantities');
  await fillForm(page);
  await page.locator('#evaluate').click();
  await expect(page.locator('#result-status')).toHaveText('Calculation unavailable');
  await expect(page.locator('#result-content')).toContainText('invalid response');
  await expect(page.locator('#result-content')).not.toContainText('Feasible under declared assumptions');
});
