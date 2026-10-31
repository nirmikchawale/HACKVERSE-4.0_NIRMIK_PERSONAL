# UnlockPlan — Verified P0 Data Integration Bundle (2026-11-01)

**Scope:** Integrating the already-designed six-page UnlockPlan UI with the existing FastAPI/Vite application. This packet is **not a production deployment**, and **not a live-weather database**.

## What is actually available

- **Existing real weather adapter:** `backend/unlockplan/weather.py` requests Open-Meteo for 3 days of hourly `precipitation` and `precipitation_probability` at approximate Jalna coordinates (19.84 N, 75.89 E), with timezone `Asia/Kolkata`, runtime freshness tracking and source attribution. Call `GET /api/forecast` from the UI instead of duplicating the provider fetch in the browser.
- **Existing backend evaluation:** `POST /api/evaluate` (declared resources and deadline), `/api/compare`, `/api/replan`. These are authoritative over the standalone prototype's illustrative local calculator.
- **Static administrative names:** 28 states and 8 UTs in `data/india_states_uts.json`. Do not imply all districts/cities/villages are populated. Only Jalna planning is validated by the current backend.
- **Historically sourced soil context:** district-level categories in `data/jalna_historical_agronomy.json`, explicitly historic, *not* farm-soil lab results. The source's percentage denominator is inconsistent with its separate geographical-area figure; see the quality-audit note.
- **Catalog:** `data/source_catalog.json`, documenting included/blocked/not-required sources.
- **Endpoint schema crosswalk:** `data/p0_data_contract.json`, showing how the six-page UI maps to the current API.

## Getting authentic weather into the running application

1. Start the existing FastAPI app exactly as its repository instructions specify; verify `GET /api/health`.
2. Call `GET /api/forecast?refresh=true` from the same-origin Vite/FastAPI integration. Validate status, timestamp, units and source metadata. The existing backend already does this.
3. Render numeric forecast hours only when `status` is `retrieved_live` or `cached_recent`; show the attribution `Weather data by Open-Meteo.com` near those values.
4. On `stale_cache` or `unavailable`, show an explicit warning and hide/select-disable forecast-derived hour choices; retain manual-deadline, resource-only planning with clear limitation.
5. Use `POST /api/evaluate` for actual decisions. Clear stale results whenever inputs change; never reuse a computed decision for changed inputs. Use real `/api/compare` and `/api/replan` only with validated request payloads.
6. To save a **timestamped QA snapshot** for local inspection, run `python tools/capture_api_forecast.py --base-url http://127.0.0.1:8000 --out qa-forecast.json` **from an environment where the backend is reachable**. It fails closed unless response status is current, with actual hourly values and valid attribution. Do not ship the snapshot as permanent live data.

### Why this bundle does not contain a made-up 3-day forecast

The data preparation environment cannot directly reach Open-Meteo in this session. A repository integration PR documents previously retrieved source-native forecasts, but that is **not** proof of current hour-by-hour conditions. Therefore no live precipitation numbers have been invented, scraped from unrelated providers, or labelled current. The actual server retrieves a new validated forecast when connected.

## Nonessential datasets (deferred)

Soil maps, field soil moisture, satellite imagery, daily temperatures, wind and automated crop thresholds are **not required** for the frozen P0 resource feasibility calculation and are not part of its validated contract. SoilGrids warns its REST API is currently paused; do not wire up an unverified endpoint and claim live soil information. A later approved version can add soil panels as separate context without changing the existing feasibility engine.

## Validation

Run `python tests/test_bundle.py` after extracting this packet; no API keys or external connectivity required. Network integration still requires tests against real `/api/*` endpoints and Vercel preview. **This bundle creates no production database, no soil sensor, and no automated dataset refresh.**

## Safety + licensing

- Open-Meteo forecast data is CC BY 4.0; its free API is for non-commercial use with rate limits, and displaying an attribution link is required. Evaluate commercial licensing if the project becomes a paid service.
- ICAR-CRIDA document is contextual historic reference. Do not rehost the complete PDF unless rights are established; link the public source directly.
- Farmer-entered quantities are private, user-provided inputs, not external agricultural observations. Avoid sending individual farm input data to unrelated providers.
- Location picker can display any state/UT, but other locations **must say not supported yet** until verified provider coordinates and backend location contracts exist.

## Suggested adoption (without breaking workstream B)

Retain the current TypeScript `frontend/src/contracts.ts` parsers and `backend/unlockplan/weather.py` adapter. Map the C-03 user interface to the listed endpoints using the existing `main.ts` event-handling patterns. First run against the local API, then authenticated Vercel preview; pass TypeScript, Python, Chromium and source-provenance checks on the exact candidate SHA. Do not overwrite `frontend/index.html` or bypass branch protection with raw Stitch HTML.
