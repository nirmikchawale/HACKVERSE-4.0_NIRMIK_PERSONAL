# WXR-04 · Compact Weather Panels and Single Working Resources Action

## Role and objective
Operate as senior responsive UI engineer, JavaScript behavior maintainer, accessibility specialist, and Cloudflare release certifier for Agri Foresight (HACKVERSE 4.0). Based on the supplied screenshot, remove the wasteful bottom region in Page 02, **Weather & Window**, without deleting real forecast exploration, source disclosures located elsewhere, farmer-controlled deadline entry, server evaluation or navigation. Restrict modifications to the targeted page and its tests; preserve all six pages and existing tokens, themes and languages.

## Non-negotiable user acceptance requirements
1. Remove the bottom **Model Evidence** metadata strip repeating "Forecast source", "Retrieval" and "Timezone"; these facts are already available in existing provenance/evidence controls. Do **not** strip timestamp or attribution from the actual API data or exported records.
2. Remove the redundant **Your Planning Window** footer separator, duplicated rainfall/onset disclaimer and the extra bottom navigation row. Keep the useful short planning-window origin/context and the source-labeled uncertainty disclosures elsewhere.
3. There must be **exactly one** Continue to resources button inside Your Planning Window. Use the original working `.goto[data-target="2"]` navigation element from the lower footer, not a newly created, disabled copy. Its accessible name, translations, target and handler must remain valid. It must stay clickable both before and after saving a deadline (the previous bottom button allowed this). Do not use the disabled state as a safety gate for navigating to Farm resources; the feasibility engine itself continues enforcing all input validation.
4. Minimize empty space: remove the forecast panel's obsolete fixed minimum height and use meaningful chart area to fill the desktop card, rather than leaving a blank white bottom. Lay out the two desktop card bottoms at exactly the same position without CSS overlay, clipped text or forced whitespace. On widths at or below 1150 px, stack by intrinsic content height.
5. Preserve **Refresh live forecast**, **Clear forecast view**, source status chip, current model data visualization and hourly-source explorer, the candidate date/time input, origin and save buttons, live source-quality and missingness states, chart interactivity, and real FastAPI backend calls.
6. No fabricated forecast, synthetic rainfall, automatic crop-safe threshold, favorable feasibility result, unconfirmed farmer declaration or source misrepresentation.

## Required implementation
- Modify only `frontend/index.html` to remove the two duplicate footer regions, give the original working button an ID and load scoped CSS.
- Modify only `frontend/public/connected.js` to hold a reference to the original `#deadlineGuideContinue` prior to guide renders; append that same real button in `.wx-guide-actions`. Since `replaceChildren` detaches nodes on every rerender, retain the element reference and reattach it. Do not add a second handler or additional button.
- Add `frontend/public/weather-panel-compact.css` with selectors scoped to `section.section[data-page="1"]`. Use existing palette tokens and avoid changing other pages or global .goto behavior. A two-column desktop grid with stretch, flexible chart area and compact guide action rows should keep card bottoms aligned. On mobile allow normal stack, full-width buttons, no horizontal overflow.
- Keep pre-existing English/Marathi/Hindi i18n markup on the moved element. Do not remove language keys used by other UI.

## Acceptance tests
- Static: source strip removed; footer caution and divider gone; exactly one `#deadlineGuideContinue`; no repeated text/duplicate button.
- Interaction: the existing button navigates to Farm resources without requiring a saved deadline, as the original lower button did. No user inputs or completion marks are filled by navigation.
- Lifecycle: after deadline edits and saving, rerender does not erase or duplicate the navigation action; keyboard Enter works.
- Spatial QA: 1649, 1440, 1200 px show equal top and bottom edges, no dead footer strip, visible chart and single CTA. 1024, 768, 390 px stack cards, keep inputs visible and avoid horizontal scrolling.
- Regression: run existing WXR02/WXR03 source workbench, real browser route tests, Python/real FastAPI B03, Cloudflare local Python Worker, Vite build, TypeScript, dependency audit and full Chromium tests. Retain field missingness and provenance.
- Test exact PR head SHA; if another branch changes main concurrently, reconcile only nonoverlapping files and rerun checks. Do not bypass branch protection or force merge.

## Cloudflare-only release process
1. Open additive feature PR to protected `main`, using the current main baseline and no legacy host references.
2. Wait for required checks and visual acceptance criteria. Diagnose one genuine failure at a time.
3. On green exact-head certification, perform guarded GitHub merge subject to protection.
4. Verify the **public** `https://agri-foresight.nirmikchawale1.workers.dev/` serves `/_release.json.git_commit_sha` equal to the actual merged commit. Use Cloudflare Workers deployed status and public API/browser smoke; do not confuse an immutable old preview URL with current production.
5. Report separately: CREATED, COMMITTED, CI-VALIDATED, MERGED, CLOUDFLARE DEPLOYED and PUBLIC-VERIFIED. A missing hosted receipt is an explicit release limitation.

## Scope safeguards
No changes to farm-resource handling, permitted changes, feasibility classifications, government data, model response schema, actual deadline validation, navigation outside Weather & Window, or app-wide CSS. Optimize for the user's requested simple, compact, single-action, professionally aligned design.