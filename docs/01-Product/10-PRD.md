# 10 — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Document | Product Requirements Document |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/00-Vision/*`, `11-PRODUCT_SCOPE.md`, `12-FEATURE_MATRIX.md`, `13-MODULE_BREAKDOWN.md`, `docs/06-Modules/*` |

---

## 1. Purpose

The PRD is the authoritative statement of **what Wise Bloom Care must do** for its first shippable generations (v1 → v2). It translates the Vision and Mission into concrete, testable functional and non-functional requirements, personas, flows, KPIs, and acceptance criteria. Module documents (`docs/06-Modules/*`) elaborate each capability; this document is the contract they must satisfy.

## 2. Goals

- Define the product's users, jobs-to-be-done, and success metrics.
- Enumerate functional requirements at capability level, each traceable to a module.
- Set non-functional requirements (performance, security, privacy, accessibility, reliability, migratability).
- Establish acceptance criteria and release gating aligned with `16-RELEASE_PLAN.md`.

## 3. Scope

In scope: the continuous maternal→child record and the modules in `13-MODULE_BREAKDOWN.md`. Out of scope: everything in `17-NON_GOALS.md` and anything marked Future in `docs/13-Future`. Detailed scope boundaries: `11-PRODUCT_SCOPE.md`.

## 4. Users & Personas (summary)

Full personas: `docs/03-UX/30-USER_PERSONAS.md`.

| Persona | Role | Primary need |
|---|---|---|
| **Aisha — Expecting mother** (primary) | Account holder | Track pregnancy calmly; one place for everything; understand her reports. |
| **Ravi — Partner/caregiver** (secondary) | Caregiver (family dashboard) | Stay informed; help manage appointments and reminders. |
| **New mother (postpartum)** | Account holder | Manage recovery + newborn care in parallel without a reset. |
| **Clinician** (future) | Doctor portal | Review a family's continuous record (out of v1). |

### 4.1 Jobs to be done
- "Keep my whole pregnancy in one calm place and tell me what's normal."
- "When my baby is born, don't make me start over."
- "Help me understand my lab/ultrasound report without scaring me."
- "Remind me about appointments, medicines, and vaccinations."
- "Show me trends — is my weight gain / BP / my baby's growth on track?"

## 5. Functional Requirements

Each requirement (FR) has an ID, a priority (MoSCoW: Must/Should/Could), and the module that owns it. "Must" = v1 gating.

### 5.1 Foundational
| ID | Requirement | Priority | Module |
|---|---|---|---|
| FR-1 | User can register, authenticate, and manage a session securely. | Must | `80-AUTH_MODULE` |
| FR-2 | System maintains one linked family record (maternal + child nodes). | Must | Data model / `82`, `89` |
| FR-3 | Timeline is append-only; corrections are versioned events. | Must | `docs/05-Data/77-VERSIONING`, timeline |
| FR-4 | Dashboard shows current status, next actions, and recent timeline at a glance. | Must | `81-DASHBOARD_MODULE` |

### 5.2 Pregnancy
| ID | Requirement | Priority | Module |
|---|---|---|---|
| FR-5 | Record & chart vitals: blood pressure, weight, weight gain, blood sugar (current / previous / trend / prediction). | Must | `83-VITALS_MODULE` |
| FR-6 | Track nutrition guidance and logging. | Should | `86-NUTRITION_MODULE` |
| FR-7 | Track exercise guidance and logging. | Should | `87-EXERCISE_MODULE` |
| FR-8 | Medicine/supplement tracker with reminders. | Must | `85-MEDICINES_MODULE` |
| FR-9 | Appointments: schedule, reminders, visit summaries. | Must | `81`/`95` + reports |
| FR-10 | Reports: upload & view lab reports and ultrasound reports; AI explanation (educational). | Must | `84-REPORTS_MODULE`, `94-AI_MODULE` |
| FR-11 | Week-by-week pregnancy knowledge surfaced by gestational age. | Must | Knowledge base + `82` |

