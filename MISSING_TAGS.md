## Missing Release Tags

The repository's Tags page currently has zero tags and zero releases. This document lists the four tags the release process requires, the commit each should reference, and the reason, per the release-manager review. No tag was created by this review — tag creation is a deliberate manual (or CI-gated) step left to the repository owner.

### Summary

- Tags found in repository: 0
- Tags required: 4
- Tags missing: 4
- Tags created by this review: 0

### Tag 1: v1.0.0-architecture

- Recommended tag: `v1.0.0-architecture`
- Target commit: `ce442bc` (Merge pull request #2 from ihkarise/claude/wise-bloom-care-architecture-epxmco)
- Reason: this is the merge commit that completed the full architecture and product documentation set (docs/00-Vision through docs/ADR) on `main`, which every subsequent sprint report cites as the frozen `v1.0.0-Architecture` baseline. No commit after this one touches `docs/00-Vision` through `docs/13-Future` or `docs/ADR/`.
- Recommended command: `git tag -a v1.0.0-architecture -m "Architecture baseline complete (frozen)" ce442bc`
- Push command: `git push origin v1.0.0-architecture`

### Tag 2: v1.1.0-implementation-plan

- Recommended tag: `v1.1.0-implementation-plan`
- Target commit: `af4d1cb` (Merge pull request #3 from ihkarise/claude/wise-bloom-implementation-plan-9hh6i8)
- Reason: this is the merge commit that completed `docs/20-Implementation/` (strategy, structure, build order, dependencies, milestones, sprint plans 00-08, checklists) on `main`. Every sprint spec references this planning set as fixed and un-rewritten.
- Recommended command: `git tag -a v1.1.0-implementation-plan -m "Implementation plan complete (frozen)" af4d1cb`
- Push command: `git push origin v1.1.0-implementation-plan`

### Tag 3: v1.2.0-sprint-00

- Recommended tag: `v1.2.0-sprint-00`
- Target commit: `ced4644` (Merge pull request #4 from ihkarise/claude/wise-bloom-sprint-00-lgsw94)
- Reason: this is the merge commit that completed Sprint 00 (repository foundation: monorepo, tooling, CI, the two independence boundaries, deployable empty shell) on `main`. It is the base commit every Sprint 01 document (`SPRINT_01_FINAL_CHECKLIST.md`, `SPRINT_01_RELEASE_NOTES.md`, `SPRINT_01_FINAL_REVIEW.md`) already cites as `main @ ced4644 (Sprint 00 merged)`.
- Recommended command: `git tag -a v1.2.0-sprint-00 -m "Sprint 00 complete: repository foundation" ced4644`
- Push command: `git push origin v1.2.0-sprint-00`

### Tag 4: v1.3.0-sprint-01

- Recommended tag: `v1.3.0-sprint-01`
- Target commit: the merge commit created when this PR (`claude/sprint-01-final-cleanup-wt26v3` -> `main`) is merged. Does not exist yet.
- Reason: Sprint 01 (identity, family graph, PregnancyEpisode, timeline foundation, plus the GAS auth-transport patch and this cleanup pass) has not been merged to `main` yet, so there is no commit to tag. Tagging before merge would tag a commit that is not on `main`'s history.
- Recommended command (after merge): `git tag -a v1.3.0-sprint-01 -m "Sprint 01 complete: identity, family graph, pregnancy episode, timeline foundation" <merge-commit-sha>`
- Push command: `git push origin v1.3.0-sprint-01`

### Notes

All four tags are annotated (`-a`) with a message, consistent with marking meaningful project milestones rather than lightweight/throwaway refs. `SPRINT_01_FINAL_CHECKLIST.md` and `SPRINT_01_RELEASE_NOTES.md` previously proposed an inconsistent ad hoc tag, `v0.1.0-sprint-01`; both have been corrected in this same review to reference `v1.3.0-sprint-01` so every document in the repository now points at the same four-tag release sequence. No `git tag` command was executed as part of this review, per instruction — tag creation remains a manual step for the repository owner to perform after this PR merges.
