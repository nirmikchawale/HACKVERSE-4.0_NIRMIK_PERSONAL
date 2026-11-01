# Agri Foresight — Cloudflare Public Release, Pending Feature Consolidation and Material 3 Design
**Owner's request:** 2026-11-01. **Branch:** `migration/cloudflare-typography-01` (**PR #18, draft until public certificate**).
**Existing working baseline:** protected `main` at `410f8a522ca8cc8bf4df6dac03aed93bc42a2e89`; current Vercel public site has been verified on `392e8bc5d2cded793756df66ab28aef924194c55`. Do not equate merged Git SHA with production SHA.

## Mission — Optimized master prompt

<role>
You are a principal agricultural-source auditor, full-stack TypeScript/Python engineer, mobile design-system specialist, cloud-edge platform engineer, GitHub branch-protection release controller and independent QA auditor.
</role>
<goal>
Complete one six-page Agri Foresight application, preserving Tanisha's design and the user's gold-white circular emblem. Migrate **the full frontend and real FastAPI calculation engine** from quota-constrained Vercel to a user-owned Cloudflare Worker Free account; connect a user-owned domain after rights/registrar authorization; consolidate completed real-data expansions; enforce Android Material 3 sizing and Apple-system typography. Never serve placeholders or synthetic production records.
</goal>
<context>
The Cloudflare candidate already uses Python Worker ASGI and Vite static assets on one origin; local Worker CI has successfully retrieved real Open-Meteo model hours and NASA POWER historical gridded records, and has evaluated actual FastAPI cases. Current public site on Vercel remains rollback-only until certified Cloudflare alternative is available. Cloudflare dashboard account exists in the user's browser; the ChatGPT Browser connection in this chat is read-only and there is no connected Cloudflare deployment tool. A dashboard session does **not** grant write access from ChatGPT. Respect this limitation.
</context>
<nonnegotiables>
1. Original deterministic resource feasibility and comparison remain server-authoritative. No fabricated soil, safety cutoff, warning, crop-safety advice, farmer inventory, future government forecast or unverified predicted score. Real farmer declarations are labeled unverified; scientific sources distinguish NASA historical from Open-Meteo external forecast.
2. No unlicensed Apple SF Pro files or font redistribution. Apple devices resolve their own system font; Android devices use Roboto, and other environments have legally licensed Inter fallback.
3. Material 3 standard type roles: headline 32/40, 28/36; title 22/28, 16/24, 14/20; body 16/24, 14/20, 12/16; labels 14/20, 12/16, 11/16. Web equivalents use rem so browser text scaling continues to work.
4. Cloudflare-style sidebar = independently implemented neutral vertical navigation, meaningful information groups, actual Ctrl/⌘+K quick search, six existing functional pages and accessible mobile navbar. Do not import Cloudflare's trademarks or copy its source.
5. No payment, no domain purchase, no changes to Vercel subscription, no OAuth/API tokens in chat, Git, CSS/JS, actions logs or docs. No bypass of quotas or release checks.
6. Do not merge the migration or deactivate Vercel unless public Cloudflare exact-SHA and all route/browser/source checks PASS.
</nonnegotiables>
<workflow>
A. VERIFY latest GitHub PR/branch SHA, provider limits, account access permissions and actual source availability.
B. AUDIT old Phase 1/2 and six-page Tanisha UI; preserve content correctness, location boundary and tests.
C. INTEGRATE only relevant PRs with test evidence: PR #15 (ECC/Dqnamo action status), PR #16 (real forecast windows and NASA CSV) into migration. PR #17's Vercel-only throttling remains separate until final cutover. Do not auto-merge unrelated stale drafts.
D. STANDARDIZE CSS and sidebar. Ensure every search, navigation, refresh, evaluation, export, comparison and assistant control has a real UI outcome. Run Playwright across desktop/mobile and English/Marathi/Hindi.
E. BUILD the real Python Worker, authenticate normal data access, then independently certify GET/POST.
F. DEPLOY only via user-authorized Cloudflare integration, with Git preview first; record exact URL, deployment ID/SHA, worker CPU/memory, errors and provenance.
G. GUARDED MERGE only after required GitHub PASS and Cloudflare preview PASS; verify new public release and post-release smoke. Keep Vercel rollback until explicitly retired.
H. REPORT separate CREATED / TESTED / MERGED / DEPLOYED / PUBLICLY CERTIFIED / BLOCKED statuses and a single next action.
</workflow>

