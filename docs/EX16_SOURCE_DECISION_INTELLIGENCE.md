# EX-16 — Roadmap F12 + F17 on current GitHub main

## F12 — Independently verified source-status matrix
Five responsive Overview cards track verified backend + registry, non-government Open-Meteo source freshness, NASA POWER historical government grid, official IMD not-connected state, and user-declared FastAPI evaluation. Forecast freshness uses the existing 2-hour limit. NASA history is never a future forecast. Unsupported locations clear model and NASA verification labels. Provider errors remain unavailable. Labels are localized in English, Marathi and Hindi.

## F17 — Decision explanations with declared input lineage
Below the original constraint list on Page 04, render the exact FastAPI overall status, every nonpassing baseline constraint and provenance, explicit backend exclusions, and the actual submitted target, capacity, required hours, readiness and IST deadline. Never calculate new decision statuses or crop-safety recommendations on the client. Stale results are invalidated when current inputs change. The component never saves or transmits additional farmer data and introduces no external dependency.

## Scope and gates
Port only relevant old EX-05 component principles, while preserving current EX-06/07, EX-08–12, EX-14/15 and UX-13. Isolated CSS uses existing glass theme tokens; ensure focus/mobile layout. Run exact-head B-01 desktop/mobile Chromium and B-03 real FastAPI and Python checks. The Cloudflare Worker build, exact deployed SHA and public GET/POST remain separate unresolved gates.
