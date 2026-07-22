# 153 — Maintenance

| Field | Value |
|---|---|
| Document | Maintenance |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `150-RUNBOOK.md`, `docs/02-Research/27-REFERENCES.md`, `docs/09-Security/124-SECRET_MANAGEMENT.md` |

---

## 1. Purpose
Defines ongoing maintenance activities that keep Wise Bloom Care healthy, secure, and current — including the critical, domain-specific task of keeping medical content and immunization schedules up to date with their sources.

## 2. Scope
Routine and periodic maintenance: dependencies, secrets, content/schedule freshness, monitoring hygiene, and scheduled maintenance windows.

## 3. Maintenance Activities
| Activity | Cadence | Notes |
|---|---|---|
| Dependency updates/patching | regular | security patches prioritised |
| Secret rotation | scheduled + on compromise | `docs/09-Security/124` |
| **Medical content review** | ≥ annually + on guideline change | re-verify WHO/ACOG/FIGO/NICE/CDC sources (`docs/02-Research/27` BR-5) |
| **Immunization schedule re-verification** | before each release | re-verify NIS/jurisdiction schedule (`docs/02-Research/24` BR-3) |
| Backup verification / restore drills | periodic | `151` |
| Monitoring/threshold tuning | ongoing | `docs/04-Architecture/64` |
| Quota/capacity review | ongoing | migration threshold (RSK-9) |
| AI guardrail/adversarial-set review | on model/prompt change | `docs/07-AI/105`, `docs/10-Testing/135` |
| Accessibility re-audit | per release | `docs/03-UX/40` |

## 4. Content Freshness (domain-critical)
- Medical content and schedules are versioned (`docs/05-Data/77`, `docs/07-AI/101`); maintenance re-verifies against primary sources and updates the freshness log (`docs/02-Research/27` §5).
- Guideline changes (e.g., WHO/CDC/NIS updates) trigger content re-review and re-pinning on release.

## 5. Scheduled Maintenance
- Maintenance windows communicated to users where impactful; prefer zero-downtime.
- Changes follow the release process (`docs/01-Product/16`) and DoD (`docs/11-Development/146`).

## 6. Business Rules
- BR-1 Dependencies patched regularly; security patches prioritised.
- BR-2 Medical content reviewed ≥ annually and on guideline change; schedules re-verified per release.
- BR-3 Secrets rotated on schedule + compromise.
- BR-4 Backups drilled; monitoring tuned; guardrails re-tested on change.
- BR-5 Content/schedule updates are versioned and release-pinned.

## 7. Edge Cases
Urgent guideline change (expedited content update + release); dependency with breaking change (plan migration); GAS platform changes; provider deprecations (AI/OCR) — abstraction eases swap (`docs/07-AI/100`).

## 8. Acceptance Criteria
- [x] Maintenance activities + cadence defined.
- [x] Domain-critical content/schedule freshness maintenance specified.
- [x] Versioning/release-pinning + security patching rules.

## 9. Future Expansion
Automated dependency/security scanning, automated content-source monitoring, maintenance dashboards, SLA-backed maintenance.

## 10. Dependencies
`150`, `151`, `docs/02-Research/24`, `27`, `docs/05-Data/77`, `docs/07-AI/100`, `101`, `105`, `docs/09-Security/124`, `docs/04-Architecture/64`.

## 11. Open Questions
- OQ-1 Content-review ownership (clinician + domain researcher).
- OQ-2 Automated source-change monitoring feasibility.

## 12. Risks
- R-1 Stale medical content/schedules. Mitigation: BR-2 review cadence + release re-verify (RSK-15).
- R-2 Unpatched vulnerabilities. Mitigation: BR-1 patching.
