# 73 — Validation Rules

| Field | Value |
|---|---|
| Document | Validation Rules |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect / QA Architect |
| Last Updated | 2026-07-22 |
| Related | `72-FIELD_SPECIFICATIONS.md`, `docs/04-Architecture/56-API_SPEC.md`, `docs/09-Security/120-THREAT_MODEL.md` |

---

## 1. Purpose

Defines input validation and data-quality rules enforced server-side (and mirrored client-side for UX). Validation protects integrity and security (injection/abuse) and improves data quality — while remaining **forgiving** (Principle P9): it must never block the journey on non-critical fields.

## 2. Scope

Server-authoritative validation for all writes; plausibility checks for health values (quality, not diagnosis). Types/units: `72`. Security context: `docs/09-Security/120`.

## 3. Principles

- **Server-authoritative:** the API validates every write; client validation is UX-only, never the security boundary.
- **Forgiving:** allow partial/retrospective data; distinguish *required-for-integrity* from *nice-to-have*.
- **Plausibility, not diagnosis:** flag implausible values for user confirmation; never interpret medically (`docs/02-Research/28`).
- **Fail safe:** reject unsafe/malformed input; return clear, safe errors (`56` §8).

## 4. Structural Validation

- Types/formats/enums per `72`; unknown enum values rejected.
- Required-for-integrity fields: PKs, FKs (must resolve), `child.mother_id` on child creation, `content_type`+`source_ref` on medical content.
- UUID format; ISO dates/datetimes; UTC.
- String length bounds; reject control/injection characters; sanitise before storage/render.

## 5. Referential Validation

- FK targets must exist (adapter-enforced, `54` §5).
- `mother_id` immutable — reject updates.
- Events/Audit append-only — reject in-place edits (corrections are new versions, `77`).

## 6. Plausibility (health values — quality checks, NOT diagnosis)

Values outside plausible physical ranges are flagged for **user confirmation/correction**, not medical interpretation:

| Field | Plausibility flag (confirm if outside) | Note |
|---|---|---|
| bp_systolic | ~60–260 mmHg | outside → likely typo; confirm |
| bp_diastolic | ~30–160 mmHg | paired sanity: systolic > diastolic |
| weight (adult) | ~30–250 kg | typo guard |
| blood_sugar | ~20–600 mg/dL | typo guard |
| infant weight | ~0.3–30 kg | age-plausible; typo guard |
| dob/measured_at | not in the future; within plausible window | reject future timestamps |

> These are **data-entry sanity checks**, explicitly not clinical thresholds; the app never diagnoses from them (`docs/02-Research/21`, `28`).

## 7. Business/Continuity Validation

- Delivery creating child(ren): requires a PregnancyEpisode; sets immutable mother link; idempotent (no duplicates) (`docs/04-Architecture/56` §6).
- Loss outcome: valid terminal episode state **without** a child.
- Vaccination/milestone: codes must resolve to the active schedule/CDC set.
- Caregiver grant: valid user + scope; revocation immediate.

## 8. Security Validation

- Sanitise all input; prevent injection into Sheets formulas (e.g., neutralise leading `=`,`+`,`-`,`@` in stored strings — CSV/formula-injection guard), scripts, or logs.
- Enforce rate limits and payload size caps (`docs/09-Security/120`).
- Reject requests failing auth/authorisation before validation (fail closed).

## 9. Error Feedback

- Clear, calm, field-linked errors (UX, `docs/03-UX/40`); safe messages (no PHI/internals).
- Distinguish "please check this value" (plausibility) from "required" (integrity).

## 10. Business Rules

- BR-1: All writes validated server-side; client validation is non-authoritative.
- BR-2: Integrity-required fields enforced; non-critical fields optional (forgiving).
- BR-3: Plausibility checks flag, they never diagnose.
- BR-4: Append-only/immutability enforced (Events, Audit, mother link).
- BR-5: Input sanitised against injection (incl. spreadsheet formula injection).

## 11. Edge Cases

- Retrospective entry (past dates) → allowed; future dates rejected.
- Partial data (unknown LMP) → allowed; GA simply not computed until known.
- Bulk/import data → same validation applies (`76`).
- Locale number formats → normalised before validation.

## 12. Acceptance Criteria

- [x] Structural, referential, plausibility, business, and security validation defined.
- [x] Forgiving (partial/retrospective) yet integrity-preserving.
- [x] Plausibility explicitly non-diagnostic.
- [x] Injection (incl. formula-injection) guarded.

## 13. Future Expansion

Shared validation schemas (JSON Schema) generated from `72`; richer age/context-aware plausibility; import validation reports.

## 14. Dependencies

`72`, `docs/04-Architecture/54`, `56`, `77`, `docs/09-Security/120`, `docs/02-Research/28`.

## 15. Open Questions

- OQ-1: Exact plausibility ranges per age/context (refine with clinical review — quality only).
- OQ-2: Locale/number-format handling specifics.

## 16. Risks

- R-1: Formula/injection via Sheets. Mitigation: BR-5 sanitisation.
- R-2: Over-strict validation blocking the journey. Mitigation: BR-2 forgiving design.
