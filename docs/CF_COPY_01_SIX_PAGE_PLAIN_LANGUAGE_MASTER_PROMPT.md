# CF-COPY-01 — Six-Dashboard Plain-Language and Cognitive-Load Reduction

## Optimized comprehensive master prompt

> You are the senior product UX writer, frontend engineer, accessibility specialist, scientific evidence reviewer, and Cloudflare release engineer for the existing Agri Foresight six-page MVP. Use the latest protected `main` as the authoritative source and operate only on the GitHub-backed Cloudflare Worker `agri-foresight`. Review the Overview, Weather & Windows, Farm Resources, Feasibility, Minimum Changes, and Plan Summary pages and every active subsection, focusing on the currently rendered text from both `index.html` translations and `connected.js` dynamic components. Remove redundant blocks, replace dated preview claims, shorten headings, helper copy and empty states, and promote working controls/data. Write in simple everyday English, Marathi and Hindi; preserve all buttons, inputs, state transitions, accessible labels, source timestamps, explanatory units, and necessary risks. Do not hide uncertainty, claim a missing source is live, fabricate agricultural measurements, change algorithms, weaken verification, or relocate a required scientific notice into nowhere. Commit a scoped design/copy patch, run exact-head typecheck, audit, Vite build, full Chromium, genuine FastAPI integration, Cloudflare local Worker tests, guarded protected-branch merge, then verify the exact merged SHA, live health/source APIs, six-page desktop/mobile browser and plain-language regression on the existing production `workers.dev` URL. Do nothing on the previous hosting platform.

### Objective and guiding priorities
1. **Action first.** One meaningful short sentence per panel before the corresponding control. Show source-backed data and decision results; never add explanatory cards merely to fill space.
2. **Eliminate repetition.** A meaningful warning should normally appear once near the relevant decision. Preserve audit/provenance and scientific limitation material in the Evidence page and accessible optional details, rather than omitting it entirely.
3. **Plain language.** Prefer verbs such as **Check, Choose, Enter, Compare, Review**; short nouns and sentence case; concise help. Avoid jargon such as “inclusion-minimal” unless accompanied by a plain explanation. Do not relabel farmer-declared resources as verified physical assets.
4. **Truthful science.** Open-Meteo = model forecast, NOT field rain observations. NASA POWER = historical government grid, NOT a forecast. A selected hour is farmer-chosen, NOT a safe-work/rain-onset guarantee. Blank precipitation = unknown, never zero. FastAPI = conditional resource/time evaluation, NOT field-level certification.
5. **Six-page treatment.** Overview: short headline and four-step actions; avoid static introduction duplicates. Weather: model hours + deadline actions; remove decorative passive panels and old standalone-demo descriptions. Resources: keep comparable units, editable rates/inputs and confirmed/unknown distinction; put optional formulas behind expandable disclosure. Feasibility: show status, blockers, constraints and actual backend calculations without repeated theoretical disclaimers. Minimum Changes: show only engine-returned eligible packages, no imaginary confirmation; explain “minimal” in a line. Summary: compact source/use/limits, downloadable provenance and clear uncertainty.
6. **Accessibility and localization.** English/Marathi/Hindi should carry the same distinctions. No text-only color signals; keyboard focus, screen-reader disclosure, responsive widths, translations of new controls. Preserve the current glassmorphism typography and every functional button.
7. **Scope control.** Prefer changes to UI copy and strictly local CSS. Do not change FastAPI source/native coordinates, routing, integrity gates, CI expectations or data fields except when required for a proven unrelated test defect. Preserve existing 100-case explorer, Cloudflare-only workflow, and all established successful functionality.

### Acceptance
- Each of six pages has shorter default-visible instructional text; no stale standalone-prototype statements misleading the user about live Cloudflare APIs.
- All six pages remain interactive with existing controls, and all dynamic status/report details retain provenance, units, freshness, conditionality and uncertainty.
- No inert controls, blank layout holes, unhandled mobile overflow or broken desktop alignments; where theory was removed the primary action rises into view.
- Browser tests confirm live headline/labels, details disclosure, translations, functional workflows, source timestamp, page navigation, responsive geometry and absence of deprecated passive Weather panels.
- Exact HEAD passes all required CI, Cloudflare candidate build, then postmerge real public `/_release.json`, `/api/health`, `/api/forecast`, `/api/government-climate`, 6-page browser smoke and copy-specific tests. Never equate a merge with a public deployment.

### Audit classification
- **Retain intact:** source/provider identity, timestamps, measurement units, complete genuine numeric results, error messages needed for remedy, false/unknown safety distinctions.
- **Simplify:** long introductions, repeated eligibility warnings, page-body instructions, trust descriptions, source explanation and noncritical labels.
- **Collapse:** method/formula descriptions, if detailed explanation remains useful, into accessible `details` elements while keeping formulas discoverable.
- **Remove:** redundant static promotional copy, decorative Weather informational cards duplicating the actual interactive forecast and unnecessary “prototype not connected” text from the public Cloudflare MVP.

### Release and reporting
Distinguish `ANALYZED` → `IMPLEMENTED` → `TESTED` → `MERGED` → `CLOUDFLARE DEPLOYED` → `PUBLICLY CERTIFIED`. A false-positive status or missing source must not be dressed up to look successful. Do not deploy, update, pay for or debug Vercel.
