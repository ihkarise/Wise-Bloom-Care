# 62 — Backup Strategy

| Field | Value |
|---|---|
| Document | Backup Strategy |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `54-GOOGLE_SHEETS_SCHEMA.md`, `docs/12-Operations/151-BACKUP_RESTORE.md`, `docs/12-Operations/152-DISASTER_RECOVERY.md`, `docs/05-Data/74-DATA_RETENTION.md` |

---

## 1. Purpose

Defines how Wise Bloom Care protects data against loss or corruption via backups, including scope, frequency, retention, integrity, and security of backups. Given the irreplaceable nature of a family's continuous health record, data durability is a top-priority requirement (RSK-3).

## 2. Scope

Backup of the storage layer (Sheets data + Drive media), knowledge base, and configuration. Restore procedures: `docs/12-Operations/151`; DR: `152`. Retention policy alignment: `docs/05-Data/74`.

## 3. What Is Backed Up

| Asset | Contents | Priority |
|---|---|---|
| Sheets data | all tables/tabs (`54`) — the family records, events, audit | Critical |
| Drive media | reports, ultrasound images, journal media | Critical |
| Knowledge base | versioned MD content | High (also in git) |
| Config | schedules dataset, non-secret config | High |
| Secrets | NOT in backups; managed separately (`124`) | — |

## 4. Backup Approach

- **Automated periodic snapshots** of the production spreadsheet (e.g., scheduled export/copy to a separate, access-restricted Drive location) — frequency per §5.
- **Media:** Drive versioning + periodic snapshot copies of the media folder.
- **Knowledge base & docs:** version-controlled in git (private repo) — inherent history.
- **Append-only advantage:** `events`/`audit_log` are append-only, so backups + the log enable point-in-time reconstruction.

## 5. Frequency & Retention (proposed)

| Asset | Frequency | Retention |
|---|---|---|
| Sheets data snapshot | daily (min); before each release | rolling 30 days + monthly for 12 months (proposed) |
| Media snapshot | daily/weekly | aligned with data |
| Pre-release backup | every release | retained through the release window |

Final RPO/RTO targets: `docs/12-Operations/152`. Retention must reconcile with privacy/retention policy (`docs/05-Data/74`) and data-subject erasure obligations.

## 6. Integrity & Verification

- Backups are **verified** (restorable) — a backup that can't be restored is not a backup.
- Periodic **restore drills** to staging (`docs/12-Operations/151`).
- Backups checked for completeness (row counts / checksums where feasible).
- **Pre-release backup verification is a release exit-gate item** (`docs/01-Product/16`).

## 7. Security of Backups

- Backups are as sensitive as production data → access-restricted, encrypted at rest (provider), audited access (`58`, `121`).
- Backups never placed in public or lower-trust locations.
- Erasure requests must also address backups within a defined window (`docs/05-Data/74`, `126`).

## 8. Business Rules

- BR-1: Production data and media are backed up at least daily and before every release.
- BR-2: Backups are verified restorable via periodic drills.
- BR-3: Backups are access-restricted, encrypted at rest, and audited; never public.
- BR-4: Secrets are excluded from backups (managed separately).
- BR-5: Erasure obligations extend to backups within the policy window.

## 9. Edge Cases

- GAS quota limits on export → batch/schedule; monitor (`53`).
- Large media growth → tiered/less-frequent full snapshots + Drive versioning.
- Corruption discovered late → point-in-time restore via snapshot + append-only log.
- Erasure vs. backups tension → documented reconciliation window (`74`).

## 10. Acceptance Criteria

- [x] Backup scope, frequency, retention defined (with final RPO/RTO deferred to DR).
- [x] Integrity verification + restore drills mandated; pre-release backup gate.
- [x] Backup security and secret-exclusion stated.
- [x] Erasure/retention reconciliation addressed.

## 11. Future Expansion

Automated continuous backup on a database backend (PITR), cross-region copies, immutable/WORM backups, automated DR failover, and monitored backup SLAs.

## 12. Dependencies

`54`, `docs/12-Operations/151`, `152`, `docs/05-Data/74`, `docs/09-Security/121`, `126`, `docs/01-Product/16`.

## 13. Open Questions

- OQ-1: Final RPO/RTO targets (DR).
- OQ-2: Backup destination/tooling specifics on GAS/Sheets.
- OQ-3: Erasure-vs-backup reconciliation window length.

## 14. Risks

- R-1: Unrecoverable data loss. Mitigation: verified daily + pre-release backups, drills (BR-1/BR-2).
- R-2: Backup exposure. Mitigation: BR-3 security.
