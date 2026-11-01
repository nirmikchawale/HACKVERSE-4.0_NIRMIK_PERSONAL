# CFM-03 — AgriForesight exact-main public release recovery

## Role
Act as principal Cloudflare Python Worker release engineer, Vercel CI/CD auditor, FastAPI scientific-integrity reviewer, accessible UI regression engineer, release integrator and independent public-deployment auditor.

## Objective
Synchronize **one existing six-page AgriForesight MVP** from the verified current public GitHub `main` head onto its intended public production URL with all **19 already merged roadmap features**, without rebuilding or replacing the frontend, changing source/weather science, or silently dropping data. The user has authorized safe merge and deployment, but scientific test gates and credential confidentiality remain binding.

## Verified preflight
- GitHub repo: `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL`, public, `main` exact head before this recovery: `e9c94f82b06594fd7f7f0d38f0d8cae3a2f9629e`.
- PR #34 / EX-18 passed B-01 full Chromium 74 tests, B-03 105 Python + 4 real FastAPI browser cases, and was merged to that head.
- Before this recovery the canonical Vercel domain `https://agri-foresight.vercel.app` was assigned to production commit `30d58c14b92ab39d07120671ebe0fb8d337e3f81`. Vercel's API rejected an explicit fresh deployment on its Hobby team with 402 `api-deployments-free-per-day` (over 100). Do not bypass quotas, disable gate checks or change billing.
- Existing Cloudflare preview `https://migration-cloudflare-typography-01-agri-foresight.nirmikchawale1.workers.dev/` operates from a **different** migration branch, not the latest main. It is NOT a production certificate.
- Cloudflare production Workers Builds failed on main because root Python Worker configuration was not in `main`. PR #28 held the tested runtime but was draft and based on an older main. Its candidate passed B-01/B-03 and Cloudflare local Worker gate before selective port.
- Do not mistake merged GitHub code for a live site or claim Cloudflare success without the exact post-merge production Worker SHA, API POST and a real browser smoke.

## Required implementation
1. Confirm the latest main SHA and validate that no other human has advanced main. Never force-push main.
2. Selectively transplant only the 12 runtime/configuration/test files from PR #28 onto main; retain the entire newer frontend from EX-06 through EX-18.
3. Keep Python `worker.py` as the ASGI entrypoint and `backend/unlockplan/edge.py` using the original deterministic resource engine; no new thresholds, model forecasts or fake climate payloads.
4. Build Vite static files and Python Worker with `wrangler.jsonc` on the same origin. `/api/*` and `/openapi.json` must hit the Python Worker; all other paths are SPA assets.
5. Generate `frontend/public/_release.json` at build from **actual exact Git revision**; omit manifest rather than invent SHA if unavailable. `frontend/package.json` prebuild ensures old Cloudflare account build command (`cd frontend && npm install && npm run build`) creates it. Do not embed secrets, weather data or farmer inputs.
6. Existing source categories remain Open-Meteo external model forecast, NASA POWER delayed government historical grid, farmer-reported resources, and unconnected IMD official warnings. Fail closed on unavailable/stale/null values.
7. No additional localStorage except explicitly described source-only receipt timestamp metadata; do not leak farmer declarations to export, platform metadata or third parties.

## Mandatory pre-merge gates
- `TypeScript, audit, build and Chromium`: PASS; all frontend/desktop/mobile and EX-06–EX-18 tests.
- `Backend tests + real six-route/browser smoke`: PASS; actual FastAPI GET/POST with original schema, no mock production provider data.
- `Cloudflare Python Worker local API + asset smoke`: PASS; Python 3.13 packaging, sdk checks, pywrangler dry-run, real local ASGI health, source registry, `/_release.json` same candidate SHA, genuine evaluate/compare/invalid 422, forecast/NASA unavailable contract.
- Check no CSS, route, page, translation, print, comparison or source-status regressions.
- Review exact candidate SHA, current main head and PR diff. Merge only if all mandatory local gates genuinely PASS. No obsolete branch force-merges.

## Post-merge public certification
1. Read merged main SHA, PR state and changed files directly from GitHub.
2. Read Cloudflare Git integration result for the same `main` commit. A Cloudflare FAIL or stale deployment **blocks** success claims even when all GitHub gates pass.
3. Verify public `https://agri-foresight.nirmikchawale1.workers.dev/_release.json` reports the exact merge SHA and that `GET /api/health`, `GET /api/sources`, `GET /api/forecast`, `GET /api/government-climate` and POST `/api/evaluate`, `/api/compare`, invalid `/api/evaluate` 422 are genuine. Never send real farmer data for certification.
4. Compare deployed `/connected.js` (or equivalent bundled build asset) for marker presence of F01, F05, F09, F11, F12, F13, F17, F23, F27, and EX-14 manual/model comparisons.
5. Test six pages on desktop/mobile, English/Marathi/Hindi, supported/unsupported location, stale provider case, print and offline indicators.
6. Report status individually as IMPLEMENTED, TESTED, MERGED, CLOUDFLARE_BUILD, API_LIVE, EXACT_SHA, FULL_PUBLIC_BROWSER. Do not compress them into an unqualified `DEPLOYED`.
7. If Cloudflare external account build settings remain wrong, record the exact log-derived blocker and one narrowly scoped setting change the project owner must make; do not claim success or switch arbitrary unrelated hosts.

## Release decision
**PUBLICLY_VERIFIED** only if same SHA in public manifest, Cloudflare successful production build and real API/UI smoke. Otherwise **GITHUB_INTEGRATED / PUBLIC_BLOCKED** with specific next action.

## CI anti-loop
No bulk retry storms. Isolate one real failed gate, apply minimum tested correction, run the focused regression and required workflows once per new candidate, avoid rebuilding passing independent paths without reason.
