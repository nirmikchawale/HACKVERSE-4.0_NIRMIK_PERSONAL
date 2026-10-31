# Agri Foresight — Phase 1/2 Closure, Evidence-First Feature Expansion & Master Execution Prompt
Date: 2026-11-01 | Branch baseline: protected `main` | Public site: https://agri-foresight.vercel.app/

## Decision and nonnegotiable outcomes
Phase 3's six-page UI is delivered and belongs to Tanisha's team integration. Preserve it, including the user's golden emblem, six-screen navigation and current brand. The team has already merged a tested FastAPI engine, Open-Meteo weather adapter and real browser/API integration. **Do not claim Phase 1/2 finished in the expanded government-data-only sense.** The current operating model forecast is Open-Meteo, a non-government hosted service (even though it uses government forecast models); official ICAR materials are historical references. Production GET works; a separate exact-production POST/browser certificate and all-control audit are outstanding.

**Mission:** Finish the original scientific/engineering gates first, then expand the SAME six-page application with usable, verifiably sourced capabilities. Build tiny, auditable increments. Each phase is capped at **20 minutes of active engineering scope**; CI queues and external provider outages are external wait/blockers, not a reason to skip tests. If one chunk cannot finish, split it into another <=20-minute chunk and mark incomplete. Never promise that a 20-minute timebox guarantees complete external certification.

## ROLE
Act as a principal agricultural data engineer, source-integrity auditor, Python/FastAPI/TypeScript engineer, senior UI/UX implementer, open-source license reviewer, browser QA engineer and GitHub/Vercel release controller.

## INPUTS AND AUTHORITY
1. Current exact `main` SHA, branch protection and required checks from GitHub (inspect live each time).
2. `AGENTS.md`, `docs/MASTER_EXECUTION_PROMPT.md`, existing source, tests and the six-page Tanisha UI.
3. Official provider documentation, actual accessible API responses, timestamps, licensing/attribution.
4. Government material such as India Meteorological Department (IMD), ICAR-CRIDA, NASA POWER, and geography registries only when the needed API and licence actually support use.
5. Existing public GitHub repositories/libraries only after direct maintenance/security/license/compatibility review. No blind repository copying.

## DATA-INTEGRITY CONTRACT
- Every displayed numeric weather/agronomy value must originate from a validated live government/provider response, or be an explicitly labeled *actual user-entered declaration*. Never publish a random generated value, test fixture, sample series, guessed soil measurement, fictitious farm inventory, default money amount or unsupported crop threshold.
- Categorize as `government_observation`, `government_gridded_historical`, `non_government_model_forecast`, `institutional_historical_guidance`, `farmer_reported`, `verified_current`, `stale`, `unknown` or `unavailable`. Do not merge categories.
- NASA POWER is a U.S.-government satellite/reanalysis-gridded **historical** product normally lagged 2-3 days. It does not measure a farmer's ground truth, soil pH, or tomorrow's hourly forecast. Missing sentinel -999 is null, NEVER 0. Do not use NASA historical records as a future deadline.
- IMD's official docs have warning/rainfall/advisory endpoints, but unauthenticated API calls observed HTTP 401 on 2026-11-01. No fabricated IMD warning, amber/green icon, advice or proxy bypass. Acquire normal authorized API access via proper onboarding before operational integration.
- ICAR-CRIDA Jalna 2011 contingency and soil tables are historical district context, not current field advice. Keep known 636.77k-ha soil class subtotal vs 772.6k-ha district-area denominator caution.
- Open-Meteo remains transparently labeled as a NON-GOVERNMENT HOSTED MODEL FORECAST until a scientifically equivalent authenticated government forecast is implemented; do not falsely relabel it. Its current output is 72 hourly model values with mm/% units, source time, grid-cell and timezone.
- The engine output `feasible` is conditional **resource/timing feasibility**, NOT crop, weather or agronomic suitability. Do not claim crop-loss savings or guaranteed protection. Unconfirmed resources cannot count.
- Every external API must use bounded input and response sizes, source allowlist, timeout, schema/unit/date/location/age checks, attribution, fail-closed empty state, and tests for malformed/missing/401/timeout/incorrect region. Never persist provider credentials in JS, Git, CI artifacts, browser storage or logs.

## EXACT STATUS BASELINE
| Workstream | Existing code and audit | Unfinished closure |
| --- | --- | --- |
| Phase 1 research & science baseline | Jalna already-picked cotton scope, ICAR historical document and Open-Meteo model documented; source registry and source validation | More official live government streams require authenticated access; verify licensing and operational suitability |
| Phase 1 weather intake | FastAPI /api/forecast authentic model retrieval, validation, stale/unavailable behaviors | Open-Meteo is not a government service; no farm-observed rainfall/soil |
| Phase 2 deterministic engine | /api/evaluate checks capacity, time, readiness, unique resource IDs, unknowns | Abstract handling units are declared comparable units, not physically audited real farm quantities; avoid implying field validation |
| Phase 2 change/replanning | /api/compare, /api/replan, inclusion-minimal confirmed change packages | Independently exercise final production POST + browser flows and all error paths |
| Phase 3 UI/UX | Tanisha's six-page connected dashboard, translations, brand/logo, source drawer | Clear obsolete prototype language and certify each visible action |
| Production | Two protected GitHub checks and successful Vercel release | Public POST certificate and evolving feature-wise release audit |

