# WXR-02 — Agri Foresight Weather & Planning Window Major Restructure

## MASTER EXECUTION PROMPT — CLOUDFARE WORKER ONLY
**Authority:** User-requested Weather & window Page 02 restructure, 1 November 2026. Supersedes earlier hosting-provider guidance. Follow `AGENTS.md` and the latest protected-main requirements.

### Role and objective
Act as senior TypeScript/FastAPI engineer, design-systems specialist, weather-data provenance auditor, UX accessibility tester, and independent Cloudflare release engineer.

Bring **Page 02 — Weather & planning window** from a primarily static weather-data receipt to a responsive, farmer-usable, source-authenticated planning workspace. Every apparent control must have a real operation, discoverable precondition and accurate state. Eliminate decorative action cards, silent disabled states, misleading weather readings, confusing past-hour selections and inaccessible overflow. Do not extend the scenario beyond **already-picked cotton preparedness in Jalna, Maharashtra**. Never represent modeled weather as observed farm conditions or an agronomic safety threshold.

This is an **implementation and release task**, not just a redesign description. Inspect the latest repository, work on a short-lived branch, create tests, obtain mandatory checks, merge only with valid release authorization, and certify the exact deployed Cloudflare build. Report IMPLEMENTED, TESTED, MERGED, DEPLOYED, PUBLICLY_VERIFIED separately.

### Authorized repository and deployment
- Source: https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL
- Protected branch: `main`; discover its current SHA rather than assuming it is static.
- Production target: existing Git-connected Cloudflare Python Worker `agri-foresight` plus Vite assets. Check `wrangler.jsonc` and Cloudflare Git settings before claiming an automatic deployment.
- Approved production URL candidate: https://agri-foresight.nirmikchawale1.workers.dev/ . If this does not serve the exact accepted release, report that honestly; do not substitute a temporary or preview hostname.
- Historical hosting resources are entirely out of scope. Never configure, deploy to, debug or spend effort on the prior provider.
- No paid services, API secrets in source, custom unregistered domains, login/marketplace, invented credentials or Cloudflare account-setting mutations without specific authorization.
- Respect required branch-protection contexts, currently `TypeScript, audit, build and Chromium` and `Backend tests + real six-route/browser smoke`. Recheck on the exact candidate commit.
- Treat PR PASS as code certification, not production certification. Do not claim the canonical host is current until `/_release.json`, `/api/health`, actual weather responses, and public browser verification agree.

### Starting evidence and problems
Four supplied desktop screenshots of Page 02 show the problem clearly:
1. Model Evidence includes source disclaimers and forecast-window cards, but lacks sufficient chart controls, day navigation, metric switching and immediately actionable evidence exploration.
2. The hourly table lists older past hours first. Correctly disabled past actions look like a broken planning workflow; current/future planning candidates must be surfaced first, while past data remain inspectable.
3. Forecast Evidence Quality has eight source metrics that are essentially passive display tiles, with no drilldown to missing values or explanations.
4. Candidate deadline entry offers no strong step-by-step selection/saving/assessment guidance and poorly communicates the dependency on later resource assessment.
5. CSV export disabled states and stale/unavailable/error states need an explicit reason and recovery action.
6. Desktop, mobile, dark/light themes, three languages, keyboard, screen readers and reduced-motion preferences must retain coherence.

### Nonnegotiable scientific and evidence integrity
- Current valid weather comes **only** from the existing backend-authenticated Open-Meteo `GET /api/forecast`, status `retrieved_live` or `cached_recent`, within the backend two-hour freshness contract, with validated `Asia/Kolkata` timezone, `mm` precipitation and `%` hourly precipitation probability.
- Never swap in fixtures, hardcoded rainfall, guessed rates, climatology, browser pseudo-random values, default zeros, or unlabeled stale caches. Browser tests may use isolated intercept fixtures explicitly labeled test-only.
- Rain probability is **hour specific**. Do not sum probabilities, claim it predicts the exact start of rain, or claim a whole-period probability based on the maximum hourly probability.
- Rainfall `null` is **unknown**; do not show it as zero. `0 mm` is a model reading, not a guarantee that conditions are dry. A source timestamp absent from a sequence is a gap, not a dry hour.
- Never generate or imply a rain-safe threshold, safe storage assurance, 100% certainty, farmer-specific agronomic suitability, guaranteed loss reduction or field-validated readiness.
- The selected deadline is **farmer chosen**. A source-native future forecast hour can prefill it, but must be explicitly saved before influencing resource calculations. Manual deadline choice must remain available when the provider is offline, unavailable or stale.
- Any feasibility decision, time slack, blockers or candidate comparison must originate from the existing FastAPI backend `/api/evaluate`, `/api/compare` or `/api/replan`; frontend can display basic date arithmetic only when unambiguously labeled as such.
- Data-quality counts must be computed on the actual validated response (record count, coverage, nulls, duplicate timestamps, gaps, UTC retrieval and forecast age). Preserve provider license/attribution.
- NASA POWER historical data must stay labeled historical and separate from Open-Meteo forecasts. Never merge their values as equivalent observations.
- All unsupported cities must show honest unsupported states; no silent Jalna fallback.

