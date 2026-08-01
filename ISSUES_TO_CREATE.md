# Issues To Create — Sprint 01 Deferred Work

Everything below was found during the Sprint 01 final review and **deliberately not fixed**.
Each item is either architecture-level, dependency-level, or a deliberate v1 trade-off recorded
in the frozen architecture — none of them is a defect introduced by Sprint 01 shortcuts, and none
of them blocks the merge.

Architecture is frozen (`v1.0.0-Architecture`) and implementation planning is frozen. Fixing any
of these inside Sprint 01 would mean reopening one of those baselines, so they are queued as
GitHub issues for a later sprint instead.

**Milestones referenced:** `Sprint 02`, `Sprint 03`, `Hardening`, `v2 — Migration`.
Labels use the repo's existing vocabulary plus the priority scale `P1` (next sprint) → `P3` (nice
to have).

**Status:** these are ready to file; they have not been created on GitHub yet.

---

## 1. Equalise PBKDF2 timing on the unknown-email login path

| Field     | Value                                                                      |
| --------- | -------------------------------------------------------------------------- |
| Priority  | **P1**                                                                     |
| Milestone | Hardening                                                                  |
| Labels    | `security`, `backend`, `P1`, `sprint-01-followup`                          |
| Source    | `SPRINT_01_PATCH_REPORT.md` §9; `apps/backend/src/services/AuthService.ts` |

### Description

`AuthService.login` looks the user up by `email_hash` first and only calls `verifyPassword` when a
user row is found:

```ts
const [user] = this.deps.storage.query('User', { email_hash: emailHash });
const credentialOk = user !== undefined && verifyPassword(input.password, user.credential_hash);
```

An unknown email therefore skips PBKDF2 entirely and returns in microseconds, while a known email
with a wrong password spends ~250–300 ms in the 20,000-iteration pure-JS KDF. The response body
and error code are already identical on both paths (anti-enumeration at the message level,
`docs/04-Architecture/57` BR-4), but the **timing differential** is large enough to be measurable
over the network and permits email enumeration — the exact attack BR-4 exists to prevent.

Not fixed in Sprint 01: it touches the authentication hot path and the rate-limit interaction, and
the fix deserves its own test for the timing property rather than being smuggled into a cleanup
commit.

### Acceptance Criteria

- [ ] On the unknown-email path, `login` verifies the supplied password against a fixed dummy hash
      (generated once at module load with the same algorithm, iteration count, and key length) so
      both paths perform exactly one PBKDF2 derivation.
- [ ] The dummy verification result can never authenticate a request.
- [ ] A test asserts that the wall-clock difference between an unknown-email login and a
      wrong-password login stays within a tolerance band (e.g. the faster path is at least 50% of
      the slower one), and fails if the early return is reintroduced.
- [ ] The generic `InvalidCredentialsError` message and `401 unauthenticated` mapping are unchanged.
- [ ] `docs/04-Architecture/57` BR-4 is cited in the code comment explaining why the dummy
      verification is not dead code.

---

## 2. Compensating rollback for the non-transactional registration flow

| Field     | Value                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| Priority  | **P1**                                                                           |
| Milestone | Sprint 02                                                                        |
| Labels    | `data-integrity`, `backend`, `P1`, `sprint-01-followup`                          |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §10; `apps/backend/src/services/AuthService.ts` |

### Description

Registration writes four rows in sequence — `User`, then `Family`, `MaternalRecord`, `Session` —
with no transaction, because Google Sheets has none and `StorageAdapter` exposes no `delete`
(`docs/04-Architecture/53` §7). If `createFamily` or `createMaternalRecord` throws after the
`User` row is committed, the account is left orphaned: it can authenticate but every family-scoped
endpoint returns `404 No family found for this account`, and re-registering with the same email
hits the duplicate-email conflict. The user is permanently stuck with no self-service recovery.

This matches `docs/04-Architecture/52` §10's accepted "compensating logic" posture for v1, so it
is a known risk rather than a regression — but the compensating logic itself was never written.

Not fixed in Sprint 01: a real fix needs either a new adapter capability (`delete` or a
`status='provisioning'` lifecycle) or a resumable registration flow. Both are architecture-level
decisions.

### Acceptance Criteria

- [ ] A failure in the family/maternal scaffold step leaves no user able to reach the stuck state
      described above — either the `User` row is compensated away, or it is marked incomplete and
      the next registration/login attempt resumes the scaffold.
- [ ] The chosen mechanism is recorded in an ADR (it changes either the `StorageAdapter`
      interface or the `User` lifecycle, both architecture-level).
