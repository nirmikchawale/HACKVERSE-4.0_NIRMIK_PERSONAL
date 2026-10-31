# UnlockPlan — Phase C-01 UX Architecture

**Workstream:** C, independent design-only track
**Branch:** `design/unlockplan-uix`
**Status:** UX architecture and responsive prototype images prepared; user visual approval pending.
**Reference:** Agrow-inspired deep teal, aqua, olive-gold, warm cream and ink-black. Exact tokens are **not** approved yet and belong to C-02.
**Non-goals:** No changes to Workstream B application files, API behavior, merge or deployment.

## P0 truth contract

UnlockPlan is a forecast-informed, resource-aware **cotton rain-preparedness feasibility planner** for already-picked material in **Jalna, Maharashtra**. It checks farmer-declared prerequisites, quantities, capacity and deadlines; calculates feasible/blocked/unknown outcomes; enumerates inclusion-minimal user-permitted changes only when confirmed and defensible; compares plan versions; reports unhandled quantities and uncertainty. This is not SeedHedge/split sowing and is not crop, yield, storage-safety or loss-reduction advice.

Missing or unverified forecasts are **unknown**, never zero rain. Farmer-requested resources are **not** available until confirmed. A farmer-selected target is distinct from a weather-derived deadline. Inclusion-minimal is not cheapest, fastest or globally optimal. No live forecasts or field data were retrieved to author the design prototypes.

## Canonical six-step experience

| Screen | Primary farmer question | Core UI elements | Next |
|---|---|---|---|
| 01. Situation & location | What requires attention? | Jalna location, crop/material, already-picked cotton, selected action, scope boundary | Weather |
| 02. Weather evidence & deadline | What evidence exists and what is its confidence? | Source, timestamp, forecast status, freshness, uncertainty, manually selected vs weather-derived target | Resources |
| 03. Farm resources | What is actually available? | Units, cotton quantity, workers, work rate, duration, transport/protection/destination and confirmation states | Feasibility |
| 04. Feasibility | Why is this feasible, blocked or unknown? | Primary outcome, arithmetic, blocker list, unknown prerequisites and source explanation | Changes |
| 05. Permitted changes | What confirmed change package resolves verified constraints? | Candidate changes, permissions, availability, optional user-entered costs, minimality qualification, replan loop | Summary |
| 06. Selected summary | What plan can be explained and verified? | Draft/confirmed distinction, action checklist, source ledger, plan versions, explicit unhandled quantities, replan | Iterate |

## Mobile-first information hierarchy

At 390px: top brand → six-step progress → page headline → primary task/evidence → prerequisites/uncertainty → sticky previous/next control. Supporting cards stack vertically. At 1440px: persistent six-step sidebar, breadcrumb and horizontal progress, primary task region and secondary evidence/context column. Interactive controls must have accessible names and keyboard focus. Color never carries status alone.

## Illustrative scenario; not real farm data

Prototype values are **examples only**: 80 bags of already-picked cotton, 2 workers, 10 bags/hour/worker, manually chosen 3-hour target. Arithmetic: 2 × 10 × 3 = 60 bags example capacity, leaving 20 bags unhandled. A proposed additional worker might produce 90 bags of capacity, but worker availability, destination, transport, protective arrangements and weather evidence are unresolved. Therefore do not mark any adjusted package as verified, feasible or inclusion-minimal. This scenario is not a suggested farming work rate.

## C-01 acceptance / boundaries

- Six steps and screen hierarchy: **prepared for user approval**.
- Desktop and mobile prototypes: **rendered locally** for six screens in each light and dark appearance (24 screenshot combinations).
- Browser smoke check: 24 state/viewport combinations with **zero document-wide horizontal overflow**; step navigation/theme switching smoke-tested in Chromium.
- Weather source, crop outcome and safe storage claims: **none** in prototype.
- Color contrast certification, real screen reader audit, real backend integration, tested UI components, CI, release and live deployment: **not performed**. C-02/C-04/C-05 own those later gates.
- No application integration, merge or deploy is authorized or performed by C-01.

**Approval gate:** user inspects each screen and accepts or requests revisions before moving to C-02.
