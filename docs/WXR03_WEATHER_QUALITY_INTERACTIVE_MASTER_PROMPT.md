# WXR-03 — Weather evidence quality: interactive redesign and Cloudflare-only production release

## ROLE AND MISSION
Act as a senior TypeScript/Vite developer, accessible UX engineer, weather-provenance auditor, GitHub branch-protection release engineer, and independent Cloudflare production verifier.

Task: transform the existing Page 02 Forecast Evidence Quality area from static explanation cards into a genuinely interactive, model-native data-quality workbench. Entirely remove the three adjacent WEATHER & WINDOW sub-blocks: Forecast freshness, Planning timeline, and Uncertainty matters. Preserve the other five routes, scientific engine, source data, themes, languages, and accessible navigation.

Scope: ONE existing Agri Foresight MVP (no second app, screenshot-only solution, fake backend, synthetic production data, login or external paid service). The only public deployment target is https://agri-foresight.nirmikchawale1.workers.dev/. Source repository: https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL. The previous hosting provider is out of scope.

## SOURCE AND INVARIANTS
Read AGENTS.md, main SHA, current pull requests, frontend/index.html, frontend/public/connected.js, frontend/public/weather-workspace.css, existing WXR-02 tests, and the official release workflow before changing code. Branch from the latest protected main. Reconcile concurrent work without overwriting it and never force-push main.

Only display authenticated real Open-Meteo model hours from the existing FastAPI response, retrieved_live or cached_recent, subject to the existing two-hour freshness rule. Validate Asia/Kolkata timezone, precipitation in mm, hourly precipitation probability in %, UTC retrieval timestamp, and the existing supported Jalna pilot scope.

No invented model skill score, provider confidence, numerical agricultural safety cutoff, precise rain onset, field observations, yield/crop-loss impact or IMD warning connectivity. Model 0 mm is a model reading, not a guarantee of dryness. Null is UNKNOWN, never zero. Missing an hourly timestamp is a missing source record, never an implicit dry hour. Historical NASA POWER data is not a future forecast or field measurement.

A farmer-selected planning deadline remains a candidate assumption; this evidence dashboard cannot certify when work is safe. Preserve all existing authenticated source exports, timestamp selection, and the Python FastAPI feasibility contracts.

## DESIGN SPECIFICATION

### Remove three passive cards
Remove the entire three-card weather insight-row from Page 02 HTML, not merely CSS-hide it. Remove the blocks for Forecast freshness, Planning timeline, and Uncertainty matters. Do not leave a blank reserved height. Avoid deleting similarly named content in another page or disrupting the six-route sidebar.

### A. Interactive source-hour coverage
Keep the eight genuine quality metrics as interactive, semantic buttons. Clicking a metric must select it, focus its meaningful detail, and retain accessible keyboard focus. Use the existing forecastCoverage calculation; no second data source or model engine.

Create three meaningful workbench views: Hourly coverage, Exceptions, Source receipt. Allow the farmer to choose the source model date in IST. Show source-native completeness for each variable as count/total and percent reported (a field-completeness measure only, not weather forecast accuracy). Provide a grid of individually focusable hourly source records, visibly distinguishing 2/2 values, 1/2 and 0/2. On selecting an hour, show exact IST time, precipitation mm, hourly probability %, missing/unknown status, duplicate timestamp warning if applicable, and a working action that opens that exact time in the existing full model-hour timeline. Treat two records with the same timestamp as different records by source array index.

### B. Interactive exception explorer
Support working filters for all exceptions, missing rain values, missing probability values, duplicated hourly timestamps and absent expected hourly timestamps. Compute all anomalies directly from the accepted source response. Present real timestamps with the correct distinction between a null in an existing record and no record at all. Clicking an existing-record exception should select the corresponding hour in the hourly view. A gap should be described accurately without fabricated readings. A zero-anomaly filter should show a meaningful no-issues explanation, not a blank placeholder.

### C. Source receipt and recovery
Provide attribution, backend status, retrieval UTC, actual elapsed minutes, validated timezone and units, returned record count and source-value coverage. Link provider documentation. Explain modeled weather limitations. For stale/unavailable/unsupported location show no artificial hour grid, disable source CSV, and offer a genuinely working backend refresh operation when supported.

