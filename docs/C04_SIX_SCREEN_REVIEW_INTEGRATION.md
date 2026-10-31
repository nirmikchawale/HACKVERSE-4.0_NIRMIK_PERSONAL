# C04-01 — Six-screen HTML design review integration (2026-11-01)

## Scope
The owner-supplied `UnlockPlan_Full_Interactive_Prototype_CHAT_FIXED(1).html` has been installed as `frontend/public/interactive-review.html` with a visible `/` return link. The certified FastAPI/Vite application remains at `/` unchanged except for a link banner.

This is a **review of the six-screen interaction design**, not completed live data integration. It includes:
- Overview, Weather & window, Farm resources, Feasibility, Minimum changes, Plan summary
- Light-first Agrow and alternative palettes, responsive navigation, offline assistant (Enter and Send), local drafts, explicit sample weather tools
- Offline browser computation *only* for teaching/review, clearly labeled illustrative
- No new application API calls, no soil/forecast data feeds, no changes to the scientific Python engine, API routing, or protected credential configuration

## Data integrity
The existing live planner at `/` continues to use server-authenticated `/api/forecast`, `/api/evaluate`, `/api/compare` and `/api/replan` responses. The separate `/interactive-review.html` does **not** use those endpoints and must never claim its sample calculations or user input are verified by FastAPI.

Location UI is exploratory; real Jalna-only backend scope does not expand. Do not treat requested resources as confirmed.

## Release checks
B-01 and B-03 workflows must pass on exact proposed SHA. New Playwright tests validate six-screen routing, chat Enter/Send, themes, mobile navigation and return link. Verify Vercel exact-SHA preview and production homepage/standalone review URL following merge.

## Not part of this change
Replacing the connected planner with an unverified standalone UI, adding real AI or speech-transcription services, API binding of all six pages, user accounts, third-party soil measurements, or broader multi-location coverage. Those need separate feature work and fresh certification.
