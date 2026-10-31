# B-04 Protected Preview Certification Gate

Phase B-04 tests the actual same-SHA Vite + FastAPI Vercel deployment behind Vercel Authentication. No merge or production promotion is authorized.

The GitHub job `B-04 protected preview exact-SHA browser and POST` intentionally FAILS until two protected **environment secrets** are present:
- `VERCEL_TOKEN` — a least-privilege Vercel token authorized to read deployment metadata.
- `VERCEL_AUTOMATION_BYPASS_SECRET` — a dedicated project-level automation bypass token from Vercel Settings → Deployment Protection. Store it only in the protected GitHub environment; never commit it.

**Required human approval gate:** GitHub → Settings → Environments → create `b04-preview-certification`. Restrict deployment branches to `feat/unlockplan-app-deploy`, require an owner reviewer, and deny self-approval where available. Add both secrets under that environment (not unprotected repository-level secrets). The reviewer must inspect the exact commit before approving any secret-bearing job. A public fork or unreviewed PR must never obtain the secrets.

Do not paste credentials into chat, a workflow YAML, a GitHub issue, or screenshot. The artifact upload uses nested screenshot paths and excludes Playwright traces, videos, HTML reports and API response bodies. The head-SHA gate resolves the feature-branch alias to its immutable, READY preview deployment and refuses wrong project, wrong branch, or production.

The CI job has a single-branch concurrency guard to cancel superseded runs. Browser tests inject the secret **only on the target preview origin**, run real requests (no mocked routes), and disable Playwright traces/videos to keep secrets out of artifacts. It checks all six API routes, actual POSTs, error states and desktop/mobile layout. A missing live forecast is an honest degraded state, never synthetic weather.

The connector reports no configured repository rulesets. Reading `main` branch protection returns GitHub 403 (integration lacks administration permission), so required-check enforcement must be performed by an authorized repository owner. Configure a `main` ruleset requiring pull requests, strict up-to-date checks and:
`TypeScript, audit, build and Chromium`;
`Backend tests + real six-route/browser smoke`;
`B-04 protected preview exact-SHA browser and POST`;
and Vercel deployment success. Confirm check names from the PR UI. Do not enable auto-merge or bypass failing checks.

B-04 cannot be considered fully certified until the secret-bearing remote job genuinely PASSes and branch protection is verified. This is independent of B-05 production release authorization.
