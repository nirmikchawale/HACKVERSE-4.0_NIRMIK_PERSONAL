# EX-10 — Fail-closed forecast freshness and future-only bar selection

## Current source rule
- Existing Python `backend/unlockplan/weather.py` uses `STALE_AFTER_HOURS = 2`.
- EX-08 export and EX-09 full table already reject 2h-old responses. Original 24-hour bar view previously relied only on status `retrieved_live` or `cached_recent` without elapsed time verification.
- This update centralizes the two-hour UTC retrieval-age guard in `isCurrent()`, so source status can never override a demonstrably old or future-dated timestamp.

## Functional protections
1. A source that says `retrieved_live` or `cached_recent` but is actually older than two hours is labeled **STALE · DO NOT USE**. Weather bars and the candidate-hour actions disappear, while the manual deadline input remains usable.
2. Source timestamps in the future or malformed cannot yield a valid model selection.
3. A returned model hour in the past or next minute stays visible as evidence but its corresponding old 24-hour bar is disabled for selecting future deadlines. The EX-09 full table already follows the same rule.
4. Click handler revalidates freshness, hour membership and future timestamp to prevent time-of-check/time-of-use inconsistencies.
5. No new backend, source API, model, agricultural safety threshold, dependency, host settings or paid plan.

## Tests
- Actual-shaped response with cached_recent older than two hours, and a mislabeled retrieved_live older than two hours.
- A response with future retrieval time.
- Mixed past and future source hours: past 24-hour bars disabled, future model bar fills the existing unsaved deadline form.
- Source expires after being rendered: click handler rejects a previously future hour if source is no longer current.
- Existing 25+ frontend/Chromium tests and 105+ Python/4 genuine FastAPI browser checks must pass at the exact head.
