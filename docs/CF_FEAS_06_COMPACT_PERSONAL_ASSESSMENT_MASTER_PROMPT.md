# CF-FEAS-06 — Compact Farmer-Specific Assessment
## Comprehensive optimized master prompt, source-of-truth and release acceptance

**Project:** HACKVERSE 4.0 Agri Foresight / Jalna, Maharashtra  
**Page:** 04 — Feasibility analysis / *Your farm-specific assessment* and every result/readiness card below it  
**Public target:** sole Cloudflare Worker at https://agri-foresight.nirmikchawale1.workers.dev  
**Repository:** nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL, protected `main`  
**Separate preserved module:** CF-FEAS-05 Data-backed Scenario Lab, 100 *configured* cases, not a personal assessment.

### Execution role and mission

Act as product designer, accessibility engineer, frontend and Python-integrity reviewer, responsive layout tester, protected-main release engineer and independent production verifier. Inspect current source before editing. Take the two supplied screenshots as the principal *anti-clutter* defect specification. Remove permanently empty metrics, unused illustrative theory, redundant readiness cards, duplicate "why" panels, multiple explanatory banners and non-actionable content. Reallocate the recovered vertical space to actual farmer workflow. Avoid any "redesign" that merely renames tall static cards or replaces them with non-clickable placeholders.

The outcome is a **progressive assessment console**:

- **Before evaluation:** show two genuine navigation controls — **Planning window** (Weather & Windows) and **Resource inputs** (Farm Resources); an operational **Evaluate using FastAPI** action; a compact result state; and one optional explanatory/source disclosure. Keep a meaningful validation error visible if evaluation cannot proceed. Hide **Clear result** until there is something to clear.
- **After real evaluation:** reveal four **compact actionable computed metrics** — planned quantity, confirmed baseline capacity, capacity shortfall, time slack. Each button navigates to the relevant editable input; the values must originate from the *validated server response* and have explicit abstract handling-unit/hour semantics. There are no placeholder statistics or invented benefits.
- **Explanation when requested:** offer one expandable **Why this result?** area showing exactly the backend's pass/blocked/unknown constraints and a small unresolved-count label. Retain the full original API-native provenance/diagnostic receipts, but place them behind the same disclosure rather than permanently displaying duplicate theory. Keep conditional **Edit resources**, **Explore permitted changes**, and **View summary** actions working.
- **Conditional source details:** a keyboard-accessible collapsed native disclosure with the truthful caveat: FastAPI checks farmer-declared capacities, deadlines and readiness; results do not certify agronomic/crop safety, model-forecast reliability or verified real-world inventories. Preserve source and evaluated input state.
- **Minimal scope:** do not change any backend evaluator, Python schema, Farmer Resources declaration, weather model, historical NASA source, location scope, 100-case Scenario Lab, Page 05 conditional packages, Page 06 summary, release metadata or language behavior. Keep all historical DOM IDs used by integrated features and retain the existing glassmorphism / teal design tokens across themes.

### Component and state contract

| Element | Idle | Valid API evaluation | Error / data changed |
|---|---|---|---|
| `#resultTitle`, `#resultReason` | Not evaluated + next-step prompt | Real verified server status + its source message | Not evaluated + truthful error |
| `#feasDeadline` and `#feasResource` | Clickable, show actual saved declaration or missing value | Same, still navigable | Same |
| `#runAssessment` | Clickable, validates missing inputs | Can re-run, no fabricated cache | Clickable for retry |
| `#resetAssessment` | Hidden | Visible | Visible when an error exists, hidden again after clear |
| `#farmResultMetrics` | Hidden | 4 clickable backend-only metrics | Hidden immediately when inputs are invalidated |
| `#farmResultPanel` | Hidden | A single expandable explanation and next-step controls | Hidden |
| `#constraintList`, `#decisionDiagnostics` | No visible explanatory placeholders | Actual backend constraints and full receipt, behind disclosure | Cleared/hidden |
| `#resultReadiness`, `#engineIndicator` | Grounded status inside scope disclosure | Original source-integrity wording | Never claim verified after reset |

Preserve `connected.js` as authoritative for FastAPI personal evaluation. Do not call any local teaching calculator to fill personal metrics. The existing inline fallbacks in `frontend/index.html` must not be allowed to masquerade as server-verified results. Successful response must pass schema checking with real `baseline`, `constraints`, `excluded_changes`, `packages` and `unit: handling_unit`.

### Responsive and accessibility acceptance

- Native buttons, focusable `<summary>` elements, meaningful labels, `aria-live` errors, `aria-busy` during evaluation; no fake buttons or CSS-only onclick.
- All primary actions comfortably usable at 390px mobile, 768px tablet, 1024px desktop and 1440px desktop; metrics reflow to two columns on mobile, with no horizontal scroll, clipping or overlapping input summaries.
- All theme tokens remain inherited; text and focus controls are readable in light/dark, without adding external font assets or changing six-page global CSS.
- Preserve translated existing data-i18n labels where available. Numeric source facts must remain identical regardless of language.
- Must not send resource submissions when user merely opens a disclosure, navigates, searches examples or examines a computed metric.

### Required independent validation and release

1. Record exact base main SHA and touched paths. Change as few files as possible; isolate UI/JS/CSS and browser tests.
2. B-01: run real build, TypeScript, dependency audit and complete Playwright frontend smoke; ensure idle sections are actually hidden and keyboard links navigate to Pages 02 and 03; no mobile overflow.
3. B-03: start a genuine FastAPI/Uvicorn process. Enter a valid future test deadline and resource declaration; click the real evaluation; verify genuine blocked/unknown/feasible state, computed shortfall and visible metrics, collapsed then opened backend explanation and action navigation; clear result and verify no stale values remain. No mocked farmer responses for production certification.
4. Cloudflare Python Worker local certifications: check same-origin API, build and source-provenance semantics, no dummy data.
5. Before merging, verify latest protected `main` still contains unrelated Weather/Resources design changes. Merge exact checked head only when all required gates pass, never force or bypass.
6. Independently verify public Cloudflare `/_release.json` against exact deployed commit or a verified descendant, and shipped JS/CSS against the new assessment. Exercise real browser desktop and mobile. Record code merged separately from **public verified**. If Cloudflare doesn't advance, do not claim it has.
7. Keep release evidence with PR, CI links and production read-only certificate. Never edit legacy Vercel hosting.

**Hard exclusions:** no optimistic success probability, field-safety rating, agricultural guarantee, fake government measurements, unauthorized farmer records, invented form values, unsupported crops, or background/autonomous deployment claims not validated by actual tools.
