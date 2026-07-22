# 52 — Backend Architecture

| Field | Value |
|---|---|
| Document | Backend Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `50-SYSTEM_ARCHITECTURE.md`, `53-GOOGLE_APPS_SCRIPT.md`, `54-GOOGLE_SHEETS_SCHEMA.md`, `56-API_SPEC.md`, `docs/ADR/ADR-002-Apps-Script.md` |

---

## 1. Purpose

Specifies the backend architecture: the application layer's structure, the Storage Adapter abstraction that enables migration, domain services, and cross-cutting concerns. v1 runs on Google Apps Script over Google Sheets; the architecture is deliberately structured so the storage (and eventually the runtime) can be replaced without changing the API contract.

## 2. Scope

Application-layer design (services, adapter interface, validation, auth, audit) independent of the concrete storage. Apps Script specifics: `53`; Sheets schema: `54`; API endpoints: `56`.

## 3. Design Goals

- Migratability (NFR-6): storage behind an adapter interface.
- Single source of truth & continuity (P5, Vision invariants): enforced server-side.
- Security/privacy: auth, RBAC, validation, rate limiting, audit (`docs/09-Security/*`).
- Maintainability: domain services with single responsibility; no duplicated logic.

## 4. Application Layer Structure

```
API endpoints (56)  ─ request/response, versioned
  │
Controllers        ─ auth guard, input validation, rate limiting
  │
Domain services    ─ business rules (single source of truth):
  - AuthService, SessionService
  - FamilyService, MaternalService, ChildService
  - DeliveryService  (SOLE creator of child + immutable link)
  - TimelineService  (append-only, versioned events)
  - VitalsService, ReportsService, MedicinesService, AppointmentsService
  - GrowthService, MilestonesService, VaccinationService
  - TrendService / PredictionService (surfacing only)
  - ContentService   (content typing + source refs)
  - AIService        (guardrailed; docs/07-AI)
  - AuditService     (every health-data access)
  │
Storage Adapter interface  ─ CRUD + query for domain entities
  │
Adapter impl (v1: Sheets) │ Adapter impl (future: Postgres/Supabase/Firebase)
```

## 5. The Storage Adapter Interface (migration key)

- A storage-neutral interface exposing domain-entity operations: `create`, `get`, `query`, `update` (append/version semantics), `list`, with transactional/consistency guarantees expressed at the service level.
- The interface speaks in **domain entities** (Family, Maternal, Child, Event, Vital, …), not spreadsheet ranges.
- v1 adapter maps entities → Sheets tabs/rows (`54`); a future adapter maps entities → SQL/BaaS (`55` is storage-neutral).
- Services depend on the interface only (system BR-2).

## 6. Domain Services & Invariants

- **DeliveryService** is the only creator of a Child record and writes the immutable `mother_id` link (Vision BR-V2); supports multiple births and the compassionate loss path (no forced child).
- **TimelineService** guarantees append-only; corrections are new versioned events (`docs/05-Data/77`).
- **TrendService/PredictionService** compute current/previous/trend/prediction; never diagnose (surfacing only).
- **ContentService** attaches `content_type` + `source_ref`; refuses to serve untyped medical content (`docs/02-Research/28`).
- **AIService** always passes output through guardrails (`docs/07-AI/105`).

## 7. Cross-Cutting

- **Auth/session:** every request authenticated; RBAC checks per resource (`57`, `docs/09-Security/123`).
- **Validation:** all input validated/sanitised at the controller (`docs/05-Data/73`).
- **Rate limiting:** per-user/endpoint (`docs/09-Security/120`).
- **Audit:** AuditService logs who/what/when for health-data access (`docs/05-Data/75`).
- **Logging/monitoring:** structured logs; metrics (`63`, `64`).
- **Idempotency & concurrency:** write operations are idempotent where feasible; concurrent edits resolved via versioning + audit (RSK-14).

## 8. Error Handling

- Consistent error contract (codes, safe messages) at the API (`56`); never leak internals or PHI in errors.
- Fail closed on auth/authorization; fail safe on non-critical reads.

## 9. Business Rules

- BR-1: Services depend on the Storage Adapter interface, never on Sheets/Apps Script APIs directly.
- BR-2: Continuity/business invariants are enforced in services (server-authoritative).
- BR-3: DeliveryService is the sole creator of Child records.
- BR-4: Every health-data operation is authorised and audited.
- BR-5: No untyped/unsourced medical content leaves ContentService.

## 10. Edge Cases & Constraints

- **Apps Script execution limits / quotas:** batch reads/writes; cache; keep services efficient; the adapter enables migration when limits bind (RSK-9, `53`).
- **Sheets lacks relational constraints:** services enforce keys, uniqueness, links, and append-only (`54`, `55`).
- **Partial failures:** services use compensating logic and audit; the delivery transition has an explicit rollback runbook (`docs/12-Operations/150`).
- **Retrospective/partial data:** services accept partial records (P9) without breaking invariants.

## 11. Acceptance Criteria

- [x] Application layer structured into controllers + domain services + adapter.
- [x] Storage Adapter interface defined as the migration boundary.
- [x] Continuity invariants (delivery sole-creator, append-only) owned by services.
- [x] Cross-cutting (auth, validation, rate limiting, audit) specified.
- [x] Apps Script/Sheets constraints handled.

## 12. Future Expansion

Swap adapter to Postgres/Supabase/Firebase/Cloud SQL; potentially migrate the runtime off Apps Script to a dedicated service while keeping the API contract; add background jobs (reminders) and queues.

## 13. Dependencies

`50`, `53`, `54`, `55`, `56`, `57`, `docs/05-Data/*`, `docs/09-Security/*`, `docs/07-AI/105`.

## 14. Open Questions

- OQ-1: Transaction/consistency guarantees achievable on Sheets vs. needed by services.
- OQ-2: When to migrate runtime (not just storage) off Apps Script.

## 15. Risks

- R-1: Integrity gaps due to non-relational storage. Mitigation: BR-2 service-enforced integrity + tests.
- R-2: Apps Script limits. Mitigation: batching/caching + adapter migration path.
