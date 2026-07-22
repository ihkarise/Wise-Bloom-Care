# 142 — Git Workflow

| Field | Value |
|---|---|
| Document | Git Workflow |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `143-BRANCH_STRATEGY.md`, `144-COMMIT_CONVENTION.md`, `145-PR_TEMPLATE.md`, `docs/04-Architecture/60-DEPLOYMENT.md` |

---

## 1. Purpose
Defines the day-to-day Git workflow: how work flows from branch to review to merge to release, on the private GitLab repository, safely and traceably.

## 2. Scope
Workflow mechanics. Branch model: `143`; commit format: `144`; PR/MR template: `145`.

## 3. Repository
- Private GitLab repository (`docs/00-Vision` — private repo principle).
- Contains `docs/`, `knowledge-base/`, and (later) `apps/`, `packages/` (`docs/04-Architecture/59`).

## 4. Workflow
1. Sync the default branch; create a feature branch (`143`).
2. Commit in small, focused units using the commit convention (`144`).
3. Push; open a Merge Request (MR/PR) with the template (`145`).
4. CI runs (lint, type-check, tests, security/a11y where applicable).
5. Review + Definition of Done (`146`); address feedback.
6. Merge (squash or merge per policy); delete the branch.
7. Release from the release branch/tag (`143`, `docs/01-Product/16`).

## 5. Principles
- Small, reviewable changes; avoid long-lived divergent branches.
- Never commit secrets/PHI; secret-scanning encouraged (`docs/09-Security/124`).
- Keep history clean and meaningful (`144`).
- Protected default/release branches (no direct pushes; MR + CI required).

## 6. Working With This Task's Branch
- Development for this documentation work occurs on the designated feature branch and is pushed there; releases/tags follow the branch strategy (`143`).

## 7. Business Rules
- BR-1 All changes land via reviewed MRs; no direct pushes to protected branches.
- BR-2 CI (lint/type/test + safety where relevant) must pass before merge.
- BR-3 No secrets/PHI committed; scanning encouraged.
- BR-4 Commits follow the convention (`144`); history kept meaningful.
- BR-5 Feature branches are short-lived and deleted after merge.

## 8. Edge Cases
Hotfix branches (expedited MR); merge conflicts (rebase/merge per policy); reverting a bad merge (revert commit + follow-up); large features (feature branch + incremental MRs behind flags).

## 9. Acceptance Criteria
- [x] Branch→review→merge→release flow defined.
- [x] Protected branches + CI-before-merge + no-secrets rules.
- [x] Links to branch/commit/PR conventions.

## 10. Future Expansion
Trunk-based development with feature flags, automated release pipelines, signed commits, CODEOWNERS gating.

## 11. Dependencies
`143`, `144`, `145`, `146`, `docs/04-Architecture/60`, `docs/09-Security/124`.

## 12. Open Questions
- OQ-1 Squash vs. merge-commit policy.
- OQ-2 CI provider config (GitLab CI).

## 13. Risks
- R-1 Unreviewed/insecure merges. Mitigation: BR-1/BR-2 protected + CI.
- R-2 Secret leakage via commits. Mitigation: BR-3 + scanning.
