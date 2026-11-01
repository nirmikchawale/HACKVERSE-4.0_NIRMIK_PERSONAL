# AgriForesight FE-01 — Farmer Experience Redesign Master Prompt

**Product:** Agri Foresight / UnlockPlan, HACKVERSE 4.0, single Cloudflare Worker and single GitHub source.
**Baseline:** `main` `d69216847ce5b0d8ac9db20111fda048b0e208fa`; apply as small additive changes only.
**Status:** Implementation requested November 1, 2026. Never represent a branch, CI pass, merge, Cloudflare deployment, and public certification as equivalent.

## Role and task
Act as senior product designer, rural-language UX writer, TypeScript/Python integration reviewer, test engineer, and release auditor. Optimize the existing six-screen app for a farmer who does not understand resource IDs, feasibility jargon, English technical messages, or dense navigation. Preserve the real Python FastAPI resource-feasibility calculations; do not simulate, substitute or independently reinterpret decisions.

## Inviolable scientific and product boundaries
- Pilot is **already-picked cotton preparedness in Jalna, Maharashtra only**. Other chosen locations remain unsupported for assessment.
- Open-Meteo is an external **model forecast**, not observed rainfall or a guaranteed rain-onset deadline; NASA POWER is historic grid data, not a future forecast or direct field reading.
- No claim that cotton will stay dry or safe, no unvalidated rainfall threshold, and no invented farm facts, crop-loss impact or accessible resources.
- Maintain backend input contract `target_units`, `capacity_units`, `required_hours`, `deadline`, `readiness`, `completed`, `unit:handling_unit`, `baseline_resource_ids`, `changes`, confirmation states, and provenance. **Never silently equate kilograms, bags, quintals or abstract work units**; farmers must use comparable units.
- Keep unknown/blocked/feasible/completed distinct. Inclusion-minimal package does not mean cheapest, operationally safe or acquired; no resource booking.
- Preserve all existing detailed tools and 19 accepted source/evidence features. No backend rewrite, new AI model, paid dependencies, new crop support or separate nested application.

## Design
1. **Farmer View default** with Home, Check Weather, My Farm Details, Check My Plan, My Action Plan, Help. Help is a real interactive view; navigation uses the same six underlying screens and state. **Detailed View** preserves Overview, Weather & Window, Farm Resources, Feasibility, Minimum Changes, Plan Summary. Provide reversible toggle on desktop **and mobile**, persist mode without resetting farmer inputs.
2. Present the six questions: work quantity, confirmed handling capacity, time required, preferred finish time, handling-site readiness, and acknowledgment. Provide everyday examples and consistent-unit warnings. Retain all underlying fields; hide resource IDs and optional package editor behind an explicit advanced toggle in Farmer View, and disclose any saved change options that could affect results.
3. Replace repeated preparedness cards in Farmer View with **one live summary** showing questions answered and a working next-action button. The response is never a crop-safety score.
4. Guide the journey Weather → Farm Details → Plan Check → Action Plan. Every button must navigate, open a real panel, submit to FastAPI, select a real engine-returned option, or expose real extra settings. Never create inert placeholder controls.
5. All key Farmer View copy must be conversational **English, Marathi and Hindi**. Prefer familiar non-formal Marathi and Hindi. Cover labels, field help, choice values, navigation, loading, results, blockers, next actions and warnings; preserve numeric values and units across language switches.
6. Display server results in the three-part structure **what was found / why / what next**, using actual `/api/evaluate` response fields. Read-only browser snapshot can expose real returned result to presentation code. Never compute a competing local feasibility verdict. Leave full technical evidence in Detailed View.
7. Preserve external/model source names, transparent limits, accessible focus targets, minimum 44px touch targets where practical, mobile widths, dark/light themes and keyboard use.

## Release and verification
- Work in a short-lived branch; no force push. Create a PR against the up-to-date main and run the existing TypeScript/Vite, browser, Python/API, Cloudflare Worker and repository security gates. Add focused farmer-experience browser assertions.
- Verify `main` has not advanced; fix conflicts on the branch rather than overwrite unrelated work.
- Merge only when required checks pass and owner-authorized release conditions are met. A merge is not a public certificate.
- After the Git-connected Cloudflare deployment, compare exact `main` SHA to `https://agri-foresight.nirmikchawale1.workers.dev/_release.json`, and test `/api/health`, authenticated weather/assessment, six pages, mobile/desktop, all three languages, state preservation and no unrelated feature loss.
- If a gate is unavailable or fails, **hold** deployment and accurately report BLOCKED/PARTIAL rather than invent a success claim.

## Acceptance test matrix
- [ ] Farmer View is the default for a fresh visitor and both modes work on mobile and desktop.
- [ ] Six existing pages remain mounted; technical tabs remain accessible in Detailed View.
- [ ] All six farmer questions visible with familiar help, consistent-unit warning and validated values.
- [ ] Farmer input survives mode change, language change and navigation; result is not silently changed.
- [ ] Compact progress updates on entry/edit; saved optional changes are disclosed.
- [ ] Genuine FastAPI result in all four statuses; no client-generated decision or fake forecast.
- [ ] English, Marathi and Hindi switch labels, warnings, explanations and actions without changing numbers.
- [ ] No inaccessible/inert buttons, runtime JS error, mobile horizontal overflow or theme breakage.
- [ ] Required CI PASS, protected merge PASS, public exact-SHA/route/browser certificate PASS.

## Handoff accuracy
Report separately **DESIGNED**, **CODED ON BRANCH**, **TESTED**, **MERGED TO MAIN**, **CLOUDFLARE DEPLOYED**, and **PUBLICLY VERIFIED**, with exact PR/commit/URL evidence. A draft/branch-only result must not be called deployed.