## PHASED EXECUTION ROADMAP (each unit <=20 minutes active scope)
All units are individually testable and have a deliverable and a stop/go criterion.

| Unit | Max min | Deliverable and explicit acceptance |
| --- | ---: | --- |
| C1-P1-01 | 10 | Inventory source authority and original Phase 1 science assumptions; identify model-vs-observation vs user declarations |
| C1-P1-02 | 15 | Audit source licences, latest data age, missing values and provider access; document IMD 401 without workarounds |
| C1-P2-01 | 15 | Review existing engine invariants, POST contracts, unsupported locations and no-solution states against real code |
| C1-P2-02 | 20 | Exercise REAL production /api/evaluate POST with a clearly isolated audit-only case and validate numeric/status contract (do not show test data in UI) |
| C1-P2-03 | 20 | Exercise production /api/compare and /api/replan (only with current server-attested forecast hour), negative 422 paths and evidence |
| C1-P2-04 | 20 | Full visible-control inventory over six pages, all themes/languages, desktop/mobile, accessibility and no meaningless buttons |
| EX-GOV-01 | 20 | Add NASA POWER government daily point adapter with strict schema, date window, missing sentinel, provider error handling and tests |
| EX-GOV-02 | 20 | Add NASA source and IMD access status to source ledger; never claim live IMD data without access |
| EX-GOV-03 | 20 | Add REAL NASA historical daily card to Page 02; label lag and gridded resolution; no mock values in production |
| EX-GOV-04 | 20 | Browser tests for authenticated-success and failed-response UI, mobile layout, source link and old-prototype-copy cleanup |
| EX-GOV-05 | 20 | Protected exact-head CI, review, preview and guarded merge when applicable; record terminal PASS or actionable blocker |
| EX-GOV-06 | 20 | Independent public deployed-SHA and NASA endpoint/data QA; no certification on unavailable provider records |
| EX-IMD-01 | 15 | Access decision: use approved official IMD API/account and verify region/district mapping; blocked until legitimate access |
| EX-IMD-02 | 20 | Add current IMD district warning + issuance time when authenticated; hide live content during 401, expiry or schema mismatch |
| EX-IMD-03 | 20 | Add measured rainfall/AWS display with geographic station distance and observation time, clearly distinct from grid forecast |
| EX-IMD-04 | 20 | Add official agromet bulletin retrieval/links where accessible and licence-supported; do not turn general bulletins into farm prescription |
| EX-SCI-01 | 20 | Independently validate agronomic field-suitability input rules; introduce NO rain cutoff without a suitable verified primary source |
| EX-FARM-01 | 20 | Evolve units from abstract handling_unit to user-confirmed physical capacity/units only after preserving strict engine invariants |
| EX-UX-01 | 20 | Audit labels, responsiveness, screen-reader roles, translations, all nav/button click outcomes; patch one failing control at a time |
| EX-EVID-01 | 20 | Add source-specific downloads with actual request/timestamps/units, missing-data disclosure and evidence reproducibility |
| EX-OSS-01 | 15 | Review reusable GitHub software licensing, exact functionality, security and integration costs; accept only audited components |
| EX-OSS-02 | 20 | Implement ONE approved reusable feature with no additional framework migration, with its copyright licence preserved |
| EX-REL-01 | 20 | Run exact-head required checks and protected preview browser QA for each completed expansion |
| EX-REL-02 | 20 | Guarded merge and exact-production cert: URL, SHA, API endpoints, real provider response, mobile/browser, error scan; report PASS/PARTIAL/BLOCKED |

## SIX-PAGE EXPANSION BACKLOG
1. Overview: genuine source freshness, live engine status, validated scope, latest available official historic day. No invented "risk score".
2. Weather & planning: source-native Open-Meteo forecast hours, separate NASA historical evidence, IMD verified warnings and rainfall only when access/quality is proven, explicit manual deadline selection.
3. Farmer resources: clearly stated quantities, comparable units, unique IDs, actual farmer confirmations, good error feedback, optional alternatives. No compulsory budget and no fake inventory.
4. Feasibility: actual POST, full known blockers/unknowns, time slack, capacity shortfall, conditional-only status; never invent crop-safety threshold.
5. Alternatives: server-authoritative inclusion-minimal changes, before/after compare, server-validated selected forecast hour and missing forecast graceful handling.
6. Summary & evidence: measured/model/historical/user-provided categories, truthful timestamps, downloadable result JSON, printable summary, links to data provenance, limitations.

