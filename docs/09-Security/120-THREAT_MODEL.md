# 120 — Threat Model

| Field | Value |
|---|---|
| Document | Threat Model |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/04-Architecture/58-SECURITY_MODEL.md`, `121`–`125`, `docs/01-Product/18-RISK_REGISTER.md` |

---

## 1. Purpose
Identifies the assets, threat actors, attack surfaces, and threats to Wise Bloom Care, with mitigations, using a STRIDE-style analysis. It drives the security controls in `121`–`125` and the security tests (`docs/10-Testing/135`).

## 2. Scope
Application, API, storage (Sheets/Drive), auth, and AI surfaces for v1, with forward notes. Detailed controls live in sibling docs.

## 3. Assets (what we protect)
- Highly-sensitive health data (maternal/child records, reports, media).
- Identity/credentials and sessions.
- Audit logs and backups.
- Knowledge-base integrity (correct medical content).
- Secrets (API keys, signing keys).

## 4. Threat Actors
- External attackers (credential stuffing, scraping, injection).
- Malicious/compromised caregivers or account takeover.
- Insider/manual access to Sheets/Drive.
- Malicious content (prompt injection via reports/inputs) targeting AI.
- Third-party provider compromise (AI/OCR).

## 5. STRIDE Analysis (summary)
| Threat | Example | Mitigation |
|---|---|---|
| **Spoofing** | Credential stuffing, session hijack | Hashed creds, rate limiting, short-lived revocable sessions, future MFA (`122`, `057`) |
| **Tampering** | Altering records/audit; formula injection into Sheets | Append-only + versioning; adapter-enforced integrity; input sanitisation incl. formula-injection guard (`docs/05-Data/73`, `77`) |
| **Repudiation** | Denying an action | Append-only audit log of health-data access (`docs/05-Data/75`) |
| **Information disclosure** | Exposed media/PHI, PHI in logs | Private Drive + backend-mediated refs; no PHI in logs/tokens/errors; encryption in transit/at rest (`121`, `063`) |
| **Denial of service** | Abuse/quota exhaustion | Rate limiting; backoff; GAS quota mitigation + migration path (`053`) |
| **Elevation of privilege** | Caregiver exceeding scope | RBAC least-privilege; fail closed; immediate revocation (`123`) |

## 6. Attack Surfaces
- API endpoints (auth, validation, rate limiting).
- Client (no secrets; not the security boundary).
- Sheets/Drive (restricted access; adapter-only writes; audit).
- AI (prompt injection; provider data handling) — guardrails (`docs/07-AI/105`).
- Backups (as sensitive as prod; restricted).

## 7. Key Threats & Mitigations (prioritised)
- T1 Account takeover → hashing, rate limiting, revocation, MFA (future); anomaly monitoring.
- T2 PHI disclosure via media/logs → private media, no-PHI logging, encryption, audit.
- T3 Data tampering / formula injection → sanitisation, append-only, adapter integrity.
- T4 Over-broad caregiver access → RBAC, least privilege, immediate revoke, audit.
- T5 AI prompt injection / unsafe output → input pre-check, guardrails, curated emergencies.
- T6 Insider Sheets access → least privilege, restricted sharing, audit.
- T7 Provider compromise (AI/OCR) → minimise PHI sent, DPA, consent.

## 8. Business Rules
- BR-1 Every threat has a named mitigation and (where testable) a security test (`docs/10-Testing/135`).
- BR-2 Fail closed on auth/authorisation.
- BR-3 No PHI in logs/tokens/errors; media never public.
- BR-4 The threat model is reviewed each release and on architecture change.

## 9. Edge Cases
Multi-caregiver abuse; compromised device; backup exposure; AI jailbreak; jurisdiction-specific legal threats (`126`).

## 10. Acceptance Criteria
- [x] Assets, actors, surfaces, STRIDE threats, and mitigations enumerated.
- [x] Prioritised key threats mapped to controls/tests.
- [x] Review cadence defined.

## 11. Future Expansion
Formal pen-testing, bug bounty, SIEM/anomaly detection, MFA, field-level encryption, third-party audits.

## 12. Dependencies
`docs/04-Architecture/58`, `121`–`125`, `docs/05-Data/73`, `75`, `77`, `docs/07-AI/105`, `docs/10-Testing/135`.

## 13. Open Questions
- OQ-1 Launch-jurisdiction legal threat specifics.
- OQ-2 Pen-test cadence/provider.

## 14. Risks
Tracked in `docs/01-Product/18-RISK_REGISTER.md` (RSK-5, RSK-11, RSK-12 esp.).
