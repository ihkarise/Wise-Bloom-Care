# 92 — Vaccination Module

| Field | Value |
|---|---|
| Document | Vaccination Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `docs/02-Research/24-GOVT_IMMUNIZATION.md`, `docs/08-Timeline/114-VACCINE_TIMELINE.md`, `95-NOTIFICATION_MODULE.md` |

---

## 1. Purpose
Tracks a child's immunizations against a jurisdiction schedule (default: India NIS), reminds about upcoming doses, and records what was actually given. It **records and reminds** — it never advises for or against vaccination.

## 2. Goals
Accurate schedule-based reminders; a reliable record of doses given/skipped/deferred; support multiple jurisdictions and divergence between schedule and reality.

## 3. Scope
Owns: `vaccinations` (per-child doses). Uses: schedule dataset (`docs/02-Research/24`), Notifications (`95`), child DOB. Out: recommending for/against vaccination, adverse-event diagnosis (NG-1/NG-3).

## 4. Functional Requirements
- FR-1 Load the active jurisdiction schedule (default India NIS) as versioned data.
- FR-2 Generate reminders from child DOB + schedule ages (`95`).
- FR-3 Record dose status: given / skipped / deferred / scheduled (with date given).
- FR-4 Record actual doses even when divergent from the scaffold (single source of truth = what happened).
- FR-5 Allow custom/optional (e.g., private/IAP) doses.
- FR-6 Surface vaccine purpose education (typed Educational, sourced); adverse-event red-flags via curated Emergency Warnings.

## 5. Non-Functional Requirements
Versioned schedule data; gentle reminders (no scolding); accessible; no vaccinate/don't advice.

## 6. Architecture
VaccinationService owns records; reads schedule dataset; NotificationService reminders; content via ContentService.

## 7. User Flow
Schedule seeds reminders → user marks doses given → history/timeline; missed doses → gentle reminder + clinician-review (`docs/03-UX/31` J5).

## 8. Data Model
`vaccinations(vax_id, child_id, vaccine_code, dose_no, status, given_at)`; `schedules(...)` reference data (`docs/02-Research/24`, `docs/05-Data/70`).

## 9. Business Rules
- BR-1 Schedule is versioned, jurisdiction-keyed data; India NIS default; re-verified per release (`docs/02-Research/24` BR-3).
- BR-2 Reminders from DOB + schedule; user marks status.
- BR-3 Record actual doses even if divergent (source of truth = what happened).
- BR-4 No advice for/against vaccination; record + remind only.
- BR-5 Adverse-event red-flags via curated Emergency Warnings, never inferred (`docs/02-Research/28`).

## 10. Edge Cases
Preterm/catch-up (show scaffold + "clinician may adjust"; app doesn't compute catch-up); missed/late doses (gentle); vaccine not in schedule (custom record); multiple children (independent records); jurisdiction change.

## 11. Acceptance Criteria
- [x] Jurisdiction schedule + reminders + status recording (given/skipped/deferred).
- [x] Records reality over scaffold; custom doses.
- [x] No vaccinate/don't advice; curated emergency red-flags.

## 12. Future Expansion
CDC/ACIP, UKHSA, WHO schedules; maternal vaccine cross-links (educational); certificate/record export; catch-up guidance (educational).

## 13. Dependencies
`docs/02-Research/24`, `28`, `docs/08-Timeline/114`, `95`, `docs/05-Data/70`.

## 14. Open Questions
- OQ-1 Default jurisdiction (India NIS assumed).
- OQ-2 IAP/private presets in v1.
- OQ-3 Current NIS booster ages (re-verify pre-ship).

## 15. Risks
- R-1 Stale schedule. Mitigation: BR-1 per-release re-verification.
- R-2 Read as vaccination advice. Mitigation: BR-4 record+remind framing.
