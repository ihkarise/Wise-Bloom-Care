# 23 — NICE Guidelines (UK Antenatal Care)

| Field | Value |
|---|---|
| Document | NICE Guidelines Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics Specialist |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/82-PREGNANCY_MODULE.md`, `docs/08-Timeline/110-PREGNANCY_TIMELINE.md` |

---

## 1. Purpose

Curates the UK National Institute for Health and Care Excellence (NICE) antenatal-care guidance (NG201) grounding Wise Bloom Care's appointment-schedule and booking content. Reference for content authors; **[FACT]/[DESIGN]** separation applies.

## 2. Scope

Antenatal appointment cadence and booking timing. Excludes clinical management pathways.

## 3. Primary Sources

- NICE, *Antenatal care* (NG201), published 19 August 2021. https://www.nice.org.uk/guidance/ng201
- NG201 recommendations. https://www.nice.org.uk/guidance/ng201/chapter/recommendations
- NICE Quality standard QS22. https://www.nice.org.uk/guidance/qs22

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| N-1 | **[FACT]** NG201 recommends planning **10 routine antenatal appointments for nulliparous** women and **7 for parous** women. | Clinical Recommendation | Alternative (UK) schedule scaffold; shown as region-specific context, clinician owns the plan. |
| N-2 | **[FACT]** The first (booking) appointment should be offered to take place **by 10+0 weeks** of pregnancy. | Clinical Recommendation | Early-booking educational nudge (non-scolding). |
| N-3 | **[FACT]** Additional or longer appointments should be offered based on medical, social, and emotional needs. | Educational | Reinforces individualised-care framing; product supports flexible scheduling. |
| N-4 | **[DESIGN]** Wise Bloom Care treats NICE (UK) and WHO (global ≥8 contacts) as *selectable regional scaffolds*; defaults follow the configured jurisdiction, and the clinician's actual plan always overrides. | Design decision | Reconciles differing schedules without asserting one as universal. |

## 5. Reconciliation With WHO

NICE (10/7 appointments by parity) and WHO (≥8 contacts) differ because they target different health systems. Wise Bloom Care does **not** present a single "correct" number; it presents the scaffold for the configured jurisdiction and always defers to the clinician's plan (N-4). See `20-WHO_GUIDELINES.md` W-1.

## 6. Content Typing Rules

- N-1, N-2 → **Clinical Recommendation** (+ clinician-review).
- N-3, reconciliation → **Educational**.
- No NICE item is an Emergency Warning.

## 7. Business Rules

- BR-1: The active schedule scaffold is determined by the jurisdiction setting; WHO is the global default.
- BR-2: Parity (nulliparous/parous) selects the NICE count when UK scaffold is active.
- BR-3: The clinician's actual appointments always take precedence over any scaffold.

## 8. Edge Cases

- User in a jurisdiction with neither WHO-default nor NICE scaffold: fall back to WHO global default.
- Parity unknown: show nulliparous (higher-contact) scaffold as the safer, more supportive default, clearly labelled.

## 9. Acceptance Criteria

- [x] NG201 counts and booking timing cited.
- [x] WHO/NICE reconciliation stated; no single "correct" schedule asserted.
- [x] Jurisdiction/parity selection rules defined.

## 10. Future Expansion

Add NICE guidance references for postnatal care and specific conditions (educational) as modules deepen; support additional national scaffolds.

## 11. Dependencies

`20-WHO_GUIDELINES.md`, `docs/06-Modules/82-PREGNANCY_MODULE.md`, `docs/08-Timeline/110-PREGNANCY_TIMELINE.md`.

## 12. Open Questions

- OQ-1: First-launch jurisdiction and default scaffold (WHO vs. NICE vs. national).
- OQ-2: How parity is collected without feeling clinical/intrusive (UX).

## 13. Risks

- R-1: Presenting a schedule as mandatory. Mitigation: BR-3 clinician precedence.
- R-2: Region mismatch. Mitigation: §8 WHO fallback.

_Sources:_ [NICE NG201](https://www.nice.org.uk/guidance/ng201) · [NG201 recommendations](https://www.nice.org.uk/guidance/ng201/chapter/recommendations) · [NICE QS22](https://www.nice.org.uk/guidance/qs22)
