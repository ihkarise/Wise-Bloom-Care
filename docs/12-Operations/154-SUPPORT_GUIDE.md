# 154 — Support Guide

| Field | Value |
|---|---|
| Document | Support Guide |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Product / DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `150-RUNBOOK.md`, `docs/09-Security/125-INCIDENT_RESPONSE.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `docs/09-Security/126-PRIVACY_POLICY.md` |

---

## 1. Purpose
Defines how user support is handled — the boundaries (support is not medical advice), the categories of requests, escalation paths, and the compassionate, privacy-respecting posture required in this sensitive domain.

## 2. Scope
User-facing support process, boundaries, and escalation. Operational incidents: `150`; security/privacy incidents: `docs/09-Security/125`.

## 3. Support Boundaries (critical)
- Support helps with **the product** (accounts, features, data, bugs) — **never medical advice, diagnosis, or triage** (NG-1..NG-3, `docs/02-Research/28`).
- Medical questions are redirected to the user's clinician; in emergencies, users are directed to local emergency services.
- Support never asks for passwords; verifies identity per policy.

## 4. Request Categories & Handling
| Category | Handling |
|---|---|
| Account/login | Guided reset (secure, no enumeration); never share/reset without verification |
| Feature how-to | Educational product help; link in-app guidance |
| Bug report | Reproduce (synthetic data); route to engineering; track |
| Data request (export/erasure) | Follow privacy/retention (`docs/05-Data/74`, `76`, `docs/09-Security/126`); verify identity |
| Privacy/security concern | Escalate to security (`docs/09-Security/125`) |
| Medical question | **Redirect to clinician**; do not advise |
| Emotional/loss-related | Compassionate response; signpost support resources (educational); never dismissive |

## 5. Escalation
- Bugs → engineering (severity-tagged).
- Security/privacy → Security owner + incident response (`docs/09-Security/125`).
- Data-integrity/continuity reports (e.g., "my baby profile duplicated") → treat as high priority → runbook (`150` §4).
- Legal/regulatory → legal.

## 6. Privacy & Tone
- Handle all data per privacy policy; minimal data in support tickets; no PHI in insecure channels.
- Warm, calm, respectful tone (brand voice); extra compassion for sensitive/loss situations.

## 7. Business Rules
- BR-1 Support never gives medical advice/diagnosis/triage; redirects to clinician/emergency services.
- BR-2 Support never requests passwords; verifies identity per policy.
- BR-3 Data export/erasure follow privacy/retention policy.
- BR-4 Security/privacy and continuity-integrity reports are escalated appropriately.
- BR-5 Support respects privacy (minimal PHI; secure channels) and brand tone (compassion).

## 8. Edge Cases
User reports a data-integrity/continuity issue (high priority); user in distress (compassion + resources, not counselling); suspected account compromise (security escalation + session revocation); erasure vs. shared-record boundaries (`docs/05-Data/74`).

## 9. Acceptance Criteria
- [x] Support boundaries (no medical advice) + categories/handling defined.
- [x] Escalation paths incl. continuity/security.
- [x] Privacy + compassionate-tone rules.

## 10. Future Expansion
Help center/knowledge base for users, in-app support, SLAs, multilingual support, community resources directory, clinician support (portal).

## 11. Dependencies
`150`, `docs/09-Security/125`, `126`, `docs/02-Research/28`, `docs/05-Data/74`, `76`, `docs/04-Architecture/57`.

## 12. Open Questions
- OQ-1 Support channels/tooling for v1.
- OQ-2 Support hours/SLA.

## 13. Risks
- R-1 Support giving medical advice. Mitigation: BR-1 boundary + training.
- R-2 Privacy mishandling in support. Mitigation: BR-2/BR-5 verification + minimal PHI.
