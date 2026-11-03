# Agri Foresight — Hobby Controlled-Release Operating Procedure

**Status:** Policy prepared on `ops/hobby-release-budget-01`; do not call it active until the exact policy commit is merged, deployed and independently verified. This runbook preserves the scientific and UI release gates, avoids new paid plans and requires no Vercel secrets.

## Source of truth
- Project: `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL`
- Public domain: https://agri-foresight.vercel.app/
- Protected production branch: `main`.
- Required GitHub checks: `TypeScript, audit, build and Chromium` and `Backend tests + real six-route/browser smoke`.
- At initiation, `main` was `410f8a522ca8cc8bf4df6dac03aed93bc42a2e89`; exact READY production was `392e8bc5d2cded793756df66ab28aef924194c55`. Never treat a merge as deployment; recheck before action.
- PR #15 at `52f3be7cc3da84751979ef0fc64e9e03cdb36090` passed both checks but lacked an exact Vercel preview. Do not merge it until preview certification.
- A direct Vercel API deployment attempt returned HTTP 402 `api-deployments-free-per-day` with an approximately 24-hour retry instruction. No quota circumvention, upgrade or billing change is authorized.

## Correct lever: prevent automatic Git deployments

Vercel's official `git.deploymentEnabled` setting accepts minimatch branch identifiers, and if a branch matches more than one rule any matching `true` permits deployment.

```json
"git": {
  "deploymentEnabled": {
    "**": false,
    "main": true,
    "release/cert-*": true
  }
}
```

**Default-deny** for general engineering branches, **allow** protected `main` for production, and **allow** a narrow manually approved `release/cert-*` preview branch per certified candidate. Use simple single-segment names such as `release/cert-pr15`. Do not push routine work to a `release/` branch. Do not disable Preview deployments globally: that would make release certification impossible.

Important: This rule does not change a past deployment or retroactively retry a quota-blocked SHA. If its applicability to Git integration changes, verify against live Vercel documentation and an actual controlled candidate, without treating GitHub CI PASS as a Vercel PASS.

**Do not use Vercel Ignored Build Step as a quota solution.** Vercel documents that builds canceled by that feature still count towards deployment quota; it is the wrong lever.

## 20-minute bounded engineering work units

1. **HBY-01 — inspect (<=10 min):** Read current `main`, PRs, last READY production SHA, project connection, branch protection, source and exact CI requirements.
2. **HBY-02 — policy/test (<=20 min):** Edit only `vercel.json`, add no-dependency `frontend/tests/deployment-policy.test.mjs` and run existing required CI. Do not modify the FastAPI engine or UI.
3. **HBY-03 — source authority (<=10 min):** Inspect canonical Vercel Git configuration; reject ineffective ignored-build settings, unbounded branch allowlists and new billing.
4. **HBY-04 — pending public baseline (<=20 min):** When the official quota permits, deploy the already merged `410f8a52` exactly once under the existing project. Certify exact `main` SHA, actual frontend HTML, NASA historical data, Open-Meteo attribution, genuine POST evaluate/compare/replan and mobile/desktop journeys. If the platform remains blocked, record BLOCKED, do not merge newer changes.
5. **HBY-05 — policy preview (<=20 min):** After both required exact-head checks PASS, create ONE Vercel-eligible `release/cert-hby01` branch pointing to the policy PR's **exact commit**, without adding content to that SHA. Verify its READY deployment, exact SHA, complete six-page UI, FastAPI routes and logo. If the preview is unavailable, do not merge.
6. **HBY-06 — guarded policy release (<=20 min):** Merge policy only with protected main and preview PASS, allow the normal single Vercel production build, verify public exact merge SHA and expected branch gating. No duplicate manual production deployment.
7. **HBY-07 — PR #15 exact preview (<=20 min):** After resolving base conflicts if any and re-running mandatory checks, create `release/cert-pr15` pointing to **exact final PR #15 HEAD**. Verify READY preview SHA and loading-state browser tests. Do not infer preview passing from earlier local tests.
8. **HBY-08 — guarded PR #15 release (<=20 min):** Merge through branch protection, verify final production SHA, actual browser interactions, real provider errors/empty states and logs; archive certificate.
9. **HBY-09 — steady state (<=20 min):** Build/test on ordinary feature branches with GitHub Actions and local FastAPI; use one certified preview per candidate; prefer one production merge per cohesive feature batch. Keep a budget reserve for a hotfix.

If any step exceeds 20 minutes, stop the slice, record checkpoint and continue in another <=20-minute slice; queue time or provider outages are not excuses to bypass scientific or release requirements.

## Release decision matrix

| Situation | Required response |
| --- | --- |
| 2/2 GitHub PASS, no exact Vercel preview | HOLD (no merge) |
| READY preview, exact SHA mismatch | HOLD |
| READY preview, actual API POST fails | HOLD |
| Quota 402, access denied or payment required | HOLD and resume only via permitted plan limits; never evade |
| All gates PASS | Protected merge, then separately certify READY exact production |
| Production SHA lags `main` | Report DEPLOYMENT PENDING/BLOCKED; do not claim PUBLIC PASS |
| Weather/official data unavailable | Show verified unavailable status; no synthetic replacement |
| Failed rollout | Stop additional merges; use only reviewed, authorized rollback, then recertify |

## Capacity budgeting

The Hobby limit is a hard ceiling, not an allowance that can be exceeded. Do not generate multiple speculative Vercel previews for every small commit. Leave reasonable spare capacity for hotfixes, deployment retries and judge-day requirements. GitHub local/CI builds do **not** require Vercel deployments. A release SHA is immutable: do not "fix" the same SHA by editing code without producing a new one and repeating exact-head certification.

## Security and privacy

Do not create plaintext Vercel tokens, publish environment files, disable GitHub branch protection, bypass required checks, activate paid services, or publish user-submitted farm information during testing. Browser fixtures use synthetic values **only in tests**, never in production UI. Weather and NASA government historical responses remain source-separated and timestamped.

## Primary official references

- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/project-configuration/project-settings (why ignored builds still count)
- https://vercel.com/docs/git
- https://vercel.com/docs/deployments/environments
