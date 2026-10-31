# Agri Foresight — HACKVERSE 4.0

**Public product name:** Agri Foresight (internally the implementation retains `unlockplan` source/API identifiers to avoid breaking integrations).

**Problem statement:** Predictive Climate-Smart Agriculture Planner  
**MVP:** Forecast-informed, resource-aware feasibility planner for rain-preparedness of **already-picked cotton** in Jalna, Maharashtra.

> The public model forecast gives weather context; the deterministic Python engine assesses whether user-declared resources and a candidate deadline permit preparation. It never asserts agronomic safety or guaranteed protection.

## Current implementation status (31 October 2026)

- **Workstream B-01:** TypeScript/Vite frontend foundation, responsive design and certified test/deployment baseline.
- **Workstream B-02:** Typed interactive weather, deadline, farmer-resource and feasibility-result screens.
- **Workstream A-05:** Python FastAPI source and six-route contract imported unchanged from tested `feat/unlockplan-core` commit `22308c67938135c2ee6c3815d3d17d1b9904ba3a`.
- **Workstream B-03:** Frontend and FastAPI configured as two Vercel Services (beta), with same-origin `/api` routing and protected preview verification. Backend tests, typecheck, build, local genuine FastAPI browser interactions and real preview GET routes have passed; consult current draft PR #2 and its CI for latest exact SHA.
- **Production:** The certified unified six-screen FastAPI application was merged to `main` in PR #11 and deployed to Vercel. Public URL as of the branding release preparation: https://hackverse-40nirmikpersonal.vercel.app/. The requested `agriforesight.vercel.app` alias requires separate Vercel domain assignment and live verification.

## Project layout

```
frontend/        TypeScript, Vite, HTML/CSS and focused Playwright tests
backend/         Python FastAPI, deterministic planning engine, source/weather adapters and pytest
docs/contracts/  Source-of-truth A-05 TypeScript API handoff
vercel.json      Services beta routing: /api/* to backend, all other paths to frontend
.github/workflows/   Frontend and real FastAPI integration checks
```

## Run locally

```bash
python -m pip install -r backend/requirements.txt
cd backend
python -m pytest -q
python -m uvicorn unlockplan.api:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

For verified browser integration, run `npm run build` then `B03_INTEGRATION=true npm run test:browser -- tests/browser/b03-real-api.spec.mjs` with Uvicorn running.

## Scientific and evidence boundaries

External Open-Meteo output is a model forecast, not a farm sensor. User quantities, available options, deadlines, durations and readiness are user-declared. ICAR-CRIDA Jalna is **historical context (2011)**, not proof of current handling safety. Inclusion-minimal change packages are **not** price rankings, guarantees or automatically executed actions.

Missing or stale weather never becomes simulated rainfall; an unavailable API must not produce a fake feasibility result.

## Release gate

Feature branch → source review and SHA identity → Python manifest/tests → TypeScript/security audit/build → actual local API/browser integration → exact-head Vercel preview → independent public/protected-preview HTTP and responsive checks → **separate approval before merging or promoting production**.

The root configuration is for a coupled frontend/backend deployment. Independent backend-only feature branches may lack `vercel.json` and should not be mistaken for valid combined previews.

References: [Engineering prompt](docs/MASTER_EXECUTION_PROMPT.md), [stack and gates](docs/TECH_STACK_AND_RELEASE.md), [B-03 architecture](docs/B03_INTEGRATION.md), [B-03 local integration test guide](docs/B03_LOCAL_E2E.md).
