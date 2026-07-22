# 152 — Disaster Recovery

| Field | Value |
|---|---|
| Document | Disaster Recovery |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `151-BACKUP_RESTORE.md`, `docs/04-Architecture/62-BACKUP_STRATEGY.md`, `docs/09-Security/125-INCIDENT_RESPONSE.md` |

---

## 1. Purpose
Defines disaster recovery: how Wise Bloom Care recovers from major failures (data loss/corruption, platform outage, account/infra compromise), including recovery objectives (RPO/RTO) and procedures. Protecting the irreplaceable family health record is paramount.

## 2. Scope
DR scenarios, objectives, and recovery procedures. Backups/restore: `151`, `docs/04-Architecture/62`; incidents: `docs/09-Security/125`.

## 3. Recovery Objectives (proposed)
| Objective | Proposed target | Notes |
|---|---|---|
| RPO (max data loss) | ≤ 24h (aligned to daily backups; less near releases) | improve with more frequent backups / PITR on migration |
| RTO (max downtime) | best-effort for v1 (GAS/Sheets) | tightened on migration |
Final RPO/RTO set with stakeholders; drives backup frequency (`docs/04-Architecture/62`).

## 4. DR Scenarios & Procedures
| Scenario | Procedure |
|---|---|
| Data corruption/loss | Restore from verified backup + append-only log to a clean point (`151`); validate integrity; re-apply erasures |
| Production spreadsheet lost/inaccessible | Recreate from latest backup; re-point backend; verify |
| GAS backend outage | Redeploy/restore last good version (`docs/04-Architecture/60`); if platform-wide, communicate + wait/migrate |
| Account/infra compromise | Incident response (`docs/09-Security/125`): rotate secrets, revoke sessions, restore clean state |
| Provider (AI/OCR) outage | Degrade gracefully (safe mode); core record-keeping continues |
| Region/platform failure | Restore to alternative environment from backups (future cross-region) |

## 5. Continuity-Critical Recovery
- After any restore, **verify continuity invariants**: no duplicate/orphan children, immutable mother links intact, timeline continuous (integrity checks, `docs/04-Architecture/64`).
- The delivery-transition data path has a dedicated rollback (`150` §4).

## 6. DR Drills
- Periodic DR drills (restore + failover to staging) validate procedures and RPO/RTO.
- Findings update procedures and objectives.

## 7. Business Rules
- BR-1 RPO/RTO targets defined and drive backup frequency.
- BR-2 Recovery validates continuity invariants before going live.
- BR-3 Compromise recovery follows incident response (secret rotation, session revocation).
- BR-4 DR procedures are drilled periodically.
- BR-5 Erasures re-applied after any restore.

## 8. Edge Cases
Partial vs. full loss; simultaneous compromise + data loss; provider-wide outage (limited control; communicate); restore conflicting with in-flight writes (freeze during restore).

## 9. Acceptance Criteria
- [x] RPO/RTO (proposed) + DR scenarios/procedures defined.
- [x] Continuity-invariant verification on recovery.
- [x] DR drills + compromise handling.

## 10. Future Expansion
Cross-region redundancy, automated failover, PITR (database), tighter RTO, formal DR plan with named roles.

## 11. Dependencies
`151`, `docs/04-Architecture/62`, `64`, `60`, `docs/09-Security/125`, `docs/05-Data/74`, `77`, `150`.

## 12. Open Questions
- OQ-1 Final RPO/RTO targets.
- OQ-2 Alternative environment for region failover (pre-migration).

## 13. Risks
- R-1 Unrecoverable loss of the health record. Mitigation: verified backups + DR drills (BR-1/BR-4).
- R-2 Continuity broken on recovery. Mitigation: BR-2 invariant verification.
