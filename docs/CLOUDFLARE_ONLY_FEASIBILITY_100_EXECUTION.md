# Agri Foresight — Cloudflare-only Page 04 and 100-scenario execution master prompt
Version: 2026-11-01. Production repository: nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL. Target branch: protected main.

## Role and hierarchy
Act as senior Cloudflare Workers/FastAPI engineer, agricultural-data provenance researcher, deterministic engine auditor, accessibility engineer and DevSecOps release auditor. Preserve the original six-page product and all proven engine constraints.

## Hosting: non-negotiable
- Cloudflare Workers is the ONLY production, preview and release target. Do not perform any work on the former hosting provider.
- Worker name: agri-foresight. Canonical entrypoint: backend/worker.py via root wrangler.jsonc, running workers.asgi.entrypoint(unlockplan.edge.app).
- Same-origin FastAPI routes /api/* and Vite frontend assets ./frontend/dist. Build from repository root with npm run build, deploy with uv run pywrangler deploy, preview with uv run pywrangler preview.
- Stamp source Git SHA at build time in /_release.json and independently compare it with exact reviewed SHA on the public Cloudflare hostname.
- Never include secrets in source or logs. Cloudflare dashboard settings and domains require authorized account access; do not claim to have changed them if tooling does not permit it.

## Data provenance hierarchy
1. NASA POWER (US government): verified historical daily gridded temperature and precipitation near Jalna 19.84 N, 75.89 E. Return up to 20 actual daily source-native rows, never invented or zero-filled. Not observed farm rainfall, current weather, crop safety or a forecast.
2. Official Jalna District Administration description of district climate and 650–750 mm historical mean annual rainfall: https://jalna.gov.in/en/about-district/demography/. Context only, no quantitative farmer decision parameter.
3. Open-Meteo: non-government, source-labeled hourly weather model forecast with time and freshness gates. Never use it as guaranteed rainfall onset.
4. Farmer-entered handling units, deadline, location readiness and real confirmed options. ONLY these feed an actual farm-specific server decision.
5. Configured teaching scenarios: never describe these inputs as government measurements or actual farms, regardless of how credible the resulting calculations seem.

## One hundred engine-computed cases
- Generate 20 bounded picked-cotton preparation seed configurations in Jalna and exactly 5 distinct scenario variants per seed: baseline, compressed deadline, improved handling capacity, readiness review and additional-support confirmation.
- Stable unique IDs JAL-EX-001 through JAL-EX-100; preserve seed ID, variant, assumptions and configured-example provenance, without randomness or selected positive outcomes.
- Evaluate every example with the unchanged Python unlockplan.engine.evaluate implementation; expose GET /api/feasibility-scenarios via both the native FastAPI and the Cloudflare edge app.
- Include possible and blocked cases, unknown prerequisites, real shortfall/slack arithmetic, inclusion-minimal conditional change packages and reasons to exclude requested or unconfirmed help.
- Do not use this catalog to auto-fill farmer inputs or issue an agronomic/crop-safety claim.

## Required Page 04 UX
- Responsive searchable 100-case catalogue: ID/text/variant search, state filter, previous/next pagination of 20 per page, matched counts, four useful summary metrics, selectable detailed backend constraint explanations.
- CSV export: exactly 100 case rows plus header, with seed ID, variant and clear configured-example classification. Offer refresh and error/offline states.
- Preserve visual language: white/gold/green glassmorphism, responsive widths 360/390/768/1440, keyboard labels, focus styles, dark and light readability. Do not break six-page navigation, translations, resource entry or personal decision flow.
- Farmer-specific Not evaluated stays separate until POST /api/evaluate returns a validated real result.
- Historical evidence panel displays verified NASA dates, source, units and retrieval time; when source is absent, no replacement values appear.

## Validation and release gates
1. Review exact main baseline and Cloudflare entrypoint/routing; apply bounded additive changes.
2. Python manifest SHA256 check and complete pytest; compare native and Cloudflare FastAPI endpoint results for all 100 cases.
3. npm security audit, TypeScript/Vite build and complete Chromium regression suite.
4. Actual FastAPI integration/browser test without stubbing 100-case API, paging, filtering, CSV, and separate farmer result.
5. Python wheel packaging, compatible SDK, pywrangler dry run, real local Cloudflare Pyodide runtime and same-origin asset/API smoke including 100-case endpoint.
6. Verify mandatory checks on exact candidate PR SHA. Do not bypass protected main.
7. Merge only on valid authorization and verified gates, then independently test actual deployed Cloudflare Worker URL and match /_release.json SHA. Verify /api/health, /api/feasibility-scenarios, /api/forecast, /api/government-climate, /api/evaluate and /api/compare.
8. Public Cloudflare deploy needs hosted proof; if dashboard access or deployment fails, report truthful outstanding steps and avoid unsupported success claims.

## Failure handling and final status
Isolate one defect, reuse passing checks, avoid speculative CI retries and never lower provenance checks to make data look complete. Summarize CREATED, COMMITTED, CI-VALIDATED, MERGED, EDGE-DEPLOYED and PUBLIC-VERIFIED as separate statuses with exact SHA, PR URL, tested routes and any remaining Cloudflare-only blocker.
