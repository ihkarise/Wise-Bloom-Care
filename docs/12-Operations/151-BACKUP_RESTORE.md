# 151 — Backup & Restore

| Field | Value |
|---|---|
| Document | Backup & Restore Procedures |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/04-Architecture/62-BACKUP_STRATEGY.md`, `152-DISASTER_RECOVERY.md`, `docs/05-Data/74-DATA_RETENTION.md` |

---

## 1. Purpose
The operational procedures for taking, verifying, and restoring backups — turning the backup strategy (`docs/04-Architecture/62`) into concrete steps, including restore drills that prove backups actually work.

## 2. Scope
Backup execution, verification, and restore procedures. Strategy/retention: `docs/04-Architecture/62`, `docs/05-Data/74`; DR: `152`.

## 3. Backup Procedures
- **Sheets data:** automated snapshot/export of the production spreadsheet to a separate, access-restricted, encrypted Drive location (daily minimum + before every release) (`docs/04-Architecture/62`).
- **Media:** Drive versioning + periodic snapshot of the media folder.
- **Knowledge base/docs:** git history (private repo).
- Record each backup (timestamp, scope, success) for monitoring (`docs/04-Architecture/64`).

## 4. Verification
- After each backup: completeness check (row counts/checksums where feasible).
- **Restore drills:** periodically restore a backup to staging and validate integrity (records, links, timeline continuity) — a backup that can't be restored is not a backup.
- **Pre-release backup verification is a release exit-gate item** (`docs/01-Product/16`).

## 5. Restore Procedures
1. Identify the target restore point (snapshot + append-only log for point-in-time where possible).
2. Restore to a **staging** environment first; validate integrity (no duplicate/orphan children; mother links intact; timeline continuous).
3. For production restore: contain, communicate, restore, re-verify; **re-apply any erasures** so erased data is not resurrected (`docs/05-Data/74` §8).
4. Post-restore: integrity checks + monitoring confirm health.

## 6. Security of Backups
- Backups are as sensitive as prod: access-restricted, encrypted at rest, audited; never public (`docs/04-Architecture/62` BR-3).
- Secrets excluded from backups (`docs/09-Security/124`).

## 7. Business Rules
- BR-1 Backups run at least daily + before every release; recorded/monitored.
- BR-2 Backups are verified restorable via periodic drills.
- BR-3 Restores validate integrity (continuity invariants) before going live.
- BR-4 Erasures re-applied after restore (no resurrection of erased data).
- BR-5 Backups are access-restricted, encrypted, audited; secrets excluded.

## 8. Edge Cases
Partial/corrupt backup (use prior good + append-only log); large media restore (staged); GAS export limits (batch/schedule); restore during incident (coordinate with `docs/09-Security/125`); erasure-vs-restore tension (§5 re-apply).

## 9. Acceptance Criteria
- [x] Backup + verification + restore procedures defined.
- [x] Restore drills + pre-release verification gate.
- [x] Integrity validation + erasure re-application on restore.

## 10. Future Expansion
Automated PITR on database backend; cross-region copies; automated restore-drill scheduling; immutable/WORM backups.

## 11. Dependencies
`docs/04-Architecture/62`, `64`, `152`, `docs/05-Data/74`, `77`, `docs/09-Security/124`, `125`, `docs/01-Product/16`.

## 12. Open Questions
- OQ-1 Restore-drill frequency.
- OQ-2 Backup tooling specifics on GAS/Sheets.

## 13. Risks
- R-1 Unusable backups. Mitigation: BR-2 drills.
- R-2 Erased data resurrected. Mitigation: BR-4 re-apply erasures.
