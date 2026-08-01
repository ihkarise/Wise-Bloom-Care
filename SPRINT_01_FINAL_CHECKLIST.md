# Sprint 01 Final Checklist

Pre-merge verification for the Sprint 01 release. Every gate below was executed in this
environment on the final branch state — results are observed, not assumed.

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Branch       | `claude/sprint-01-final-cleanup-wt26v3` |
| Base         | `main` @ `ced4644` (Sprint 00 merged)   |
| Proposed tag | `v0.1.0-sprint-01`                      |
| Verified     | Full local run of all six gates         |
| Overall      | **Ready — PR and merge**                |

---

## Freeze compliance

- [x] **Architecture frozen** — `v1.0.0-Architecture`. No file under `docs/04-Architecture/` was
      modified in Sprint 01 or in this cleanup pass. Verified: `git diff --stat main..HEAD -- docs/`
      returns empty.
- [x] **Implementation planning frozen** — no file under `docs/20-Implementation/` modified. Same
      verification.
- [x] **No new architectural decisions taken.** The one domain-model addition Sprint 01 required
      (`Event.corrects_event_id`) is justified against `docs/05-Data/77` §5 in
      `SPRINT_01_COMPLETION_REPORT.md` §13, not invented.
- [x] **No Sprint 02 work started.** Everything out of scope is queued in `ISSUES_TO_CREATE.md`,
      not implemented.

## Sprint state

- [x] **Sprint 00 merged** — PR #4, merged into `main` at `ced4644`.
- [x] **Sprint 01 complete** — all six acceptance criteria in `docs/20-Implementation/206` §8 met,
      each with at least one passing automated test (`SPRINT_01_COMPLETION_REPORT.md` §5).
- [x] **Sprint 01 patch applied** — the GAS auth-transport defect is fixed and covered
      (`SPRINT_01_PATCH_REPORT.md`).
- [x] **Final cleanup applied** — 8 objective defects fixed; see `SPRINT_01_FINAL_REVIEW.md` §2.

## Tests passing

- [x] `pnpm -r test` — **161 passed, 0 failed, 0 skipped**, across 26 files:

| Package                            | Files  | Tests   |
| ---------------------------------- | ------ | ------- |
| `apps/backend`                     | 15     | 119     |
| `apps/web`                         | 8      | 28      |
| `tests` (cross-app integrity)      | 1      | 5       |
| `tools/lint-rules` (boundary meta) | 2      | 9       |
| **Total**                          | **26** | **161** |

- [x] **No skipped tests** — no `.skip`, `.only`, `.todo`, `xit`, or `xdescribe` anywhere in the
      repo.
- [x] **No flaky tests** — every suite injects its clock (`now`) and builds a fresh in-memory
      adapter per test; no wall-clock sleeps, no shared mutable fixtures, no network, no ordering
      dependency between files.
- [x] **No false-positive tests** — assertions check values and behaviour, not merely that a call
      did not throw. Crypto is checked against published FIPS/RFC vectors rather than against
      itself.
- [x] **Regression coverage exists for both fixed bugs** — the GAS transport bug is covered by
      `apps/backend/tests/main.test.ts` and the `client.test.ts` query-param assertions.

## CI passing

- [x] `pnpm install --frozen-lockfile` — clean; lockfile in sync with every manifest.
- [x] `pnpm lint` (root, whole repo) — clean.
- [x] `pnpm -r lint` — clean, 7/7 packages that define a lint script.
- [x] `pnpm -r typecheck` — clean, including `astro check`: 0 errors, 0 warnings, 0 hints across 32
      files.
- [x] **Boundary lint rules hold** — `no-sheets-outside-adapter` and `no-network-outside-api` pass
      repo-wide, and their RuleTester meta-tests still trip on planted violations.
- [x] **Secret scanning** — gitleaks job present and green; independent grep for credential-shaped
      literals found only synthetic test passwords.

## Build passing

- [x] `pnpm -r build` — clean. `tsc` builds `domain-types` and `api-contract`; `astro build` emits
      4 static routes (`/`, `/login`, `/register`, `/app`) with no warnings.
- [x] **No dependency conflicts** — single pnpm workspace resolution, no peer-dependency warnings,
      no unmet peers reported by install.
- [x] **No package-manager warnings** — install completes clean under pnpm 10.33.0 / Node 22.22.2,
      the versions pinned in `package.json` `engines` and `.nvmrc`.

