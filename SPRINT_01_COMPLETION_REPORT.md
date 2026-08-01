# Sprint 01 Completion Report

| Field                 | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Sprint                | 01 — Identity, family graph, PregnancyEpisode, timeline foundation |
| Source                | `docs/20-Implementation/206-SPRINT_01.md`                          |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN)                                     |
| Branch                | `claude/wise-bloom-sprint-01-ru67bn`                               |
| Base                  | `main` @ `ced4644` (Sprint 00 merged)                              |
| Status                | **Complete**                                                       |

---

## 1. Completed Scope

Sprint 01 built the cross-cutting spine and the family/pregnancy graph on top of Sprint 00's foundation:

- **AuthService + SessionService** — registration (with disclaimer acknowledgement), login, logout, session refresh. Bearer sessions with a short access TTL and an absolute-lifetime ceiling; rate-limited register/login; anti-enumeration login failures.
- **RBAC scaffolding** — every family-scoped endpoint resolves the caller's own family by default and rejects an explicitly-requested out-of-scope family with `forbidden`.
- **AuditService wiring** — every access to MaternalRecord, PregnancyEpisode, and the timeline is audited (metadata only, no PHI), on top of Sprint 00's `AuditService`.
- **TimelineService** — `append` (version 1, original events), `correct` (new versioned row referencing the original via `corrects_event_id`, original never mutated), `list` (paginated, one entry per correction lineage).
- **ContentService** — refuses to register or serve any content item missing a valid `content_type` or a `source_ref`; re-validates on read since Sheets enforces no schema.
- **FamilyService, MaternalService, PregnancyService** — family graph + maternal record created at registration; PregnancyEpisode with forgiving (all-optional) LMP/EDD/BMI-category/parity entry; gestational age computed by a pure lib from LMP, never persisted.
- **Sheets adapter** — table mappings for the Sprint 01 entities split into one file each (`users`, `sessions`, `families`, `maternal`, `pregnancyEpisodes`, `events`, `audit`); `Event.corrects_event_id` (self-referential FK) and `Session.issued_at` added to the domain model to support correction lineages and absolute-lifetime enforcement.
- **Frontend** — registration (with `DisclaimerGate`), login, logout, pregnancy setup, and an empty/continuous timeline view, wired to real endpoints through new per-domain `api/` modules (`auth`, `family`, `maternal`, `timeline`) and client-side session state (`state/session.ts`, `state/timeline.ts`).

## 2. Files Added

**Backend — lib**
`apps/backend/src/lib/{crypto,random,password,rateLimiter,gestation}.ts`

**Backend — services**
`apps/backend/src/services/{AuthService,SessionService,FamilyService,MaternalService,PregnancyService,TimelineService,ContentService}.ts`

**Backend — controllers**
`apps/backend/src/controllers/{authController,familyController,maternalController,timelineController,rbac,requestHelpers}.ts`
`apps/backend/src/app.ts` (composition root)

**Backend — adapter tables**
`apps/backend/src/adapters/sheets/tables/{types,users,sessions,families,maternal,pregnancyEpisodes,events,audit}.ts`

**Backend — tests**
`apps/backend/tests/lib/{crypto,password,gestation}.test.ts`
`apps/backend/tests/services/{auth,session,family,maternal,pregnancy,timeline,content}.test.ts`
`apps/backend/tests/integration/{auth-flow,timeline-append-only}.test.ts`
`apps/backend/tests/support/{inMemoryAdapter,testApp}.ts`

**Frontend**
`apps/web/src/api/{auth,family,maternal,timeline}.ts`
`apps/web/src/state/{session,timeline}.ts`
`apps/web/src/features/auth/{RegisterIsland,LoginIsland,LogoutButton,DisclaimerGate}.tsx`
`apps/web/src/features/pregnancy/PregnancySetupIsland.tsx`
`apps/web/src/features/timeline/TimelineView.tsx`
`apps/web/src/pages/{register,login,app}.astro`
`apps/web/src/lib/{apiConfig,errors}.ts`, `apps/web/src/env-vars.d.ts`
`apps/web/tests/api/{auth,client,family,maternal,timeline}.test.ts`
`apps/web/tests/state/{session,timeline}.test.ts`