- [ ] An integration test injects a failure at the `createFamily` step and asserts the account is
      recoverable — a subsequent registration or login with the same email succeeds and ends with
      a complete family graph.
- [ ] The audit trail records the compensating action (`docs/05-Data/75`).

---

## 3. Back the rate limiter with CacheService so limits survive GAS invocations

| Field     | Value                                                                       |
| --------- | --------------------------------------------------------------------------- |
| Priority  | **P1**                                                                      |
| Milestone | Hardening                                                                   |
| Labels    | `security`, `backend`, `P1`, `sprint-01-followup`                           |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §11; `apps/backend/src/lib/rateLimiter.ts` |

### Description

`createInMemoryRateLimiter` keeps its sliding window in a `Map` in process memory. On Apps Script
this is close to a no-op in production: `main.ts` calls `buildHandler()` inside every `doGet`/
`doPost`, so `buildApp` — and with it both limiters — is reconstructed per request, and GAS does
not guarantee memory persists across invocations regardless. Register and login are therefore
effectively unthrottled in a deployed environment, even though the limits (5/15 min register,
10/15 min login) are correct and are genuinely enforced in tests.

This is a documented v1 trade-off, and the interface was deliberately designed for the swap: the
`RateLimiter` interface is storage-neutral and `AuthService` depends only on it.

Not fixed in Sprint 01: a `CacheService`-backed implementation needs its own dual-runtime handling
and tests, and touches the composition root's lifetime model.

### Acceptance Criteria

- [ ] A `CacheService`-backed `RateLimiter` implementation exists behind the unchanged
      `RateLimiter` interface; `AuthService` is not modified.
- [ ] Counters are shared across separate GAS executions for the same key and expire with the
      window.
- [ ] The in-memory implementation is retained for tests, and which implementation is used is a
      composition-root decision (`app.ts`), not a service-level one.
- [ ] A test proves the limit still holds when the app is rebuilt between attempts (simulating
      per-request `buildHandler()`).
- [ ] Cache-unavailable behaviour is explicit and fails closed or degrades deliberately, with the
      choice documented.

---

## 4. Move the bearer session out of localStorage when the deployment model allows

| Field     | Value                                                                                     |
| --------- | ----------------------------------------------------------------------------------------- |
| Priority  | **P2**                                                                                    |
| Milestone | v2 — Migration                                                                            |
| Labels    | `security`, `frontend`, `architecture`, `P2`                                              |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §11; `apps/web/src/state/session.ts`; `docs/ADR/ADR-004` |

### Description

The bearer token is persisted in `localStorage` and, because a GAS Web App cannot read custom
request headers, is also sent as a `token=` query parameter (`SPRINT_01_PATCH_REPORT.md` §8). Both
are readable by any script running on the page, and the query parameter can surface in URL and
access logs. An httpOnly, SameSite cookie would remove both exposures, but a GAS web app has no
straightforward way to set cross-origin httpOnly cookies for a statically-hosted SPA frontend.

Mitigated today by the 30-minute access TTL, the 30-day absolute ceiling, and server-side
revocation (`docs/09-Security/122` §4, §6).

Not fixed in Sprint 01: it is blocked on the deployment model, not on code — this becomes possible
when the backend moves off Apps Script or gains a same-origin proxy.

### Acceptance Criteria

- [ ] A decision is recorded (ADR update) on whether the session moves to an httpOnly cookie, and
      under which deployment model.
- [ ] If adopted: the token is no longer written to `localStorage` and no longer appears in any
      request URL.
- [ ] Session persistence across page loads, logout, and refresh continue to work, with tests.
- [ ] CSRF protection is added alongside the cookie (cookies reintroduce that class of risk that
      bearer tokens avoid).

---

## 5. Serialise Sheets writes behind LockService

| Field     | Value                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Priority  | **P2**                                                                                                           |
| Milestone | Hardening                                                                                                        |
| Labels    | `data-integrity`, `backend`, `architecture`, `P2`                                                                |
| Source    | Sprint 01 final review; `apps/backend/src/adapters/sheets/SheetsStorageAdapter.ts`; `docs/04-Architecture/53` §7 |

### Description

`docs/04-Architecture/53` §7 describes `LockService` as part of how the v1 adapter approximates
consistency on Sheets, and `ARCHITECTURE_REVIEW_REPORT.md` TD-5 records the same expectation. The
adapter does not use it: `create` reads all rows, checks PK uniqueness and FK existence, then
appends — a read-then-write with no mutual exclusion. Two concurrent GAS executions can both pass
`assertUniquePk` and both append the same key, or an FK target can be deleted between check and
write.

