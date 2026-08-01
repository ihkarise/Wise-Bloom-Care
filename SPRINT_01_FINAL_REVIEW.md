# Sprint 01 Final Review

| Field                 | Value                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Sprint                | 01 — Identity, family graph, PregnancyEpisode, timeline foundation                                    |
| Branch                | `claude/sprint-01-final-cleanup-wt26v3`                                                               |
| Base                  | `main` @ `ced4644` (Sprint 00 merged)                                                                 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN)                                                                        |
| Review scope          | One complete pass: code, tests, CI, docs, reports, manifests, workflows, scripts, README, git history |
| Verification          | All six gates executed locally on the final branch state                                              |
| **Overall Grade**     | **GO WITH NOTES**                                                                                     |

---

## 1. Repository Health

**Grade: A**

The tree is clean and the build is reproducible. Nothing in it is accidental.

| Check                              | Result                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Working tree                       | Clean — no untracked, no stray, no scratch files                                               |
| Generated artifacts committed      | None. `dist/`, `build/`, `.astro/`, `coverage/` all git-ignored and absent from `git ls-files` |
| Secrets                            | None. Only `.clasp.json.example` (a placeholder); gitleaks green                               |
| `TODO` / `FIXME` / `XXX` / `HACK`  | Zero, repo-wide                                                                                |
| Commented-out code                 | None                                                                                           |
| Debug logging                      | None. Two `console` calls are deliberate structured-log sinks                                  |
| Commit history                     | Every commit passes `commitlint`; no fixups or merge noise                                     |
| Merge conflicts                    | None — fast-forward descendant of `main`                                                       |
| Dependency conflicts / PM warnings | None under pnpm 10.33.0 / Node 22.22.2                                                         |

**Note:** at review start, the designated cleanup branch pointed at `main` (Sprint 00) rather than
at the Sprint 01 work, which lives on the unmerged `claude/wise-bloom-sprint-01-ru67bn`. The branch
was re-based onto that head so the cleanup applies to the actual Sprint 01 content. **Sprint 01 has
no open PR** — one still needs to be opened from this branch.

---

## 2. Code Quality

**Grade: A−**

The code is unusually well-documented for a first feature sprint: nearly every module opens with a
header explaining not just what it does but which architectural rule forced the design and what the
alternative would have cost. That is the difference between comments that rot and comments that
justify. Naming is consistent, modules are small and single-purpose, and dependency direction is
one-way throughout.

Three things stand out as genuinely good decisions rather than merely correct ones:

- **The PHI-safe logger is structurally safe, not conventionally safe.** An allowlist that drops
  unknown keys and records only their names means a careless caller _cannot_ leak a value. Most
  codebases achieve this with a code-review rule.
- **Crypto is verified against published vectors,** not against itself — the only way to make a
  hand-rolled primitive trustworthy.
- **Tests run against the real adapter** over an in-memory gateway, so they exercise actual
  PK/FK/append-only enforcement rather than a fake that agrees with them by construction.

### Defects found and fixed in this pass

| #   | Issue                                                                                                                                           | Category                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | `format:check` existed as a script but was never run by CI, so unformatted files landed on green builds                                         | Broken CI gate          |
| 2   | `SPRINT_01_PATCH_REPORT.md` failed `prettier --check` — the file the missing gate let through                                                   | Formatting              |
| 3   | `StorageAdapter.ts` and `sheets/integrity/index.ts` both documented `LockService` serialisation that does not exist anywhere in the codebase    | Incorrect documentation |
| 4   | `PregnancyService.listEpisodes` documented "most-recently-created first"; it returns creation order                                             | Incorrect documentation |
| 5   | Three `docs/05-Data/54` references in `packages/domain-types` — that file does not exist (it is `docs/04-Architecture/54`)                      | Broken reference        |
| 6   | `apps/backend` `deploy:dev` invoked a bare `clasp`, which is not a workspace dependency — the script always failed                              | Broken script           |
| 7   | `enforceRateLimit` and `validate` were no-op functions called on every request, implying router-level stages that do not exist                  | Dead code               |
| 8   | README described a Sprint 00-only repository: stale scope, missing reports, missing `format:check`, wrong CI gate order, stale test description | Incorrect README        |

