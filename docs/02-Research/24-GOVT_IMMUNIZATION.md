# 24 — Government Immunization Schedule

| Field | Value |
|---|---|
| Document | Immunization Schedule Reference |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Maternal & Child Health Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `docs/06-Modules/92-VACCINATION_MODULE.md`, `docs/08-Timeline/114-VACCINE_TIMELINE.md` |

---

## 1. Purpose

Provides the authoritative, citeable immunization schedule data that seeds Wise Bloom Care's vaccination module. Because schedules are **jurisdiction-specific**, this document defines the default schedule (India's National Immunization Schedule, aligned with the product's primary market), the reconciliation approach for other jurisdictions, and the data structure the module consumes. **[FACT]/[DESIGN]** separation applies.

## 2. Scope

Routine infant/childhood immunization schedule data (birth → early childhood) as a **reminder and record** reference. Excludes any clinical decision about whether/when a child should be vaccinated (clinician's domain; `docs/01-Product/17-NON_GOALS.md`).

## 3. Primary Sources

- Government of India / National Health Mission, *National Immunization Schedule (NIS)*. https://nhm.gov.in/New_Updates_2018/NHM_Components/Immunization/report/National_%20Immunization_Schedule.pdf
- UNICEF India, *Know your child's immunization schedule*. https://www.unicef.org/india/know-your-childs-immunization-schedule
- (Cross-reference) WHO immunization schedules by country. https://immunizationdata.who.int

## 4. Default Schedule — India NIS (infant, birth to ~1 year)

> **[FACT]** Summarised from the India National Immunization Schedule. This is **reference data for records/reminders**, not medical advice. The child's clinician determines the actual schedule.

| Age | Vaccines (India NIS) |
|---|---|
| At birth | BCG; OPV-0 (birth dose); Hepatitis B (birth dose) |
| 6 weeks | OPV-1; Pentavalent-1 (DPT + HepB + Hib); RVV-1 (rotavirus); fIPV-1; PCV-1 |
| 10 weeks | OPV-2; Pentavalent-2; RVV-2 |
| 14 weeks | OPV-3; Pentavalent-3; RVV-3; fIPV-2; PCV-2 |
| 9–12 months | Measles–Rubella (MR)-1; JE-1 (where endemic); PCV-Booster (per current NIS) |
| 16–24 months | MR-2; DPT booster-1; OPV booster; JE-2 (where endemic) |

**[FACT]** BCG protects against severe tuberculosis; OPV protects against poliovirus; rotavirus vaccine protects against rotaviral diarrhoeal disease (per UNICEF India / NIS).

> Note: NIS is periodically revised; exact ages/boosters (e.g., PCV booster timing, JE applicability) must be re-verified against the current official NIS before shipping (BR-3).

## 5. Multi-Jurisdiction Approach

- **[DESIGN]** The schedule is stored as **data, not code** — a versioned dataset keyed by jurisdiction, so additional national schedules (WHO, UK/UKHSA, US/CDC/ACIP, etc.) can be added without code changes (`docs/06-Modules/92-VACCINATION_MODULE.md`).
- The active schedule follows the configured jurisdiction; the clinician's actual record always overrides the scaffold.
- Where a child's clinic follows a private/IAP schedule differing from NIS, the user can record the actual doses given; the app tracks *what happened*, not what *should* happen.

## 6. Data Structure (for the module)

Each schedule entry: `{ jurisdiction, schedule_version, vaccine_code, vaccine_name, dose_number, recommended_age_min, recommended_age_max, notes, source_ref }`. Full field specs: `docs/05-Data/72-FIELD_SPECIFICATIONS.md`.

## 7. Content Typing Rules

- Schedule entries → **Clinical Recommendation (reference)**, always with "confirm with your clinician".
- Vaccine purpose descriptions → **Educational**.
- Adverse-reaction red flags → **Emergency Warning** from `knowledge-base/emergency/`, never inferred by the app.
- The app **never** advises for/against vaccination; it records and reminds.

## 8. Business Rules

- BR-1: The default jurisdiction schedule is India NIS unless configured otherwise.
- BR-2: Reminders are based on the child's date of birth + schedule ages; the user marks doses as given/skipped/deferred.
- BR-3: Schedule datasets are versioned and re-verified against official sources on each product release (`docs/01-Product/16-RELEASE_PLAN.md`).
- BR-4: The app records actual doses even when they diverge from the scaffold (single source of truth = what happened).

## 9. Edge Cases

- Premature infants / catch-up schedules: the app shows the standard scaffold but flags "your clinician may adjust timing"; it does not compute catch-up itself.
- Missed/late doses: reminders continue gently; no scolding; clinician-review suggested.
- Vaccine not in the active jurisdiction schedule (e.g., optional/private vaccines): user can add a custom recorded dose.
- Multiple births: each child has an independent vaccination record.

## 10. Acceptance Criteria

- [x] Default schedule cited to official India NIS / UNICEF India.
- [x] Schedule modelled as versioned, jurisdiction-keyed data.
- [x] Reminder logic and "record what happened" rule defined.
- [x] No app-level vaccinate/don't-vaccinate advice.

## 11. Future Expansion

Add CDC/ACIP (US), UKHSA (UK), and WHO default schedules; maternal vaccines (e.g., Tdap in pregnancy) as an educational cross-link; travel/optional vaccines.

## 12. Dependencies

`docs/06-Modules/92-VACCINATION_MODULE.md`, `docs/08-Timeline/114-VACCINE_TIMELINE.md`, `docs/05-Data/72-FIELD_SPECIFICATIONS.md`.

## 13. Open Questions

- OQ-1: First-launch jurisdiction default (India NIS assumed).
- OQ-2: Whether to support IAP/private schedules as selectable presets in v1.
- OQ-3: Exact current NIS booster ages to be re-verified pre-ship.

## 14. Risks

- R-1: Shipping a stale schedule. Mitigation: BR-3 per-release re-verification + versioning.
- R-2: Users treating reminders as medical advice. Mitigation: reference typing + clinician-review (§7).

_Sources:_ [India NIS (NHM)](https://nhm.gov.in/New_Updates_2018/NHM_Components/Immunization/report/National_%20Immunization_Schedule.pdf) · [UNICEF India schedule](https://www.unicef.org/india/know-your-childs-immunization-schedule) · [WHO immunization data](https://immunizationdata.who.int)
