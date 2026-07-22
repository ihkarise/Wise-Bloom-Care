# 15 — Milestones

| Field | Value |
|---|---|
| Document | Delivery Milestones |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `14-ROADMAP.md`, `16-RELEASE_PLAN.md`, `docs/11-Development/146-DEFINITION_OF_DONE.md` |

---

## 1. Purpose

Defines the concrete, verifiable milestones that mark progress through the roadmap phases. Each milestone has an ID, its deliverable, an exit gate (objective, testable), and its dependencies. Milestones are sequenced but intentionally not date-bound (see Roadmap §9 OQ-1).

## 2. Milestone Ladder

### Phase 0 — Architecture
| ID | Milestone | Exit gate |
|---|---|---|
| MS-0.1 | Vision & product docs complete | `docs/00-Vision`, `docs/01-Product` pass acceptance criteria |
| MS-0.2 | Research grounding complete | `docs/02-Research` citations verified against sources |
| MS-0.3 | Architecture & data model complete | `docs/04`, `docs/05` reviewed; ADRs recorded |
| MS-0.4 | Module specs complete | all `docs/06-Modules/*` pass acceptance criteria |
| MS-0.5 | AI, security, testing, ops docs complete | `docs/07`,`09`,`10`,`12` reviewed |
| MS-0.6 | Documentation acceptance | full set internally consistent; glossary reconciled |

### Phase 1 — Continuous Record (v1)
| ID | Milestone | Exit gate |
|---|---|---|
| MS-1.1 | Auth + family record + timeline foundation | user can register; append-only timeline verified |
| MS-1.2 | Dashboard MVP | at-a-glance status + recent timeline rendered |
| MS-1.3 | Pregnancy vitals + charts | BP/weight/blood-sugar logged with current/previous/trend |
| MS-1.4 | Medicines + appointments + reminders | reminders fire; visit recorded to timeline |
| MS-1.5 | Reports upload/view | lab & ultrasound artefacts stored & viewable |
| MS-1.6 | Week-by-week knowledge | GA-driven content surfaced from knowledge base |
| MS-1.7 | **Delivery transition** | delivery event auto-creates linked baby profile; 0 duplicates; loss path works |
| MS-1.8 | Baby core (growth/milestones/vaccination) | WHO charts render; CDC milestones & vaccine reminders work |
| MS-1.9 | v1 hardening | WCAG 2.2 AA core flows; security baseline; backups verified |

### Phase 2 — Assistance & Insight (v2)
| ID | Milestone | Exit gate |
|---|---|---|
| MS-2.1 | AI guardrail framework | 0 diagnostic/prescriptive outputs in adversarial test set |
| MS-2.2 | AI assistant (explain/summarise) | report explanation + visit summary, educational-typed |
| MS-2.3 | Prediction engine | trends/projections surfaced, framed educationally |
| MS-2.4 | Caregiver/family sharing | explicit, revocable access; audit logged |
| MS-2.5 | Guided nutrition/exercise; richer journal | programmes + media shipped |

### Phase 3 — Ecosystem (v3)
| ID | Milestone | Exit gate |
|---|---|---|
| MS-3.1 | Storage migration validated | backend swap, 0 frontend contract changes |
| MS-3.2 | Offline PWA | offline capture + conflict-safe sync |
| MS-3.3 | Clinician portal | role, RBAC, read + structured contribution |

## 3. Milestone Governance (business rules)

- BR-1: A milestone is "done" only when its exit gate passes objectively (tests/audits), per `docs/11-Development/146-DEFINITION_OF_DONE.md`.
- BR-2: MS-1.7 (delivery transition) is the keystone of v1; v1 cannot ship without it.
- BR-3: MS-2.1 (guardrails) blocks all AI-exposing milestones.
- BR-4: MS-3.1 (migration) blocks ecosystem-scale milestones.

## 4. Acceptance Criteria

- [x] Every roadmap phase decomposed into verifiable milestones.
- [x] Each milestone has an objective exit gate.
- [x] Keystone/blocking dependencies identified.

## 5. Future Expansion

Phase 4 milestones (additional life stages) append as that phase is scoped.

## 6. Dependencies

`14-ROADMAP.md`, `16-RELEASE_PLAN.md`, `docs/10-Testing/*`, `docs/11-Development/146-DEFINITION_OF_DONE.md`.

## 7. Open Questions

- OQ-1: Target dates per milestone (pending capacity).
- OQ-2: Whether MS-2.4 (sharing) is pulled into Phase 1.

## 8. Risks

- R-1: Milestone gates treated as soft. Mitigation: DoD linkage (BR-1).
