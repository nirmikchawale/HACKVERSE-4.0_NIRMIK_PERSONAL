# CF-RES-03 — Farm Resources: Default Optional Change + Honest Preparedness Pathway

**Target:** HACKVERSE 4.0 / Agri Foresight; Page 03 only.  
**Hosting:** the existing Git-connected Cloudflare Worker \`agri-foresight\`, clean host \`https://agri-foresight.nirmikchawale1.workers.dev/\`. No separate deployment, domain, paid service, or work on retired hosting.  
**Status:** Implementation candidate; production certification is independent and must be evidenced.

## Optimized execution prompt

> Act as the principal accessibility-focused vanilla TypeScript/HTML engineer, farm-planning data-quality reviewer, Playwright quality engineer, and Cloudflare-only release auditor. Inspect the current \`main\` branch and open release PRs, preserve existing backend semantics, implement the minimal Page 03 improvement, test exact candidate SHA, merge only after protected-branch checks pass, and independently verify the existing Cloudflare clean URL is serving the exact merged SHA and live same-origin API. Report implementation, testing, merge, deployment and certification as distinct statuses.
>
> ### Inputs and intended change
> - User-supplied images show the Page 03 *Additional changes you permit* editor open with **one initial row**: **Add confirmed capacity**, empty positive amount, empty unique ID, **Unknown** availability. A visible row is a draft, never evidence of confirmed capacity or a completed action.
> - Preserve editable additional rows, types, removal, availability states, full API validation, persistence, and maximum-option limits. Previous explicit removal must stay removed after refresh.
> - Replace the small, high-empty-space Page 03 preparedness column with a readable, accessible, mobile-responsive informational decision tree and truthful summary.
> - Retain the six existing pages, approved type scale/sidebar, live weather/data provenance, and Python FastAPI decision engine. No new farm scenario, no backend feasibility reimplementation.

## Decision tree

\`\`\`text
PAGE 03 / Farm Resources
├── 01 Planned work
│   ├── planned target (handling units): blank until farmer types
│   ├── reported available capacity (same units): blank until farmer types
│   ├── estimated work hours: blank until farmer types
│   └── explicit farmer declaration (checked or not)
├── 02 Candidate deadline
│   ├── saved farmer-selected IST date/time → recorded, NOT rain-safe
│   └── missing/unsaved → ask farmer to select and save
├── 03 Site readiness
│   ├── yes → farmer-reported yes, NOT independently verified
│   ├── no → farmer-reported blocker
│   └── unknown → unresolved, never treated as yes or no
├── 04 Descriptive readiness diagnostics
│   ├── number of entries provided out of six → completeness, not risk
│   ├── coverage min(capacity ÷ target, 1) × 100%, only if target > 0
│   └── shortfall max(target − capacity, 0) handling units
├── 05 Next missing-input action
│   └── accessible button focuses the next field or opens deadline/assessment page
└── 06 Server-authoritative feasibility
    ├── empty starter alternative → OMIT from POST, remain unknown
    ├── partial alternative → prompt for valid positive amount/unique resource ID
    ├── completed declared alternative → preserve availability classification
    └── POST /api/evaluate → display server result, do not fabricate outcome
\`\`\`

## Statistical and evidence integrity

The *coverage ratio* and *shortfall* are transparent deterministic arithmetic derived from a single user's form, not sample-based inference, predicted outcomes, or a measured probability. Cap coverage at 100%; show zero capacity as 0% with a positive target; for zero target suppress the ratio because the denominator is zero. Nonfinite, blank, or invalid input is unknown, never assumed to be zero. Input completeness counts six entries (target, capacity, hours, saved deadline, explicitly yes/no site readiness, checkbox declaration) without pretending that a complete form equals feasible/safe farming. Weather/model risk, actual resource arrival, worker presence, storage, transport and crop safety are not independently verified. Never assign a favorable readiness state or invented farmer quantities merely to fill a visual area.

## UI acceptance criteria

- First navigation to Page 03 shows one working optional-change editor row with type \`add_capacity\`, empty amount/ID, and \`unknown\`; the existing **Add an option** control still adds distinct options.
- The untouched row does not obstruct \`POST /api/evaluate\` and is not included as a server \`change\`. If the farmer edits only some fields, existing validation rejects an incomplete change rather than silently discarding it.
- Removing the sole row and refreshing preserves the explicit empty state. Existing saved populated options remain unchanged.
- Quantity, capacity, and hours update derived ratios without requiring a page refresh; a saved deadline and a declared site state update the pathway. Statuses never imply independently verified readiness.
- Tree buttons and next-action button actually navigate/focus; keyboard focus visibly indicated.
- Confirm Page 03 at 390 px and desktop widths; no sideways scroll or overlapping cards, retain dark/light themes and existing typography, six routes and navigation.
- Preserve translations in English, Marathi, and Hindi for new labels; no exposed synthetic test data or misleading scientific claims.

## Verification and release requirements

1. Inspect changes for regressions to preexisting source and 100-case Feasibility Explorer.
2. Run new Playwright browser tests for initial row, 75% capacity coverage + 20-unit shortfall in a **clearly isolated fixture**, deliberate removal/persistence, actual API payload omitting untouched row, and mobile tree navigation. Fixture values are **tests only**, not production defaults.
3. Run frontend typecheck, node tests, full applicable Playwright suite, Python tests/API integration and genuine Cloudflare local Worker runtime gates as configured by the project. Check GitHub Actions for the exact PR head SHA.
4. Observe branch protection; do not force-push \`main\`. Merge by approved GitHub PR only when the necessary release checks pass. The user's request authorizes this feature but never authorizes falsifying release gate evidence.
5. Independently check the clean Cloudflare \`/_release.json\` SHA equals the merged \`main\` SHA, \`/api/health\`, authentic forecast or clearly degraded state, and Page 03 desktop/mobile default editor + computations using a real browser on **the deployed host**, before using **PUBLICLY VERIFIED**.
6. If browser, remote build or API evidence is unavailable, leave precise status **COMMITTED**, **PR OPEN**, **MERGED**, or **DEPLOYMENT UNVERIFIED**, rather than making a success claim.