Also corrected: a non-existent commit reference (`Sprint 01 Complete`) in the completion report, and
that report's now-superseded test totals.

### What was deliberately left alone

`AppShell`/`index.astro` still carry Sprint 00 landing copy and link to none of the new routes.
Rewriting that is product work, not a correctness fix, so it is queued as issue 11 rather than
changed under a cleanup commit.

### Residual observations (not defects)

- `apps/backend`'s `build` script is `tsc --noEmit` — it type-checks rather than emitting, because
  clasp pushes TypeScript sources directly. Correct for the GAS model, but "build" is a slightly
  misleading name.
- `main.ts` calls `buildHandler()` per request, reconstructing the whole object graph each time.
  Correct for GAS's execution model; it is also the reason the in-memory rate limiter is ineffective
  in production (issue 3).

---

## 3. Architecture Compliance

**Grade: A**

| Rule                                                       | Status                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Architecture frozen (`docs/04-Architecture/`)              | ✅ Untouched — `git diff main..HEAD -- docs/` is empty           |
| Implementation planning frozen (`docs/20-Implementation/`) | ✅ Untouched                                                     |
| Boundary #1 — client depends only on the API contract      | ✅ Lint-enforced (`no-network-outside-api`), meta-tested         |
| Boundary #2 — only the adapter touches Sheets              | ✅ Lint-enforced (`no-sheets-outside-adapter`), meta-tested      |
| Services depend on `StorageAdapter`, never on Sheets       | ✅ Verified by inspection across all 8 services                  |
| Derived values never persisted                             | ✅ Gestational age computed on read, never stored                |
| Append-only timeline and audit log                         | ✅ Enforced at the adapter, not by convention                    |
| Content typing gate                                        | ✅ Enforced on write **and** on read                             |
| No secrets in code                                         | ✅ Script Properties only; backend refuses to start without them |

The two independence boundaries are the architecture's central promise, and they are enforced by
executable rules with their own meta-tests — not by documentation. That is the strongest single
signal in this repository.

One domain-model addition was made during Sprint 01 (`Event.corrects_event_id`). It is justified
against `docs/05-Data/77` §5's literal requirement and documented as such; it is a necessary
consequence of the frozen spec, not a deviation from it.

---

## 4. Documentation Quality

**Grade: A−** (was B before this pass)

Module-level documentation is excellent and, after this pass, accurate — the two `LockService`
claims were the only places where a comment described code that did not exist, and both are fixed.
Every one of the 52 distinct `docs/` references in code, tests, workflows, and root markdown now
resolves to a real file.

The reports are honest in a way that is worth calling out. `SPRINT_01_PATCH_REPORT.md` §9
volunteers two problems the author was not required to disclose — the PBKDF2 timing side-channel and
the missing `format:check` gate — and this review confirmed both. A report that surfaces its own
gaps is more useful than one that reads clean.

Remaining gap: the README's documentation map and folder tree are maintained by hand and will drift
again. Not worth automating yet.

---

## 5. Testing Quality

**Grade: A−**

**161 tests, 26 files, all passing, none skipped.**

| Property                 | Assessment                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Flaky tests              | None. Clocks are injected; no sleeps, no network, no shared mutable state, no inter-file ordering     |
| Skipped tests            | None — no `.skip`/`.only`/`.todo`/`xit`/`xdescribe` anywhere                                          |
| Duplicated tests         | None. `lib.test.ts` and the newer `lib/*.test.ts` files cover disjoint modules                        |
| False-positive tests     | None found. Assertions check values; crypto is checked against FIPS/RFC vectors, not self-consistency |
| Regression coverage      | Present for both bugs fixed this sprint (Tailwind CSS emission, GAS token transport)                  |
| Safety-critical coverage | Append-only proven at three levels; privacy properties asserted directly                              |

The append-only invariant being tested at unit, integration, **and** cross-app integrity levels is
the right instinct: it is the product's founding guarantee, and one layer of proof would not be
enough.

**Gaps, all queued as issues:** no coverage measurement (issue 7), no automated accessibility
testing (issue 6), and no test for the timing property of the login path (issue 1). Notably, the one
class of bug the suite has now demonstrably missed twice — defects at seams that no single package
owns — is exactly what `tests/e2e/` was scaffolded for and is still empty. The GAS transport bug
lived precisely there.

---

