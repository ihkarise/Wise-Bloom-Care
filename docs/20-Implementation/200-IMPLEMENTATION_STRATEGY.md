# 200 — Implementation Strategy

| Field | Value |
|---|---|
| Document | Implementation Strategy |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Engineer / Technical Program Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `201`–`217`, `docs/01-Product/14-ROADMAP.md`, `docs/01-Product/15-MILESTONES.md`, `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md` |

---

## 1. Purpose

Defines *how* Wise Bloom Care is built, given a complete and frozen architecture. This is the top of the implementation section: it sets the engineering philosophy, the order in which the system is assembled, the strategy for reducing risk, the milestone strategy, and the objective definition of success. All other implementation documents (`201`–`217`) inherit the principles set here.

## 2. Non-Negotiable Framing

- The architecture is **complete and frozen** at `v1.0.0-Architecture`. This document does **not** redesign it, rename entities, change business rules, or introduce features.
- Every sprint answers ten questions (§9); every sprint cites the architecture documents it implements.
- Discovering an architecture defect never authorises editing architecture — it authorises an **ADR proposal** (§11).

## 3. Engineering Philosophy

1. **Continuity is the product.** The one-linked-record thesis and the delivery transition (`docs/08-Timeline/111`, `docs/06-Modules/88`) are the reason this system exists. They are built early enough to de-risk, and are never compromised for velocity.
2. **Boundaries before features.** The two independence boundaries — the **API contract** (`docs/04-Architecture/56`) and the **Storage Adapter** (`docs/04-Architecture/52` §5) — are established in Sprint 00, before any module leans on them. Building modules first and abstracting later is prohibited; it is how boundaries erode (`50` R-1).
3. **Server-authoritative safety.** Business/continuity rules, content typing, and guardrails live server-side in designated services (`52` §6, `140` §6). The client never re-implements them.
4. **Build only what the sprint requires.** No speculative features, no premature optimisation, no dead code, no TODO placeholders, no mock production logic (`140`, `146`).
5. **Every commit is deployable.** Trunk stays releasable (`docs/11-Development/143` BR-1). Incomplete features hide behind flags, not behind a broken build.
6. **Safety gates are hard gates.** Continuity, content typing, privacy, accessibility, and (from v2) AI guardrails block release when they fail (`docs/10-Testing/130` §7, `docs/01-Product/16` §3).

## 4. Implementation Order (summary)

The order mirrors the roadmap's sequencing principle — *prove the record before reasoning over it* (`docs/01-Product/14` §4) — and the milestone ladder (`docs/01-Product/15`).

```
Sprint 00  Foundation: repo, tooling, CI/CD, API-contract + storage-adapter skeleton, logging, env
Sprint 01  Auth + Family + MaternalRecord + PregnancyEpisode + Timeline foundation      (MS-1.1)
Sprint 02  Timeline engine + Dashboard + Vitals + Charts + Reports                       (MS-1.2, MS-1.3, MS-1.5)
Sprint 03  Pregnancy context + Appointments + Medicines + Nutrition + Exercise + Reminders (MS-1.4, MS-1.6)
Sprint 04  Delivery engine → automatic linked baby creation → timeline continuity  ★KEYSTONE (MS-1.7)
Sprint 05  Baby module + Growth (WHO) + Milestones (CDC) + Vaccination                    (MS-1.8)
Sprint 06  Knowledge/AI engine: RAG + prompts + guardrails                                (MS-2.1, MS-2.2)
Sprint 07  Notifications + Analytics + Prediction + Polish                                (MS-2.3, MS-1.4)
Sprint 08  Beta stabilization: performance, bug-fixing, documentation, hardening          (MS-1.9)
```

- Sprints 00–05 + 08 constitute **v1 (MVP)** — the Continuous Record. Sprint 04 is the keystone that v1 cannot ship without (`docs/01-Product/15` BR-2).
- Sprints 06–07 begin **v2 (Assistance & Insight)** capability; they are gated behind AI guardrail conformance (`docs/01-Product/15` BR-3) and do not block v1 shipping.
- Detailed ordering, critical path, and parallel tracks: `202-BUILD_ORDER.md`.

## 5. Risk Reduction Strategy

| Risk (source) | Reduction strategy | Where implemented |
|---|---|---|
| Boundary erosion — client/app bypassing abstractions (`50` R-1) | Contract + adapter shipped first; lint rule that only `adapters/sheets` may touch `SpreadsheetApp`; only `api/` may make network calls; conformance review in every PR | Sprint 00; `214`, `216`, `217` |
| Delivery transition breaks continuity — reset/duplicate/orphan child (`111` R-1) | Delivery built as its own sprint with idempotency + integrity tests + monitoring KPI before any dependent baby module | Sprint 04; `214` §4 |
| Apps Script quota/execution limits (`52` R-2) | Batch reads/writes, caching, thin services; adapter boundary keeps migration a new folder, not a rewrite | Sprint 00 adapter, all backend sprints |
| Non-relational storage integrity gaps (`52` R-1, `71` §7) | Services + adapter enforce FK existence, uniqueness, immutability, append-only; integrity tests | Sprints 01, 04 |
| Ungrounded/diagnostic AI output (`100` R-1) | AI ships only after guardrail framework; RAG-grounded; every output typed + sourced; adversarial test set = 0 violations | Sprint 06; `214` §5 |
| PHI/secret leakage (`140` R-2, `60` BR-3) | No secrets in repo/frontend; Script Properties per env; secret scanning in CI; structured logs strip PHI | Sprint 00; `215` |
| Scope creep / speculative build | Definition of Ready gate + "build only what the sprint requires" | `216`, this doc §3 |

