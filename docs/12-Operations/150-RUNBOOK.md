# 150 — Operations Runbook

| Field | Value |
|---|---|
| Document | Operations Runbook |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `151-BACKUP_RESTORE.md`, `152-DISASTER_RECOVERY.md`, `docs/04-Architecture/64-MONITORING.md`, `docs/09-Security/125-INCIDENT_RESPONSE.md` |

---

## 1. Purpose
The operational runbook: step-by-step procedures for running Wise Bloom Care in production — responding to alerts, common operational tasks, and the critical delivery-transition rollback. It turns monitoring signals into actions.

## 2. Scope
Runbook procedures for alerts and routine ops. Backups: `151`; DR: `152`; security incidents: `docs/09-Security/125`.

## 3. Alert Response (from monitoring `docs/04-Architecture/64`)
| Alert | First actions |
|---|---|
| App/backend down | Check host/GAS deployment; verify TLS/domain; roll back last deploy if correlated (`docs/04-Architecture/60`) |
| Error-rate spike | Identify endpoint via correlation IDs; check recent deploy; roll back if needed |
| Latency breach | Check GAS quota/latency; caching; consider throttling; assess migration threshold |
| Quota nearing limit | Reduce load/batch; evaluate storage migration (RSK-9) |
| Backup failure | Investigate; re-run backup; do not release until backups verified (`151`) |
| Cert/domain expiry | Renew (auto/manual); verify TLS (`docs/04-Architecture/61`) |
| Security anomaly | Trigger incident response (`docs/09-Security/125`) |
| **Delivery-integrity violation** | **Treat as critical — see §4** |

## 4. Delivery-Transition Rollback (critical)
The delivery transition is the keystone (`docs/08-Timeline/111`). If an integrity alert fires (duplicate/orphan child, broken link):
1. **Contain:** halt further affected operations if needed; capture state.
2. **Diagnose:** use audit log (`docs/05-Data/75`) + correlation IDs to find the faulty operation.
3. **Correct:** using versioning (`docs/05-Data/77`), reconcile to a single linked child; never destroy history; the immutable mother link must be preserved/restored correctly.
4. **Restore if needed:** from backup (`151`) if data is lost/corrupted.
5. **Verify:** integrity checks pass (0 duplicate/orphan); timeline continuous.
6. **Post-incident:** root-cause; add regression test (`docs/10-Testing/136`); update threat model/register.

## 5. Routine Tasks
- Deploys/rollbacks (`docs/04-Architecture/60`).
- Backup verification + restore drills (`151`).
- Secret rotation (`docs/09-Security/124`).
- Knowledge-base/schedule updates (re-verify sources; version pin) (`docs/02-Research/24`, `27`).
- Monitoring/threshold tuning (`docs/04-Architecture/64`).

## 6. Business Rules
- BR-1 Every critical alert has a runbook procedure.
- BR-2 Delivery-integrity violations are handled as critical with the §4 procedure (never ignored).
- BR-3 Corrections preserve history (versioning); mother link immutability upheld.
- BR-4 Do not release with unverified backups.
- BR-5 Security anomalies route to incident response.

## 7. Edge Cases
Simultaneous alerts (prioritise by severity); GAS throttling vs. outage (distinguish); partial-write recovery (compensate + audit); rollback during active use (communicate; minimise disruption).

## 8. Acceptance Criteria
- [x] Alert→action procedures defined.
- [x] Critical delivery-transition rollback procedure specified.
- [x] Routine ops tasks listed; incident linkage.

## 9. Future Expansion
Automated remediation, on-call rotation, runbook automation, status page, chaos drills.

## 10. Dependencies
`151`, `152`, `docs/04-Architecture/60`, `64`, `docs/05-Data/75`, `77`, `docs/09-Security/124`, `125`, `docs/10-Testing/136`.

## 11. Open Questions
- OQ-1 On-call staffing/rotation.
- OQ-2 Which procedures to automate first.

## 12. Risks
- R-1 Mishandled continuity incident. Mitigation: BR-2 §4 procedure.
- R-2 Release without backups. Mitigation: BR-4.
