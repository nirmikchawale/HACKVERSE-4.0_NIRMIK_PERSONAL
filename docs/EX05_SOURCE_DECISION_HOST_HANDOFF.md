# EX-05 — source-status and deterministic-decision explanation

**Feature branch:** \`expansion/ex05-source-decision-intelligence\` (stacked on exact EX-04 commit \`b685a441df5b422df0c50cc0851808d09d116b3b\`).

## Implemented
- Five truthful, independently refreshed state cards: FastAPI; non-government-hosted Open-Meteo model; historical NASA POWER government grid; IMD **not connected**; farmer-declared resource assessment.
- Scope is Jalna, Maharashtra only. Unsupported location clears the Jalna climate receipt; source failures show unavailable rather than invented weather. No browser/mock data in production.
- Explainability component renders **only returned FastAPI \`baseline.constraints\` and \`excluded_changes\`**: blocked/unknown stay distinct, provenance is repeated, confirmation/availability exclusions are named.
- Existing six-screen palette, responsive breakpoints, static source registry, Python engine, editable farmer quantities and true JSON/CSV exports remain intact.

## Hosting transition separation
- A separate \`migration/cloudflare-typography-01\` branch is present with a candidate \`backend/worker.py\`, \`backend/unlockplan/edge.py\`, \`backend/wrangler.jsonc\` and typography work. These are **not merged**, nor has a replacement Cloudflare account/URL or release certification been verified in this branch. Do not configure credentials here or double-deploy.
- This feature branch changes only existing frontend runtime/CSS/tests. When the hosting migration is explicitly selected and review-approved, merge/rebase on the exact certified migration target (not by force-pushing \`main\`).

## Acceptance and certification
- Real response status mapping must preserve \`cached_recent\` vs \`stale_cache\`, IMD must never imply an observed warning without authorized API, unknown must never be rounded into feasible.
- Browser tests cover connected sources, unavailable sources, unsupported place, unknown+blocked constraints, excluded optional resources, and input-change invalidation.
- Required GitHub jobs: \`TypeScript, audit, build and Chromium\`, \`Backend tests + real six-route/browser smoke\` on exact SHA; all Python source/manifest tests unchanged.
- Exact-preview authenticated desktop/mobile, real API POST tests, dependency review, production alias/SHA identity, branch protection and distinct user approval remain mandatory for production release.

**Status markers:** committed ≠ verified ≠ deployed. A GitHub Actions green build is not a certificate for a new hosting provider.