### 5.3 Delivery & transition
| ID | Requirement | Priority | Module |
|---|---|---|---|
| FR-12 | Record delivery event (mode, GA at birth, birth metrics, Apgar). | Must | `88-DELIVERY_MODULE` |
| FR-13 | On delivery, automatically create the baby profile, permanently linked to the mother; no duplication. | Must | `88`, `89` |
| FR-14 | Compassionately handle pregnancy loss without forcing a baby profile. | Must | `88` |
| FR-15 | Support multiple births (one delivery → multiple linked child nodes). | Should | `88`, `89` |

### 5.4 Baby & child
| ID | Requirement | Priority | Module |
|---|---|---|---|
| FR-16 | Baby profile with continuous timeline linked to mother. | Must | `89-BABY_MODULE` |
| FR-17 | Growth tracking on WHO Child Growth Standards (percentiles/z-scores; charts). | Must | `90-GROWTH_MODULE` |
| FR-18 | Developmental milestones (CDC) tracking and gentle prompts. | Must | `91-MILESTONES_MODULE` |
| FR-19 | Vaccination schedule tracking with reminders. | Must | `92-VACCINATION_MODULE` |
| FR-20 | Feeding and sleep logging. | Should | `89`/journal |
| FR-21 | Journal for notes, photos, and moments. | Should | `93-JOURNAL_MODULE` |

### 5.5 Cross-cutting
| ID | Requirement | Priority | Module |
|---|---|---|---|
| FR-22 | Family dashboard for caregivers with explicit, revocable access. | Should | `96-FAMILY_MODULE` |
| FR-23 | Notifications/reminders across appointments, medicines, vaccinations, milestones. | Must | `95-NOTIFICATION_MODULE` |
| FR-24 | Settings: profile, privacy, notifications, data export. | Must | `97-SETTINGS_MODULE` |
| FR-25 | Educational AI assistant: explain, educate, summarise, surface trends & missing data, generate reminders/summaries — never diagnose or prescribe. | Should | `94-AI_MODULE`, `docs/07-AI/*` |
| FR-26 | Analytics & prediction engine for trend surfacing. | Could (v2) | `docs/07-AI/104-PREDICTION_ENGINE` |
| FR-27 | Data export/import for the family record. | Should | `docs/05-Data/76-IMPORT_EXPORT` |

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | Dashboard interactive in < 2.5s on a mid-range phone on 3G-class network (initial), < 1s on repeat (see `docs/10-Testing/134-PERFORMANCE_TESTS.md`). |
| NFR-2 | Security | Role-based access, encrypted secrets, session management, input validation, rate limiting (`docs/09-Security/*`). |
| NFR-3 | Privacy | Private data store; GDPR/HIPAA-friendly design; explicit, revocable sharing; audit logging of health-data access. |
| NFR-4 | Accessibility | WCAG 2.2 AA across all core flows (`docs/03-UX/40-ACCESSIBILITY.md`). |
| NFR-5 | Reliability | Data durability via backups; no data loss on the delivery transition; append-only integrity. |
| NFR-6 | Migratability | Frontend depends only on the API contract; backend swap requires zero component-contract changes. |
| NFR-7 | Mobile-first | Fully usable on small screens; offline-capable target for future PWA. |
| NFR-8 | Maintainability | Every module specified before build; single source of truth for logic and data. |
| NFR-9 | Observability | Structured logging and monitoring (`docs/04-Architecture/63-LOGGING.md`, `64-MONITORING.md`). |
| NFR-10 | Safety | AI guardrails enforced; content typed educational/clinical/emergency; clinician-review recommendations where medical judgement applies. |

## 7. Key User Flows (summary; details in `docs/03-UX/31-USER_JOURNEYS.md`)

