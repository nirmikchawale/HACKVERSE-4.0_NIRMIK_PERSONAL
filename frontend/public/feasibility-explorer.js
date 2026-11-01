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
  const json = async (path, timeoutMs = 9000) => {
    const response = await fetch(path, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('FastAPI data request was not successful (HTTP ' + response.status + ').');
    }
    return response.json();
  };

  // CF-FEAS-05: a compact, task-first lab; all outcomes are from verified Python cases.
  const root = node('section', 'panel feasibility-workbench fw-lab');
  root.id = 'feasibilityWorkbench';
  root.setAttribute('aria-label', 'Jalna interactive feasibility scenario lab');
  const heading = node('div', 'fw-heading fw-lab-heading');
  const headingCopy = node('div', 'fw-heading-copy');
  headingCopy.append(node('div', 'section-label', 'FEASIBILITY EXPLORER · JALNA'),
    node('h2', '', 'Scenario lab'));
  const sourceLabel = node('span', 'fw-source-label', 'Checking engine…');
  sourceLabel.id = 'fwProvenance';
  sourceLabel.setAttribute('aria-live', 'polite');
  const about = node('details', 'fw-about');
  const aboutSummary = node('summary', '', 'About the examples');
  about.append(aboutSummary, node('p', '',
    'These are 20 configured planning cases × 5 sensitivity variants, recalculated by FastAPI or supplied as a verified build-time Python snapshot. They are not actual farmer records, government measurements, crop-safety advice, or live predictions. All units are abstract handling units.'));
  heading.append(headingCopy, sourceLabel, about);
  root.append(heading);

  const jump = target => {
    const item = document.querySelector('#navDesktop [data-nav="' + target + '"]') ||
      document.querySelector('#navMobile [data-nav="' + target + '"]');
    if (item) item.click();
  };
  const statusLine = node('p', 'fw-status fw-live-status', 'Loading verified scenarios…');
  statusLine.setAttribute('role', 'status');
  statusLine.setAttribute('aria-live', 'polite');

  const filter = { value:'all' };
  const dashboard = node('div', 'fw-stats fw-facets');
  dashboard.setAttribute('role', 'group');
  dashboard.setAttribute('aria-label', 'Filter examples by engine result');
  const facetButtons = new Map();
  for(const [key,title] of [['all','All cases'],['feasible','Feasible'],['blocked','Blocked'],['unknown','Unknown'],['packages','With changes']]){
    const item = node('button', 'fw-stat fw-stat-action fw-facet');
    item.type='button';
    item.dataset.filter=key;
    item.setAttribute('aria-pressed', String(key==='all'));
    item.setAttribute('aria-label', 'Filter: '+title);
    const name=node('span','',title);
    const count=node('strong','','—');
    count.id='fw-count-'+key;
    item.append(name,count);
    item.addEventListener('click',()=>{
      if(!records.length){void loadCases();return;}
      filter.value=key;
      currentPage=1;
      const matches=filteredCases();
      selectedId=matches.length?matches[0].id:'';
      drawList();drawCase();
    });
    facetButtons.set(key,item);
    dashboard.append(item);
  }
  root.append(dashboard);

  const toolbar = node('div', 'fw-toolbar fw-lab-toolbar');
  const search = node('input', 'fw-search');
  search.type = 'search'; search.id='fwSearch';
  search.placeholder = 'Search ID, scenario or variant';
  search.setAttribute('aria-label', 'Find an example by ID, description or variant');
  search.autocomplete = 'off';
  const variant = node('select', 'fw-filter fw-variant');
  variant.id='fwVariant';
  variant.setAttribute('aria-label', 'Filter sensitivity variant');
  for(const [key,title] of [
    ['all','All variants'],['baseline','Baseline'],
    ['compressed_window','Shorter window'],['capacity_resilience','More capacity'],
    ['readiness_review','Readiness review'],['support_confirmation','Support confirmation']
  ]){
    const option=node('option','',title);option.value=key;variant.append(option);
  }
  const sort = node('select','fw-filter fw-sort');
  sort.id='fwSort';
  sort.setAttribute('aria-label','Sort matching examples');
  for(const [key,title] of [['id','Case ID'],['shortfall','Largest shortfall'],['slack','Least time margin'],['capacity','Highest capacity']]){
    const option=node('option','',title);option.value=key;sort.append(option);
  }
  const reset = makeButton('Clear filters',()=>{
    search.value='';variant.value='all';sort.value='id';filter.value='all';
    currentPage=1;selectedId=records[0]?.id||'';drawList();drawCase();
  },'btn fw-reset');
  reset.id='fwReset';reset.hidden=true;
  const controls = node('div','fw-lab-primary-controls');
  controls.append(search,variant,sort,reset);
  const refresh=makeButton('Recalculate',()=>void loadCases(),'btn primary');
  refresh.id='fwRefresh';
  const diagnostics=makeButton('Check API',()=>void checkApiHealth(),'btn');
  diagnostics.id='fwCheckAPI';
  const download=makeButton('Export CSV',exportCases,'btn');
  download.id='fwExport';download.disabled=true;
  download.setAttribute('aria-label','Export assessed cases CSV');
  const mine=makeButton('My farm →',()=>jump(2),'btn fw-my-farm');
  const actions=node('div','fw-lab-actions');
  actions.append(refresh,diagnostics,download,mine);
  toolbar.append(controls,actions);
  root.append(toolbar,statusLine);
  const diagnosticInfo = node('p', 'fw-status fw-diagnostic', '');
  diagnosticInfo.id = 'fwDiagnostic';diagnosticInfo.hidden=true;
  diagnosticInfo.setAttribute('role','status');
  root.append(diagnosticInfo);

  const content = node('div', 'fw-content');
  const casePanel = node('div', 'fw-list-panel');
  const listTitle = node('h3', '', 'Browse cases');
  listTitle.id='fwListTitle';
  casePanel.append(listTitle);
  const caseList = node('div', 'fw-list', 'Loading calculations from the Python engine…');
  caseList.id = 'fwCaseList';
  const caseMeta = node('p', 'fw-page-meta', 'Awaiting verified scenario catalog.');
  caseMeta.id = 'fwPageMeta';
  const pager = node('div', 'fw-pager');
  const previousPage = makeButton('Previous', () => {
    currentPage = Math.max(1, currentPage - 1);
    drawList();
  }, 'btn');
  previousPage.id = 'fwPreviousPage';
  const nextPage = makeButton('Next', () => {
    currentPage += 1;
    drawList();
  }, 'btn');
  nextPage.id = 'fwNextPage';
  pager.append(previousPage, nextPage);
  casePanel.append(caseList, caseMeta, pager);
  const resultPanel = node('article', 'fw-detail');
  resultPanel.append(node('h3', '', 'Inspect an example'));
  const compareTools=node('div','fw-compare-tools');
  const pin=makeButton('Pin for comparison',()=>{if(!selectedId)return;pinnedId=selectedId;drawCase();},'btn');
  pin.id='fwPin';
  const clearPin=makeButton('Clear comparison',()=>{pinnedId='';drawCase();},'btn');
  clearPin.id='fwClearPin';clearPin.hidden=true;
  compareTools.append(pin,clearPin);
  const comparison=node('div','fw-comparison');
  comparison.id='fwComparison';comparison.hidden=true;
  resultPanel.append(compareTools,comparison);
  const detail = node('div', 'fw-detail-content', 'Choose a verified example above.');
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
  const evidenceActions = node('div', 'fw-evidence-actions');
  evidenceActions.append(
    makeButton('Explain verified vs unavailable data', () => {
      climateInfo.hidden = !climateInfo.hidden;
    }, 'btn'),
    makeButton('Choose a forecast planning deadline', () => jump(1), 'btn')
  );
  const climateInfo = node('p', 'fw-status',
    'NASA POWER values are historical gridded observations at a district reference, not a farm sensor. ' +
    'A government API failure means no daily readings can be shown. You can still open its official documentation ' +
    'and use the real forecast page for a model-informed, user-selected deadline.');
  climateInfo.hidden = true;
  climateInfo.id = 'fwClimateInfo';
  evidence.append(evidenceActions, climateInfo);
  root.append(evidence);

  hero.insertAdjacentElement('beforebegin', root);
  const divider = node('div', 'fw-farmer-divider');
  divider.append(node('h2', '', 'Your farm-specific assessment'),
    node('p', '', 'Use your own confirmed work quantities, handling readiness and candidate deadline on Pages 02–03. Only their genuine server result is displayed below.'));
  hero.insertAdjacentElement('beforebegin', divider);
  // Existing farmer-specific metrics are useful navigation, never guessed farm values.
  // A short action replaces the decorative em dash only while no server result exists.
  const personalMetricTargets = [
    ['resultGoal', 'Enter target →', 2, 'Set the actual work target on Farm resources.'],
    ['resultCap', 'Confirm capacity →', 2, 'Confirm actual comparable handling capacity on Farm resources.'],
    ['resultGap', 'Assess resources →', 2, 'Capacity shortfall requires your declared target and capacity followed by a real FastAPI assessment.'],
    ['resultSlack', 'Set deadline →', 1, 'Time slack requires your chosen deadline and actual task-duration estimate.']
  ];
  const personalActions = [];
  for (const [id, actionText, destination, help] of personalMetricTargets) {
    const value = document.getElementById(id);
    const tile = value?.closest('.metric-box');
    if (!tile) continue;
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', help + ' Activate to open the relevant form.');
    tile.classList.add('fw-personal-action');
    const updateText = () => {
      const valueText = (value.textContent || '').trim();
      if (valueText === '—' || valueText === '–' || valueText === '-') value.textContent = actionText;
    };
    updateText();
    const observer = new MutationObserver(updateText);
    observer.observe(value, { childList:true, characterData:true, subtree:true });
    tile.addEventListener('click', () => jump(destination));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(destination); }
    });
    personalActions.push(tile);
  }
  const readinessRoutes = [1, 2, 2, 3];
  for (const [index, tile] of [...page.querySelectorAll('.snapshot .snaprow')].entries()) {
    if (index > 3) break;
    const destination = readinessRoutes[index];
    tile.classList.add('fw-personal-action');
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', 'Open ' + (tile.querySelector('span')?.textContent || 'planning check') + ' details');
    tile.addEventListener('click', () => destination === 3 ? void checkApiHealth() : jump(destination));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (destination === 3) void checkApiHealth(); else jump(destination);
      }
    });
  }

  let records = [];
  let pinnedId = '';
  let currentPage = 1;
  const PAGE_SIZE = 20;
  let selectedId = '';
  let caseRequest = 0;
  let climateRequest = 0;
  const setCount = (name, value) => {
    const target = document.getElementById('fw-count-' + name);
    if (target) target.textContent = String(value);
  };
  const syncFacets=()=>{
    for(const [key,item] of facetButtons){
      item.setAttribute('aria-pressed',String(filter.value===key));
    }
    reset.hidden=filter.value==='all'&&variant.value==='all'&&sort.value==='id'&&!search.value.trim();
  };
  const displayComparison=()=>{
    comparison.replaceChildren();
    comparison.hidden=!pinnedId;
    clearPin.hidden=!pinnedId;
    pin.disabled=!selectedId||pinnedId===selectedId;
    pin.textContent=pinnedId===selectedId?'Pinned case':'Pin for comparison';
    if(!pinnedId)return;
    const a=records.find(x=>x.id===pinnedId),b=records.find(x=>x.id===selectedId);
    if(!a){pinnedId='';comparison.hidden=true;clearPin.hidden=true;return;}
    if(!b||a.id===b?.id){
      comparison.append(node('strong','','Pinned '+a.id),node('p','','Choose another row to compare the two calculated cases.'));
      return;
    }
    const row=node('div','fw-compare-grid');
    for(const x of [a,b]){
      const column=node('div','fw-compare-column');
      column.append(node('strong','',x.id),statusChip(x.result.status),
        node('small','','Shortfall: '+number(x.result.baseline.shortfall_units)+' units'),
        node('small','','Time margin: '+number(x.result.baseline.time_budget?.time_slack_hours)+' h'),
        node('small','','Readiness: '+x.assumptions.readiness));
      row.append(column);
    }
    comparison.append(node('strong','','Pinned vs selected · engine results'),row);
  };
  const statusChip = kind => node('span', 'fw-chip fw-' + kind, kind.toUpperCase());

  function drawCase() {
    const entry = records.find(record => record.id === selectedId);
    detail.replaceChildren();
    displayComparison();
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
    const metricInfo = node('p','fw-inline-note','Select a metric for its exact meaning and source.');
    for (const [title, value, explanation] of [
      ['Work target', number(a.target_units) + ' units','Configured amount to prepare in abstract handling units, not actual Jalna tonnage.'],
      ['Confirmed capacity', number(a.capacity_units) + ' units','Illustrative baseline capacity, not independently verified machinery or labor.'],
      ['Capacity shortfall', number(base.shortfall_units) + ' units','Exact Python engine difference: max(0, configured target minus capacity).'],
      ['Available time', number(a.hours_until_candidate_deadline) + ' h','What-if candidate window, not a meteorological rain-onset prediction.'],
      ['Estimated task', number(a.required_hours) + ' h','Example task-duration assumption, not an agricultural field measurement.'],
      ['Time slack', number(base.time_budget.time_slack_hours) + ' h','Python engine compares available time and task duration; negative indicates a timing blocker.'],
    ]) {
      const metric = node('button', 'fw-metric fw-metric-action');
      metric.type = 'button';
      metric.setAttribute('aria-label', title + '. ' + explanation);
      metric.append(node('span', '', title), node('strong', '', value), node('small','','Explain ↗'));
      metric.addEventListener('click', () => { metricInfo.textContent = explanation; });
      metrics.append(metric);
    }
    detail.append(metrics, metricInfo);
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
  const filteredCases = () => {
    const term = search.value.trim().toLocaleLowerCase();
    const matches = records.filter(entry =>
      (filter.value === 'all' || filter.value === 'packages' && entry.result.packages.length > 0 ||
        filter.value === entry.result.status) &&
      (variant.value === 'all' || variant.value === entry.variant) &&
      (!term || (entry.id + ' ' + entry.label + ' ' + (entry.variant || '') + ' ' + (entry.source_seed || '')).toLocaleLowerCase().includes(term))
    );
    const stable=(a,b)=>a.id.localeCompare(b.id);
    if(sort.value==='shortfall')
      return matches.sort((a,b)=>b.result.baseline.shortfall_units-a.result.baseline.shortfall_units||stable(a,b));
    if(sort.value==='capacity')
      return matches.sort((a,b)=>b.assumptions.capacity_units-a.assumptions.capacity_units||stable(a,b));
    if(sort.value==='slack')
      return matches.sort((a,b)=>{
        const x=a.result.baseline.time_budget?.time_slack_hours;
        const y=b.result.baseline.time_budget?.time_slack_hours;
        return (Number.isFinite(x)?x:Infinity)-(Number.isFinite(y)?y:Infinity)||stable(a,b);
      });
    return matches.sort(stable);
  };
  function drawList() {
    caseList.replaceChildren();
    const matches = filteredCases();
    syncFacets();
    listTitle.textContent='Browse '+matches.length+' matching cases';
    if(!matches.some(item=>item.id===selectedId))selectedId=matches[0]?.id||'';
    const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(currentPage, 1), pages);
    const begin = (currentPage - 1) * PAGE_SIZE;
    for (const entry of matches.slice(begin, begin + PAGE_SIZE)) {
      const button = node('button', 'fw-item' + (entry.id === selectedId ? ' selected' : ''));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(entry.id === selectedId));
      button.append(node('strong', '', entry.id + ' · ' + entry.label), statusChip(entry.result.status));
      button.addEventListener('click', () => { selectedId = entry.id; drawList(); drawCase(); });
      caseList.append(button);
    }
    if (!matches.length) caseList.append(node('p', 'fw-status', 'No cases match this search and filter.'));
    caseMeta.textContent = matches.length ? 'Showing ' + (begin + 1) + '–' + Math.min(begin + PAGE_SIZE, matches.length) +
      ' of ' + matches.length + ' matched cases · page ' + currentPage + ' of ' + pages :
      '0 matching scenarios · all 100 examples remain available by clearing filters.';
    previousPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= pages;
  }
  function checkCases(payload) {
    if (payload?.status !== 'calculated' || payload?.count !== 100 ||
        payload?.data_kind !== 'illustrative_planning_cases' ||
        !Array.isArray(payload.records) || payload.records.length !== 100 ||
        !payload.records.every(item =>
          typeof item.id === 'string' && typeof item.label === 'string' &&
          item.input_kind === 'configured_example_not_farm_observation' &&
          item.assumptions && item.result && accepted.includes(item.result.status) &&
          Array.isArray(item.result.baseline?.constraints) &&
          typeof item.result.baseline.shortfall_units === 'number' &&
          Array.isArray(item.result.packages))) {
      throw new Error('The scenario catalog failed source/schema validation.');
    }
    if (new Set(payload.records.map(item => item.id)).size !== 100 ||
        !payload.records.every(item => typeof item.variant === 'string' &&
          typeof item.source_seed === 'string' &&
          typeof item.assumptions.required_hours === 'number' &&
          typeof item.assumptions.capacity_units === 'number')) {
      throw new Error('The scenario catalog contains missing/duplicate records.');
    }
    return payload.records;
  }
  async function checkApiHealth() {
    diagnosticInfo.hidden=false;
    diagnostics.disabled = true;
    diagnosticInfo.textContent = 'Checking Cloudflare FastAPI health…';
    try {
      const response = await fetch('/api/health', {
        headers:{Accept:'application/json'}, cache:'no-store', signal:AbortSignal.timeout(7000)
      });
      const type = response.headers.get('content-type') || '';
      if (!response.ok || !type.includes('application/json')) {
        diagnosticInfo.textContent = 'API returned HTTP ' + response.status +
          '. The configured examples can still load from a build-verified Python snapshot. ' +
          'Your personal plan requires a healthy API.';
        return;
      }
      const health = await response.json();
      diagnosticInfo.textContent = health?.ok === true ?
        'FastAPI health verified now. You can evaluate your own confirmed plan.' :
        'FastAPI returned an unverified health response. Your own farm assessment is not available.';
    } catch (err) {
      diagnosticInfo.textContent = 'Live API network check failed (' + (err?.name || 'NetworkError') +
        '). The Python-built example snapshot is independent of this connection; do not treat it as live farm data.';
    } finally { diagnostics.disabled = false; }
  }
  async function loadCases() {
    const token = ++caseRequest;
    refresh.disabled = true;
    statusLine.textContent = 'Loading 100 engine-calculated teaching cases…';
    try {
      let result, provenance, liveError = '';
      try {
        result = await json('/api/feasibility-scenarios', 5500);
        checkCases(result);
        provenance = 'live_fastapi';
      } catch (error) {
        liveError = error?.message || 'unreachable';
        result = await json('/feasibility-examples-snapshot.json', 9000);
        if (result.catalog_source !== 'prebuilt_python_engine_snapshot' ||
            !result.snapshot_generated_at_utc ||
            result.snapshot_generated_at_utc !== result.evaluated_at_utc) {
          throw new Error('Build-time Python snapshot provenance could not be verified.');
        }
        checkCases(result);
        provenance = 'build_python_snapshot';
      }
      if (token !== caseRequest) return;
      records = result.records;
      if (!records.some(item => item.id === selectedId)) selectedId = records[0].id;
      currentPage = 1;
      setCount('all',records.length);
      for (const key of ['feasible','blocked','unknown']) {
        setCount(key, records.filter(item => item.result.status === key).length);
      }
      setCount('packages', records.filter(item => item.result.packages.length > 0).length);
      sourceLabel.textContent=provenance==='live_fastapi'?'FastAPI · live calculations':'Python snapshot · not live';
      statusLine.textContent= '100 checked cases · '+
        (provenance==='live_fastapi'?'engine refreshed ':'snapshot built ')+
        (provenance==='live_fastapi'?result.evaluated_at_utc:result.snapshot_generated_at_utc)+
        ' · configured examples, not farm records';
      diagnosticInfo.textContent=provenance==='live_fastapi'
        ? 'Example API is responding. Your farm assessment still requires separate declared inputs.'
        : 'Live example API unavailable ('+liveError+'). Only the source-verified build-time cases are shown. Run Check API for details.';
      download.disabled = false;
      drawList(); drawCase();
    } catch (error) {
      if (token !== caseRequest) return;
      records = [];
      selectedId = '';
      caseList.replaceChildren(node('p', 'fw-status',
        'Example library could not be verified: ' + (error?.message || 'Network issue') +
        '. Use Recalculate 100 cases to retry.'));
      detail.replaceChildren(node('p', '',
        'No verified examples are available. Select Check live API to inspect connectivity.'));
      statusLine.textContent = 'Unable to verify a live or build-certified example catalog.';
      download.disabled = true;
      sourceLabel.textContent='Data unavailable';pinnedId='';comparison.hidden=true;
      for (const key of ['all','feasible','blocked','unknown','packages']) setCount(key, '—');
      caseMeta.textContent = 'Use Recalculate 100 cases or Check live API.';
    } finally {
      if (token === caseRequest) refresh.disabled = false;
    }
  }
  function exportCases() {
    if (records.length !== 100) return;
    const headings = ['example_id', 'seed_id', 'variant', 'label', 'data_kind', 'status', 'target_handling_units', 'capacity_handling_units',
      'shortfall_handling_units', 'required_hours', 'time_to_deadline_hours', 'time_slack_hours', 'readiness', 'minimal_packages_count'];
    const encode = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const lines = [headings.map(encode).join(',')];
    for (const r of records) {
      const a = r.assumptions, b = r.result.baseline;
      const values = [r.id, r.source_seed, r.variant, r.label, 'configured_example_not_farm_observation', r.result.status,
        a.target_units, a.capacity_units, b.shortfall_units, a.required_hours,
        a.hours_until_candidate_deadline, b.time_budget.time_slack_hours, a.readiness, r.result.packages.length];
      lines.push(values.map(encode).join(','));
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' }));
    const a = node('a');
    a.href = url; a.download = 'jalna-100-planning-examples-api-calculated.csv';
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
        const row = node('button', 'fw-history-row fw-history-action');
        row.type = 'button';
        row.setAttribute('aria-label', 'View verified NASA historical record for ' + day.date);
        row.addEventListener('click', () => {
          climateInfo.hidden = false;
          climateInfo.textContent = day.date + ' · NASA POWER district-reference grid. ' +
            (day.precipitation_mm_day === null ? 'Rainfall value not published; ' : 'Historical rain ' + number(day.precipitation_mm_day) + ' mm/day; ') +
            (day.temperature_c === null ? 'temperature value not published.' : 'historical temperature ' + number(day.temperature_c) + ' degrees C.') +
            ' Neither reading is a forecast or direct measurement at your farm.';
        });
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
  const onFilterChange=()=>{
    currentPage=1;
    const matches=filteredCases();
    selectedId=matches[0]?.id||'';
    drawList();drawCase();
  };
  search.addEventListener('input',onFilterChange);
  variant.addEventListener('change',onFilterChange);
  sort.addEventListener('change',onFilterChange);
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
