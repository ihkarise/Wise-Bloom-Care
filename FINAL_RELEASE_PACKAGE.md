## Sprint 01 Final Release Package

**Decision: GO WITH NOTES**

- Sprint: 01 — Identity, family graph, PregnancyEpisode, timeline foundation
- Branch reviewed: `claude/sprint-01-final-cleanup-wt26v3`
- Base: `main` @ `ced4644` (Sprint 00 merged)
- Review type: release-manager review — repository hygiene and process correction only
- Validation method: GitHub Actions (this environment has no terminal/shell access)

### Executive Summary

Sprint 01 delivers authentication, the family/maternal record graph, PregnancyEpisode, the append-only timeline read side, content typing, family-scope RBAC, audit wiring, and the corresponding frontend, on top of Sprint 00's foundation. The branch also carries an already-shipped GAS auth-transport patch and a cleanup pass that fixed eight objective defects (broken CI gate, incorrect documentation, a broken script, dead code, a stale README). The branch merges cleanly into `main` with no conflicts, and the latest GitHub Actions run on its head commit is green. Eleven follow-up items are filed as GitHub issues (#5-#15) rather than fixed in this sprint, all documented and triaged. No architecture or implementation-planning document was modified anywhere in the branch's history. This release-manager pass corrected one documentation inconsistency (a stale proposed tag name) and produced this package plus `ISSUE_REVIEW.md` and `MISSING_TAGS.md`; it did not touch application code, tests, CI configuration, or the frozen architecture.

### Repository Health

