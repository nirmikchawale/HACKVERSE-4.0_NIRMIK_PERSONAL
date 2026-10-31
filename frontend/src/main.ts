import './style.css';
import { compareCases, evaluateCase, loadForecast, loadHealth, loadSources, replanCase } from './contracts';
import type { Assessment, ChangePackage, ComparisonResponse, EvaluateRequest, EvaluationResponse, ForecastHour, ForecastResponse } from './contracts';
import { createRequest } from './plan';
import type { ChangeDraft, PlanDraft } from './plan';

const byId = <T extends HTMLElement = HTMLElement>(name: string): T => {
  const node = document.getElementById(name);
  if (!node) throw new Error('Missing UnlockPlan element: ' + name);
  return node as T;
};
const input = (name: string): HTMLInputElement => byId<HTMLInputElement>(name);
const pick = (name: string): HTMLSelectElement => byId<HTMLSelectElement>(name);
const setText = (name: string, value: string): void => { byId(name).textContent = value; };
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content?: string): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
};
const stateTag = (name: string, message: string, state: 'pending' | 'success' | 'failure'): void => {
  const node = byId(name);
  node.className = 'state-tag state-' + state;
  node.textContent = message;
};
const fmt = (value: number | null): string => value === null ? 'Unknown' :
  Number(value.toFixed(2)).toLocaleString('en-IN');
const statusLabel: Record<string, string> = {
  feasible: 'Feasible under declared assumptions',
  blocked: 'Blocked under declared assumptions',
  unknown: 'Prerequisite information unknown',
  completed: 'Action declared completed',
};

let weather: ForecastResponse | null = null;
let evaluation: EvaluationResponse | null = null;
let previousVerifiedRequest: EvaluateRequest | null = null;
let selectedHour: string | null = null;
let revision = 0;
let optionNumber = 0;
let forecastAttempt = 0;

