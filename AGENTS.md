# AGENTS.md — UnlockPlan Coding-Agent Instructions

This repository is for HACKVERSE 2026: Predictive Climate-Smart Agriculture Planner. The selected product is **UnlockPlan**, a forecast-informed, resource-aware agricultural feasibility prototype. Do not reopen ideation or expand to unrelated crop, models, dashboard modules or marketplace features.

## Read first
1. `docs/MASTER_EXECUTION_PROMPT.md` — authoritative requirements and scientific integrity.
2. `docs/TECH_STACK_AND_RELEASE.md` — selected stack and release contract.
3. Current code/tests, latest main SHA, open PRs and CI before modifying any file.

## Technical constraints
- Languages: **Python** and **TypeScript**. Backend **FastAPI/Pydantic**; UI **TypeScript/Vite** plus accessible HTML/CSS. Reuse existing tested `unlockplan.engine`, weather adapter and provenance logic when imported. Do not rewrite the decision engine to adopt a new framework.
- Preserve API contracts: `GET /api/health`, `GET /api/forecast`, `GET /api/sources`, `POST /api/evaluate`.
- One initial scenario only: Jalna, Maharashtra, cotton rain-preparedness for already-picked material; no harvest or safe-storage certification.
- No custom predictive model. Forecast values are **external model forecasts**, not field measurements. ICAR-CRIDA guidance is historical evidence and does not establish operational safety thresholds.
- No invented rain-risk threshold, yield/crop-loss savings, guaranteed resource access, or claim of global novelty.
- Do not display test fixtures or mock farmer inventories as live application data. Synthetic abstract units may be used only in automated tests.
- Preserve explicit `feasible`, `blocked`, `unknown`, `completed`, stale-forecast and no-solution states. Requested resources are not confirmed.
- Inclusion-minimal means removing any included change makes the package nonfeasible; it is not the lowest-cost or best-farming option.
- Do not introduce a DB, login, AI chatbot, satellite layer, booking marketplace, new crop workflow or large dependencies.

## Implementation practice
1. Inspect source and running tests; identify the smallest relevant defect/feature.
2. Change only required files, keeping provenance and API compatibility.
3. Add tests for new behavior first; run focused regressions then all applicable tests.
4. For UI changes, check desktop/mobile, loading/error/empty states, accessibility and no unlabeled numerical assumptions.
5. For the weather API, validate real response URL, UTC retrieval time, `Asia/Kolkata` timezone, units and null/timestamp handling. If network fails, say so and keep a truthful resource-only degraded mode.
6. Serverless storage is ephemeral: don't make a writable on-disk cache the sole production source of truth.
7. Preserve license notices for any borrowed OSS snippets or libraries.

## Version control and deployment
- Use short-lived branches/PRs for implementation. Never force push main.
- Do not merge if required checks fail, if scientific boundaries are violated, or if a public behavior cannot be explained accurately.
- **Hosting is Cloudflare Workers ONLY**, effective 1 November 2026. All future deployments, release validation, domain changes, backend hosting and PR promotion must target the one Git-connected Cloudflare Worker `agri-foresight` and its real Python FastAPI + Vite assets.
- Do **not** initiate, configure, deploy, maintain, debug, or spend compute on the previous hosting provider. Ignore historical Vercel instructions elsewhere in this repository for forward-looking work; they are superseded, not a fallback requirement. Do not touch or delete previous hosting resources unless separately authorized.
- Cloudflare is free-plan by default; purchases, paid-plan changes, DNS/domain ownership transfers, and credentials require separate explicit approval.
- Use the verified Cloudflare `workers.dev` host while a personally owned custom domain is unconfirmed. Never invent a domain registration or claim a domain is connected.
- Preserve all completed, accepted frontend features on `main` when promoting a Cloudflare branch. Never merge a stale branch that would drop current features.
- Exact deployed SHA, API health, valid forecast or explicit degraded state, and desktop/mobile browser smoke are required for PUBLICLY_VERIFIED.
- Distinguish PLANNED, IMPLEMENTED, TESTED, MERGED, DEPLOYED, VERIFIED in every handoff.
- Never promise background operations or automatic actions that a deployed integration has not actually performed.

## Deadline
Internal code/build target: **1 November 2026, 2:00 PM IST**. Official user-supplied organizer deadline: **1 November 2026, 6:00 PM IST**. Preserve time for combined report and two voice-over videos.

## Active Cloudflare release gate (2026-11-01)
The Python/TypeScript app and source-backed integrations are already in the repository. Verify the exact `main` SHA at Cloudflare `/_release.json`, `/api/health`, authentic forecast/government-history routes, and Chromium desktop/mobile behavior. Promote new changes through reviewed PRs and all mandatory CI gates. Do not confuse a successful Cloudflare build with independently certified live behavior. The former Vercel route is out of scope.
