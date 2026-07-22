# ADR-002 — Use Google Apps Script as the v1 Backend Runtime

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-07-22 |
| Deciders | Enterprise Architect, Backend Architect, DevOps Architect |
| Related | `docs/04-Architecture/53-GOOGLE_APPS_SCRIPT.md`, `52-BACKEND_ARCHITECTURE.md`, `ADR-001-Google-Sheets.md` |

---

## 1. Context
We need a v1 backend runtime that hosts the application layer (auth, validation, services, adapter) with minimal infrastructure, native access to Google Sheets (ADR-001), and privacy by default — while keeping the option to migrate the runtime later.

## 2. Decision
Implement the v1 backend as a **Google Apps Script (GAS) Web App** exposing the API contract, with the application-layer structure (controllers → services → storage adapter) defined in `docs/04-Architecture/52`. Business/continuity rules live in services; only the Sheets adapter touches `SpreadsheetApp`.

## 3. Rationale
- **No infra to manage**, native Sheets/Drive access, free-tier friendly, private by default.
- Fits the "start fast, migrate later" strategy; the API contract + adapter isolate GAS so it can be replaced.

## 4. Consequences
### Positive
- Rapid, low-cost, private backend for v1.
- Clean separation enabling later runtime migration.
### Negative / Risks
- **Quotas/execution limits/latency/concurrency** (no transactions) → mitigated by batching, caching, `LockService`, backoff, and a migration path (RSK-9, `docs/04-Architecture/53`).
- Limited tooling/observability vs. a full backend → structured logging + external monitoring (`docs/04-Architecture/63`, `64`).

## 5. Alternatives Considered
- **Serverless (Cloud Functions/Workers) + managed DB now:** more scalable/observable but adds infra/cost/setup; deferred to migration.
- **Node service on a PaaS:** similar trade-off; revisit at V3/migration.

## 6. Compliance & Safety Notes
- Secrets in Script Properties, never in code (`docs/09-Security/124`).
- Auth, RBAC, validation, rate limiting, audit enforced server-side (`docs/09-Security/*`).
- Versioned deployments enable rollback (`docs/04-Architecture/60`).

## 7. Review Trigger
Revisit when GAS quotas/latency bind, when observability/transactions become necessary, or at storage migration (likely coupled) → ADR for runtime migration.
