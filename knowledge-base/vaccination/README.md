---
content_type: clinical_recommendation
source_ref: [S-IND-NIS, S-UNICEF-IN, S-WHO-IMM]
domain: vaccination
version: 1.0
last_reviewed: 2026-07-22
review_due: before-each-release
---

# Knowledge Base — Vaccination

> **Educational / reference information, not medical advice.** The app records and reminds; it never advises for or against vaccination. See `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

## Purpose
Reference schedule data and educational content about childhood immunizations — supporting the vaccination module (`docs/06-Modules/92-VACCINATION_MODULE.md`) and vaccine timeline (`docs/08-Timeline/114-VACCINE_TIMELINE.md`). Default jurisdiction: India National Immunization Schedule (NIS).

## Scope
- Schedule reference data (jurisdiction-keyed, versioned): vaccine, dose, recommended age (`docs/02-Research/24-GOVT_IMMUNIZATION.md`).
- Educational vaccine-purpose content (typed Educational).

## Governance
- Schedule is versioned data, re-verified against official sources **before each release** (`docs/02-Research/24-GOVT_IMMUNIZATION.md` BR-3).
- Records reflect actual doses given (source of truth), even if divergent from the scaffold.
- Adverse-event red-flags → curated `knowledge-base/emergency/`, never inferred.
- Exact current NIS booster ages must be re-verified pre-ship `[VERIFY: official NIS]`.

## Sources
India NIS (NHM); UNICEF India; WHO immunization data — see `docs/02-Research/24-GOVT_IMMUNIZATION.md`, `27-REFERENCES.md`.
