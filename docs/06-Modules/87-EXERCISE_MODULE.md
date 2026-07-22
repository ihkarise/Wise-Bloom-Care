# 87 — Exercise Module

| Field | Value |
|---|---|
| Document | Exercise Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Domain Researcher / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `86-NUTRITION_MODULE.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `knowledge-base/exercise/` |

---

## 1. Purpose
Provides educational exercise/activity guidance and light logging during pregnancy and postpartum. Basic in v1; guided programme in v2. Educational only — never a prescribed exercise regimen or physiotherapy.

## 2. Goals
Encourage safe, appropriate activity with sourced educational content; simple logging; always deferring individual suitability to the clinician.

## 3. Scope
Owns: `exercise_entries` + educational content surfacing. Out: prescribed regimens, physiotherapy, clearance decisions (clinician domain).

## 4. Functional Requirements
- FR-1 (v1) Log simple activity entries.
- FR-2 (v1) Surface sourced educational activity content by life stage (typed Educational), incl. general safety framing (stop and consult if symptoms).
- FR-3 (v2) Guided activity programme (still educational).

## 5. Non-Functional Requirements
Sourced content; safety-aware framing; accessible; no diagnosis/prescription.

## 6. Architecture
ExerciseService (entries) + ContentService (typed, sourced education from `knowledge-base/exercise/`).

## 7. User Flow
Read a life-stage activity card → optionally log → (v2) follow a guided programme; symptom red-flags link to curated emergency content.

## 8. Data Model
`exercise_entries(entry_id, subject_id, body, created_at)`; content from KB.

## 9. Business Rules
- BR-1 Exercise content is Educational + sourced; no prescribed regimens.
- BR-2 Individual suitability/clearance is deferred to the clinician.
- BR-3 Safety framing included; symptom red-flags routed to curated Emergency Warnings (`docs/02-Research/28`), never auto-inferred.
- BR-4 Inclusive of ability/fitness levels; no shaming.

## 10. Edge Cases
High-risk pregnancies (defer to clinician; general education only); postpartum recovery (gentle, staged education); disability/mobility differences (inclusive content); symptoms during activity (curated emergency guidance to seek care).

## 11. Acceptance Criteria
- [x] v1 logging + sourced educational content with safety framing.
- [x] No prescribed regimens; suitability deferred to clinician.
- [x] Red-flags via curated emergency content.

## 12. Future Expansion
Guided/staged programmes (pregnancy + postpartum); pelvic-floor education; adaptive content; wearable activity integration.

## 13. Dependencies
`86`, `knowledge-base/exercise/`, `docs/02-Research/28`.

## 14. Open Questions
- OQ-1 Depth of v1 logging.
- OQ-2 Postpartum staging content sourcing.

## 15. Risks
- R-1 Read as a prescribed/cleared regimen. Mitigation: BR-1/BR-2.
- R-2 Unsafe activity for high-risk users. Mitigation: BR-2/BR-3 defer + safety framing.
