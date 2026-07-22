# 77 — Data Versioning

| Field | Value |
|---|---|
| Document | Data Versioning & Corrections |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect |
| Last Updated | 2026-07-22 |
| Related | `70-DATA_DICTIONARY.md`, `74-DATA_RETENTION.md`, `75-AUDIT_LOGS.md`, `docs/04-Architecture/55-DATABASE_MODEL.md` |

---

## 1. Purpose

Defines how data changes over time are handled so the timeline remains **append-only and continuous**: corrections create new versions rather than destroying history. This preserves trust, auditability, and the continuity thesis while still letting users fix mistakes. Also covers versioning of reference data (knowledge base, schedules) and the API/docs.

## 2. Scope

Versioning of user records (correctable entities), append-only entities (events/audit), and reference data. API/doc versioning is referenced but detailed in `docs/04-Architecture/56` and `docs/01-Product/16`.

## 3. Principles

- **Append-only timeline:** events are never edited/deleted in place (Vision BR-V3; Glossary forbids "delete an event").
- **Corrections are new, attributed versions:** who/when/what, preserving prior versions.
- **History is retrievable:** users/clinicians can see the correction trail.
- **Erasure is the deliberate exception** (privacy), overriding append-only for the erased subject (`74`).

## 4. Versioning Model for Correctable Records

- Correctable entities (e.g., a vital, an appointment, profile fields) carry a `version` and are updated via **new-version append**: the latest version is "current"; prior versions retained.
- Each version records `created_by`, `created_at`, and optionally a reason.
- The "current" view is the max-version; history is the full chain.
- Implementation on Sheets: version rows (append) with a current-flag/index; adapter maintains consistency under lock (`docs/04-Architecture/54`).

## 5. Append-Only Entities

- **Events** and **AuditRecords** are strictly append-only: a correction to what an event represents is a **new event** (e.g., a "correction" event referencing the original), never an in-place edit.
- This guarantees the timeline's integrity and the audit trail.

## 6. Soft-Delete vs. Erasure

- **Soft-delete:** a terminal, attributed version marking a record as removed from the active view while retaining history (default for user "delete" actions) — integrity-preserving.
- **Erasure:** the hard exception for privacy/legal erasure — removes content (incl. from backups within the window), retaining only non-identifying audit proof (`74` BR-3/BR-4).

## 7. Reference-Data Versioning (knowledge base & schedules)

- Knowledge base content and immunization schedules are **versioned independently** of product code (`docs/07-AI/101`, `docs/02-Research/24`).
- A product release **pins** the reference-data versions it ships (`docs/01-Product/16`).
- Content items carry a `version` + `source_ref`; updates create new versions with a changelog, enabling reproducibility of what a user saw.

## 8. Concurrency & Conflicts

- Concurrent edits (e.g., two caregivers) resolved by version append + audit; the API returns `409 conflict` when a stale version is submitted, prompting a merge/retry (`docs/04-Architecture/56` §11).
- Last-write becomes the new current version; nothing is lost (prior versions retained).

## 9. Business Rules

- BR-1: Timeline events and audit records are append-only; corrections are new versioned entries.
- BR-2: Correctable records use new-version append; prior versions retained and attributed.
- BR-3: "Delete" is a versioned soft-delete by default; erasure is the explicit privacy exception (`74`).
- BR-4: Reference data (KB, schedules) is versioned independently; releases pin versions.
- BR-5: Stale-version writes are rejected (`409`); no silent overwrite that loses history.

## 10. Edge Cases

- Correcting a value that fed a trend/percentile → recompute derived views from the corrected current version (derived, not stored, `55`).
- Correcting a delivery event → new versioned correction; child link immutability preserved (a correction cannot re-point `mother_id`).
- Erasure vs. version history → erasure removes the chain for the subject (exception), keeping audit proof.
- Reference-data update mid-use → users on a pinned version see consistent content until upgrade.

## 11. Acceptance Criteria

- [x] Append-only timeline + versioned corrections defined.
- [x] Soft-delete vs. erasure distinguished and reconciled with retention.
- [x] Reference-data independent versioning + release pinning specified.
- [x] Concurrency/conflict handling stated.

## 12. Future Expansion

Full temporal/bitemporal querying ("as of" views); user-visible correction history UI; automated recompute pipelines; content-version diffing for clinician review.

## 13. Dependencies

`70`, `74`, `75`, `docs/04-Architecture/54`, `55`, `56`, `docs/07-AI/101`, `docs/01-Product/16`.

## 14. Open Questions

- OQ-1: How much correction history to surface to users in v1.
- OQ-2: Bitemporal support (valid-time vs. transaction-time) — likely future.

## 15. Risks

- R-1: History loss via overwrite. Mitigation: BR-1/BR-2/BR-5 append + conflict rejection.
- R-2: Derived values stale after correction. Mitigation: compute-from-current (§10).
