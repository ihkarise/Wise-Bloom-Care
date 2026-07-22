# 86 — Nutrition Module

| Field | Value |
|---|---|
| Document | Nutrition Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Domain Researcher / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `87-EXERCISE_MODULE.md`, `docs/02-Research/22-FIGO_GUIDELINES.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Provides educational nutrition guidance and light logging during pregnancy and beyond. Basic in v1 (logging + education); guided programme in v2. Educational only — never a prescribed diet or clinical nutrition therapy.

## 2. Goals
Support healthy-eating awareness with sourced, educational content; let users log simply; connect to relevant contexts (e.g., GDM awareness) without diagnosing or prescribing.

## 3. Scope
Owns: `nutrition_entries` (basic logs) + educational content surfacing. Out: prescribed diets, clinical nutrition therapy, calorie/medical targets (defer to clinician/dietitian).

## 4. Functional Requirements
- FR-1 (v1) Log simple nutrition notes/entries.
- FR-2 (v1) Surface sourced educational nutrition content by life stage (typed Educational).
- FR-3 (v1) Link to FIGO nutrition awareness (adolescent/preconception/maternal) (`docs/02-Research/22`).
- FR-4 (v2) Guided nutrition programme (still educational).

## 5. Non-Functional Requirements
Sourced content; culturally-aware/inclusive; accessible; no diagnosis/prescription.

## 6. Architecture
NutritionService (entries) + ContentService (typed, sourced education from `knowledge-base/nutrition/`).

## 7. User Flow
Read a life-stage nutrition card → optionally log an entry → (v2) follow a guided programme.

## 8. Data Model
`nutrition_entries(entry_id, subject_id, body, created_at)`; content from KB (`docs/07-AI/101`).

## 9. Business Rules
- BR-1 Nutrition content is Educational + sourced; no prescribed diets/targets.
- BR-2 No medical nutrition therapy or calorie prescriptions (clinician/dietitian domain).
- BR-3 Inclusive, culturally-aware content; no shaming.
- BR-4 GDM/condition contexts are awareness/education, not diagnosis (`docs/02-Research/22`, `28`).

## 10. Edge Cases
Dietary restrictions/allergies/culture (content must not assume one diet); GDM users (educational awareness, defer plan to clinician); underweight/overweight (general education + clinician-review).

## 11. Acceptance Criteria
- [x] v1 logging + sourced educational content.
- [x] No prescribed diets/therapy; inclusive.
- [x] v2 guided programme scoped.

## 12. Future Expansion
Guided programmes; culturally-localised meal ideas; integration with weight-gain context (educational); optional dietitian content partnerships.

## 13. Dependencies
`87`, `knowledge-base/nutrition/`, `docs/02-Research/22`, `28`, `docs/07-AI/101`.

## 14. Open Questions
- OQ-1 Depth of v1 logging (notes vs. structured).
- OQ-2 Localisation of food/culture content.

## 15. Risks
- R-1 Read as a prescribed diet. Mitigation: BR-1/BR-2.
- R-2 Culturally inappropriate content. Mitigation: BR-3 inclusive review.
