# UnlockPlan — HACKVERSE 4.0

**Problem statement:** Predictive Climate-Smart Agriculture Planner  
**Selected MVP:** Forecast-informed, resource-aware cotton rain-preparedness feasibility planner for Jalna, Maharashtra.

> From a real weather forecast and farmer-declared resources to a time-bound, explainable feasibility decision and inclusion-minimal permissible resource changes.

## Current status (31 October 2026)
- **Project architecture and execution prompt:** committed.
- **GitHub application source:** migration from an existing tested local ZIP is **pending**. Do not confuse this repository's documentation with a deployed working app.
- **Production URL:** **NOT YET DEPLOYED**. Connected Vercel account lookup returned no available teams or linked projects.
- **Scientific status:** conditional feasibility demonstrator, **not** field-validated agricultural advice.
- **Deadline:** internal 1 November 2026, 2:00 PM IST; organizer submission 6:00 PM IST.

## Authoritative project instructions
- [Master engineering execution prompt](docs/MASTER_EXECUTION_PROMPT.md)
- [Selected Python + TypeScript stack, architecture, and release gates](docs/TECH_STACK_AND_RELEASE.md)

## Selected stack
Python 3.12+ / FastAPI / Pydantic / pytest for the backend; TypeScript / Vite / HTML / CSS for the frontend; Open-Meteo for externally modeled precipitation forecasts; ICAR-CRIDA for clearly dated historical context. Prefer Vercel Git integration once access, preview builds, and deployment are genuinely verified.

## Core user flow
1. View an authentic, attributed and timestamped external model forecast.
2. Choose a candidate preparation deadline (no invented safe rainfall threshold).
3. Enter farmer-reported quantities, prerequisites and permitted alternatives.
4. Compute time slack, capacity shortfall and **feasible / blocked / unknown** status.
5. Enumerate inclusion-minimal **confirmed** change packages.
6. Compare plan versions and explain limitations and unhandled quantities.

**No guaranteed crop protection, yield savings, storage safety, current agronomic validation, globally unique mechanism, or guaranteed resource access are claimed.**

## Release policy
Feature branch → inspect/diff → focused tests → complete applicable CI → merge reviewed commit → Git-connected deploy → independently verify public frontend/API at the actual deployed SHA. Do not auto-publish unfinished or failed code.
