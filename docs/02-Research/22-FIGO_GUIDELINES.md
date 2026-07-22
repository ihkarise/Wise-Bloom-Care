# 22 — FIGO Guidelines (International Obstetric Guidance)

| Field | Value |
|---|---|
| Document | FIGO Guidelines Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Maternal & Child Health Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/83-VITALS_MODULE.md` |

---

## 1. Purpose

Curates guidance from the International Federation of Gynecology and Obstetrics (FIGO) grounding Wise Bloom Care's content on **hyperglycemia in pregnancy (gestational diabetes, GDM)** and related preventive nutrition awareness. Reference for content authors, not clinical instruction. **[FACT]/[DESIGN]** separation applies.

## 2. Scope

GDM screening awareness and blood-sugar context for the vitals module; adolescent/preconception/maternal nutrition framing. Excludes diagnosis, insulin/therapy decisions, and management protocols (out of scope; `docs/01-Product/17-NON_GOALS.md`).

## 3. Primary Sources

- Hod M. et al., *The FIGO Initiative on gestational diabetes mellitus: a pragmatic guide for diagnosis, management, and care*, Int J Gynecol Obstet, 2015. https://obgyn.onlinelibrary.wiley.com/doi/10.1016/S0020-7292%2815%2930033-3 · PubMed: https://pubmed.ncbi.nlm.nih.gov/26433807/
- FIGO GDM Initiative infographic. http://womendeliver.org/wp-content/uploads/2017/03/Figo_Infographics.pdf

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| F-1 | **[FACT]** FIGO recommends defining GDM via a **single-step 75-g oral glucose tolerance test (OGTT)**, typically at **24–28 weeks** (or any time in pregnancy). | Educational | Explains *what an OGTT is* and *when it's commonly done*; never instructs the user to self-test or self-interpret. |
| F-2 | **[FACT]** FIGO diagnostic thresholds (per its guide): fasting **5.1–6.9 mmol/L (92–125 mg/dL)**; 1-h post-load **≥10.0 mmol/L (180 mg/dL)**; 2-h post-load **8.5–11.0 mmol/L (153–199 mg/dL)**. | Clinical Recommendation (reference) | Displayed only as *reference context* alongside clinician-provided results; the app never diagnoses from user-entered glucose values. |
| F-3 | **[FACT]** FIGO calls for **universal testing** of pregnant women for hyperglycemia and emphasises adolescent, preconception, and maternal **nutrition**. | Educational | Motivates nutrition education (`docs/06-Modules/86-NUTRITION_MODULE.md`) and awareness of routine screening. |
| F-4 | **[DESIGN]** Wise Bloom Care stores blood-sugar entries and shows trends; it presents FIGO thresholds as labelled *reference ranges* only, always with clinician-review, and never outputs "you have GDM". | Design decision | Enforces NG-1/NG-2. |

## 5. Content Typing Rules

- F-1, F-3 → **Educational**.
- F-2 thresholds → **Clinical Recommendation (reference only)**, never applied by the app to classify a user; always clinician-review.
- Severe hyperglycemia/hypoglycemia symptoms → **Emergency Warning** from `knowledge-base/emergency/`, not inferred from numbers.

## 6. Business Rules

- BR-1: Glucose values are stored with unit and context (fasting / post-load / random); canonical unit and dual display defined in `docs/05-Data/72-FIELD_SPECIFICATIONS.md`.
- BR-2: The app never labels a user as GDM/normal based on entered values; it surfaces trend + reference range + clinician-review.
- BR-3: FIGO thresholds shown with an explicit "reference — your clinician interprets your results" note.

## 7. Edge Cases

- Users following a national protocol that differs from FIGO single-step (e.g., two-step): show general education and defer interpretation to the clinician; do not assert one protocol as correct.
- Pre-existing (pre-gestational) diabetes: distinct from GDM; product shows general education + clinician-review, not GDM framing.

## 8. Acceptance Criteria

- [x] GDM screening timing and thresholds cited to FIGO source.
- [x] Thresholds are reference-only; no app diagnosis.
- [x] Nutrition linkage established.

## 9. Future Expansion

Add FIGO guidance on preeclampsia prevention and adolescent/preconception care (educational) as those areas grow.

## 10. Dependencies

`docs/06-Modules/83-VITALS_MODULE.md`, `86-NUTRITION_MODULE.md`, `28-MEDICAL_DISCLAIMER.md`.

## 11. Open Questions

- OQ-1: Which screening protocol to reference by default per jurisdiction (FIGO single-step vs. national two-step).
- OQ-2: Canonical glucose unit (mg/dL vs. mmol/L) by market.

## 12. Risks

- R-1: Users self-diagnosing from thresholds. Mitigation: BR-2/BR-3 reference-only framing.
- R-2: Protocol conflict across regions. Mitigation: §7 defer-to-clinician.

_Sources:_ [FIGO GDM guide (Wiley)](https://obgyn.onlinelibrary.wiley.com/doi/10.1016/S0020-7292%2815%2930033-3) · [PubMed 26433807](https://pubmed.ncbi.nlm.nih.gov/26433807/)
