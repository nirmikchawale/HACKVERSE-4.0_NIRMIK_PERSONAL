# FE-02/03 — Farmer-first AgriForesight redesign

**Scope:** The existing single Cloudflare Python Worker app; no new application, API key, or predictive agronomic claim.

## Why this application exists

Help a farmer managing **already-picked cotton** in the current **Jalna-only pilot**:
1. Inspect a source-labeled weather-model rainfall forecast.
2. Choose their *own* target finish time; never invent a safe rainfall threshold.
3. Declare how much picked cotton needs attention, their capacity, required hours, readiness and optionally confirmed extra capacity.
4. Request the **actual FastAPI** feasibility check; see a short clear explanation of shortfall, time pressure and readiness.
5. Compare only backend-returned permitted/confirmed changes and understand original work left unfinished.

The action plan is not a forecast safety guarantee, crop-loss prediction, automatic booking, soil test, or independent farmer-input verification.

## Farmer View

Home displays the product's purpose immediately beneath “AgriForesight” and names **already-picked cotton** as default/only currently supported crop.

Check Weather is three steps:
- One compact real Open-Meteo timeline grouped by day with hourly rainfall **and correctly labeled hourly probability**; incomplete values are never assumed to be zero. No false day-level probability is calculated.
- User-selected finish date/time (IST); one button saves the underlying existing deadline and opens Farm Details.
- Source evidence, historical Jalna soil information and technical weather controls stay fully available in Detailed View, or via an optional source disclosure for farmers.

Farm Details:
- Asks total weight and capacity in **kg or quintals**; 1 quintal = 100 kg.
- Frontend explicitly converts **farmer-declared physical weights** to one consistent *kilogram-equivalent numerical comparison scale* before passing them to the existing **abstract handling_unit** engine. This is strictly arithmetic; the engine has not acquired a validated physical productivity model or crop-handling safety standard. No kilogram–bag equivalence or automatic labour throughput rate is assumed.
- Required: target weight, capacity, time estimate, finish deadline, readiness, confirmation checkbox.
- Conditional: optional additional handling capacity and whether it is confirmed/requested; never count requested/unknown resources.
- Previously saved untagged detailed-view options are NOT silently converted to kg; farmer is directed to review such options in Detailed View first.
- Farmer inputs and normalized scale are retained across navigation and language changes, and stale untagged input values do not get relabeled as measured kg.

Check My Plan / My Action Plan:
- The explanation source remains **only** the validated FastAPI snapshot from \`/api/evaluate\`.
- For blocked plans, explain true backend shortfall, time-budget failure and readiness condition individually. Give a short next action; never fabricate an eligibility status or promise safety.
- Describe each backend-returned eligible minimal package using its confirmed change IDs, numerical amounts and original work remaining.
- Changing the dropdown language changes wording only, not input values or Python decisions.
- A clearly marked **Try a complete example** button (after user confirmation) loads configured example inputs, invokes the actual FastAPI engine, and can restore the user's previous local entries. No example values are mislabeled real farm observations.

## Detailed View

All six original pages, weather quality/provenance, historical NASA POWER data, ICAR Jalna soil context, conditional change editor, attested comparisons, diagnosis receipts, reports, local release tools and API contracts remain.

## Verification / release gates

1. Existing source manifests, Python unit/contract tests, security audit, Vite compilation.
2. Static-browser Farmer View checks: Home purpose, weather simplicity and honest unavailable state, unit normalization and language, finish-time save.
3. B-03 real server-backed example assessment and package.
4. Detailed View regressions, desktop/mobile responsive modes, source and weather quality controls.
5. Cloudflare Python Worker local verification -> exact-commit main merge under guarded checks -> independent public HTTPS API/browser/\`/_release.json\` exact-SHA certification.

**No genuine soil-class reading, crop-loss prediction, worker throughput or guaranteed safe-weather deadline is claimed.**
