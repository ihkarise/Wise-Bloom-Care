# 204 — Milestone Plan

| Field | Value |
|---|---|
| Document | Milestone & Release Plan (Implementation) |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Technical Program Manager / Release Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `docs/01-Product/15-MILESTONES.md`, `16-RELEASE_PLAN.md`, `205`–`213`, `215-DEPLOYMENT_CHECKLIST.md` |

---

## 1. Purpose

Maps the architecture's frozen milestone ladder (`docs/01-Product/15`) onto the implementation's shipping stages — **Milestone 0 → v1 Beta → v1 RC → Production** (then v2 track) — with deliverables, entry criteria, and exit criteria for each stage. It reuses the architecture's milestone IDs (MS-0.x…MS-3.x) and exit gates verbatim; it does not invent new milestones (`15` is the source of truth).

## 2. Stage Ladder

```
Milestone 0  (docs accepted + build foundation)
      ↓
v1 Beta       (MS-1.1 … MS-1.8 feature-complete on staging, synthetic data)
      ↓
v1 RC         (MS-1.9 hardening: continuity KPIs, a11y AA, security baseline, backups)
      ↓
Production    (v1.0 exit gate passed; care.wisehomeopathy.com)
      ↓
v2 Track      (MS-2.1 guardrails → MS-2.2 AI → MS-2.3 prediction → MS-2.4 sharing)
```

## 3. Stage: Milestone 0 — Foundation

- **Architecture milestones:** MS-0.6 (documentation acceptance) already met by the frozen baseline; this stage adds the build foundation.
- **Sprint:** 00.
- **Deliverables:** monorepo scaffolding (`201`), green CI (lint/type/test/build), `packages/domain-types` + `packages/api-contract` compiling, StorageAdapter interface + Sheets adapter skeleton, logging/audit scaffolding, synthetic-data seeding, env/secrets wiring, deployment pipeline dry-run to dev.
- **Entry criteria:** frozen architecture set accepted (MS-0.1…MS-0.6 exit gates in `15`).
- **Exit criteria:** `202` gate G-0 and G-1 pass — CI green on an empty-but-wired build; boundaries compile; a trivial round-trip through the adapter interface works against a dev spreadsheet; no secrets in repo (`60` BR-3).

## 4. Stage: v1 Beta — Continuous Record feature-complete

- **Architecture milestones:** MS-1.1 → MS-1.8.
- **Sprints:** 01, 02, 03, 04, 05.
- **Deliverables by milestone:**

| MS | Deliverable | Sprint | Exit gate (from `15`) |
|---|---|---|---|
| MS-1.1 | Auth + family record + timeline foundation | 01 | user can register; append-only timeline verified |
| MS-1.2 | Dashboard MVP | 02 | at-a-glance status + recent timeline rendered |
| MS-1.3 | Pregnancy vitals + charts | 02 | BP/weight/blood-sugar logged with current/previous/trend |
| MS-1.4 | Medicines + appointments + reminders | 03 (+07 polish) | reminders fire; visit recorded to timeline |
| MS-1.5 | Reports upload/view | 02 | lab & ultrasound artefacts stored & viewable |
| MS-1.6 | Week-by-week knowledge | 03 | GA-driven content surfaced from knowledge base |
| MS-1.7 | **Delivery transition** ★ | 04 | delivery auto-creates linked baby; 0 duplicates; loss path works |
| MS-1.8 | Baby core (growth/milestones/vaccination) | 05 | WHO charts render; CDC milestones & vaccine reminders work |

- **Entry criteria:** Milestone 0 exit passed.
- **Exit criteria:** MS-1.1…MS-1.8 exit gates all pass on **staging** with synthetic data; keystone MS-1.7 integrity verified (0 duplicate/orphan children; timeline unbroken — KPI M1/M2, `64`). Beta is not production; it is feature-complete-on-staging.

## 5. Stage: v1 RC — Hardening

