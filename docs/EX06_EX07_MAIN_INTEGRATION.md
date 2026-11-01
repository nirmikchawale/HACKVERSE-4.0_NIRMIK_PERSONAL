# EX-06 and EX-07 — Main-branch integration

Restored two existing, independently source-tested features to the newer current six-page Agri Foresight user interface. This is a selective port, **not** a merge of the old Cloudflare migration stack or earlier design changes.

## Feature A — Forecast model-hour comparison
Select one to three distinct, future, authenticated Open-Meteo model hours (Jalna only). Compare only via independently called **POST /api/replan**; never infer a safety threshold. Export successful, backend-attested results as CSV. Missing or failed hours are labeled unavailable and excluded.

## Feature B — Weather-independent manual comparison
Select up to three distinct, valid future IST times (farmer-declared assumptions), even when genuine weather is unavailable. **POST /api/compare** is the sole feasibility authority. No model provenance is claimed. Downloaded Page 06 evidence JSON separates successful forecast-attested and successful manual-only comparisons. Failed calls never appear as verified evidence.

## Migration details
- Reused the verified EX-06/EX-07 DOM and browser workflows from the previous draft candidate; did not change the Python engine or API contracts.
- Adapted to current main: existing EX-12 strict Gregorian calendar deadline validator, EX-10 model age checks, EX-11 NASA translations and UX-13 responsive typography remain intact.
- Source signature now includes the retrieved-at timestamp so a refreshed forecast with identical hour labels invalidates prior comparison outputs.
- Package selection, input edits, location changes, and forecast changes invalidate cached client results.
- Dedicated CSS provides responsive field grouping, scrollable tables and focus outlines, preserving the current theme.

## Verification and release
Execute B-01 TypeScript/Node/Chromium, B-03 Python/real-API browser tests on the exact commit before protected-main merge. Cloudflare deployment is separate and remains unverified until Worker build, exact SHA, public API and desktop/mobile checks pass.
