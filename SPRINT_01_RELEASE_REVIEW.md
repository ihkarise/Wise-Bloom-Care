# Sprint 01 Release Review

Independent, evidence-based release verification of the Sprint 01 branch. Every claim below was
verified directly against the working tree, git history, the GitHub API, and GitHub Actions job
logs — not carried over from an earlier report.

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Sprint         | 01 — Identity, family graph, PregnancyEpisode, timeline foundation |
| Release branch | `claude/sprint-01-final-cleanup-wt26v3`                            |
| Head reviewed  | `65bf7b0`                                                          |
| Base           | `main` @ `ced4644` (Sprint 00 merged)                              |
| Branch state   | 28 commits ahead, 0 behind, 99 files changed                       |
| CI             | Run #22 on `65bf7b0` — SUCCESS                                     |
| Tests          | 161 tests / 26 files / 0 skipped                                   |
| **Decision**   | **GO WITH NOTES**                                                  |

A correction pass following this review added one documentation-only commit on top of `65bf7b0`
(stale tag references, refreshed figures, this document, and the release-package rename). It
changed no application code, tests, CI configuration, or frozen documentation.

---

## 1. Repository State

| Check           | Evidence                                             |
| --------------- | ---------------------------------------------------- |
| Working tree    | Clean — zero modified, zero untracked                |
| Remote          | `https://github.com/ihkarise/Wise-Bloom-Care`        |
| Ahead of `main` | 28 commits                                           |
| Behind `main`   | 0 commits                                            |
| Merge base      | `ced4644`                                            |
| Fast-forward    | Possible — `main` is a direct ancestor of the branch |
| Merge conflicts | None — `git merge-tree` dry-run reports zero         |

---

## 2. Release Branch

`claude/sprint-01-final-cleanup-wt26v3` is the correct PR source. It carries all four required
layers:

1. **Sprint 01 implementation** — 13 commits from `03baf4c` through `0170cbc`.
2. **GAS auth-transport fix** — `79035f5` through `7af6822`, plus `f03ce0b` (patch report).
3. **Cleanup pass** — `7335351` (CI format gate), `3160a54` (eight objective defects).
4. **Release documentation** — `6e56162` onward.

The alternative branch `claude/wise-bloom-sprint-01-ru67bn` holds only pre-patch, pre-cleanup work
and must not be used as the PR source.

---

## 3. Architecture and Planning Freeze

**PASS — zero modifications.**

`git diff origin/main..HEAD -- docs/` returns empty across all 28 commits. Nothing under
`docs/00-Vision` through `docs/13-Future`, `docs/ADR/`, `docs/20-Implementation/`, or
`knowledge-base/` was touched.

The 99 changed files reach only: root release documents, `.github/workflows/ci.yml`, `apps/`,
`packages/api-contract`, `packages/domain-types`, `tests/`, `pnpm-lock.yaml`, and
`pnpm-workspace.yaml`. `packages/config` is not among them.

---

## 4. Sprint Scope

Verified against `docs/20-Implementation/206-SPRINT_01.md`.

**Delivered in full** — all 8 services (`AuthService`, `SessionService`, `FamilyService`,
`MaternalService`, `PregnancyService`, `TimelineService`, `ContentService`, `AuditService`), all 4
controllers, all 7 table mappings, the frontend routes, and the API contract additions. All six §8
acceptance criteria are met with at least one passing automated test each.

**No Sprint 02 leak** — zero `VitalsService`, `ReportsService`, `TrendService`, `DashboardService`,
their controllers, or any charting code exists anywhere in the branch.

**One §9 test-plan gap** — the spec's testing section lists an e2e case (register → set up
pregnancy → see empty timeline, per `docs/10-Testing/131`). `tests/e2e/` contains only `.gitkeep`.
This is not among the §8 acceptance criteria, and the §12 Definition of Done enumerates
unit/integration/integrity/security tests without e2e, so it does not block the merge — but it is a
real gap, and it is the exact seam class that produced the GAS transport bug. Tracked as a
non-blocking item below.

---

## 5. Corrections Verified

The cleanup pass claimed ten corrections. Nine were verified complete at `65bf7b0`; the tenth was
completed by the follow-up correction pass.

