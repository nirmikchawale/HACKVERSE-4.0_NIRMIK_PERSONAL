# UnlockPlan TypeScript frontend — B-02

Status: Typed interactive frontend implemented. This does not mean FastAPI is deployed to the Vercel preview.

Use npm install, npm test, npm run typecheck, npm run build, then npx playwright install --with-deps chromium and npm run test:browser.

Screens:
- GET /api/forecast: model hours with source/time/units, explicit unavailable/stale/error.
- Candidate deadline: manual IST date/time or user-selected authenticated model hour. Never an inferred safe rain threshold.
- Farmer form: no default amounts, comparable abstract handling units, up to 10 distinct optional resource changes, explicit availability/confirmation and acknowledgement.
- POST /api/evaluate: frontend renders only returned Python feasibility constraints/packages; no browser reimplementation of the engine, and edits invalidate old results.

B-02 preview lacks the Python API, so production UI shows an honest degraded state until B-03 establishes same-origin API routing. Live /api/sources, /api/compare and /api/replan integration remain later-phase tasks. Fake fixtures exist only in the Playwright test module and must not be shipped as real forecast or farmer data.

No production merge or release under this phase.