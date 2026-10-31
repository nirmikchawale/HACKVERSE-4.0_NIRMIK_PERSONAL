# UnlockPlan frontend — B-03 integrated TypeScript application

The frontend uses native HTML/CSS, strict TypeScript and Vite. It sends requests to same-origin FastAPI routes; **it never simulates live forecasts or computes feasibility in the browser**.

## API wiring

- `GET /api/health`: connection and non-field-validation disclaimer.
- `GET /api/sources`: original source register, links and limitations.
- `GET /api/forecast`: authentic source records, timezone, hourly units and unavailable/stale states.
- `POST /api/evaluate`: first user-declared feasibility assessment.
- `POST /api/compare`: manual before/after comparison on later evaluations.
- `POST /api/replan`: server-attested forecast-hour selection and revised assessment. Rejects unavailable/stale/invalid selected-hour evidence.

A selected model hour is an **optional candidate deadline**, not predicted exact rain onset or a safe agricultural threshold. Changes to farmer inputs invalidate old displayed results. The Python backend remains the authority.

## Local commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run test:browser
```

For **real backend integration**, start Uvicorn separately from `backend/` on `127.0.0.1:8000`, then run:

```bash
B03_INTEGRATION=true npm run test:browser -- tests/browser/b03-real-api.spec.mjs
```

`vite.config.ts` proxies `/api/*` and `/openapi.json` locally. On Vercel, the root `vercel.json` routes services; the Vercel project root must be the **repository root**, with framework and root-level build overrides unset. Vercel Services is beta.

**No sample farmer quantities are prefilled.** Mock weather/evaluation fixtures exist only inside isolated Playwright tests. Any unavailable forecast or API is labeled rather than replaced with synthetic user-facing values.

B-03 preview and CI certification are distinct from B-04 release-engineering setup and B-05 **production** authorization. Do not merge unverified code.