| Item | Correction                                                 | Verified                                 |
| ---- | ---------------------------------------------------------- | ---------------------------------------- |
| A    | GAS token transport (query param + backend read + 3 tests) | ✅ `client.ts:81`, `main.ts:67`, 3 tests |
| B    | `format:check` in scripts and enforced in CI               | ✅ `package.json:25`, `ci.yml` step 7    |
| C    | Broken doc references                                      | ✅ all 120 refs resolve; source clean    |
| D    | `LockService` false claim                                  | ✅ removed; real gap now named           |
| E    | `listEpisodes` ordering doc                                | ✅ "in creation order"                   |
| F    | `deploy:dev` script                                        | ✅ pinned `@google/clasp@2.4.2`          |
| G    | Dead no-op router stubs                                    | ✅ removed                               |
| H    | README currency                                            | ✅ Sprint 01 scope, gates, 161 tests     |
| I    | Stale commit reference                                     | ✅ corrected                             |
| J    | Sprint 01 tag name → `v1.3.0-sprint-01`                    | ✅ completed in the correction pass      |

On item J: at `65bf7b0` the header tables had been updated but two live instructions still named
the superseded tag — the post-merge action list in `SPRINT_01_FINAL_CHECKLIST.md` and the closing
recommendation in `SPRINT_01_FINAL_REVIEW.md` — while `MISSING_TAGS.md` asserted that every
document already agreed. Anyone following the checklist would have created the wrong tag. All three
are now corrected, and a repository-wide search returns zero occurrences of the old name.

---

## 6. CI

**Run #22, id `30734922476`, commit `65bf7b0`, 2026-08-02T05:53:55Z — SUCCESS.**

| Job                                       | Step         | Result |
| ----------------------------------------- | ------------ | ------ |
| lint · format · type-check · test · build | Lint         | ✅     |
| lint · format · type-check · test · build | Format check | ✅     |
| lint · format · type-check · test · build | Type-check   | ✅     |
| lint · format · type-check · test · build | Test         | ✅     |
| lint · format · type-check · test · build | Build        | ✅     |
| secret scanning                           | Gitleaks     | ✅     |

Runs #15–#21 failed: all seven were documentation-only pushes whose new markdown did not match
Prettier's output, each failing at `format:check` and corrected on the same branch — the new gate
working as designed. Runs #11–#12 were cancelled by `concurrency: cancel-in-progress`, not failures.
Runs #10, #13, #14 succeeded on earlier commits and are superseded.

---

## 7. Tests

**161 tests / 26 files / 0 skipped**, read from run #22's job log.

| Package                            | Files  | Tests   |
| ---------------------------------- | ------ | ------- |
| `apps/backend`                     | 15     | 119     |
| `apps/web`                         | 8      | 28      |
| `tests` (cross-app integrity)      | 1      | 5       |
| `tools/lint-rules` (boundary meta) | 2      | 9       |
| **Total**                          | **26** | **161** |

No `.skip`, `.only`, `.todo`, `xit`, or `xdescribe` anywhere in the repository.

---

## 8. Code Quality

| Check                             | Result                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `TODO` / `FIXME` / `XXX` / `HACK` | Zero across source, tests, config, workflows, scripts       |
| Debug logging                     | None — two `console.log` calls are the structured-log sinks |
| Commented-out production code     | None                                                        |
| Dead code                         | None — the no-op router stubs were removed                  |
| Generated artifacts tracked       | None — no `dist/`, `build/`, `coverage/`, `.astro/`         |
| Temporary / editor files          | None — no `.orig`, `.rej`, `.bak`, `.DS_Store`              |
| `.env` / credentials / tokens     | None tracked                                                |

---

## 9. Security

No blocking finding. Verified present in code:

- PBKDF2-HMAC-SHA256 credential hashing, per-user salt, constant-time comparison.
- Peppered HMAC-SHA256 email hashing, pepper from Script Properties.
- Fail-closed sessions — unknown, expired, and absent all rejected identically.
- Two-route public allowlist; every other route requires a live session.
- Centralised family-scope RBAC returning `403 forbidden`.
- Allowlist-based PHI-safe logging that drops unknown keys and records only their names.
- Append-only audit log, enforced at the adapter.
- Spreadsheet formula-injection neutralisation and control-character stripping.
- GAS locked down: `executeAs: USER_DEPLOYING`, `access: MYSELF`, two OAuth scopes.
- No secrets tracked; gitleaks green in CI.

