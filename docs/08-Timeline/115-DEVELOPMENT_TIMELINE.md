# 115 — Development Timeline

| Field | Value |
|---|---|
| Document | Development (Milestones) Timeline |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `113-BABY_TIMELINE.md`, `docs/06-Modules/91-MILESTONES_MODULE.md`, `docs/02-Research/26-DEVELOPMENTAL_MILESTONES.md` |

---

## 1. Purpose
Describes how developmental milestones (CDC 2022) are projected onto the child timeline as an age-based overlay — surfacing the milestone checklist at each tracked age and recording observations — with supportive, non-diagnostic framing ("act early").

## 2. Scope
The milestone overlay on the child timeline: checklist surfacing by age, observation recording, and celebration/act-early prompts. Module logic: `docs/06-Modules/91`; source set: `docs/02-Research/26`.

## 3. Model
- CDC 2022 checklists mapped to ages (2,4,6,9,12,15,18,24,30 mo; 3,4,5 y) projected onto the child's (corrected) age spine.
- Observations (achieved / not yet / not sure) recorded as timeline events (`subject = child`).
- Content typed Educational + sourced; framing "what most children do by this age" (≥75% CDC framing).

## 4. Views
- Upcoming/current checklist for the child's age.
- History of observations on the timeline; celebrated achievements.
- Gentle, consolidated "act early" suggestion when milestones are not yet met.

## 5. Framing & Safety
- Supportive, non-diagnostic: not-yet-met → calm clinician-review ("act early"), never a delay/disorder diagnosis (`docs/02-Research/26` §5).
- Corrected age for preterm up to ~2y.
- CDC open-ended concern question used to invite (not prompt) caregiver worry.

## 6. Business Rules
- BR-1 CDC 2022 checklists projected by (corrected) age; only the 2022 set used.
- BR-2 Observations recorded as timeline events; no developmental score/diagnosis.
- BR-3 "Most children by this age" framing; not-yet → supportive act-early clinician-review.
- BR-4 Corrected age for preterm.
- BR-5 Avoid alarm cascades; consolidate concerns calmly.

## 7. Edge Cases
Preterm (corrected age); many "not yet" (single calm suggestion); wide normal variation (emphasise range); caregiver concern with all met (offer clinician-review via open question); cultural variation (keep to CDC; note in education); multiple children (independent overlays).

## 8. Acceptance Criteria
- [x] Age-based CDC milestone overlay with observation recording + celebration + act-early.
- [x] Non-diagnostic framing; corrected-age handling; no alarm cascades.
- [x] Continuous on the child timeline (same record).

## 9. Future Expansion
CDC parent-tips; milestone export for visits; optional reference (not replacement) of validated screening tools; celebratory journal linkage.

## 10. Dependencies
`113`, `docs/06-Modules/91`, `docs/02-Research/26`, `knowledge-base/milestones/`.

## 11. Open Questions
- OQ-1 Corrected-age milestones in v1 vs v2.
- OQ-2 Whether to reference external screening tools.

## 12. Risks
- R-1 Read as diagnosis of delay. Mitigation: BR-2/BR-3 framing.
- R-2 Outdated milestone set. Mitigation: BR-1 (2022 only).
