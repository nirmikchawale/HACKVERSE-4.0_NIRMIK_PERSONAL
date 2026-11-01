# Agri Foresight — Evidence-First Expansion Master Plan (EX-04)

**Baseline inspected:** \`main\` at \`410f8a522ca8cc8bf4df6dac03aed93bc42a2e89\`, 1 November 2026.
**Candidate branch:** \`expansion/evidence-first-fieldtools-04\`.
**App:** one six-screen Agri Foresight web application, Jalna, Maharashtra, rain preparedness of **already-picked cotton**. No nested app, second dashboard, or separate deployed product.
**Release status:** protected \`main\` and Vercel production require exact-commit checks; latest observed production deployment was behind the inspected \`main\` by a merge. This document does **not** authorize bypassing release gates.

## Mission / optimized master execution prompt

Act as a senior India agricultural-data researcher, official-source verification auditor, open-source licensing analyst, scientific decision-system architect, FastAPI/TypeScript developer, accessible UX reviewer and independent GitHub/Vercel release auditor.

**UNDERSTAND** the user's scenario, current public URL, official datasets, legal access paths and real decision-making constraints. **ROUTE** each candidate to an existing screen, existing government/weather source, exact API contract and source classification. **EXECUTE** only the smallest independently testable addition on a fresh branch. **VERIFY** authentic response schema, provenance, no synthetic runtime data, accessibility, mobile behavior, existing scientific invariants, security and exact-SHA release gates. If a gate cannot be verified, label it BLOCKED and do not publish to production.

Source precedence: existing tested main implementation and project instructions → government/official data documentation with provider terms → actual authenticated API response → licensed open-source repositories → secondary materials. A page listing a possible API is not evidence of working access. Never "scrape every GitHub": discover relevant repos via supported search, review license/maintenance/size/security before borrowing anything, and avoid mass copying.

**Nonnegotiables:** retain Tanisha's six-screen UI, gold/green glass style, multilingual layout, source ledger and deterministic resource/timing engine. Do not change Pydantic schemas, farmer option semantics, honest unavailable states or original government/NASA source rules without a separately reviewed scope. No invented threshold (safe rain, crop loss, soil pH, yield prediction), fabricated farmer inventory, mock production data, unverified weather advice, hidden source/model substitution, login, paid dependencies or third-party data sharing. No generic AI chatbot as a stand-in for engineering functionality.

## Verified existing implementation — do NOT rebuild

| In production source/main code | Scope and caveat |
| --- | --- |
| Six-page Agri Foresight navigation, mobile states, Marathi/Hindi/English UI and golden identity | Preserve; audit button behavior and labels separately |
| Real FastAPI health, forecast, sources, evaluate, compare, replan | Python owns all feasibility; no JavaScript duplicate scoring |
| Open-Meteo hourly model rainfall/probability for approximate Jalna | Non-government-hosted model forecast, source time + mm/% units; not actual station rainfall |
| NASA POWER \`/api/government-climate\` 14-day delayed historical gridded rain/temperature | U.S.-government model/reanalysis history; no future operational forecasts |
| NASA history 7/all display selector, location safety, per-day cards and original JSON download | Keep; EX-04 adds CSV evidence portability |
| Full evidence JSON, source ledger, resource-confirmed inclusion-minimal packages and before/after actions | Keep; no unsupported "best" or crop-safety label |
| IMD source catalogue link | Real official live warnings/RF do not exist without working authorized IMD access |

## External official sources and eligibility

| Provider | Official API/resource | Current use decision |
| --- | --- | --- |
| India Meteorological Department | https://api.imd.gov.in/public/api_reference.html | Strong candidate for district warnings/nowcast and AWS observations; official portal lists endpoints but project tests recorded 401 without approved credentials. **Access-gated; no warnings displayed** |
| NASA POWER Daily API | https://power.larc.nasa.gov/docs/services/api/temporal/daily/ | Already implemented as historical gridded evidence. Use validated records only; \`-999\` is **missing**, not zero |
| NASA POWER Hourly API | https://power.larc.nasa.gov/docs/services/api/temporal/hourly/ | Historic hourly meteorology can add observed-context *grid* visualization later; not live rain-onset or farm station data |
| ICAR-CRIDA Jalna contingency 2011 | https://www.icar-crida.res.in/CP/Maharastra/MAU,%20Parbhani/Maharashtra%2033-Jalna-31-12-2011.pdf | Historical district evidence, not a modern safety cutoff or personalized advisory |
| Soil Health Card / NIC | https://www.nic.gov.in/project/soil-health-card-portal/ | Official portal; public farmer-level live machine API not established. Link/checklist only; never manufacture soil chemistry |
| data.gov.in AGMARKNET mandi prices | https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi | Official dataset, but prices are outside an already-picked cotton rain-preparation *feasibility* decision. No market-price card in the next commits |
| Bhuvan/ISRO map and layers | https://bhuvan.nrsc.gov.in/ | Consider only after public endpoint, terms, geometry/coverage verified. Avoid false farm coordinate precision |
| Open-Meteo | https://open-meteo.com/en/docs | Existing non-government API; retain truthful provenance, free/non-commercial service restrictions and attribution |

## Relevant publicly available GitHub projects — reuse decision

| Repository | License/source evidence | Reuse decision |
| --- | --- | --- |
| https://github.com/chartjs/Chart.js | MIT; maintained charting library; https://github.com/chartjs/Chart.js/blob/master/LICENSE.md | **Consider** for later combined rainfall/temperature charts only if native existing bars cannot meet mobile/keyboard acceptance; not worth the extra dependency for EX-04 |
| https://github.com/mholt/PapaParse | MIT; CSV reader/writer https://github.com/mholt/PapaParse/blob/master/LICENSE | **Do not install now**: a 14-row verified dataset exports safely in <20 lines of native JS. Reevaluate for bulk CSV import with strict sanitization |
| https://github.com/Leaflet/Leaflet | BSD-2-Clause; mapping library and no bundled map tiles | **Deferred**: Jalna grid centroid is not a farm location; map tile terms and field precision must be checked separately |
| https://github.com/open-meteo/open-meteo | AGPL-3.0 server implementation; https://github.com/open-meteo/open-meteo/blob/main/docs/getting-started.md | **Use public API, not copy AGPL server source**. Maintain CC BY 4.0/terms attribution |
| Existing repository's \`backend/unlockplan/*\` and \`frontend/public/connected.js\` | Existing reviewed source + tests | **Preferred reuse**: no new heavy dependencies for the next two commits |

Do not confuse a popular GitHub UI repository with a scientifically validated agricultural engine. AI generated explanations are never an independent evidence source.

## Feature inventory and priority (one existing app)

Legend: **EXISTING** = present, needs QA if flagged; **NEXT** = next two commits; **LATER** = approved subject to source + scope; **BLOCKED** = external access/auth/validation needed; **EXCLUDE** = not responsible for this MVP.

| ID | Screen | Feature / subfeature | Data/API | Priority, disposition and acceptance |
| --- | --- | --- | --- | --- |
| F01 | Weather (2) | Model rainfall **next 6h/12h/24h window totals**, coverage/missing-hour count, no threshold | Validated real Open-Meteo hours | **NEXT**: visible only for current Jalna forecast; null stays unknown; show "model estimate" |
| F02 | Weather (2) | Source freshness and receipt (retrieved UTC, grid, units, age) | Existing forecast | EXISTING; preserve |
| F03 | Weather (2) | Interactive source-native forecast-hour selection | Existing \`/api/replan\` | EXISTING; verify that hour is future and server-attested |
| F04 | Weather (2) | Side-by-side forecast hours in compact mobile list | Existing forecast | LATER after responsive audit; no raw precision claims |
| F05 | Weather (2) | Clear "model vs historical" distinction / compare period cards | Existing NASA and Open-Meteo | LATER; never claim same observation or substitute one for another |
| F06 | Weather (2) | Official IMD district warnings (issue/expiry/legend) | IMD authorized API | **BLOCKED** until legitimate access, Jalna district ID, license and live response |
| F07 | Weather (2) | IMD gauge rain/AWS station observations (station name/distance/time) | IMD authorized API | BLOCKED, not a farm measurement |
| F08 | Weather (2) | Official current agromet bulletin links and dates | IMD/ICAR public page | LATER, only legitimate published links; no generated prescriptions |
| F09 | Weather (2) | NASA historical **CSV** export with explicit source metadata and missing value blanks | Existing validated \`/api/government-climate\` | **NEXT**, no network or new library needed; disabled when stale/unavailable/unsupported |
| F10 | Weather (2) | NASA 7/all history plus rainfall/temperature arithmetic summaries | Existing NASA | EXISTING; source-labeled |
| F11 | Weather (2) | 14-day observed-grid time-series chart (accessible data table) | NASA POWER | LATER, postpone Chart.js dependency until real need |
| F12 | Overview (1) | Source-status matrix per live/current/historical/unavailable | All existing endpoints | LATER; reflect independently validated response states, never "all live" |
| F13 | Overview (1) | Last-updated clock and provenance receipt | Existing API | EXISTING partly; LATER structured precision |
| F14 | Resources (3) | Physical unit & rate selection with explicit conversion validation | Farmer-declared | LATER after science/unit contract review; no required farmer budget |
| F15 | Resources (3) | Independent asset confirmation states / zero double-counting | Existing \`/api/evaluate\` | EXISTING; regression test |
| F16 | Resources (3) | Duration/resource "what changed" preview | Existing \`/api/compare\` | EXISTING; enrich labels later |
| F17 | Feasibility (4) | Plain-language blocker/unknown explanation + input lineage | Deterministic engine | LATER, no LLM needed to state actual constraints |
| F18 | Feasibility (4) | Accessibility keyboard/Marathi labels for every actionable card | Local UI | LATER after exhaustive audit |
| F19 | Alternatives (5) | Three backend-attested candidate-hour comparisons in one view | Current forecast and \`/api/replan\` | LATER only with no cost-based ranking or invented agronomy |
| F20 | Alternatives (5) | Confirmed-only packages and exclusion reasons | Existing engine | EXISTING; must preserve |
| F21 | Alternatives (5) | Farmer-editable local seed/labor/operation rates | Farmer declared | LATER only if exact real activity units are mapped; do not add compulsory budget |
| F22 | Summary (6) | Export full evidence JSON + exact source link and time | Existing export | EXISTING |
| F23 | Summary (6) | Print-friendly one-page, actionable but qualified report | Existing real calculation | LATER; avoid storing personal input |
| F24 | Summary (6) | CSV evidence export interoperable with spreadsheets | Existing NASA | NEXT (F09) |
| F25 | Summary (6) | Structured scientific source/known-unknown QC ledger | Existing sources | EXISTING; expand only with verifiable field provenance |
| F26 | All | Farmer-language accessibility and voice-support fallback | Existing local dictionary/browser speech | LATER; no cloud transmission of inputs |
| F27 | All | Offline "last genuinely fetched" indicator | In-memory verified responses only | LATER; cannot imply expired cache current |
| F28 | All | PWA install/bookmark | Current static assets | LATER; offline data must be marked expired |
| F29 | All | Generic AI assistant recommending crop treatments or safe rainfall cutoffs | No validated training labels or field evaluation | **EXCLUDE** from main MVP |
| F30 | Summary | Opt-in grounded AI *explanation* of cited returned decision only | Exact model inputs/results + citation guardrail | Research-only after privacy, eval cases, costs and explicit human-approved opt-in; never let LLM modify feasibility |

## Immediately planned commit boundaries — small, auditable, reversible

**Commit 1 — EX-04-A: master plan + scientifically constrained tests.** Inventory latest baseline and external sources; record OSS licensing/risks; add Playwright tests asserting rainfall window metrics are calculated only from returned authentic forecast records, and NASA CSV export contains no invented data. This is not a deployed feature until commit 2.

**Commit 2 — EX-04-B: lightweight source-native evidence actions.** Add time-window summaries F01 and NASA CSV F09 inside existing Page 2. Use existing validated in-memory records and native browser download; no new API, dependency, crop threshold, AI API or secondary screen. Preserve existing 7/all NASA filter, NASA JSON and all existing controls; missing/unsupported/401 responses must not render sample data.

**Optional follow-up commit EX-04-C only if a demonstrated defect:** a narrowly scoped responsive/accessibility fix, with a focused regression test. Never use an unbounded "features" commit.

## Phase-timebox queue (each scoped to <=20 minutes of active work)

| Microphase | Max min | Terminal evidence |
| --- | ---: | --- |
| EX-04-00 Inventory | 15 | Current SHA, current public URL, implemented features and source-data matrix |
| EX-04-01 Research | 20 | Primary official APIs, licenses, access/401 and OSS reuse decisions |
| EX-04-02 Test design | 15 | Unavailable, null, stale, date boundary, unsupported location and CSV injection checks |
| EX-04-03 Metric implementation | 20 | Only authentic current forecast data; no agronomic rain "risk" cutoff |
| EX-04-04 CSV implementation | 20 | Header metadata, null-as-empty, safe filename, quote escaping |
| EX-04-05 Static security/build | 15 | TypeScript, Vite build, audit, Python source/contract tests |
| EX-04-06 Browser QA | 20 | Original six pages + Page 2 desktop/mobile, null/refresh/error and screenshot evidence |
| EX-04-07 Vercel Preview | 20 | Exact-SHA READY, genuine API GET, real source output or clear unavailable |
| EX-04-08 Review/gate | 15 | Changes isolated to approved files, PR review and required-check statuses |
| EX-04-09 Release gate | 20 | Only after explicit merge authorization: protected merge, production SHA, public GET+POST+browser certificate |
| EX-05-01 Govt source onboarding | 20 | IMD account / official rate/terms/mapping; otherwise BLOCKED |
| EX-05-02 Explanation/source comparison | 20 | Selected F17/F19 fully deterministic, test first |

20 minutes is **per microphase engineering scope**, not a promise that an external build queue or provider outage finishes in that time. Continue independently verifiable tasks without bypassing release gates.

## Release acceptance / stop conditions

1. Branch base matches main and another teammate has not silently advanced the target; rebase/review if drift occurs.
2. No source-native values fabricated, no demo in runtime, no threshold, no mislabelled data freshness.
3. Tests for both successful and degraded source responses, null measurements, invalid date/hour, unsupported location, CSV escaping and missing data.
4. All applicable Python 95+ tests, existing Vite/TypeScript build, dependency audit and Chromium tests PASS on exact candidate; note if CI has no main trigger.
5. Vercel *preview* READY and actually serving the same SHA, correct real backend, desktop/mobile browser checks and no hidden UI interaction errors.
6. Source-data attribution and official external links intact, including Open-Meteo CC BY/terms, NASA govt history age and requested farmer quantities.
7. **No merge to protected \`main\`, alias reassignment, or production promotion unless the actual required checks PASS and the user separately authorizes release.** Mere readiness of Vercel build is not certification.
8. After authorized merge, validate main SHA matches deployed source under the public \`agri-foresight.vercel.app\` domain; probe actual production GET and POST, source-lag, responsive layout and rollback candidate.
9. Report status precisely: researched, implemented, tested, preview-deployed, production-published, certified or blocked. No background/autonomous future completion implied.

## Source checklist at review time

- NASA POWER Daily/Hourly official docs; IMD API catalogue; official ICAR and NIC Soil Health; AGMARKNET government catalogue.
- Chart.js/MIT; PapaParse/MIT; Leaflet/BSD2; Open-Meteo/AGPL3 source (do not copy).
- Project GitHub branch protection, exact SHA CI, owner-approved release gate and immutable Vercel deployment ID.
