# WXR-04 — Compact Weather Evidence and Candidate Deadline
## Comprehensive optimized execution master prompt, 1 November 2026

Act as senior UI/UX engineer, TypeScript/Vite developer, weather provenance auditor, FastAPI integration tester, accessibility specialist and Cloudflare release controller.

Objective: radically simplify the two Page 02 panels, MODEL EVIDENCE and YOUR PLANNING WINDOW. The current cards are excessively tall, cluttered with passive receipts, paragraphs and redundant planning controls. Deliver a compact, genuinely interactive two-step forecast-and-deadline workspace in the existing SINGLE six-page Agri Foresight application. No mock visual redesign, no new app, no fabricated source data.

Canonical GitHub: https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL
Canonical production: https://agri-foresight.nirmikchawale1.workers.dev/
Only deploy to the current Cloudflare Python Worker with Git-connected Vite assets. Old hosting provider is explicitly out of scope. Read AGENTS.md and current main SHA before implementation.

### 1. Layout and product boundaries
- Desktop: an equal-width 50/50 two-card grid with roughly matching heights, proportionately shorter than the previous implementation. At small viewports stack naturally.
- Maintain Agri Foresight glassmorphism, typography, color variables, dark/light themes, navigation, scrollbar ownership and responsive layout. No broad unreviewed CSS changes or heavy new dependencies.
- Remove from these TWO cards: long static explanations; source strips; permanently visible last-success network receipts; redundant warnings; detailed noninteractive three-card data blocks; duplicated Save/Continue buttons; and the visible three-step planning diagram.
- Keep scientific details and receipts available in the existing separate interactive Forecast Evidence Quality panel, via a collapsed opt-in network receipt disclosure. Do not delete real evidence or source history.
- Keep any dynamically updated validation/status messages short. A status must be derived from real application state and never presented as a static theory panel.

### 2. Model Evidence card
- Compact title and actual API status badge. Make the status badge open/focus the source-quality inspector when clicked.
- Working Refresh authenticated Open-Meteo via FastAPI and Clear current forecast buttons. Never fabricate fallback weather.
- Three compact working range selectors: 6, 12, and 24 model hours. Default 24. Selecting a range changes how many authentic model hour bars are shown, not merely their appearance. Display source-native rainfall sums (mm) and coverage counts without implying a safe rainfall window. Include complete explanatory detail for accessibility.
- Compact rainfall mm / hourly precipitation probability % switch, IST model date filter, and previous/next pagination based on the selected horizon.
- Actual model-hour bar chart is horizontally scrollable within its own viewport; no body horizontal overflow. Each valid future bar is a keyboard-accessible button to draft that exact hour into the deadline editor; source hour is NOT automatically saved. Current/past bars cannot be selected as future candidates.
- Source timestamps, units, attribution, null values, stale-status validation, full model-hour table and CSV remain accessible outside these cards.
- Do not show large always-visible provenance notices, long descriptive summaries, decorative fake cards or static timeline warnings in this compact card.

### 3. Planning Window card
- Small title Choose candidate deadline.
- One working Use next model hour shortcut; disabled unless there is a current validated future model hour. Prefills only, not Save.
- One editable date-time input in India Standard Time. Manual future time is allowed even when the weather provider is unavailable. Validate invalid/past times.
- One visible Save candidate deadline button wired to the existing authoritative persisted state, and one Continue to resources button enabled ONLY after the currently displayed candidate is saved.
- Replace three-step diagram and duplicate Save and Continue controls with minimal dynamic status: chosen/saved, source-native versus manual, actual hours until candidate (browser-clock arithmetic only). Do not claim model safety, field advisability, predicted rain onset or successful FastAPI feasibility without an actual backend result.
- Keep existing state contracts: deadlineInput, deadlineOriginPreview, deadlineNotice, saveDeadline and the .goto resource navigation. Modify older tests carefully to reflect the now single-save action, not by weakening assertions.

