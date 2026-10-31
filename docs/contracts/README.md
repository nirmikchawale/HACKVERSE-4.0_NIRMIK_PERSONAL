# A-05 — UnlockPlan API Contract and TypeScript Handoff

**Authoritative branch:** `feat/unlockplan-core`, PR #3. This document covers the backend after A-05; **frontend integration and production deployment remain separate workstreams.** The request/response types are in [`unlockplan-api.ts`](unlockplan-api.ts). They are manually maintained TypeScript contracts validated against tests, not a substitute for runtime JSON validation. The backend's `/openapi.json` is the authoritative HTTP request schema for compare/replan requests.

## Endpoint matrix (same-origin `https://<site>/api` after integration)

| Route | Request | HTTP 200 response | Error boundaries |
|---|---|---|---|
| `GET /api/health` | none | `HealthResponse` including local valid-cache presence (not freshness) | 5xx indicates runtime failure |
| `GET /api/sources` | none | `SourcesResponse` and evidence limitations | 5xx indicates runtime failure |
| `GET /api/forecast?refresh=false` | optional boolean refresh | `ForecastResponse`: `retrieved_live`, `cached_recent`, `stale_cache` or `unavailable` | **Forecast outage is a 200 payload with `status='unavailable'`, `hours=[]`**, not automatic HTTP 500 |
| `POST /api/evaluate` | full `PlanningCase` JSON object | `EvaluationResponse`; may be `feasible`, `blocked`, `unknown`, `completed` | 422 malformed/unavailable numeric/enum/ISO input |
| `POST /api/compare` | `{before: PlanningCase, after: PlanningCase}` | `ComparisonResponse` with changes and both evaluations | 422 for missing/bad cases or unsupported values |
| `POST /api/replan` | `{before, after, selected_hour_local}` | `ReplanResponse` with server-verified forecast-hour evidence | 422 for bad/missing cases, bad/past/unlisted hour; **409 for unavailable/stale forecast** |

## Frontend integration sequence

1. Retrieve `/api/health`, `/api/sources`, `/api/forecast`; render weather source, UTC retrieval time, `Asia/Kolkata`, grid cell and missing values. When `status='unavailable'`, show **no weather data**, an honest error message, and allow manual `/api/compare`.
2. Collect `PlanningCase` from the farmer: `now` is an explicit ISO timestamp with offset, `deadline` is a **user-selected candidate**, `required_hours`, `capacity_units`, `target_units`, readiness, and permitted changes. The only demonstrated unit is artificial `handling_unit`, **not** kilogram or real farm area.
3. Send a POST to `/api/evaluate`. Show each individual constraint, `known_blockers`, numerical time budget, conditional packages, and the unhandled remainder when `objective_changed=true`. Do not present minimal as cheapest or safe.
4. For manual edits send `/api/compare`; render `changes` and both outcomes. Do not infer a weather-driven cause when resource inputs also changed.
5. For forecast-associated scheduling, choose **only** an exact future `ForecastHour.time` from the recent server-returned timeline, then POST `/api/replan` with `selected_hour_local`; never submit your own synthetic or modified weather object. **The server retrieves its own current forecast.** A previously displayed hour can expire between GET and POST; handle 409 or 422 by refreshing the timeline and allow manual compare.
6. Handle `ErrorResponse.detail` as either a string (engine errors) or an array (FastAPI request-model validation). On 409, offer manual `/api/compare` instead of silently fabricating a weather deadline.
7. Apply no invented rainfall thresholds or agronomic safety labels. Current Open-Meteo output is a **model forecast**; actual suitability, crop loss, and safe storage are **not validated**.

## Data semantics and invariants

- `forecast_age_hours` means hours since external-model retrieval, **not** freshness of actual field observations. `GET /api/health` does not independently certify a fresh API response.
- Forecast payload `hours[*].precipitation_mm` and `precipitation_probability_pct` may be `null`; null means **unknown**, never zero.
- `replan` only accepts a **future** server-observed source-native hour (`YYYY-MM-DDTHH:MM`, no offset). The hour is a *chosen candidate deadline*, **not** weather prediction of rain onset.
- `now` in each plan is **user-declared**; ensure the UI uses an actual current timestamp and does not silently re-use yesterday's value. A-05 prevents past forecast-hour selections but does not claim to validate farmer-entered `now` against a field clock.
- Resource IDs are normalized; requested/unknown resources cannot be counted as confirmed; inclusion-minimal sets are **not** cost-optimized.
- `unknown` can coexist with `known_blockers`. Show both. `completed` is a separate outer status; the baseline still shows the underlying constraints.
- No real agricultural measurements are supplied by the abstract test fixtures in this repository. Demonstration calculations do not establish scientific effectiveness.

## Verification and scope

- Backend test suite includes the original 72 tests, A-05 API-contract tests and live-weather checks from A-03 retained unchanged.
- CI must pass the Python suite, SHA-256 manifest, legacy JavaScript syntax, and TypeScript contract compilation on the **exact PR head**.
- Vercel currently expects `frontend/`, which Workstream B must build; a failed preview of this backend branch is not a reason to merge unverified code.
- Do not merge or deploy solely because contract tests pass. Frontend browser checks, public route checks, and actual Vercel commit verification remain mandatory.
