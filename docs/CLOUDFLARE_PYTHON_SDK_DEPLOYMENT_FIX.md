# CFM-DEPLOY-02 — Python SDK deployment correction
November 1, 2026. Candidate branch `migration/cloudflare-typography-01`, PR #18.

## Observed deployment failure

User-provided screenshot of Cloudflare build `c977106a-5a4f-4b59-8874-08e5c0ed7a77` shows **Initializing, Cloning, Installing and Building: PASS** and **Deploying: FAIL**. The error is explicit: `You need to update to workers-py >= 1.9 or to pass disable_python_external_sdk`. The earlier setuptools auto-discovery failure is resolved.

## Targeted correction

- Require supported `workers-py>=1.17.9,<2` and `workers-runtime-sdk>=1.9.5,<2` in Cloudflare's dev dependencies. These versions are from official Cloudflare release records as of 2026-10-23.
- Run an actual `uv run pywrangler deploy --dry-run --outdir /tmp/agri-foresight-bundle` in GitHub Actions, not just a local development server; this is intended to detect Python packaging/SDK assembly problems before consuming a Cloudflare build.
- Avoid `disable_python_external_sdk`: this would bypass a required runtime feature instead of installing the supported SDK.
- Preserve the FastAPI logic, real NASA and Open-Meteo sources, six-page UI, and no-fake-data rules.

## Critical Cloudflare dashboard action (account owner only)

In Cloudflare Workers & Pages → `agri-foresight` → Settings → Builds:
- Production branch: `main` (do NOT switch before preview certification).
- Preview branch: `migration/cloudflare-typography-01`, enabled for preview builds.
- Root: repository `/`.
- Build command: `npm run build` (root package script already generates the revision receipt and builds the frontend).
- **Preview deploy command: `uv run pywrangler preview`**.
- **Production deploy command: `uv run pywrangler deploy`**.
- Do NOT use `npx wrangler preview` or `npx wrangler deploy` for this Python ASGI worker, and do not disable Python SDK. Raw Wrangler does not automatically bundle `pyproject.toml` Python dependencies.

The user's previous screenshot still showed `npx wrangler preview`, which likely explains the SDK injection failure. Updating the repository's pyproject alone cannot fix a Cloudflare dashboard command that still invokes raw Wrangler.

Only after the Cloudflare preview build reports PASS should the owner enable the worker's workers.dev URL and independently certify actual `/_release.json` Git SHA, GET/POST APIs, real NASA and Open-Meteo response status, browser pages, Free CPU/memory limits and runtime errors. PR #18 must remain draft until these public gates PASS.

Official guidance:
- https://developers.cloudflare.com/workers/languages/python/packages/
- https://developers.cloudflare.com/workers/languages/python/basics/
- https://github.com/cloudflare/workers-py/releases
- https://developers.cloudflare.com/workers/wrangler/commands/workers/
