# 60 — Deployment

| Field | Value |
|---|---|
| Document | Deployment Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `53-GOOGLE_APPS_SCRIPT.md`, `61-DOMAINS.md`, `docs/01-Product/16-RELEASE_PLAN.md`, `docs/12-Operations/*` |

---

## 1. Purpose

Describes how Wise Bloom Care is built, deployed, and promoted across environments — the frontend (Astro static/hybrid) and the backend (Google Apps Script web app) — with rollback and environment isolation. Domain is `care.wisehomeopathy.com`.

## 2. Scope

Build/deploy pipeline, environments, promotion, rollback. Release gating/versioning: `docs/01-Product/16`. Domain/DNS: `61`.

## 3. Environments

| Env | Frontend | Backend | Data |
|---|---|---|---|
| dev | local / preview build | dev GAS deployment | dev spreadsheet (synthetic) |
| staging | hosted staging build | staging GAS deployment | staging spreadsheet (synthetic/anon) |
| production | `care.wisehomeopathy.com` | prod GAS deployment | prod spreadsheet (real, private) |

Isolation: separate spreadsheets, Drive folders, secrets, and GAS deployments per environment — never share prod data with lower envs (`58`).

## 4. Frontend Deployment

- **Build:** Astro produces static/hybrid output (islands hydrated client-side).
- **Host:** a static host / CDN serving `care.wisehomeopathy.com` (host TBD; must support HTTPS, custom domain, CI deploys) — see `61`.
- **CI:** on merge to a release branch, run tests/lint/a11y/perf (`docs/10-Testing/*`), build, deploy to the target environment.
- **Config:** the frontend only holds the API base URL + public config; **no secrets** (`58` BR-2).

## 5. Backend Deployment (GAS)

- Source in the private repo (`apps/backend`), pushed via clasp; **code review before deploy** (`docs/11-Development/*`).
- Deploy as a **versioned Web App** (immutable deployment IDs) → rollback = repoint to a prior version (`53`).
- Secrets set in Script Properties per environment (`docs/09-Security/124`).
- Time-driven triggers (if used for reminders/backups) configured per environment.

## 6. Promotion Flow

1. Merge to release branch (`docs/11-Development/143`).
2. CI runs full suites; build artefacts.
3. Deploy to **staging**; run UAT + smoke tests (`docs/10-Testing/133`).
4. Verify release exit gate (`docs/01-Product/16`).
5. Promote to **production**; tag version; monitor (`64`).
6. Update changelog (`docs/11-Development/147`).

## 7. Rollback

- Frontend: redeploy the previous build artefact (immutable, versioned).
- Backend: repoint the web-app to the prior GAS version.
- Data: restore from backup if needed (`62`, `docs/12-Operations/151`); delivery-path has a dedicated rollback runbook (`docs/12-Operations/150`).
- Every release must be rollback-capable (release plan BR).

## 8. Configuration & Secrets

- Per-environment config via environment-specific stores (frontend build env, GAS Script Properties).
- No secrets in the repo; rotation per policy (`124`).

## 9. Business Rules

- BR-1: Environments are isolated (data, secrets, deployments); prod data never in lower envs.
- BR-2: Backend deploys are versioned and rollback-capable; code-reviewed before deploy.
- BR-3: No secrets in frontend or repo.
- BR-4: Production deploy only after passing the release exit gate.

## 10. Edge Cases

- Failed prod deploy → immediate rollback to prior version; incident per `125`.
- Partial deploy (frontend/backend mismatch) → API versioning (`56` §9) tolerates additive skew; breaking changes gated and coordinated.
- GAS quota/deploy limits → schedule deploys; monitor (`53`).

## 11. Acceptance Criteria

- [x] Environments and isolation defined.
- [x] Frontend and GAS backend deploy/rollback specified.
- [x] Promotion flow tied to release gates.
- [x] No-secrets and versioned-rollback rules stated.

## 12. Future Expansion

Feature flags, canary/staged rollout, IaC, automated DR drills, and CI/CD to a dedicated backend runtime if migrating off GAS.

## 13. Dependencies

`53`, `61`, `62`, `64`, `docs/01-Product/16`, `docs/10-Testing/*`, `docs/11-Development/*`, `docs/12-Operations/*`.

## 14. Open Questions

- OQ-1: Static host/CDN provider for the frontend.
- OQ-2: CI provider (GitLab CI given private GitLab) specifics.

## 15. Risks

- R-1: Prod/lower-env data bleed. Mitigation: BR-1 isolation.
- R-2: Unrecoverable bad deploy. Mitigation: BR-2 versioned rollback + backups.
