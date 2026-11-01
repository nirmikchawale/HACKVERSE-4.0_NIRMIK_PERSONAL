# Agri Foresight — HACKVERSE 4.0

**Public product name:** Agri Foresight (internally the implementation retains `unlockplan` source/API identifiers to avoid breaking integrations).

**Problem statement:** Predictive Climate-Smart Agriculture Planner  
**MVP:** Forecast-informed, resource-aware feasibility planner for rain-preparedness of **already-picked cotton** in Jalna, Maharashtra.

> The public model forecast gives weather context; the deterministic Python engine assesses whether user-declared resources and a candidate deadline permit preparation. It never asserts agronomic safety or guaranteed protection.

## Cloudflare-only deployment policy (November 2026)

**Cloudflare Workers is the sole deployment target.** No new implementation,
release promotion, or hosting work targets the retired provider.
The canonical release branch is protected \`main\`; the Cloudflare Python Worker
entrypoint is \`backend/worker.py\`, serving the FastAPI ASGI app
\`backend.unlockplan.edge\` with Vite static assets under \`frontend/dist\`.

### What is included

- Six connected dashboard pages, actual source-labeled Open-Meteo forecasts,
  and NASA POWER US-government historical gridded climate evidence.
- Page 04: **100 deterministic, reproducible example assessments** generated
  from 20 bounded example seeds × 5 sensitivity scenarios, each evaluated by
  the same Python \`unlockplan.engine.evaluate\` as genuine farmer submissions.
- Distinguishable data kinds: government historical grid, external weather-model
  forecast, farmer-entered resources, and clearly labeled configured examples.
  No sample records masquerade as government measurements or real farms.
- Complete source notes, filter/search/pagination, evidence CSV export and
  conditional minimal-change explanations. Farmer-specific assessment remains
  unevaluated until the farmer confirms inputs and the actual API responds.

### Cloudflare build configuration

Cloudflare Workers Builds: repository root \`/\`, production branch \`main\`.
- Build: \`node scripts/prepare-cloudflare-release.mjs && cd frontend && npm ci && npm run build\`
- Production deploy: \`uv run pywrangler deploy\`
- Preview deploy: \`uv run pywrangler preview\`
- Production and preview builds must use the repo root \`wrangler.jsonc\`
  and must never use a bare \`npx wrangler deploy\` for this Python Worker.
- Validate \`/api/health\`, \`/api/feasibility-scenarios\`,
  \`/api/government-climate\`, and \`/_release.json\` on the actual
  Cloudflare URL before certifying production.

**Verification:** GitHub passing checks verify code/integration only. Public
Cloudflare deployment and exact SHA need a separate successful hosted smoke.
Follow \`docs/CLOUDFLARE_ONLY_FEASIBILITY_100_EXECUTION.md\`.

## Project layout

\`\`\`
frontend/        Six-page Vite application and Chromium regression tests
backend/         Unchanged engine, FastAPI, Cloudflare async adapter, tests
backend/worker.py   Pywrangler Python Worker / ASGI entrypoint
wrangler.jsonc   Authoritative Cloudflare service and asset routing
pyproject.toml   Python Worker SDK and dependency declarations
.github/workflows/  FastAPI/frontend plus Cloudflare-local certification
\`\`\`

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

Exact-head source/manifest -> Python tests -> Vite/audit/Chromium -> real
FastAPI integration -> Cloudflare Python Worker local Pyodide smoke ->
Cloudflare-hosted preview matching the exact Git SHA -> guarded merge into
protected \`main\` -> public Cloudflare HTTP/browser/API/SHA certificate.

Do not promote on source commit or CI alone. No alternative hosting target
is part of the project release workflow.
