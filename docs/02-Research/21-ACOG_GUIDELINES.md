# 21 — ACOG Guidelines (US Obstetric Practice)

| Field | Value |
|---|---|
| Document | ACOG Guidelines Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Clinical Informatics Specialist |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/83-VITALS_MODULE.md` |

---

## 1. Purpose

Curates American College of Obstetricians and Gynecologists (ACOG) guidance grounding Wise Bloom Care's vitals content — gestational weight gain, blood-pressure monitoring, and hypertensive-disorder awareness. Reference for content authors, not clinical instruction. **[FACT]/[DESIGN]** separation applies as in `20-WHO_GUIDELINES.md`.

## 2. Scope

Weight-gain ranges by BMI, BP monitoring cadence, and preeclampsia/gestational-hypertension awareness copy. Excludes diagnosis, management, and delivery-timing decisions (out of scope; `docs/01-Product/17-NON_GOALS.md`).

## 3. Primary Sources

- ACOG, *Preeclampsia and High Blood Pressure During Pregnancy* (patient FAQ). https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy
- ACOG gestational weight-gain guidance (as summarised in AAFP, *Obesity in Pregnancy: ACOG Committee Opinion*). https://www.aafp.org/pubs/afp/issues/2006/0415/p1471.html
- Note: ACOG weight-gain ranges align with the Institute of Medicine (IOM/NAM) 2009 recommendations.

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| A-1 | **[FACT]** ACOG-recommended gestational weight gain by pre-pregnancy BMI: BMI < 25 → **25–35 lb (11.4–15.9 kg)**; BMI 25–29 → **15–25 lb (6.8–11.4 kg)**; BMI ≥ 30 → **~15 lb (6.8 kg)** (singleton pregnancy; aligns with IOM 2009). | Clinical Recommendation | Weight-gain target bands in `83-VITALS`, shown as *recommended ranges — confirm with your clinician*. |
| A-2 | **[FACT]** Blood pressure should be checked **at each prenatal visit**. | Clinical Recommendation | Encourages BP logging cadence; educational reminder copy. |
| A-3 | **[FACT]** Preeclampsia is a serious disorder usually developing **after 20 weeks**, often in the third trimester; gestational hypertension is hypertension without proteinuria/severe features after 20 weeks that normalises postpartum. | Educational | Awareness content; red-flag symptoms routed to typed Emergency Warnings (`knowledge-base/emergency/`). |
| A-4 | **[DESIGN]** Wise Bloom Care shows weight-gain bands as *context*, computes trend vs. band, and recommends clinician review for out-of-band trends — it never diagnoses or advises intervention. | Design decision | Enforces NG-1/NG-2. |

## 5. Content Typing Rules

- A-1, A-2 → **Clinical Recommendation** (+ clinician-review).
- A-3 awareness → **Educational**; associated severe symptoms (e.g., severe headache with vision changes) → **Emergency Warning**, sourced from `knowledge-base/emergency/`, never inferred by the app from a user's numbers.
- The app **never** captions a user's own BP/weight value with a diagnostic label.

## 6. Business Rules

- BR-1: Weight-gain bands require the user's pre-pregnancy BMI category; if unknown, show general education, not a specific band.
- BR-2: Units shown in both kg and lb; kg is the stored canonical unit (`docs/05-Data/72-FIELD_SPECIFICATIONS.md`).
- BR-3: No automated preeclampsia risk scoring is presented as diagnosis; trends only, with clinician-review.

## 7. Edge Cases

- Multiple gestation (twins+): ACOG/IOM ranges differ; product shows a note and defers to clinician rather than applying singleton bands.
- Underweight/obese extremes, pre-existing hypertension/diabetes: show general education + clinician-review, not tailored targets.
- Unknown pre-pregnancy weight: cannot compute gain; capture current weight and educate.

## 8. Acceptance Criteria

- [x] Weight-gain bands cited and BMI-conditioned.
- [x] BP cadence and preeclampsia awareness cited and correctly typed.
- [x] No diagnostic captioning of user values.

## 9. Future Expansion

Add ACOG guidance on gestational diabetes screening, aspirin prophylaxis awareness (educational only), and postpartum care as those modules deepen.

## 10. Dependencies

`docs/06-Modules/83-VITALS_MODULE.md`, `28-MEDICAL_DISCLAIMER.md`, `knowledge-base/emergency/`.

## 11. Open Questions

- OQ-1: Default unit system by jurisdiction (kg/cm vs. lb/in) — UX/settings decision.
- OQ-2: Whether to show twin-specific bands or defer entirely (currently defer).

## 12. Risks

- R-1: Applying singleton bands to multiples. Mitigation: §7 edge-case note.
- R-2: Users reading bands as targets to hit. Mitigation: framing as ranges + clinician-review (A-4).

_Sources:_ [ACOG preeclampsia FAQ](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy) · [ACOG weight-gain via AAFP](https://www.aafp.org/pubs/afp/issues/2006/0415/p1471.html)
