/* Feasibility page: server-calculated example catalog and sourced historical weather.
   Does not mutate farmer declarations, replace FastAPI evaluations, or fabricate climate data. */
(() => {
  'use strict';
  const page = document.querySelector('section.section[data-page="3"]');
  const hero = document.getElementById('resultHero');
  if (!page || !hero) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/feasibility-explorer.css';
  document.head.append(css);

  const node = (tag, className, content) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (content !== undefined) item.textContent = String(content);
    return item;
  };
  const makeButton = (label, callback, className = 'btn') => {
    const item = node('button', className, label);
    item.type = 'button';
    item.addEventListener('click', callback);
    return item;
  };
  const number = value => typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'Unavailable';
  const accepted = ['feasible', 'blocked', 'unknown', 'completed'];
  const json = async path => {
    const response = await fetch(path, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(19000) });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('FastAPI data request was not successful (HTTP ' + response.status + ').');
    }
    return response.json();
  };

  const root = node('section', 'panel feasibility-workbench');
  root.id = 'feasibilityWorkbench';
  root.setAttribute('aria-label', 'Jalna feasibility examples and official historical evidence');
  const heading = node('div', 'fw-heading');
  const headingCopy = node('div', 'fw-heading-copy');
  headingCopy.append(node('div', 'section-label', 'DATA-BACKED EXPLORER · JALNA'),
    node('h2', '', '20 worked feasibility scenarios'),
    node('p', '', 'Explore how capacity, preparation time, readiness and confirmed changes affect a decision. Results come from the same FastAPI engine used for farmer assessments.'));
  const label = node('span', 'fw-source-label', 'ENGINE-CALCULATED EXAMPLES');
  heading.append(headingCopy, label);
  root.append(heading);
  root.append(node('p', 'fw-disclosure',
    'These twenty configurations are planning examples, not actual farmer records or government measurements. They are not crop-safety recommendations. Your own farm assessment remains separate below.'));

  const statusLine = node('p', 'fw-status', 'Connecting to FastAPI…');
  statusLine.setAttribute('role', 'status');
  statusLine.setAttribute('aria-live', 'polite');
  const toolbar = node('div', 'fw-toolbar');
  const filter = node('select', 'fw-filter');
  filter.setAttribute('aria-label', 'Filter example assessments');
  for (const [value, label] of [['all', 'All cases'], ['feasible', 'Feasible'], ['blocked', 'Blocked'], ['unknown', 'Unknown']]) {
    const option = node('option', '', label);
    option.value = value;
    filter.append(option);
  }
  const refresh = makeButton('Recalculate 20 cases', () => void loadCases(), 'btn primary');
  const download = makeButton('Export assessed cases CSV', exportCases, 'btn');
  download.disabled = true;
  toolbar.append(filter, refresh, download);
  root.append(statusLine, toolbar);

  const dashboard = node('div', 'fw-stats');
  for (const [key, title] of [['feasible', 'Feasible under assumptions'], ['blocked', 'Known blockers'], ['unknown', 'Unknown prerequisites'], ['packages', 'Cases with possible changes']]) {
    const item = node('div', 'fw-stat');
    item.append(node('span', '', title));
    const value = node('strong', '', 'Checking…');
    value.id = 'fw-count-' + key;
    item.append(value);
    dashboard.append(item);
  }
  root.append(dashboard);

  const content = node('div', 'fw-content');
  const casePanel = node('div', 'fw-list-panel');
  casePanel.append(node('h3', '', 'Select a planning case'));
  const caseList = node('div', 'fw-list', 'Loading calculations from the Python engine…');
  caseList.id = 'fwCaseList';
  casePanel.append(caseList);
  const resultPanel = node('article', 'fw-detail');
  resultPanel.append(node('h3', '', 'Selected case · explanation'));
  const detail = node('div', 'fw-detail-content', 'Validated case results will appear after the FastAPI response.');
  detail.id = 'fwCaseDetail';
  resultPanel.append(detail);
  content.append(casePanel, resultPanel);
  root.append(content);

  const evidence = node('section', 'fw-evidence');
  const evidenceHead = node('div', 'fw-evidence-heading');
  const evidenceCopy = node('div');
  evidenceCopy.append(node('h3', '', 'Official historical climate · 20-day view'),
    node('p', '', 'NASA POWER (US government): near-Jalna daily gridded rainfall and temperature. Historical records are not future forecasts or measurements at your farm.'));
  const refreshClimate = makeButton('Refresh government records', () => void loadClimate(true), 'btn');
  evidenceHead.append(evidenceCopy, refreshClimate);
  evidence.append(evidenceHead);
  const officialContext = node('p', 'fw-context');
  officialContext.append(node('strong', '', 'Government of Maharashtra context: '),
    document.createTextNode('The Jalna District administration describes average annual rainfall of about 650–750 mm. This is broad historical context, not current rainfall or a preparation threshold. '));
  const officialLink = node('a', '', 'District source');
  officialLink.href = 'https://jalna.gov.in/en/about-district/demography/';
  officialLink.target = '_blank'; officialLink.rel = 'noopener noreferrer';
  officialContext.append(officialLink);
  evidence.append(officialContext);
  const climateStatus = node('p', 'fw-status', 'Connecting to government historical source…');
  climateStatus.id = 'fwClimateStatus';
  climateStatus.setAttribute('role', 'status');
  const climateList = node('div', 'fw-history', 'Verifying historical daily records…');
  climateList.id = 'fwClimateList';
  evidence.append(climateStatus, climateList);
  const nasa = node('a', 'fw-source-link', 'NASA POWER official daily API documentation');
  nasa.href = 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
  nasa.target = '_blank'; nasa.rel = 'noopener noreferrer';
  evidence.append(nasa);
  root.append(evidence);

  hero.insertAdjacentElement('beforebegin', root);
  const divider = node('div', 'fw-farmer-divider');
  divider.append(node('h2', '', 'Your farm-specific assessment'),
    node('p', '', 'Use your own confirmed work quantities, handling readiness and candidate deadline on Pages 02–03. Only their genuine server result is displayed below.'));
  hero.insertAdjacentElement('beforebegin', divider);

  let records = [];
  let selectedId = '';
  let caseRequest = 0;
  let climateRequest = 0;
  const setCount = (name, value) => {
    const target = document.getElementById('fw-count-' + name);
    if (target) target.textContent = String(value);
  };
  const statusChip = kind => node('span', 'fw-chip fw-' + kind, kind.toUpperCase());

  function drawCase() {
    const entry = records.find(record => record.id === selectedId);
    detail.replaceChildren();
    if (!entry) {
      detail.append(node('p', '', 'Select an example to inspect the exact FastAPI explanation.'));
      return;
    }
    const a = entry.assumptions;
    const decision = entry.result;
    const base = decision.baseline;
    const lead = node('div', 'fw-case-header');
    lead.append(node('strong', '', entry.id + ' · ' + entry.label), statusChip(decision.status));
    detail.append(lead);
    const metrics = node('div', 'fw-metrics');
    for (const [title, value] of [
      ['Work target', number(a.target_units) + ' units'],
      ['Confirmed capacity', number(a.capacity_units) + ' units'],
      ['Capacity shortfall', number(base.shortfall_units) + ' units'],
      ['Available time', number(a.hours_until_candidate_deadline) + ' h'],
      ['Estimated task', number(a.required_hours) + ' h'],
      ['Time slack', number(base.time_budget.time_slack_hours) + ' h'],
    ]) {
      const metric = node('div', 'fw-metric');
      metric.append(node('span', '', title), node('strong', '', value));
      metrics.append(metric);
    }
    detail.append(metrics);
    detail.append(node('p', 'fw-case-message', decision.message));
    const checks = node('div', 'fw-constraints');
    for (const constraint of base.constraints) {
      const line = node('div', 'fw-constraint');
      line.append(statusChip(constraint.status), node('div', '', constraint.id + ' · ' + constraint.explanation));
      checks.append(line);
    }
    detail.append(checks);
    const eligible = decision.packages || [];
    if (eligible.length) {
      const pack = node('div', 'fw-packages');
      pack.append(node('strong', '', eligible.length + ' inclusion-minimal conditional change package(s)'));
      for (const item of eligible) {
        pack.append(node('p', '', item.change_ids.join(' + ') +
          ' · projected remaining shortfall ' + number(item.projected.shortfall_units) +
          ' units. Not automatically completed.'));
      }
      detail.append(pack);
    }
    if (decision.excluded_changes?.length) {
      const excluded = node('div', 'fw-packages');
      excluded.append(node('strong', '', 'Excluded changes'));
      for (const item of decision.excluded_changes) excluded.append(node('p', '', item.id + ' · ' + item.reason));
      detail.append(excluded);
    }
    detail.append(node('small', 'fw-case-foot',
      'Input provenance: configured example · Decision provenance: real FastAPI calculation · Handling units: abstract, not kg or hectares.'));
  }
  function drawList() {
    caseList.replaceChildren();
    let visible = 0;
    for (const entry of records) {
      if (filter.value !== 'all' && entry.result.status !== filter.value) continue;
      visible++;
      const button = node('button', 'fw-item' + (entry.id === selectedId ? ' selected' : ''));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(entry.id === selectedId));
      button.append(node('strong', '', entry.id + ' · ' + entry.label), statusChip(entry.result.status));
      button.addEventListener('click', () => { selectedId = entry.id; drawList(); drawCase(); });
      caseList.append(button);
    }
    if (!visible) caseList.append(node('p', 'fw-status', 'No cases match this filter.'));
  }
  function checkCases(payload) {
    if (payload?.status !== 'calculated' || payload?.count !== 20 ||
        payload?.data_kind !== 'illustrative_planning_cases' ||
        !Array.isArray(payload.records) || payload.records.length !== 20 ||
        !payload.records.every(item =>
          typeof item.id === 'string' && typeof item.label === 'string' &&
          item.input_kind === 'configured_example_not_farm_observation' &&
          item.assumptions && item.result && accepted.includes(item.result.status) &&
          Array.isArray(item.result.baseline?.constraints) &&
          typeof item.result.baseline.shortfall_units === 'number' &&
          Array.isArray(item.result.packages))) {
      throw new Error('The scenario catalog failed source/schema validation.');
    }
    return payload.records;
  }
  async function loadCases() {
    const token = ++caseRequest;
    refresh.disabled = true;
    statusLine.textContent = 'Calculating 20 cases with FastAPI…';
    try {
      const result = await json('/api/feasibility-scenarios');
      if (token !== caseRequest) return;
      records = checkCases(result);
      if (!records.some(item => item.id === selectedId)) selectedId = records[0].id;
      for (const key of ['feasible', 'blocked', 'unknown']) {
        setCount(key, records.filter(item => item.result.status === key).length);
      }
      setCount('packages', records.filter(item => item.result.packages.length > 0).length);
      statusLine.textContent = '20 of 20 examples calculated and validated by FastAPI · ' +
        result.evaluated_at_utc + ' · independent of farmer inputs.';
      download.disabled = false;
      drawList(); drawCase();
    } catch (error) {
      if (token !== caseRequest) return;
      records = [];
      selectedId = '';
      caseList.replaceChildren(node('p', 'fw-status', 'Case results unavailable: ' + (error?.message || 'Network error') + '. Retry the real FastAPI service.'));
      detail.replaceChildren(node('p', '', 'No example was silently calculated in the browser.'));
      statusLine.textContent = 'API verification unavailable; no example results shown.';
      download.disabled = true;
      for (const key of ['feasible', 'blocked', 'unknown', 'packages']) setCount(key, 'Unavailable');
    } finally {
      if (token === caseRequest) refresh.disabled = false;
    }
  }
  function exportCases() {
    if (records.length !== 20) return;
    const headings = ['example_id', 'label', 'data_kind', 'status', 'target_handling_units', 'capacity_handling_units',
      'shortfall_handling_units', 'required_hours', 'time_to_deadline_hours', 'time_slack_hours', 'readiness', 'minimal_packages_count'];
    const encode = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const lines = [headings.map(encode).join(',')];
    for (const r of records) {
      const a = r.assumptions, b = r.result.baseline;
      const values = [r.id, r.label, 'configured_example_not_farm_observation', r.result.status,
        a.target_units, a.capacity_units, b.shortfall_units, a.required_hours,
        a.hours_until_candidate_deadline, b.time_budget.time_slack_hours, a.readiness, r.result.packages.length];
      lines.push(values.map(encode).join(','));
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' }));
    const a = node('a');
    a.href = url; a.download = 'jalna-20-planning-examples-api-calculated.csv';
    document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function loadClimate(force = false) {
    const token = ++climateRequest;
    refreshClimate.disabled = true;
    climateStatus.textContent = 'Checking 20 genuine NASA POWER historical dates…';
    try {
      const data = await json('/api/government-climate' + (force ? '?refresh=true' : ''));
      if (token !== climateRequest) return;
      if (data?.source !== 'NASA POWER (US government)' || !Array.isArray(data.days) ||
          !['retrieved_live', 'cached_recent', 'unavailable'].includes(data.status)) {
        throw new Error('Government source response failed schema validation.');
      }
      climateList.replaceChildren();
      if (data.status === 'unavailable') {
        if (data.days.length) throw new Error('Unavailable source returned data.');
        climateStatus.textContent = 'Government historical series unavailable — no values substituted.';
        climateList.append(node('p', 'fw-status', data.notice || 'NASA POWER could not be reached.'));
        return;
      }
      if (data.data_kind !== 'government_gridded_historical' ||
          data.days.length < 1 || data.days.length > 20 || !data.retrieved_at_utc ||
          !data.days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
             (day.precipitation_mm_day === null || Number.isFinite(day.precipitation_mm_day) && day.precipitation_mm_day >= 0) &&
             (day.temperature_c === null || Number.isFinite(day.temperature_c)))) {
        throw new Error('NASA POWER daily values failed verification.');
      }
      climateStatus.textContent = data.days.length + ' authenticated historical daily records · ' +
        (data.status === 'cached_recent' ? 'recent verified server cache' : 'live provider response') +
        ' · retrieved ' + data.retrieved_at_utc + '.';
      for (const day of data.days) {
        const row = node('div', 'fw-history-row');
        row.append(node('time', '', day.date),
          node('strong', '', day.precipitation_mm_day === null ? 'Rain: unavailable' : 'Rain: ' + number(day.precipitation_mm_day) + ' mm'),
          node('span', '', day.temperature_c === null ? 'Temp: unavailable' : 'Temp: ' + number(day.temperature_c) + ' °C'));
        climateList.append(row);
      }
    } catch (error) {
      if (token !== climateRequest) return;
      climateStatus.textContent = 'Unable to verify the NASA POWER source right now.';
      climateList.replaceChildren(node('p', 'fw-status', (error?.message || 'Network error') + ' No replacement readings were generated.'));
    } finally {
      if (token === climateRequest) refreshClimate.disabled = false;
    }
  }
  filter.addEventListener('change', () => {
    const visible = records.filter(entry => filter.value === 'all' || entry.result.status === filter.value);
    if (visible.length && !visible.some(item => item.id === selectedId)) selectedId = visible[0].id;
    drawList(); drawCase();
  });
  // Only initialize on Page 04. This avoids duplicate NASA requests and
  // preserves the existing one-request-per-source behaviour on other pages.
  let activated = false;
  const activate = () => {
    if (activated || !page.classList.contains('active')) return;
    activated = true;
    watch.disconnect();
    void loadCases();
    void loadClimate();
  };
  const watch = new MutationObserver(activate);
  watch.observe(page, { attributes: true, attributeFilter: ['class'] });
  activate();
})();
