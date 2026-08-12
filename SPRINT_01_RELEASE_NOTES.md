# Sprint 01 Release Notes

| Field                 | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Sprint                | 01 — Identity, family graph, PregnancyEpisode, timeline foundation |
| Source                | `docs/20-Implementation/206-SPRINT_01.md`                          |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN)                                     |
| Base                  | `main` @ `ced4644` (Sprint 00 merged)                              |
| Proposed tag          | `v1.3.0-sprint-01`                                                 |
| Status                | Ready for PR and merge                                             |

Sprint 01 turns Sprint 00's empty-but-wired foundation into a product a real user can register for,
log into, and see their own record in. It is the first sprint that stores anything about a person,
so most of it is spine: identity, scoping, auditing, and the append-only guarantee everything later
depends on.

---

## New Features

### Authentication and sessions

- **Registration** — email + password with a mandatory medical-disclaimer acknowledgement, which
  seeds the account's `Family` and `MaternalRecord` in the same flow
  (`docs/04-Architecture/57` §4).
- **Login / logout / refresh** — opaque bearer sessions where `session_id` _is_ the token. A
  30-minute rolling access TTL, a 30-day absolute lifetime ceiling that `refresh` can never exceed,
  and immediate server-side revocation on logout (`docs/09-Security/122`).
- **Rate limiting** — 5 registrations and 10 logins per 15-minute window per normalised email,
  behind a storage-neutral `RateLimiter` interface.
- **Anti-enumeration** — unknown email, wrong password, and locked account all fail with the same
  generic message and the same `401 unauthenticated` code (`docs/04-Architecture/57` BR-4).

### Family graph and RBAC

- `FamilyService`, `MaternalService` — the family record root and the maternal node, both created
  once at registration.
- **Family-scope RBAC** — every family-scoped endpoint resolves the caller's own family by default
  and returns `403 forbidden` when a caller names a family they do not own. Centralised in one
  helper (`controllers/rbac.ts`) so no controller can enforce it differently.

### Pregnancy

- **PregnancyEpisode** — LMP, EDD, pre-pregnancy BMI category, and parity, all optional, because
  partial and retrospective entry is a supported state, not an error (P9).
- **Derived gestational age** — weeks/days computed from LMP on read by a pure library function and
  returned for display. Never persisted, so it can never disagree with the LMP it comes from
  (`docs/06-Modules/82` BR-1).

### Timeline

- **Append-only event stream** — `append` writes an original (version 1); `correct` writes a new
  versioned row linked to the lineage's original via `corrects_event_id` and never mutates what
  came before; `list` returns one entry per lineage (the current version), cursor-paginated.
- The `events` and `audit_log` tables are marked append-only in the adapter, which rejects in-place
  updates to them outright.

### Content safety

- `ContentService` refuses to register **or serve** any content item missing a valid
  `content_type` or a non-empty `source_ref` — and re-validates on read, since Sheets enforces no
  schema and a row could be corrupted after the fact (`docs/02-Research/28` BR-1/BR-2).

### Frontend

- New routes: `/register`, `/login`, `/app`.
- Registration with an accessible `DisclaimerGate`, login, logout, pregnancy setup, and a
  continuous timeline view with a calm empty state and "load more" pagination.
- Per-domain API modules (`api/auth`, `api/family`, `api/maternal`, `api/timeline`) over one shared
  typed transport, plus client-side session state that restores an authenticated client across page
  loads and redirects to `/login` when there is none.

### API contract

- `/v1/auth/register|login|logout|refresh`, `/v1/family`, `/v1/maternal`,
  `/v1/maternal/pregnancy-episodes` (POST + GET), and their payload types — all storage-neutral,
  all in `packages/api-contract`.

---

## Fixes

- **Tailwind emitted no CSS at all** (pre-existing Sprint 00 defect). `astro.config.mjs` sets
  `applyBaseStyles: false`, but nothing ever requested the `components`/`utilities` layers either,
  so every page — including Sprint 00's own — rendered completely unstyled. Fixed by adding
  `@tailwind components; @tailwind utilities;` to `tokens.css`. Found by opening the app in a real
  browser; no unit, type, or lint check could have caught it.
- **Bearer token never reached the backend** (`SPRINT_01_PATCH_REPORT.md`). The client sent the
  token only as an `Authorization` header; a GAS Web App's `doGet`/`doPost` cannot read custom
  headers at all, so every authenticated call would have failed `401` once deployed. The client now
  also sends the token as the `token` query parameter the backend actually reads, and the entry-point
  translation seam has direct test coverage. The header is still sent for a future non-GAS backend.
- **`format:check` was never enforced.** The script existed but no CI job ran it, so an unformatted
  file reached the branch on a green build. Added as a CI gate; the offending file was reformatted.
