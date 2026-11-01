# CFM-02 — Cloudflare runtime integration candidate

This narrow candidate imports the previously tested Python Worker runtime from the existing migration branch onto the newer, independently certified GitHub main branch. It does **not** merge stale frontend UI designs, revert EX-08–EX-12, alter the Python planner, or claim public success.

## Scope
- Same-origin ASGI FastAPI via Python Worker entrypoint `worker.py`.
- Pyodide-compatible async climate provider adapter `backend/unlockplan/edge.py` with data provenance, accurate failure states and unchanged Python decisions.
- Cloudflare config with static Vite assets in `frontend/dist`, API-first routing and SPA fallback.
- Exact-head workflow: Python package assembly, Cloudflare `pywrangler deploy --dry-run`, local Worker startup, real API and current main HTML/CSS smoke.
- Source-derived `/_release.json` receipt script used by the local CI gate.

## Account-specific deployment configuration
The connected Cloudflare Git integration was observed on 2026-11-01 with production branch `main`, root `/`, build command `cd frontend && npm install && npm run build`, and deploy command `uv run pywrangler deploy`. This candidate supplies the previously missing Worker and Python project files. Local CI builds a release receipt; to generate that same receipt in Cloudflare Builds, use root build command `npm run build` rather than the old frontend-only command, **after owner review of Cloudflare build logs and settings**.

Do not store API credentials in this repo. Cloudflare deployment or its external error cause cannot be certified solely by this GitHub PR. Exact public `workers.dev` revision, API GET and POST, real provider state, and desktop/mobile smoke must pass before public certification. Keep draft migration and feature PRs independent.
