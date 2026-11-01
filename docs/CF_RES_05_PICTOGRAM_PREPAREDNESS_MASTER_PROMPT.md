# CF-RES-05 — Pictographic Evidence + Interactive Preparedness Check

## Objective
Update Agri Foresight Page 03 (Farm Resources), using the user's approved compact pictogram direction and a more engaging, genuinely interactive readiness assessment. Implement as source code on the sole supported Cloudflare Worker deployment, without screenshots as static UI or inventing farming information.

## Existing contract and source of truth
- Repository: `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL`, production branch `main`.
- Deployment: Cloudflare Workers, service `agri-foresight`; no retired provider.
- Existing resources: `quantity`, `capacity`, `duration`, `readiness`, saved `deadlineInput`, `confirmInputs`, resource option editor, real FastAPI assessment.
- Farmer declarations are not independent verification. The 0/6 count measures *supplied fields*, not operational preparedness, agricultural safety or probability of success.
- CSS and existing page navigation, accessible controls, language options (English, Marathi, Hindi), palettes/themes, and desktop grid balance remain authoritative.

## Visual requirements
1. Replace large, mostly empty static explanation boxes with two compact, equal-weight native SVG cards:
   - **Included in planning**: clipboard/checkmark pictogram, concise summary of target, capacity, hours, deadline and readiness; native accessible disclosure shows the existing full disclaimer and a real Edit inputs action.
   - **Not independently verified**: shield/alert pictogram, concise summary of people, equipment, crop safety and actual rain; disclosure preserves the original full limitation and directs to labeled model forecast, without treating model estimates as verified field rainfall.
2. No image-generation dependency, raster screenshots, custom fonts, heavy libraries, gradients competing with other dashboard elements or purely decorative controls. Use inherited CSS design tokens and 44 px or otherwise usable interaction hit targets.
3. Collapse long arithmetic explanation under an accessible native `details/summary`. Keep the formulas available but out of the primary visual flow.
4. Keep the exact CF-RES-04 geometry: Planned Work at top left, compact pictographic panel below it, Preparedness Check to the right, Permitted Alternatives below; preserve mobile natural reading order and visual alignment.

## Preparedness Check requirements
1. Six interactive buttons grounded in existing entered data: target, capacity, hours, saved candidate deadline, site readiness and confirmation/acknowledgment.
2. Every button jumps to/focuses the corresponding actual input; never supply values, mark input as complete without input, or mark `readiness=no` as safe. If site readiness is explicitly `no`, show caution as a form status, not a fabricated hazard prediction.
3. Reuse the exact existing `renderPreparednessUI` state and `resourceCheckBadge` count, `resourceCompletenessProgress`, derived capacity coverage, shortfall and time margin. Do not recalculate with a competing client engine; keep existing arithmetic bounded and source-labeled.
4. Make derived tiles real navigation controls with focused editing, retain all original IDs, and collapse the already-working four-step decision pathway rather than removing its navigation handlers.
5. Retain a single prominent next-missing-input button and concise caveat; no repetitive static safety theory.

## Implementation/quality contract
- Minimal modifications to `frontend/index.html` and a single scoped stylesheet `frontend/public/resource-pictogram-preparedness.css`.
- Preserve all i18n keys and add short translations for new labels to all three languages. No user data persistence changes.
- SVGs remain `aria-hidden=true`; native details summary and buttons provide keyboard support, proper names, focus indication and reduced-motion handling.
- Visual/bounds tests at 1649, 1200, 1024 and 390 px; preserve existing six-width CF-RES-04 geometry tests at 1649, 1440, 1200, 1024, 768 and 390.
- Tests exercise genuine input-field navigation, input state changes, capacity=60/target=80 => 75% and 20 handling units shortfall, explicit no-readiness caution, unsaved deadline not counted, unchanged server assessment entry, disclosure toggles, accessibility and language resilience.
- Run full Vite/TypeScript, audit, Python/real-API and Cloudflare local-worker tests, plus full Chromium suite. Do not merge with failing or expected required checks; fix only isolated defects.
- After protected-main integration, independently certify Cloudflare `/_release.json` exactly matches merged SHA; run actual Cloudflare API and six-page public browser smoke, and verify stylesheet and visual layout are available at public URL.

## Failure handling
When unrelated pushes advance `main`, reconcile safely before guarded merge; do not overwrite unrelated Weather, Overview, Feasibility or other dashboard changes. Never bypass branch protections. Do not claim public deployment or success before hosted exact-SHA proof.

## Sign-off
Report separate states for CREATED, COMMITTED, TESTED, MERGED, CLOUDFLARE DEPLOYED and PUBLIC VERIFIED, including PR number, SHA and explicit remaining blockers.