The working tree is clean. `git`-level comparison of `main...claude/sprint-01-final-cleanup-wt26v3` shows 19 commits (23+ after this review's own documentation commits) and 96 files changed, and GitHub reports the branch as "Able to merge" with no conflicts. No accidental files, no generated build artifacts, no debug logging beyond the two deliberate structured-log sinks, and no commented-out code were found in the diff or in the repository root listing. `gitleaks` secret scanning is a required step in CI and reports no leaks on the branch's runs; the only credential-shaped strings in the repository are synthetic test fixtures and a `.clasp.json.example` placeholder template. Root-level hygiene files (`.gitignore`, `.prettierignore`, `.lintstagedrc.json`, `.nvmrc`) are present and consistent with the tooling described in the README.

### Architecture Compliance

`docs/04-Architecture/` was not modified anywhere in the 19 Sprint 01 commits — confirmed by inspecting the full commit-by-commit diff, which touches only root-level release documents, `.github/workflows/ci.yml`, `apps/`, and `packages/config`. The two independence boundaries (API contract and Storage Adapter) remain lint-enforced with their own meta-tests (`no-sheets-outside-adapter`, `no-network-outside-api`), per the repository's own `SPRINT_01_FINAL_REVIEW.md` section 3. The one domain-model addition this sprint made (`Event.corrects_event_id`) is a direct, cited consequence of `docs/05-Data/77` §5 rather than a new architectural decision, and it is documented as such in `SPRINT_01_COMPLETION_REPORT.md`. No ADR was added or modified.

### Implementation Compliance

`docs/20-Implementation/` was not modified anywhere in the branch's history — same diff-based verification as above. Sprint 01 implements `docs/20-Implementation/206-SPRINT_01.md` against the frozen `v1.0.0-Architecture` baseline, and `SPRINT_01_COMPLETION_REPORT.md` maps each of the spec's acceptance criteria to at least one passing automated test. No Sprint 02 scope (per `docs/20-Implementation/207-SPRINT_02.md`) was started; all out-of-scope items are queued as GitHub issues rather than implemented.

### Testing Summary

The repository's own reports state 161 tests across 26 files, all passing, none skipped (backend 119, web 28, cross-app integrity 5, boundary meta-tests 9). This total is corroborated by the CI job log on the latest successful GitHub Actions run. No `.skip`, `.only`, `.todo`, `xit`, or `xdescribe` was found anywhere in the repository. Coverage is by acceptance-criterion traceability rather than a line-coverage metric — this gap is already tracked as issue #11.

### CI Summary

**Validation based on the latest successful GitHub Actions run** (this review environment has no terminal/shell access, so no `pnpm` command was executed locally by this reviewer). The most recent run on the pre-existing Sprint 01 code (commit `393fe98`, CI run #13) shows **Success** for both jobs: "lint · format · type-check · test · build" and "secret scanning" (gitleaks: no leaks detected). `.github/workflows/ci.yml` runs, in order: install (frozen lockfile) -> lint -> format check -> type-check -> test -> build, plus a parallel secret-scanning job. `pnpm format:check` is present as its own step between lint and type-check, addressing the gap that let an unformatted file land on a green build earlier in the sprint. This review's own documentation-only commits triggered several CI runs; three failed `format:check` because three newly-added markdown files used table formatting that did not match Prettier's output, and were corrected in follow-up commits on this same branch — a full log of that correction is in the branch's commit history. Two of the earlier runs in the sequence also show as cancelled, which is the expected effect of the workflow's `concurrency: cancel-in-progress` setting superseding in-flight runs on a new push, not a failure.

### Security Summary

Implemented and covered by tests, per inspection of the code and the repository's own `SPRINT_01_FINAL_REVIEW.md` section 6: PBKDF2-HMAC-SHA256 credential hashing with per-user salts and constant-time comparison; peppered HMAC email hashing; short-TTL bearer sessions with an absolute lifetime ceiling and revocation; fail-closed authentication on every non-public route; centralised family-scope RBAC; append-only audit of health-data access; structurally PHI-safe logging via a safe-key allowlist; spreadsheet formula-injection neutralisation; coded errors that never leak internals; no secrets in the repository, with `gitleaks` in CI. Five known, documented, and non-blocking weaknesses ship with this release and are each filed as a GitHub issue: a PBKDF2 timing side-channel on the unknown-email login path (#5), non-transactional registration (#6), an in-memory rate limiter that does not survive a GAS invocation (#7), a bearer session token in `localStorage` and the query string (#8), and unserialised Sheets writes (#9). None of these was found to be an objective release blocker; all are consistent with the architecture's stated v1 posture for a Google-Apps-Script-hosted backend.

### Technical Debt

Eleven items are catalogued, each with a filed GitHub issue, priority, and acceptance criteria (see Issue Summary below and the full detail in `ISSUE_REVIEW.md`). The debt is self-reported: every medium-or-higher item was already named in the sprint's own reports (`SPRINT_01_PATCH_REPORT.md` §9, `SPRINT_01_FINAL_REVIEW.md` §7) before this review, rather than being discovered independently. The most consequential unaddressed item is that the backend has never been exercised on live Google Apps Script — CI proves it builds and passes tests, not that it deploys — and the first dev deployment should be treated as a verification step per the repository's own recommendation.

### Issue Summary

11 open issues (#5-#15), 0 closed, 0 duplicates, 0 overlaps, 0 priority changes, 0 new issues created by this review. Full detail, including per-issue labels and recommendations, is in `ISSUE_REVIEW.md`. Summary by priority: P1 — #5 (PBKDF2 timing), #6 (non-transactional registration), #7 (rate limiter durability); P2 — #8 (session storage), #9 (Sheets write serialisation), #10 (accessibility CI), #11 (coverage measurement); P3 — #12 (OpenAPI generation), #13 (config type-checking), #14 (Astro linting), #15 (landing-page routing). No milestones exist yet in the repository; milestone creation and assignment is an explicitly out-of-scope post-merge action already documented in `SPRINT_01_FINAL_CHECKLIST.md`.

### Missing Tags

The repository has zero tags and zero releases. All four tags required by the release process are missing: `v1.0.0-architecture` (target commit `ce442bc`), `v1.1.0-implementation-plan` (target commit `af4d1cb`), `v1.2.0-sprint-00` (target commit `ced4644`), and `v1.3.0-sprint-01` (target: the merge commit of this PR, not yet created). None was created by this review. Full detail, including recommended (not executed) `git tag`/`git push` commands for each, is in `MISSING_TAGS.md`.

### Recommended PR Branch

`claude/sprint-01-final-cleanup-wt26v3` -> `main`. This branch contains the full Sprint 01 feature set, the GAS auth-transport patch, the cleanup pass that fixed eight objective defects, the CI format-check gate, and this review's documentation corrections — more than 19 commits ahead of `main`, 0 commits behind, no conflicts. The alternative branch, `claude/wise-bloom-sprint-01-ru67bn`, contains only the pre-patch, pre-cleanup Sprint 01 work (13 commits) and should not be used as the PR source.

### Release Checklist

- Architecture and implementation-planning docs untouched: confirmed.
- Branch merges cleanly with no conflicts: confirmed.
- Latest GitHub Actions run on the Sprint 01 code green (lint, format, type-check, test, build, secret scan): confirmed.
- No secrets, no accidental files, no dead/commented-out/debug code: confirmed.
- All 11 follow-up items filed as GitHub issues with priority and acceptance criteria: confirmed.
- Release documentation (`PR_DESCRIPTION.md`, `SPRINT_01_COMPLETION_REPORT.md`, `SPRINT_01_PATCH_REPORT.md`, `SPRINT_01_RELEASE_NOTES.md`, `SPRINT_01_FINAL_CHECKLIST.md`, `SPRINT_01_FINAL_REVIEW.md`, `README.md`) reviewed for factual accuracy and internal consistency: confirmed, one stale tag reference corrected in two files.
- Release tags: not created — see `MISSING_TAGS.md`.
- Milestones: not created — documented as a post-merge action.
- PR: not opened, per instruction.

### Final Recommendation

Merge `claude/sprint-01-final-cleanup-wt26v3` into `main`. After merge, apply the four tags listed in `MISSING_TAGS.md` to their respective commits, create the milestones named in `ISSUE_REVIEW.md` and `SPRINT_01_FINAL_REVIEW.md`, and treat the first dev deployment to Google Apps Script as a verification step before Sprint 02 begins. Issues #5, #7, and #10 are the recommended first follow-ups.

### Decision

**GO WITH NOTES**
