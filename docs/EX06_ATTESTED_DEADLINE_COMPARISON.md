# EX-06 — Three source-authenticated deadline comparisons

**Scope:** single existing six-page Agri Foresight MVP, Page 05 Alternatives.
**Base:** unified Cloudflare + EX-04/05 local-certified candidate \`564b650a0ce3efe3182421a6d3f2f5490961217f\`.

## Delivered
1. Three independent time selectors populated ONLY from a recent (<=2h), backend-validated Open-Meteo model-hour response, Jalna-only, strictly future, source-native timestamps.
2. Up to three concurrent real \`POST /api/replan\` calls using the farmer's actually evaluated inputs. If a backend-returned conditional package was selected, its projected target/capacity are passed as the AFTER case; otherwise both cases use baseline declarations. Each call uses the same current request time, without modifying agronomic rules.
3. Output shows **only the server-returned** feasibility status, slack hours, blocked/unknown constraints, selected model precipitation, source attribution and timestamp. No local feasibility ranking, invented rain thresholds, fabricated alternate weather or automatic farmer action.
4. Honest independent per-hour errors (401/409/422/5xx/unexpected response), no fake results, de-duplication, source/assessment change invalidation, guarded concurrency and native CSV export containing only server-attested rows.
5. Real browser tests: three independent POST calls and backend statuses, partial upstream failure and CSV exclusion, duplicate selection protection and input change invalidation, unavailable source; earlier workflows remain mandatory.

## Cautions and future work
- \`/api/replan\` must independently fetch/attest current actual model data. The browser forecast is a **candidate-hour selector**, not a second authority.
- A server's 409/no verified forecast MUST display unavailable even if a previous browser model is present.
- Existing source cards, NASA history, farmer privacy, bilingual translations, original deterministic engine and Cloudflare local runner are unchanged.
- Further expansion includes an accessible candidate-time table and Hindi/Marathi labels after UX review.

## Release gate
Code commit alone does not deploy. PASS requires exact-head frontend+browser, backend+real API, Cloudflare local runner; then connected Cloudflare Free deployment with exact public URL, GET/POST and mobile checks. Keep current Vercel site untouched, PR draft, \`main\` protected until distinct release authorization.