## Formatting passing

- [x] `pnpm format:check` — "All matched files use Prettier code style!"
- [x] **`format:check` is now enforced in CI** — added to `.github/workflows/ci.yml` between lint
      and type-check. This was the gap that let an unformatted file reach the branch on a green
      build.

## Repository hygiene

- [x] **Branch clean** — working tree clean, nothing untracked, no stashes needed.
- [x] **No merge conflicts** — branch is a fast-forward descendant of `main` @ `ced4644`; no
      conflict markers anywhere in the tree.
- [x] **No accidental files** — no `.orig`, `.rej`, `.bak`, `.DS_Store`, editor state, or scratch
      files. Verified `git ls-files` contains no `dist/`, `build/`, `.astro/`, or `coverage/`
      entries; `.gitignore` covers all four.
- [x] **No secrets** — no `.env`, no `.clasp.json`, no credentials, no tokens. `.clasp.json.example`
      is a placeholder template only.
- [x] **No TODO / FIXME / XXX / HACK** markers in any source, test, config, workflow, or script.
- [x] **No dead code** — the two no-op router stubs were removed in this pass; no unused imports,
      exports, or unreachable branches remain (enforced by `noUnusedLocals`/`noUnusedParameters`
      plus ESLint).
- [x] **No debug logging** — the only two `console` calls are the deliberate structured-log sinks in
      `lib/logging.ts` and `main.ts`, which emit allowlisted, PHI-stripped JSON.
- [x] **No commented-out code.**
- [x] **Commit history clean** — every commit on the branch passes `commitlint` against the repo's
      extended Conventional-Commits type set; no fixups, no merge noise.

## Documentation

- [x] **README updated** — Sprint 01 scope described, all root reports listed in the folder tree,
      `format:check` added to the command table, CI gate order corrected, stale "Sprint 00 build
      baseline" heading and test description fixed.
- [x] **No broken internal references** — every `docs/NN-Section/NNN` reference in code, tests,
      workflows, scripts, and root markdown resolves to a real file (52 distinct references
      checked; 3 broken ones fixed).
- [x] **No broken markdown** — all root documents render; no malformed tables, no unclosed fences,
      no Mermaid blocks to break.
- [x] **No broken badges** — the README declares none.
- [x] **PR template current** — `.github/pull_request_template.md` matches `docs/11-Development/145`
      and every section applies to this PR as written; no update required.

## Reports complete

- [x] `SPRINT_01_COMPLETION_REPORT.md` — acceptance, validation, technical debt, Go/No-Go.
      Amended in this pass to correct a non-existent commit reference and to point at the final
      merge-time test totals.
- [x] `SPRINT_01_PATCH_REPORT.md` — the GAS auth-transport defect. Reformatted to satisfy the new
      Prettier gate.
- [x] `SPRINT_01_RELEASE_NOTES.md` — features, fixes, security, testing, known limitations,
      upgrade notes, developer notes.
- [x] `SPRINT_01_FINAL_REVIEW.md` — repository health, quality, compliance, risk, overall grade.
- [x] `ISSUES_TO_CREATE.md` — 11 deferred items, each with priority, milestone, labels,
      description, and acceptance criteria. All 11 filed as GitHub issues **#5–#15**.
- [x] `SPRINT_01_FINAL_CHECKLIST.md` — this document.

## Merge readiness

- [x] **PR ready** — `PR_DESCRIPTION.md` is prepared and follows the repository's PR template.
- [x] **Merge ready** — no conflicts, all gates green, no blocking issues open against this branch.
- [x] **Tag ready** — `v0.1.0-sprint-01` proposed. Apply after merge, on the merge commit.

---

## Post-merge actions

Not part of this PR, but required to close Sprint 01 out:

1. Create the `Sprint 02`, `Sprint 03`, `Hardening`, and `v2 — Migration` milestones and assign
   issues #5–#15 to them (the issues are filed; the milestones do not exist yet).
2. Tag the merge commit `v0.1.0-sprint-01`.
3. Configure `SPREADSHEET_ID` and `EMAIL_PEPPER` Script Properties before any dev deployment —
   the backend refuses to start without them (`SPRINT_01_RELEASE_NOTES.md` → Upgrade Notes).
4. Consider making the CI `verify` job a required status check on `main`, so the format gate cannot
   be bypassed the way it was this sprint.
