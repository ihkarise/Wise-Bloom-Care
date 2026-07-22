# 56 — API Specification (Contract)

| Field | Value |
|---|---|
| Document | API Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | API Architect |
| Last Updated | 2026-07-22 |
| Related | `50-SYSTEM_ARCHITECTURE.md`, `52-BACKEND_ARCHITECTURE.md`, `57-AUTH_FLOW.md`, `docs/05-Data/*` |

---

## 1. Purpose

Defines the **stable, versioned API contract** between the client and backend — the single boundary that makes the storage engine an implementation detail (NFR-6). The contract is expressed in domain terms and must not change when the backend storage/runtime changes. This document specifies conventions, resources, and representative endpoints; exact payloads derive from the data model (`55`) and field specs (`docs/05-Data/72`).

## 2. Scope

Contract conventions and resource/endpoint catalogue at design level. Concrete request/response JSON schemas are derived from `docs/05-Data/72` and finalised in implementation, kept backward-compatible per §9.

## 3. Conventions

- **Style:** resource-oriented (REST-like) over HTTPS; JSON payloads. (On GAS, realised via `doGet`/`doPost` routing to these logical endpoints; the logical contract is what the client depends on.)
- **Versioning:** version prefix (e.g., `/v1/…`); breaking changes → new version (§9).
- **Auth:** bearer token on every request (`57`); unauthenticated requests rejected.
- **IDs:** opaque UUID strings.
- **Errors:** consistent envelope `{ error: { code, message, details? } }`; safe messages, no PHI/internals.
- **Pagination:** cursor-based for lists (timeline, measurements).
- **Idempotency:** write endpoints accept an idempotency key.
- **Content typing:** any medical content in responses includes `content_type` + `source_ref` (`docs/02-Research/28`).

## 4. Resource Catalogue

Family-scoped resources (all require authorisation to the family):

| Resource | Meaning |
|---|---|
| `/v1/auth/*` | register, login, logout, session refresh |
| `/v1/family` | the family record graph |
| `/v1/maternal` | maternal record(s) |
| `/v1/children` | child records |
| `/v1/timeline` | continuous event stream (read) |
| `/v1/vitals` | BP/weight/blood sugar |
| `/v1/appointments` | appointments |
| `/v1/medicines` | medicines/reminders |
| `/v1/reports` | lab/ultrasound (metadata + media refs) |
| `/v1/delivery` | delivery event (transition) |
| `/v1/growth` | WHO growth measurements |
| `/v1/milestones` | CDC milestones |
| `/v1/vaccinations` | immunization records |
| `/v1/journal` | journal entries |
| `/v1/family/access` | caregiver grants (RBAC) |
| `/v1/notifications` | reminders/alerts |
| `/v1/content` | knowledge/content items (typed, sourced) |
| `/v1/ai/*` | educational AI (v2; guardrailed) |
| `/v1/export` | data export |

## 5. Representative Endpoints

| Method | Path | Purpose | Notes |
|---|---|---|---|
| POST | `/v1/auth/register` | create account | rate-limited; disclaimer ack |
| POST | `/v1/auth/login` | authenticate | returns token |
| GET | `/v1/timeline?cursor=` | continuous timeline | paginated; spans pregnancy+child |
| POST | `/v1/vitals` | log a vital | returns event + trend |
| GET | `/v1/vitals?type=bp` | vital series | for charts |
| POST | `/v1/delivery` | record delivery | **creates linked child(ren)**; idempotent; sole creator |
| GET | `/v1/children` | list children | linked to mother |
| POST | `/v1/growth` | add measurement | returns percentile/z (computed) |
| GET | `/v1/milestones?child=` | milestone status | non-diagnostic |
| POST | `/v1/vaccinations` | record dose | status given/skipped/deferred |
| POST | `/v1/family/access` | grant caregiver | explicit, audited |
| DELETE | `/v1/family/access/{id}` | revoke caregiver | immediate; audited |
| POST | `/v1/ai/explain` | explain a report (v2) | guardrailed; educational-typed |

## 6. The Delivery Endpoint (keystone)

`POST /v1/delivery` is the transition contract:
- Input: delivery details (mode, GA-at-birth, birth metrics, Apgar), one or more newborns (multiple births), or a loss outcome.
- Behaviour: on a live birth, atomically creates ChildRecord(s) with immutable `mother` link and a delivery Event; the timeline continues. On loss, records the compassionate terminal state **without** creating a child (BR-7).
- Guarantees: idempotent (no duplicate children on retry); sole creator of children (Vision BR-V2).

## 7. Security & Authorisation

- Every endpoint authenticates (`57`) and authorises against family/role scope (`docs/09-Security/123`).
- Input validated/sanitised (`docs/05-Data/73`); rate limited (`docs/09-Security/120`).
- All health-data access audited (`docs/05-Data/75`).
- Media served via short-lived, backend-mediated references — never public links.

## 8. Errors

Standard codes: `unauthenticated`, `forbidden`, `not_found`, `validation_failed`, `conflict` (e.g., idempotency/version), `rate_limited`, `server_error`. Messages are safe and actionable; no PHI.

## 9. Versioning & Compatibility (contract stability)

- Backward-compatible changes (additive fields) don't bump the version.
- Breaking changes introduce `/v2/…` and support a deprecation window.
- **Storage/runtime changes MUST NOT alter the contract** (NFR-6) — this is the migration guarantee.

## 10. Business Rules

- BR-1: The contract is storage-neutral; no endpoint exposes Sheets/DB specifics.
- BR-2: `POST /v1/delivery` is the only endpoint that creates child records; it is idempotent.
- BR-3: Timeline is read as one continuous stream spanning pregnancy and child subjects.
- BR-4: Medical content in responses is always typed + sourced.
- BR-5: Every endpoint authenticates, authorises, validates, rate-limits, and audits health-data access.

## 11. Edge Cases

- Retry of delivery → idempotency prevents duplicate children.
- Concurrent writes → version/conflict handling (`409 conflict`).
- Partial data (retrospective) → endpoints accept partial payloads (P9).
- Revoked caregiver mid-session → subsequent requests `forbidden`.

## 12. Acceptance Criteria

- [x] Conventions (versioning, auth, errors, pagination, idempotency, content typing) defined.
- [x] Resource catalogue + representative endpoints listed.
- [x] Delivery keystone contract specified (idempotent, sole creator, loss-safe).
- [x] Contract-stability/migration guarantee stated.

## 13. Future Expansion

Formalise as OpenAPI; add AI endpoints (v2), offline sync/delta endpoints (v3), clinician-portal endpoints, webhooks; codegen typed clients.

## 14. Dependencies

`50`, `52`, `55`, `57`, `docs/05-Data/72`, `73`, `75`, `docs/09-Security/*`, `docs/02-Research/28`.

## 15. Open Questions

- OQ-1: OpenAPI authoring now vs. at implementation.
- OQ-2: Exact pagination/idempotency header conventions.

## 16. Risks

- R-1: Contract leaking storage specifics. Mitigation: BR-1 storage-neutral review.
- R-2: Duplicate children on delivery retry. Mitigation: BR-2 idempotency.
