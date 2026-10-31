# Cloudflare + EX-04/EX-05 unified integration candidate

**No public deploy or release is claimed.** This integration branch begins from migration candidate `3c8517d4d64a884f0c6dc3a19862210f2c754bf8` and brings in the source-native EX-04 and EX-05 frontend enhancements from `5fc815ace8fd5ac7c5958dfd9fe41cd81b0db7fb`.

## What is preserved
- One existing six-page Agri Foresight app with original green/gold brand, all old navigation, assist FAQ, farmer forms, weather rendering and real FastAPI evaluation.
- Cloudflare FastAPI ASGI entrypoint, Wrangler static-assets configuration, asynchronous source adapters and local Python Worker tests retained entirely from the migration branch.
- Cloudflare migration's Apple-system/Inter typography style; no font binaries copied.
- Current Vercel production site remains live and untouched. No paid plan or Cloudflare credential created.

## Integrated features
- EX-04 future 6/12/24 model-hour rainfall receipts, null/timestamp-gap provenance, NASA historical JSON/CSV download.
- EX-05 real-source status matrix and deterministic backend blocker/unknown/exclusion explanation.
- EX-05 print-ready, source-separated evidence receipt.
- Missing optional location directory credit does not throw asynchronous JS exceptions.
- All new Playwright tests included.

## Release acceptance
- Exact candidate SHA required B-01 (frontend/browsers) and B-03 (all Python + real FastAPI browsers).
- Cloudflare local Python Worker CI must genuinely PASS, including same-origin / and API GET/POST, imported package/runtime compatibility and no provider fixtures in production.
- Cloudflare Free account permission/token **not connected** in this chat. Do NOT run `pywrangler deploy`, guess a `workers.dev` URL, or claim a public deployment until actual connection and owner approval.
- Before new public cutover, independent exact-SHA deployment + API probes, mobile/desktop visual tests, source freshness, security, rollback plan and separate release authorization. Keep Vercel backup until certified.
- This branch is a sibling review candidate; do not overwrite or force push `migration/cloudflare-typography-01` or the EX-04/05 feature branches.

## Migration recovery reconciliation

The separate Cloudflare migration branch advanced to `3c8517d4d64a884f0c6dc3a19862210f2c754bf8` and genuinely PASSed its B-01, B-03 and local Cloudflare Worker CI. This combined candidate now adopts the full latest migration tree, including its corrected `2026-10-30` compatibility date and its tested startup workflow, instead of preserving the redundant older UTC preflight script introduced during a separate diagnostic attempt. Required checks must be rerun on THIS new two-parent exact merge commit. No Cloudflare public deployment or URL is claimed.
