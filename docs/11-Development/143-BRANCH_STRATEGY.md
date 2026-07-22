# 143 — Branch Strategy

| Field | Value |
|---|---|
| Document | Branch Strategy |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `142-GIT_WORKFLOW.md`, `144-COMMIT_CONVENTION.md`, `docs/01-Product/16-RELEASE_PLAN.md` |

---

## 1. Purpose
Defines the branching model: which branches exist, their roles, protection, and how releases are cut — keeping history safe and releases reproducible.

## 2. Scope
Branch types and release/tag mechanics. Workflow: `142`; releases: `docs/01-Product/16`.

## 3. Branch Model
- **`main` (default):** always releasable; protected; changes only via reviewed MRs + passing CI.
- **Feature branches:** `feature/<short-desc>` (or the designated working branch for a task); short-lived; branched from `main`; merged back via MR.
- **Release branches:** `release/vX.Y` cut from `main` for release stabilisation (`docs/01-Product/16`); tagged on release.
- **Hotfix branches:** `hotfix/<desc>` from `main`/release for urgent fixes; merged back with a follow-up.

## 4. Protection Rules
- `main` and `release/*` are protected: no direct pushes; MR + CI + review required.
- Tags for releases are immutable (`vX.Y.Z`), enabling rollback (`docs/04-Architecture/60`).

## 5. Release Flow
1. Cut `release/vX.Y` from `main`; freeze scope.
2. Run full suites (`docs/10-Testing/*`); fix on the release branch (cherry-picked back).
3. Verify exit gate (`docs/01-Product/16`); tag `vX.Y.Z`; deploy.
4. Merge release fixes back to `main`.

## 6. Merged-PR Follow-up Rule
- A merged MR is finished; new work starts fresh from the latest `main` (never stack new commits on already-merged history). Rebase any unmerged commits onto the new base rather than discarding.

## 7. Business Rules
- BR-1 `main` is always releasable and protected.
- BR-2 Feature branches are short-lived; merged via reviewed MRs.
- BR-3 Releases are cut from `main` on a `release/*` branch and tagged immutably.
- BR-4 Hotfixes branch from `main`/release and merge back.
- BR-5 New work starts from latest `main`; no stacking on merged history.

## 8. Edge Cases
Concurrent releases; long-lived features (flags, incremental MRs); reverting a release (roll back to prior tag); conflicting hotfix + release.

## 9. Acceptance Criteria
- [x] Branch types, protection, and release/tag flow defined.
- [x] Merged-PR follow-up rule stated.

## 10. Future Expansion
Trunk-based with feature flags; automated release cutting; environment branches if needed.

## 11. Dependencies
`142`, `144`, `docs/01-Product/16`, `docs/04-Architecture/60`.

## 12. Open Questions
- OQ-1 GitFlow-style vs. trunk-based long term.
- OQ-2 Release cadence.

## 13. Risks
- R-1 Unstable `main`. Mitigation: BR-1 protection + CI.
- R-2 Stacking on merged history. Mitigation: BR-5.
