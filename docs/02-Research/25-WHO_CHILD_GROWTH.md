# 25 — WHO Child Growth Standards

| Field | Value |
|---|---|
| Document | WHO Child Growth Standards Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Maternal & Child Health Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/90-GROWTH_MODULE.md` |

---

## 1. Purpose

Grounds Wise Bloom Care's child-growth charting in the WHO Child Growth Standards (2006). Defines which indicators, references, and thresholds the growth module uses, how percentiles/z-scores are interpreted, and the boundary between *charting* (product) and *diagnosis* (clinician). **[FACT]/[DESIGN]** separation applies.

## 2. Scope

Growth indicators for children **0–60 months**: weight-for-age, length/height-for-age, weight-for-length/height, and BMI-for-age; percentile and z-score display. Excludes clinical diagnosis of malnutrition/failure-to-thrive (clinician's domain).

## 3. Primary Sources

- WHO Multicentre Growth Reference Study Group, *WHO Child Growth Standards based on length/height, weight and age*, Acta Paediatrica, 2006. https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1651-2227.2006.tb02378.x
- WHO, *Child Growth Standards* (charts & tables). https://www.who.int/tools/child-growth-standards
- WHO, *Computation of centiles and z-scores*. https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/computation.pdf
- CDC, *Using WHO Growth Standard Charts*. https://www.cdc.gov/growth-chart-training/hcp/using-growth-charts/who-using.html

## 4. Key Guidance Used in Product

| # | Guidance | Type | Product use |
|---|---|---|---|
| G-1 | **[FACT]** WHO provides percentile and z-score curves for **weight-for-age, length/height-for-age, weight-for-length/height, and BMI-for-age** for ages **0–60 months**. | Educational / charting | Growth charts in `90-GROWTH` plotting the child's measurements against WHO curves. |
| G-2 | **[FACT]** WHO commonly uses cutoffs of **±2 standard deviations (z-scores)** to flag abnormal growth, corresponding to the **2.3rd and 97.7th percentiles**. | Clinical Recommendation (reference) | Charts may show ±2 SD reference bands; values outside are surfaced as *"outside the typical range — discuss with your clinician"*, never as a diagnosis. |
| G-3 | **[FACT]** The standards derive from healthy, breastfed children in non-growth-constraining environments — a *prescriptive* standard (how children *should* grow), not merely descriptive. | Educational | Explains why WHO (not local descriptive references) is used for 0–5y. |
| G-4 | **[FACT]** WHO standards are used for **0–5 years**; CDC/other references are typically used for older children (context for future expansion). | Educational | Sets the age boundary for the WHO dataset. |
| G-5 | **[DESIGN]** Wise Bloom Care computes and displays percentile/z-score and trend; it flags out-of-band values calmly with clinician-review and never labels a child as malnourished/overweight. | Design decision | Enforces NG-1. |

## 5. Interpretation & Display Rules

- Plot the child's measurement on the correct sex-specific WHO curve for the indicator.
- Show current value, previous, trend, and (optionally) a gentle projection — never alarmist colouring (`docs/03-UX/35-DESIGN_SYSTEM.md`).
- Out-of-band (beyond ±2 SD) → calm, typed **Clinical Recommendation** to consult the clinician; single measurements are not over-interpreted (trend matters).
- Do **not** output diagnostic terms (stunting/wasting/obesity) — those are clinician determinations.

## 6. Business Rules

- BR-1: Sex and accurate date of birth are required to select the correct curve; if missing, charting is disabled with an explanation.
- BR-2: Measurements stored in canonical units (kg, cm) with unit metadata (`docs/05-Data/72-FIELD_SPECIFICATIONS.md`).
- BR-3: Percentile/z-score computed from official WHO tables/method (G-1, §3), versioned with the dataset.
- BR-4: A single out-of-band point never triggers an emergency treatment; it triggers a calm clinician-review suggestion.

## 7. Edge Cases

- Preterm infants: chronological vs. corrected age materially changes plotting; the app must record gestational age at birth and support corrected-age plotting or clearly flag the limitation.
- Implausible/erroneous measurements (data entry): validation flags outliers for user correction before charting (`docs/05-Data/73-VALIDATION_RULES.md`).
- Sparse data (few measurements): show what exists; do not fabricate a trend.
- Age > 60 months: WHO 0–5y dataset no longer applies (future: older-child references).

## 8. Acceptance Criteria

- [x] Indicators, age range, and ±2 SD interpretation cited to WHO.
- [x] Prescriptive-standard rationale (G-3) captured.
- [x] Charting-not-diagnosis boundary explicit.
- [x] Preterm/corrected-age edge case addressed.

## 9. Future Expansion

Add WHO/CDC references for ages 5–19; head-circumference-for-age and other indicators; velocity charts; corrected-age handling refinements.

## 10. Dependencies

`docs/06-Modules/90-GROWTH_MODULE.md`, `docs/05-Data/72-FIELD_SPECIFICATIONS.md`, `docs/05-Data/73-VALIDATION_RULES.md`, `docs/03-UX/35-DESIGN_SYSTEM.md`.

## 11. Open Questions

- OQ-1: Corrected-age plotting for preterm infants in v1 vs. v2.
- OQ-2: Default unit system by jurisdiction.
- OQ-3: Whether to show z-score, percentile, or both to users (percentile likely more intuitive; z-score for export/clinician).

## 12. Risks

- R-1: Over-interpreting single measurements. Mitigation: trend emphasis + BR-4.
- R-2: Preterm mis-plotting. Mitigation: §7 corrected-age handling.

_Sources:_ [WHO Child Growth Standards (2006)](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1651-2227.2006.tb02378.x) · [WHO tools](https://www.who.int/tools/child-growth-standards) · [WHO z-score computation](https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/computation.pdf) · [CDC on WHO charts](https://www.cdc.gov/growth-chart-training/hcp/using-growth-charts/who-using.html)
