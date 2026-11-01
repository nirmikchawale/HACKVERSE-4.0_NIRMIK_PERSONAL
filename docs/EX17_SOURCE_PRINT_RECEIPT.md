# EX-17 — source timestamp receipts and printable decision evidence

Scope: the existing six-page AgriForesight Jalna/cotton MVP, no backend API changes.

## F13: source age + last-update/provenance receipt
The Overview section shows exact backend-provided Open-Meteo retrieval timestamps and age (model live only within the existing two-hour TTL), NASA POWER historical grid source retrieval/latest historical date, browser-observed successful FastAPI evaluation receipt (not mislabeled as server generation time), and permanently unconnected official IMD warning status. A separate browser-check UTC timestamp distinguishes rendering from provider fetching. The refresh button only recalculates in-memory ages, and a visibility-aware 60-second UI update prevents indefinite 'live' indicators. Existing provider-refresh buttons continue to fetch data. Missing, future, stale, unsupported and absent statuses remain truthful. No synthetic production values.

## F23: paper-ready evidence receipt
Page 06 has a print-preview card generated solely from currently validated state. The existing Print Summary button triggers native print and beforeprint refresh. A4 print CSS prints only this receipt, not the interactive application or navigation. Include UTC browser receipt time, location, actual backend result, exact submitted user inputs, IST deadline, model and historical source provenance, missing IMD, all unresolved backend constraints and excluded changes, selected conditional package and counts of successful real FastAPI deadline comparisons. If there is no current evaluation, explicitly say NOT EVALUATED; no draft is passed off as tested data. No data is sent to new providers. English, Marathi and Hindi labels; source figures unchanged.

## Testing and release
Use automated desktop/mobile Chromium tests for status ageing, expired/current sources, provider failures, location changes, localization and print-only CSS, plus real FastAPI browser and Python tests. Exact-head B-01/B-03 PASS before guarded merge. Cloudflare Python Worker runtime and public production certificate remain separate blockers; source merge is not proof of website deployment.
