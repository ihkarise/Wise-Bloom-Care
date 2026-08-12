<!-- Template per docs/11-Development/145. Fill all applicable sections; mark N/A where truly not applicable. -->

# Sprint 01: Identity, family graph, PregnancyEpisode, and timeline foundation

## Summary

Sprint 01 turns Sprint 00's empty-but-wired foundation into a product a real user can register for,
log into, and see their own record in. It is the first sprint that stores anything about a person,
so most of it is spine: identity, family scoping, auditing, and the append-only guarantee that
everything later depends on.

Implements `docs/20-Implementation/206-SPRINT_01.md` against the frozen `v1.0.0-Architecture`
baseline. References: `docs/04-Architecture/52`, `56`, `57`, `58`; `docs/05-Data/70`–`73`, `75`,
`77`; `docs/06-Modules/80`, `82`, `96`; `docs/08-Timeline/110`; `docs/09-Security/120`–`124`;
`docs/02-Research/28`; `docs/ADR/ADR-004`.

This PR also includes the sprint's GAS auth-transport patch and the final pre-merge cleanup pass.

## Changes

**Backend — authentication and sessions**

- `AuthService` — registration with mandatory disclaimer acknowledgement (seeding the family and
  maternal scaffold in the same flow), login, logout, refresh. Rate-limited; login failures are
  generic and non-enumerating.
- `SessionService` — opaque bearer sessions (`session_id` _is_ the token), 30-minute rolling access
  TTL, 30-day absolute lifetime ceiling, idempotent revoke, bulk revoke-all.
- `lib/crypto.ts` — dependency-free SHA-256 / HMAC-SHA256 / PBKDF2, identical on Apps Script and
  Node, verified against FIPS 180-4 / RFC 4231 / RFC 7914 vectors.
- `lib/password.ts`, `lib/random.ts`, `lib/rateLimiter.ts`.

**Backend — domain**

- `FamilyService`, `MaternalService`, `PregnancyService` (forgiving all-optional episode entry;
  gestational age derived on read via `lib/gestation.ts`, never persisted).
- `TimelineService` — `append` / `correct` / `list`; corrections are new versioned rows linked via
  `corrects_event_id`, originals never mutated.
- `ContentService` — refuses to register **or serve** untyped/unsourced content, re-validating on
  read.

**Backend — request pipeline**

- `app.ts` composition root; real session-backed auth guard in `router.ts` with an explicit
  public-route allowlist; centralised family-scope RBAC in `controllers/rbac.ts`; auth, family,
  maternal, and timeline controllers; audit wiring on every health-data access.
- Sheets table mappings split one-file-per-entity; `Event.corrects_event_id` and
  `Session.issued_at` added to the domain model.

**Frontend**

- New routes `/register`, `/login`, `/app`; register (with `DisclaimerGate`), login, logout,
  pregnancy setup, and a continuous timeline view with a calm empty state and pagination.
- Per-domain API modules over one shared typed transport; client-side session state that restores an
  authenticated client across page loads and redirects to `/login` when there is none.

**Fixes included**

- Tailwind emitted no CSS at all (pre-existing Sprint 00 defect) — every page rendered unstyled.
- The bearer token never reached the GAS backend (headers are unreadable by `doGet`/`doPost`); it is
  now also sent as the `token` query param the backend actually reads.
- Eight objective defects from the final review — see `SPRINT_01_FINAL_REVIEW.md` §2.

**CI**

- `pnpm format:check` is now enforced. It existed as a script but nothing ran it, which is how an
  unformatted file reached the branch on a green build.

## Type

feat

## Testing

**161 tests across 26 files — all passing, none skipped** (backend 119, web 28, cross-app integrity
5, boundary meta-tests 9). Cases per `docs/10-Testing/131`.

Notable coverage:

- Crypto against published FIPS/RFC vectors, not self-consistency.
- The append-only invariant at three levels — unit, integration (service ↔ adapter ↔ API), and
  cross-app integrity — including a 10-deep correction chain and family isolation.
