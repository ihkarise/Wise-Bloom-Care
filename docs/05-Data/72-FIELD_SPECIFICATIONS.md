# 72 — Field Specifications

| Field | Value |
|---|---|
| Document | Field Specifications |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect |
| Last Updated | 2026-07-22 |
| Related | `70-DATA_DICTIONARY.md`, `73-VALIDATION_RULES.md`, `docs/04-Architecture/56-API_SPEC.md`, `docs/02-Research/*` |

---

## 1. Purpose

Specifies the concrete type, format, unit, and allowed values for each significant field, so the API, storage adapter, and client agree on representation. This is the reference for serialization, validation (`73`), and unit handling.

## 2. Scope

Field-level types/formats/units for core entities. Validation logic/ranges: `73`. Meaning/ownership: `70`.

## 3. Conventions

- **Types:** `uuid`, `string`, `int`, `decimal`, `enum`, `date` (ISO 8601 `YYYY-MM-DD`), `datetime` (ISO 8601 UTC), `bool`, `ref` (media/file reference).
- **Canonical units** stored; UI may display converted units (`docs/03-UX/*`), but storage is canonical.
- **Timezones:** timestamps stored UTC; user-local presentation client-side.
- IDs are opaque UUID strings.

## 4. Identity & Time

| Field | Type | Format/notes |
|---|---|---|
| *_id | uuid | opaque |
| created_at / *_at | datetime | ISO 8601 UTC |
| dob / lmp / edd | date | ISO 8601 date |

## 5. Vitals

| Field | Type | Unit (canonical) | Notes |
|---|---|---|---|
| bp_systolic | int | mmHg | with diastolic; context=`bp` |
| bp_diastolic | int | mmHg | paired |
| weight | decimal | kg | display kg/lb per settings |
| height/length | decimal | cm | for growth |
| blood_sugar | decimal | mg/dL (canonical) | also convertible to mmol/L; context ∈ {fasting, 1h_post, 2h_post, random} |
| vital.context | enum | — | type-specific context |

> Canonical units: weight **kg**, length **cm**, glucose **mg/dL** (dual-display supported; jurisdiction default TBD — `73`/settings).

## 6. Maternal / Pregnancy

| Field | Type | Notes |
|---|---|---|
| lmp | date | basis for GA (derived, not stored) |
| edd | date | estimated due date |
| pre_pregnancy_bmi_cat | enum | {under25, 25to29, 30plus, unknown} → weight-gain bands (`docs/02-Research/21`) |
| parity | enum | {nulliparous, parous, unknown} → NICE scaffold (`docs/02-Research/23`) |

## 7. Child / Growth / Milestones / Vaccination

| Field | Type | Notes |
|---|---|---|
| sex | enum | {female, male} — required for WHO curve (`docs/02-Research/25`) |
| ga_at_birth_weeks | decimal | for preterm/corrected age |
| growth.indicator | enum | {weight_for_age, length_for_age, weight_for_length, bmi_for_age} |
| growth.value/unit | decimal/enum | kg or cm per indicator |
| milestone.code | string | CDC milestone identifier (2022 set) |
| milestone.status | enum | {achieved, not_yet, not_sure} |
| vaccine_code | string | maps to schedule dataset (`docs/02-Research/24`) |
| vaccination.status | enum | {given, skipped, deferred, scheduled} |

## 8. Events / Timeline

| Field | Type | Notes |
|---|---|---|
| event.type | enum | {vital, appointment, report, medicine, delivery, growth, milestone, vaccination, journal, note} |
| life_stage | enum | {conception, pregnancy, delivery, postpartum, newborn, infancy, toddler, child} |
| version | int | correction version (`77`) |

## 9. Content & Schedule (reference)

| Field | Type | Notes |
|---|---|---|
| content_type | enum | {educational, clinical_recommendation, emergency_warning} (`docs/02-Research/28`) |
| source_ref | string | resolves to `docs/02-Research/27` |
| schedule.age_min/max | int | age in days/weeks (unit noted) |

## 10. Identity/Auth

| Field | Type | Notes |
|---|---|---|
| email_hash | string | hashed/tokenised (`docs/09-Security/121`) |
| credential_hash | string | salted hash; never plaintext |
| role | enum | {account_holder, caregiver, clinician} |

## 11. Media References

| Field | Type | Notes |
|---|---|---|
| media_ref / file_ref | ref | private Drive reference; backend-mediated; never public (`docs/04-Architecture/54` §6) |

## 12. Business Rules

- BR-1: Store canonical units; convert only for display.
- BR-2: Timestamps stored UTC (ISO 8601); dates ISO 8601.
- BR-3: Enums are closed sets; unknown values rejected (`73`).
- BR-4: `content_type` + `source_ref` required on medical content items.
- BR-5: Credentials/emails never stored in plaintext.

## 13. Edge Cases

- Unit ambiguity (mg/dL vs mmol/L; kg vs lb) → store canonical + unit metadata; convert in UI.
- Partial dates (unknown day) → allow where meaningful (e.g., approximate LMP) with a flag; validation in `73`.
- Preterm → `ga_at_birth_weeks` drives corrected-age computations.

## 14. Acceptance Criteria

- [x] Types/formats/units specified for core fields.
- [x] Canonical units + UTC timestamps mandated.
- [x] Enums closed; content typing fields required.

## 15. Future Expansion

Localised units/defaults per jurisdiction; additional indicators (head circumference); device-sourced field formats; formal JSON Schemas per entity.

## 16. Dependencies

`70`, `73`, `docs/04-Architecture/56`, `docs/02-Research/21`, `23`, `24`, `25`, `28`.

## 17. Open Questions

- OQ-1: Jurisdiction-default unit systems.
- OQ-2: Email protection method (hash vs tokenise vs encrypt).

## 18. Risks

- R-1: Unit mismatch causing wrong charts. Mitigation: BR-1 canonical + metadata.
- R-2: Enum drift. Mitigation: BR-3 closed sets + validation.
