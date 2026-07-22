# 53 — Google Apps Script Backend

| Field | Value |
|---|---|
| Document | Google Apps Script Backend Design |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Backend Architect |
| Last Updated | 2026-07-22 |
| Related | `52-BACKEND_ARCHITECTURE.md`, `54-GOOGLE_SHEETS_SCHEMA.md`, `56-API_SPEC.md`, `docs/ADR/ADR-002-Apps-Script.md`, `docs/09-Security/124-SECRET_MANAGEMENT.md` |

---

## 1. Purpose

Details how the v1 backend is implemented on Google Apps Script (GAS): the web-app entry points, request handling, the Sheets adapter, quotas/limits and mitigations, security, and deployment. It is the concrete realisation of the application layer (`52`) for v1 — kept behind the adapter so it can be replaced.

## 2. Scope

GAS runtime specifics for v1. Storage schema: `54`. API contract: `56`. This document does not define business rules (those are in services, `52`).

## 3. Why Apps Script (v1)

Fast to start, no infra to manage, native Google Sheets access, free-tier friendly, private by default. Trade-offs (quotas, latency, concurrency) are accepted for v1 and mitigated by the adapter boundary enabling migration. Full rationale: `docs/ADR/ADR-002-Apps-Script.md`.

## 4. Runtime Model

- Deployed as a **Web App** exposing `doGet`/`doPost` entry points that route to controllers (`52`).
- Requests carry an auth token (`57`); controllers authorise, validate, rate-limit, dispatch to services.
- Services use the **Sheets Storage Adapter** (below) for persistence; `PropertiesService`/`CacheService` for config/cache; `LockService` for concurrency-sensitive writes.
- Secrets (API keys, signing secrets) in Script Properties, never in code (`docs/09-Security/124`).

## 5. Sheets Storage Adapter (v1 implementation)

- Implements the storage-adapter interface (`52` §5) over Google Sheets.
- Maps domain entities → sheet tabs (tables) and rows (records) per `54`.
- Encapsulates: key generation (UUIDs), append (for events), versioned updates, indexed lookups, batched range reads/writes.
- **Only** this adapter touches `SpreadsheetApp`; services never call Sheets APIs directly (`52` BR-1).

## 6. Quotas, Limits & Mitigations

GAS imposes execution-time, daily-call, and concurrency limits. Mitigations:
- **Batching:** read/write ranges in bulk, not cell-by-cell.
- **Caching:** `CacheService` for hot reads (e.g., schedules, knowledge index); invalidate on write.
- **Locking:** `LockService` around append/version to avoid race conditions (Sheets has no transactions).
- **Efficient queries:** maintain lightweight index tabs; avoid full-scan where possible.
- **Backoff/retry:** on transient Sheets/quota errors.
- **Escalation path:** when limits bind at scale, migrate the adapter to Postgres/Supabase (RSK-9, `52`).

## 7. Concurrency & Consistency

- Sheets is not transactional; the adapter uses `LockService` + append-only patterns + versioned updates to preserve integrity.
- Conflicting caregiver edits resolved by last-write + version history + audit (RSK-14).
- Idempotency keys on writes where feasible to tolerate retries.

## 8. Security

- All entry points require authentication; deployment restricts access appropriately.
- Input validation/sanitisation at controllers (`docs/05-Data/73`).
- Rate limiting per user/endpoint (`docs/09-Security/120`).
- Secrets in Script Properties; least-privilege on the Sheets/Drive resources.
- Audit logging via AuditService to a protected audit sheet (`docs/05-Data/75`).
- No PHI in logs/errors.

## 9. Deployment & Versioning

- Versioned GAS deployments (immutable deployment IDs) enable rollback (`docs/04-Architecture/60`, `docs/01-Product/16`).
- Source managed in the private repo (clasp-style workflow) — code review before deploy (`docs/11-Development/*`).
- Environments: dev/staging/prod separation via distinct deployments/spreadsheets (`docs/04-Architecture/60`).

## 10. Business Rules

- BR-1: Only the Sheets adapter calls `SpreadsheetApp`; services use the interface.
- BR-2: Secrets never in source; only Script Properties.
- BR-3: Concurrency-sensitive writes use `LockService`; events are append-only.
- BR-4: Every deployment is versioned and rollback-capable.
- BR-5: No PHI in logs or error messages.

## 11. Edge Cases

- Quota exhaustion mid-request → backoff/retry; user sees a calm retry state; critical writes are idempotent.
- Partial write failure → compensating logic + audit; delivery-path rollback runbook (`docs/12-Operations/150`).
- Cold-start latency → cache warm paths; keep payloads small.

## 12. Acceptance Criteria

- [x] GAS web-app runtime and routing defined.
- [x] Sheets adapter isolates all Sheets access.
- [x] Quotas/limits explicitly mitigated (batch/cache/lock/backoff/migrate).
- [x] Security, concurrency, deployment/rollback specified.

## 13. Future Expansion

Replace the Sheets adapter with a database adapter; migrate runtime to a dedicated service if GAS limits bind; add scheduled triggers for reminders/backups.

## 14. Dependencies

`52`, `54`, `56`, `57`, `docs/09-Security/124`, `docs/05-Data/75`, `docs/12-Operations/150`.

## 15. Open Questions

- OQ-1: Reminder scheduling via GAS time-driven triggers vs. client-side vs. external.
- OQ-2: Concrete quota headroom once load is estimated (RSK-9 SLOs).

## 16. Risks

- R-1: GAS limits/latency at scale. Mitigation: §6 + migration path.
- R-2: Race conditions without transactions. Mitigation: BR-3 locking + append-only.
