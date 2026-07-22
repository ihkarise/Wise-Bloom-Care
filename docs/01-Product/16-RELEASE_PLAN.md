# 16 — Release Plan

| Field | Value |
|---|---|
| Document | Release Plan |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect / Product |
| Last Updated | 2026-07-22 |
| Related | `14-ROADMAP.md`, `15-MILESTONES.md`, `docs/04-Architecture/60-DEPLOYMENT.md`, `docs/11-Development/144-COMMIT_CONVENTION.md` |

---

## 1. Purpose

Defines how Wise Bloom Care is versioned, gated, and released. It specifies release tiers, versioning scheme, entry/exit criteria, environments, and rollback posture, so that shipping is predictable, safe, and reversible.

## 2. Versioning Scheme

- **Semantic-style product versions:** `vMAJOR.MINOR.PATCH`.
  - MAJOR = roadmap phase / breaking product change (v1, v2, v3).
  - MINOR = additive feature release within a phase.
  - PATCH = fixes, content updates, non-breaking tweaks.
- **Documentation & knowledge base** are versioned independently (`docs/05-Data/77-VERSIONING.md`); a product release pins the knowledge-base version it ships with.

## 3. Release Tiers & Gates

| Release | Contents | Entry gate | Exit / ship gate |
|---|---|---|---|
| **v1.0 (MVP)** | Phase 1 milestones MS-1.1…MS-1.9 | Architecture docs accepted (MS-0.*) | Continuity KPIs (0 duplicate profiles, 100% timeline continuity), WCAG 2.2 AA core flows, security baseline, backup/restore verified |
| **v1.x** | Fixes, content, minor pregnancy/baby enhancements | v1.0 shipped | Regression suite green; no new Non-Goal violations |
| **v2.0** | Phase 2 (AI, prediction, sharing) | MS-2.1 guardrails pass | 0 diagnostic/prescriptive AI outputs; prediction framed educationally; sharing audited |
| **v3.0** | Phase 3 (clinician portal, offline PWA) | MS-3.1 migration validated | Offline integrity; RBAC for clinician role; migration conformance |

## 4. Environments

| Environment | Purpose | Data |
|---|---|---|
| Local/dev | Development | Synthetic only |
| Staging | Pre-prod verification, UAT | Synthetic / anonymised |
| Production (`care.wisehomeopathy.com`) | Live | Real, private (see `docs/09-Security`) |

Deployment mechanics: `docs/04-Architecture/60-DEPLOYMENT.md`. Domain: `docs/04-Architecture/61-DOMAINS.md`.

## 5. Release Process

1. Cut a release branch per `docs/11-Development/143-BRANCH_STRATEGY.md`.
2. Freeze scope; run full regression, performance, security, and accessibility suites (`docs/10-Testing/*`).
3. UAT on staging (`docs/10-Testing/133-UAT.md`).
4. Verify exit gate for the tier.
5. Tag version; deploy; monitor (`docs/04-Architecture/64-MONITORING.md`).
6. Update `docs/11-Development/147-CHANGELOG.md`.

## 6. Rollback & Safety

- Every release must be rollback-capable; deployments are reversible.
- Data migrations are forward-safe and reversible where feasible; backups verified before release (`docs/12-Operations/151-BACKUP_RESTORE.md`).
- The delivery-transition data path (MS-1.7) has an explicit rollback runbook (`docs/12-Operations/150-RUNBOOK.md`) given its criticality.

## 7. Business Rules

- BR-1: No release ships without passing its exit gate.
- BR-2: No release introduces a Non-Goal violation (`17-NON_GOALS.md`).
- BR-3: v2+ AI releases are blocked on guardrail conformance (MS-2.1).
- BR-4: Every release is tagged and recorded in the changelog.

## 8. Acceptance Criteria

- [x] Versioning scheme defined and reconciled with docs/KB versioning.
- [x] Each tier has explicit entry and exit gates.
- [x] Environments, process, and rollback posture defined.

## 9. Future Expansion

Introduce feature flags and canary/staged rollout as user base grows; formalise release cadence once team capacity is known.

## 10. Dependencies

`15-MILESTONES.md`, `docs/04-Architecture/60-DEPLOYMENT.md`, `docs/10-Testing/*`, `docs/12-Operations/*`.

## 11. Open Questions

- OQ-1: Release cadence (continuous vs. scheduled) — pending team capacity.
- OQ-2: Feature-flag tooling choice.

## 12. Risks

- R-1: Shipping under date pressure past a failed gate. Mitigation: BR-1 hard gate.
- R-2: Irreversible data migration on the delivery path. Mitigation: §6 rollback runbook + backups.
