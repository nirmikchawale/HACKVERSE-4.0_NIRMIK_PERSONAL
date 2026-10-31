# INT-08 — Tanisha data contribution intake / merge governance

Upstream: [PR #8](https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL/pull/8), commit `0558b42a10ef6d5432fcdd686fec335ee193008e`, ZIP blob `4ecd2526ecb320d4a2948286219abddca86fa9c8`.

The 8 original text files have been extracted unchanged into `contrib/tanishacoding/` (original relative paths preserved). The original SHA256 manifest is checked by `backend/tests/test_tanisha_data_bundle.py` during B-03. Do not execute `tools/capture_api_forecast.py` in CI.

- **Already functioning:** `backend/unlockplan/weather.py` retrieves current Open-Meteo precipitation forecast, and the six existing FastAPI routes are server-authoritative.
- **New reference material:** 28 Indian states + 8 UTs, historical 2011 Jalna soil context with denominator caveat, source catalog, API crosswalk, and optional manual QA tool.
- **Not established:** current soil sensors, real farmer-level soil, exhaustive districts/cities/villages, wider location forecasting, new weather retrieval service, separate new API, full six-page dashboard integration, or official third-party licensing/QA review.
- **Use boundary:** administrative names are reference data only. Current backend forecasts remain pinned to Jalna approximate coordinates. Do not permit UI choices outside Jalna to masquerade as supported weather/feasibility. Historic soil is evidence-drawer-only, not an engine feature.
- **Licensing:** archive identifies source links, not clear redistribution licenses for institutional third-party source material. Keep references/brief metadata; verify source license and exact figures before exposing or republishing externally.
- **Application behavior:** unchanged in this data-intake PR. The six-page runtime adapter and state selector belong in a separate C04 feature candidate; use source files and provenance as needed after review.
- **Release:** repository `main` auto-deploys to Vercel production; owner separately instructed production hold. This is a DRAFT PR, not merge/deploy authorization. Preserve certified PR #7 exact SHA and the current production SHA. Merge only with applicable CI, owner decision on release impacts, and updated exact candidate certification.