- Full auth flow end-to-end through the real pipeline: register → login → authorised call → logout,
  plus cross-family `forbidden` and unauthenticated cases.
- Privacy properties asserted directly: no plaintext password or email is ever stored, audit records
  carry no PHI, non-allowlisted log keys are dropped.
- Anti-enumeration: unknown email and wrong password produce the same error type.
- The GAS entry-point translation seam, where the transport bug lived.

Service and integration tests run against the **real** `SheetsStorageAdapter` over an in-memory
gateway, so they exercise actual PK/FK/append-only/immutability enforcement rather than a fake.

**How verified:** all six gates executed locally on the final branch state — `install --frozen-lockfile`,
`lint` + `-r lint`, `format:check`, `-r typecheck` (incl. `astro check`, 0/0/0), `-r test` (161/161),
`-r build` (4 static routes). Safety-critical paths per `docs/20-Implementation/214` §4 are covered
by automated tests; the frontend was additionally verified in a real browser (Playwright + Chromium),
which is how the Tailwind defect was found.

## Safety & Privacy checklist

- [x] No secrets/PHI added (synthetic data only)
- [x] Medical content typed + sourced (docs/02-Research/28) — `ContentService` enforces this on
      write and on read; no new medical content ships in this PR
- [ ] AI output goes through guardrails (docs/07-AI/105) — N/A, no AI in Sprint 01
- [x] Continuity invariants respected (no duplicate/orphan child; append-only) — append-only proven
      at three levels; no child records are created in this sprint
- [x] RBAC / audit / access rules respected — family-scope RBAC centralised and fail-closed; every
      health-data access audited
- [x] Accessibility (WCAG 2.2 AA) considered (docs/03-UX/40) — labelled fields, `role="alert"` and
      `aria-live` regions, visible focus rings, keyboard operability, ~6.1:1 contrast on the primary
      action. Verified manually; automation is queued as issue 6

## Docs

- [x] Relevant docs updated / in sync
  - README updated for Sprint 01 scope, reports, `format:check`, and the corrected CI gate order.
  - `SPRINT_01_RELEASE_NOTES.md`, `SPRINT_01_FINAL_CHECKLIST.md`, `SPRINT_01_FINAL_REVIEW.md`, and
    `ISSUES_TO_CREATE.md` added.
  - **No frozen document was modified** — `docs/04-Architecture/` and `docs/20-Implementation/` are
    untouched across the whole branch.

## ADR

- [ ] ADR added/updated if architecturally significant (docs/ADR/) — not required. The one
      domain-model addition (`Event.corrects_event_id`) is a direct consequence of
      `docs/05-Data/77` §5's literal requirement rather than a new decision, and is justified in
      `SPRINT_01_COMPLETION_REPORT.md` §13. Issues 2, 4, and 5 in `ISSUES_TO_CREATE.md` will each
      need an ADR when taken.

## Screenshots / Notes (optional)

**Known limitations shipping with this release** — all documented, all queued as issues, none
blocking:

1. PBKDF2 login timing side-channel (issue 1) — messages are identical, timing is not.
2. Registration is not transactional (issue 2) — Sheets has no transactions.
3. Rate limiting does not survive a GAS invocation (issue 3) — effectively unthrottled once deployed.
4. Session token in `localStorage` and in the query string (issue 4) — forced by the GAS model.
5. Sheets writes are not serialised behind `LockService` (issue 5).
6. No automated accessibility or coverage tooling (issues 6, 7).

**Before merging:** note that the code has never run on Apps Script. CI proves it builds and passes
tests; it does not prove it deploys. The transport bug found late in this sprint is direct evidence
of that gap — the first dev deployment should be treated as a verification step, and requires
`SPREADSHEET_ID` and `EMAIL_PEPPER` Script Properties to be set (see
`SPRINT_01_RELEASE_NOTES.md` → Upgrade Notes).

**Review recommendation:** `SPRINT_01_FINAL_REVIEW.md` grades this **GO WITH NOTES**. Suggested
follow-up ordering: issues 1, 3, and 6 before feature work resumes in Sprint 02.
