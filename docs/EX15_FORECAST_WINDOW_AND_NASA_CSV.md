# F01 + F09 — Forecast-window evidence and NASA historical CSV

**Target:** existing Page 02 of the single six-page AgriForesight MVP, Jalna only.
**Feature owner:** browser user; no extra server endpoints or scientific engine changes.

## F01 — Descriptive 6 / 12 / 24 model-hour windows
A three-card visual summary uses only the latest backend-validated, current (<=2-hour) Open-Meteo response. Starting from the earliest eligible future hour, it sums only available non-null modeled precipitation (mm), reports the number of supplied readings out of 6/12/24, and explicitly labels incomplete windows as **known partial rainfall**. A missing timestamp or null value does not become zero. Maximum hourly model probability is not presented as the probability of rainfall over the entire time window. Cards disappear when the forecast is stale, unavailable, unsupported, or explicitly cleared. Text supports English, Marathi and Hindi; the current theme and typography remain authoritative.

## F09 — Verified NASA POWER CSV export
Add a second download action beside the existing NASA JSON export. It is disabled by default and until a verified `government_gridded_historical` NASA response is validated for Jalna. It resets on source refresh, failure and location change. It contains all validated historical days (not only the selected 7-day display subset), source/category/retrieval timestamp/document URL, blank missing values, legitimate negative temperatures, and spreadsheet-formula-safe quoted text. Labels translate, but values never do. NASA is historical government grid evidence, not live station observation, a field test or a forecast.

## Visual QA / regression
Three columns on desktop and one on mobile; cards use `--card`, `--ink`, `--border`, `--muted`, and the already-certified typography. Native buttons remain keyboard-focusable; source row wraps rather than overflowing. Playwright covers authentic fixture responses, null vs zero, missing hours, historical missing data, invalid/unsupported states, CSV contents, language changes, mobile sizing, and stale source expiry.

## Required gates
B-01 Node/typecheck/audit/Chromium plus B-03 Python/real FastAPI browser must pass at exact candidate SHA before GitHub main merge. Cloudflare full-stack Worker restoration and public production certification are separate, currently unresolved gates. Do not claim public deployment from this merge.
