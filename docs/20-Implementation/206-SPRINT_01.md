# 206 — Sprint 01: Auth, Family & Timeline Foundation

| Field | Value |
|---|---|
| Sprint | 01 — Identity, family graph, PregnancyEpisode, timeline foundation |
| Status | Planned |
| Milestone | MS-1.1 (`204` §4) |
| Layers | L2, L3 (`202` §3) |
| Ships toward | v1 (MVP) |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 3 engineers (2 BE, 1 FE) |

---

## 1. Purpose

Build the cross-cutting spine (Auth, Session, Audit, Timeline, Content) and the family/pregnancy graph (Family, MaternalRecord, PregnancyEpisode) with append-only timeline foundations. This is the substrate every module depends on (`203` §4). Exit gate MS-1.1: *user can register; append-only timeline verified*.

## 2. Objectives

1. AuthService + SessionService: register, login, logout, refresh; disclaimer acknowledgement (`57`, `122`, `28`).
2. RBAC scaffolding scoped to the family record (`123`).
3. AuditService fully wired: every health-data access logged, no PHI (`75`).
4. TimelineService: append-only, versioned events; polymorphic `subject` (maternal|child) (`110`, `77`, `71` §3).
5. ContentService: attaches `content_type` + `source_ref`; refuses untyped medical content (`28`, `52` §6).
6. FamilyService, MaternalService, PregnancyService (PregnancyEpisode with LMP/EDD/GA) (`71` §5, `82`).
7. Frontend: registration/login flows, disclaimer gate, empty timeline view, pregnancy setup.

## 3. Architecture References

`docs/04-Architecture/52` (services), `56` (`/v1/auth/*`, `/v1/family`, `/v1/maternal`, `/v1/timeline`), `57` (auth flow), `58` (security model); `docs/05-Data/70`–`73`,`75`,`77`; `docs/06-Modules/80` (Auth), `82` (Pregnancy); `docs/08-Timeline/110`; `docs/09-Security/120`,`122`,`123`,`124`; `docs/02-Research/28`; `docs/ADR/ADR-004-Authentication`.

## 4. Files Created

```
apps/backend/src/services/{AuthService,SessionService,FamilyService,MaternalService,PregnancyService,TimelineService,ContentService}.ts
apps/backend/src/controllers/{authController,familyController,maternalController,timelineController}.ts
apps/backend/src/adapters/sheets/tables/{users,sessions,families,maternal,pregnancyEpisodes,events,audit}.ts
apps/backend/tests/services/{auth,session,family,maternal,pregnancy,timeline,content}.test.ts
apps/backend/tests/integration/{auth-flow,timeline-append-only}.test.ts
apps/web/src/features/auth/{RegisterIsland.tsx,LoginIsland.tsx,DisclaimerGate.tsx}
apps/web/src/features/pregnancy/{PregnancySetupIsland.tsx}
apps/web/src/features/timeline/{TimelineView.tsx}
apps/web/src/pages/{register.astro,login.astro,app.astro}
apps/web/src/api/{auth.ts,family.ts,maternal.ts,timeline.ts}
apps/web/src/state/{session.ts,timeline.ts}
tests/integrity/timeline-continuity.test.ts (append-only invariant)
```

## 5. Files Modified

- `packages/domain-types/src/index.ts` — finalise `User`, `Session`, `Family`, `MaternalRecord`, `PregnancyEpisode`, `Event` shapes (from `70`/`72`).
- `packages/api-contract/src/index.ts` — finalise `/v1/auth/*`, `/v1/family`, `/v1/maternal`, `/v1/timeline` endpoint signatures.
- `apps/backend/src/adapters/sheets/SheetsStorageAdapter.ts` — implement CRUD for the entities above with integrity enforcement (`71` §7).
- `apps/backend/src/controllers/router.ts` — register new routes + auth guard.
- No architecture docs.

## 6. Tasks