### D. Visual quality, accessibility, translation
Preserve the Agri Foresight glassmorphism theme, typography, existing CSS variables and sidebar, no new design system. Use existing --ink, --muted, --teal, --border, --card tokens. Responsive layout with no horizontal body scrolling at 390px, 768px and desktop. At least 44px actionable targets, labels, semantic buttons, aria-pressed on active selections, aria-expanded for the metric selector, proper focus outlines, keyboard selection, accurate dark/light contrast, reduced-motion support, print-safe handling. Keep new UI captions in English, Marathi and Hindi; numeric model values, units, source timestamps remain untranslated.

## EXECUTION PLAN
1. Audit current source, protected main, CI, existing live Cloudflare Worker, other active PRs. Confirm precise Page 02 DOM block and existing quality implementation.
2. Make smallest safe change to HTML to remove the exact three-card block.
3. Extend the existing quality rendering and source-validation functions; do not create an unrelated standalone screen.
4. Implement day-based hourly coverage, source index selection, precise readings, exception filtering and provenance receipt as real data-backed interactions.
5. Implement graceful stale/no-source/unsupported states and explicit recovery, keep existing CSV export contract and farmer declarations private.
6. Add narrowly scoped responsive CSS and Playwright tests. Test duplicate source timestamps, null values, zero rainfall, missing hourly positions, days, tabs, table cross-navigation, keyboard focus, 390px body overflow, three languages, themes and stale response.
7. Run Node tests, npm security audit, TypeScript type check, Vite build, Chromium whole-suite, FastAPI integration and Cloudflare-local Worker smoke. Stop and correct the smallest defect on any failure; never claim a failed run passed.
8. Create a PR against protected main. If main moved, reconcile without dropping the newest Farm Resources, Feasibility or Overview contributions. Require both mandatory main branch protection checks to complete SUCCESS on the exact merged candidate.
9. Merge only after required checks pass. Use the existing Cloudflare Git-connected Worker and do not touch the former provider.
10. Certify the exact public main SHA from /_release.json on the canonical workers.dev URL; run actual public /api/health, /api/forecast or honest unavailable state, public six-page browser smoke and new Page 02 interaction checks. Distinguish local CI success from public exact-SHA certification.

## ACCEPTANCE CRITERIA
AC01: All three specified cards absent from Page 02 DOM, with no gap.
AC02: Six-page layout, all nav routes and existing forecast/deadline controls retain functionality.
AC03: All eight forecast-quality metrics are real focusable controls with relevant detail.
AC04: User can switch coverage day and inspect actual returned model hour and two variables.
AC05: Source field completeness is not described as model accuracy, reliability, field readiness or safety.
AC06: 0 mm vs null, duplicate timestamp vs nonexistent gap, and missing probability are not conflated.
AC07: Five exception filter states are interactive and show complete, traceable actual results.
AC08: Selecting an issue or hour synchronizes with the existing authenticated full timeline.
AC09: Source attribution, status, UTC time, elapsed age, timezone and units remain correct.
AC10: Stale/unavailable/unsupported states cannot show falsely current data or enable CSV.
AC11: Translation, dark/light, mobile/tablet/desktop, focus and screenshot layout do not regress.
AC12: New tests and every mandatory GitHub status check PASS on the accepted exact candidate.
AC13: Protected main incorporates the change without clobbering unrelated concurrent work.
AC14: Canonical Cloudflare Worker serves the exact merged SHA and passes public real-API and desktop/mobile browser certification.
AC15: Final handoff includes PR URL, merged SHA, certified public URL, CI run and objective status: CREATED, TESTED, MERGED, DEPLOYED, PUBLICLY_VERIFIED.

## RELEASE HONESTY
Do not claim public deployment simply from an accepted GitHub commit, a preview link, a local Python Worker PASS or a successful browser fixture. The exact public /_release.json and real public browser/API validation are required. If any gate is blocked, name the specific reason without inventing completion or silently weakening source integrity.
