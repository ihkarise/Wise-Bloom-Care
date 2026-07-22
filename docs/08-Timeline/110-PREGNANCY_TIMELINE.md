# 110 — Pregnancy Timeline

| Field | Value |
|---|---|
| Document | Pregnancy Timeline |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Healthcare Software Architect / Information Architect |
| Last Updated | 2026-07-22 |
| Related | `111-DELIVERY_TRANSITION.md`, `docs/06-Modules/82-PREGNANCY_MODULE.md`, `docs/02-Research/20-WHO_GUIDELINES.md`, `23-NICE_GUIDELINES.md` |

---

## 1. Purpose
Describes the pregnancy portion of the one continuous timeline: how gestational context, events, week knowledge, and the appointment scaffold are organised chronologically — and how this stream flows into the delivery transition without a break.

## 2. Scope
The pregnancy-phase timeline (conception → delivery hand-off). The transition itself: `111`. Timeline mechanics (append-only/versioned): `docs/05-Data/77`.

## 3. Timeline Model (pregnancy)
- **Spine:** gestational age (weeks/days), derived from LMP/EDD (`docs/06-Modules/82`).
- **Events:** vitals, appointments, reports, medicines, journal, notes — each an append-only, typed, timestamped Event on the family timeline with `subject = maternal record` and `life_stage = pregnancy`.
- **Knowledge overlay:** week-by-week educational cards (`knowledge-base/pregnancy/week01..40`) surfaced by current GA (typed Educational + sourced).
- **Scaffold overlay:** the regional appointment scaffold (WHO ≥8 / NICE 10/7) shown as context (`docs/02-Research/20`, `23`), clinician plan overriding.

## 4. Structure & Views
- Chronological stream (most recent + upcoming), groupable by trimester/week.
- "Current / previous / trend / prediction" available for metric events (vitals).
- Upcoming: scheduled appointments, due medicines, next scaffold contact (context).
- Continuous with the child timeline post-delivery (one stream; `113`).

## 5. Continuity Rules
- Append-only; corrections are versioned events (`docs/05-Data/77`; Vision BR-V3).
- The timeline never resets; at delivery it continues into postpartum/child (`111`).
- Retrospective events (late onboarding) are inserted at their true `occurred_at`, marked as imported where relevant (`docs/05-Data/76`).

## 6. Business Rules
- BR-1 Pregnancy events are append-only, typed, and timestamped on the family timeline.
- BR-2 GA spine is derived (not stored authoritatively); revisions versioned.
- BR-3 Week knowledge + scaffold are context overlays (Educational/Clinical), never app-enforced (`docs/02-Research/23` BR-3).
- BR-4 The stream is continuous into the transition; no reset.
- BR-5 Retrospective/partial entries allowed (forgiving, P9).

## 7. Edge Cases
Unknown LMP (timeline exists; GA spine deferred); revised due date (spine recomputed; history preserved); multiple pregnancies (episode-scoped, `docs/05-Data/71`); loss (episode ends compassionately; `112`/`88`); very late onboarding (reconstructed).

## 8. Acceptance Criteria
- [x] GA-spined, append-only pregnancy timeline with event + knowledge + scaffold overlays.
- [x] Continuity into transition (no reset); versioned corrections.
- [x] Retrospective/partial support.

## 9. Future Expansion
Trimester summaries (AI, guarded), richer visualisations, clinician-shared events, offline capture.

## 10. Dependencies
`111`, `docs/06-Modules/82`, `83`, `docs/05-Data/77`, `76`, `docs/02-Research/20`, `23`, `knowledge-base/pregnancy/*`.

## 11. Open Questions
- OQ-1 Default grouping (week vs. trimester) in the UI.
- OQ-2 Multi-episode timeline presentation.

## 12. Risks
- R-1 Timeline appearing to reset. Mitigation: BR-4 continuity.
- R-2 Scaffold read as mandate. Mitigation: BR-3 context framing.