- **Documentation that described code that does not exist.** `StorageAdapter.ts` and the sheets
  integrity module both claimed writes were serialised behind `LockService`; there is no
  `LockService` anywhere in the codebase. Corrected to describe the actual mechanism and to name
  the gap (queued as issue 5 in `ISSUES_TO_CREATE.md`).
- **`PregnancyService.listEpisodes`** documented "most-recently-created first" while returning
  creation order. The doc was corrected rather than the order, which the API contract exposes.
- **Broken doc references.** Three comments in `packages/domain-types` pointed at
  `docs/05-Data/54`, which does not exist — the Sheets schema is `docs/04-Architecture/54`.
- **`pnpm --filter @wise-bloom/backend deploy:dev` always failed.** It invoked a bare `clasp`, which
  is not a dependency of the workspace. Now uses the same pinned invocation as `deploy-dev.yml`.
- **Dead router stubs removed.** `enforceRateLimit` and `validate` were empty functions called on
  every request, implying router-level stages that do not exist; rate limiting lives in
  `AuthService` and validation lives per-controller.

---

## Security

Everything below is implemented and covered by tests.

- **Credentials** — PBKDF2-HMAC-SHA256, 20,000 iterations, per-user 16-byte random salt, stored as
  a self-describing `algo$iterations$salt$hash` string. Plaintext passwords are never stored,
  logged, or returned. Verification uses a constant-time comparison.
- **Email at rest** — stored only as a keyed HMAC-SHA256 (`email_hash`) using a server-side pepper
  from Script Properties, so a stored value cannot be reversed by dictionary attack without the
  secret.
- **Crypto implementation** — SHA-256, HMAC-SHA256, and PBKDF2 are a small dependency-free pure-TS
  implementation, verified against FIPS 180-4, RFC 4231, and RFC 7914 test vectors, so Apps Script
  and Node behave identically rather than running two mutually unverifiable code paths.
- **Sessions** — short access TTL, absolute lifetime ceiling, idempotent revoke, bulk revoke-all
  for a user. Every validation failure fails closed: unknown, expired, and absent sessions are all
  rejected identically.
- **Authorization** — no route is reachable without a valid session except register and login,
  which are explicitly allowlisted. A session whose user no longer exists is rejected.
- **Audit** — every read or write of a `MaternalRecord`, `PregnancyEpisode`, or the timeline appends
  an audit record: who, what entity, what action, when. Metadata only — never health content. The
  audit table is append-only at the adapter level.
- **Operational logging** — the logger enforces PHI safety structurally with a **safe-key
  allowlist**: any context key not on the list is dropped and only its _name_ is recorded under
  `redacted_keys`. A careless caller cannot leak a value. Debug logging is off unless explicitly
  enabled.
- **Input handling** — the Sheets adapter neutralises spreadsheet formula injection on every string
  write (a leading `=`, `+`, `-`, or `@` is escaped) and strips ASCII control characters.
- **Errors** — a fixed set of coded errors with safe messages; internals and stack traces never
  reach the client.
- **Secrets** — none in the repo. `SPREADSHEET_ID` and `EMAIL_PEPPER` come from Script Properties
  and the backend refuses to start without them; deploy credentials come from GitHub environment
  secrets; `.clasp.json` and `.env*` are git-ignored; gitleaks runs on every CI run.

Known security trade-offs are listed under **Known Limitations** and queued in
`ISSUES_TO_CREATE.md`. None is a defect introduced by Sprint 01 shortcuts.

---

## Testing

**161 tests across 26 files — all passing, none skipped.**

| Package                            | Files  | Tests   |
| ---------------------------------- | ------ | ------- |
| `apps/backend`                     | 15     | 119     |
| `apps/web`                         | 8      | 28      |
| `tests` (cross-app integrity)      | 1      | 5       |
| `tools/lint-rules` (boundary meta) | 2      | 9       |
| **Total**                          | **26** | **161** |

What the suite actually proves:

- **Crypto correctness** against published standard vectors, not self-consistency.
- **The append-only invariant at three levels** — unit (TimelineService), integration
  (service ↔ adapter ↔ API), and cross-app integrity, including a 10-deep correction chain and
  family isolation.
- **The full auth flow end-to-end** through the real request pipeline: register → login →
  authorised call → logout, plus the cross-family `forbidden` case and the unauthenticated case.
- **Privacy properties as assertions** — that registration never stores the plaintext password or
  email, that audit records contain no PHI, and that non-allowlisted log keys are dropped.
- **Anti-enumeration** — that an unknown email and a wrong password produce the same error type.
- **Architecture boundaries** — RuleTester meta-tests that fail if `SpreadsheetApp` is used outside
  the adapter or a network call appears outside `api/`.
- **The GAS entry-point seam** — the `doGet`/`doPost` → `ApiRequest` translation, which is where
  the transport bug of `SPRINT_01_PATCH_REPORT.md` lived.

Service and integration tests run against the **real** `SheetsStorageAdapter` over an in-memory
`SheetGateway`, so they exercise actual PK/FK/append-only/immutability enforcement rather than a
hand-rolled fake.

