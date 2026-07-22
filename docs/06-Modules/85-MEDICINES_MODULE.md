# 85 — Medicines Module

| Field | Value |
|---|---|
| Document | Medicines Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `95-NOTIFICATION_MODULE.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `docs/01-Product/17-NON_GOALS.md` |

---

## 1. Purpose
Tracks the medicines and supplements a user is taking (as directed by their clinician) and provides gentle reminders. It **records and reminds** — it never prescribes, doses, or advises on medication (NG-2).

## 2. Goals
Help users remember clinician-prescribed medicines/supplements; keep an accurate record; gentle, non-coercive reminders.

## 3. Scope
Owns: `medicines` (name, schedule, active) + reminder scheduling. Uses: Notification module (`95`). Out: prescribing, dosing advice, drug interaction checking, recommending medicines (NG-2).

## 4. Functional Requirements
- FR-1 Add a medicine/supplement the user was prescribed (name, schedule, notes).
- FR-2 Schedule gentle reminders (`95`); mark taken/skipped.
- FR-3 Maintain a medicine history on the timeline (continuity).
- FR-4 Mark medicines active/ended.

## 5. Non-Functional Requirements
Gentle, non-coercive reminders (no anxiety-gamification, NG-10); accessible; no medical advice.

## 6. Architecture
MedicinesService owns records; NotificationService fires reminders; timeline events on changes.

## 7. User Flow
Add prescribed medicine → set schedule → receive gentle reminders → mark taken → history on timeline.

## 8. Data Model
`medicines(med_id, subject_id, name, schedule, active)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 The app records medicines the clinician prescribed; it never prescribes, doses, or recommends (NG-2).
- BR-2 No drug-interaction/dosing advice (would imply clinical judgement).
- BR-3 Reminders are gentle and non-coercive (NG-10).
- BR-4 Any medicine-related content is typed Educational + clinician-review where relevant.

## 10. Edge Cases
Missed doses (gentle, no scolding); PRN/as-needed meds; supplements vs. prescription; stopping a medicine (history retained); postpartum meds continue in the same record.

## 11. Acceptance Criteria
- [x] Record + remind (taken/skipped) + history.
- [x] No prescribing/dosing/interaction advice.
- [x] Gentle reminders; timeline integration.

## 12. Future Expansion
Educational (typed, sourced) info about common pregnancy supplements (e.g., folic acid) — informational only; adherence insights (surfacing); clinician-shared regimens (portal).

## 13. Dependencies
`95`, `docs/02-Research/28`, `docs/01-Product/17`.

## 14. Open Questions
- OQ-1 Whether to show general educational info about common supplements (informational, sourced) in v1.

## 15. Risks
- R-1 Being read as dosing/prescribing advice. Mitigation: BR-1/BR-2 record-only framing.
- R-2 Coercive reminders raising anxiety. Mitigation: BR-3 gentle design.
