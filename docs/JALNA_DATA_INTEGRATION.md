# JALNA-DATA-01 — Authentic agricultural context integration

**Status:** Source-authored. Production certification is separate from a GitHub commit.
**Scope:** Jalna approximate city/district reference, Maharashtra, India.
**Date of source inspection:** 2026-11-01.

## Existing live data retained

- \`GET /api/forecast\`: Open-Meteo hourly modeled rainfall in mm and rain probability in %, about 19.84° N / 75.89° E, Asia/Kolkata. A model forecast is not a measured rain gauge or crop-safe deadline.
- \`GET /api/government-climate\`: NASA POWER historical daily gridded rainfall and air temperature (last available 20-day reference, with intentional data lag), not a future forecast.
- \`POST /api/evaluate\`, \`/api/compare\`, \`/api/replan\`: Python farmer-reported resource/deadline engine. Regional soil and other context never silently alter decisions.
- \`GET /api/feasibility-scenarios\`: 100 configured teaching examples, not real field measurements.

## New endpoint

\`GET /api/jalna-agri-context\` (optional \`?refresh=true\`) returns:

\`\`\`json
{
  "location": "Jalna city approximate reference, Maharashtra, India",
  "soil": {
    "status": "historical_reference",
    "reference_year": 2011,
    "classes": [
      {"id": "deep_black", "reported_percent": 13.37},
      {"id": "medium_deep", "reported_percent": 21.36},
      {"id": "shallow", "reported_percent": 65.27}
    ],
    "soil_type_for_individual_field": null,
    "soil_ph_for_individual_field": null,
    "soil_npk_for_individual_field": null
  },
  "conditions": {
    "status": "retrieved_live | cached_recent | unavailable",
    "data_kind": "model_grid_current_conditions",
    "model": {
      "valid_time_local": "provider-native time",
      "values": {
        "temperature_2m": "source-native numeric or null",
        "relative_humidity_2m": "source-native numeric or null",
        "wind_speed_10m": "source-native numeric or null",
        "soil_temperature_0cm": "source-native numeric or null",
        "soil_moisture_0_to_1cm": "source-native numeric or null"
      }
    }
  },
  "decision_integration": "context_only_not_used_by_feasibility_engine"
}
\`\`\`

This is a *schema illustration*, not a statement that a particular temperature or soil moisture has been retrieved.
Source responses are validated for timezone, model grid distance, native units, timestamps, numerical sanity, and missing values. Cache lifetime is 30 minutes, isolate-local/best-effort. Unavailable weather never triggers dummy conditions or a fake farm soil classification.

## Source provenance

- **ICAR-CRIDA / NBSS-LUP**: [Jalna District Agriculture Contingency Plan (2011), §1.4](https://www.icar-crida.res.in/CP-2012/statewiseplans/Maharastra%28Pdf%29/MAU%2C%20Parbhani/Maharashtra%2033-Jalna-31-12-2011.pdf). Historical *district-level* deep black, medium-deep, shallow categories with report percentages 13.37 / 21.36 / 65.27. Reported class areas total 636.77 thousand hectares; a separate report table gives geographical area 772.6 thousand hectares. Do not mislabel the percentages as a precise current whole-district area share.
- **Open-Meteo**: [Weather Forecast API](https://open-meteo.com/en/docs). Separate \`current\` variables: air temperature (°C), humidity (%), 10 m wind (km/h), 0 cm soil temperature (°C), 0–1 cm modeled soil moisture (m³/m³). These are model-grid estimates only, not sensor or farm soil tests. Check provider source status at runtime.
- **NASA POWER**: [Daily agroclimate API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/). Already connected via \`/api/government-climate\`.
- **SoilGrids**: [ISRIC availability notice](https://docs.isric.org/globaldata/soilgrids/). The public REST point-query API was temporarily paused at verification. No alleged field-specific soil type is fabricated or silently substituted.

## What is NOT integrated or measured

- Farmer-specific soil composition, soil pH, N/P/K levels, water retention capacity, salinity, borewell quality and true in-field moisture require an authenticated official dataset or a soil test. No general-use point soil lookup was available for certified integration.
- No dynamic soil type is inferred from Open-Meteo's modeled soil moisture; these are different concepts.
- No historical annual rainfall figure is treated as an operational forecast.
- No new agronomic thresholds, cotton rain protection guarantees, irrigation recommendations or pesticide decisions are derived from these values.

## UI

The existing single six-page Cloudflare dashboard now shows a compact **Jalna weather and soil** source panel within Check Weather, with English, conversational Marathi and Hindi; official links; refresh; null states; and a district-vs-field warning. The original detailed weather source workbench remains available.

## Release gates

1. Backend SHA256 manifest, full pytest, npm audit/Vite, existing real six-route browser suite and focused Jalna tests.
2. Cloudflare Pyodide local worker certification, real \`/api/jalna-agri-context\` route (allow genuine upstream-unavailable but never sample data).
3. Exact candidate SHA, guarded merge to protected \`main\`, public \`/_release.json\` SHA match, public API + browser tests, independent source/soil no-inference checks.
4. Never claim EDGE-DEPLOYED or PUBLIC-VERIFIED before matching evidence exists.
