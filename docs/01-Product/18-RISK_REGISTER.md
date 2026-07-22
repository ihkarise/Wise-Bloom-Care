# 18 — Risk Register

| Field | Value |
|---|---|
| Document | Product Risk Register |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect / QA Architect |
| Last Updated | 2026-07-22 |
| Related | `10-PRD.md`, `17-NON_GOALS.md`, `docs/09-Security/120-THREAT_MODEL.md`, `docs/10-Testing/130-TEST_PLAN.md` |

---

## 1. Purpose

Consolidates the product-level risks for Wise Bloom Care with likelihood, impact, owner, and mitigation, and links to the specialised registers (security threat model, per-document risk sections). It is the master risk view used in release gating and review.

## 2. Scoring

- **Likelihood:** Low / Medium / High.
- **Impact:** Low / Medium / High / Critical (Critical = user-safety, legal, or data-loss consequences).
- **Priority:** derived; any Critical-impact risk is High priority regardless of likelihood.

## 3. Register

| ID | Risk | Likelihood | Impact | Priority | Mitigation | Owner |
|---|---|---|---|---|---|---|
| RSK-1 | Product output read as diagnosis/advice → user harm & liability | Medium | Critical | High | Content typing; AI guardrails (`docs/07-AI/105`); clinician-review recommendations; medical disclaimer (`docs/02-Research/28`). | Clinical Informatics |
| RSK-2 | Duplicate/orphaned child profile at delivery transition | Medium | Critical | High | Delivery is sole creator (BR-V2); immutable mother-link; integrity tests (MS-1.7). | Data Architect |
| RSK-3 | Timeline data loss / broken continuity | Low | Critical | High | Append-only + versioning; backups verified pre-release (`docs/12-Operations/151`). | DevOps |
| RSK-4 | Storage lock-in to Google Sheets | Medium | High | High | Enforced API-contract boundary; adapter pattern (`docs/04-Architecture/52`). | Enterprise Architect |
| RSK-5 | Privacy breach / unauthorised access to health data | Low | Critical | High | RBAC; encryption; audit logs; rate limiting; threat model (`docs/09-Security/120`). | Security Architect |
| RSK-6 | Emotional harm from mishandled loss/complication flows | Medium | High | High | Compassionate-design review gate; loss path never forces baby profile (BR-7). | UX Architect |
| RSK-7 | Invented/incorrect medical facts | Medium | Critical | High | Evidence-or-nothing (P6); citations verified vs. sources; assumptions labelled. | Domain Researcher |
| RSK-8 | Scope gravity / v1 bloat delaying continuity | High | Medium | Medium | Phased release gates (`16`); MoSCoW; Non-Goals. | Product |
| RSK-9 | Google Apps Script limits (quotas, latency, concurrency) | Medium | Medium | Medium | Boundary/adapter allows migration; performance tests; caching. | Backend Architect |
| RSK-10 | Accessibility gaps in "calm" aesthetic | Medium | High | High | WCAG 2.2 AA gate; contrast/motion audits (`docs/03-UX/40`). | UX Architect |
| RSK-11 | AI produces prescriptive/emergency output | Medium | Critical | High | Guardrails enforce NG-1..NG-3 technically; adversarial test set (MS-2.1). | AI Systems Architect |
| RSK-12 | Regulatory exposure (GDPR/health-data law) by jurisdiction | Medium | High | High | Privacy-first architecture; jurisdiction decision (OQ); privacy policy (`docs/09-Security/126`). | Security Architect |
| RSK-13 | Report OCR/AI mis-extraction leading to wrong context | Medium | High | High | Human-visible source; educational typing; never auto-act on extracted values. | AI Systems Architect |
| RSK-14 | Multi-caregiver conflicting edits | Medium | Medium | Medium | Versioning + audit; last-write with history; conflict UX. | Data Architect |
| RSK-15 | Knowledge base drifting from current guidelines | Medium | High | High | Independent KB versioning; periodic review vs. sources (`docs/02-Research/27`). | Domain Researcher |

## 4. Risk Governance (business rules)

- BR-1: No release ships with an open High-priority risk lacking an active mitigation.
- BR-2: Any Critical-impact risk requires a named owner and a verification test.
- BR-3: New risks discovered in module/security docs are promoted here if product-level.

## 5. Acceptance Criteria

- [x] All safety-critical risks (diagnosis, duplication, data loss, privacy, emotional harm, invented facts, AI prescriptiveness) captured with mitigation and owner.
- [x] Scoring method defined; Critical impact escalates priority.
- [x] Linked to security threat model and test plan.

## 6. Future Expansion

Extend with operational/SLO risks as the platform runs in production; integrate with an incident register (`docs/09-Security/125-INCIDENT_RESPONSE.md`).

## 7. Dependencies

`docs/09-Security/120-THREAT_MODEL.md`, `docs/10-Testing/130-TEST_PLAN.md`, `docs/07-AI/105-GUARDRAILS.md`, `17-NON_GOALS.md`.

## 8. Open Questions

- OQ-1: First-launch jurisdiction (drives RSK-12 specifics).
- OQ-2: Quantitative SLOs for RSK-9 (Apps Script limits) once load is estimated.

## 9. Risks (meta)

- R-1: Register going stale. Mitigation: reviewed at every release gate (BR-1).
