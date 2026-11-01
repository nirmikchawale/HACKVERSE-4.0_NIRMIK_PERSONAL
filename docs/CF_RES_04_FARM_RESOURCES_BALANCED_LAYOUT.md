# CF-RES-04 — Farm Resources Spatial Balance / Cloudflare Production

## Role
Act as senior responsive CSS layout engineer, accessibility QA lead, UI regression auditor and Cloudflare release engineer. Preserve all existing Agri Foresight form interactions, CSS tokens, backend API, real source labels and protected-branch deployment policy.

## Evidence and problem
Screenshot dated 2026-11-01 shows Farm Resources (Page 03, data-page=2). Planned Work has excessive unused vertical space because `.resource-layout` uses CSS Grid with two columns and its left panel stretches to the combined height of the right-side Preparedness Check plus the “What we use & what we don't” card. This wastes width and height without adding useful interaction. Permitted Alternatives begins below the tall group. The task is a layout change, **not** a change to reported farmer data, engine calculations or historical sources.

## Desired exact composition
Above 1150px:
```
+------------------------------+-------------------------+
| 01 Planned work              | 02 Preparedness check   |
| Intrinsic form height only   | Tall, content-led card  |
+------------------------------+                         |
| What we use & what we don't  |                         |
| Two evidence columns occupy |                         |
| the leftover vertical space |                         |
+------------------------------+-------------------------+
| PERMITTED ALTERNATIVES — full-width, directly below    |
+--------------------------------------------------------+
```
Preserve the current field ordering, existing button IDs, paths, check markers, source-disclosure text, background design and original spacing scale. Use grid placement and `display:contents` for .resource-side **only** inside this desktop layout; do not move DOM nodes or change semantics. The evidence card should stretch and distribute its existing text naturally, not create empty placeholders.

At <=1150px keep document reading order and stack Planned Work, Preparedness Check, evidence, then Permitted Alternatives vertically. Do not introduce horizontal overflow, overlapping controls, or huge fixed-height cards.

## Minimal implementation contract
1. Inspect `frontend/index.html`, `.resource-layout`, `.resource-side`, `.preparedness-card`, `.resource-evidence`, and relevant breakpoint overrides. Compare actual current `main`, not stale screenshots.
2. Add a small, scoped CSS file `frontend/public/resource-layout-balance.css`, linked after existing UI styles. Avoid touching JavaScript, Python, inputs, state and API.
3. Apply desktop grid placement: Planned Work column 1 row 1, Preparedness Check column 2 spanning both rows, evidence column 1 row 2, naturally height-filled. Permitted Alternatives stays directly below as its existing full-width sibling.
4. At narrow viewports, deactivate desktop placement entirely. Preserve semantic source order, touch targets, readability, translations, dark/light and glass palette.
5. Add automated geometry and controls tests at 1649, 1440, 1200, 1024, 768 and 390px: Planned Work intrinsic height less than Preparedness Check, evidence directly below Planned Work, evidence and Preparedness bottom edges aligned (desktop), alternatives below without collision, mobile stacked correctly, no horizontal overflow; ensure unchanged form IDs and actionable controls.
6. Run exact-head security/unit/Vite build, complete Chromium suite, genuine API integration and real Cloudflare Worker smoke. One-defect-at-a-time corrections only. No skipping required branch checks.
7. Submit protected-main PR, merge only after approved and all required certification PASS. Independently confirm Cloudflare production `agri-foresight.nirmikchawale1.workers.dev` serves exact new Git SHA via `/_release.json`, verify page styling loads and the layout geometry on public UI (if hosted browser available).
8. Report source COMMITTED, tests PASS, MERGED, Cloudflare DEPLOYED, PUBLIC VERIFIED separately. Never claim Cloudflare deployment without hosted evidence.

## Negative acceptance requirements
No synthetic farm values; no alteration to model/weather/government source calculations; no fake feasibility or readiness status; no introduced text placeholders; no changes to the remaining five page views; no Vercel workflow or deployment; no disabled buttons. All existing agricultural disclaimers remain unchanged.

## Final evidence
Provide PR URL and exact source/production SHA, all workflow outcomes, browser layout acceptance across six viewport sizes, and the verified production Cloudflare URL.