**Risk-first sequencing:** the two highest-severity product risks — boundary erosion and delivery-continuity failure — are addressed structurally (Sprint 00) and functionally (Sprint 04) as early as their dependencies allow, not deferred to hardening.

## 6. Milestone Strategy

- Milestones are the architecture's (`docs/01-Product/15`); this section does not invent new ones. `204-MILESTONE_PLAN.md` maps each architecture milestone (MS-0.x … MS-3.x) to the sprint(s) that satisfy it, plus the shipping tiers **Milestone 0 → v1 Beta → v1 RC → Production**.
- A milestone is "done" only when its **objective exit gate** passes (`docs/01-Product/15` BR-1) — never by assertion.
- The keystone milestone **MS-1.7 (delivery transition)** and the blocking milestone **MS-2.1 (guardrails)** are treated as release-blocking exactly as the architecture mandates.

## 7. Definition of Success

v1 (MVP) is successful when, on real usage:

- **Continuity KPIs:** 0 duplicate/orphan child profiles; 100% timeline continuity across the delivery transition (`docs/04-Architecture/64`, `docs/01-Product/16` §3).
- **Contract stability:** the frontend depends only on the `/v1` API contract; a storage change would require 0 frontend changes (`56` §9, NFR-6) — verified by the adapter boundary and contract tests.
- **Safety:** all medical content is typed + sourced; no untyped medical content reaches the client (`52` BR-5, `51` BR-4).
- **Accessibility:** core flows pass WCAG 2.2 AA (`docs/03-UX/40`).
- **Security baseline:** RBAC enforced, no PHI in logs, audit complete, backups verified (`docs/09-Security/*`, `docs/04-Architecture/62`).
- **Quality:** unit/integration/e2e/regression green; performance budgets met (`docs/10-Testing/130` §7).

v2 capability (Sprints 06–07) is successful when the AI adversarial set yields **0 diagnostic/prescriptive/emergency-decision outputs** (`docs/01-Product/15` MS-2.1) and prediction is framed educationally.

## 8. Architecture Dependencies (what this plan consumes)

This plan is downstream of, and bound by, the following frozen inputs:

- **Product:** `docs/01-Product/10-PRD.md`, `12-FEATURE_MATRIX.md`, `13-MODULE_BREAKDOWN.md`, `14-ROADMAP.md`, `15-MILESTONES.md`, `16-RELEASE_PLAN.md`, `17-NON_GOALS.md`, `18-RISK_REGISTER.md`.
- **Architecture:** `docs/04-Architecture/50`–`64` (system, frontend, backend, GAS, Sheets schema, data model, API spec, auth, security, folder structure, deployment, domains, backup, logging, monitoring).
- **Data:** `docs/05-Data/70`–`77` (dictionary, ER, field specs, validation, retention, audit, import/export, versioning).
- **Modules:** `docs/06-Modules/80`–`97` (per-module specs).
- **AI:** `docs/07-AI/100`–`107`. **Timeline:** `docs/08-Timeline/110`–`115`.
- **Security:** `docs/09-Security/120`–`127`. **Testing:** `docs/10-Testing/130`–`136`. **Dev:** `docs/11-Development/140`–`147`. **Ops:** `docs/12-Operations/150`–`154`.
- **Decisions:** `docs/ADR/ADR-001`…`ADR-006` (Google Sheets, Apps Script, Astro, Authentication, AI Architecture, Domain Strategy).

Each sprint document lists the precise subset it implements.

## 9. The Ten Questions Every Sprint Answers

1. What is being built? 2. Why now? 3. Which architecture docs define it? 4. Which files are created? 5. Which files are modified? 6. Which tests are required? 7. What are the acceptance criteria? 8. What are the risks? 9. How is rollback performed? 10. What is the Definition of Done?

## 10. Working Method

- Documents in this section are execution documents; they are kept in sync with reality. If a sprint's scope changes during execution, its doc is updated (with rationale), not silently diverged from.
- Commit granularity follows conventional commits (`docs/11-Development/144`); every commit leaves the project deployable.
- An internal consistency review runs after each milestone (`204`); inconsistencies are fixed immediately.

## 11. Architecture-Change Protocol (the only escape hatch)

If, during implementation, a genuine architecture defect or contradiction is found:

1. **Do not** modify any `docs/00`–`docs/13` document or existing ADR.
2. Create an **ADR proposal**: `docs/ADR/ADR-00N-<slug>.md` (next free number), status `Proposed`, stating context, the observed defect, options, and recommendation.
3. Continue implementing against the current frozen baseline where possible; block only the directly affected task and record the block in the sprint doc's Risks section.
4. The ADR is reviewed and, if accepted, the architecture is updated under change control and the baseline version is bumped — at which point implementation follows the new baseline. Until then, the frozen baseline governs.

This protocol is the single mechanism by which architecture may change; nothing in `docs/20-Implementation` changes architecture on its own.

## 12. Acceptance Criteria

- [x] Philosophy, implementation order, risk-reduction, milestone strategy, and success definition are stated.
- [x] Architecture dependencies are enumerated and treated as frozen source-of-truth.
- [x] The ten per-sprint questions are fixed.
- [x] An architecture-change protocol (ADR-only) is defined; no architecture edits are proposed here.

## 13. Risks (to the plan itself)

- R-1: Plan treated as a suggestion rather than a gate. Mitigation: Definition of Ready/Done (`216`/`217`) + hard release gates (`docs/01-Product/16`).
- R-2: Silent scope creep inside a sprint. Mitigation: §3.4 + per-sprint scope freeze.
- R-3: Architecture edited under implementation pressure. Mitigation: §11 ADR-only protocol; frozen baseline is authoritative.
