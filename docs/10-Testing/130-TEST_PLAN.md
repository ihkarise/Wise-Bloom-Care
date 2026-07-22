# 130 — Test Plan

| Field | Value |
|---|---|
| Document | Master Test Plan |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect |
| Last Updated | 2026-07-22 |
| Related | `131`–`136`, `docs/01-Product/10-PRD.md`, `docs/01-Product/16-RELEASE_PLAN.md` |

---

## 1. Purpose
Defines the overall testing strategy for Wise Bloom Care: what is tested, at what levels, how quality gates map to releases, and how the product's safety-critical properties (continuity, content typing, privacy, AI safety) are verified. It is the umbrella for the specialised test docs (`131`–`136`).

## 2. Scope
Test levels, coverage strategy, environments, entry/exit criteria, and traceability to requirements. Detailed cases: `131`; specialised plans: `132`–`136`.

## 3. Test Levels
| Level | Focus | Docs |
|---|---|---|
| Unit | services/functions (business rules, computations) | dev-owned |
| Integration | service ↔ adapter ↔ API; delivery transition | `131` |
| End-to-end | user journeys across modules | `131`, `132` |
| Manual/exploratory | UX, edge cases, compassion flows | `132` |
| UAT | real-user acceptance | `133` |
| Performance | budgets, load | `134` |
| Security | threat mitigations, AI guardrails | `135` |
| Regression | prevent recurrence | `136` |
| Accessibility | WCAG 2.2 AA (cross-cutting) | `docs/03-UX/40` |

## 4. Safety-Critical Test Priorities
1. **Continuity:** delivery transition creates linked child(ren) exactly once; 0 duplicate/orphan; timeline unbroken (KPI M1/M2).
2. **Content typing:** educational/clinical/emergency never mixed; medical content sourced (KPI M3/M4).
3. **AI safety:** 0 diagnostic/prescriptive/emergency-decision outputs on the adversarial set (`135`, MS-2.1).
4. **Privacy/security:** RBAC, no PHI in logs, audit completeness, media privacy (`135`).
5. **Accessibility:** core flows pass AA.

## 5. Traceability
- Every "Must" FR (`docs/01-Product/10`) maps to ≥1 case in `131` (feature-matrix BR-3).
- Every vision invariant (BR-V1..BR-V5) has a verifying test.
- Coverage tracked; gaps block release.

## 6. Environments & Data
- Tests run on dev/staging with **synthetic data only** (never prod PHI) (`docs/04-Architecture/60`).
- Delivery-transition and integrity tests use dedicated synthetic families.

## 7. Quality Gates (per release)
- Unit/integration/e2e green; regression green.
- Continuity + content-typing + privacy tests pass.
- Accessibility AA on core flows.
- Performance budgets met.
- (v2) AI adversarial set: 0 violations.
- Backups verified (`docs/04-Architecture/62`).
Gates align with `docs/01-Product/16` exit criteria.

## 8. Business Rules
- BR-1 Every Must FR + vision invariant has a verifying test.
- BR-2 Tests use synthetic data only; never prod PHI.
- BR-3 Release gated on safety-critical suites (continuity, typing, privacy, a11y, AI).
- BR-4 Coverage gaps for Must FRs block release.
- BR-5 AI features gated on 0 adversarial-safety violations.

## 9. Edge Cases
Loss path; multiple births; retrospective onboarding; preterm/corrected age; multi-caregiver conflicts; offline (future). Each has explicit cases in `131`/`132`.

## 10. Acceptance Criteria
- [x] Test levels + safety-critical priorities defined.
- [x] Traceability to Must FRs + vision invariants.
- [x] Quality gates mapped to releases; synthetic-data rule.

## 11. Future Expansion
CI test automation, mutation testing, contract tests for the API, continuous accessibility + AI red-teaming, load/chaos testing.

## 12. Dependencies
`131`–`136`, `docs/01-Product/10`, `15`, `16`, `docs/03-UX/40`, `docs/07-AI/105`.

## 13. Open Questions
- OQ-1 CI provider + automation scope for v1 (GitLab CI).
- OQ-2 Test-data generation tooling.

## 14. Risks
- R-1 Untested safety-critical paths. Mitigation: BR-1/BR-3 priorities + gates.
- R-2 Using real PHI in tests. Mitigation: BR-2 synthetic only.