## 6. Security Review

**Grade: B+**

Reviewed: authentication, authorization, session handling, rate limiting, validation, logging,
audit, secrets, Apps Script configuration, and Sheets access.

**Implemented and verified:** PBKDF2-HMAC-SHA256 with per-user salts and constant-time comparison;
peppered HMAC email hashing; short-TTL bearer sessions with an absolute ceiling and revocation;
fail-closed authentication on every non-public route; centralised family-scope RBAC; append-only
audit of all health-data access; structurally PHI-safe operational logging; spreadsheet
formula-injection neutralisation and control-character stripping on every write; safe coded errors
that never leak internals; no secrets in the repository, with gitleaks in CI.

The Apps Script configuration is correctly locked down: `executeAs: USER_DEPLOYING`,
`access: MYSELF`, and only the two OAuth scopes the backend actually needs.

**No objective security bug was found that could be safely fixed within Sprint 01's scope.** The
grade is B+ rather than A because of five known weaknesses, all documented and all queued:

1. **PBKDF2 login timing side-channel** (issue 1) — the strongest of the five. Anti-enumeration is
   enforced in the message but not in the clock, so the property BR-4 requires is only half-held.
2. **Rate limiting is effectively absent in production** (issue 3) — the limiter is in-memory and
   the app is rebuilt per request. Register and login are unthrottled once deployed.
3. **Token in `localStorage` and in the query string** (issue 4) — forced by the GAS deployment
   model, mitigated by short TTLs and revocation.
4. **Unserialised Sheets writes** (issue 5) — integrity checks are read-then-write with no lock.
5. **Non-transactional registration** (issue 2) — a mid-flow failure strands an account with no
   self-service recovery.

Items 1 and 3 are the two worth doing first: both are contained, both have clear fixes, and
together they are the difference between "login is hardened" and "login is documented as hardened."

---

## 7. Technical Debt

| Item                                | Severity | Issue | Notes                                                                       |
| ----------------------------------- | -------- | ----- | --------------------------------------------------------------------------- |
| PBKDF2 login timing                 | Medium   | 1     | Contained fix; needs its own timing test                                    |
| Non-transactional registration      | Medium   | 2     | Needs an adapter capability or lifecycle change — ADR-level                 |
| In-memory rate limiter              | Medium   | 3     | Interface already designed for the swap; drop-in                            |
| `localStorage` session              | Medium   | 4     | Blocked on the deployment model, not on code                                |
| No `LockService` serialisation      | Medium   | 5     | Architecture doc describes it; adapter does not implement it                |
| No a11y automation                  | Medium   | 6     | Gap widens with every feature sprint                                        |
| No coverage tooling                 | Low      | 7     | Traceability is a valid substitute, but blind to refactors                  |
| No OpenAPI generation               | Low      | 8     | Already planned in `docs/04-Architecture/56` §13                            |
| `packages/config` not type-checked  | Low      | 9     | Blocked on an `eslint-config-prettier` version that ships types             |
| `.astro` files not linted           | Low      | 10    | Boundary rules do not cover Astro frontmatter                               |
| Landing page is the Sprint 00 shell | Low      | 11    | Product work                                                                |
| PBKDF2 at 20,000 iterations         | Accepted | —     | Deliberate: pure-JS KDF inside GAS's execution budget. Revisit on migration |

Debt is honestly catalogued rather than discovered — every medium item was already named in the
sprint's own reports before this review. That is the healthy pattern.

---

## 8. Known Risks

1. **Deployment has never been exercised.** CI proves the code builds and passes tests; it does not
   prove the app works on Apps Script. The GAS transport bug — invisible to every layer's own tests
   — is direct evidence that this gap produces real defects. The first dev deployment should be
   treated as a test, not a formality.
2. **`EMAIL_PEPPER` is irreversible.** It keys the login lookup hash, so changing it orphans every
   account in that environment. This needs to be understood before the first real user exists.
3. **Rate limiting will not behave as configured in production** until issue 3 is done, which
   matters more once the app is publicly reachable.
4. **The `[PROPOSED]` colour palette has not been contrast-verified** (`docs/03-UX/37` §7) beyond
   the primary action button's measured ~6.1:1. Without a11y automation (issue 6), a token change
   could silently break AA.
