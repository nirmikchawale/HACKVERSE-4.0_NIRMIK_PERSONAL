# CFM Cloudflare Public Certification — independent HTTP gate

Cloudflare's GitHub integration published a successful Preview deployment on 2026-11-01 at commit `c26f744fff46e79f15841cf32a650de3c4453bf8`, deployment ID `3800f7cb-809c-4ba7-92cb-8860b8e96a32`.

Confirmed Preview URL published by `cloudflare-workers-and-pages[bot]` on PR #18:

https://migration-cloudflare-typography-01-agri-foresight.nirmikchawale1.workers.dev

Immutable deployment URL:
https://3800f7cb-agri-foresight.nirmikchawale1.workers.dev

**Build & deployment success is not independent public/API certification.** The assistant's web client could not access the workers.dev host, so no public API success has been inferred. We added `.github/workflows/cfm-cloudflare-public.yml` to verify the preview from a GitHub-hosted runner with independent network access.

The job:

1. Waits for the exact expected SHA in `/_release.json` (36 attempts, up to ~6 min, bounded).
2. Requires a real HTTP 200 `/api/health` with `ok:true`.
3. Calls `backend/scripts/cloudflare-smoke.mjs` with `REQUIRE_LIVE_CLIMATE=1`, verifying the real /api API, genuine Open-Meteo model forecast and NASA POWER historical records (or appropriately failing certification).
4. Uses no secrets or paid services.

If it fails: diagnose the actual HTTP status, real Cloudflare Observatory logs and Free-plan CPU usage; do not force merge. Keep PR #18 in draft and Vercel fallback active. Reconcile latest protected main, rerun mandatory checks and recertify exact final SHA before main merge and production deployment.
