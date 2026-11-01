# CF-SOURCE-01 — Interactive Verified Sources Workbench

**Project:** HACKVERSE 4.0 / Agri Foresight. **Platform:** Cloudflare Workers only. **Reference:** existing verified production `agri-foresight.nirmikchawale1.workers.dev`. **Scope:** the "Verified sources · independent status" section at the bottom of the homepage. **Important:** No separate app, external hosting provider, speculative data engine, or invasive dashboard redesign.

## Optimized master execution prompt

> Act as the senior Cloudflare Worker/TypeScript UI engineer, evidence provenance auditor, agricultural decision-systems specialist, accessibility designer, and independent release engineer for the existing Agri Foresight app. First inspect the current protected main branch, its five source statuses, actual source-API contracts, source receipt artifacts, and browser tests. Redesign the static five source cards into a responsive, accessible, interactive **Source Evidence Workbench**, reusing current `/api/health`, `/api/sources`, `/api/forecast`, `/api/government-climate`, and genuine `/api/evaluate` interactions. Give every source a useful inspectable detail view, concrete evidence coverage, source time, explanatory limitations, and real next action. Add functional filtering, individual source refresh where supported, status-only receipt downloads, official IMD handoff, and a truthful no-data path. Make all five cards and every action work; do not claim unavailable sources are live. Preserve the current native full-stack architecture, all six routes, the 100-case feasibility explorer, existing font/sidebar/glassmorphism design, English/Marathi/Hindi, mobile accessibility, and the protected Cloudflare-only release process. Implement as a small reviewable PR, run browser/Worker/Python gates, then independently certify exact public production SHA and the five interactive source behaviors before reporting deployment as complete.

## Grounded five-source product contract

| Source | Available evidence | User interaction | Never claim |
|---|---|---|---|
| FastAPI decision engine | Verified `/api/health` plus `/api/sources`, real version and registry size | Inspect source registry; navigate to actual server-backed evaluation | Connected API = feasible agricultural plan |
| Open-Meteo | Existing validated current model forecast, retrieval timestamp, number of hours and nonnull precipitation coverage | View planning timeline; explicitly refresh genuine forecast | Exact rain onset, rain-gauge readings, crop-safe time, missing-as-zero |
| NASA POWER | Existing validated government historical gridded dataset, number of days and latest actual historical date | Review history chart and native rows; refresh historical dataset | Future model forecast, farm-level observations or forecast verification |
| IMD official warnings | **No in-app official warning feed currently connected** | Open the verified official IMD district-warning website in a new tab | "No warning" or "Safe" based on an unconnected API or merely opening a page |
| Farmer resource assessment | A real validated FastAPI response only after farmer-entered inputs | Navigate to declarations or actual assessment; inspect backend constraints | Farmer resources are physically confirmed or any auto-applied modification |

Official external IMD reference: https://mausam.imd.gov.in/responsive/districtWiseWarning.php (link is navigation only; warning content is **not** ingested into this app).

## UX acceptance

- Preserve five **individually selectable** cards in existing theme, with accurate response-status text, concise evidence counts, and visible selected states. Default source may be Open-Meteo.
- Provide functional `All five`, `With a response` and `Needs action` filters, with actual dynamic counts. "With a response" means source/backend evidence exists, **not** agricultural safety.
- A selected source opens a detail section showing source metadata, source timestamp versus browser check time, data coverage and its appropriate unit, what can be decided, what cannot be inferred, and buttons that really work.
- Refresh Open-Meteo using the existing authenticated backend forecast refresh; refresh NASA POWER using the existing government-climate loader. These actions must not fabricate or locally compute new weather.
- Farmer evaluation only through the existing real evaluation page; never fabricate an assessment or use browser-side feasibility inference. Any input change invalidates the former decision.
- The IMD button opens the *official district warnings* page externally with disclosure that the app has no verified live IMD integration. Do not use IMD to infer safety or claim a cleared warning.
- Download only a timestamped, explicitly disclaimed **source status** JSON receipt. Do not include farmer quantities, personal information, tokens, or URLs created from user input. Do not imply this receipt is a government certificate.
- Keep English, Marathi and Hindi labels, mobile widths 390 and 740, keyboard navigation, focus outlines, aria-pressed on source/filter controls, accessible responsive text, no horizontal overflow, no decorative nonfunctional controls.
- Preserve the existing F12 independent statuses, F13 source activity receipts, F17 FastAPI diagnostics, print receipt, Page 02 forecasting, Page 06 evidence source registry, and any 100-case feasibility work.

## Data validation and conditions

1. Source status comes from genuine previously validated server responses; `cached_recent` is **not** presented as live network retrieval.
2. Forecast is current only when existing `isCurrent()` returns true (two-hour maximum age and supported Jalna scope).
3. A null rainfall hour reduces coverage, never becomes zero, and never yields an implied rain-free or agronomic decision.
4. NASA status requires proper `government_gridded_historical` kind, NASA government source identity, validated retrieved/cached status, and at least one real day.
5. An IMD warning gap is always disclosed until a separate real authorized integration is delivered.
6. Server assessment status must derive only from a validated `/api/evaluate` response bound to a real request; no double-counting requested but unconfirmed resources.
7. Unsupported locations deactivate Jalna-specific source evidence; browser network connectivity alone cannot establish external provider availability.
8. Server timestamps are kept distinct from the browser's `checked at` timestamp. Recalculating ages does not download data. Any refresh explicitly requests the provider.

## Validation and release gates

- Exact candidate JS syntax/typecheck; frontend unit, dependency audit, production build, and complete Chromium suite; new independent source workbench browser tests for available, stale, unsupported, official link, refresh, download, mobile, keyboard, translations and FastAPI response invalidation.
- Existing genuine FastAPI + six-page integration suite, Python tests, and local Cloudflare Python Worker checks. No weakening of previous gates.
- Reviewed PR; protected `main` merge only when exact candidate required checks are green and branch is not behind main.
- Exact merged SHA must appear in public Cloudflare `/_release.json`. The original clean workers.dev domain must serve HTTP 200 health, honest Open-Meteo/NASA contracts, all six pages and tested interactive workbench behavior.
- Fail closed. Distinguish **DESIGNED, COMMITTED, CI-PASSED, MERGED, DEPLOYED, PUBLICLY VERIFIED** precisely. Cloudflare only. No Vercel work, new hosting accounts, secret handling, billing, paid domains, or unauthorized DNS changes.

## Explicit non-goals

No official IMD API simulation, no automatic hazard clearance, no new farmer model, no unnecessary network polling, no location-specific decision beyond Jalna, no replacement of existing forecast/feasibility engines, no external analytics, no speculative backend new endpoints. Maintain upstream provenance and current source data quality.
