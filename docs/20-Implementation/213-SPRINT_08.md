# 213 — Sprint 08: Beta Stabilization (Performance, Bug-Fixing, Documentation, Hardening)

| Field | Value |
|---|---|
| Sprint | 08 — v1 hardening → RC → Production readiness |
| Status | Planned |
| Milestone | MS-1.9 (`204` §5) → v1.0 ship gate |
| Layers | L8 (`202` §3) |
| Ships toward | v1 RC → Production |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · whole team + QA/DevOps/Release lead |

---

## 1. Purpose

Take v1 from feature-complete-on-staging (v1 Beta) to a **Release Candidate** that passes the v1.0 ship gate, then to **Production**. This sprint adds **no new features** — it stabilises: performance budgets, accessibility AA on core flows, the security baseline, backup/restore verification, regression, documentation sync, and the delivery-path rollback drill. Exit gate MS-1.9 + the v1.0 ship gate (`16` §3).

## 2. Objectives

1. Performance: meet mobile-first budgets on core flows (`134`, `51` §10).
2. Accessibility: WCAG 2.2 AA on all core flows (`40`).
3. Security baseline: RBAC, no PHI in logs, audit completeness, media privacy, rate limiting, secret hygiene (`135`, `120`–`124`).
4. Continuity verification: 0 duplicate/orphan children; 100% timeline continuity (KPI M1/M2, `64`).
5. Backups: verified backup + restore; delivery-path rollback runbook drilled (`62`, `151`, `150`).
6. Regression: full regression suite green (`136`).
7. Documentation: user/support docs + runbooks in sync (`154`, `150`); changelog (`147`).

## 3. Architecture References

`docs/10-Testing/130`,`133` (UAT),`134` (perf),`135` (security),`136` (regression); `docs/03-UX/40` (a11y); `docs/04-Architecture/62` (backup),`64` (monitoring); `docs/09-Security/120`–`125`; `docs/12-Operations/150` (runbook),`151` (backup/restore),`152` (DR),`153`,`154`; `docs/01-Product/16` §3 (v1.0 ship gate); `docs/11-Development/147` (changelog).

## 4. Files Created / Modified

```
(created) tests/performance/core-flows.perf.ts • tests/a11y/core-flows.a11y.ts
(created) tests/regression/v1-regression.suite.ts • tests/security/security-baseline.test.ts
(created) docs/12-Operations updates verified (no architecture edits) — user-facing support notes if needed
(modified) .github/workflows/ci.yml — add perf + a11y + security-baseline gates to CI
(modified) .github/workflows/deploy-prod.yml — production deploy with gate check + rollback path
(modified) apps/web & apps/backend — targeted fixes only (no new features); flags cleaned up for GA
(modified) docs/11-Development/147-CHANGELOG.md — v1.0 entry
(modified) README.md — production run/deploy/rollback notes
```

> No `docs/00`–`docs/13` or `docs/ADR/*` architecture edits. If a defect implies an architecture change, raise an ADR proposal (`200` §11) — do not edit the frozen set.

## 5. Tasks

1. Performance pass: measure core flows against budgets (`134`); fix regressions via island lazy-load, caching, image optimisation (`51` §10). Add perf gate to CI.
2. Accessibility pass: audit + fix core flows to AA (`40`); add automated a11y gate to CI; manual keyboard/screen-reader/reduced-motion checks (`132`).
3. Security baseline: verify RBAC on every endpoint, no PHI in logs, audit completeness, media privacy, rate limiting, secret hygiene; run secret scanning (`135`, `140` R-2).
4. Continuity verification: run the delivery integrity suite at scale on synthetic families; confirm KPI M1/M2 = target (`64`, `130` §4).
5. Backups + DR: verify backup + restore on staging; drill the delivery-path rollback runbook (`150`,`151`,`152`).
6. Regression: assemble + green the full v1 regression suite (`136`).
7. UAT on staging (`133`); resolve blockers; freeze scope.
8. Documentation sync: runbooks, support guide, changelog v1.0 (`147`,`150`,`154`); confirm all sprint docs match shipped reality (`200` §10).
9. Release: cut `release/v1.0` (`143`), verify the v1.0 ship gate (`16` §3), tag `v1.0.0`, deploy to production, monitor (`64`), update changelog.

## 6. Deliverables

- v1 RC passing MS-1.9 + the v1.0 ship gate.
- Perf + a11y + security-baseline gates in CI.
- Verified backups + drilled rollback runbooks.
- Green full regression suite; UAT sign-off.
- Production deployment of v1.0 with monitoring live.

## 7. Acceptance Criteria (the v1.0 ship gate — `16` §3)

- [ ] **Continuity KPIs:** 0 duplicate profiles; 100% timeline continuity (`64`, MS-1.7 verified at scale).
- [ ] **Accessibility:** WCAG 2.2 AA on all core flows (`40`).
- [ ] **Security baseline:** RBAC enforced; no PHI in logs; audit complete; media private; rate limiting active (`135`).
- [ ] **Backups:** backup + restore verified; delivery-path rollback runbook drilled (`62`,`151`,`150`).
- [ ] **Regression:** full suite green (`136`); no Non-Goal violations (`17`).
- [ ] **Performance:** budgets met on core flows (`134`).
- [ ] **UAT:** signed off on staging (`133`).
- [ ] **Release:** `v1.0.0` tagged; production deploy succeeds; rollback verified reversible (`60` §7); monitoring green.

## 8. Testing (see `214`)

- **Regression:** full v1 suite (`136`).
- **Performance:** core-flow budgets (`134`).
- **Accessibility:** automated + manual AA (`40`,`132`).
- **Security:** baseline suite + secret scanning (`135`).
- **Integrity (at scale):** continuity KPI verification (`64`,`130` §4).
- **DR:** backup/restore + rollback runbook drill (`151`,`150`).
- **UAT:** `133`.

## 9. Risks

- R-1: Shipping under date pressure past a failed gate (`16` R-1). Mitigation: hard ship gate (`16` BR-1) — no exceptions.
- R-2: Unrecoverable bad prod deploy (`60` R-2). Mitigation: versioned rollback + verified backups + drilled runbook (Tasks 5, 9).
- R-3: "Fixes" that add scope. Mitigation: scope freeze (Task 7); no new features (§1).
- R-4: Prod/lower-env data bleed (`60` R-1). Mitigation: environment isolation verified (`60` BR-1).

## 10. Rollback

- **Production rollback is a first-class deliverable of this sprint.** Frontend: redeploy the prior immutable build artifact. Backend: repoint the GAS web app to the prior version (`60` §7). Data: restore from verified backup (`151`,`62`); the delivery path uses its dedicated runbook (`150`). Every release is rollback-capable (`16` §6, BR-1). Incident handling per `125`.

## 11. Definition of Done

Per `217`/`146` **plus** the release bar: the v1.0 ship gate (§7) passes objectively; perf/a11y/security/regression gates green in CI; backups + rollback drilled; docs/runbooks/changelog in sync; UAT signed; `v1.0.0` tagged and deployed with monitoring; rollback verified. Per `16` BR-1, production ships only after the exit gate passes.

## 12. Dependencies

Depends on: Sprints 00–05 (v1 feature set) and Sprint 07 (monitoring/analytics). Sprints 06–07 AI/prediction may still be behind flags for v2 and do not block this v1 release. Terminal sprint for v1; hands off to the v2 track (`204` §7).
