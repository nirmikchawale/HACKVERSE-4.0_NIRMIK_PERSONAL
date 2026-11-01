# CF-FEAS-05 — Interactive Scenario Lab master prompt

**Target:** Agri Foresight, Page 04, existing Data-backed Explorer. **Hosting:** Git-connected Cloudflare Worker, no Vercel changes. **Source:** existing current-main FastAPI cases and build-verified Python snapshot.

## Optimized end-to-end implementation prompt

Act as principal product designer, accessible frontend engineer, source-integrity auditor and release QA. Inspect the existing Feasibility Explorer and 100-case engine contract. Reduce the screenshot's large passive text panels into a task-first compact Scenario Lab without changing the backend, data provenance or personal farmer declarations. Every displayed numeric value must come from the actual engine, not a placeholder or fabricated probability.

### Interactive layout

1. Header: "Scenario lab", compact Jalna label, dynamic live FastAPI or verified build snapshot receipt; make essential caveats accessible in a collapsed native "About the examples" disclosure. There are 20 seed configurations × 5 explicitly described variants, NOT 100 farmer observations, a calibrated data sample, a forecast or crop-safety recommendations.
2. Five responsive interactive counts: All, Feasible under configured assumptions, Blocked, Unknown, With possible changes. Counts are computed exclusively from a schema-verified 100-record catalog, and activating a count applies a visible pressed-state filter.
3. A single working toolbar: case ID/name search, true variant filtering, deterministic ID/shortfall/time-slack/capacity sorting, clear filters, recalculate authenticated Python cases, check live same-origin API, export all 100 verified example records as CSV, and navigate to the distinct personal Farm Resources workflow.
4. Preserve the paginated clickable list and genuine FastAPI case inspector. Keep the engine's constraint, excluded-option and conditional-package explanations.
5. Add pin-to-compare. A user can pin case A and select case B to see the two original engine results: ID, status, configured shortfall, time margin, reported readiness. Clearing must work. Do not let example actions mutate personal farm data.
6. Keep the genuine NASA historical-data viewer and its official link independent; do not conflate historical grids and prospective forecasts or a personal farm sensor. Preserve any source-labeled unavailable state.
7. Maintain glass/teal palette, light/dark themes, readable mobile spacing, visible focus states, keyboard buttons, screen-reader control labels, no overflow. Avoid truncating source caveats.

### Evidence and arithmetic

- Preserve the server-first /api/feasibility-scenarios request and strict catalog schema validation. Fall back only to a Python-build snapshot with authentic matching provenance. When neither verifies, fail closed.
- Five count values derive from the verified catalog. Filtering and sorting are read-only views; missing numeric time margins sort last, with stable ID tie-breaking.
- CSV exports all 100 independently evaluated configured cases with their original non-observational data-kind label, even if the current screen is filtered.
- Do not use guessed failure probabilities, arbitrary risk bars, invented weather, crop yields or observed farmer inventories. "Feasible under assumptions" must not imply field-safety verification.

### Acceptance and release

A. Complete source and contrast audit, preserve six existing pages and separate real farm assessment.
B. Browser-test five filter facets, variant and ID search, zero results, sort and reset, pin/compare/clear, CSV provenance, API-absent verified-snapshot fallbacks, 390px mobile, desktop, keyboard and accessibility.
C. Verify exact candidate SHA through B-01 Chromium/TypeScript/build/audit, B-03 authentic FastAPI/browser, and both Cloudflare local Worker checks. No bypassed required checks.
D. Guarded PR merge to current protected main; preserve parallel branches and prevent CSS regressions.
E. Independently verify public Cloudflare clean URL release manifest SHA, production JS/CSS, actual API contract and interactive desktop/mobile behavior before claiming public PASS. If a gate cannot run, label it PENDING/UNVERIFIED rather than inventing a release.
