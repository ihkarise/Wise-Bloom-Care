# 202 — Build Order

| Field | Value |
|---|---|
| Document | Build Order & Critical Path |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Technical Program Manager / Staff Engineer |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `200-IMPLEMENTATION_STRATEGY.md`, `203-MODULE_DEPENDENCIES.md`, `204-MILESTONE_PLAN.md`, `docs/01-Product/15-MILESTONES.md`, `docs/06-Modules/*` |

---

## 1. Purpose

Defines the **exact** order in which Wise Bloom Care is built — nothing skipped — with the hard dependencies, the critical path, and where parallel work is safe. It is the sequencing spine that the sprint documents (`205`–`213`) execute against. Order derives from the architecture's own sequencing principle (`docs/01-Product/14` §4) and milestone ladder (`docs/01-Product/15`).

## 2. Ordering Principles (inherited)

1. Boundaries before features — contract + adapter first (`200` §3.2).
2. Prove the record before reasoning over it — continuity before intelligence (`14` §4).
3. The delivery transition is de-risked as its own step before the modules that depend on a child existing (`111`, `15` BR-2).
4. Safety gates precede AI exposure — guardrails before any AI output (`15` BR-3).

## 3. Layered Build Order (nothing skipped)

```
L0  Repository & environment foundation
      pnpm workspaces • tsconfig base • lint/format • .nvmrc • .gitignore
      CI pipeline (lint→type→test→build) • env/secrets scaffolding (Script Properties, build env)
      Logging + audit scaffolding (63, 75) • synthetic-data seeding scripts
        │  (blocks everything)
        ▼
L1  Independence boundaries
      packages/domain-types  (mirror 70,72)
      packages/api-contract   (mirror 56 resources/endpoints)
      StorageAdapter interface (52 §5) + SheetsStorageAdapter skeleton (53,54)
      apps/web api/ typed client skeleton (51 §5)
        │  (blocks all domain services & features)
        ▼
L2  Cross-cutting services (shared, used by every module)
      AuthService + SessionService (57, 122)   ── guards all endpoints
      AuditService (75)                          ── every health-data access
      TimelineService (append-only/versioned; 77, 110) ── every history-producing module
      ContentService (typing + source_ref; 28)   ── every module surfacing medical content
      Controllers: auth guard, validation (73), rate limiting (120)
        │
        ▼
L3  Family graph & pregnancy core
      FamilyService • MaternalService • PregnancyService (PregnancyEpisode; 71 §5, 82)
      Dashboard read model (81) • VitalsService + charts (83) • ReportsService (84)
        │
        ▼
L4  Pregnancy management
      AppointmentsService • MedicinesService (+reminders) (85) • NutritionService (86) • ExerciseService (87)
      Week-by-week knowledge surfacing from knowledge-base (101, GA-driven)
        │
        ▼
L5  ★ Delivery transition (KEYSTONE — its own step)
      DeliveryService: sole creator of ChildRecord(s), immutable mother link, idempotent,
      loss path; bridges episode↔child on one timeline (88, 111, 56 §6)
        │  (blocks everything child-scoped)
        ▼
L6  Baby core
      ChildService (89) • GrowthService + WHO charts (90, 25) • MilestonesService (CDC; 91, 26)
      VaccinationService (92, 24) • JournalService (93)
        │
        ▼
L7  Intelligence (v2 capability; gated on guardrails)
      Guardrail layer (105) FIRST → RAG retriever + KB index (101,103) → AIService (94,100)
      → ContentService typing on AI output → PredictionEngine (104, surfacing only)
        │
        ▼
L8  Platform completeness & hardening
      NotificationService full coverage (95) • Analytics/monitoring (64) • Family sharing/RBAC (96,123)
      Settings (97) • performance budgets (134) • a11y AA sweep (40) • security baseline • backups (62)
```

## 4. Sprint ↔ Layer Mapping

| Sprint | Layers built | Milestone(s) | Ships toward |
|---|---|---|---|
| 00 | L0, L1 | MS-0.6 → build baseline | Milestone 0 |
| 01 | L2, L3 (family + pregnancy core + timeline) | MS-1.1 | v1 |
| 02 | L3 (dashboard, vitals, reports) | MS-1.2, MS-1.3, MS-1.5 | v1 |
| 03 | L4 | MS-1.4, MS-1.6 | v1 |
| 04 | L5 ★ | MS-1.7 (keystone) | v1 |
| 05 | L6 | MS-1.8 | v1 |
| 06 | L7 (guardrails → RAG → AI) | MS-2.1, MS-2.2 | v2 |
| 07 | L7 (prediction) + L8 (notifications, analytics) | MS-2.3 | v1.x/v2 |
| 08 | L8 (hardening) | MS-1.9 | v1 RC → Production |

