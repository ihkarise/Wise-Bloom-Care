# 76 — Import / Export

| Field | Value |
|---|---|
| Document | Data Import & Export |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect |
| Last Updated | 2026-07-22 |
| Related | `72-FIELD_SPECIFICATIONS.md`, `73-VALIDATION_RULES.md`, `74-DATA_RETENTION.md`, `docs/09-Security/126-PRIVACY_POLICY.md` |

---

## 1. Purpose

Defines how users get their data out (export — a privacy right and trust feature) and in (import — for retrospective onboarding and portability). Export is a v1 requirement (PRD FR-27); import breadth grows over time. Both must respect security, validation, and the continuity model.

## 2. Scope

Export of the family record; import for onboarding/portability. Field formats: `72`; validation: `73`; privacy: `126`.

## 3. Export

### 3.1 Principles
- **User right:** the account holder can always export their full record (privacy P4; PRD FR-27; `74` BR-1).
- **Portable & human-readable:** structured (JSON) for portability + a human-readable summary (e.g., PDF) option.
- **Complete & continuous:** export reflects the one continuous record (pregnancy + child), preserving links and timeline order.
- **Secure:** exports are generated on authenticated request, delivered securely, and their creation is audited (`75`).

### 3.2 Contents
- Family graph: maternal record(s), pregnancy episode(s), child record(s) with links.
- Timeline events; vitals; appointments; medicines; reports metadata (+ media on request); growth; milestones; vaccinations; journal.
- Content typing/source refs preserved on any included educational content.
- Excludes: secrets, other families' data, raw audit log (a user-facing access summary may be offered separately).

### 3.3 Format
- Primary: JSON conforming to field specs (`72`).
- Optional: human-readable document (summary) — reports/media referenced or bundled per user choice.

## 4. Import

### 4.1 Purpose
- Retrospective onboarding (user joins mid-pregnancy or post-birth) and portability from an exported record.

### 4.2 Principles
- **Same validation as normal writes** (`73`) — no bypass.
- **Continuity-preserving:** imported data is attached to the single family record; imports never create duplicate profiles (Vision BR-V2); a delivery/child in imported data maps to child creation via the same rules.
- **Forgiving:** partial imports allowed; unresolved/invalid rows reported, not silently dropped.
- **Provenance:** imported events flagged with an `imported`/retrospective marker and timestamp of import (audit).

### 4.3 Sources (phased)
- v1: import from a Wise Bloom Care export (portability).
- v2+: structured import from common formats/booklets (best-effort), possibly assisted by OCR (`docs/07-AI/106`) — always user-reviewed, never auto-trusted for medical values.

## 5. Security & Privacy

- Export/import require authentication + authorisation; both are audited (`75`).
- Exports may contain highly-sensitive data → delivered over secure channels; user warned about handling their own export.
- Imports sanitised/validated (`73`), incl. formula-injection guards.
- No cross-family data leakage.

## 6. Business Rules

- BR-1: Account holder can export the full record at any time.
- BR-2: Imports pass full validation; no duplicate profiles created (continuity).
- BR-3: Imported data is marked with provenance and audited.
- BR-4: Export/import operations are authenticated, authorised, and audited.
- BR-5: Imported medical values from external/OCR sources are user-reviewed, never auto-trusted (`docs/02-Research/28`).

## 7. Edge Cases

- Conflicting import (data overlapping existing records) → surface conflicts; user resolves; versioning applied (`77`).
- Malformed/partial import → row-level error report; valid rows imported, invalid flagged.
- Large media in export → reference vs. bundle option; size limits.
- Import of a loss-path record → handled compassionately; no forced child.

## 8. Acceptance Criteria

- [x] Full-record export (JSON + optional human-readable) defined as a user right.
- [x] Import preserves continuity, passes validation, and marks provenance.
- [x] Security/privacy/audit and no-cross-family rules stated.
- [x] External/OCR values are user-reviewed, not auto-trusted.

## 9. Future Expansion

Standard health-data formats (e.g., FHIR export) for clinician portability; scheduled/automated backups-as-export; assisted import from booklets/photos (OCR); selective export.

## 10. Dependencies

`72`, `73`, `74`, `77`, `docs/07-AI/106`, `docs/09-Security/126`, `75`.

## 11. Open Questions

- OQ-1: Human-readable export format (PDF summary) scope in v1.
- OQ-2: FHIR/standard-format support timing.

## 12. Risks

- R-1: Duplicate profiles via import. Mitigation: BR-2 continuity rules.
- R-2: Trusting bad imported medical values. Mitigation: BR-5 user-review.
