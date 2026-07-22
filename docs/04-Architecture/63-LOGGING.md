# 63 — Logging

| Field | Value |
|---|---|
| Document | Logging |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect / Security Architect |
| Last Updated | 2026-07-22 |
| Related | `64-MONITORING.md`, `docs/05-Data/75-AUDIT_LOGS.md`, `docs/09-Security/*` |

---

## 1. Purpose

Defines the logging strategy: what is logged, at what level, where, and — critically — the strict rules preventing sensitive health data (PHI) from appearing in logs. Distinguishes **operational logs** (diagnostics) from **audit logs** (security/compliance record of health-data access, owned by `docs/05-Data/75`).

## 2. Scope

Operational/application logging and its privacy constraints. The audit log is specified in `docs/05-Data/75`; this doc references but does not redefine it.

## 3. Log Types

| Type | Purpose | PHI allowed? | Home |
|---|---|---|---|
| Operational | debugging, errors, performance | **No** | app logs (GAS/host) |
| Audit | who accessed/changed health data, when | metadata only, no content | protected audit store (`75`) |
| Access/security | auth events, rate-limit hits, anomalies | no PHI | security logs |

## 4. What to Log (operational)

- Request metadata: endpoint, method, status, latency, correlation/trace ID, user **id** (not PHI), environment.
- Errors: type, code, stack (server-side only), correlation ID — **no PHI, no payload contents**.
- Performance: timings for hot paths (Sheets calls, service ops).
- System events: deploys, config changes, backup runs.

## 5. What NOT to Log (hard rules)

- **No PHI / highly-sensitive data:** no vitals values, report contents, names, DOBs, medical text, media, or anything that identifies a person's health state.
- No secrets/tokens/credentials.
- No full request/response bodies for health endpoints.
- Errors reference correlation IDs, not sensitive payloads.

## 6. Levels & Structure

- Levels: `error`, `warn`, `info`, `debug` (debug off in prod).
- **Structured** logs (key-value/JSON-like) with correlation IDs for tracing across a request.
- Consistent schema enabling monitoring/alerting (`64`).

## 7. Retention & Access

- Operational logs: short-to-medium retention; access-restricted; not public.
- Audit logs: longer retention per policy (`75`, `docs/05-Data/74`); append-only; strictly access-controlled.
- Log access is itself restricted and, for audit logs, auditable.

## 8. Correlation & Tracing

- Each request carries a correlation ID (client→API→services→adapter) to trace issues without exposing PHI.
- Enables debugging the delivery transition and other critical paths safely.

## 9. Business Rules

- BR-1: No PHI, secrets, or sensitive payloads in operational logs — ever.
- BR-2: Errors log correlation IDs + safe context, not sensitive data.
- BR-3: Operational logs are separate from the audit log (`75`).
- BR-4: Debug logging disabled in production.
- BR-5: Log stores are access-restricted; audit logs append-only and auditable.

## 10. Edge Cases

- A bug tempts logging a payload to debug → forbidden; reproduce with synthetic data instead.
- GAS logging limits → log selectively; ship key metrics to monitoring (`64`).
- Correlating a user issue → use user id + correlation ID, never health content.

## 11. Acceptance Criteria

- [x] Operational vs. audit logging distinguished.
- [x] What-to-log and hard no-PHI rules defined.
- [x] Structure, levels, correlation, retention/access specified.

## 12. Future Expansion

Centralised log aggregation/observability platform on migration; distributed tracing; log-based anomaly detection; PHI-safe log scrubbing tooling.

## 13. Dependencies

`64`, `docs/05-Data/75`, `74`, `docs/09-Security/*`.

## 14. Open Questions

- OQ-1: Log aggregation tooling given GAS constraints.
- OQ-2: Operational-log retention duration.

## 15. Risks

- R-1: PHI leaking into logs. Mitigation: BR-1/BR-2 + reviews + scrubbing.
- R-2: Losing traceability. Mitigation: correlation IDs (§8).
