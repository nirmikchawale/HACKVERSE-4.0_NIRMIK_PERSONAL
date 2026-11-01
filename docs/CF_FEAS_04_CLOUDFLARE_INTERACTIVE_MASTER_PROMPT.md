# CF-FEAS-04 — Cloudflare-only Feasibility Page Restructure & Runtime Recovery

## Role and operating instructions
Act as principal full-stack engineer, Cloudflare Workers/Python specialist, accessible design-system lead, scientific evidence auditor, and independent release engineer. Work autonomously on minimal, reversible improvements. Preserve all existing six-page navigation, typography, glassmorphism, translation, user declarations and deterministic Python business rules. Do not use any deprecated hosting provider.

## Current problem and confirmed facts
- The public Cloudflare page renders static frontend assets but browser screenshots show both /api/feasibility-scenarios and /api/government-climate fail at the network layer.
- One hundred scenario configurations exist (20 seed assumptions × 5 variants), with real Python calculations; they are *not* 100 actual Jalna farms or government observations.
- The Python Worker Free plan CPU budget is 10ms per request. Do not diagnose this as the root cause without hosted error logs or specific HTTP evidence.
- Farm-specific status cannot be marked 'feasible' until farmer confirms actual inputs and a genuine POST /api/evaluate result is returned. Never tune the inputs to guarantee favorable classification.
- NASA POWER daily history is genuine U.S. government gridded data if validated from upstream; it is distinct from Open-Meteo model forecast. Unavailable records must not become sample rainfall.

## Priority and implementation contract
1. Diagnose public static assets, API route health, scenario route, NASA endpoint and deployed SHA. Log the real HTTP code/Cloudflare errors without secrets, with bounded timeouts.
2. Produce a deterministic Python-built *static teaching-case snapshot* of all 100 results during the Vite build. It must call unlockplan.scenarios.get_scenarios, which calls unlockplan.engine.evaluate for every scenario. No browser decision algorithm. Include UTC timestamp, exact source Git SHA, configured-example classification and 100 distinct identifiers. Fail the build on schema/coverage errors.
3. Page 04 should first attempt live FastAPI, validate complete catalog; if unreachable or invalid, load the build-time Python snapshot through Cloudflare's static asset path and explicitly identify it as a dated educational snapshot, not a live farm result.
4. Fully interactive examples view: four summary tiles clickable for state filters, 20-per-page navigation, search by ID/variant/label, case details, clickable metrics with precise constraint explanations, data-provenance note, genuine CSV export with all 100 entries and the correct source kind.
5. Fully interactive personal farm view: farmer-target, capacity, shortfall and time-slack cards must open the relevant existing input page on mouse/keyboard. When not evaluated, show actionable instructions rather than decorative dashes. Readiness checklist items open the correct inputs or a real API health check. Never invent a farm-specific number or feasible status.
6. Government evidence view: source link, historical context, explicit refresh, clickable authenticated daily records with units/provenance; if API fails, show a truthful empty state with troubleshooting/source actions, not manufactured readings. Do not use historical data as forecast or field safety certificate.
7. Preserve single origin, no new PII persistence, source text via textContent, accessible focus/keyboard, CSS tokens and responsive layouts at 390/768/1440 px. No inert controls or hidden irreversible actions.
8. Regression tests must verify the snapshot itself, browser fallback when API fails, live FastAPI when available, complete 100-row CSV, independent farmer-specific result, keyboard navigation, absence of fake NASA readings, and mobile overflow.
9. Cloudflare Worker packaging and snapshot assets must be tested in a real local pywrangler environment. Public release must be verified at a Cloudflare Worker URL by /_release.json.git_commit_sha, /api/health, /api/feasibility-scenarios and honest source status; GitHub merge alone is never deployment proof.

## Execution and certification
Inspect repository -> implement additive branch based on current Cloudflare UI -> test Python snapshot and frontend -> run B03 real API + HOME01 Chromium + local Cloudflare Worker + read-only hosted diagnostics -> fix one evidenced defect at a time -> inspect exact-head checks -> guarded PR merge only on authorized target branch -> deploy through Cloudflare Git integration -> public exact-SHA and API/browser tests. Keep production main and migration preview distinct; do not overwrite newer visual improvements.

## Mandatory release status labels
Document CREATED, COMMITTED, TESTED, MERGED TO PREVIEW, MERGED TO MAIN, CLOUDFLARE DEPLOYED and LIVE API CERTIFIED separately. Treat unknown or failed Cloudflare API as a release blocker, even if static scenario browsing is functional.

## Safety and evidence principle
Useful examples and real government history can coexist on one page, but must not be conflated. Favorable-case manipulation, pretending to have farmer records, bogus district weather, automatic confirmation of unknown resources and unsupported crop-safety guarantees are prohibited. Only adjust legitimate user-confirmed assumptions and recalculate transparently.