### 4. Scientific, source and privacy rules
- Source current model forecast comes only from existing validated Open-Meteo FastAPI endpoint with backend freshness (120 minutes), correct Asia/Kolkata timezone, mm precipitation, % hourly precipitation probability, retrieval UTC, attribution, null and timestamp handling.
- Missing value is unknown; 0 mm is not proof of no rain; absent model hour is not a dry hour. Never invent forecast hours, trained prediction models, rain-safe thresholds, district warnings or crop/storage safety.
- Hourly probability must NOT be summed or represented as exact rain-onset or whole-window certainty.
- Keep NASA POWER gridded historical evidence distinct from future Open-Meteo model results.
- Preserve real farmer resource inputs and Python feasibility / compare / replan engine semantics untouched; do not leak farmer declarations into source receipt CSV. Browser tests may intercept test-only source fixtures but production never does.
- Unsupported places and disconnected providers expose accurate degraded states, not fake Jalna results.

### 5. Build and test protocol
1. Inspect latest repository, protected-main status, concurrent open PRs and exact Cloudflare release pipeline before changing code.
2. Make minimal targeted edits to Page 02 HTML, existing connected.js model and deadline flow, existing forecast windows, scoped CSS and focused browser tests. Reuse existing tested functions, no stack rewrite.
3. Visually check both equal-width/height cards at desktop and stacked mobile; check no blank bands, clipping, nested-scroll traps and no duplicate action buttons.
4. Test the three range selectors actually change valid source hour display; metric switch and date filters preserve native units, missing readings and source metadata; selected hour prefills the candidate date without saving.
5. Test default empty state, provider current/stale/unavailable, offline, unsupported city, manual input, invalid/past deadline, saved/unsaved state, Continue-to-resources gating, persistence, and FastAPI downstream evaluation.
6. Retest WXR-02/03, full hourly evidence, forecast window aggregate regressions, network receipts and CSV, all six pages, desktop/mobile, keyboard focus, print/reduced motion, English/Marathi/Hindi and light/dark.
7. Run required GitHub checks: TypeScript, npm audit, Vite build, full Chromium browser, FastAPI six-route integration and BOTH local Cloudflare Python Worker smoke workflows. Investigate single failing tests precisely, no blind CI retries.
8. Reconcile any newer main commit and parallel PR without destroying existing Farm Resources, Overview, Feasibility, source workbench or design-system changes. Use short-lived PR, never force push protected main.
9. Merge only after exact-head required PASS. Only existing Cloudflare Git integration may publish, no previous provider or preview substitute.
10. Certify exact merged SHA on canonical workers.dev URL with /_release.json, real /api/health and weather or honest unavailable, exact assets, real desktop/mobile six-page browser and live WXR-04 controls. Publish evidence links and status.

### 6. Acceptance criteria
AC01: Two panels share 50/50 desktop layout, approximately equal displayed height and materially reduced clutter; stack on mobile.
AC02: No permanent static network receipts, duplicate source strips, redundant stepper or duplicated Save action inside either card.
AC03: Status badge opens authenticated source-quality inspector; optional receipt remains accessible outside compact cards.
AC04: Selectable 6/12/24-hour controls display actual source sums/coverage and CHANGE the chart range (default 24).
AC05: Rainfall versus hourly probability switch, date filter, next/previous, valid future hour selection all work.
AC06: Unknown/null, zero, gap, stale and unsupported are never conflated.
AC07: One shortcut prefills; one Save persists; one gated Continue navigates; manual candidate works without live weather.
AC08: Full source evidence, CSV, six-page navigation and actual backend assessment keep functioning unchanged.
AC09: 390px/mobile/tablet/desktop, themes, trilingual UI, keyboard, focus, contrast and no body overflow validated.
AC10: Exact candidate mandatory CI all PASS, no unreviewed main overwrite.
AC11: Public Cloudflare release SHA matches main, real API/browser validation PASS and production explicitly confirms WXR-04 behaviors.
AC12: Final handoff distinguishes IMPLEMENTED / TESTED / MERGED / DEPLOYED / PUBLICLY_VERIFIED, with PR, SHA and CI URLs.

Stop at any true release gate failure; never claim a GitHub commit proves public deployment. The real canonical Cloudflare website is the only production outcome.