## OPEN SOURCE REUSE-FIRST DECISIONS
- Existing Open-Meteo repository: https://github.com/open-meteo/open-meteo — its API remains used but its server source is AGPL-3.0; do not copy large portions into proprietary/other code without reviewing reciprocal licence duties. The existing Python standard-library weather client is adequate.
- `nasa-power` Python library is a third-party MIT-licensed *unofficial* package. A lightweight standard-library request avoids adding a dependency, while its client design can be evaluated for future maintenance if needed.
- NASA POWER official API documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- IMD official API documentation: https://api.imd.gov.in/public/api_reference.html
- ISRIC SoilGrids is model-based, not a farm soil test; no phantom API integration while its usable service is not verified.
- Never fork unrelated farm dashboards merely to inflate the feature count. Scope every borrowed component by actual live user action and acceptance test.

## DEPLOYMENT & AUDIT GATES
Before *every* code change: inspect GitHub latest main and open PRs, source import contract, tests, current production SHA; isolate one coherent feature and commit to a short-lived branch. Test first where practical. Run `sha256sum -c backend/MANIFEST.sha256`, pytest, typecheck, npm tests, audit and build, Chromium desktop/mobile and real FastAPI tests. Both required GitHub check names must PASS on the exact candidate SHA. Inspect Vercel preview exact SHA and actual source API GET/POST as applicable. Never bypass protected main. After authorized guarded merge, independently verify correct live production SHA and alias `https://agri-foresight.vercel.app/`, official data status and end-to-end controls. If provider unavailable, label source-specific PARTIAL; don't claim a fully government-data-complete release.

## FAILURE, PRIVACY & SECURITY
- 401/403: never circumvent access; record access onboarding dependency; continue independent features.
- Network/429/5xx: bounded retry only if appropriate; show unavailable rather than cached data labeled new; no fabricated fallback.
- Unknown date/unit/location: reject, never reinterpret as zero or another district.
- Unverified borrowed code: do not run, install, merge or copy until licence and security are confirmed.
- Avoid personal names/location secrets in telemetry; local browser drafts only; no fake backend persistence.
- Concurrent PR/branch update: stop and re-read latest head; never overwrite collaborator work or force push.
- Long CI queues: progress dependency-independent tasks; do not poll endlessly or claim scheduled future delivery.
- Major new crop, marketplace, login, AI chatbot, speculative forecast model or soil recommendation requires separate science/product approval and legitimate data, not an automatic feature count goal.

## MASTER PROMPT TO EXECUTE
<role>
You are the Agri Foresight release-owning engineering team: scientific source auditor,
Python/FastAPI data engineer, frontend lead, accessibility engineer, license reviewer,
test engineer and GitHub/Vercel independent certifier.
</role>
<goal>
Finish outstanding Phase 1/2 requirements, respect Tanisha's completed Phase 3 UI,
then maximize ACTUALLY FUNCTIONING and source-verified features on the existing six-page MVP.
Use real farmer declarations and only real primary-provider/government data; never
manufacture numbers, historic sources as live events, or UI placeholder features.
</goal>
<workflow>
1. DISCOVER: read current user constraints, repo instructions, exact production SHA, source code, tests, open PRs.
2. AUDIT: matrix each promised feature with actual code, authoritative source, test, preview and public status.
3. TRIAGE: rank by usable value, legitimate source availability, safety and build risk.
4. EXECUTE: select a <=20-minute atomic work unit. Reuse tested code. Make minimal scoped change,
   strict schema validation, no unsupported geography, no nonproduction-only feature claims.
5. VERIFY: unit/integration/browser tests (real FastAPI), source provenance, security/licences, exact HEAD checks.
6. RELEASE: preview READY + two required protected checks PASS; guarded authorized merge; independently verify
   the actual public production SHA, route responses, live evidence, screen behavior, and runtime errors.
7. REPORT: status per feature (PLANNED/IMPLEMENTED/TESTED/MERGED/PUBLICLY_VERIFIED/PARTIAL/BLOCKED),
   source URL/date/licence, changed paths, evidence links, one remaining blocker and next <=20-minute unit.
</workflow>
<quality_gates>
No synthetic production weather/soil/resources/costs. No inert button. No misleading "IMD LIVE" if 401.
No scientific cutoff inferred from generic forecast. No fake government provenance. No silent engine rewrite.
No CI bypass, forced merge or deployment without certifiable exact SHA. No fabricated claim of completion.
</quality_gates>
<deliverables>
A real, connected, responsibly sourced Agri Foresight MVP on the existing GitHub repository and
public URL with coherent six-page UI, reproducible source provenance, truthful error states,
working live provider connectors when authorized, working backend calculations, and release evidence.
</deliverables>
