# 112 — Postpartum Timeline

| Field | Value |
|---|---|
| Document | Postpartum Timeline |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Healthcare Software Architect / Clinical Informatics |
| Last Updated | 2026-07-22 |
| Related | `111-DELIVERY_TRANSITION.md`, `113-BABY_TIMELINE.md`, `docs/06-Modules/88-DELIVERY_MODULE.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Describes the postpartum (maternal recovery) portion of the continuous timeline, which runs **in parallel** with the newborn timeline after delivery. It keeps the mother's own recovery visible — she is not forgotten once the baby arrives.

## 2. Scope
Maternal postpartum events and content after delivery (recovery, maternal vitals, postpartum wellbeing education). Newborn care: `113`. Loss-path maternal recovery is included with special compassion.

## 3. Model
- Postpartum events have `subject = maternal record`, `life_stage = postpartum`, on the same family timeline as pregnancy and child events (continuity).
- Runs in parallel with the newborn timeline; the family timeline interleaves both.
- Content: postpartum recovery education (typed Educational, sourced), maternal wellbeing awareness, and red-flag emergency warnings (curated) directing to care.

## 4. What It Tracks
- Maternal recovery notes/vitals (e.g., BP postpartum where relevant).
- Postpartum appointments/check-ups (scaffold as context; clinician plan overrides).
- Wellbeing/mood awareness content (educational; sensitive; never diagnostic — e.g., awareness of postpartum mood changes with clinician-review, never a diagnosis).
- Support resources (educational).

## 5. Sensitivity & Safety
- Postpartum mental-health content is educational and supportive, never diagnostic; red-flags (e.g., thoughts of self-harm) route to **curated Emergency Warnings** directing to immediate help (`docs/02-Research/28`). The app never diagnoses postpartum depression.
- Loss path: maternal recovery + grief-support resources handled with compassion; no baby prompts.

## 6. Business Rules
- BR-1 Postpartum events are on the same continuous timeline (maternal subject), parallel to newborn.
- BR-2 Postpartum content is typed + sourced; mood/wellbeing is educational, never diagnostic.
- BR-3 Red-flags (incl. mental-health crises) use curated Emergency Warnings to seek immediate care; never inferred/diagnosed.
- BR-4 Loss path provides compassionate maternal recovery + grief support; no baby prompts.
- BR-5 Scaffold check-ups are context; clinician plan overrides.

## 7. Edge Cases
Extended recovery/complications; C-section vs. vaginal recovery differences (educational); mental-health crisis (curated emergency + resources); loss (grief support); mother managing recovery while sleep-deprived (ultra-low-friction, calm).

## 8. Acceptance Criteria
- [x] Parallel maternal postpartum timeline on one record.
- [x] Educational (non-diagnostic) recovery/wellbeing content; curated emergency red-flags.
- [x] Compassionate loss-path maternal support.

## 9. Future Expansion
Validated wellbeing check-ins (educational surfacing, clinician-review), lactation support content, pelvic-floor recovery, partner support, clinician postpartum sharing.

## 10. Dependencies
`111`, `113`, `docs/06-Modules/88`, `83`, `docs/02-Research/28`, `knowledge-base/newborn/`, `knowledge-base/emergency/`.

## 11. Open Questions
- OQ-1 Whether to include a (non-diagnostic, educational) mood check-in in v1/v2 and how to do it safely.
- OQ-2 Postpartum scaffold sourcing (WHO postnatal care).

## 12. Risks
- R-1 Diagnosing postpartum depression. Mitigation: BR-2/BR-3 educational + curated emergencies.
- R-2 Mother's recovery being neglected in UX. Mitigation: BR-1 parallel visibility.