**Cross-app**
`tests/integrity/timeline-continuity.test.ts`, `tests/integrity/support/inMemoryAdapter.ts`, `tests/package.json`, `tests/tsconfig.json` (new `tests` workspace package)

70 files added in total (~5,260 lines).

## 3. Files Modified

- `packages/domain-types/src/index.ts` — `User.disclaimer_ack_at`, `Session.issued_at`, `Event.corrects_event_id`.
- `packages/api-contract/src/index.ts` — `/v1/auth/*` (register/login/logout/refresh), `/v1/family`, `/v1/maternal`, `/v1/maternal/pregnancy-episodes`, `/v1/content` endpoints and payload types.
- `apps/backend/src/adapters/sheets/tables/index.ts` — reassembled from the split per-entity files.
- `apps/backend/src/controllers/router.ts` — real session-backed auth guard (replacing the Sprint 00 stub), public-route support, query-param plumbing.
- `apps/backend/src/main.ts` — wires `buildApp` (composition root), requires `SPREADSHEET_ID`/`EMAIL_PEPPER` Script Properties, builds `request.query`.
- `apps/backend/src/lib/validation.ts` — added `isEmail`.
- `apps/web/src/api/client.ts` — refactored into a reusable, public low-level transport (`request()`); Sprint 00's not-yet-used domain methods removed (dead code) in favour of the sprint-by-sprint per-domain `api/` file pattern this sprint establishes.
- `apps/web/src/styles/tokens.css` — see "Known Issues" (Tailwind utilities fix).
- `apps/web/tests/smoke.test.ts` — narrowed to shell-rendering only; `ApiClient` behaviour moved to `tests/api/client.test.ts`.
- `pnpm-workspace.yaml`, `pnpm-lock.yaml` — added the `tests` workspace package.

## 4. Architecture References

`docs/04-Architecture/52` (backend/services), `56` (API spec), `57` (auth flow), `58` (security model); `docs/05-Data/70`–`73`, `75`, `77` (data dictionary, ERD, field specs, validation, audit logs, versioning); `docs/06-Modules/80` (Auth), `82` (Pregnancy), `96` (Family); `docs/08-Timeline/110` (pregnancy timeline); `docs/09-Security/120`–`124` (threat model, encryption, session management, access control, secret management); `docs/02-Research/28` (content-typing standard); `docs/ADR/ADR-004-Authentication`.

## 5. Acceptance Criteria Checklist

Per `docs/20-Implementation/206-SPRINT_01.md` §8:

- [x] A new user can register (with disclaimer ack), log in, and receive a scoped session token (MS-1.1).
- [x] Unauthenticated requests are rejected; requests outside family scope return `forbidden`.
- [x] Timeline is append-only: a correction creates a new versioned event; the original is never mutated (verified by `timeline-append-only.test.ts` and `integrity/timeline-continuity.test.ts`).
- [x] Every health-data operation produces an audit record; logs contain no PHI.
- [x] ContentService refuses untyped/unsourced medical content.
- [x] PregnancyEpisode stores LMP/EDD; GA is computed for display, not persisted redundantly.

## 6. Validation Results