Low likelihood at v1's single-family-per-account scale, and the append-only design limits the blast
radius, but the integrity checks are weaker than the architecture document claims.

The misleading code comments asserting a lock was already in use were corrected in the Sprint 01
cleanup pass (commit `chore: clean sprint 01 release`); this issue tracks closing the actual gap.

### Acceptance Criteria

- [ ] `SheetsStorageAdapter` acquires a script or document lock around each `create`/`update`, with
      a bounded wait and an explicit timeout behaviour.
- [ ] Lock acquisition is behind the `SheetGateway` port (or an equivalent seam) so in-memory tests
      are unaffected and the adapter stays unit-testable.
- [ ] A test proves the integrity checks and the write are not separable — a simulated interleaved
      write cannot produce a duplicate PK.
- [ ] Lock timeout surfaces as a safe, coded API error (`conflict` or `server_error`), never a raw
      GAS exception.

---

## 6. Wire automated accessibility checks into CI

| Field     | Value                                                                                        |
| --------- | -------------------------------------------------------------------------------------------- |
| Priority  | **P2**                                                                                       |
| Milestone | Hardening                                                                                    |
| Labels    | `accessibility`, `testing`, `ci`, `P2`, `sprint-01-followup`                                 |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §8, §10; `docs/03-UX/40`; `docs/20-Implementation/214` §4.5 |

### Description

WCAG 2.2 AA is a stated product requirement, but nothing enforces it automatically. Sprint 01's
forms and pages were verified manually (labels, `role="alert"` / `aria-live` regions, visible focus
rings, contrast, keyboard operability), which does not survive refactoring and cannot catch
regressions on pages nobody thought to re-check. Every future feature sprint widens the gap.

Not fixed in Sprint 01: adding axe-core (or `@axe-core/playwright`) is a new dependency plus a new
CI job, i.e. tooling scope rather than sprint scope.

### Acceptance Criteria

- [ ] axe-core (or equivalent) runs against every built route in CI and fails the build on
      serious/critical violations.
- [ ] The baseline is clean at the time of adoption — no pre-existing violations are suppressed
      without a written justification.
- [ ] Colour-contrast checking covers the semantic design tokens in `apps/web/src/styles/tokens.css`,
      so a token change that breaks AA is caught (`docs/03-UX/37` §7 marks the palette `[PROPOSED]`
      pending contrast verification).
- [ ] The check is documented in `README.md` alongside the other gates.

---

## 7. Add test-coverage measurement to CI

| Field     | Value                                                                |
| --------- | -------------------------------------------------------------------- |
| Priority  | **P2**                                                               |
| Milestone | Hardening                                                            |
| Labels    | `testing`, `ci`, `P2`                                                |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §8; `docs/20-Implementation/214` §6 |

### Description

There is no coverage tooling in the monorepo. Coverage is currently tracked by
acceptance-criterion traceability, which is a legitimate method and is honestly documented — but it
cannot show which branches of `crypto.ts`, `SheetsStorageAdapter.update`, or the error paths in
`router.ts` are actually exercised, and it gives no signal when a refactor silently drops coverage.

Not fixed in Sprint 01: choosing a provider (`v8` vs `istanbul`), setting thresholds, and deciding
whether the gate blocks or reports are policy decisions that should be made once for the whole
monorepo.

### Acceptance Criteria

- [ ] `vitest --coverage` is configured for every package with a test script, with a single shared
      provider and reporter set.
- [ ] CI publishes a coverage summary on each run.
- [ ] Thresholds are agreed and enforced, with safety-critical paths
      (`docs/20-Implementation/214` §4 — continuity, privacy, auth) held to a higher bar than the
      repo default.
- [ ] Coverage output is git-ignored (`.gitignore` already covers `coverage/`).

---

## 8. Generate OpenAPI / JSON Schema from the API contract

| Field     | Value                                                               |
| --------- | ------------------------------------------------------------------- |
| Priority  | **P3**                                                              |
| Milestone | Sprint 03                                                           |
| Labels    | `api-contract`, `tooling`, `P3`                                     |
| Source    | `SPRINT_01_COMPLETION_REPORT.md` §11; `docs/04-Architecture/56` §13 |

### Description

`packages/api-contract` is hand-written TypeScript. It is the client/backend boundary and the
migration guarantee, but nothing machine-checks that the backend's actual responses match the
declared shapes — the controllers annotate their return types, which TypeScript checks, while the
runtime request payloads are parsed by hand in `requestHelpers.ts` with no schema. A drift between
contract and implementation is possible in either direction.

`docs/04-Architecture/56` §13 already lists formalising as OpenAPI as future work, so this is
planned direction rather than a new idea.

