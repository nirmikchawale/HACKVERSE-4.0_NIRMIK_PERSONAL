# UnlockPlan — P0 feasibility demonstrator

**Status:** Functional local code + automated tests; user-facing numeric presets removed in real-input-ready edition; **NOT P0-certified for release**. The live Open-Meteo request was blocked by this execution environment's DNS/network restrictions, so no genuine weather payload is bundled or falsely represented as fetched. The browser harness also blocked local navigation; browser-interaction QA is pending on a normal computer.

## Scope frozen from the final Perplexity handoff

- **Location:** Approximate Jalna reference (19.84°N, 75.89°E); not a field address.
- **Crop:** Cotton. **Disruption:** Potential rain exposure to *already-picked* material.
- **Mechanism:** Evaluate user-declared readiness, capacity and a user-selected preparation deadline; enumerate **inclusion-minimal** subsets of **confirmed, available, user-permitted** changes. Minimal means no change can be removed without losing feasibility; it does not mean lowest cost, fewest changes, or best agricultural outcome.
- **Actions:** Exactly one modeled target action in P0: prepare handling/protection for already-picked material. Up to four optional changes; no automatically generated harvesting prescription.
- **Inputs:** Forecast = Open-Meteo model, if genuinely retrievable. ICAR = historical context only. Target, capacity, deadlines, durations, location readiness and options = synthetic or user-reported. There is no trained model or yield/loss prediction.
- **Output:** feasible/blocked/unknown, blocker explanations, incomparable minimal packages, explicitly excluded unconfirmed options, and a conditional selected summary.

## Install and run

Requires Python 3.10+ and network access *only for installing dependencies and the actual weather API request*.

```bash
python -m venv .venv
# Activate .venv; on Windows: .venv\Scripts\activate
# On macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
python -m uvicorn unlockplan.api:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/` in a browser. For LAN exposure, change host only in a controlled private test environment; there is no account/security implementation.

### First mandatory live-data gate (do this before a public demo)

```bash
python -m scripts.verify_live
```

A success requires a real network response, the source URL, UTC retrieval time, `Asia/Kolkata`, documented hourly units, consecutive aligned timestamps, and a saved `cache/real_open_meteo_cache.json`. The cache is populated **only when the actual fetch succeeds and passes schema validation**. Otherwise exit code 2/3 indicates a blocker. Do not use fabricated weather as a replacement or describe a schema-mocked unit test as a successful live integration.

`GET /api/forecast?refresh=true` reattempts the genuine fetch. Cache younger than 2 hours is marked **cached_recent**; older cached data is **stale_cache**. With neither, the app visibly degrades to a resource-only sandbox. **No forecast threshold or automatic onset time is inferred.** No data was cached from this restricted environment.

## Engine acceptance fixture

Synthetic **abstract handling units** (not kg, hectares, protection efficacy, or field parameters):

- Target **10**, baseline capacity **6**, readiness user-confirmed, synthetic time slack sufficient.
- `A` additional confirmed +4 capacity; `B` confirmed +2; `C` explicitly lower this action's target by 2; `D` +4 *requested*, **not confirmed**.
- Inclusion-minimal sets **`{A}` and `{B,C}`**. `{A,B}` is a nonminimal feasible superset. `B` and `C` independently fail. `D` is excluded. `{B,C}` leaves **2 units of the original target outside the revised action**.
- The options are **conditional**: confirmed optional availability does not mean the change has already been completed.

The backend supports `target_units`, `capacity_units`, `baseline_resource_ids`, `readiness` (`yes|no|unknown`), timezone-offset `now` and user-selected `deadline`, `required_hours`, `completed` and up to ten changes (UI offers four). Each change has `id`, `type`, `unit`, `value`, `resource_id`, `availability`, `confirmation_state` and optional `cost`.

### API

| Endpoint | Description |
|---|---|
| `GET /` | Single-page product interface |
| `GET /api/health` | Version and whether a validated authentic-source cache record exists |
| `GET /api/forecast?refresh=true` | Fetch real Open-Meteo data or explicitly degrade |
| `GET /api/sources` | Source registry, historical guidance scope and developer rule provenance |
| `POST /api/evaluate` | Deterministic constraints and inclusion-minimal change enumeration |

### Automated tests

```bash
python -m pytest -q
```

Covered: minimal packages, set inclusion, no solution, unknown readiness, requested capacity, baseline and optional resource deduplication, incompatible units, reduced target, changed deadline, expired/missing weather, forecast zero-rain behavior, invalid values, provenance, actual-response cache schema (via **synthetic network stub in test only**), HTTP API, home page. Test weather fixtures are never shipped as a purported actual forecast.

## Scientific and legal boundaries

ICAR's historic 2011 Jalna contingency document notes cotton protection from drenching and soiling under unusual rains (section 2.2, printed pp. 21–22). This historical source **does not** establish current local agronomic suitability, harvest timing, chemical advice, storage safety, duration/capacity thresholds or quantified outcome benefits. The app's planning mechanics are developer interpretations; **not ICAR-issued digital prescriptions**. PDF text is linked and cited, not redistributed as a permissively licensed dataset.

Open-Meteo's free API has **noncommercial** conditions, rate limits, CC BY 4.0 attribution obligations, and no guarantee of availability or accuracy. Check usage rights before any promotional/commercial deployment. Public weather grids are not field observations, and probability at an hour is not an exact rain onset.

No global novelty claim, patent clearance, field validation, crop-loss savings, safe-storage certification, guaranteed resource access, or verified pairing with the teammate's still-unknown solution.

## Scope / exclusions

P0: public-data adapter + genuine-cache policy; provenance; source register; editable resource form; prerequisites; blocker and unknown states; deterministic inclusion-minimal packages; tests; conditional summary.

P1 **not implemented:** commitments ledger, two scenario toggles, printing, additional workflows. **Excluded:** logins, payments, bookings, routing, satellite ingestion, pest/disease detection, custom weather model, yield prediction, autonomous agronomy, full postharvest optimization.

## Release gate

**BLOCKED FOR A CERTIFIED P0 PUBLIC DEMO** until (1) actual live weather fetch and cache passes `scripts.verify_live`, (2) a normal-browser desktop/mobile smoke test passes, (3) pair differentiation is cleared with the teammate, and (4) a current agronomic expert review is obtained or the demo is explicitly framed as unvalidated conditional reasoning. See `RELEASE_AUDIT.md`.


## 2026-10-31 real-input-ready UX revision

Initial UI no longer contains numeric synthetic example values, an invented deadline or pre-confirmed optional resources. An empty real-input form requires the user to enter their own target, capacity, preparation time, comparable handling units, deadline, readiness and permitted/confirmed changes. User figures are self-reported and **not externally verified**. The source-backed public forecast is still unavailable from this restricted environment; the API is not certified. The engine unit tests still use synthetic fixtures, correctly labeled as tests, and are not shown as live farm data. No true farm inventory has been obtained.


## Forecast-to-decision bridge

A genuinely retrieved forecast hour may now be selected by the user as a candidate deadline; this explicitly feeds the deterministic time-prerequisite logic. A forecast hour is NOT auto-classified as rainfall onset, and no official agronomic rain threshold is inferred. Actual weather retrieval and browser click QA still require internet and a normal browser.
