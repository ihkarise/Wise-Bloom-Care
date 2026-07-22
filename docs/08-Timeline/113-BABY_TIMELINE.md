# 113 — Baby Timeline

| Field | Value |
|---|---|
| Document | Baby Timeline |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Healthcare Software Architect / Information Architect |
| Last Updated | 2026-07-22 |
| Related | `111-DELIVERY_TRANSITION.md`, `114-VACCINE_TIMELINE.md`, `115-DEVELOPMENT_TIMELINE.md`, `docs/06-Modules/89-BABY_MODULE.md` |

---

## 1. Purpose
Describes the child portion of the one continuous timeline — beginning at the delivery event and continuing through newborn, infancy, and toddlerhood. It is not a new timeline; it is the same family stream, now carrying child-subject events, permanently linked to the mother.

## 2. Scope
The child-phase timeline (birth onward): growth, milestones, vaccination, feeding/sleep, journal, notes. Vaccine schedule overlay: `114`; development overlay: `115`.

## 3. Model
- **Spine:** child age (from DOB), with **corrected age** for preterm where applicable (`docs/02-Research/25`, `26`).
- **Events:** growth measurements, milestone observations, vaccinations, feeding/sleep, journal, notes — append-only, typed, timestamped, `subject = child`, `life_stage ∈ {newborn, infancy, toddler, child}`.
- **Overlays:** vaccine schedule (`114`) and developmental milestones (`115`) as context by age.
- Continuous with the pregnancy/postpartum stream via the delivery hinge (`111`).

## 4. Structure & Views
- Chronological stream (recent + upcoming), groupable by age.
- Metric views (growth): current/previous/trend/prediction on WHO curves.
- Upcoming: next vaccinations, next milestone checklist age.
- Multiple children: each child's events are their own sub-stream under the shared family record (`docs/06-Modules/89`).

## 5. Continuity Rules
- Same family timeline; the child stream is not a separate record (Vision BR-V1).
- Append-only; corrections versioned (`docs/05-Data/77`).
- Corrected age applied for preterm content/plotting; clearly flagged.

## 6. Business Rules
- BR-1 Child events are on the single continuous family timeline (child subject).
- BR-2 Age spine derived from DOB; corrected age for preterm.
- BR-3 Vaccine + development overlays are context by age (`114`, `115`).
- BR-4 Append-only; versioned corrections.
- BR-5 Multiple children are distinct sub-streams under one linked record.

## 7. Edge Cases
Preterm (corrected age); multiple children (clear per-child streams); NICU/irregular early events; sparse data (no fake trend); retrospective entry (post-birth onboarding); age > 60 months (WHO growth dataset boundary — future older refs).

## 8. Acceptance Criteria
- [x] Age-spined child timeline continuous with pregnancy/postpartum (same record).
- [x] Growth/milestone/vaccine overlays; corrected-age handling.
- [x] Append-only/versioned; multi-child sub-streams.

## 9. Future Expansion
Toddler+ stages toward lifetime platform; sibling comparison (careful); AI age summaries (guarded); offline capture; clinician-shared child events.

## 10. Dependencies
`111`, `114`, `115`, `docs/06-Modules/89`, `90`, `91`, `92`, `docs/02-Research/25`, `26`, `docs/05-Data/77`.

## 11. Open Questions
- OQ-1 Default grouping (age buckets) in UI.
- OQ-2 Corrected-age handling scope in v1.

## 12. Risks
- R-1 Child timeline read as a separate app/record. Mitigation: BR-1 one-record continuity.
- R-2 Preterm mis-aging. Mitigation: BR-2 corrected age.
