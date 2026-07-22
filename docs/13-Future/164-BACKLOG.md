# 164 — Backlog

| Field | Value |
|---|---|
| Document | Backlog |
| Status | Living document |
| Version | 1.0 |
| Owner | Principal Product Architect / Product |
| Last Updated | 2026-07-22 |
| Related | `163-IDEAS.md`, `docs/01-Product/12-FEATURE_MATRIX.md`, `docs/01-Product/16-RELEASE_PLAN.md` |

---

## 1. Purpose
The prioritised list of work items queued for upcoming releases — the bridge between the feature matrix/roadmap and execution. Unlike `163-IDEAS.md` (uncommitted), backlog items are candidates for scheduling.

## 2. Scope
Queued, prioritised items tied to releases/milestones. Uncommitted ideas: `163`. Traceability grid: `docs/01-Product/12`.

## 3. Backlog Structure
Each item: `id`, title, linked FR/module/doc, tier (v1/v2/v3), priority, status (queued/in-progress/done), acceptance criteria reference.

## 4. Current Backlog (design phase → implementation)

### 4.1 Phase 0 (documentation — current)
| Item | Status |
|---|---|
| Complete architecture doc set (`docs/00`–`13`, ADR) | Done (this repository) |
| Knowledge-base content (pregnancy weeks + category READMEs) | Done (initial) |
| Reconcile glossary/data-dictionary consistency | Ongoing |

### 4.2 Phase 1 (v1 implementation — queued)
| Item | Linked | Tier |
|---|---|---|
| Auth + family record + timeline foundation | FR-1..4, `80` | v1 |
| Dashboard MVP | FR-4, `81` | v1 |
| Vitals + charts | FR-5, `83` | v1 |
| Medicines + appointments + reminders | FR-8/9, `85`/`95` | v1 |
| Reports upload/view | FR-10, `84` | v1 |
| Week knowledge surfacing | FR-11, `82` | v1 |
| **Delivery transition (keystone)** | FR-12/13/14/15, `88` | v1 |
| Baby core (growth/milestones/vaccination) | FR-16..19, `89`–`92` | v1 |
| Journal, feeding/sleep | FR-20/21, `93`/`89` | v1 |
| Settings, notifications, export | FR-23/24/27, `97`/`95`/`76` | v1 |
| v1 hardening (a11y, security, backups) | NFRs | v1 |

### 4.3 Phase 2+ (queued)
| Item | Linked | Tier |
|---|---|---|
| AI assistant (guardrailed) | FR-25, `94`/`07-AI` | v2 |
| Prediction engine | FR-26, `104` | v2 |
| Caregiver sharing (if not v1) | FR-22, `96` | v1/v2 |
| Guided nutrition/exercise; OCR | `86`/`87`/`106` | v2 |
| Clinician portal; offline PWA; migration | `161` | v3 |

## 5. Prioritisation
- Continuity (keystone delivery transition) and V1 "Must" FRs first (`docs/01-Product/16`).
- Safety gates precede AI (guardrails before `94`).
- Migration precedes ecosystem (before `161`).

## 6. Business Rules
- BR-1 Backlog items trace to an FR/module/doc and a tier.
- BR-2 Prioritisation follows the release plan/roadmap sequencing.
- BR-3 Items promoted from `163` only after passing the evaluation gate.
- BR-4 Safety-gated items (AI) queued behind their gates.

## 7. Acceptance Criteria
- [x] Structured, prioritised backlog tied to FRs/modules/tiers.
- [x] Reflects design-phase completion + queued v1 work.

## 8. Dependencies
`163`, `docs/01-Product/12`, `14`, `16`, `docs/06-Modules/*`.

## 9. Open Questions
- OQ-1 Caregiver-sharing tier.
- OQ-2 Execution tooling for backlog (issue tracker).

## 10. Risks
- R-1 Backlog drifting from matrix/roadmap. Mitigation: BR-1/BR-2 traceability + sequencing.