1. Implement AuthService/SessionService per `57`: bearer tokens, secure session lifecycle (`122`), rate-limited register/login (`120`), disclaimer ack recorded (`28`). Fail closed on auth (`52` §8).
2. Wire RBAC scope check (family-scoped) into the controller auth guard (`123`).
3. Implement AuditService writes on every health-data operation; verify no PHI in logs (`75`, `63`).
4. Implement TimelineService: `append(event)` (append-only), `correct(eventId)` → new versioned event (`77`); polymorphic subject; `list(cursor)` paginated (`56` §3).
5. Implement ContentService: reject serving medical content lacking `content_type` + `source_ref` (`52` BR-5, `28`).
6. Implement FamilyService, MaternalService, PregnancyService: create family graph, MaternalRecord, and PregnancyEpisode (LMP/EDD; GA computed by `lib`, not stored redundantly — `13` §5).
7. Adapter: implement Sheets tables + integrity (FK existence, PK uniqueness, append-only events/audit) (`71` §7, `54` §5).
8. Frontend: registration (with disclaimer gate), login, session persistence via `api/`; pregnancy setup; empty/continuous timeline view. All calls via `api/` only (`51` BR-1).
9. Tests per §9.

## 7. Deliverables

- Working register/login/logout/refresh with disclaimer acknowledgement.
- Family graph + MaternalRecord + PregnancyEpisode created and persisted.
- Append-only, versioned timeline with polymorphic subject; paginated read.
- Audit on every access; ContentService typing enforcement.
- Frontend auth + pregnancy-setup + timeline shell wired to real endpoints.

## 8. Acceptance Criteria

- [ ] A new user can register (with disclaimer ack), log in, and receive a scoped session token (MS-1.1).
- [ ] Unauthenticated requests are rejected; requests outside family scope return `forbidden` (`56` §7, `123`).
- [ ] Timeline is append-only: a correction creates a new versioned event; the original is never mutated (verified by `timeline-append-only.test.ts` and `integrity/timeline-continuity.test.ts`).
- [ ] Every health-data operation produces an audit record; logs contain no PHI (`75`, `63`).
- [ ] ContentService refuses untyped/unsourced medical content (`52` BR-5).
- [ ] PregnancyEpisode stores LMP/EDD; GA is computed for display, not persisted redundantly (`13` §5).

## 9. Testing (see `214`)

- **Unit:** each service (auth token lifecycle, session expiry, timeline append/version, content typing refusal, GA computation).
- **Integration:** full auth flow (register→login→authorised call→logout); timeline append-only across service↔adapter.
- **Integrity:** timeline continuity invariant; append-only never mutates.
- **Security:** RBAC scope enforcement; no-PHI-in-logs assertion; rate-limit on register/login (`135`).
- **e2e:** register → set up pregnancy → see empty timeline (`131`).
- **a11y:** register/login/pregnancy-setup forms pass AA (`40`).

## 10. Risks

- R-1: Non-relational storage lets integrity drift (`52` R-1). Mitigation: adapter integrity enforcement + integrity tests (Task 7, §9).
- R-2: Business rules leaking into the client (`51` R-1). Mitigation: GA/trends computed server-authoritatively; client only displays (`51` BR-3).
- R-3: Session/token weaknesses (`122`). Mitigation: follow `57`/`122`; security tests.

## 11. Rollback

- Backend: repoint GAS web app to the prior deployment version (`60` §7). Frontend: redeploy prior build artifact. Data: dev/staging only (synthetic); if a bad migration to Sheets structure occurs, restore the environment spreadsheet from backup (`151`). No production release yet.

## 12. Definition of Done

Per `217`/`146`: MS-1.1 exit gate objectively met; unit/integration/integrity/security tests green; RBAC + audit + append-only verified; no PHI/secrets; a11y considered on auth flows; docs in sync; PR reviewed; deployable.

## 13. Dependencies

Depends on: Sprint 00 (boundaries, adapter, CI). Blocks: Sprints 02–05 (all lean on Auth/Timeline/Content/Audit + family/pregnancy graph — `203` §5).
