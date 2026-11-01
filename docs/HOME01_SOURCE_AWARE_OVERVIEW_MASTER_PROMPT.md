# HOME-01 — Source-Aware Overview and Preparation Snapshot
**Project:** HACKVERSE 4.0 • Agri Foresight (UnlockPlan implementation)
**Repository:** https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL
**Target:** Existing six-screen Cloudflare candidate `migration/cloudflare-typography-01`; do not create a second application.
**Status:** Scoped code candidate — GitHub CI and deployment remain separate release gates.

## Master execution prompt

> Act as the senior TypeScript/FastAPI engineer, climate-evidence auditor, accessibility-focused UX lead and independent release verifier. Inspect latest code, source/response contracts, actual authenticated weather records, saved user declarations, and the deterministic Python assessment. Replace empty-looking Overview content with traceable, actionable values in **all four At a Glance cards** and in the matching **Preparation snapshot**, preserving the exact existing white/gold/green glass visual system. Do not imply that an absent input or unrun calculation has happened. Work in one minimal feature branch, prove the old six-page workflows still work, pass appropriate CI and browser gates, and merge only after established release permissions. Never interpret a GitHub commit as proof of a live Cloudflare deployment.

## Non-negotiable boundaries

1. Keep Jalna, Maharashtra, already-picked cotton as the only assessed agricultural scenario. Other selected locations are visibly unsupported.
2. The source-backed precipitation value is an **Open-Meteo model forecast**, not an observed rain gauge, a certain rainy period, a safe handling threshold, or a farmer-specific forecast.
3. NASA POWER, when available, is independently labeled **historical daily gridded evidence**; never combine its historical values into an upcoming forecast total or the feasibility engine.
4. Only valid, currently fresh (at most 2 hours old according to existing backend policy) Open-Meteo hours may produce a forecast headline. No fake rain, extrapolation, zero-filling, silent cache resurrection, or invented soil/readiness data.
5. The user's chosen IST deadline must be explicit; a 6/12/24h forecast *review horizon* is not a secretly selected deadline.
6. Resources are **farmer reported** and may be unknown; never auto-populate quantities, equipment, workers, site readiness, or confirm requested options.
7. Only a validated response to the real `POST /api/evaluate` endpoint may display **FEASIBLE, BLOCKED, UNKNOWN, COMPLETED**, actual constraints or shortfall. Merely connecting to FastAPI is not an evaluation.
8. Do not alter the authoritative Python engine, backend schemas, six-page navigation, forecast source controls, or the Decision Pathway card. Keep the previously repaired Preparation Snapshot bottom aligned with the Decision Pathway card on desktop.
9. English, Marathi and Hindi must remain consistent; screens must be responsive, readable, keyboard navigable and honest in missing/error/stale conditions.

## Explicit presentation contracts

| Surface | With genuine verified state | Without that state |
|---|---|---|
| Forecast evidence | Modeled 24h precipitation in **mm**, only when all 24 consecutive source-native hours have numeric values; otherwise report actual future model-hour count and rainfall coverage with Open-Meteo provenance and IST timestamp | Actionable `Refresh weather evidence` plus an explicit source limitation, never sample values |
| Preparation deadline | Saved farmer-selected IST candidate and derived time remaining, explicitly not a rain threshold | `24h model outlook` and `6 / 12 / 24h` exploration links when source is current; otherwise invite a manual IST deadline |
| Farm resources | Exact capacity/target/duration and reported readiness from currently acknowledged, unchanged farmer inputs | `4 planning inputs` (target, capacity, duration, site readiness), or accurate draft progress; no invented farm inventory |
| Feasibility status | Actual FastAPI result with constraint count and backend shortfall | `FastAPI ready` when the service is really healthy, or `Check Python service` when connectivity is unavailable |
| Preparation snapshot | Real location, selected deadline or clearly uncommitted model horizon, current user declarations, and FastAPI result/status | Scope/provenance explanation, meaningful model windows, four required resources, and engine readiness — no fake completed assessment |

## Data and failure paths

- Call the existing `/api/health`, `/api/sources`, `/api/forecast` and `/api/evaluate` integrations; reuse the existing data from `connected.js` rather than adding duplicate requests.
- Use real browser clock, `Asia/Kolkata` for source dates and deadlines, strict future timestamps, and robust handling of stale response status.
- For a 24h numeric headline, require 24 distinct, consecutive hourly timestamps and 24 non-null finite modeled precipitation values. Missing/null is **not** zero.
- On source refresh/failure, location switch, pending input edits, evaluation reset, language change, stale-after-two-hours, or document visibility return, update all relevant overview displays coherently.
- A saved farmer draft must not be mislabeled as confirmed when the visible form has been edited or the acknowledgement was withdrawn. Existing legacy sample data must never be silently promoted to real farm evidence.
- Keep session privacy boundary: no extra analytics, farm-record uploads, or data persistence introduced by this feature.

## Required validation

1. Audit actual changed-file diff and check that no unrelated UI/CSS/backend rewrites occurred.
2. JavaScript parses and TypeScript/Vite builds.
3. Test complete 24h model, null/partial gaps, stale/unavailable forecast and unsupported places — no false rain total.
4. Test no farmer declaration at startup, partial draft, saved self-reported inputs, stale edited form and reset behavior.
5. Test real FastAPI assessment result, frontend never independently calculating a success status, actual backend shortfall and server errors.
6. Verify responsive widths 390, 960, 1180 and 1440 px; no horizontal scrolling; both bottom card edges aligned on desktop.
7. Check multilingual labels, accessibility and keyboard/click navigation.
8. Require exact candidate **B-01 frontend/Chromium**, **B-03 genuine FastAPI integration** and, before public release, **Cloudflare Worker locally tested runtime**, account preview, explicit source SHA, public API and responsive checks. Preserve protected `main` and existing Vercel rollback until authorized certification.

## Deliverables and truthful reporting

- Minimal reviewed patch, browser regression suite and screenshot/visual evidence where runnable.
- Tested exact Git commit and PR link, CI names/results, remaining blockers.
- Separately report **CREATED**, **SYNTAX-CHECKED**, **BROWSER-TESTED**, **MERGED**, **DEPLOYED** and **PUBLICLY VERIFIED**. Do not claim the later stages without evidence.