1. **Onboard & start pregnancy:** register → set LMP/EDD (or "unknown") → dashboard seeded with gestational context.
2. **Daily/weekly tracking:** log a vital → see current/previous/trend → optional AI explanation.
3. **Appointment & report:** add appointment → get reminder → upload report → AI educational explanation → visit summary added to timeline.
4. **Delivery transition:** record delivery event → baby profile auto-created & linked → timeline continues; postpartum + newborn views appear in parallel.
5. **Child care:** log growth → WHO percentile chart → milestone prompts → vaccination reminders.

## 8. Data Model (summary)

Authoritative model: `docs/04-Architecture/55-DATABASE_MODEL.md` and `docs/05-Data/*`. Core entities: Family, Maternal record, Child record, Event (timeline), Vital, Appointment, Report, Medicine, Milestone, Vaccination, GrowthMeasurement, JournalEntry, Caregiver access, Audit log, Knowledge item. Invariants: one child ↔ one originating mother (immutable); events append-only/versioned.

## 9. Business Rules

- BR-1 … BR-5: inherit Vision invariants BR-V1…BR-V5 (`docs/00-Vision/00-VISION.md §11`).
- BR-6: A child profile is created **only** by a delivery event.
- BR-7: Pregnancy loss must not force baby-profile creation; a compassionate terminal state is required.
- BR-8: Any AI output touching medical judgement includes a clinician-review recommendation and never prescribes/diagnoses.
- BR-9: Every "Must" FR has at least one acceptance test in `docs/10-Testing/131-TEST_CASES.md`.

## 10. Edge Cases

- Retrospective onboarding (joining at 30 weeks, or post-birth): must reconstruct timeline from provided data without blocking.
- Unknown or revised due date: gestational context recalculated; history preserved (versioned).
- Multiple births; multiple pregnancies over time; multiple caregivers.
- Report upload of poor quality / unsupported format (see `84`, `docs/07-AI/106-OCR_PIPELINE.md`).
- Pregnancy loss, complications, NICU stays.
- Conflicting edits from two caregivers (last-write with versioning + audit).

## 11. KPIs & Success Metrics (authoritative)

| KPI | Target (v1) | Verification |
|---|---|---|
| Duplicate/orphaned child profiles | 0 | data-integrity tests |
| Timeline continuity across delivery | 100% | integration tests, UAT |
| Medical statements with citation | 100% | content audit |
| Content mis-typing (educational/clinical/emergency) | 0 | content audit + review gate |
| Core-flow accessibility (WCAG 2.2 AA) | Pass | `docs/10-Testing/135` + audits |
| Unauthorised health-data access events | 0 | security tests, audit log review |
| Backend-swap component-contract changes | 0 | architecture conformance review |

## 12. Acceptance Criteria (PRD-level)

- [x] All "Must" FRs mapped to an owning module and at least one acceptance test.
- [x] NFRs are measurable and mapped to test/architecture docs.
- [x] KPIs consistent with Mission (`docs/00-Vision/02-MISSION.md`).
- [x] Edge cases enumerated and routed to owning modules.
- [x] Scope boundaries consistent with `11-PRODUCT_SCOPE.md` and `17-NON_GOALS.md`.

## 13. Future Expansion

v2+: prediction engine (FR-26), richer AI (voice, OCR breadth), family/caregiver graph, then clinician portal and offline PWA (`docs/13-Future`).

## 14. Dependencies

Vision set (`docs/00-Vision/*`), module specs (`docs/06-Modules/*`), data & architecture (`docs/04`, `docs/05`), research (`docs/02-Research/*`), testing (`docs/10-Testing/*`).

## 15. Open Questions

- OQ-1: v1 family unit = single child or multi-child from start? (See Vision OQ-1.)
- OQ-2: Is caregiver sharing in v1 or v2? (Affects FR-22 priority.)
- OQ-3: First-launch jurisdiction (immunization defaults, privacy regime).
- OQ-4: AI assistant in v1 (Should) vs. v2 — depends on guardrail readiness.

## 16. Risks

Full register: `18-RISK_REGISTER.md`. Top: medical liability (content typing), scope gravity (phased release), storage lock-in (API boundary), emotional-harm flows (compassionate design gate).
