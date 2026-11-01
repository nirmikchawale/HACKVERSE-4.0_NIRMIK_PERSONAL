# EX-18: F05 + F11 + F27 — source-separated visual evidence and honest offline status

These three additions are implemented within the current six-page AgriForesight MVP, Page 02. Scope is **Jalna, Maharashtra**, already-picked cotton preparation. No engine/API modifications, invented agronomic thresholds, live IMD data or new dependency.

## F05 — model forecast vs NASA government historical period cards
- Place two responsive cards in the existing NASA historical section. Open-Meteo is a **NON-GOVERNMENT-HOSTED MODEL FORECAST**: source-native forecast rainfall is summed over the 24 consecutive IST hours starting at the earliest future source hour; all absent/null hours count as missing and the coverage denominator is 24.
- NASA POWER is a **U.S.-government HISTORICAL GRID**, not observed farm rain. Its card displays the last up-to-14 provided days and sums only actual non-null historical daily rainfall, with its own denominator equal to the number of provided historical calendar days.
- Cards clearly separate future versus past dates. **Totals are for different time windows** and may not be interpreted as forecast-validation error, meteorological equivalence, future rain onset, or safe crop thresholds. On stale, unsupported, or unavailable data, the corresponding card displays no invented number.

## F11 — historical daily rain/temperature visualization
- NASA chart appears **only** when already validated `/api/government-climate` returns usable historical grid data.
- Native no-dependency chart contains a 14-day max daily rainfall bar strip (mm/day) and separate daily temperature (°C) SVG line. `null` stays missing and produces no rainfall bar, dot, or connecting line across a missing temperature reading/date. True 0 rainfall and negative temperature remain possible.
- Collapsible keyboard-accessible HTML table gives exact source-native days, rainfall and temperature values. The chart always shows up to 14 verified days independent of the existing seven/all cards filter; existing NASA JSON and CSV exports remain unchanged. No static demonstration weather or screenshots on production pages.

## F27 — offline/last successful fetch evidence
- The weather page displays **browser-reported** online/offline state and last successful source receipt timestamps for Open-Meteo and NASA POWER. This is an indicator, not an assurance that upstream providers are reachable.
- Stores only a bounded local metadata record: `{version:1,model:<UTC timestamp|null>,nasa:<UTC timestamp|null>}`. No response/weather payloads, farmer data, location IDs, geolocation, cookies, requests, or credentials are saved. Local storage failures are tolerated; arbitrary records/old/future timestamps are rejected.
- Offline weather chip explicitly says last-received model if a source-validated, not-yet-expired response is still in the current tab. No fresh API call or offline forecast is invented and model values remain subject to the two-hour expiry rule. The separate source-refresh actions remain the only way to fetch actual new evidence.

## Acceptance / release
Source safety and missing-value regressions; genuine/missing historical data; mobile card and chart layout; multi-language changes; browser offline/online toggles; local metadata storage and no rehydration of actual weather payloads. Require exact-head B-01 (frontend/audit/build/Chromium) and B-03 (Python and real FastAPI browser tests) PASS before guarded merge. Public Cloudflare Worker deployment is separately unverified/blocked until its account-side build and GET/POST exact-SHA checks genuinely pass.
