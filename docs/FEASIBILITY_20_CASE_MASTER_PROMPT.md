# Agri Foresight — Page 04 Feasibility: execution master prompt

## Role and target
Operate as a senior full-stack engineer, agricultural-data provenance analyst,
UI/UX designer, security reviewer and release auditor for Agri Foresight in
\`nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL\`.

Complete **04 / Explained Assessment**, preserving the existing six-page product
and its FastAPI decision authority. The pilot is **already-picked cotton
preparedness in Jalna district, Maharashtra**. Do not mistake climate evidence
for resource feasibility or field validation.

## Source hierarchy
1. Official contemporaneous government API values when fetched, schema-checked,
   time-stamped and attributed. NASA POWER daily gridded observations are
   historical and lagged. Never treat them as station observations.
2. Official published Jalna district climate description (historic context:
   650–750 mm average annual rainfall), with source link and context caveat.
3. Open-Meteo model forecast only in its existing dedicated future-weather flow,
   preserving provider attribution and freshness gates.
4. A farmer's explicitly confirmed, unit-compatible work quantities, readiness,
   staff/equipment and candidate deadline.
5. **Configured planning examples** to make the default page educational and
   fully usable before a farmer submits a real case. These are *not* observations.
   Render a clear and brief disclosure. Never label these as government/farmer
   data or artificially make them pass.

IMD API documentation may be linked, but until the installation has authorized
credentials, an authenticated response and a verified Jalna district mapping,
do not invent or scrape IMD measurements.

## Mandatory functional implementation
- Keep existing \`POST /api/evaluate\`, \`POST /api/compare\`,
  \`POST /api/replan\`, source/forecast endpoints and request validation unchanged.
- Offer twenty diverse Jalna-scoped example configurations as **scenario inputs**,
  not farmer records. Evaluate every example with the same Python
  \`unlockplan.engine.evaluate\` used by the live endpoint.
- Expose a bounded read-only \`GET /api/feasibility-scenarios\` response with:
  provenance, evaluation UTC time, exact count 20, abstract units, declared
  assumptions, decision, constraint explanations, excluded options and
  inclusion-minimal conditional packages.
- The Page 04 workbench must show all twenty selectable cases, result filters,
  counts, selected-case target/capacity/gap/time, three constraint reasons,
  conditional packages, source disclosure, refresh and downloadable CSV.
- Extend \`GET /api/government-climate\` to request twenty authentic source-native
  historical Jalna daily observations; do not substitute missing days.
- Show climate source status, provider timestamps, rainfall and temperature with
  correct units, genuine observed date rows and official API documentation.
  The 20 records may be fewer when the source is missing or incomplete.
- Present Jalna government-published long-term rainfall as an expressly distinct
  descriptive historical climate baseline. It must not affect engine outcomes.
- Preserve actual farmer-specific \`Not evaluated\` until a real backend
  evaluation succeeds. Do not fill personal results with example values.
- Preserve mobile/desktop, dark/light themes, keyboard labels, contrast,
  screen-reader statuses and the existing glassmorphism design tokens.

## Security, privacy and reliability
- Use same-origin source endpoints and bounded request timeouts.
- Validate response types, enum statuses, result counts, numerics and source tags.
- Render third-party strings through \`textContent\`, not untrusted HTML.
- Never silently replace provider failures with fabricated weather or results.
- Do not collect or persist new personally identifiable farm information.
- Distinguish \`government historical grid\`, \`modeled forecast\`,
  \`farmer declaration\`, and \`configured example\` in all outputs and exports.

## Acceptance criteria
1. The API returns **exactly 20** unique scenario records calculated by Python.
2. Examples contain feasible, blocked and unknown outcomes, with unknown
   prerequisites not auto-confirmed and requested resources excluded.
3. Existing farmer-specific assessment remains separate; no synthetic numbers
   are passed off as a real farm or government source.
4. The authenticated NASA route returns **up to 20** source-native daily values
   (or a truthful unavailable/partial state) without fabricated zeros.
5. User can select, filter, inspect, refresh and CSV-export examples.
6. UI is usable at 360px/768px/1440px, both themes and keyboard-only.
7. Regression tests cover backend decisions, official historical date window,
   actual browser/API wiring, validation failures and the absence of substitutions.
8. No regressions in six-route navigation, farmer declaration, minimum changes,
   decision receipt, translation or source provenance.
9. PR evidence identifies source commit and CI. No release is claimed on
   source commit alone. Obtain separately authorized guarded merge and confirm
   public deployed SHA with independent browser checks.

## Release sequence
Inspect current head -> implement minimal additive changes -> validate syntax
and Python tests -> genuine API/browser integration -> production-sensitive
regression review -> inspect exact PR CI -> request explicit authorized merge
after successful checks -> verify published site on the deployed commit.

**Non-negotiable interpretation:** a rich and helpful interface must never
masquerade configured scenario estimates as observed district farm facts.
