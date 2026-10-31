# UnlockPlan — C-02 Premium Design System

**Workstream:** C — independent design-only track  
**Branch:** `design/unlockplan-uix`  
**Status:** Reusable design tokens committed; local theme studio and isolated six-screen prototype rendered/tested; visual approval pending.

## Source and positioning

Use the user's supplied Agrow moodboard for an **original** premium glassmorphism visual language, not copied brand assets. Five sampled color anchors: Deep Teal `#155555`, Aqua Mint `#30B39B`, Olive Gold `#A89A2A`, Warm Cream `#E2E1CB`, Ink Black `#070D11`. These sampled colors are approximate, not certified source-brand specifications.

UnlockPlan stays the authentic forecast-informed, resource-aware **Jalna already-picked cotton** rain-preparedness feasibility planner. No guaranteed rain-safe window, crop outcome, storage safety, loss reduction or availability claims.

## Artifacts

- **Committed:** [semantic CSS theme tokens](tokens/unlockplan.tokens.css), including Light/Dark modes, controls, typography, spacing, glass surfaces, accessible status colors, focus, reduced-motion, forced-colors and blur fallbacks.
- **Created locally:** `UnlockPlan_C02_Theme_Studio.html` — design-system gallery, visual palette, control examples and functional appearance switch.
- **Created locally:** `UnlockPlan_C02_Integrated_Six_Screen_Prototype.html` — the C-01 six-screen prototype restyled with the new C-02 theme tokens in both modes, with *preview-only* CSS bridge.
- **Created locally:** 24 C-01 screen-theme-viewport screenshots; 4 Theme Studio screenshots; 6 desktop light/dark comparison boards; browser and contrast audit JSON; detailed Markdown handoff; ZIP review package.
- No Workstream B source, API, tests or deployments have been changed.

## Semantic palette samples

| Token | Dark | Light |
|---|---|---|
| App background | `#070D11` | `#F6F5E9` |
| Solid surface | `#123C39` | `#FFFCF1` |
| Glass surface | `rgba(21,85,85,.73)` | `rgba(255,253,245,.87)` |
| Primary text | `#F3F0DB` | `#163B37` |
| Secondary text | `#BED4CB` | `#48615A` |
| Small/link accent | `#7EEAD1` | `#0B6D5C` |
| Action background | `#30B39B` | `#155555` |
| Action text | `#071411` | `#FFFFFF` |
| Gold small label | `#F1DC78` | `#67530A` |
| Focus indicator | `#FFE78B` | `#155555` |

The raw Aqua/Gold brand swatches should not be used as ordinary light-mode text where contrast is insufficient. UI code should use semantic tokens, never raw brand hex codes.

## Material / typography system

- Body type: Inter / Segoe UI / system sans fallback; restrained Georgia serif only for editorial hero phrases.
- Spacing: 4px base; controls minimum 44px; radii 10/14/20/26px; glass blur 22px.
- Focus: visible 3px ring with offset. Motion: 150–220ms, disabled for reduced-motion. Opaque fallback if backdrop filters unsupported.
- Navigation, evidence ledger, cards, stepper, forecast uncertainty, feasibility status and candidate packages reuse the same semantic palette.
- Distinct status **words + icons**: Feasible ✓, Blocked ×, Unknown ?, Completed ◆. Color is not the only signal.

## Scientific / judge honesty

- Forecast unavailable: display *unknown/unavailable*, never invented 0 mm rain.
- An unconfirmed worker/destination/transport is not counted as available.
- Inclusion-minimal means no proper subset of changes still satisfies verified constraints; it is not necessarily cheapest or fastest.
- Prototype examples use 80 bags, 2 workers, 10 bags/hour/worker, 3-hour selected target, 60-bag arithmetic capacity, and 20 bags unhandled. They are **demonstrative assumptions**, not empirical agricultural rates or live data.
- External forecast attribution and freshness appear only when a real forecast has been fetched and verified.

## Bounded C-02 validation (local)

- Six screens × two appearances × two viewports (1440px and 390px): **24/24 no document-wide horizontal overflow**.
- Theme Studio at same widths and appearances: **4/4 no document-wide horizontal overflow**.
- Prototype navigation and appearance toggles, plus Theme Studio appearance switch: tested.
- Chromium page script errors: **0**, after correcting a test-harness-only double-injected script issue.
- Nominal WCAG 2.2 token contrast audit: **20/20 selected pairs** at required 4.5:1 normal text or 3:1 control-outline thresholds.
- Not yet audited: all translucent/composited pixel backgrounds, every hover/focus state, screen readers, zoom, keyboard order, real API responses, backend tests, actual application CSS regression. **These are later phase gates.**

## Gate and next action

C-02 is **prepared for visual review**, not yet approved for application integration. C-03 (four high-fidelity functional screen designs) should use these tokens after user direction. C-04 alone owns safe integration into tested frontend components after branch inspection and focused regression tests. C-05 owns full visual, accessibility and judge-demo QA. **No merge or deployment in C-02.**
