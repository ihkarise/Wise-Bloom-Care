# 217 — Definition of Done (Implementation)

| Field | Value |
|---|---|
| Document | Definition of Done (Implementation view) |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Lead / Engineering Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `docs/11-Development/146-DEFINITION_OF_DONE.md` (authoritative), `216-DEFINITION_OF_READY.md`, `214-TESTING_CHECKLIST.md` |

---

## 1. Purpose

Defines "done" for an implementation change or a whole sprint. This document **does not replace** the architecture's Definition of Done (`docs/11-Development/146`, which is authoritative); it operationalises it for the implementation sprints and adds the sprint-level exit bar. Where this and `146` overlap, `146` governs.

## 2. A Change Is Done When… (implements `146` §3)

- [ ] **Spec:** satisfies its requirement/acceptance criteria (sprint doc + `docs/01-Product` + module doc).
- [ ] **Principles:** passes the "test of a feature" — Continuity, Calm, Safety, Privacy, Truth (`docs/00-Vision/01` §6, `03`). A principle violation = not done (`146` BR-2).
- [ ] **Standards:** meets coding standards (`140`); lint + type-check pass; boundary lint rules pass (no `SpreadsheetApp` outside adapter; no network outside `api/`).
- [ ] **Tests:** unit/integration/e2e added/updated and green; safety-critical cases where relevant (`214` §4); regression core green (`136`).
- [ ] **Safety:** medical content typed + sourced; AI via guardrails; continuity invariants intact; RBAC/audit respected (`28`,`105`,`88`,`123`).
- [ ] **Accessibility:** WCAG 2.2 AA considered/verified for UI (`40`).
- [ ] **Privacy:** no secrets/PHI added; synthetic data only.
- [ ] **Docs:** relevant docs updated/in sync; sprint doc reflects shipped reality; ADR proposal filed if a defect implies an architecture change (`200` §11) — never an architecture edit.
- [ ] **Review:** PR approved with the template checklist verified (`145`).
- [ ] **CI:** all gates pass.
- [ ] **Deployable:** the change leaves the project deployable (`200` §3.5); incomplete features are flag-gated, not broken.

## 3. Content DoD (medical) — from `146` §4

- [ ] Typed (educational/clinical/emergency), sourced (`source_ref`), facts vs. design separated, reviewed; no invented facts (`27`,`28`,`101`).

## 4. Sprint-Level Done (exit bar)

A sprint is done when, in addition to every change meeting §2/§3:

- [ ] The sprint's stated milestone exit gate(s) pass objectively (`204`, `docs/01-Product/15`).
- [ ] The sprint's Acceptance Criteria (in its `205`–`213` doc) are all checked with evidence.
- [ ] The per-release safety-critical suites relevant to the sprint pass (`214` §4/§5).
- [ ] No Non-Goal violation introduced (`17`).
- [ ] The internal consistency review for the stage passed (`200` §10, `204` §10).

## 5. Keystone & AI Additional Bars

- [ ] **Delivery (Sprint 04):** MS-1.7 met — auto-create linked baby, 0 duplicates/orphans, immutable mother link, loss path works; integrity suite green; rollback runbook drilled (`209`, `150`).
- [ ] **AI (Sprint 06+):** MS-2.1 met — adversarial set 0 violations **before** any exposure; output typed+sourced+grounded; read-only (`211`, `15` BR-3).
- [ ] **Release (Sprint 08):** the v1.0 ship gate passes (`16` §3, `213` §7).

## 6. Business Rules (from `146` §5)

- BR-1: A change is "done" only when it passes the full DoD, objectively.
- BR-2: A Product-Principle violation blocks done regardless of polish.
- BR-3: Safety-critical items (continuity, typing, guardrails, RBAC) are mandatory where applicable.
- BR-4: Docs-in-sync + tests green are required.
- BR-5: Medical content meets the Content DoD.
- BR-6 (implementation): A sprint is done only when its milestone exit gate passes and every commit left the project deployable.

## 7. Edge Cases (from `146` §6)

Docs-only change (subset applies); spike/prototype (marked not-done/experimental); hotfix (DoD applies, expedited); partial feature behind a flag (DoD applies to what's shipped).

## 8. Acceptance Criteria

- [x] Objective per-change DoD covering spec, principles, standards, tests, safety, a11y, privacy, docs, review, CI, deployability.
- [x] Content DoD referenced; principle-violation-blocks-done restated.
- [x] Sprint-level exit bar + keystone/AI/release additional bars defined.
- [x] Authoritative deference to `docs/11-Development/146` stated.

## 9. Dependencies

`docs/11-Development/146` (authoritative), `145`, `140`, `docs/10-Testing/130`,`136`, `docs/00-Vision/01`,`03`, `214`, `216`, `204`.

## 10. Risks

- R-1: "Done" that isn't safe/continuous (`146` R-1). Mitigation: BR-2/BR-3 mandatory safety gates + §5.
- R-2: Sprint declared done without its milestone gate. Mitigation: BR-6 + `204` exit criteria.
