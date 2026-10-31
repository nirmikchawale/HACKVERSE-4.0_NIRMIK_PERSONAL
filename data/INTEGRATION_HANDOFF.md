# UnlockPlan — P0 Data Integration Handoff (2026-11-01)

**Scope:** Safe staging of location, source and historical context data to connect the six-page UI to the existing Python/FastAPI + Vite application. **No production source files, tests, release config or deployed service were modified.**

## 1. Use the existing genuine data feed

The verified repo implementation at \`backend/unlockplan/weather.py\` already requests:
- Open-Meteo forecast at approximate Jalna coordinate **19.84 N, 75.89 E**.
- Hourly \`precipitation\` (mm) and \`precipitation_probability\` (%).
- Three forecast days, timezone \`Asia/Kolkata\`.
- Source attribution, request URL, validated units, retrieval timestamp, and a 2-hour cache freshness boundary.

**Integration method:** point the Weather UI at \`GET /api/forecast\`, *not* a duplicate client-side external API call. Display numerical observations only for \`retrieved_live\` or \`cached_recent\`, and keep source name, freshness and uncertainty visible. For \`stale_cache\` or \`unavailable\`, show unavailability, not fabricated zeros or guessed readings.

Real API data **could not be fetched from this session's isolated execution container** (no outbound DNS). Do not label this handoff as containing a current live forecast snapshot. A Vercel protected preview previously showed source-native retrieval, but that previous result is not a current forecast.

## 2. UI mapping: current backend is source of truth

| Page | Real source to use | Behavior |
| --- | --- | --- |
| 01 Overview | GET /api/health; GET /api/forecast; user draft | Four cards reflect genuine states; no invented readings |
| 02 Weather & deadline | GET /api/forecast | Select current model hour or set a manual candidate time; no automatic safe-rain threshold |
| 03 Farm readiness | User-reported values | Planned target, confirmed capacity, duration, readiness, unique resource IDs, permitted/confirmed options |
| 04 Feasibility | POST /api/evaluate | Interpret real feasible/blocked/unknown/completed result, constraints, shortfall, slack |
| 05 Minimum changes | Packages returned by /api/evaluate; POST /api/compare and /api/replan | Only confirmed available changes count; inclusion-minimal is not cheapest or fastest |
| 06 Plan summary | Backend evaluation + comparison + GET /api/sources | Display unhandled target, provenance, unknowns, and **conditional** outcome |

**Existing TypeScript binding functions:** \`frontend/src/contracts.ts\`, \`frontend/src/main.ts\` and \`frontend/src/plan.ts\`. Reuse their real request/validation functions rather than porting the standalone HTML's illustrative calculator into the application.

## 3. Included reference files

- \`data/reference/india_states_uts.json\` — 28 state names and 8 union territories for UI selection, **not** complete districts/cities/villages. Outside Jalna remains unsupported by current weather coordinates and engine.
- \`data/reference/jalna_historical_context.json\` — historical source-backed district soil groups and cotton post-harvest context. **Not** measured current farm soil.
- \`data/reference/p0_data_bindings.json\` — endpoint/field and safety mapping for UI integration.

**Soil-data quality finding:** ICAR-CRIDA's soil-class percentages sum to 100% of the listed categories, but the category areas total 636.77 thousand ha whereas the document separately reports 772.6 thousand ha geographical area. Therefore do not display the category percentages as an unquestioned share of the total district area. The reference JSON preserves this warning.

**SoilGrids caveat:** ISRIC announces that its REST API has been paused. There is no supported real-time soil data interface in current P0. Separate research/authorization is required before adding soil moisture, pH or farm-level recommendations.

## 4. Local integration and verification sequence

1. Pull the current **reviewed integration branch** and keep it independent of design changes.
2. Start FastAPI and verify \`GET /api/health\`.
3. Exercise \`GET /api/forecast?refresh=true\`; only accept genuine schema-valid response with source, UTC retrieval time, units and timezone. No test fixtures in user-facing runtime.
4. Use \`POST /api/evaluate\` with farmer-provided inputs and explicit units; recompute after edits.
5. Verify \`POST /api/compare\` and \`POST /api/replan\` including 409 on current-forecast unavailability.
6. Test every state on all six responsive screens and all three UI languages. Do not let translation alter API enum values or numeric units.
7. Run existing 95+ Python tests, TypeScript checks, build, API/browser tests, source provenance checks and preview checks on the **exact PR head**.
8. Promote only after applicable release gates and separate authorization. **No merge, deployment or production certification from this data phase.**

## 5. Additional approved sources

- Weather documentation: https://open-meteo.com/en/docs — CC BY 4.0 forecast data attribution; **free service for non-commercial uses**. Paid products or subscriptions require appropriate terms.
- Weather terms: https://open-meteo.com/en/terms
- Historical Jalna plan: https://www.icar-crida.res.in/CP-2012/statewiseplans/Maharastra%28Pdf%29/MAU%2C%20Parbhani/Maharashtra%2033-Jalna-31-12-2011.pdf — first page soil profile, printed page 21 cotton post-harvest context; historical only.
- State names: https://www.mea.gov.in/india-at-glance.htm
- Union territories: https://www.mha.gov.in/index.php/union-territories-divisions
- Future verified district codes: https://data.gov.in/resource/local-government-directory-lgd-districts
- SoilGrids paused API notice: https://docs.isric.org/globaldata/soilgrids/

**Not collected or claimed:** farmer-specific soil properties; genuine current climate observations from this session; national all-town directory; historical farm datasets; authenticated AI translation/speech/assistant service; field-valid agricultural thresholds or crop loss guarantees.

**Companion download:** A separate ZIP contains the same essential sources/contract descriptions, a local-only forecast-capture utility and four standalone data-quality checks.
