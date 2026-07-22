# 70 — Data Dictionary

| Field | Value |
|---|---|
| Document | Data Dictionary |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect |
| Last Updated | 2026-07-22 |
| Related | `71-ENTITY_RELATIONSHIP.md`, `72-FIELD_SPECIFICATIONS.md`, `docs/04-Architecture/55-DATABASE_MODEL.md`, `docs/00-Vision/05-GLOSSARY.md` |

---

## 1. Purpose

The authoritative catalogue of every data entity and its fields — the field-level source of truth. It reconciles with the conceptual Glossary (`docs/00-Vision/05-GLOSSARY.md`) and the logical model (`docs/04-Architecture/55`), and drives field specs (`72`) and validation (`73`).

## 2. Scope

Entities and their key fields, meaning, ownership, and sensitivity. Detailed types/formats/constraints: `72`. Relationships: `71`.

## 3. Conventions

- **Owner** = the module/service that owns the fact (single source of truth, P5).
- **Sensitivity** = Highly-sensitive (PHI-like) / Sensitive / Reference (`docs/04-Architecture/58` §6).
- **Derived** fields are computed, not stored authoritatively (`55` §6).

## 4. Entities & Fields

### Family
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| family_id | PK | FamilyService | Sensitive |
| owner_user_id | account holder | FamilyService | Sensitive |
| created_at | creation time | FamilyService | Sensitive |

### User
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| user_id | PK | AuthService | Sensitive |
| email_hash | hashed/tokenised email | AuthService | Sensitive |
| credential_hash | salted password hash | AuthService | Highly-sensitive |
| role | account_holder/caregiver/clinician | AuthService | Sensitive |
| status | active/locked/… | AuthService | Sensitive |

### MaternalRecord
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| maternal_id | PK | MaternalService | Highly-sensitive |
| family_id | FK | MaternalService | Sensitive |
| profile | name/DOB/contact | MaternalService | Highly-sensitive |

### PregnancyEpisode
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| episode_id | PK | PregnancyService | Highly-sensitive |
| maternal_id | FK | PregnancyService | Sensitive |
| lmp | last menstrual period | PregnancyService | Highly-sensitive |
| edd | estimated due date | PregnancyService | Highly-sensitive |
| pre_pregnancy_bmi_cat | BMI category (for weight bands) | PregnancyService | Highly-sensitive |
| parity | nulliparous/parous/unknown (NICE scaffold) | PregnancyService | Highly-sensitive |
| status | active/delivered/loss (outcome) | PregnancyService | Highly-sensitive |

### ChildRecord
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| child_id | PK | ChildService | Highly-sensitive |
| family_id | FK | ChildService | Sensitive |
| mother_id | **immutable** link to MaternalRecord | DeliveryService | Highly-sensitive |
| episode_id | link to originating PregnancyEpisode | DeliveryService | Highly-sensitive |
| dob | date of birth | DeliveryService | Highly-sensitive |
| sex | for WHO growth curve | ChildService | Highly-sensitive |
| ga_at_birth | gestational age at birth (preterm/corrected-age) | DeliveryService | Highly-sensitive |

### Event (append-only)
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| event_id | PK | TimelineService | Highly-sensitive |
| family_id | FK | TimelineService | Sensitive |
| subject_id | maternal_id or child_id | TimelineService | Highly-sensitive |
| type | vital/appt/report/milestone/… | TimelineService | Sensitive |
| life_stage | pregnancy/postpartum/newborn/… | TimelineService | Sensitive |
| occurred_at | when it happened | TimelineService | Sensitive |
| payload_ref | link to detail record | TimelineService | Highly-sensitive |
| version | correction version | TimelineService | Sensitive |
| created_by | author user | TimelineService | Sensitive |

### Vital
| Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| vital_id | PK | VitalsService | Highly-sensitive |
| subject_id | subject | VitalsService | Highly-sensitive |
| type | bp/weight/blood_sugar | VitalsService | Highly-sensitive |
| value | measurement (see `72`) | VitalsService | Highly-sensitive |
| unit | canonical unit | VitalsService | Sensitive |
| context | fasting/post-load/systolic-diastolic… | VitalsService | Highly-sensitive |
| measured_at | time | VitalsService | Sensitive |

### GrowthMeasurement / Milestone / Vaccination (child)
| Entity.Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| growth.indicator/value/unit/measured_at | WHO growth data | GrowthService | Highly-sensitive |
| milestone.code/status/observed_at | CDC milestone | MilestonesService | Highly-sensitive |
| vaccination.vaccine_code/dose_no/status/given_at | immunization | VaccinationService | Highly-sensitive |

### Report / JournalEntry
| Entity.Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| report.kind/media_ref/uploaded_at | lab/ultrasound artefact | ReportsService | Highly-sensitive |
| journal.body/media_ref/created_at | notes/media | JournalService | Highly-sensitive |

### CaregiverAccess / AuditRecord / ContentItem / ScheduleEntry
| Entity.Field | Meaning | Owner | Sensitivity |
|---|---|---|---|
| caregiver_access.user_id/scope/granted_by/revoked_at | RBAC grant | FamilyService | Sensitive |
| audit.actor/action/entity/entity_id/at | access log | AuditService | Sensitive (no content) |
| content.content_type/source_ref/path/version | KB reference | ContentService | Reference |
| schedule.jurisdiction/vaccine/dose/age/source_ref | immunization schedule | (reference data) | Reference |

## 5. Derived Fields (computed; not stored authoritatively)
gestational_age, weeks_pregnant, weight_gain_delta, growth_percentile, growth_zscore, trend, prediction, corrected_age. Computed by services (`55` §6).

## 6. Business Rules

- BR-1: Each field has exactly one owner (single source of truth).
- BR-2: Field meaning here reconciles with the Glossary; conflicts are resolved, not left divergent (Glossary BR-2).
- BR-3: Sensitivity drives logging/access/retention (`58`, `63`, `74`).
- BR-4: `child.mother_id` and append-only Event/Audit fields are immutable/append-only.
- BR-5: Derived fields are never stored as competing sources of truth.

## 7. Acceptance Criteria

- [x] All entities and key fields catalogued with owner + sensitivity.
- [x] Derived vs. stored separated.
- [x] Reconciled with Glossary and logical model.

## 8. Future Expansion

Add clinician/device/offline-sync entities; generate a machine-readable dictionary to lint code/content against.

## 9. Dependencies

`71`, `72`, `73`, `74`, `docs/04-Architecture/55`, `docs/00-Vision/05-GLOSSARY.md`.

## 10. Open Questions

- OQ-1: **Resolved** — pregnancy fields (LMP/EDD/BMI/parity/outcome) live on the **PregnancyEpisode** entity, not MaternalRecord (`docs/05-Data/71` §5). Remaining: v1 UI exposure of multiple episodes.
- OQ-2: Whether email is hashed, tokenised, or encrypted-at-rest (see `72`/`121`).

## 11. Risks

- R-1: Field drift vs. glossary/model. Mitigation: BR-2 reconciliation.
- R-2: Mis-classified sensitivity. Mitigation: BR-3 review.
