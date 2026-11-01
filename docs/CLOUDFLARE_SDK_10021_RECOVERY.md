# CFM-SDK-10021 — Verified Python SDK packaging gate

## Observed failure (2026-11-01)

The Cloudflare preview failed during deployment after building successfully. The exact Python startup traceback says:

`ModuleNotFoundError: No module named 'workers'`

`You need to update to workers-py >= 1.9 or to pass disable_python_external_sdk`

This is **not** a Python package version alone: in the repository `workers-py >= 1.17.9` and `workers-runtime-sdk >= 1.9.5` are already pinned. What failed is that the required SDK could not be imported by the hosted Pyodide Worker.

Official Cloudflare docs establish that `pywrangler sync` vendors Python dependencies into `python_modules/` at the Wrangler config root. It should include the `workers` SDK:
- https://developers.cloudflare.com/workers/languages/python/packages/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/languages/python/basics/

## Focused correction

The root build script now runs `uv run pywrangler sync` **before the Cloudflare preview command**, followed by a validation of the actual generated `python_modules/workers/__init__.py`. This prevents the platform from consuming a known incomplete SDK bundle. GitHub's dry-run pipeline validates the same module before declaring local SDK packaging PASS.

The correction does not change the original six-page frontend, logo, the FastAPI engine, provider data, or public routing. It does not disable the external SDK. There are no fabricated production values and no credentials involved.

## Release constraints

- Build on `migration/cloudflare-typography-01`, not old `main`.
- Check the new Cloudflare Preview build result and terminal log; no retry of an unchanged build.
- A green local module preflight is **not** a hosted Cloudflare certificate. On hosted PASS, inspect `/_release.json`, seven API endpoints, genuine Open-Meteo and NASA outputs, Worker startup limits and UI regressions.
- PR #18 currently has conflicts against newer `main`; reconcile safely and recertify the new exact commit before any protected merge.
- Existing Vercel production remains fallback.

If `pywrangler sync` does not vendor the external SDK, fail the build and diagnose the actual `workers-py`/Pyodide path. Do not hide the error with a compatibility flag.
