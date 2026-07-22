# 216 — Definition of Ready

| Field | Value |
|---|---|
| Document | Definition of Ready |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Technical Program Manager / Engineering Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `217-DEFINITION_OF_DONE.md`, `docs/11-Development/146-DEFINITION_OF_DONE.md`, `200`–`204` |

---

## 1. Purpose

Defines the objective bar a task must clear **before** it may enter a sprint and be worked on. Where the Definition of Done (`217`) governs exit, this governs entry. Its purpose is to prevent starting work that is ambiguous, unblocked-in-name-only, or untraceable to the frozen architecture.

## 2. A Task Is Ready Only If…

- [ ] **Requirements exist.** The task has a clear statement of what is being built and why now, traceable to a PRD requirement / module capability (`docs/01-Product/10`, `docs/06-Modules/*`).
- [ ] **Architecture reference exists.** The task cites the specific frozen architecture doc(s) that define it (system/data/module/security/testing). No task proceeds against undocumented behaviour; if the architecture is silent or contradictory, an ADR proposal is filed first (`200` §11).
- [ ] **Acceptance criteria exist.** Objective, testable pass/fail conditions are written down (mirroring the sprint doc's Acceptance Criteria).
- [ ] **Dependencies resolved.** All blocking layers/modules/services (`202`,`203`) are built and stable, or the task is explicitly scoped to build against a stable interface (contract/adapter/service signature) ahead of its implementation.
- [ ] **Risks documented.** Known risks and their mitigations are recorded (including safety-critical concerns: continuity, content typing, privacy, AI safety).
- [ ] **Boundaries respected in the plan.** The task's design keeps Sheets access in the adapter, network calls in `api/`, business rules server-side, and medical content typed+sourced (`140`, `201` §6).
- [ ] **Test plan identified.** The required test levels (`214`) are known and feasible with **synthetic data only** (`130` BR-2).
- [ ] **No speculative scope.** The task builds only what its sprint requires — no speculative features, no premature optimisation (`200` §3.4).

## 3. Additional Readiness for Safety-Critical Tasks

A task touching continuity (delivery/timeline), content typing, privacy/RBAC, or AI is Ready only if it **also**:

- [ ] Names the invariant it must preserve (e.g., sole-creator, immutable mother link, append-only, typed+sourced, guardrailed) (`52` §6, `71` §6, `105`).
- [ ] Has a release-blocking test identified in `214` §4.
- [ ] For AI tasks: is gated behind MS-2.1 guardrail conformance and defaults to flag-off until it passes (`15` BR-3).
- [ ] For delivery tasks: references the rollback runbook (`150`).

## 4. Ready Gate at Sprint Entry

Before a sprint starts (per `204` entry criteria), every task in it must pass §2 (and §3 where applicable). A sprint does not start with un-Ready tasks; un-Ready items are refined or deferred, not begun.

## 5. Business Rules

- BR-1: A task may not enter a sprint until it meets the full Definition of Ready.
- BR-2: A task with no architecture reference is not Ready — the frozen architecture is the source of truth (`200` §2).
- BR-3: Safety-critical tasks meet the additional readiness bar (§3) before starting.
- BR-4: Discovering an architecture gap during refinement triggers an ADR proposal, not an architecture edit (`200` §11).

## 6. Acceptance Criteria

- [x] Objective entry checklist (requirements, architecture ref, acceptance criteria, dependencies, risks) defined.
- [x] Safety-critical additional readiness bar defined.
- [x] Sprint-entry ready gate stated; no-architecture-edit rule restated.

## 7. Dependencies

`217`, `docs/11-Development/146`, `docs/01-Product/10`,`15`, `docs/06-Modules/*`, `200`–`204`, `214`.

## 8. Risks

- R-1: Work started on ambiguous/unblocked tasks → rework. Mitigation: BR-1 entry gate.
- R-2: Task with no architecture grounding drifts from the frozen design. Mitigation: BR-2/BR-4.
