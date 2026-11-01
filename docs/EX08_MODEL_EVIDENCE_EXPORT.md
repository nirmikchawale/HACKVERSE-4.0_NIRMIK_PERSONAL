# EX-08 — Forecast coverage audit and source-preserving CSV

**Source branch:** built independently from protected main \`410f8a522ca8cc8bf4df6dac03aed93bc42a2e89\`. This intentionally does **not** include the unmerged Cloudflare Python Worker configuration, migration typography/sidebar branch, or EX-04/07 stacked feature candidates. It can be reviewed and merged independently without altering hosting.

## New farmer-facing actions (existing Page 2)
1. A source-data quality receipt of **actual backend-validated** Open-Meteo model responses: retrieval UTC time, elapsed age, reported rows, valid rain/probability counts, duplicate hourly timestamps and missing hourly positions.
2. A browser-native source-labelled CSV export with each source-native hour, mm, probability %, provenance, response status and UTC retrieval time. Missing values remain blank; no imputed dry weather, station gauge, science threshold, extra request, user data or external upload. Spreadsheet formula injection is escaped in text fields.
3. Both quality data and export are disabled for unsupported place, stale/unavailable/bad source. The source is an **external modeled forecast, not observed rain or a safe crop timing threshold**.
4. Accessibility: screen-reader status and explicit focus indication; mobile responsive grid.

## Acceptance gates
- Existing B-01 TypeScript/npm audit/Vite + Chromium and B-03 110+ Python/genuine browser tests PASS on this exact feature head.
- Added Playwright tests verify authentic-shaped source receipts, null/zero distinction, duplicate/gap counts, available CSV with provenance, and fail-closed unsupported/unavailable/stale modes.
- No backend/Worker code changes. Production publish is **not** implied by a GitHub merge; owner-coordinated Cloudflare migration requires separate public exact-SHA certificate.
- Merge only through protected PR status checks, never direct branch force-push. Parallel Cloudflare branch must reconcile this feature in its final integration.
