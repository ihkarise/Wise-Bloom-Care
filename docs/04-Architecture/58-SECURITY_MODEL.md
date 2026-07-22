# 58 — Security Model (Architecture)

| Field | Value |
|---|---|
| Document | Security Model |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `57-AUTH_FLOW.md`, `docs/09-Security/*`, `docs/05-Data/75-AUDIT_LOGS.md` |

---

## 1. Purpose

Provides the architectural security model — how confidentiality, integrity, and availability of sensitive maternal-child health data are achieved across layers. It is the architecture-level companion to the detailed security documents in `docs/09-Security/*`.

## 2. Scope

Cross-layer security controls (identity, access, data protection, validation, rate limiting, audit, secrets). Threat modelling: `docs/09-Security/120`; encryption: `121`; sessions: `122`; access control: `123`; secrets: `124`; incident response: `125`.

## 3. Security Principles

- Privacy-first; least privilege; defense in depth; fail closed; auditable; no data monetisation (NG-9).
- Data minimisation: collect/expose only what's needed; no PHI in logs/tokens/errors.
- GDPR/HIPAA-friendly posture (not a compliance claim; `docs/09-Security/126`).

## 4. Trust Boundaries

```
Untrusted: public internet, client device
   │ (HTTPS + auth token)
Semi-trusted: client app (no secrets, no business rules of record)
   │ (API contract)
Trusted: backend application layer (auth, RBAC, validation, audit)
   │ (storage adapter; least-privilege)
Sensitive: private Sheets + private Drive (health data, media)
```

## 5. Controls by Concern

| Concern | Control | Doc |
|---|---|---|
| Identity | Hashed credentials; secure sessions; future MFA | `57`, `122` |
| Authorisation | Per-family RBAC; caregiver scopes; fail closed | `123` |
| Data at rest | Provider encryption (Google); sensitive-field hashing/tokenisation | `121` |
| Data in transit | HTTPS/TLS everywhere | `121` |
| Input | Validation/sanitisation on all writes | `docs/05-Data/73` |
| Abuse | Rate limiting; lockout/backoff | `120` |
| Secrets | Script Properties; rotation; no secrets in code | `124` |
| Audit | Append-only audit log of health-data access | `docs/05-Data/75` |
| Media | Private Drive; backend-mediated, short-lived refs | `54`, `123` |
| Availability | Backups; rollback; DR | `62`, `docs/12-Operations/*` |

## 6. Data Classification

- **Highly sensitive (PHI-like):** pregnancy/child health data, reports, media → strongest controls, always audited.
- **Sensitive:** identity/contact → hashed/tokenised where feasible.
- **Reference:** knowledge base, schedules → integrity-protected, not secret.
- Classification drives logging (never log highly-sensitive), access, and retention (`docs/05-Data/74`).

## 7. Application-Layer Enforcement

Security invariants (auth, RBAC, validation, audit, content typing) are enforced server-side in services (`52`), not in the client. The client holds no secrets and no authoritative rules.

## 8. Business Rules

- BR-1: All health-data access is authenticated, authorised, and audited.
- BR-2: No secrets in client or source; only Script Properties.
- BR-3: No PHI in logs, tokens, or error messages.
- BR-4: Fail closed on auth/authorisation.
- BR-5: Media is never publicly linkable; always backend-mediated.

## 9. Edge Cases

- Compromised session/device → revoke sessions; audit; notify per incident response (`125`).
- Insider/manual Sheets access → restricted access + audit; least privilege on the spreadsheet/Drive.
- Data-subject requests (access/erasure) → handled per privacy policy/retention (`126`, `docs/05-Data/74`).

## 10. Acceptance Criteria

- [x] Trust boundaries and layer controls defined.
- [x] Data classification drives controls/logging/retention.
- [x] Server-side enforcement and no-secrets-in-client stated.
- [x] Mapped to detailed `docs/09-Security/*`.

## 11. Future Expansion

MFA, field-level encryption, key management service on migration, formal compliance (HIPAA/GDPR) programs, pen-testing cadence, bug bounty.

## 12. Dependencies

`57`, `docs/09-Security/120`–`126`, `docs/05-Data/73`–`75`, `62`.

## 13. Open Questions

- OQ-1: First-launch jurisdiction → applicable regime (GDPR/other).
- OQ-2: Field-level encryption in v1 vs. later.

## 14. Risks

- R-1: Sensitive data exposure. Mitigation: classification + controls (§5/§6).
- R-2: Over-broad access. Mitigation: least privilege + RBAC + audit.
