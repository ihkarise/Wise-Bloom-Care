# 13 — Module Breakdown

| Field | Value |
|---|---|
| Document | Module Breakdown |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `10-PRD.md`, `12-FEATURE_MATRIX.md`, `docs/06-Modules/*`, `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md` |

---

## 1. Purpose

Enumerates the product's modules, their responsibilities, ownership of data, dependencies, and their document homes. It is the index that binds the PRD's capabilities to the detailed module specifications in `docs/06-Modules/*`.

## 2. Module Taxonomy

Modules are grouped by layer of concern. Each module has: a single responsibility, an owning data domain, explicit dependencies, and one spec document.

### 2.1 Foundation modules
| Module | Responsibility | Owns | Spec |
|---|---|---|---|
| Authentication | Identity, login, session, roles | Users, sessions, roles | `06-Modules/80-AUTH_MODULE.md` |
| Dashboard | At-a-glance status, next actions, recent timeline | (reads all) | `81-DASHBOARD_MODULE.md` |
| Settings | Profile, privacy, notifications prefs, export | User preferences | `97-SETTINGS_MODULE.md` |
| Notifications | Reminders & alerts across modules | Notification queue/log | `95-NOTIFICATION_MODULE.md` |
| Family | Caregiver access to a family record | Access grants | `96-FAMILY_MODULE.md` |

### 2.2 Pregnancy modules
| Module | Responsibility | Owns | Spec |
|---|---|---|---|
| Pregnancy | Pregnancy state, GA/EDD, week context | PregnancyEpisode | `82-PREGNANCY_MODULE.md` |
| Vitals | BP, weight, weight gain, blood sugar + trends | Vital measurements | `83-VITALS_MODULE.md` |
| Nutrition | Nutrition guidance & logging | Nutrition entries | `86-NUTRITION_MODULE.md` |
| Exercise | Exercise guidance & logging | Exercise entries | `87-EXERCISE_MODULE.md` |
| Medicines | Medicine/supplement tracking + reminders | Medicine schedule/log | `85-MEDICINES_MODULE.md` |
| Reports | Lab & ultrasound report upload/view/explain | Report artefacts/metadata | `84-REPORTS_MODULE.md` |

### 2.3 Transition & child modules
| Module | Responsibility | Owns | Spec |
|---|---|---|---|
| Delivery | Delivery event; baby-profile creation; loss handling | Delivery record | `88-DELIVERY_MODULE.md` |
| Baby | Child profile & continuous timeline; feeding/sleep | Child record | `89-BABY_MODULE.md` |
| Growth | WHO growth measurements & charts | Growth measurements | `90-GROWTH_MODULE.md` |
| Milestones | CDC developmental milestones | Milestone records | `91-MILESTONES_MODULE.md` |
| Vaccination | Immunization schedule & tracking | Vaccination records | `92-VACCINATION_MODULE.md` |
| Journal | Notes, photos, moments | Journal entries | `93-JOURNAL_MODULE.md` |

### 2.4 Intelligence module
| Module | Responsibility | Owns | Spec |
|---|---|---|---|
| AI Assistant | Explain, educate, summarise, surface trends/missing data | (reads; owns AI logs) | `94-AI_MODULE.md`, `docs/07-AI/*` |

## 3. Module Design Rules

- **Single responsibility:** each module owns exactly one data domain; cross-module reads go through the API/service layer, never by reaching into another module's storage.
- **No duplicated logic:** shared logic (e.g., timeline append, trend computation, content typing) lives in shared services, not copied per module.
- **Timeline participation:** any module that creates user-visible history emits typed, append-only timeline events via the timeline service.
- **Content typing:** any module surfacing medical content applies the educational/clinical/emergency typing and clinician-review rules.
- **Migratability:** modules depend on the API contract, not the storage adapter.

## 4. Dependency Overview

```
Auth ── (guards) ── all modules
Dashboard ── reads ── Pregnancy, Vitals, Medicines, Reports, Appointments, Baby, Growth, Milestones, Vaccination
Delivery ── creates ── Baby (linked)  [the transition hinge]
Baby ── parents ── Growth, Milestones, Vaccination, Journal (child scope)
Notifications ── triggered by ── Medicines, Appointments, Vaccination, Milestones
AI ── reads ── (module data + knowledge base) ── writes ── AI logs only
Family ── grants access to ── the whole family record (RBAC)
```

## 5. Data Ownership & Single Source of Truth

Each fact has one owning module. Derived values (e.g., gestational age, weight-gain delta, growth percentile) are computed by shared services from owned facts, never stored redundantly in a way that can drift. Authoritative field-level ownership: `docs/05-Data/70-DATA_DICTIONARY.md`.

## 6. Business Rules

- BR-1: A module must not write to another module's owned data directly.
- BR-2: The Delivery module is the only creator of Child records (enforces Vision BR-V2).
- BR-3: Every module surfacing history uses the shared timeline service (enforces append-only).
- BR-4: New modules require an entry here + a spec doc before implementation.

## 7. Acceptance Criteria

- [x] Every module in the master brief is listed with responsibility, owned data, and spec link.
- [x] Dependencies and the delivery-transition hinge are explicit.
- [x] Data-ownership / single-source-of-truth rule stated.

## 8. Future Expansion

Future modules: Prediction/Analytics (elevated), Clinician Portal, Offline Sync, Device Integration. Each will be added with responsibility, owned data, and a spec doc.

## 9. Dependencies

`docs/06-Modules/*`, `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md`, `docs/05-Data/*`.

## 10. Open Questions

- OQ-1: Should Appointments be its own module or remain within Dashboard/Notifications? (Currently distributed; candidate for extraction in v2.)
- OQ-2: Feeding/sleep as sub-features of Baby vs. their own modules.

## 11. Risks

- R-1: Module boundary erosion (cross-writes). Mitigation: BR-1 + architecture conformance review.
