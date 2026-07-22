# 83 — Vitals Module

| Field | Value |
|---|---|
| Document | Vitals Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/02-Research/21-ACOG_GUIDELINES.md`, `22-FIGO_GUIDELINES.md`, `docs/03-UX/35-DESIGN_SYSTEM.md`, `docs/07-AI/104-PREDICTION_ENGINE.md` |

---

## 1. Purpose
Records and charts maternal vitals — blood pressure, weight/weight-gain, and blood sugar — with the four canonical views (current, previous, trend, prediction). It turns raw numbers into calm, contextual, non-diagnostic insight.

## 2. Goals
Effortless logging; clear trends; reference bands (ACOG weight gain, FIGO glucose) shown as context; never diagnose.

## 3. Scope
Owns: `vitals` (bp, weight, blood_sugar) + charts/trends. Uses: maternal profile (BMI category, for weight bands). Out: diagnosis, treatment, prescriptions (NG-1/2).

## 4. Functional Requirements
- FR-1 Log BP (systolic/diastolic), weight, blood sugar (with context: fasting/post-load/random).
- FR-2 Chart each vital: current / previous / trend; prediction (v2, `docs/07-AI/104`).
- FR-3 Compute weight-gain vs. ACOG/IOM band by BMI category (context, not target) (`docs/02-Research/21`).
- FR-4 Show FIGO glucose reference ranges as labelled reference only (`docs/02-Research/22`).
- FR-5 Out-of-band/plausibility → calm clinician-review suggestion (Clinical Recommendation), never diagnosis.
- FR-6 Dual-unit display; canonical storage (`docs/05-Data/72`).

## 5. Non-Functional Requirements
Calm, accessible charts (`docs/03-UX/35` §8, `40`); plausibility checks (`docs/05-Data/73`); no diagnosis (`docs/02-Research/28`).

## 6. Architecture
VitalsService + TrendService compute derived views; charts via Chart.js accessible components; reference bands from research docs; content typed via ContentService.

## 7. User Flow
Dashboard/module → log vital (seconds) → see current/previous/trend + optional reference band + (if out-of-band) calm clinician-review note.

## 8. Data Model
`vitals(vital_id, subject_id, type, value, unit, context, measured_at)`; canonical units kg / mg/dL / mmHg (`docs/05-Data/72`).

## 9. Business Rules
- BR-1 Trends/weight-gain/predictions are surfacing only; never diagnostic.
- BR-2 Reference bands labelled "reference — discuss with clinician"; not targets.
- BR-3 Out-of-band → Clinical Recommendation (clinician-review), not Emergency (no auto-escalation) (`docs/02-Research/28` §8).
- BR-4 Canonical units stored; convert for display.
- BR-5 Plausibility flags are data-entry sanity checks, not clinical thresholds (`docs/05-Data/73`).

## 10. Edge Cases
Twin pregnancy (singleton bands don't apply → defer, `docs/02-Research/21` §7); unknown pre-pregnancy weight (no gain calc); implausible entry (confirm); sparse data (no fake trend); pre-existing hypertension/diabetes (general education + clinician-review).

## 11. Acceptance Criteria
- [x] BP/weight/blood-sugar logging + 4 canonical chart views.
- [x] ACOG/FIGO reference bands as context; out-of-band calm handling.
- [x] Non-diagnostic, dual-unit, accessible.

## 12. Future Expansion
Prediction engine (v2); device/wearable BP/glucose ingestion; postpartum maternal vitals; richer context tags.

## 13. Dependencies
`docs/02-Research/21`, `22`, `28`, `docs/03-UX/35`, `40`, `docs/05-Data/72`, `73`, `docs/07-AI/104`.

## 14. Open Questions
- OQ-1 Default unit system by jurisdiction.
- OQ-2 Twin-specific bands (currently defer).

## 15. Risks
- R-1 Diagnostic captioning. Mitigation: BR-1/BR-3.
- R-2 Users chasing band "targets". Mitigation: BR-2 framing.