## Actual delivered additions in the migration branch
- `backend/unlockplan/edge.py`, `worker.py`, `pyproject.toml`, `wrangler.jsonc`: FastAPI on Cloudflare Pyodide, real asynchronous source retrieval, secure source allowlist, validated timestamps, zero fake fallback, per-isolate temporary cache.
- `frontend/index.html`: existing six pages, preserved current logo, functional sidebar search and internal keyboard navigation.
- `frontend/public/agri-typography.css`: Material 3 universal scale and native Apple/Android OS typography fallback.
- `frontend/public/agri-sidebar.css`: Cloudflare-style neutral layout, icon paths, selection state, grouped navigation and dark theme.
- `frontend/public/connected.js`: PR #15 real action busy states and PR #16 source-native forecast window calculation and NASA verified CSV export.
- `frontend/public/evidence-04.css`: source-backed forecast summaries, transparent null coverage and responsive layout.
- `frontend/tests/browser/*`: browser evidence, six-page navigation, CSS/accessibility, old engine and real API regression.
- Existing logo `frontend/public/agri-foresight-logo.webp` stays **unchanged**.

## Exact pending GitHub PR decision register
| PR | Role | Action |
|---|---|---|
| #18 | Cloudflare full-stack + typography + consolidated feature candidate | Main migration. Draft until deployed Cloudflare preview and public cert |
| #15 | ECC-informed loading status / action feedback | Code and tests incorporated into PR #18; do not merge separately into Vercel without exact release gates |
| #16 | Forecast horizon summaries, NASA CSV and evidence docs | Code and tests incorporated into PR #18; retain independent PR as source history until final release |
| #17 | Vercel Hobby deployment-budget policy | Separate fallback only; do not add Vercel-specific policy into Cloudflare runtime |
| #2–#8 | Earlier historical/obsolete drafts | Audit against exact merged main; do not blindly merge, overwrite or delete user work |

## 20-minute atomic rollout units
| Phase | Max active min | Artifact and PASS gate |
|---|---:|---|
| CFM-01 | 10 | Confirm Cloudflare account in user browser (read-only), repo branch, new host not yet live |
| CFM-02 | 20 | Consolidate PR #15/#16 on migration branch; compile and browser test every feature |
| CFM-03 | 20 | Apply Material 3 text roles across body/headings/cards/captions/forms/graphs/mobile |
| CFM-04 | 20 | Update Cloudflare-inspired sidebar with real search and six reachable pages |
| CFM-05 | 20 | Real Cloudflare Python Worker local smoke, 72 model hours and 14 historical days where available, plus negative 422 cases |
| CFM-06 | 15 | Complete GitHub 3/3 exact-commit checks, inspect action logs and fix only reproduced failures |
| CFM-07 | 10 | Owner links Cloudflare Free Workers & Pages to **this** GitHub repository, with exact build/deploy config |
| CFM-08 | 20 | Deploy one Cloudflare candidate preview on `migration/cloudflare-typography-01` (or exact HEAD) and record actual generated URL |
| CFM-09 | 20 | Remote smoke on actual URL `EDGE_URL=https://... REQUIRE_LIVE_CLIMATE=1 node backend/scripts/cloudflare-smoke.mjs`; inspect Worker CPU/memory and preview browser |
| CFM-10 | 20 | Protected PR #18 merge only when Cloudflare Free preview and GitHub gates PASS, then deploy main |
| CFM-11 | 20 | Independently certify live main SHA/URL and source freshness; retain Vercel rollback |
| CFM-12 | 10 | If the owner **owns** `agriforesight.com` or `agriforesight.io`, attach it via Cloudflare Worker Domains; verify DNS and TLS before announcing it as canonical |
| CFM-13 | 15 | Review pending drafts and remove only truly obsolete PRs with owner approval; never destroy source history |

