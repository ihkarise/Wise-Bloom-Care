# Implementation Readiness Report — Wise Bloom Care

| Field | Value |
|---|---|
| Report | Implementation Readiness |
| Status | Final (Draft 1.0) |
| Date | 2026-07-22 |
| Author | Principal Engineer / TPM (implementation-planning role) |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Planning Set | `docs/20-Implementation/200`–`217` + README |
| Scope | Readiness to begin building v1 (MVP) and the v2 track |

---

## 1. Executive Summary

The Wise Bloom Care architecture is complete, frozen at `v1.0.0-Architecture`, and rated production-ready. This report assesses whether the **implementation planning** now in `docs/20-Implementation/` is sufficient for engineering teams to build the product without ambiguity, and gives a Go/No-Go recommendation.

**Verdict: GO to begin Sprint 00.** The planning set converts the frozen architecture into an executable roadmap — monorepo structure, gap-free build order, dependency graph, milestone-to-sprint mapping, nine fully-specified sprints, and always-on testing/deployment/readiness/done gates. No architecture document was modified; every implementation document references architecture as the source of truth. Two engineering decisions were made at the implementation level and explicitly documented (monorepo tooling = pnpm workspaces; CI host = GitHub Actions), neither of which alters the frozen architecture.

## 2. Repository Readiness

| Area | Status | Evidence |
|---|---|---|
| Architecture baseline frozen & complete | ✅ Ready | 130 architecture docs + 6 ADRs; `ARCHITECTURE_REVIEW_REPORT.md`, `FINAL_REPOSITORY_REVIEW.md` |
| Knowledge base authored, code-independent | ✅ Ready | `knowledge-base/` incl. pregnancy weeks 01–40 + category READMEs |
| Implementation planning set | ✅ Ready | `docs/20-Implementation/200`–`217` + README (19 docs) |
| Monorepo structure defined | ✅ Ready | `201` expands `docs/04-Architecture/59` without altering it |
| Build order & critical path | ✅ Ready | `202` (L0–L8, keystone isolated) |
| Boundaries enforceable in code | ✅ Ready | `201` §6, `205` custom lint rules (Sheets-in-adapter, network-in-`api/`) |
| No architecture edits under planning | ✅ Verified | my commits touch only `docs/20-Implementation/`; `main`-stale artifact explained |

Repository readiness: **A**. The repo is design-complete and now plan-complete; code folders (`apps/`, `packages/`) are intentionally created in Sprint 00, per `59` §3.

## 3. Sprint Readiness

All nine sprints answer the ten mandatory questions (`200` §9) and carry Purpose, Objectives, Files (created/modified), Architecture references, Tasks, Deliverables, Acceptance Criteria, Testing, Risks, Rollback, Definition of Done, Estimated effort, and Dependencies.

| Sprint | Milestone(s) | Ready? | Notes |
|---|---|---|---|
| 00 Foundation | Milestone 0 | ✅ | Boundaries + CI + adapter skeleton; no features |
| 01 Auth/Family/Timeline | MS-1.1 | ✅ | Spine services; append-only verified |
| 02 Dashboard/Vitals/Reports | MS-1.2/1.3/1.5 | ✅ | Surfacing-only trend; media privacy |
| 03 Pregnancy mgmt/Knowledge | MS-1.4/1.6 | ✅ | Typed+sourced content; reminders |
| 04 Delivery ★ Keystone | MS-1.7 | ✅ | Idempotent sole-creator; loss path; integrity suite release-blocking |
| 05 Baby core | MS-1.8 | ✅ | WHO charts; CDC milestones; vaccines |
| 06 AI engine | MS-2.1/2.2 | ✅ | Guardrails-first; 0-violation gate before exposure |
| 07 Notifications/Prediction/Sharing | MS-2.3/2.4 | ✅ | Surfacing-only prediction; audited sharing |
| 08 Hardening → RC → Prod | MS-1.9 | ✅ | v1.0 ship gate; rollback drilled |

Sprint readiness: **A**. Each sprint is independently reviewable against its Definition of Ready (`216`) and exits against its Definition of Done (`217`).

## 4. Engineering Risks

| # | Risk | Severity | Mitigation (where) | Residual |
|---|---|---|---|---|
| ER-1 | Delivery transition breaks continuity (duplicate/orphan/reset) | **High** | Isolated Sprint 04; idempotency + immutable link + release-blocking integrity suite + monitoring + rollback runbook (`209`, `214` §4.1) | Low |
| ER-2 | Boundary erosion (client/app bypass) | High | Contract+adapter first; CI lint rules with meta-tests (`205`, `201` §6) | Low |
| ER-3 | Ungrounded/diagnostic AI output | High | Guardrails-first; RAG grounding; 0-violation adversarial gate before any exposure (`211`, `214` §4.3) | Low (and off v1 critical path) |
| ER-4 | Apps Script quota/execution limits | Medium | Batching/caching/thin services; adapter keeps migration a new folder (`202`, `52` R-2) | Medium — monitor via `64` |
| ER-5 | Non-relational storage integrity gaps | Medium | Adapter-enforced FK/uniqueness/immutability/append-only + integrity tests (`206`, `209`) | Low |
| ER-6 | PHI/secret leakage | Medium | No secrets in repo/frontend; Script Properties; PHI-stripped logs; secret scanning (`205`, `215`) | Low |
| ER-7 | Scope creep inside sprints | Medium | DoR gate + "build only what the sprint requires" + scope freeze (`216`, `200` §3.4) | Low |
| ER-8 | Embedding/index under GAS constraints (`100` OQ-2) | Medium | Offline index build in `tools/rag`; provider abstraction; ADR proposal if architecturally significant (`211` R-4) | Medium — v2 only |
| ER-9 | Shipping past a failed gate under date pressure | Medium | Hard exit gates (`16` BR-1, `204`, `213` §7) | Low |