### Required UI architecture

#### A. Interactive Model Evidence Forecast Explorer
Create a genuinely interactive dashboard above or within the existing precipitation timeline with:
- A clear header, provenance badge, retrieval UTC time, model freshness and IST scope.
- Switch modeled precipitation (mm) versus hourly precipitation probability (%). Preserve actual source values; never normalize a bar without explaining the axis or its value.
- Day selection and previous/next time-window navigation for the **future available model hours**; show how many hours are visible and how many source-native hours remain.
- Explicit missing-value visual treatment, keyboard-focusable actions and readable tooltip/labels.
- Click a current future hour to draft a proposed deadline and bring the deadline editor into view. Display the rule: **Choose → Review → Save**.
- Preserve the existing full-table and model-quality views rather than dropping prior evidence features.
- If there are no eligible future model hours, explain exactly why and route the farmer to manual planning; do not show past hours as selectable.

#### B. Guided Planning Window
- Make a three-stage pathway visible: **Choose candidate → Save assumption → Declare resources / Assess in FastAPI**.
- Provide a real working next-available-model-hour button when valid hours exist, an explicit save action, and a continue-to-resources action. Disabled controls must have a visible explanation.
- Distinguish unsaved form edits, saved candidate time, source-matched model hour and manually selected time.
- Optionally show the arithmetic hours until the proposed deadline, sourced from the browser clock; do **not** label it a rain-safe window or backend resource feasibility result.
- Reject past/invalid deadlines with visible error messaging. Saving a deadline does not automatically alter resource inputs or run the assessment.
- When context changes (place, data freshness, language, manually edited deadline), invalidate stale dependent decisions and retain user agency.

#### C. Clickable Forecast Evidence Quality
- Each of the eight quality cards must be a semantic button with readable label, numerical value, keyboard focus and an opened explanation.
- Cover provenance, UTC retrieval, elapsed/freshness, record count, rainfall coverage, probability coverage, duplicate timestamps and hourly gaps.
- Missing data cards should drill down into the correct subset of source hours, with precise timestamps and an escape path back to all records.
- A zero value is a valid zero for a count; explain it as **zero affected records**, not as an empty placeholder.
- Export verified CSV from the actual current source, guard CSV spreadsheet formula injection, preserve null as empty and include attribution/status/retrieved timestamp and disclaimers.

#### D. Full Model-Hour Timeline
- Sort **future selectable hours first**, then past evidence-only hours, while keeping the complete source-native table accessible by default.
- Add filters for all hours, upcoming candidate hours, past evidence, missing rainfall and missing probability, plus existing IST date filter.
- Each future button must draft exactly that model hour; past/unavailable/stale times must never be selectable.
- Provide selected-day CSV only after choosing a date, with an accessible disabled-state reason.
- Explain no-results filters with usable recovery, without fabricating readings.

### Visual design and accessibility
- Preserve Agri Foresight brand/logo, current fonts, glassmorphism design tokens, six-screen sidebar, responsive spacing, dark/light templates, and existing Page 02/card hierarchy.
- Keep minimum touch-target height about 44 px, readable text >= 12 px for controls, high-contrast focus outlines, proper `button`/`label` semantics, named regions, `aria-expanded` for inspector state and live status feedback.
- Avoid content clipping, stuck scroll panes, stray nested scrollbars, sticky overlap, visual jitter, layout shifting and side-to-side overflow at 390 px phones, 768 px tablets and standard desktop widths.
- The three supported user-facing languages (English, Marathi, Hindi) must remain understandable; never translate/modify provenance values, timestamps or physical units incorrectly.
- Respect reduced-motion and print. No unnecessary new dependencies or a competing design system.
- Maintain useful genuine states: loading, current, cached recent, stale, unavailable, unsupported location, missing values, unsaved candidate and valid candidate.