### Acceptance Criteria

- [ ] An OpenAPI (or JSON Schema) document is generated from the contract package rather than
      maintained separately.
- [ ] Generation runs in CI and fails if the committed artifact is stale.
- [ ] At least one runtime path validates against the generated schema, so contract drift is caught
      by a test rather than by review.
- [ ] The generated artifact does not become a second source of truth — the TypeScript contract
      stays authoritative (`docs/04-Architecture/56` §9 BR-1).

---

## 9. Type-check the shared config package

| Field     | Value                                                  |
| --------- | ------------------------------------------------------ |
| Priority  | **P3**                                                 |
| Milestone | Sprint 02                                              |
| Labels    | `tooling`, `ci`, `P3`, `sprint-01-followup`            |
| Source    | Sprint 01 final review; `packages/config/package.json` |

### Description

`packages/config` has no `typecheck`, `build`, or `test` script, which is why `pnpm -r typecheck`
reports "7 of 8 workspace projects". `packages/config/eslint/index.ts` is TypeScript containing a
`Linter.Config[]` annotation and an `as Linter.Config[]` cast, and it configures linting for every
other package — but it is itself never type-checked. (Root `pnpm lint` does lint it.)

Adding a `typecheck` script today fails with `TS7016`: `eslint-config-prettier@9` ships no type
declarations. Closing the gap therefore means bumping that dependency to a version that does, or
adding a local declaration — a dependency change, which is out of scope for a cleanup pass.

### Acceptance Criteria

- [ ] `packages/config` has a `typecheck` script and a `tsconfig.json`, and `pnpm -r typecheck`
      reports 8 of 8 projects.
- [ ] `eslint/index.ts` type-checks with no `any` leaking from `eslint-config-prettier` — either by
      upgrading it or by adding an explicit module declaration.
- [ ] The upgrade (if taken) does not change effective lint behaviour: `pnpm lint` and `pnpm -r lint`
      still pass with no new or newly-suppressed violations.

---

## 10. Lint Astro files

| Field     | Value                                                     |
| --------- | --------------------------------------------------------- |
| Priority  | **P3**                                                    |
| Milestone | Sprint 02                                                 |
| Labels    | `tooling`, `frontend`, `P3`                               |
| Source    | Sprint 01 final review; `packages/config/eslint/index.ts` |

### Description

The shared ESLint config ignores `**/*.astro`. Astro files are type-checked by `astro check` and
formatted by `prettier-plugin-astro`, so they are not unguarded — but they are exempt from the two
architectural boundary rules. `no-network-outside-api` in particular would not fire on a `fetch`
written directly in an `.astro` frontmatter block, which is a realistic way to breach boundary #1
(`docs/04-Architecture/51` BR-1) as more pages are added.

Not fixed in Sprint 01: it needs `eslint-plugin-astro` and its parser, i.e. new dependencies, and
the boundary rules would need verification against the Astro AST.

### Acceptance Criteria

- [ ] `.astro` files are linted with the same boundary rules as `.ts`/`.tsx`.
- [ ] A meta-test (RuleTester, matching the existing pattern in `tools/lint-rules/`) proves
      `no-network-outside-api` trips on a planted `fetch` inside an `.astro` frontmatter block.
- [ ] The existing four pages lint clean with no suppressions.

---

## 11. Give the landing page a route into the product

| Field     | Value                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| Priority  | **P3**                                                                                        |
| Milestone | Sprint 02                                                                                     |
| Labels    | `frontend`, `ux`, `P3`, `sprint-01-followup`                                                  |
| Source    | Sprint 01 final review; `apps/web/src/pages/index.astro`; `apps/web/src/islands/AppShell.tsx` |

### Description

`/` still renders `AppShell`, the Sprint 00 foundation shell, whose copy reads "This is the Sprint
00 foundation shell — wired, themed, and ready for features." Sprint 01 shipped `/register`,
`/login`, and `/app`, but the landing page links to none of them — a first-time visitor has no path
into the product except by typing a URL.

Left alone in the cleanup pass on purpose: rewriting landing copy and adding navigation is product
work, not a correctness fix, and Sprint 01's acceptance criteria did not cover the landing page.

### Acceptance Criteria

- [ ] `/` offers a clear route to register and to log in.
- [ ] The "Sprint 00 foundation shell" copy is replaced with real product copy consistent with
      `docs/00-Vision/03` (the "Calm" principle) and the one-record thesis.
- [ ] An authenticated visitor landing on `/` is directed to `/app` rather than being shown the
      marketing shell.
- [ ] The page meets the same WCAG 2.2 AA bar as the Sprint 01 pages.
