# 55 — Database Model (Storage-Neutral)

| Field | Value |
|---|---|
| Document | Logical Data Model (Storage-Neutral) |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Database Architect |
| Last Updated | 2026-07-22 |
| Related | `54-GOOGLE_SHEETS_SCHEMA.md`, `docs/05-Data/70-DATA_DICTIONARY.md`, `docs/05-Data/71-ENTITY_RELATIONSHIP.md`, `docs/05-Data/77-VERSIONING.md` |

---

## 1. Purpose

Defines the **logical, storage-neutral** data model for Wise Bloom Care — entities, attributes, relationships, and invariants — expressed independently of any storage engine. This is the durable model that survives migration: the Sheets schema (`54`) and any future relational/BaaS schema are concrete realisations of this model.

## 2. Scope

Logical entities/relationships and the continuity invariants. Physical realisation (Sheets): `54`. Field-level detail: `docs/05-Data/70`, `72`. ER diagram: `docs/05-Data/71`.

## 3. Core Entities

| Entity | Description | Key attributes |
|---|---|---|
| **Family** | Root of the family record graph | id, owner, created_at |
| **User** | Auth identity | id, email(hashed), role, status |
| **Session** | Auth session | id, user, issued/expires |
| **MaternalRecord** | Mother/birthing-parent node | id, family, profile |
| **PregnancyEpisode** | One pregnancy of a mother (LMP/EDD, outcome) | id, maternal, LMP, EDD, status/outcome |
| **ChildRecord** | Child node | id, family, **mother (immutable)**, **episode**, DOB, sex, GA-at-birth |
| **Event** | Timeline entry (append-only, versioned) | id, family, subject, type, life_stage, occurred_at, payload, version, author |
| **Vital** | BP/weight/blood sugar measure | id, subject, type, value, unit, context, measured_at |
| **Appointment** | Scheduled visit | id, family, subject, when, status |
| **Medicine** | Medicine/supplement + schedule | id, subject, name, schedule, active |
| **Report** | Lab/ultrasound artefact metadata | id, subject, kind, media_ref, uploaded_at |
| **GrowthMeasurement** | WHO growth data point | id, child, indicator, value, unit, measured_at |
| **Milestone** | CDC developmental milestone | id, child, code, status, observed_at |
| **Vaccination** | Immunization dose | id, child, vaccine, dose_no, status, given_at |
| **JournalEntry** | Note/media | id, subject, body, media_ref, created_at |
| **CaregiverAccess** | RBAC grant | id, family, user, scope, granted_by, revoked_at |
| **AuditRecord** | Access/change log (append-only) | id, actor, action, entity, entity_id, at |
| **ContentItem** | Knowledge/content reference | id, life_stage, topic, content_type, source_ref, path, version |
| **ScheduleEntry** | Immunization schedule datum | id, jurisdiction, version, vaccine, dose_no, age range, source_ref |

## 4. Relationships

```
Family 1───* MaternalRecord (typically 1)
Family 1───* ChildRecord
MaternalRecord 1───* PregnancyEpisode                            [multi-pregnancy]
PregnancyEpisode 0..1───* ChildRecord (episode → resulting child(ren))
MaternalRecord 1───* ChildRecord     (mother link; immutable)   [continuity]
Family 1───* Event                    (subject = maternal or child)
MaternalRecord/ChildRecord 1───* Vital, Appointment, Medicine, Report, JournalEntry
ChildRecord 1───* GrowthMeasurement, Milestone, Vaccination
Family 1───* CaregiverAccess *───1 User
User 1───* Session
(system) 1───* AuditRecord
ContentItem, ScheduleEntry are reference data (not family-scoped)
```

- **Subject polymorphism:** Events/Vitals/etc. reference a *subject* that is either a MaternalRecord or a ChildRecord, unifying the timeline across the journey.

## 5. Continuity Invariants (model-level)

- **INV-1:** Every ChildRecord references exactly one MaternalRecord (`mother`); this reference is **immutable** once set (Vision BR-V1/BR-V2).
- **INV-2:** A ChildRecord is created only via a delivery Event (DeliveryService); no other path creates it.
- **INV-3:** Events and AuditRecords are **append-only**; corrections are new versioned Events (`docs/05-Data/77`).
- **INV-4:** The timeline is one continuous stream per family; the delivery Event links pregnancy and child subjects.
- **INV-5:** No duplicate ChildRecord for the same child; multiple births = multiple distinct children under one delivery Event.

## 6. Derived (computed, not stored redundantly)

- Gestational age / weeks pregnant (from LMP/EDD).
- Weight-gain delta (from weight series + baseline).
- Growth percentile/z-score (from measurement + WHO tables).
- Trends/predictions (from series).
These are computed by services (`52`) to avoid drift (P5); never stored as authoritative duplicates.

## 7. Versioning & Soft-Correction

- Correctable entities carry a `version`; corrections append a new version with author + timestamp; prior versions retained for history/audit (`docs/05-Data/77`).
- "Deletion" is a soft, versioned state change (never destructive) to preserve the append-only journey (Glossary forbidden term "delete an event").

## 8. Business Rules

- BR-1: The logical model is storage-neutral; physical schemas conform to it.
- BR-2: INV-1…INV-5 hold in every realisation and are enforced by services.
- BR-3: Derived values are computed, not stored as competing sources of truth.
- BR-4: Reference data (ContentItem, ScheduleEntry) is versioned independently (`docs/05-Data/77`).

## 9. Edge Cases

- Multiple pregnancies over time: one MaternalRecord with multiple **PregnancyEpisode** rows (LMP/EDD/outcome per episode; see `docs/05-Data/71` §5) — the model never assumes a single pregnancy.
- Loss path: pregnancy episode reaches a terminal state without a ChildRecord.
- Multiple caregivers: many CaregiverAccess grants per family.
- Preterm: GA-at-birth stored to support corrected-age computations.

## 10. Acceptance Criteria

- [x] All core entities, relationships, and continuity invariants defined storage-neutrally.
- [x] Subject polymorphism unifies the timeline.
- [x] Derived values separated from stored facts.
- [x] Versioning/soft-correction model stated.

## 11. Future Expansion

Add entities for clinician users/portal, device readings, offline-sync metadata, and additional life stages. (The PregnancyEpisode entity is already formalised — see §3, `docs/05-Data/71` §5.)

## 12. Dependencies

`54`, `docs/05-Data/70`, `71`, `72`, `77`, `docs/08-Timeline/*`.

## 13. Open Questions

- OQ-1: **Resolved** — multiple pregnancies are modelled with a **PregnancyEpisode** entity under MaternalRecord (LMP/EDD/outcome live on the episode); see `docs/05-Data/71-ENTITY_RELATIONSHIP.md` §5. Remaining sub-question: v1 UI exposure of multiple episodes (model is ready).
- OQ-2: Whether "subject" is a formal supertype entity or a typed reference.

## 14. Risks

- R-1: Duplicated/derived data drifting. Mitigation: BR-3 compute-don't-store.
- R-2: Model assuming single child/pregnancy. Mitigation: §9 edge cases + INV-5.
