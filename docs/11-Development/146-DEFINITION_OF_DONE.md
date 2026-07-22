# 146 — Definition of Done

| Field | Value |
|---|---|
| Document | Definition of Done |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect / Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `145-PR_TEMPLATE.md`, `docs/10-Testing/130-TEST_PLAN.md`, `docs/00-Vision/03-PRODUCT_PRINCIPLES.md` |

---

## 1. Purpose
Defines "done" for any change — the objective bar a change must clear to be considered complete and mergeable/shippable. It operationalises the Manifesto's "test of a feature" and the Product Principles into a checklist.

## 2. Scope
DoD for features, fixes, and content. Release-level gates: `docs/01-Product/16`.

## 3. Definition of Done (a change is done when…)
- **Spec:** it satisfies its requirement/acceptance criteria (`docs/01-Product`, module doc).
- **Principles:** it passes the "test of a feature" — Continuity, Calm, Safety, Privacy, Truth (`docs/00-Vision/01` §6, `03`). A principle violation = not done.
- **Standards:** code meets standards (`140`); lint/type-check pass.
- **Tests:** unit/integration/e2e added/updated and green; safety-critical cases where relevant (`docs/10-Testing/131`); regression core green (`136`).
- **Safety:** medical content typed + sourced; AI via guardrails; continuity invariants intact; RBAC/audit respected (`docs/02-Research/28`, `docs/07-AI/105`, `docs/06-Modules/88`, `docs/09-Security/123`).
- **Accessibility:** WCAG 2.2 AA considered/verified for UI (`docs/03-UX/40`).
- **Privacy:** no secrets/PHI added; synthetic data only.
- **Docs:** relevant docs updated/in sync; ADR if significant.
- **Review:** MR approved with the template checklist verified (`145`).
- **CI:** all gates pass.

## 4. Content DoD (medical)
- Typed (educational/clinical/emergency), sourced (`source_ref`), facts vs. design separated, reviewed; no invented facts (`docs/02-Research/27`, `28`, `docs/07-AI/101`).

## 5. Business Rules
- BR-1 A change is "done" only when it passes the full DoD, objectively.
- BR-2 A Product-Principle violation blocks done regardless of polish.
- BR-3 Safety-critical items (continuity, typing, guardrails, RBAC) are mandatory where applicable.
- BR-4 Docs-in-sync + tests green are required.
- BR-5 Medical content meets the Content DoD.

## 6. Edge Cases
Docs-only change (subset applies); spike/prototype (explicitly marked not-done/experimental); hotfix (DoD still applies, expedited); partial feature behind a flag (DoD applies to what's shipped).

## 7. Acceptance Criteria
- [x] Objective DoD checklist covering spec, principles, tests, safety, a11y, privacy, docs, review, CI.
- [x] Content DoD for medical content.
- [x] Principle-violation-blocks-done rule.

## 8. Future Expansion
Automated DoD checks in CI; per-area DoD extensions; release readiness dashboards.

## 9. Dependencies
`145`, `140`, `docs/10-Testing/130`, `131`, `136`, `docs/00-Vision/01`, `03`, `docs/02-Research/28`, `docs/07-AI/105`.

## 10. Open Questions
- OQ-1 Which DoD items are CI-automatable now.

## 11. Risks
- R-1 "Done" that isn't safe/continuous. Mitigation: BR-2/BR-3 mandatory safety gates.
