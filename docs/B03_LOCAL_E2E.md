## B-03 local end-to-end usage

Run `cd backend && python -m uvicorn unlockplan.api:app --host 127.0.0.1 --port 8000` in one terminal. In another run `cd frontend && npm install && npm run build && B03_INTEGRATION=true npm run test:browser -- tests/browser/b03-real-api.spec.mjs`.

The preview proxy in `frontend/vite.config.ts` sends same-origin `/api` and `/openapi.json` requests to the local FastAPI process. Real integration tests use the genuine backend, *not* Playwright route intercepts; external weather may degrade honestly when offline.

For Vercel preview, the root `vercel.json` uses two Vercel Services (beta). Deploy from repository root with project rootDirectory unset; no production promotion.
