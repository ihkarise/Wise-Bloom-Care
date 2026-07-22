# 114 — Vaccine Timeline

| Field | Value |
|---|---|
| Document | Vaccine Timeline |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `113-BABY_TIMELINE.md`, `docs/06-Modules/92-VACCINATION_MODULE.md`, `docs/02-Research/24-GOVT_IMMUNIZATION.md` |

---

## 1. Purpose
Describes how immunizations are projected onto the child timeline as an age-based schedule overlay — showing upcoming due doses and recording those given — grounded in the jurisdiction schedule (default India NIS). It **reminds and records**; it never advises for or against vaccination.

## 2. Scope
The vaccine schedule overlay on the child timeline: projection of due doses, reminders, and recorded status. Module logic: `docs/06-Modules/92`; schedule data: `docs/02-Research/24`.

## 3. Model
- The active jurisdiction schedule (versioned data) maps `vaccine_code + dose_no → recommended age range`.
- Projected onto the child's age spine (from DOB) to produce upcoming-due items and reminders.
- Recorded doses (given/skipped/deferred) appear as timeline events (`subject = child`).
- Reference/education (vaccine purpose) is typed Educational + sourced; adverse-event red-flags are curated Emergency Warnings.

## 4. Views
- Upcoming: next due dose(s) by age, with gentle reminders (`docs/06-Modules/95`).
- History: doses given, on the timeline.
- Status per vaccine/dose: scheduled/given/skipped/deferred.

## 5. Continuity & Reality
- The overlay is context; the **record reflects what actually happened** (source of truth = actual doses), even if divergent from the scaffold (`docs/06-Modules/92` BR-3).
- Continuous on the same family timeline (child stream).

## 6. Business Rules
- BR-1 Schedule overlay is versioned, jurisdiction-keyed data; India NIS default (`docs/02-Research/24`).
- BR-2 Due items/reminders derived from DOB + schedule; gentle (`docs/06-Modules/95` BR-1).
- BR-3 Records reflect actual doses over the scaffold.
- BR-4 No advice for/against vaccination; record + remind only.
- BR-5 Adverse-event red-flags are curated Emergency Warnings, never inferred.

## 7. Edge Cases
Preterm/catch-up (scaffold shown; "clinician may adjust"; app doesn't compute catch-up); missed/late (gentle reminders; clinician-review); vaccine not in schedule (custom recorded dose); jurisdiction change (switch active schedule; history preserved); multiple children (independent overlays).

## 8. Acceptance Criteria
- [x] Age-based schedule overlay with upcoming + history + status.
- [x] Reminders gentle; records reflect reality over scaffold.
- [x] No vaccinate/don't advice; curated emergency red-flags.

## 9. Future Expansion
CDC/ACIP, UKHSA, WHO schedules; catch-up guidance (educational); certificate export; maternal-vaccine cross-links (educational).

## 10. Dependencies
`113`, `docs/06-Modules/92`, `95`, `docs/02-Research/24`, `28`.

## 11. Open Questions
- OQ-1 Default jurisdiction (India NIS assumed).
- OQ-2 Current NIS booster ages (re-verify pre-ship).

## 12. Risks
- R-1 Stale schedule. Mitigation: BR-1 versioned + per-release re-verify.
- R-2 Read as vaccination advice. Mitigation: BR-4 record+remind.
