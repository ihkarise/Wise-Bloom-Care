# 215 — Deployment Checklist

| Field | Value |
|---|---|
| Document | Deployment Checklist |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Lead / Release Manager |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `docs/04-Architecture/60-DEPLOYMENT.md`, `61-DOMAINS.md`, `62-BACKUP_STRATEGY.md`, `64-MONITORING.md`, `docs/01-Product/16-RELEASE_PLAN.md`, `docs/12-Operations/*` |

---

## 1. Purpose

An operational deployment checklist implementing the frozen deployment architecture (`docs/04-Architecture/60`) and release plan (`docs/01-Product/16`) across **dev → staging → production**, with rollback, monitoring, logging, secrets, and backups. It adds no new deployment design; it makes `60`/`16` executable per environment.

## 2. Environments (from `60` §3)

| Env | Frontend | Backend (GAS) | Data | Purpose |
|---|---|---|---|---|
| dev | local/preview build | dev GAS deployment | dev spreadsheet (synthetic) | development |
| staging | hosted staging build | staging GAS deployment | staging spreadsheet (synthetic/anon) | pre-prod, UAT |
| production | `care.wisehomeopathy.com` | prod GAS deployment | prod spreadsheet (real, private) | live |

Isolation is mandatory: separate spreadsheets, Drive folders, secrets, and GAS deployments per env; **prod data never in lower envs** (`60` BR-1, `58`).

## 3. Pre-Deploy Checklist (every environment)

- [ ] CI green: lint, type-check, unit, integration, boundary lint rules.
- [ ] Target-env config present: frontend API base URL + public config only (**no secrets** in frontend/repo) (`60` BR-3).
- [ ] Backend secrets set in **Script Properties** for the target env (`124`); rotated per policy.
- [ ] Time-driven triggers (reminders/backups) configured for the target env only (`60` §5).
- [ ] Build artifact is immutable/versioned (frontend) and GAS deploy is a versioned Web App (immutable deployment ID) (`60` §5).

## 4. Dev Deployment

- [ ] `deploy-dev` pipeline builds frontend + `clasp push` to dev GAS.
- [ ] Synthetic data seeded (`scripts/seed-synthetic.ts`); no PHI.
- [ ] Smoke test: adapter round-trip + auth + a representative endpoint.

## 5. Staging Deployment (pre-prod verification)

- [ ] Promote build to staging; deploy staging GAS version.
- [ ] Run full suites: regression, performance, security, accessibility (`docs/10-Testing/*`, `214`).
- [ ] Run integrity suite at scale (continuity KPI M1/M2) on synthetic families (`64`).
- [ ] UAT executed and signed off (`133`).
- [ ] Verify the release tier's exit gate (`16` §3) before promoting.

## 6. Production Deployment (from `60` §6, `16` §5)

- [ ] Release branch cut (`release/vX.Y`), scope frozen (`143`).
- [ ] Release exit gate verified (v1.0: continuity KPIs, WCAG AA core flows, security baseline, backups verified — `16` §3).
- [ ] Backups verified **before** release (`62`,`151`).
- [ ] Tag immutable version (`vX.Y.Z`).
- [ ] Deploy frontend to `care.wisehomeopathy.com` (`61`); deploy prod GAS version.
- [ ] Post-deploy smoke tests on production (auth, timeline read, a representative write, delivery endpoint health).
- [ ] Monitoring live and green (`64`); continuity KPIs holding.
- [ ] Changelog updated (`147`).

## 7. Rollback (from `60` §7 — every release must be rollback-capable)

- [ ] **Frontend:** redeploy the previous immutable build artifact.
- [ ] **Backend:** repoint the GAS Web App to the prior version (immutable deployment ID).
- [ ] **Data:** restore from verified backup if needed (`62`,`151`); the **delivery path** uses its dedicated rollback runbook (`150`) given its criticality (`16` §6).
- [ ] Partial deploy (frontend/backend mismatch): API versioning tolerates additive skew; breaking changes are gated + coordinated (`56` §9, `60` §10).
- [ ] Failed prod deploy → immediate rollback to prior version; incident per `125`.

## 8. Monitoring & Logging (from `63`,`64`)

- [ ] Structured logs active; **no PHI** in logs (`63`).
- [ ] Metrics/dashboards live: continuity (0 duplicate/orphan — M1/M2), content typing (M3/M4), privacy, performance (`64`).
- [ ] Alerting on integrity KPI breaches (e.g., any duplicate/orphan child) (`64`, `111` §6).
- [ ] Error contract returns safe messages; no PHI/internals leaked (`52` §8, `56` §8).

## 9. Secrets & Config (from `60` §8, `124`)

- [ ] No secrets in repo or frontend build (`60` BR-3); `.gitignore` excludes `.clasp.json`, `.env*`.
- [ ] Per-env secrets in Script Properties; rotation per `124`.
- [ ] Secret scanning in CI clean (`140` R-2).

## 10. Backups & DR (from `62`,`151`,`152`)

- [ ] Automated backups configured per env (prod verified) (`62`).
- [ ] Restore tested on staging (`151`).
- [ ] Disaster-recovery procedure documented and drilled (`152`).
- [ ] Delivery-path rollback runbook drilled before v1.0 (`150`).

## 11. Business Rules (from `60` §9)

- BR-1: Environments isolated (data/secrets/deploys); prod data never in lower envs.
- BR-2: Backend deploys are versioned + rollback-capable; code-reviewed before deploy.
- BR-3: No secrets in frontend or repo.
- BR-4: Production deploy only after passing the release exit gate (`16` BR-1).

## 12. Acceptance Criteria

- [x] Per-env deploy steps (dev/staging/prod) defined, implementing `60`/`16`.
- [x] Rollback, monitoring, logging, secrets, backups checklists included.
- [x] Release-gate + isolation + no-secrets rules restated; delivery-path rollback runbook referenced.

## 13. Dependencies

`docs/04-Architecture/60`,`61`,`62`,`63`,`64`, `docs/01-Product/16`, `docs/09-Security/124`,`125`, `docs/12-Operations/150`,`151`,`152`, `214`.

## 14. Risks

- R-1: Prod/lower-env data bleed (`60` R-1). Mitigation: BR-1 isolation checks.
- R-2: Unrecoverable bad deploy (`60` R-2). Mitigation: BR-2 versioned rollback + verified backups (§7,§10).
