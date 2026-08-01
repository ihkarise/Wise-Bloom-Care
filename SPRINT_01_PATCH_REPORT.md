# Sprint 01 Patch Report — GAS Authentication Transport

| Field  | Value                                                                          |
| ------ | ------------------------------------------------------------------------------ |
| Patch  | Frontend to Google Apps Script authentication transport compatibility          |
| Branch | `claude/wise-bloom-sprint-01-ru67bn`                                           |
| Base   | `main` @ `ced4644`                                                             |
| Scope  | Bug fix only — no new features, no architecture change, no API-contract change |
| Status | Fixed and validated (CI green)                                                 |

## 1. Problem

Authenticated API requests from the web frontend could not reach the Google Apps
Script (GAS) backend once deployed. Registration and login (the two public routes)
would work, but every authenticated call afterwards — logout, refresh, family,
maternal, and timeline — would fail closed with `401 unauthenticated`, because the
bearer token never reached the backend.

Every layer passed its own tests, so the defect was invisible to the existing suite:
backend tests drive `buildApp`'s router directly with a hand-built `ApiRequest.token`,
and web tests assert the client sets an `Authorization` header. Nothing exercised the
real GAS HTTP entry point, where the two halves actually meet.

## 2. Root Cause

The two sides disagreed on how the bearer token travels over HTTP:

- Frontend (`apps/web/src/api/client.ts`) sent the token only as an
  `Authorization: Bearer <token>` HTTP header.
- Backend entry point (`apps/backend/src/main.ts`, `doGet`/`doPost`) reads the token
  only from the `token` query-string parameter (`event.parameter`).

A GAS Web App's `doGet`/`doPost` event object exposes only query/form parameters and
the POST body — it cannot read custom request headers at all (docs/04-Architecture/53
section 4). The backend was correctly built around this constraint: `RESERVED_PARAMS`
reserves `token`, `correlationId`, and `idempotencyKey` as query plumbing. The
frontend, built on the conventional header-based bearer pattern, was never reconciled
with it.

## 3. Architecture Impact

None. The fix is confined to the frontend transport layer and changes no architecture
boundary, business rule, or the API contract:

- StorageAdapter / Repository / Service / Controller / API-contract / Frontend
  separation is unchanged.
- No `packages/api-contract` change — request/response shapes are identical; only the
  wire mechanism for the already-defined bearer token changed on the client.
- No architecture document was modified.
- The backend was already correct and was not touched except for exporting one
  existing pure function for testing.

## 4. Files Changed

| File                                | Change                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/api/client.ts`        | Attach the bearer token as a `token` query parameter (the GAS-readable mechanism), in addition to keeping the existing `Authorization` header.             |
| `apps/web/tests/api/client.test.ts` | Assert the token rides as a `token=` query param when authenticated, and is absent for public/unauthenticated requests.                                    |
| `apps/backend/src/main.ts`          | Export the existing pure `toApiRequest` translation function (no logic change) so the entry-point seam is directly testable.                               |
| `apps/backend/tests/main.test.ts`   | New: exercises the real `doGet`/`doPost` to `ApiRequest` translation, proving the token is read from the query param and kept out of the domain query bag. |

Commits (Conventional Commits, on the sprint branch):

- `fix(web): support GAS authentication transport`
- `test(web): assert bearer token is sent as a GAS-readable query param`
- `refactor(backend): export toApiRequest for entry-point testing`
- `test(backend): cover GAS entry-point request translation`

## 5. Tests Added

- Web (`client.test.ts`): the authenticated-request test now asserts `token=...` is
  present in the request URL; the public-route test asserts no `token=` param is
  attached (unauthenticated endpoints keep working).
- Backend (`main.test.ts`, new — 3 tests): the `token` query param becomes
  `ApiRequest.token`; reserved plumbing params are excluded from the domain query bag
  while real domain params (`family_id`, `cursor`) are preserved; an unauthenticated
  POST yields no token and parses its JSON body.

This adds the previously-missing coverage of the real request-translation seam, not
just router-level behaviour.

## 6. Validation Results

Verified via GitHub Actions CI run #8 (commit `7af6822`) — Success. This browser-only
review environment cannot run `pnpm` locally, so CI is the executed source of truth.

| Gate                         | Result                                                                                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` + `pnpm -r lint` | Pass (7/7 packages)                                                                                                                                                                                                               |
| `pnpm -r typecheck`          | Pass                                                                                                                                                                                                                              |
| `pnpm -r test`               | Pass — 161 tests, 26 files (was 158/25): backend 119, web 28, cross-app 5, lint-rules 9                                                                                                                                           |
| `pnpm -r build`              | Pass                                                                                                                                                                                                                              |
| Secret scanning (gitleaks)   | Pass — no leaks detected                                                                                                                                                                                                          |
| `pnpm format:check`          | Not executed — not wired into CI and not runnable in this browser-only environment; new/edited lines were hand-conformed to the repo Prettier config (printWidth 100, single quotes, semicolons, trailing commas). See section 9. |

New backend test observed in the CI log: `tests/main.test.ts (3 tests)` passed.

## 7. Backward Compatibility

Preserved. The `Authorization: Bearer` header is still sent, so any future non-GAS
backend (a migration target per docs/04-Architecture/53 section 13) can keep reading
the token the standard way. The change is purely additive on the client; no existing
endpoint, request shape, or public route is altered, and public (unauthenticated)
requests remain both header-free and token-param-free.

## 8. Risk Assessment

Low.

- Blast radius is one client transport method; both the added query param and the
  retained header are covered by tests.
- No business logic, no crypto, no session policy, and no API contract changed.
- The token now also appears in the request URL/query string. On a GAS Web App this is
  the only viable transport, is consistent with the backend's existing `RESERVED_PARAMS`
  design, and pairs with the short-TTL, server-side-revocable session model
  (docs/09-Security/122). It does mean the opaque bearer token can surface in URL/access
  logs — a pre-existing property of the GAS deployment model, mitigated by short access
  TTLs and revocation, worth revisiting if the backend migrates off GAS.

## 9. Non-Blocking Observations (documented, not implemented)

Per the agreed scope, the following are recorded for a future sprint and were
deliberately NOT changed in this patch:

- PBKDF2 login timing side-channel: `AuthService.login` skips the PBKDF2 verification
  entirely when the email is unknown, so an unknown-email response returns measurably
  faster than a wrong-password one (~250-300ms). The error message is already identical
  (anti-enumeration at the message level, per 57 BR-4), but the timing differential
  could still permit email enumeration. Suggested future hardening: verify against a
  dummy hash on the unknown-email path to equalise timing.
- `format:check` not in CI: `.github/workflows/ci.yml` runs lint, type-check, test, and
  build, but not `pnpm format:check`, even though the script exists. Suggested: add a
  formatting gate to CI so Prettier compliance is machine-verified.
