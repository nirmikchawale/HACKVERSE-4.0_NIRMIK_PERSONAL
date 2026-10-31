# B-03 integration candidate

Frontend and Python API are separate Vercel Services (beta), deployed and rolled back together.

- `frontend/`: Vite + TypeScript static frontend, preserves B-01/B-02 CSS and accessible screen structure.
- `backend/`: **exact imported A-05 source tree** from `feat/unlockplan-core` commit `22308c67938135c2ee6c3815d3d17d1b9904ba3a`; only `backend/main.py` is added as an ASGI entrypoint. Do not modify engine/weather algorithms.
- Root `vercel.json` routes same-origin `/api/*` to the FastAPI service and other paths to Vite. Public `/openapi.json` supports contract verification.
- Vercel Project Settings must use **root directory repository root**, **framework automatic/unset** and **no root-level Vite build/install overrides**, so each service owns its own framework. Deploy only a preview; no main branch merge.
- Distinguish `retrieved_live`, `cached_recent`, `stale_cache`, `unavailable` and client-side network error. No synthetic farmer/weather values in runtime.
- Manual evaluation uses deterministic API. Forecast-selected replan must call server `POST /api/replan` so only the server attests the selected hour. A stale/unavailable replan never qualifies as forecast-bound.
- Correctness gates: SHA identity of the imported backend files, all backend tests + source manifest, frontend tests, real local end-to-end browser/API checks, genuine Vercel deployment and exact-SHA route checks.

This candidate is not production-ready unless preview builds and all applicable checks pass; Vercel Services is a beta capability.
