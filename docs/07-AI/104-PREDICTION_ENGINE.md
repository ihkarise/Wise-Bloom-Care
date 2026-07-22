# 104 — Prediction Engine

| Field | Value |
|---|---|
| Document | Prediction Engine Design |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect / Clinical Informatics |
| Last Updated | 2026-07-22 |
| Related | `docs/06-Modules/83-VITALS_MODULE.md`, `90-GROWTH_MODULE.md`, `105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the prediction/trend engine (v2) that projects metrics (weight-gain trajectory, BP trend, growth percentile trajectory) to help users see where a trend is heading. Predictions are **surfacing/educational only** — never diagnosis, risk scoring presented as clinical fact, or a call to act.

## 2. Scope
Trend computation and projection for vitals and growth; presentation as the "prediction" of the four canonical views. Not: diagnosis, clinical risk stratification, treatment triggers (NG-1..NG-5).

## 3. Principles
- Surfacing, not deciding: predictions illustrate a trajectory; they never diagnose or recommend intervention.
- Honest uncertainty: predictions show confidence/ranges and are clearly labelled estimates.
- Calm presentation: no alarming projections; out-of-band trajectories → clinician-review, not alarm.
- Grounded methodology: transparent, explainable methods; no opaque "risk of disease" outputs.

## 4. What It Predicts
| Metric | Projection | Presentation |
|---|---|---|
| Weight gain | trajectory vs. ACOG/IOM band (context) | line + band; "estimate"; clinician-review if off-trajectory |
| Blood pressure | trend direction/level over time | trend; calm; clinician-review if rising out-of-band |
| Growth percentile | percentile trajectory on WHO curve | projected point; "estimate"; clinician-review if crossing bands |

## 5. Methodology
- Start simple and explainable (e.g., trend fitting/regression on the user's own series), not black-box risk models.
- Require sufficient data points; otherwise show "not enough data to project" (no fabricated trend).
- Confidence/uncertainty shown; single outliers de-weighted (`docs/06-Modules/83`, `90`).
- Methods documented for review; changes versioned.

## 6. Guardrails & Typing
- Predictions are typed **Clinical Recommendation (contextual)** or **Educational**, always with clinician-review; never Emergency auto-escalation.
- Post-processed through guardrails (`105`): no diagnostic/prescriptive language; no "risk of [disease]" claims presented as fact.
- Never triggers automated actions.

## 7. Business Rules
- BR-1 Predictions are surfacing/educational only; never diagnostic or prescriptive.
- BR-2 Predictions are labelled estimates with uncertainty; require sufficient data.
- BR-3 Out-of-trajectory → calm clinician-review, never alarm/emergency auto-escalation.
- BR-4 Methods are explainable, documented, versioned.
- BR-5 Predictions never auto-act on records.

## 8. Edge Cases
Sparse data (no projection); noisy data/outliers (de-weight; show uncertainty); implausible inputs (validated first, `docs/05-Data/73`); multiples/preterm (defer/adjust; note limitations); rapidly changing values (clinician-review, calm).

## 9. Acceptance Criteria
- [x] Metrics + explainable methodology + uncertainty defined.
- [x] Surfacing-only, non-diagnostic, calm out-of-band handling.
- [x] Guardrail/typing integration; sufficient-data requirement.

## 10. Future Expansion
Richer models (with clinical validation + review), personalised (guarded) insights, anomaly surfacing (educational), integration with device data — all remaining non-diagnostic.

## 11. Dependencies
`docs/06-Modules/83`, `90`, `105`, `docs/02-Research/21`, `25`, `28`, `docs/05-Data/73`.

## 12. Open Questions
- OQ-1 Minimum data points per prediction type.
- OQ-2 How to present uncertainty simply yet honestly (UX).

## 13. Risks
- R-1 Prediction read as diagnosis/risk verdict. Mitigation: BR-1/BR-3 + guardrails.
- R-2 Overconfident projections. Mitigation: BR-2 uncertainty + sufficient-data.