- **Architecture milestone:** MS-1.9 (v1 hardening).
- **Sprint:** 08.
- **Deliverables:** WCAG 2.2 AA on core flows (`40`); performance budgets met (`134`); security baseline (RBAC, no PHI in logs, audit completeness, media privacy — `135`); backups verified (`62`, `151`); regression suite green (`136`); delivery-path rollback runbook exercised (`150`).
- **Entry criteria:** v1 Beta exit passed.
- **Exit criteria:** the **v1.0 (MVP) ship gate** of `docs/01-Product/16` §3 — continuity KPIs (0 duplicate profiles, 100% timeline continuity), WCAG 2.2 AA core flows, security baseline, backup/restore verified — all green on staging + UAT (`133`).

## 6. Stage: Production — v1.0

- **Deliverables:** v1.0 tagged and deployed to `care.wisehomeopathy.com` (`60`, `61`); monitoring live (`64`); changelog updated (`147`).
- **Entry criteria:** v1 RC exit (v1.0 ship gate) passed; release branch cut (`143`); UAT signed off (`133`).
- **Exit criteria:** production smoke tests pass; rollback verified reversible (`60` §7); monitoring shows continuity KPIs holding; incident/runbook on standby (`150`). Per `16` BR-1, no release ships without passing its exit gate.

## 7. Stage: v2 Track — Assistance & Insight

- **Architecture milestones:** MS-2.1 → MS-2.4.
- **Sprints:** 06, 07 (and beyond).
- **Deliverables & gates:**

| MS | Deliverable | Sprint | Exit gate (from `15`) |
|---|---|---|---|
| MS-2.1 | AI guardrail framework | 06 | 0 diagnostic/prescriptive outputs on adversarial set |
| MS-2.2 | AI assistant (explain/summarise) | 06 | report explanation + visit summary, educational-typed |
| MS-2.3 | Prediction engine | 07 | trends/projections surfaced, framed educationally |
| MS-2.4 | Caregiver/family sharing | 07 | explicit, revocable access; audit logged |

- **Entry criteria:** v1.0 in production; MS-2.1 guardrails pass **before** any AI-exposing milestone ships (`15` BR-3, `16` BR-3).
- **Exit criteria:** v2.0 ship gate of `16` §3 — 0 diagnostic/prescriptive AI outputs; prediction framed educationally; sharing audited.

> **Sequencing note:** Sprints 06–07 are built in parallel with v1 hardening where capacity allows, but **no AI capability ships** until v1 is in production and MS-2.1 passes. The v1 critical path (`202` §5) never waits on AI.

## 8. Milestone Governance (from `15` §3, restated)

- BR-1: A milestone is "done" only when its exit gate passes objectively (`146`).
- BR-2: MS-1.7 (delivery transition) is the keystone of v1; v1 cannot ship without it.
- BR-3: MS-2.1 (guardrails) blocks all AI-exposing milestones.
- BR-4: MS-3.1 (storage migration) blocks ecosystem-scale milestones (v3, out of this plan's MVP scope).

## 9. Milestone → Sprint → Test Traceability

Every "Must" FR and every vision invariant maps to ≥1 verifying test (`130` BR-1). The per-milestone exit gates above are verified by the suites named in `214-TESTING_CHECKLIST.md`; the release-tier gates are enforced per `215-DEPLOYMENT_CHECKLIST.md`.

## 10. Internal Consistency Review Points

Per `200` §10, a consistency review runs at each stage boundary (end of Milestone 0, v1 Beta, v1 RC, before Production, and at each v2 milestone). The review checks: sprint scope still matches architecture references; no architecture doc was edited; any discovered defect has an ADR proposal (`200` §11); exit gate evidence exists.

## 11. Acceptance Criteria

- [x] Architecture milestone ladder mapped to shipping stages with deliverables.
- [x] Entry and exit criteria per stage, reusing frozen exit gates verbatim.
- [x] Keystone (MS-1.7) and blocking (MS-2.1) milestones enforced.
- [x] Consistency-review points defined; no new milestones invented.

## 12. Dependencies

`docs/01-Product/15`, `16`, `205`–`213`, `214`, `215`, `docs/04-Architecture/64`.

## 13. Risks

- R-1: A stage entered before the prior exit gate passes. Mitigation: §8 BR-1 hard gates + `16` BR-1.
- R-2: AI shipped before guardrails. Mitigation: BR-3 + `202` gate G-5.