Five documented weaknesses ship with this release, each filed as an issue and each consistent with
the architecture's stated v1 posture: PBKDF2 login timing side-channel (#5), non-transactional
registration (#6), in-memory rate limiter ineffective under GAS (#7), token in `localStorage` and
query string (#8), unserialised Sheets writes (#9). None is a release blocker.

---

## 10. Issues

11 open issues, **#5–#15**, verified against the GitHub API. Zero duplicates, zero extras, zero
closed. All carry priority and category labels plus explicit acceptance criteria.

| Priority | Issues                                                                   |
| -------- | ------------------------------------------------------------------------ |
| P1       | #5 PBKDF2 timing · #6 registration rollback · #7 rate limiter            |
| P2       | #8 session storage · #9 write serialisation · #10 a11y CI · #11 coverage |
| P3       | #12 OpenAPI · #13 config type-check · #14 Astro lint · #15 landing page  |

No milestones exist in the repository, so none are assigned. Creating and assigning them is a
post-merge action.

---

## 11. Tags

**Zero tags exist** — local and remote both empty. See `MISSING_TAGS.md` for full detail and the
recommended (not executed) commands.

| Tag                          | Target                 | Status                            |
| ---------------------------- | ---------------------- | --------------------------------- |
| `v1.0.0-architecture`        | `ce442bc`              | Missing — creatable now           |
| `v1.1.0-implementation-plan` | `af4d1cb`              | Missing — creatable now           |
| `v1.2.0-sprint-00`           | `ced4644`              | Missing — creatable now           |
| `v1.3.0-sprint-01`           | Sprint 01 merge commit | **Created after Sprint 01 merge** |

`v1.3.0-sprint-01` cannot be created before the merge, because its target commit does not exist
yet. No SHA is invented for it here.

---

## 12. Pull Request

**PR NOT OPEN.** Only PRs #1–#4 exist, all closed/merged, none from this branch. Opening the PR is
the next action; `PR_DESCRIPTION.md` is prepared and follows the repository's PR template.

---

## 13. Merge Readiness

| Area          | Verdict                             |
| ------------- | ----------------------------------- |
| Architecture  | PASS                                |
| Code          | PASS                                |
| Tests         | PASS                                |
| CI            | PASS                                |
| Security      | PASS                                |
| Documentation | PASS                                |
| Git           | PASS                                |
| PR            | NOT OPEN — required next step       |
| Release       | PASS (tags are a post-merge action) |

---

## 14. Non-Blocking Items

1. **Sprint 01 §9 e2e test never written** — `tests/e2e/` is empty. Not an §8 acceptance criterion
   and not in the §12 DoD list, but it is the seam class that produced the GAS transport bug.
2. **Three historical tags missing** — `v1.0.0-architecture`, `v1.1.0-implementation-plan`, and
   `v1.2.0-sprint-00` all target existing commits on `main` and can be created today.
3. **Accessibility verified manually, not automated** — tracked as issue #10.
4. **Nine consecutive commits share one message** ("docs: finalize sprint 01 release package") from
   the format-gate correction cycle. Valid history, but noisy.
5. **CI Node 20 deprecation warning** — `actions/checkout@v4`, `actions/setup-node@v4`, and
   `pnpm/action-setup@v4` are forced onto Node 24. Warning only; deliberately not changed.
6. **The backend has never run on live Apps Script.** CI proves it builds and passes tests, not
   that it deploys. The first dev deployment should be treated as a verification step.

---

## 15. Decision

# GO WITH NOTES

No blocking issue exists. Architecture and implementation planning are provably frozen, CI is green
on the actual head commit, tests match baseline with none skipped, the branch merges cleanly with
zero conflicts, and no secrets or Sprint 02 scope entered. Every outstanding item is documentation
accuracy or release mechanics, none of which affects code correctness or merge safety.

**Next action: open the PR** — `claude/sprint-01-final-cleanup-wt26v3` → `main`, using
`PR_DESCRIPTION.md` as the body.
