# 91 — Milestones Module

| Field | Value |
|---|---|
| Document | Developmental Milestones Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `docs/02-Research/26-DEVELOPMENTAL_MILESTONES.md`, `docs/08-Timeline/115-DEVELOPMENT_TIMELINE.md`, `89-BABY_MODULE.md` |

---

## 1. Purpose
Tracks developmental milestones using the CDC "Learn the Signs. Act Early." 2022 checklists (2m–5y). Gentle, non-diagnostic surveillance prompts that celebrate progress and, when milestones are not yet met or a caregiver has concerns, suggest discussing with the clinician ("act early").

## 2. Goals
Age-appropriate milestone prompts; record caregiver observations; supportive framing ("most children by this age"); never diagnose delay.

## 3. Scope
Owns: `milestones` (per-child status). Uses: child DOB/GA (corrected age). Out: developmental diagnosis/screening (clinician domain, NG-1).

## 4. Functional Requirements
- FR-1 Present CDC 2022 milestone checklists at the tracked ages (2,4,6,9,12,15,18,24,30 mo; 3,4,5 y) (`docs/02-Research/26`).
- FR-2 Record status per milestone: achieved / not yet / not sure.
- FR-3 Corrected age for preterm up to ~2y.
- FR-4 Celebrate achieved milestones (warm); on "not yet by the age most children do" → calm, consolidated clinician-review suggestion.
- FR-5 Offer CDC open-ended concern question ("anything that concerns you?").

## 5. Non-Functional Requirements
Supportive, non-alarming; accessible; 2022 CDC set only; corrected-age aware.

## 6. Architecture
MilestonesService owns statuses; content from `knowledge-base/milestones/` (typed Educational); no scoring/diagnosis.

## 7. User Flow
At an age checklist → mark milestones → celebrate achieved → gentle "act early" suggestion if needed (`docs/03-UX/31` J5).

## 8. Data Model
`milestones(ms_id, child_id, milestone_code, status, observed_at)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Only the CDC 2022 set is used (`docs/02-Research/26` BR-1).
- BR-2 Framing: "what most children do by this age", never "must".
- BR-3 No developmental score/diagnosis; not-yet-met → supportive clinician-review ("act early").
- BR-4 Corrected age for preterm.
- BR-5 Avoid alarm cascades; consolidate concerns into one calm suggestion.

## 10. Edge Cases
Preterm (corrected age); many "not yet" (single consolidated suggestion); wide normal variation (emphasise range); caregiver concern with all milestones met (still offer clinician-review via open question); cultural variation (keep to CDC; note in education).

## 11. Acceptance Criteria
- [x] CDC 2022 checklists at correct ages; status capture.
- [x] Supportive framing; "act early" (non-diagnostic) on not-yet.
- [x] Corrected-age handling; no alarm cascades.

## 12. Future Expansion
CDC parent-tips; milestone export for visits; optional reference (not replacement) of validated screening tools; celebratory journal integration.

## 13. Dependencies
`docs/02-Research/26`, `docs/08-Timeline/115`, `89`, `knowledge-base/milestones/`.

## 14. Open Questions
- OQ-1 Corrected-age milestones in v1 vs v2.
- OQ-2 Whether to reference external screening tools at all.

## 15. Risks
- R-1 Read as diagnosis of delay. Mitigation: BR-2/BR-3 framing.
- R-2 Outdated milestone lists. Mitigation: BR-1 (2022 only).
