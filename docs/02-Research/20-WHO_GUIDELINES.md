# 20 — WHO Guidelines (Antenatal & Maternal Care)

| Field | Value |
|---|---|
| Document | WHO Guidelines Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Maternal & Child Health Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/82-PREGNANCY_MODULE.md`, `docs/08-Timeline/110-PREGNANCY_TIMELINE.md` |

---

## 1. Purpose

Curates the World Health Organization guidance that grounds Wise Bloom Care's pregnancy and maternal-care content. This document is a **reference for content authors and product teams**, not clinical instruction to users. Every user-facing statement derived from WHO guidance must trace back to an entry here and be typed as Educational or Clinical Recommendation (never Emergency unless explicitly so classified). See `28-MEDICAL_DISCLAIMER.md`.

> **Fact vs. design.** Statements in §4 marked **[FACT]** are drawn from the cited WHO sources. Statements marked **[DESIGN]** are Wise Bloom Care product decisions about how to use that guidance. The two are never merged in user-facing copy.

## 2. Scope

Covers WHO antenatal care (ANC) model, and pointers to WHO newborn/child guidance handled in sibling docs (`25-WHO_CHILD_GROWTH.md`). Excludes diagnosis/treatment protocols (out of product scope, `docs/01-Product/17-NON_GOALS.md`).

## 3. Primary Sources

- WHO, *Recommendations on antenatal care for a positive pregnancy experience* (2016). https://www.who.int/publications/i/item/9789241549912
- WHO, *ANC recommendations — highlights and key messages* (WHO-RHR-18.02). https://www.who.int/publications/i/item/WHO-RHR-18.02
- WHO ANC summary PDF. https://www.who.int/docs/default-source/reproductive-health/maternal-health/anc.pdf

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| W-1 | **[FACT]** WHO recommends a minimum of **8 antenatal care contacts** for a positive pregnancy experience (2016 model), replacing the earlier 4-visit "focused ANC" model. | Clinical Recommendation | Seed the appointments/schedule context; educate that ≥8 contacts is the WHO recommendation — *discuss your schedule with your clinician*. |
| W-2 | **[FACT]** The model schedules the **first contact in the first trimester**, then **two contacts in the second trimester** and **five in the third**. | Clinical Recommendation | Suggested timeline scaffold for pregnancy appointments (`docs/08-Timeline/110`). |
| W-3 | **[FACT]** WHO found the 4-visit model was associated with more perinatal deaths vs. ≥8 contacts, and more contacts associate with higher maternal satisfaction. | Educational | Rationale copy explaining *why* regular contacts matter (calm, non-alarmist). |
| W-4 | **[FACT]** ANC aims to provide respectful, individualised, person-centred care with timely information and psychosocial/emotional support. | Educational | Frames product tone: supportive, informational, not directive. |
| W-5 | **[DESIGN]** Wise Bloom Care surfaces the ≥8-contact recommendation as *educational context*, never as a schedule the app enforces; the clinician owns the actual plan. | Design decision | Guardrail against NG-3/NG-5 (no treatment planning). |

## 5. Content Typing Rules (WHO-derived)

- Numeric/recommendation statements (W-1, W-2) → **Clinical Recommendation**, always paired with "discuss with your clinician".
- Explanatory rationale (W-3, W-4) → **Educational**.
- WHO guidance is **never** rendered as an Emergency Warning; emergency red-flags come from typed emergency content (`knowledge-base/emergency/`).

## 6. Business Rules

- BR-1: Any WHO-derived user copy cites the specific source (§3) in the content metadata.
- BR-2: WHO recommendations are presented as context + clinician-review, never as app-enforced rules.
- BR-3: When WHO revises the ANC model, this doc and dependent knowledge-base entries are re-reviewed (`27-REFERENCES.md`).

## 7. Edge Cases

- Users who cannot access ≥8 contacts (resource-limited settings): copy must not induce guilt; frame as "recommended where available".
- Late booking (first contact after first trimester): educate gently; never scold.

## 8. Acceptance Criteria

- [x] Each guidance item cites a WHO primary source.
- [x] Facts and design decisions are explicitly separated.
- [x] Content typing rules defined; no WHO item mistyped as emergency.

## 9. Future Expansion

Add WHO postnatal care (2022) and WHO newborn guidance references as postpartum/newborn content deepens; link intrapartum guidance for the delivery module.

## 10. Dependencies

`27-REFERENCES.md` (master citation list), `28-MEDICAL_DISCLAIMER.md`, `knowledge-base/pregnancy/*`.

## 11. Open Questions

- OQ-1: Whether to localise the ANC schedule scaffold by jurisdiction (WHO vs. national schedules differ).

## 12. Risks

- R-1: Presenting WHO recommendations as mandates. Mitigation: BR-2.
- R-2: Guideline staleness. Mitigation: BR-3 review trigger.

_Sources:_ [WHO ANC 2016](https://www.who.int/publications/i/item/9789241549912) · [WHO-RHR-18.02](https://www.who.int/publications/i/item/WHO-RHR-18.02) · [WHO ANC summary PDF](https://www.who.int/docs/default-source/reproductive-health/maternal-health/anc.pdf)