5. **Sprint 01 has no open PR.** The work is on an unmerged branch; nothing is on `main` yet beyond
   Sprint 00.

---

## 9. Issues Created

11 items are specified in `ISSUES_TO_CREATE.md`, each with title, priority, milestone, labels,
description, and acceptance criteria. **All 11 have been filed as GitHub issues #5–#15.** Milestones
are named per item but not applied — they do not exist in the repository yet and need creating before
Sprint 02 planning.

| #   | Issue                                                                   | Priority | Milestone      |
| --- | ----------------------------------------------------------------------- | -------- | -------------- |
| 1   | [#5](../../issues/5) Equalise PBKDF2 timing on unknown-email login      | P1       | Hardening      |
| 2   | [#6](../../issues/6) Compensating rollback for registration             | P1       | Sprint 02      |
| 3   | [#7](../../issues/7) Back the rate limiter with CacheService            | P1       | Hardening      |
| 4   | [#8](../../issues/8) Move the session out of `localStorage`             | P2       | v2 — Migration |
| 5   | [#9](../../issues/9) Serialise Sheets writes behind `LockService`       | P2       | Hardening      |
| 6   | [#10](../../issues/10) Wire automated accessibility checks into CI      | P2       | Hardening      |
| 7   | [#11](../../issues/11) Add test-coverage measurement to CI              | P2       | Hardening      |
| 8   | [#12](../../issues/12) Generate OpenAPI / JSON Schema from the contract | P3       | Sprint 03      |
| 9   | [#13](../../issues/13) Type-check the shared config package             | P3       | Sprint 02      |
| 10  | [#14](../../issues/14) Lint Astro files                                 | P3       | Sprint 02      |
| 11  | [#15](../../issues/15) Give the landing page a route into the product   | P3       | Sprint 02      |

---

## 10. Validation Results

Executed on the final branch state in this environment. Every result below was observed.

| Gate                             | Result                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | ✅ Pass — lockfile in sync                                              |
| `pnpm lint` (root)               | ✅ Pass                                                                 |
| `pnpm -r lint`                   | ✅ Pass — 7/7 packages with a lint script                               |
| `pnpm format:check`              | ✅ Pass — "All matched files use Prettier code style!"                  |
| `pnpm -r typecheck`              | ✅ Pass — incl. `astro check`: 0 errors, 0 warnings, 0 hints (32 files) |
| `pnpm -r test`                   | ✅ Pass — **161/161** tests, 26/26 files, 0 skipped                     |
| `pnpm -r build`                  | ✅ Pass — `tsc` clean; `astro build` emits 4 static routes              |
| Boundary lint rules              | ✅ Pass — repo-wide clean, meta-tests trip on planted violations        |
| Secret scan                      | ✅ Pass — no credentials; only synthetic test fixtures                  |
| Frozen-doc check                 | ✅ Pass — `docs/` unmodified across the whole branch                    |
| Commit-message lint              | ✅ Pass — 15/15 commits conform                                         |

---

## 11. Overall Grade

# GO WITH NOTES

Sprint 01 delivers every acceptance criterion in `docs/20-Implementation/206` §8 with automated
proof, holds both architectural boundaries under lint enforcement, introduces no secrets or PHI, and
passes all six gates cleanly. The eight objective defects this review found were fixed; none touched
behaviour, the API contract, or the frozen architecture.

It is **GO WITH NOTES** rather than a plain GO for three reasons, none of which blocks the merge:

1. **Five known security weaknesses ship with this release** (issues 1–5). All are documented,
   accepted trade-offs consistent with the architecture's stated v1 posture — but the login timing
   side-channel and the ineffective production rate limiter should be closed before the app is
   publicly reachable, not merely before v1.
2. **The code has never run on Apps Script.** The transport bug found late in this sprint is proof
   that green CI does not imply a working deployment. The first dev deploy must be treated as a
   verification step.
3. **The end-to-end gap that produced that bug is still open** — `tests/e2e/` remains empty, and
   automated accessibility checking does not exist.

None of these is a reason to hold the merge. All are reasons to schedule issues 1, 3, and 6 into the
next sprint before feature work resumes.

**Recommendation: merge, tag `v0.1.0-sprint-01`, file the 11 issues, and deploy to dev as a
verification exercise before Sprint 02 begins.**
