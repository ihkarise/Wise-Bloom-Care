# 84 — Reports Module

| Field | Value |
|---|---|
| Document | Reports Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Architect / Clinical Informatics |
| Last Updated | 2026-07-22 |
| Related | `docs/07-AI/106-OCR_PIPELINE.md`, `94-AI_MODULE.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/04-Architecture/54-GOOGLE_SHEETS_SCHEMA.md` |

---

## 1. Purpose
Lets users securely upload, store, and view lab reports and ultrasound reports, and (v2) receive an educational AI explanation. Reports become part of the continuous timeline.

## 2. Goals
Safe, private storage of sensitive medical artefacts; easy viewing; optional educational explanation; timeline integration — never diagnosis.

## 3. Scope
Owns: `reports` metadata + media references (private Drive). Uses: AI explanation (`94`), OCR (`docs/07-AI/106`, v2). Out: interpreting results as diagnosis (NG-1).

## 4. Functional Requirements
- FR-1 Upload lab/ultrasound reports (PDF/image); store media privately; record metadata.
- FR-2 View reports securely (backend-mediated, no public links).
- FR-3 Add a timeline event for each report (continuity).
- FR-4 (v2) AI educational explanation of a report — typed Educational + clinician-review; never diagnostic.
- FR-5 (v2) OCR extraction to structured context — user-reviewed, never auto-trusted.

## 5. Non-Functional Requirements
Strong privacy/security (`docs/09-Security/123`); media in private Drive (`docs/04-Architecture/54` §6); accessible viewer.

## 6. Architecture
ReportsService stores metadata + `media_ref`; media in private Drive; access authorised + audited; AI via AIService with guardrails (`docs/07-AI/105`).

## 7. User Flow
After a visit → upload report → view → (v2) tap "explain" → educational summary + "discuss with your clinician" → timeline entry (`docs/03-UX/31` J3).

## 8. Data Model
`reports(report_id, subject_id, kind, media_ref, uploaded_at)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Media stored privately; served via short-lived backend-mediated refs; never public.
- BR-2 Every report access authorised + audited (`docs/05-Data/75`).
- BR-3 AI explanations are Educational + clinician-review; never diagnostic (`docs/02-Research/28`).
- BR-4 OCR/extracted values are user-reviewed, never auto-trusted or auto-acted on.
- BR-5 A report creates a timeline event (continuity).

## 10. Edge Cases
Poor-quality scans (OCR may fail → still stored/viewable); unsupported formats (guidance + accepted types); large files (size limits, Drive); sensitive results (calm handling; no auto-alarm).

## 11. Acceptance Criteria
- [x] Secure upload/view + private media + audit.
- [x] Timeline integration.
- [x] AI explanation (v2) educational + non-diagnostic; OCR user-reviewed.

## 12. Future Expansion
Structured lab-value extraction + trends (educational); ultrasound growth-metric capture; clinician sharing/portal; FHIR export (`docs/05-Data/76`).

## 13. Dependencies
`94`, `docs/07-AI/105`, `106`, `docs/09-Security/123`, `docs/04-Architecture/54`, `docs/02-Research/28`, `docs/05-Data/75`.

## 14. Open Questions
- OQ-1 Accepted file types/size limits.
- OQ-2 AI explanation in v1 if guardrails mature early.

## 15. Risks
- R-1 Media exposure. Mitigation: BR-1/BR-2.
- R-2 Trusting bad OCR values. Mitigation: BR-4 user-review.
