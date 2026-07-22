# 90 — Growth Module

| Field | Value |
|---|---|
| Document | Growth Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `docs/02-Research/25-WHO_CHILD_GROWTH.md`, `docs/03-UX/35-DESIGN_SYSTEM.md`, `89-BABY_MODULE.md` |

---

## 1. Purpose
Tracks child growth against the WHO Child Growth Standards (0–60 months), plotting weight-for-age, length/height-for-age, weight-for-length, and BMI-for-age with percentile/z-score and trend. Charting and context — never diagnosis of malnutrition/obesity.

## 2. Goals
Accurate, calm growth charting on WHO standards; clear percentile/trend; corrected-age awareness for preterm; clinician-review on out-of-band — never diagnostic.

## 3. Scope
Owns: `growth_measurements` + WHO chart computation. Uses: child sex/DOB/GA-at-birth (from `89`). Out: diagnosing growth disorders (clinician domain, NG-1).

## 4. Functional Requirements
- FR-1 Record measurements (weight kg, length/height cm) with date.
- FR-2 Compute percentile/z-score from WHO tables for the correct sex/age indicator (`docs/02-Research/25`).
- FR-3 Plot current/previous/trend on WHO curves with ±2 SD reference bands.
- FR-4 Corrected-age plotting/flagging for preterm (using GA at birth).
- FR-5 Out-of-band → calm clinician-review (Clinical Recommendation); never a diagnostic label.

## 5. Non-Functional Requirements
Accurate WHO computation (versioned tables); accessible charts + non-visual alternative (`docs/03-UX/40`); calm framing; validation of implausible values (`docs/05-Data/73`).

## 6. Architecture
GrowthService computes percentile/z from versioned WHO datasets; accessible Chart.js growth chart; content typed via ContentService.

## 7. User Flow
Log measurement → see percentile + plotted point + trend → (if out-of-band) calm "discuss with your clinician" (`docs/03-UX/31` J5).

## 8. Data Model
`growth_measurements(gm_id, child_id, indicator, value, unit, measured_at)`; derived percentile/z computed, not stored authoritatively (`docs/04-Architecture/55`).

## 9. Business Rules
- BR-1 Charting on WHO standards; percentile/z computed from official tables (versioned).
- BR-2 Correct sex/age-specific curve required; missing sex/DOB disables charting with explanation.
- BR-3 Out-of-band handled calmly (Clinical Recommendation), never Emergency auto-escalation, never diagnosis (`docs/02-Research/25` §5).
- BR-4 Corrected age used for preterm where applicable; clearly flagged.
- BR-5 Single points not over-interpreted; trend emphasised.

## 10. Edge Cases
Preterm (corrected age); implausible entry (validate/confirm); sparse data (no fabricated trend); age > 60 months (WHO 0–5y no longer applies — future older-child refs); unit confusion (canonical storage).

## 11. Acceptance Criteria
- [x] WHO-based percentile/z + charting for the four indicators.
- [x] Corrected-age handling; calm out-of-band; non-diagnostic.
- [x] Accessible charts with alternatives.

## 12. Future Expansion
Head-circumference-for-age; velocity charts; 5–19y references; z-score export for clinicians; sibling comparison (careful).

## 13. Dependencies
`docs/02-Research/25`, `docs/03-UX/35`, `40`, `89`, `docs/05-Data/72`, `73`.

## 14. Open Questions
- OQ-1 Corrected-age plotting in v1 vs v2.
- OQ-2 Percentile vs. z-score display to users (percentile default; z for export).

## 15. Risks
- R-1 Over-interpreting single measurements. Mitigation: BR-5 trend emphasis.
- R-2 Preterm mis-plotting. Mitigation: BR-4 corrected age.
