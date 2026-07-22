# 135 — Security Tests

| Field | Value |
|---|---|
| Document | Security & AI-Safety Testing |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect / Security Architect / AI Systems Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/09-Security/120-THREAT_MODEL.md`, `docs/07-AI/105-GUARDRAILS.md`, `130-TEST_PLAN.md` |

---

## 1. Purpose
Defines the security and AI-safety testing that verifies the threat-model mitigations (`docs/09-Security/120`) and the AI guardrails (`docs/07-AI/105`). These tests protect the two highest-stakes properties: **data safety** and **medical safety**.

## 2. Scope
Auth/session, access control, input/injection, media privacy, audit completeness, and AI-safety adversarial testing. Threat model: `120`; guardrails: `105`.

## 3. Security Test Areas
| Area | Tests |
|---|---|
| Auth | brute-force/rate-limit; no user enumeration; hashed creds; session expiry/revocation; bulk-revoke |
| Access control (RBAC) | least-privilege; caregiver scope; immediate revocation; fail-closed; cross-family isolation |
| Input/injection | sanitisation; **spreadsheet formula-injection** guard; payload caps; malformed input |
| Media privacy | no public links; backend-mediated, authorised, short-lived refs |
| Audit | every health-data access/change audited; audit append-only; no PHI in audit meta |
| Logging | no PHI/secrets in operational logs |
| Secrets | no secrets in client/repo/logs; rotation works |
| Transport | TLS enforced; no plaintext/mixed content |

## 4. AI-Safety (Adversarial) Testing
- Maintain an **adversarial test set**: diagnosis baits, prescription requests, emergency-decision asks, jailbreaks, prompt-injection via report/user text, and ungrounded-fact probes.
- **Release gate (MS-2.1):** **0** diagnostic/prescriptive/emergency-decision outputs; outputs correctly typed + sourced; emergencies curated-only.
- Re-run on every prompt/guardrail/model change (`docs/07-AI/105` §6).

## 5. Process
- Automated security checks in CI where feasible; periodic manual pen-test-style review.
- Adversarial AI set run in CI for AI releases.
- Security + AI-safety are **release exit-gates** (`docs/01-Product/16`).
- Findings triaged by severity; criticals block release + feed incident/threat-model updates (`docs/09-Security/125`, `120`).

## 6. Business Rules
- BR-1 Threat-model mitigations each have a verifying security test.
- BR-2 Formula-injection and no-PHI-in-logs are explicitly tested.
- BR-3 RBAC/isolation + immediate revocation tested; fail-closed verified.
- BR-4 AI adversarial set must show 0 safety violations to ship AI (release gate).
- BR-5 Audit completeness + append-only integrity tested.

## 7. Edge Cases
Subtle implied-diagnosis AI outputs; multilingual jailbreaks (future coverage); provider anomalies; concurrent-caregiver privilege tests; backup-access restrictions; model-update regressions (re-run adversarial set).

## 8. Acceptance Criteria
- [x] Security test areas mapped to threat model.
- [x] Adversarial AI-safety suite with 0-violation release gate.
- [x] Injection/PHI-log/RBAC/audit tests specified; release-gate + incident linkage.

## 9. Future Expansion
Third-party pen-testing, bug bounty, continuous red-teaming, SAST/DAST in CI, secret-scanning, fuzzing.

## 10. Dependencies
`docs/09-Security/120`, `123`–`125`, `docs/07-AI/105`, `130`, `docs/01-Product/16`, `docs/05-Data/73`, `75`.

## 11. Open Questions
- OQ-1 Pen-test cadence/provider.
- OQ-2 CI SAST/DAST tooling (GitLab).

## 12. Risks
- R-1 Unsafe AI output shipping. Mitigation: BR-4 adversarial gate (RSK-11).
- R-2 Untested security holes. Mitigation: BR-1 mitigation-to-test mapping.