### Implementation scope and dependency order
1. Read `AGENTS.md`, current `main`, relevant open PRs and exact Cloudflare release workflow.
2. Audit `frontend/public/connected.js`, `frontend/public/model-evidence.css`, `frontend/index.html`, `frontend/tests/browser/*`, `frontend/src/contracts.ts`, `backend/unlockplan/weather.py` and existing source validation before editing.
3. Freeze backend contracts unless a reproducible defect requires a tested, minimal Python fix.
4. Implement data-first chart controls, hourly filters, QC inspection and deadline pathway within the existing application lifecycle, not a second standalone application.
5. Reuse the current global theme tokens and add a narrowly scoped CSS module. Do not overwrite the typography/sidebar/feasibility modules.
6. Add Playwright tests proving all new controls work, exact source fidelity, null handling, future vs past eligibility, save/continue, stale and unsupported states, mobile widths and keyboard operation.
7. Run JavaScript parse, TypeScript `tsc`, frontend build, `npm audit`, scoped Chromium, existing browser regressions, backend tests and Cloudflare-local Worker smoke. Investigate failures at exact candidate SHA; no blind retries or force merges.
8. Create a reviewable PR against the latest protected `main`; reconcile concurrent changes without clobbering them. Confirm required checks terminal SUCCESS.
9. After proper merge authorization, release through the **existing Cloudflare Git integration only**; do not trigger any prior-provider deployment.
10. Verify the **canonical Cloudflare host**: release SHA, health, actual model response or honest degraded state, source quality, model chart, user-selected deadline, real API evaluation, exports, desktop/mobile nav, languages, themes and unsupported locations.
11. Publish an evidence-backed release certificate with exact source SHA, actual Worker URL, test links, observed values, missing gates and rollback commit. Never confuse a temporary preview with production.

### Acceptance criteria and release gates
- AC-01: All Page 02 visible actionable controls have a real handler and a comprehensible enabled/disabled reason.
- AC-02: The rain/probability switch is data-correct and never treats missing data as 0.
- AC-03: Date selection and window pagination cover the authenticated future timeline without inventing timestamps.
- AC-04: Past-hour actions cannot be selected; current future actions can select and bring the editor into view.
- AC-05: Saving really persists the selected candidate in the existing application state.
- AC-06: No pretend weather-based safe timing; future candidate is labeled user-chosen.
- AC-07: QC tiles are keyboard-accessible and reveal true record-specific explanations.
- AC-08: Quality drilldowns match exact current source hours.
- AC-09: Table filtering, future-first sorting and selected-day CSV work.
- AC-10: Source CSV preserves timestamps, numerical units, provenance and unknown values.
- AC-11: Stale, null, failure, offline and unsupported-location states avoid false evidence.
- AC-12: Existing six-screen application, Feasibility, Farm Resources and Plan Summary work unchanged.
- AC-13: Responsive, theme, language, reduced-motion and keyboard checks pass.
- AC-14: Both protected-main required GitHub checks are successful on the accepted exact source commit.
- AC-15: The Cloudflare production URL (not the prior provider and not an unverified preview) serves that accepted SHA.
- AC-16: The public Worker health, source routes and genuine browser flows pass independent smoke.
- AC-17: Evidence certificate distinguishes created, code-validated, merged, deployed and publicly verified.

### Failure and recovery protocol
If access to Cloudflare or remote browser verification is unavailable, **stop at the real gate**: keep the verified implementation on a PR branch, report the exact missing permission or public certificate step, and give a precise single next action. Never assert deployment by inference from a GitHub commit. If a required test fails, isolate its smallest reproducible defect, patch only that defect, rerun focused tests, and then rerun required gates. If public Cloudflare shows a different SHA, preserve deployed production and investigate Git integration or stale deployment rather than rewriting unrelated code.

### Definition of done
Only mark WXR-02 `PUBLICLY_VERIFIED` when source data, all interactions, accessibility checks, branch protection, exact source SHA and **the actual updated canonical Cloudflare web application** are independently verified. Otherwise provide a precise truthful status and next blocker, with no invented completion.
