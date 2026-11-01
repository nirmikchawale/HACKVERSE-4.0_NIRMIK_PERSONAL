# EX-11 — NASA historical government evidence localization

**Base:** protected main `afd19c9b5bf8a8798a671f326e4aa41cca581d0b`.
**Scope:** Only source-provenance text controls, existing daily history cards and language switching in `frontend/public/connected.js`. No government API request schema, cached data, weather source, forecast, server engine or downloadable JSON data changes.

## Newly localized
- NASA POWER government-history title, science and source distinction, refresh control, date-range selector, JSON download and status.
- Actual historical day rainfall/temperature labels, available-days and missing-value summaries, verification status and unsupported-place notices.
- English, Marathi and Hindi switch without re-fetching source data or changing unit magnitudes, daily dates, missing/null values, numeric calculations, data scope or original source URLs.
- Provider-origin notice strings, if received, stay verbatim rather than being mistranslated into a fabricated scientific claim.
- Export remains raw original verified JSON with true data values and English machine-readable property names.

## Test / release scope
Playwright verifies language change after successful NASA retrieval, date filter, unchanged numerical facts and JSON source, unavailable source and unsupported location. B-01 + B-03 must PASS exact feature SHA; merge protected main only through valid GitHub release rule. Parallel Cloudflare PR #18 must reconcile newer main independently; public Cloudflare production is never implied by merge.