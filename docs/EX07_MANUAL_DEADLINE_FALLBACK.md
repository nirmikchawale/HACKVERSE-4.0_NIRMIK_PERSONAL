# EX-07 — Verified manual deadline fallback

**Base:** EX-06 candidate \`5e441c92b15950e2eaf3ae10a97f1177d6c54501\`; no Python API or agriculture-threshold modifications.

## Feature 1 — Weather-independent deadline evaluation

- Page 05 user-selected future \`datetime-local\` candidate list, up to three distinct deadlines, IST. Distinct source category: **farmer-declared assumption**, never Open-Meteo or IMD observation.
- Requires real \`/api/evaluate\` farmer declaration before enabling.
- Each time independently calls **real \`POST /api/compare\`**, preserving current farmer resources and optionally a previously backend-certified package. No local status or slack arithmetic.
- Server \`after.baseline\` is the ONLY authority for status, slack, nonpassing constraints. API 409/422/5xx failures are shown unavailable; no fabricated fallback, ever.
- Candidate validation requires future IST timestamps; stale outputs are invalidated by changing inputs/package; concurrent responses are ignored after invalidation.
- Does **not** ask the forecast provider for data and remains available when the forecast source is unavailable.

## Feature 2 — Reproducible evidence bundle

- Page 06 existing \`Download evidence JSON\` now includes **only successful, server-attested** EX-06 forecast comparisons and EX-07 manual comparisons, each with explicit source categories.
- Unavailable/rejected comparisons are not exported as authenticated results. The export preserves existing NASA/model/provider evidence and original resource declaration/decision.
- No storage, tracking, login, AI assistant, custom predictor or dependency added.

## QA and release requirements

- Browser tests use isolated synthetic API fixtures and cover real \`/api/compare\` request shape, weather-independent results, error separation, JSON evidence, duplicates, past deadlines, input changes.
- Exact-head GitHub frontend/Chromium, Python/real API and genuine Cloudflare local Worker tests must PASS.
- Still no Cloudflare account connection/public deployment, no production URL, no permission to merge protected \`main\`. Current Vercel website remains untouched.
