# Cloudflare Public Revision Certificate — Agri Foresight

The built Vite site contains `/_release.json`, generated from `git rev-parse HEAD` during the build. The file **does not** exist in source control, does not contain secrets, and reports the actual checkout revision being bundled.

## GitHub/Cloudflare build commands

Use these exact values at **Workers & Pages → Worker → Settings → Build** (root directory `/`):

```sh
node scripts/prepare-cloudflare-release.mjs && cd frontend && npm install && npm run build
```
```sh
uv run pywrangler deploy
```

The command runs `git rev-parse HEAD` before `npm run build`. In GitHub's local Worker smoke workflow this same receipt is generated before Vite build.

## Public certification only

Once Cloudflare produces an **actual** and independently verified `https://<account-suffix>.workers.dev` URL, compare:

```sh
curl --fail https://<actual-cloudflare-url>/_release.json
EXPECTED_SHA=<verified-Git-commit> REQUIRE_LIVE_CLIMATE=1 EDGE_URL=https://<actual-cloudflare-url> node backend/scripts/cloudflare-smoke.mjs
```

The receipt must return the certified SHA of PR #18, not a prior `main` revision or random placeholder. If the endpoint is missing, certificate is BLOCKED. If Open-Meteo or NASA are unverified at time of public test, source-specific release certificate is PARTIAL, not full PASS.

Do not share token values or change Vercel until the Cloudflare Worker is publicly certified. A Cloudflare Free account and browser session alone do not grant ChatGPT permission to deploy.
