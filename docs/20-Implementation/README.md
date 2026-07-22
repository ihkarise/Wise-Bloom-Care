# 20 — Implementation Planning

| Field | Value |
|---|---|
| Section | Implementation Planning |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Engineer / Technical Program Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |

---

## 1. Purpose

This section converts the **frozen** Wise Bloom Care architecture (`docs/00`–`docs/13`, `docs/ADR/*`) into an executable engineering roadmap. It does **not** redesign, rename, or extend the architecture. Every document here **references** architecture as the source of truth; it never duplicates or supersedes it.

> If implementation discovers an architecture problem, we do **not** edit architecture. We raise an **ADR proposal** (see `200-IMPLEMENTATION_STRATEGY.md` §11) and keep building around the frozen baseline until the ADR is accepted.

## 2. Document Index

| # | Document | Purpose |
|---|---|---|
| 200 | `200-IMPLEMENTATION_STRATEGY.md` | Philosophy, implementation order, risk reduction, success definition |
| 201 | `201-MONOREPO_STRUCTURE.md` | Complete repository layout, every folder explained |
| 202 | `202-BUILD_ORDER.md` | Exact build order, critical path, parallelisable work |
| 203 | `203-MODULE_DEPENDENCIES.md` | Dependency graph, blocking vs. independent modules |
| 204 | `204-MILESTONE_PLAN.md` | Milestone 0 → Beta → RC → Production, entry/exit criteria |
| 205 | `205-SPRINT_00.md` | Repository foundation, CI/CD, tooling, adapter skeleton |
| 206 | `206-SPRINT_01.md` | Auth, family, PregnancyEpisode, timeline foundation |
| 207 | `207-SPRINT_02.md` | Timeline engine, dashboard, vitals, charts, reports |
| 208 | `208-SPRINT_03.md` | Pregnancy module, appointments, medicines, nutrition, exercise |
| 209 | `209-SPRINT_04.md` | Delivery engine, automatic baby creation, timeline continuity |
| 210 | `210-SPRINT_05.md` | Baby module, growth, WHO charts, milestones, vaccination |
| 211 | `211-SPRINT_06.md` | Knowledge engine, AI, RAG, prompt system, guardrails |
| 212 | `212-SPRINT_07.md` | Notifications, analytics, prediction, polish |
| 213 | `213-SPRINT_08.md` | Beta stabilization, performance, bug-fixing, documentation |
| 214 | `214-TESTING_CHECKLIST.md` | Unit → integration → e2e → security → a11y → performance |
| 215 | `215-DEPLOYMENT_CHECKLIST.md` | Dev → staging → production, rollback, monitoring, secrets |
| 216 | `216-DEFINITION_OF_READY.md` | When a task may enter a sprint |
| 217 | `217-DEFINITION_OF_DONE.md` | When a task/sprint may exit (references `docs/11-Development/146`) |
| — | `IMPLEMENTATION_READINESS_REPORT.md` | Go/No-Go, engineering grade, timeline, team structure |

## 3. Documented Assumption — Numbering

The master brief sketched sprint docs as `205`–`208` and checklists as `209`–`212`. That sketch implicitly assumed four sprints, but the same brief mandates **Sprints 00–08 (nine sprints)**. Nine sprint documents occupy `205`–`213`, so the four checklist/process documents continue at **`214`–`217`** to avoid a numbering collision. This is the only deviation from the brief's literal numbers and it is intentional. No content was dropped.

## 4. Reading Order

Read `200` → `201` → `202` → `203` → `204` first (the plan), then the sprint documents in order (`205`…`213`), with `214`–`217` as the always-on quality gates applied to every sprint. `IMPLEMENTATION_READINESS_REPORT.md` is the executive summary.

## 5. Governing Rules (apply to every document in this section)

- Architecture is FROZEN at `v1.0.0-Architecture`; reference it, never rewrite it.
- Build only what the sprint requires — no speculative features, no dead code, no TODO placeholders, no mock production logic.
- Every commit leaves the project deployable.
- A change is "done" only per `docs/11-Development/146-DEFINITION_OF_DONE.md` and `217`.
- Any architecturally significant change requires an ADR (`docs/ADR/*`), not an edit to a frozen doc.
