# 74 — Data Retention

| Field | Value |
|---|---|
| Document | Data Retention & Deletion |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect / Database Architect |
| Last Updated | 2026-07-22 |
| Related | `75-AUDIT_LOGS.md`, `77-VERSIONING.md`, `docs/09-Security/126-PRIVACY_POLICY.md`, `docs/04-Architecture/62-BACKUP_STRATEGY.md` |

---

## 1. Purpose

Defines how long different data classes are retained, how deletion/erasure is handled (reconciling with append-only history and backups), and the privacy obligations behind these choices. The continuous health record is meant to last a lifetime — so retention is long by design, balanced against the user's right to erasure.

## 2. Scope

Retention durations, deletion/erasure mechanics, and their interaction with versioning (`77`), audit (`75`), and backups (`62`). Legal framing: `docs/09-Security/126`.

## 3. Retention Philosophy

- The family health record is **long-lived by intent** (continuity thesis) — users expect their history to persist for years.
- Retention is nonetheless **bounded by consent and law**: users can export and can request erasure (privacy-first, P4; `126`).
- Append-only history is preserved for integrity, but erasure obligations override where legally required.

## 4. Retention by Data Class (proposed)

| Data class | Default retention | Notes |
|---|---|---|
| Family health record (maternal/child, events, vitals, growth, etc.) | Retained for the life of the account; user-controlled | Core value; export always available |
| Media (reports, ultrasound, journal) | With the record; user-deletable | Private Drive refs |
| Audit log | Long retention per policy (e.g., ≥ regulatory minimum) | Append-only; access-controlled (`75`) |
| Operational logs | Short/medium (e.g., 30–90 days) | No PHI (`63`) |
| Backups | Rolling window (`62`) | Erasure reconciled within a defined window |
| Inactive/closed accounts | Grace period, then deletion per policy | User notified; export offered |

Exact durations finalised with the privacy/legal review for the launch jurisdiction (OQ-1).

## 5. Deletion & Erasure Mechanics

- **User-initiated deletion** of specific items: uses versioned soft-delete (a terminal, attributed version) to preserve integrity/audit, unless a full erasure is requested (`77`).
- **Right-to-erasure (account/record):** on a verified request, health data is removed from production and reconciled from backups within a defined window; audit records of the erasure itself are retained (metadata only) to prove compliance.
- **Loss-path data:** treated with special care; user controls whether to keep or remove; never force-deleted or force-retained.
- Deletion is authenticated, authorised, and audited.

## 6. Reconciling Append-Only, Backups, and Erasure

- Append-only + versioning give integrity and history for normal use.
- **Erasure is the deliberate exception:** it overrides append-only for the erased subject, removing content while retaining minimal, non-identifying audit proof of the action.
- Backups: erased data is purged from backups within the reconciliation window (`62` BR-5); backup retention windows are set with this in mind.

## 7. Business Rules

- BR-1: Users can always **export** their full record before deletion (`76`).
- BR-2: Verified **erasure** requests are honoured within a defined window, including backups.
- BR-3: Normal deletions are versioned soft-deletes (integrity-preserving); erasure is the explicit hard exception.
- BR-4: Erasure retains only non-identifying audit metadata proving the action.
- BR-5: Retention/erasure durations reconcile with the privacy policy and applicable law (`126`).

## 8. Edge Cases

- Erasure request from a caregiver vs. account holder → only the account holder (or legal authority) can erase the record; caregivers cannot.
- Shared family data (multiple children/caregivers) → erasure scoped carefully to avoid destroying others' legitimate records.
- Legal hold (if ever applicable) → may override erasure per law; documented.
- Backup restore after erasure → restore process must re-apply erasures (no resurrection of erased data).

## 9. Acceptance Criteria

- [x] Retention durations by data class (with legal finalisation deferred).
- [x] Deletion vs. erasure mechanics defined and reconciled with append-only + backups.
- [x] Export-before-delete and erasure-in-backups rules stated.

## 10. Future Expansion

Automated retention enforcement/jobs; per-jurisdiction retention profiles; legal-hold workflow; user-facing data-controls dashboard.

## 11. Dependencies

`75`, `77`, `76`, `62`, `docs/09-Security/126`.

## 12. Open Questions

- OQ-1: Exact retention durations per class + launch-jurisdiction law.
- OQ-2: Erasure reconciliation window length (aligns with `62` OQ-3).
- OQ-3: Handling of shared-record erasure boundaries.

## 13. Risks

- R-1: Non-compliant retention/erasure. Mitigation: BR-2/BR-5 legal reconciliation.
- R-2: Erased data resurrected via backup restore. Mitigation: §8 re-apply erasures.
