# 64 — Monitoring

| Field | Value |
|---|---|
| Document | Monitoring & Observability |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `63-LOGGING.md`, `docs/12-Operations/150-RUNBOOK.md`, `docs/09-Security/125-INCIDENT_RESPONSE.md` |

---

## 1. Purpose

Defines how the health and behaviour of Wise Bloom Care are observed in production: the metrics tracked, alerting, uptime/availability, and how monitoring feeds runbooks and incident response — all without exposing sensitive data.

## 2. Scope

Availability, performance, error, security, and data-integrity monitoring and alerting. Logging: `63`. Runbooks: `docs/12-Operations/150`. Incident response: `docs/09-Security/125`.

## 3. What to Monitor

| Category | Signals |
|---|---|
| Availability | app uptime (`care.wisehomeopathy.com`), backend endpoint reachability, TLS/cert validity, domain expiry |
| Performance | API latency (esp. hot paths), frontend load metrics (NFR-1), Sheets call timing |
| Errors | error rate by endpoint/type, spikes, failed deploys |
| Capacity | GAS quota usage, Sheets size/row growth (RSK-9) |
| Security | auth failure spikes, rate-limit hits, anomalous access patterns |
| Data integrity | backup success, delivery-transition success (0 duplicate children), append-only invariant checks |

## 4. Key Health Indicators

- **Uptime/availability** of app + backend.
- **P50/P95 latency** on critical endpoints (login, timeline, vitals, delivery).
- **Error rate** overall and per endpoint.
- **Delivery-transition integrity:** count of duplicate/orphaned children = **0** (KPI M1) — alert on any nonzero.
- **Backup success** (daily + pre-release).
- **Quota headroom** (GAS/Sheets) — proactive migration signal.

## 5. Alerting

- Alerts on: availability drop, error-rate spike, latency breach, backup failure, cert/domain expiry approaching, quota nearing limits, security anomalies, and **any** delivery-integrity violation.
- Severity tiers routed to on-call; critical (data integrity, outage, security) escalate immediately (`docs/09-Security/125`).
- Alerts reference correlation IDs/metrics, never PHI (`63` BR-1).

## 6. Dashboards & Reporting

- Operational dashboard: availability, latency, errors, quota, backups.
- Security dashboard: auth anomalies, rate limiting, access patterns.
- Integrity dashboard: delivery-transition success, invariant checks.
- Periodic reliability review against KPIs (`docs/01-Product/10` §11).

## 7. Synthetic & Integrity Checks

- Synthetic uptime checks against key endpoints.
- Scheduled **integrity checks**: verify no orphaned/duplicate children, mother-link immutability, append-only invariants — alert on violation (proactive continuity assurance).
- Post-deploy smoke checks (`60`).

## 8. Feeding Operations

- Alerts link to runbooks (`docs/12-Operations/150`) with clear response steps.
- Data-integrity or security alerts trigger incident response (`125`).
- Trends inform capacity/migration decisions (RSK-9).

## 9. Business Rules

- BR-1: Availability, error, latency, backup, quota, security, and delivery-integrity are monitored with alerts.
- BR-2: Any delivery-transition integrity violation alerts immediately (continuity is sacred).
- BR-3: Monitoring/alerts contain no PHI.
- BR-4: Critical alerts route to on-call and, where relevant, incident response.
- BR-5: Backups and certs/domains are monitored for success/expiry.

## 10. Edge Cases

- GAS limits skew latency/availability → track quota separately; distinguish quota throttling from outages.
- False-positive integrity alert → runbook triage; never ignore integrity alerts by default.
- Monitoring outage → redundant/synthetic checks; alert on missing heartbeats.

## 11. Acceptance Criteria

- [x] Monitoring categories, KHIs, and alerts defined (incl. delivery-integrity = 0).
- [x] Dashboards, synthetic + integrity checks specified.
- [x] No-PHI and incident-response linkage stated.

## 12. Future Expansion

Full observability stack (metrics/traces) on migration; SLOs/error budgets; automated remediation; anomaly detection; status page for users.

## 13. Dependencies

`63`, `60`, `62`, `docs/12-Operations/150`, `docs/09-Security/125`, `docs/01-Product/10`.

## 14. Open Questions

- OQ-1: Monitoring tooling given GAS/Sheets (external synthetic checks + custom metrics).
- OQ-2: Formal SLO targets and error budgets.

## 15. Risks

- R-1: Silent data-integrity drift. Mitigation: BR-2 integrity checks/alerts.
- R-2: Undetected outage on constrained runtime. Mitigation: synthetic checks + heartbeats.