## 5. Critical Path

The longest chain of hard dependencies — the sequence that determines minimum schedule:

```
L0 foundation → L1 boundaries → L2 Auth+Timeline+Audit → L3 Family+Pregnancy+Vitals
   → L4 Medicines/Appointments → L5 ★DeliveryService → L6 ChildService+Growth/Milestones/Vaccination
   → L8 hardening (continuity KPIs, a11y AA, security baseline, backups) → v1 RC → Production
```

- **The keystone on the critical path is L5 (DeliveryService).** It cannot start until L4's PregnancyEpisode and TimelineService exist, and it blocks all of L6. Everything child-scoped waits on it. This is why it is isolated as Sprint 04 with dedicated integrity tests (`214` §4).
- L7 (AI) is **not** on the v1 critical path — it targets v2 and is gated on guardrails; it can slip without blocking v1 shipping (`200` §4).

## 6. Parallelisable Work (safe concurrency)

Once a layer's blocking interfaces exist, these tracks run in parallel without contending for the same files/boundaries:

| Once available | Parallel track A | Parallel track B | Parallel track C |
|---|---|---|---|
| After L1 (contract + types) | Backend: L2 services | Frontend: design-system components (`36`) + `api/` client skins | KB authoring: week-by-week content (`101`) |
| After L2 (Timeline+Content) | VitalsService + charts (`83`) | ReportsService (`84`) | Dashboard read model (`81`) |
| After L3 | Appointments (`85` adj.) | Medicines + reminders (`85`) | Nutrition/Exercise (`86`,`87`) |
| After L5 (Delivery) | Growth + WHO charts (`90`) | Milestones (`91`) | Vaccination (`92`) |
| After L7 guardrails | RAG retriever/index (`103`) | Prompt library (`102`) | Prediction engine (`104`) |

**Concurrency rule:** parallel tracks may proceed only behind a stable interface (the contract, the adapter interface, a service's public signature). No track edits another track's owned files (`13` BR-1). Frontend features are always safe to build against the **contract** ahead of the backend implementation, then wired to the real endpoints.

## 7. Hard "Do-Not-Skip" Gates

| Gate | Rule | Source |
|---|---|---|
| G-0 | No feature work until L0 CI is green and L1 boundaries compile | `200` §3.2 |
| G-1 | No domain service before the StorageAdapter interface exists (services depend on interface, never Sheets) | `52` BR-1 |
| G-2 | No history-producing module before TimelineService (append-only) | `13` BR-3 |
| G-3 | No medical content surfaced before ContentService (typed+sourced) | `52` BR-5 |
| G-4 | No child-scoped module (growth/milestones/vaccination) before DeliveryService creates children | `13` BR-2, `56` BR-2 |
| G-5 | No AI output before the guardrail layer passes the adversarial set | `15` BR-3, `100` BR-1 |
| G-6 | No production release before MS-1.7 continuity + MS-1.9 hardening gates pass | `16` §3 |

## 8. Business Rules

- BR-1: Build order follows the layered sequence L0→L8; a layer's blocking outputs must exist before dependents start (do-not-skip gates §7).
- BR-2: The delivery transition (L5) is built and integrity-verified before any child-scoped module (L6).
- BR-3: Guardrails (L7 first step) precede any AI-exposing work.
- BR-4: Parallel tracks proceed only behind stable interfaces and never cross ownership boundaries.

## 9. Acceptance Criteria

- [x] Exact, gap-free build order defined (L0–L8), mapped to sprints and milestones.
- [x] Critical path identified, with the delivery keystone called out.
- [x] Parallelisable tracks and the concurrency rule specified.
- [x] Do-not-skip gates enumerated with architecture sources.

## 10. Dependencies

`200`, `203`, `204`, `docs/01-Product/14`, `15`, `docs/06-Modules/*`, `docs/08-Timeline/111`.

## 11. Risks

- R-1: A dependent layer started before its blocker is stable → boundary erosion/rework. Mitigation: §7 gates enforced in review/CI.
- R-2: Delivery keystone pulled forward without its L4 prerequisites. Mitigation: BR-2 + Sprint 04 entry criteria (`209`).