| Gate                                                                        | Result                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm lint` (root, whole repo)                                              | ✅ Pass                                                           |
| `pnpm -r lint` (per package)                                                | ✅ Pass (7/7 packages with a lint script)                         |
| `pnpm -r typecheck` (per package, incl. `astro check`)                      | ✅ Pass (0 errors, 0 warnings, 0 hints)                           |
| `pnpm -r test`                                                              | ✅ Pass — 158/158 tests, 25/25 test files                         |
| `pnpm -r build`                                                             | ✅ Pass — `tsc` builds clean; `astro build` emits 4 static routes |
| `pnpm format:check` (Prettier)                                              | ✅ Pass                                                           |
| Boundary lint rules (`no-sheets-outside-adapter`, `no-network-outside-api`) | ✅ Pass — meta-tests green, no violations in new code             |
| Manual browser verification (Playwright + Chromium)                         | ✅ Done — see §9                                                  |

## 7. Tests Executed

| Package                                             | Files  | Tests   |
| --------------------------------------------------- | ------ | ------- |
| `apps/backend`                                      | 14     | 116     |
| `apps/web`                                          | 8      | 28      |
| `tests` (cross-app integrity)                       | 1      | 5       |
| `tools/lint-rules` (boundary meta-tests, unchanged) | 2      | 9       |
| **Total**                                           | **25** | **158** |

Notable suites:

- `tests/services/auth.test.ts` — registration/login validation, rate limiting, anti-enumeration, audit records, no-plaintext-storage.
- `tests/services/session.test.ts` — access-TTL expiry, absolute-lifetime ceiling, revoke, bulk-revoke.
- `tests/services/timeline.test.ts` + `tests/integration/timeline-append-only.test.ts` + `tests/integrity/timeline-continuity.test.ts` — append-only invariant at the unit, integration, and cross-app levels, including a 10-deep correction chain and family isolation.
- `tests/integration/auth-flow.test.ts` — full register → login → authorised call → logout flow through the real HTTP-shaped pipeline, plus the RBAC-forbidden cross-family case.
- `apps/backend/tests/lib/crypto.test.ts` — SHA-256/HMAC-SHA256/PBKDF2 verified against FIPS 180-4, RFC 4231, and RFC 7914 test vectors.
- `apps/web/tests/state/timeline.test.ts`, `tests/state/session.test.ts` — frontend pagination and session-persistence hooks.

## 8. Coverage Summary

Every Sprint 01 acceptance criterion has at least one passing automated test (see §5/§7). Safety-critical paths per `docs/20-Implementation/214` §4:

- **Continuity/append-only**: covered at unit (TimelineService), integration (service↔adapter↔API), and cross-app integrity levels.
- **Privacy/security**: RBAC scope enforcement, fail-closed auth, no-PHI-in-audit and no-PHI-in-operational-logs, formula-injection guard (inherited from Sprint 00's `sanitizeString`, exercised by the Sheets adapter on every write), rate limiting on register/login.
- **Accessibility**: not automated (no axe-core in this environment — see Known Issues); manually verified — labelled fields, `role="alert"` + `aria-live` regions, visible focus rings, ≥6:1 contrast on the primary action button, full keyboard operability, `/app` redirect gating.

No formal coverage-percentage tool is wired into this monorepo; coverage is tracked by acceptance-criterion traceability (§5) per `docs/20-Implementation/214` §6, not a line-coverage number.

## 9. Implementation Notes

- **Dual-runtime crypto**: Apps Script has no Node builtins and no `Web Crypto` global, so password hashing (PBKDF2-HMAC-SHA256) and email hashing (keyed HMAC-SHA256) are implemented as a small, dependency-free, pure-TypeScript primitive (`lib/crypto.ts`) rather than branching between a GAS API and a Node API — this guarantees identical behaviour in both runtimes and is verified against standard test vectors. `session_id` doubles as the opaque bearer token (no separate token field), matching the "opaque UUID" convention and the storage-neutral `Session` model in `docs/04-Architecture/55` §3.
- **Timeline corrections**: since `event_id` is a unique PK, a correction cannot reuse it — `Event.corrects_event_id` was added (a self-referential FK, adapter-enforced) so a correction row can reference its lineage's original, per `docs/05-Data/77` §5's "new event referencing the original."
- **RBAC testability**: family-scoped GET endpoints accept an optional `family_id` query param (default: the caller's own family) specifically so the "requests outside family scope return forbidden" acceptance criterion is directly testable, without building out the full caregiver-sharing feature (`docs/06-Modules/96`), which is out of Sprint 01 scope.
- **Manual browser verification** (Playwright + pre-installed Chromium) confirmed: register/login forms render and validate (disclaimer-ack gate blocks submission), the `/app` route redirects to `/login` when unauthenticated and stays put with a valid session, keyboard tab order moves through interactive elements, and the primary button's contrast ratio is ~6.1:1 (WCAG AA requires ≥4.5:1 for text, ≥3:1 for UI components). This surfaced and led to fixing a genuine Sprint 00 bug (see below).

## 10. Known Issues

- **Sprint 00 bug found and fixed**: `astro.config.mjs` sets `applyBaseStyles: false` (deliberately skipping Tailwind's preflight), but no file ever requested the `components`/`utilities` layers either — so _no_ Tailwind utility class generated any CSS at all, and every page (including Sprint 00's own `index.astro`) rendered completely unstyled. Fixed by adding `@tailwind components; @tailwind utilities;` to `tokens.css`. Verified via Playwright: 0 → 70 generated CSS rules, correct computed colours.
- **No automated accessibility tooling in this environment**: axe-core (or an equivalent) isn't installed and there's no network path to add it within this session's scope. AA compliance for the new forms/pages was verified manually (labels, live regions, focus, contrast, keyboard nav) rather than via automated CI checks. Recommend wiring axe-core (or `@axe-core/playwright`) into CI in a follow-up sprint per `docs/20-Implementation/214` §4.5.
- **Registration is not transactional**: Sheets has no transactions, and `StorageAdapter` has no `delete`. If `FamilyService.createFamily`/`MaternalService.createMaternalRecord` fails after `AuthService` has already created the `User` row, the result is an orphaned `User` with no `Family`/`MaternalRecord`. This matches `docs/04-Architecture/52` §10's accepted "compensating logic" posture for v1 (only the delivery transition has a dedicated rollback runbook); a retry-safe or fully compensating registration flow is a reasonable follow-up but was not required by Sprint 01's acceptance criteria.

## 11. Technical Debt

- **PBKDF2 iteration count (20,000)**: chosen so a single hash takes ~250–300ms in pure JS on Apps Script's single-threaded, non-accelerated runtime — well under OWASP's native-implementation guidance (600,000+) by necessity. Documented in `lib/password.ts`. Revisit (higher count, or a native KDF) if/when the backend migrates off Apps Script.
- **In-memory rate limiter**: `lib/rateLimiter.ts`'s sliding-window implementation is correct for a single warm GAS execution context and for tests, but GAS does not guarantee memory persists across invocations the way a long-lived server process would. Production hardening (a `CacheService`-backed implementation behind the same `RateLimiter` interface) is a drop-in follow-up, not a redesign.
- **`localStorage` session storage**: bearer tokens are stored in `localStorage` (documented trade-off in `state/session.ts`) rather than an httpOnly cookie, since a GAS web app has no straightforward way to set cross-origin httpOnly cookies for a statically-hosted SPA. Mitigated by the short access-TTL and revocable sessions already in place; revisit if the deployment model changes.
- **No formal OpenAPI/JSON-Schema generation**: request/response shapes are hand-written TypeScript in `packages/api-contract`, matching Sprint 00's existing pattern — `docs/04-Architecture/56` §13 already lists formalising as OpenAPI as future work.

## 12. Go / No-Go Recommendation

**Go.** All Sprint 01 acceptance criteria are met with passing automated tests; lint, typecheck, test, and build gates are all green across every workspace package; the boundary-enforcing lint rules (no Sheets access outside the adapter, no network calls outside `api/`) hold for all new code; no PHI or secrets were introduced; the frontend was verified in a real browser. The two items in §10 (no CI a11y tooling, non-transactional registration) are non-blocking, documented, and consistent with the architecture's own stated v1 risk posture — not defects introduced by shortcuts.

## 13. Lessons Learned

- Reading the full closure of referenced architecture docs (not just the sprint doc) surfaced a real spec detail that would otherwise have caused a design gap: `Event.corrects_event_id` doesn't exist in the frozen field list, but `docs/05-Data/77` §5's literal wording ("a correction... is a new event referencing the original") requires it — resolved as a minimal, justified field addition rather than either inventing an off-spec workaround or skipping the requirement.
- Building the integration/integrity tests against the _real_ `SheetsStorageAdapter` (via an in-memory `SheetGateway`, not a hand-rolled fake `StorageAdapter`) caught two real bugs early: a missing FK seed in a first draft of the session tests, and confirmed the self-referential FK on `Event.corrects_event_id` actually works end-to-end through the adapter's integrity checks.
- Browser-verifying the frontend (per the standing instruction to actually exercise UI changes) caught a real, pre-existing Sprint 00 defect (Tailwind never emitting CSS) that unit/type/lint checks could not have caught — a reminder that green CI is necessary but not sufficient for "the feature works."

---

**Report commit**: `docs: sprint 01 complete`

**Superseded counts**: the validation totals in §6/§7 (158 tests / 25 files) are those of this
report's commit. The GAS auth-transport patch that followed added 3 tests and 1 file — see
`SPRINT_01_PATCH_REPORT.md` — and the final cleanup pass added none. The merge-time totals are
**161 tests / 26 files**, recorded in `SPRINT_01_FINAL_REVIEW.md`.