---

## Known Limitations

These are accepted, documented, and non-blocking. Each has a corresponding entry in
`ISSUES_TO_CREATE.md`.

1. **PBKDF2 login timing side-channel.** An unknown email skips the KDF and returns measurably
   faster than a wrong password. Messages are already identical; the timing is not.
2. **Registration is not transactional.** A failure after the `User` row is written leaves an
   orphaned account that can log in but has no family, with no self-service recovery.
3. **Rate limiting does not survive a GAS invocation.** The limiter is in-memory and the app is
   rebuilt per request, so register/login are effectively unthrottled in a deployed environment.
4. **The session token lives in `localStorage` and travels in the query string.** Both are readable
   by page scripts; the query string can reach access logs. Forced by the GAS deployment model,
   mitigated by short TTLs and revocation.
5. **Sheets writes are not serialised.** Integrity checks are read-then-write with no lock, so
   concurrent executions could in principle both pass a uniqueness check.
6. **No automated accessibility testing.** AA compliance was verified manually and is not enforced
   by CI.
7. **No coverage measurement.** Coverage is tracked by acceptance-criterion traceability, not a
   line-coverage number.
8. **No OpenAPI/JSON-Schema generation.** The contract is hand-written TypeScript; runtime payloads
   are hand-parsed with no schema validation.
9. **`packages/config` is not type-checked** (blocked on an `eslint-config-prettier` version that
   ships types), and **`.astro` files are not linted**, so the boundary rules do not cover them.
10. **The landing page still shows the Sprint 00 shell** and does not link to `/register` or
    `/login`.

---

## Upgrade Notes

Sprint 01 is additive on top of Sprint 00. There is no production deployment and no user data to
migrate, so there is no upgrade path to execute — but a dev/staging environment needs the following
before it will start.

**Required Script Properties** (Apps Script → Project Settings → Script Properties). The backend
throws on startup if either is missing:

| Property         | Purpose                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `SPREADSHEET_ID` | The per-environment spreadsheet the adapter opens.                           |
| `EMAIL_PEPPER`   | Server-side secret keying the `email_hash` HMAC. **Never commit this.**      |
| `ENVIRONMENT`    | Optional. Set to `dev` to enable debug logging; anything else leaves it off. |

**Changing `EMAIL_PEPPER` invalidates every existing account**, because `email_hash` is the login
lookup key. Treat it as permanent per environment.

**Frontend config:** `PUBLIC_API_BASE_URL` must point at the deployed Apps Script web app URL. If
unset it falls back to `http://localhost:8788`, which is correct for local development only.

**Schema:** new tabs (`users`, `sessions`, `families`, `maternal_records`, `pregnancy_episodes`,
`events`, `audit_log`) are created on first use by `ensureTable`. No manual setup. Three fields
were added to the domain model this sprint — `User.disclaimer_ack_at`, `Session.issued_at`, and
`Event.corrects_event_id`; on an empty environment there is nothing to backfill.

**Node/pnpm:** unchanged — Node `22.22.2` (`.nvmrc`), pnpm ≥ 10. No new runtime dependencies were
added by this sprint's cleanup pass.

---

## Developer Notes

**Getting started**

```bash
./scripts/bootstrap.sh       # deps, clasp scaffold, git hooks
pnpm -r test                 # 161 tests
pnpm --filter @wise-bloom/web dev
```

**The six gates** — CI runs all of them, in this order, on every push and PR:

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm -r lint
pnpm format:check            # new this sprint
pnpm -r typecheck
pnpm -r test
pnpm -r build
```

**Things worth knowing before extending this code:**

- **Two boundaries are lint-enforced, not convention.** No `SpreadsheetApp` outside
  `adapters/sheets/`; no network call outside `apps/web/src/api/`. Both rules have meta-tests that
  fail if the rule itself stops working.
- **`app.ts` is the composition root.** Tests build the same wiring as production and swap only the
  gateway, so integration tests exercise the real pipeline. Add services there, not inside
  controllers.
- **Derived values are never stored.** Gestational age is computed on read. Resist the urge to cache
  it into a column — that is exactly the duplicate-truth failure the architecture forbids.
- **Corrections are new rows.** Nothing in `events` or `audit_log` is ever updated in place; the
  adapter will throw if you try.
- **Commit types are constrained** by `commitlint.config.js` to
  `feat|fix|docs|refactor|test|chore|perf|security|content|revert`. Note that `ci` is **not** in the
  set — use `chore(ci)`.
- **`docs/` and `knowledge-base/` are excluded from Prettier and ESLint** (`.prettierignore`,
  `eslint.config.ts`). The frozen architecture is never reformatted by tooling.
- **Adding an entity** means: type in `domain-types` → table mapping in
  `adapters/sheets/tables/<entity>.ts` → register it in `tables/index.ts`. The adapter's integrity
  checks are driven entirely by that mapping.