function clearDecision(): void {
  revision++;
  evaluation = null;
  stateTag('result-status', 'Not evaluated', 'pending');
  byId('result-content').replaceChildren(make('div', 'empty-result', 'Inputs changed. Re-evaluate to receive a new calculation from the Python engine.'));
  setText('selection-content', 'No option selected. Any earlier result was cleared when inputs changed.');
}
function currentISTHour(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const val = (name: string) => parts.find(p => p.type === name)?.value ?? '';
  return val('year') + '-' + val('month') + '-' + val('day') + 'T' + val('hour') + ':' + val('minute');
}
function deadlineOriginManual(): void {
  selectedHour = null;
  const deadlineFoot = document.querySelector<HTMLElement>('.step-card:nth-child(2) .card-foot');
  if (deadlineFoot) deadlineFoot.textContent = input('deadline').value ? 'Deadline: user-selected' : 'Deadline: not selected';
  setText('deadline-origin', input('deadline').value ?
    'Manual candidate deadline selected by the user; not a certified rain-onset time.' :
    'No candidate deadline selected.');
  clearDecision();
}
function chooseForecastHour(hour: ForecastHour): void {
  input('deadline').value = hour.time;
  selectedHour = hour.time;
  const deadlineFoot = document.querySelector<HTMLElement>('.step-card:nth-child(2) .card-foot');
  if (deadlineFoot) deadlineFoot.textContent = 'Deadline: user-selected forecast hour';
  setText('deadline-origin', 'Selected from an authenticated Open-Meteo model hour (' + hour.time.replace('T', ' ') + ' IST). This is still your candidate assumption, not an agronomic threshold.');
  clearDecision();
  byId('deadline-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function showForecastHours(result: ForecastResponse): void {
  const container = byId('forecast-hours');
  container.replaceChildren();
  const current = result.status === 'retrieved_live' || result.status === 'cached_recent';
  if (!current) {
    container.append(make('p', 'empty-helper', 'Forecast-hour selection is disabled for unavailable or stale data. You can still enter a manual planning deadline.'));
    return;
  }
  const now = currentISTHour();
  const candidates = result.hours.filter(hour => hour.time >= now).slice(0, 8);
  if (!candidates.length) {
    container.append(make('p', 'empty-helper', 'No current or future hourly records were returned. A manual deadline is still possible.'));
    return;
  }
  for (const hour of candidates) {
    const card = make('div', 'hour-cell');
    card.append(
      make('span', 'detail-line', hour.time.replace('T', ' ') + ' IST'),
      make('strong', '', 'Model precipitation: ' + fmt(hour.precipitation_mm) + (hour.precipitation_mm === null ? '' : ' mm')),
      make('small', '', 'Modeled precipitation probability: ' + fmt(hour.precipitation_probability_pct) + (hour.precipitation_probability_pct === null ? '' : '%')),
    );
    const button = make('button', 'action-button action-secondary', 'Use as candidate deadline');
    button.type = 'button';
    button.addEventListener('click', () => chooseForecastHour(hour));
    card.append(button);
    container.append(card);
  }
}
function showForecast(result: ForecastResponse): void {
  weather = result;
  const live = result.status === 'retrieved_live' || result.status === 'cached_recent';
  const readable: Record<string, string> = {
    retrieved_live: 'Retrieved live', cached_recent: 'Recent authentic cache',
    stale_cache: 'Stale — not current', unavailable: 'Unavailable',
  };
  stateTag('forecast-status', readable[result.status], live ? 'success' : 'failure');
  const weatherCard = document.querySelector<HTMLElement>('.step-card:first-child');
  const cardState = weatherCard?.querySelector<HTMLElement>('.step-state');
  const cardFoot = weatherCard?.querySelector<HTMLElement>('.card-foot');
  if (cardState) cardState.textContent = live ? 'Model forecast connected' : 'Current model unavailable';
  if (cardFoot) cardFoot.textContent = live ? 'Model hours: ' + result.hours.length : 'Live data: unavailable';
  const statusFooter = document.querySelector<HTMLElement>('.status-footer');
  if (statusFooter) statusFooter.textContent = live
    ? 'Live external model evidence, not farm observation or safety guidance.'
    : 'No current external model data. Manual resource-only planning remains possible.';
  const message = live ?
    (result.notice ?? 'External model forecast retrieved; no automatic rainfall threshold is applied.') :
    result.status === 'stale_cache' ?
    'Only stale authentic forecast data is available. Do not treat it as current climate guidance.' :
    'An authentic forecast is unavailable. You can enter a manual candidate deadline for resource-only planning; it is not weather advice.';
  setText('forecast-message', message);
  const data = ['Jalna approximate reference: 19.84°N, 75.89°E', 'Asia/Kolkata'];
  if (result.retrieved_at_utc) data.push('Retrieved (UTC): ' + result.retrieved_at_utc);
  if (typeof result.forecast_age_hours === 'number') data.push('Age: ' + result.forecast_age_hours + ' h');
  if (result.attribution) data.push(result.attribution);
  if (result.error) data.push('Source issue: ' + result.error);
  setText('forecast-meta', data.join(' · '));
  if (!live && selectedHour !== null) {
    selectedHour = null;
    setText('deadline-origin', 'Previous forecast-hour attribution is no longer current. Deadline retained as a manual user assumption.');
    clearDecision();
  }
  showForecastHours(result);
  if (live) {
    setText('status-title', 'Forecast and resource planning connected');
    const badge = byId('runtime-status');
    badge.dataset.state = 'connected';
    badge.textContent = 'Forecast API connected. Feasibility calculation still requires a successful Python evaluate response.';
    document.documentElement.dataset.runtime = 'connected';
  }
}
async function refreshForecast(force = false): Promise<void> {
  const attempt = ++forecastAttempt;
  const refresh = byId<HTMLButtonElement>('refresh-forecast');
  refresh.disabled = true;
  stateTag('forecast-status', 'Checking source', 'pending');
  setText('forecast-message', 'Checking the authentic Python API forecast. Synthetic data is never substituted.');
  try {
    const result = await loadForecast(force);
    if (attempt === forecastAttempt) showForecast(result);
  } catch (error) {
    if (attempt !== forecastAttempt) return;
    weather = null;
    stateTag('forecast-status', 'API not connected', 'failure');
    const detail = error instanceof Error ? error.message : 'Unknown API error';
    setText('forecast-message', detail + ' No live weather data is displayed.');
    setText('forecast-meta', 'Jalna approximate reference: 19.84°N, 75.89°E · Asia/Kolkata · integration pending.');
    byId('forecast-hours').replaceChildren(make('p', 'empty-helper', 'No authenticated forecast hours. Manual deadlines remain available.'));
    if (selectedHour !== null) {
      selectedHour = null;
      setText('deadline-origin', 'Forecast attribution unavailable; any entered deadline is now a manual assumption.');
      clearDecision();
    }
  } finally {
    if (attempt === forecastAttempt) refresh.disabled = false;
  }
}
function optionElement(id: string): HTMLElement {
  const row = make('div', 'option-card');
  row.dataset.optionId = id;
  const top = make('div', 'option-top');
  top.append(make('strong', '', 'Permitted option ' + id));
  const remove = make('button', 'remove-option', 'Remove option');
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Remove option ' + id);
  remove.addEventListener('click', () => {
    row.remove();
    clearDecision();
    updateOptionsEmpty();
  });
  top.append(remove);
  const fields = make('div', 'option-grid');
  const field = (title: string, className: string, control: HTMLElement): HTMLElement => {
    const label = make('label', 'field-control');
    label.append(make('span', '', title), control);
    control.classList.add('text-input', className);
    return label;
  };
  const kind = document.createElement('select');
  kind.append(new Option('Additional capacity', 'add_capacity'), new Option('Reduce target (leaves remainder)', 'reduce_target'));
  const amount = document.createElement('input');
  amount.type = 'number'; amount.min = '0'; amount.step = 'any'; amount.placeholder = 'Enter amount'; amount.inputMode = 'decimal';
  const resource = document.createElement('input');
  resource.type = 'text'; resource.placeholder = 'Distinct resource ID'; resource.autocomplete = 'off';
  const availability = document.createElement('select');
  availability.append(new Option('Unknown', 'unknown'), new Option('Available', 'available'), new Option('Unavailable', 'unavailable'));
  const confirmation = document.createElement('select');
  confirmation.append(new Option('Unknown', 'unknown'), new Option('Confirmed', 'confirmed'), new Option('Requested only', 'requested'));
  kind.addEventListener('change', () => {
    resource.disabled = kind.value === 'reduce_target';
    resource.placeholder = resource.disabled ? 'Not applicable' : 'Distinct resource ID';
    clearDecision();
  });
  fields.append(
    field('Change type', 'opt-type', kind),
    field('Change amount (handling units)', 'opt-amount', amount),
    field('Additional resource ID', 'opt-resource', resource),
    field('Availability', 'opt-availability', availability),
    field('Confirmation', 'opt-confirmation', confirmation),
  );
  row.append(top, fields);
  return row;
}
function updateOptionsEmpty(): void {
  const empty = document.getElementById('no-options');
  const has = document.querySelectorAll('.option-card').length > 0;
  if (empty) empty.hidden = has;
  byId<HTMLButtonElement>('add-option').disabled = document.querySelectorAll('.option-card').length >= 10;
}
function addOption(): void {
  if (document.querySelectorAll('.option-card').length >= 10) return;
  const id = 'option-' + (++optionNumber);
  byId('change-list').append(optionElement(id));
  updateOptionsEmpty();
  clearDecision();
}
function readDraft(): PlanDraft {
  const read = <T extends HTMLElement>(card: HTMLElement, css: string): T => {
    const node = card.querySelector<T>(css);
    if (!node) throw new Error('Optional resource form is incomplete.');
    return node;
  };
  const changes: ChangeDraft[] = Array.from(document.querySelectorAll<HTMLElement>('.option-card')).map(card => ({
    id: card.dataset.optionId ?? '',
    enabled: true,
    type: read<HTMLSelectElement>(card, '.opt-type').value as ChangeDraft['type'],
    amount: read<HTMLInputElement>(card, '.opt-amount').value,
    resourceId: read<HTMLInputElement>(card, '.opt-resource').value,
    availability: read<HTMLSelectElement>(card, '.opt-availability').value as ChangeDraft['availability'],
    confirmation: read<HTMLSelectElement>(card, '.opt-confirmation').value as ChangeDraft['confirmation'],
  }));
  return {
    target: input('target').value,
    capacity: input('capacity').value,
    hours: input('hours').value,
    deadlineLocal: input('deadline').value,
    readiness: pick('readiness').value as PlanDraft['readiness'],
    completed: input('completed').checked,
    acknowledged: input('input-confirm').checked,
    baselineIds: input('baseline-resources').value,
    changes,
  };
}
function renderMetric(root: HTMLElement, label: string, value: string): void {
  const metric = make('div', 'metric');
  metric.append(make('span', '', label), make('strong', '', value));
  root.append(metric);
}
function renderAssessment(root: HTMLElement, assessment: Assessment): void {
  const metrics = make('div', 'result-metrics');
  renderMetric(metrics, 'Time slack', assessment.time_budget.time_slack_hours === null ? 'Unknown' : fmt(assessment.time_budget.time_slack_hours) + ' h');
  renderMetric(metrics, 'Current shortfall', fmt(assessment.shortfall_units) + ' handling units');
  renderMetric(metrics, 'Projected capacity', fmt(assessment.projected_capacity_units) + ' handling units');
  root.append(metrics);
  for (const constraint of assessment.constraints) {
    const row = make('div', 'constraint-row');
    row.append(make('span', 'state-tag state-' + (constraint.status === 'pass' ? 'success' : constraint.status === 'blocked' ? 'failure' : 'pending'), constraint.status.toUpperCase()));
    const details = make('div', '');
    details.append(make('strong', '', constraint.id), make('p', '', constraint.explanation), make('small', 'detail-line', 'Evidence category: ' + constraint.provenance));
    row.append(details);
    root.append(row);
  }
}
function showSelection(pkg: ChangePackage): void {
  const target = byId('selection-content');
  target.replaceChildren();
  target.append(
    make('strong', '', 'Selected conditional option: ' + pkg.change_ids.join(' + ')),
    make('p', '', 'Projected remaining shortfall: ' + fmt(pkg.projected.shortfall_units) + ' handling units. Original target left outside this action: ' + fmt(pkg.projected.original_target_unhandled_units) + ' handling units.'),
    make('p', '', pkg.warning + ' Selecting this option does not obtain resources or certify safe handling.'),
  );
}
function showEvaluation(result: EvaluationResponse): void {
  evaluation = result;
  stateTag('result-status', result.status.toUpperCase(), result.status === 'feasible' || result.status === 'completed' ? 'success' : result.status === 'blocked' ? 'failure' : 'pending');
  const resultCard = document.querySelector<HTMLElement>('.step-card:last-child');
  const resultCardState = resultCard?.querySelector<HTMLElement>('.step-state');
  const resultCardFoot = resultCard?.querySelector<HTMLElement>('.card-foot');
  if (resultCardState) resultCardState.textContent = 'Python result';
  if (resultCardFoot) resultCardFoot.textContent = 'Decision: ' + result.status;
  const root = byId('result-content');
  root.replaceChildren();
  const lead = make('div', 'result-lead');
  lead.append(make('strong', '', statusLabel[result.status]), make('p', '', result.message));
  root.append(lead);
  renderAssessment(root, result.baseline);
  if (result.packages.length > 0) {
    root.append(make('h4', '', result.packages.length + ' inclusion-minimal conditional change package(s)'));
    for (const pkg of result.packages) {
      const card = make('div', 'package-card');
      card.append(make('strong', '', pkg.change_ids.join(' + ')));
      card.append(make('p', '', 'Projected capacity: ' + fmt(pkg.projected.projected_capacity_units) +
        '; revised target: ' + fmt(pkg.projected.projected_target_units) + ' handling units.'));
      if (pkg.objective_changed) card.append(make('p', '', fmt(pkg.projected.original_target_unhandled_units) + ' original units remain unhandled.'));
      card.append(make('p', '', 'Inclusion-minimal does not mean cheapest, most effective or guaranteed available.'));
      const choose = make('button', 'action-button action-secondary', 'Select conditional option');
      choose.type = 'button';
      choose.addEventListener('click', () => showSelection(pkg));
      card.append(choose);
      root.append(card);
    }
  } else if (result.status !== 'feasible' && result.status !== 'completed') {
    root.append(make('p', 'context-note', 'No confirmed inclusion-minimal package establishes feasibility under the current declarations. Missing resources are not assumed available.'));
  }
  if (result.excluded_changes.length > 0) {
    root.append(make('p', 'detail-line', 'Excluded options: ' +
      result.excluded_changes.map(c => c.id + ' (' + c.confirmation_state + ')').join(', ') + '.'));
  }
  root.append(make('p', 'detail-line', 'Conditional resource-feasibility only. This is not proof of crop protection, storage safety or resource delivery.'));
  setText('selection-content', 'No conditional package selected. Selecting one will not book, acquire or execute anything.');
}
function showError(error: Error): void {
  stateTag('result-status', 'Calculation unavailable', 'failure');
  const root = byId('result-content');
  root.replaceChildren();
  const box = make('div', 'empty-result');
  box.append(make('strong', '', 'No feasibility calculation was completed.'), make('p', '', error.message));
  root.append(box);
  setText('selection-content', 'No calculated option available.');
}
async function evaluate(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const errorNode = byId('form-error');
  errorNode.hidden = true;
  const submit = byId<HTMLButtonElement>('evaluate');
  let request;
  try {
    request = createRequest(readDraft(), new Date().toISOString());
  } catch (error) {
    errorNode.textContent = error instanceof Error ? error.message : 'Invalid planner input.';
    errorNode.hidden = false;
    clearDecision();
    return;
  }
  const submittedRevision = revision;
  submit.disabled = true;
  submit.textContent = 'Evaluating…';
  stateTag('result-status', 'Evaluating', 'pending');
  try {
    // Compare only against the last successfully calculated submission.
    // Forecast-attributed replanning always passes through the Python server,
    // which independently verifies selected_hour_local against fresh Open-Meteo data.
    let comparison: ComparisonResponse | null = null;
    let result: EvaluationResponse;
    if (previousVerifiedRequest !== null) {
      comparison = selectedHour !== null
        ? await replanCase(previousVerifiedRequest, request, selectedHour)
        : await compareCases(previousVerifiedRequest, request);
      result = comparison.after;
    } else {
      result = await evaluateCase(request);
    }
    if (submittedRevision !== revision) return;
    showEvaluation(result);
    showComparison(comparison);
    previousVerifiedRequest = request;
    byId('result-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (submittedRevision !== revision) return;
    showError(error instanceof Error ? error : new Error('An unknown error occurred while evaluating.'));
    byId('result-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    submit.disabled = false;
    submit.textContent = 'Evaluate feasibility';
  }
}
function showComparison(comparison: ComparisonResponse | null): void {
  const root = byId('comparison-content');
  root.replaceChildren();
  if (!comparison) {
    root.append(make('p', 'empty-helper', 'Evaluate a plan, change its deadline or resources, then re-evaluate to compare the real Python results.'));
    return;
  }
  const changes=comparison.changes;
  const heading=make('strong','', changes.status_before.toUpperCase() + ' → ' + changes.status_after.toUpperCase());
  root.append(heading);
  const slack=changes.time_slack_delta_hours;
  root.append(make('p','', 'Time-slack change: ' + (slack===null ? 'unknown' : fmt(slack) + ' hours') + '.'));
  root.append(make('p','', 'Changed declared fields: ' + (changes.changed_fields.length ? changes.changed_fields.join(', ') : 'none') + '.'));
  root.append(make('p','', 'New blockers: ' + (changes.new_blockers.join(', ') || 'none') +
                        '; resolved blockers: ' + (changes.resolved_blockers.join(', ') || 'none') + '.'));
  if (comparison.forecast_selection) {
    root.append(make('p','context-note','Server-confirmed selected forecast hour: ' +
      comparison.forecast_selection.selected_hour_local + ' IST. ' +
      comparison.forecast_selection.limitation));
  }
  root.append(make('p','detail-line',comparison.interpretation));
}
async function bootstrapAPI(): Promise<void> {
  try {
    const [health,sources]=await Promise.all([loadHealth(),loadSources()]);
    setText('api-health', 'Python API connected ('+health.version+'). Forecast cache presence does not prove freshness.');
    setText('source-registry', sources.sources.length + ' evidence records and ' +
      sources.operational_rules.length + ' documented constraint rules. ' +
      'Historical guidance is context, not validated operational advice.');
  } catch (error) {
    setText('api-health','Python API/source registry unavailable: ' +
      (error instanceof Error ? error.message : 'unknown error'));
    setText('source-registry','No authoritative source records could be loaded.');
  }
}
function start(): void {
  const badge = byId('runtime-status');
  badge.dataset.state = 'foundation';
  badge.textContent = 'TypeScript screens initialized. Python API and live forecast integration are pending.';
  document.documentElement.dataset.runtime = 'foundation';
  void bootstrapAPI();
  const form = byId<HTMLFormElement>('plan-form');
  form.addEventListener('submit', event => { void evaluate(event); });
  form.addEventListener('input', clearDecision);
  form.addEventListener('change', clearDecision);
  input('deadline').addEventListener('input', deadlineOriginManual);
  byId('add-option').addEventListener('click', addOption);
  byId('refresh-forecast').addEventListener('click', () => { void refreshForecast(true); });
  void refreshForecast();
}
start();
