# 82 — Pregnancy Module

| Field | Value |
|---|---|
| Document | Pregnancy Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `83-VITALS_MODULE.md`, `88-DELIVERY_MODULE.md`, `docs/08-Timeline/110-PREGNANCY_TIMELINE.md`, `docs/02-Research/20`, `23` |

---

## 1. Purpose
Owns the pregnancy state and context: the pregnancy episode(s), gestational age/EDD, and week-by-week knowledge surfacing. It anchors all pregnancy-scoped data and is the origin of the continuous journey that the delivery module later bridges to the child.

## 2. Goals
Track the pregnancy episode; compute gestational context; surface week knowledge; hold the schedule scaffold context (WHO/NICE); hand off cleanly to delivery.

## 3. Scope
Owns: `pregnancy_episode` (LMP/EDD, status), gestational-context computation, week-knowledge surfacing. Uses: vitals, appointments, reports, nutrition, exercise, medicines (their own modules). Out: delivery event (owned by `88`).

## 4. Functional Requirements
- FR-1 Create/maintain a pregnancy episode with LMP and/or EDD (or "unknown" — forgiving, P9).
- FR-2 Compute gestational age / weeks / trimester (derived; not stored authoritatively, `docs/04-Architecture/55`).
- FR-3 Recompute context on due-date revision; version history preserved (`docs/05-Data/77`).
- FR-4 Surface week-by-week knowledge (typed Educational, sourced) by GA (`knowledge-base/pregnancy/week01..40`).
- FR-5 Provide the regional appointment scaffold context (WHO ≥8 / NICE 10/7) — context only, clinician owns plan (`docs/02-Research/20`, `23`).
- FR-6 Support multiple episodes over time (`docs/05-Data/71`).

## 5. Non-Functional Requirements
Forgiving entry; calm content; sourced knowledge; accessible.

## 6. Architecture
PregnancyService in the application layer; derived GA computed by shared lib; week knowledge fetched from KB via ContentService (typed + sourced).

## 7. User Flow
Onboard → set LMP/EDD (or unknown) → dashboard gestational context → weekly knowledge → track vitals/appts → delivery handoff (`docs/03-UX/31` J1–J4).

## 8. Data Model
`pregnancy_episode(episode_id, maternal_id, lmp, edd, status)`; children link to episode + mother (`docs/05-Data/71`).

## 9. Business Rules
- BR-1 GA/weeks are derived from LMP/EDD; never stored as competing truth.
- BR-2 Due-date revisions are versioned; history preserved.
- BR-3 Week knowledge is typed Educational + sourced; no diagnosis.
- BR-4 Schedule scaffolds are context; clinician plan overrides (`docs/02-Research/23` BR-3).
- BR-5 An episode may end without a child (loss; owned by `88`).

## 10. Edge Cases
Unknown LMP (no GA until known); revised dates; multiple pregnancies; retrospective onboarding at 30 weeks; loss.

## 11. Acceptance Criteria
- [x] Episode + gestational context (derived, versioned) specified.
- [x] Week-knowledge surfacing typed + sourced.
- [x] Schedule-scaffold-as-context rule; multi-episode support.

## 12. Future Expansion
Personalised (guarded) pregnancy insights; risk-awareness education (educational only); richer trimester content; AI week summaries (v2).

## 13. Dependencies
`83`, `88`, `docs/08-Timeline/110`, `knowledge-base/pregnancy/*`, `docs/02-Research/20`, `23`, `28`.

## 14. Open Questions
- OQ-1 v1 UI exposure of multiple episodes (`docs/05-Data/71` OQ-1).
- OQ-2 Default schedule scaffold by jurisdiction.

## 15. Risks
- R-1 Drifting GA if stored. Mitigation: BR-1 derived.
- R-2 Knowledge read as advice. Mitigation: BR-3 typing.
