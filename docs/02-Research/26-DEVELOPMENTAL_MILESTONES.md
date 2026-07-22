# 26 — Developmental Milestones (CDC)

| Field | Value |
|---|---|
| Document | Developmental Milestones Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics Specialist |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/91-MILESTONES_MODULE.md`, `docs/08-Timeline/115-DEVELOPMENT_TIMELINE.md` |

---

## 1. Purpose

Grounds Wise Bloom Care's developmental-milestone content in the CDC "Learn the Signs. Act Early." milestone checklists (2022 revision, developed with the American Academy of Pediatrics). Defines which ages/domains are tracked, how milestones are framed, and the strict boundary between *surveillance prompts* (product) and *developmental diagnosis* (clinician). **[FACT]/[DESIGN]** separation applies.

## 2. Scope

Milestone checklists for well-child ages **2 months → 5 years** across domains (social/emotional, language/communication, cognitive, movement/physical). Excludes formal developmental screening/diagnosis (clinician's domain; `docs/01-Product/17-NON_GOALS.md`).

## 3. Primary Sources

- CDC, *Developmental Milestones* ("Learn the Signs. Act Early."). https://www.cdc.gov/ncbddd/actearly/milestones/index.html
- Zubler J.M. et al., *Evidence-Informed Milestones for Developmental Surveillance Tools*, Pediatrics, 2022;149(3):e2021052138. https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748/
- AAP News, *CDC, AAP update developmental milestones for surveillance program* (2022). https://publications.aap.org/aapnews/news/19554/
- AAFP editorial on the revised checklists. https://www.aafp.org/pubs/afp/issues/2022/1000/editorial-cdc-developmental-milestone-checklist.html

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| M-1 | **[FACT]** The 2022 CDC checklists cover ages **2, 4, 6, 9, 12, 15, 18, 24, 30 months, and 3, 4, 5 years** — aligned to well-child visits; **15- and 30-month** checklists were **added** in 2022. | Educational / tracking | Milestone checklist ages in `91-MILESTONES`. |
| M-2 | **[FACT]** Revised milestones identify behaviours **≥75% of children** are expected to exhibit by a given age (a shift from prior ~50th-percentile framing). | Educational | Framing copy: milestones are "most children by this age", reducing false alarm; supports calm tone. |
| M-3 | **[FACT]** The revision removed vague terms like "may" and "begins", added social/emotional items, and introduced open-ended questions for caregivers (e.g., "Is there anything your child does or does not do that concerns you?"). | Educational | Product uses the open-ended prompt to invite—not alarm—caregivers. |
| M-4 | **[FACT]** The update resulted in a ~26% reduction and ~41% replacement of previous CDC milestones. | Context | Signals to authors that older milestone lists are outdated; use the 2022 set only. |
| M-5 | **[DESIGN]** Wise Bloom Care presents milestones as gentle, non-diagnostic surveillance prompts, records caregiver observations, and — if expected milestones are not met or a caregiver has concerns — recommends discussing with the clinician ("act early"), never diagnosing delay/autism/etc. | Design decision | Enforces NG-1; mirrors CDC "Act Early" intent. |

## 5. Framing & Tone Rules

- Milestones are "**what most children do** by this age" — never "what your child must do".
- Not-yet-met milestones → calm, supportive copy + "act early: talk to your clinician"; **never** a diagnostic label or a probability of disorder.
- Use CDC's open-ended concern question to surface caregiver worry without prompting it.
- Celebrate achieved milestones (positive, warm — brand voice).

## 6. Business Rules

- BR-1: Only the 2022 CDC milestone set is used; older lists are not shipped (M-4).
- BR-2: Milestone ages align to the tracked well-child visit ages (M-1).
- BR-3: The app records "achieved / not yet / not sure" per milestone; it never computes a developmental score or diagnosis.
- BR-4: Any "not yet met by the age most children do" state yields a clinician-review suggestion, framed supportively (M-5).

## 7. Edge Cases

- Preterm children: use corrected age for milestone expectations up to ~2 years; flag this clearly (consistent with growth corrected-age handling, `25-WHO_CHILD_GROWTH.md`).
- Wide normal variation: emphasise range and "act early" without inducing anxiety.
- Caregiver marks many "not yet": app avoids alarm cascades; one calm, consolidated clinician-review suggestion.
- Cultural/contextual differences in some milestones: keep to CDC set; note variation in education copy.

## 8. Acceptance Criteria

- [x] Milestone ages/domains cited to CDC 2022 set (incl. new 15/30-month).
- [x] "≥75% of children" framing captured and applied to tone.
- [x] Surveillance-not-diagnosis boundary explicit ("act early", clinician-review).
- [x] Preterm corrected-age handling addressed.

## 9. Future Expansion

Add CDC parent-tip content, milestone-tracker export for clinician visits, and optional integration with validated screening tools (e.g., referencing—not replacing—ASQ/M-CHAT) as an educational cross-link only.

## 10. Dependencies

`docs/06-Modules/91-MILESTONES_MODULE.md`, `docs/08-Timeline/115-DEVELOPMENT_TIMELINE.md`, `28-MEDICAL_DISCLAIMER.md`.

## 11. Open Questions

- OQ-1: Corrected-age milestone plotting for preterm infants in v1 vs. v2.
- OQ-2: Whether to reference external screening tools at all (risk of implying diagnosis).

## 12. Risks

- R-1: Milestone prompts read as diagnosis of delay. Mitigation: framing rules §5, BR-3/BR-4.
- R-2: Shipping outdated milestone lists. Mitigation: BR-1 (2022 set only).

_Sources:_ [CDC Developmental Milestones](https://www.cdc.gov/ncbddd/actearly/milestones/index.html) · [Zubler et al., Pediatrics 2022](https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748/) · [AAP News 2022](https://publications.aap.org/aapnews/news/19554/) · [AAFP editorial](https://www.aafp.org/pubs/afp/issues/2022/1000/editorial-cdc-developmental-milestone-checklist.html)