No **critical/blocking** risk to starting Sprint 00. The two highest product risks (ER-1, ER-2) are addressed structurally in Sprint 00 and functionally in Sprint 04 — i.e., early, not deferred.

## 5. Critical Path

```
L0 foundation → L1 boundaries → L2 Auth+Timeline+Audit → L3 Family+Pregnancy+Vitals
→ L4 Medicines/Appointments → L5 ★DeliveryService → L6 Baby+Growth/Milestones/Vaccination
→ L8 hardening (continuity KPIs, a11y AA, security baseline, backups) → v1 RC → Production
```

- Keystone on the path: **Sprint 04 / DeliveryService (MS-1.7)** — blocks all child-scoped modules; v1 cannot ship without it (`202` §5, `15` BR-2).
- **AI (Sprints 06–07) is off the v1 critical path** — it targets v2, is guardrail-gated, and can slip without blocking the v1 release.

## 6. Estimated Timeline

Effort estimates are from the sprint docs (team-capacity-dependent; the architecture deliberately omits calendar dates — `14` OQ-1). Ranges assume the recommended team (§7) and account for parallel tracks (`202` §6).

| Stage | Sprints | Nominal duration |
|---|---|---|
| Milestone 0 | 00 | ~2 weeks |
| v1 Beta (feature-complete on staging) | 01–05 | ~14 weeks (some P2/P3 parallelism) |
| v1 RC → Production | 08 | ~3 weeks |
| **v1 (MVP) total** | 00–05, 08 | **~19 weeks (~4.5 months)** |
| v2 track (parallelisable w/ hardening where capacity allows) | 06–07 | ~6 weeks additional |

These are planning estimates, not commitments; exit gates — not dates — govern promotion (`14` BR-1).

## 7. Recommended Team Structure

Minimum viable team to execute this plan without serialising the critical path:

- **1 Tech Lead / Staff Engineer** — owns boundaries (contract + adapter), architecture conformance, keystone (Sprint 04).
- **2 Backend Engineers** — domain services, Sheets adapter, integrity.
- **2 Frontend Engineers** — Astro/React features against the contract, charts, a11y.
- **1 QA Lead** — safety-critical suites (continuity, typing, privacy, a11y), UAT.
- **1 DevOps / Release Manager (shared)** — CI/CD, environments, deploy/rollback, monitoring, backups.
- **+ AI/Safety reviewer (Sprints 06–07)** — RAG/guardrails, adversarial red-teaming.
- **+ Clinical reviewer (as-needed)** — content typing/sourcing review (Content DoD).

Roughly **5–6 engineers + QA + shared DevOps** for v1. Frontend can build against the contract ahead of backend (`202` §6), keeping both tracks busy.

## 8. Go / No-Go Recommendation

**GO — begin Sprint 00 (Foundation).**

Rationale: the architecture is frozen and complete; the implementation plan is gap-free, boundary-first, risk-sequenced, and testable; the keystone and safety gates are explicit and release-blocking; no architecture was altered; and the only open engineering questions (state library, API codegen, static host/CDN, CI specifics, embedding index) are non-blocking for Sprint 00 and are tracked to the sprints/ADRs where they resolve. Conditions on GO:

1. Sprint 00 must land the two boundary lint rules with meta-tests before feature work (`205` §8) — this is the structural guarantee against erosion.
2. Sprint 04 integrity suite and rollback runbook are release-blocking for v1 (`209`, `213`).
3. No AI capability ships before MS-2.1 passes (`211`, `15` BR-3).

## 9. Overall Engineering Grade

**A (Implementation-Ready).**

The planning set is execution-grade: a developer can pick up any sprint, know exactly what to build, which frozen docs define it, which files change, how it is tested, how it rolls back, and when it is done. Points short of A+ are reserved until first code proves the estimates and the Apps Script/embedding constraints (ER-4, ER-8) are measured against reality — appropriately, those are empirical, not planning, questions.

## 10. Appendix — Planning Set Manifest

`docs/20-Implementation/`: README, `200` Strategy, `201` Monorepo, `202` Build Order, `203` Module Dependencies, `204` Milestone Plan, `205`–`213` Sprints 00–08, `214` Testing Checklist, `215` Deployment Checklist, `216` Definition of Ready, `217` Definition of Done. Root: this report.

Consistency review (`200` §10) performed: no architecture/knowledge-base file modified; sprint↔milestone↔test mappings reconciled across `202`/`203`/`204`/`214`; numbering deviation (sprints `205`–`213`, checklists `214`–`217`) documented in README §3.