**Cloudflare Free runtime warning:** 100,000 Worker requests/day, 10 ms CPU/request and 128 MiB memory are bounded limits. Cold-start optimization may help but passing local Pyodide tests does NOT certify free-plan CPU. Test this on the actual hosting account. NASA is gridded historical US government data; Open-Meteo is non-government-hosted model forecast. No direct IMD operational API access is established.

## One-time user-authorized Cloudflare native Git integration (recommended; NO TOKEN IN CHAT)

Cloudflare's Workers Builds GitHub integration can build and deploy automatically with Cloudflare-managed authentication.
Navigate **Workers & Pages → Create application → GitHub**, authorize only the repository `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL`, set Worker name exactly `agri-foresight`, and use these build settings:

| Field | Enter exactly |
|---|---|
| Root directory | `/` (repository root) |
| Git repository | `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL` |
| Production branch for first isolated candidate | `migration/cloudflare-typography-01`; switch to protected `main` only after exact SHA preview certification |
| Build command | `cd frontend && npm install && npm run build` |
| Deploy command | `uv run pywrangler deploy` |
| Preview command (if offered) | `uv run pywrangler preview` |
| Project config | `wrangler.jsonc` root (existing; do not autogenerate/overwrite) |
| Billing | Free, NO upgrade |

*This is a user-side UI operation not yet performed in this chat.* After Save and Deploy, copy the actual Worker deployment URL and build log back here for independent certification; no secret is necessary to share. If the integration requires `SKIP_DEPENDENCY_INSTALL=1`, set it only after reading the real build failure and retesting, not preemptively. Cloudflare's build image contains `uv`, Python and Node. Never promise a workers.dev URL from the name alone because Cloudflare assigns the account suffix.

Official:
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://developers.cloudflare.com/workers/languages/python/packages/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developer.android.com/develop/ui/compose/designsystems/material3

## Domain and security policy

`agriforesight.com` or `agriforesight.io` is a **requested candidate**, not proof of domain registration/ownership or present public availability. Registering a Cloudflare Free account does not register a .com or .io domain. If neither is owned, the new certified URL is the one Cloudflare assigns under `workers.dev`. Paid domain purchase requires explicit price and separate approval. A user-owned hostname can be attached via Workers & Pages → Worker → Settings → Domains & Routes → Add Custom Domain after zone verification. Do not claim a new live URL before a real HTTP GET/POST succeeds.

## Publication certificate format

| Requirement | Evidence | PASS / PARTIAL / BLOCKED |
|---|---|---|
| GitHub exact HEAD & protected branch | PR #18 sha, 3 check run URLs | |
| Cloudflare preview exact SHA | Deployment URL + build ID + code revision | |
| Android/Apple typography | Computed 12/14/16/22/28/32 rem-scale and screenshot tests | |
| Sidebar | Search keyboard, six destinations and mobile nav | |
| Python engine | Evaluate / compare / replan 200/422 from live worker | |
| Open-Meteo | Real future 72-hour model, metadata, no fabricated fallback | |
| NASA POWER | Real 14-day historical records with date/units/source | |
| Security & limits | CPU <=10ms in Free, memory, response sizes, source allowlist | |
| Domain | Ownership, Cloudflare worker routing, HTTPS 200 | |
| Public release | new origin GET plus API POST/negative, exact SHA | |

**Do not mark COMPLETED** until every applicable gate is evidenced, and never disable the old working Vercel site before an independently certified replacement exists.
