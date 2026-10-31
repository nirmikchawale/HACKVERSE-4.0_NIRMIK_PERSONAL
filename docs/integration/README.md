# Cross-workstream A-05 + B-02 integration handoff
This exact branch combines A-05 certified backend and B-02 certified frontend without modifying either source branch.

## Runtime boundary
* In GitHub Actions, Python FastAPI runs on port 8000. Vite preview serves the built TypeScript UI on port 4173 and proxies /api to FastAPI, so browser tests exercise genuine backend routes.
* The Vercel project is currently configured for a Vite frontend rooted in `frontend/`. **That does not by itself deploy FastAPI.** A static Vercel preview with READY status is not proof that API routes are available. Do not release the public MVP until an authorized and tested Vercel polyglot deployment is configured and all six API paths work on the deployed exact SHA.
* Existing A-03 Open-Meteo live network evidence is retained. A forecast fetch might be unavailable on an individual CI run; the UI must remain honestly degraded. No synthetic test fixtures may be presented as live.
* No agricultural safety threshold is inferred from rainfall probabilities. The selected forecast hour is only a user-chosen candidate deadline.

## Browser flow
1. GET /api/health and GET /api/sources provide integration and provenance status.
2. GET /api/forecast presents model hourly values and uncertainty.
3. The first user plan submits POST /api/evaluate.
4. After a user edits a plan, POST /api/compare returns before/after engine results.
5. After a user selects a source-native forecast hour and changes a plan, POST /api/replan verifies the selected hour against the server's recent forecast. On 409 or 422, do not invent a fallback result; show the error and allow the user to switch to manual comparison.

## Non-goals
No production merge/deployment, no new agricultural operation, no duplicating Python logic in TypeScript, no change to the independent design branch.
