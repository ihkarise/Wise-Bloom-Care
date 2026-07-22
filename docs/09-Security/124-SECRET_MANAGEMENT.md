# 124 — Secret Management

| Field | Value |
|---|---|
| Document | Secret Management |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect / DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `121-ENCRYPTION.md`, `docs/04-Architecture/53-GOOGLE_APPS_SCRIPT.md`, `docs/04-Architecture/60-DEPLOYMENT.md` |

---

## 1. Purpose
Defines how secrets (API keys, token-signing keys, provider credentials) are stored, accessed, rotated, and kept out of source control and the client. Leaked secrets are a direct path to data compromise.

## 2. Scope
Secret storage and lifecycle for v1 (GAS/Sheets) and forward plans.

## 3. Where Secrets Live
- **v1:** Google Apps Script **Script Properties**, per environment (dev/staging/prod) (`docs/04-Architecture/53`).
- **Never** in source control, the client bundle, logs, or error messages.
- On migration: a dedicated secret manager / KMS.

## 4. Types of Secrets
- Token-signing keys (session tokens).
- AI/OCR/voice provider API keys.
- Any integration credentials.
- (Not user credentials — those are hashed, `121`, and not "secrets" to retrieve.)

## 5. Access & Least Privilege
- Only the backend (application layer) accesses secrets, at runtime, from the environment store.
- Least-privilege on the GAS project/Sheets/Drive; restrict who can view Script Properties.
- No secret is ever sent to the client.

## 6. Rotation
- Secrets are rotatable; rotation procedure documented (deploy new secret, roll over, revoke old).
- Signing-key rotation supports overlap (validate old + new during rollover) to avoid mass logout.
- Rotate on suspected compromise (`125`) and on a periodic schedule.

## 7. Handling Rules
- Secrets injected via environment/Script Properties, referenced by name in code — never hard-coded.
- CI/CD does not print secrets; masked in logs.
- Secret access is limited and, where feasible, audited.

## 8. Business Rules
- BR-1 Secrets stored only in the environment secret store (Script Properties v1); never in code/client/logs.
- BR-2 Per-environment secrets; prod secrets isolated (`docs/04-Architecture/60` BR-1).
- BR-3 Secrets are rotatable; rotation documented; rotate on compromise + schedule.
- BR-4 Only the backend accesses secrets at runtime; least privilege on who can view them.
- BR-5 CI/CD masks secrets; no secret printed.

## 9. Edge Cases
Signing-key rotation without mass logout (overlap window, `122`); provider key leak (rotate + revoke + incident); shared spreadsheet access (restrict Script Property viewers); accidental commit of a secret (rotate immediately; scrub history).

## 10. Acceptance Criteria
- [x] Secret storage (Script Properties, per env), access, and rotation defined.
- [x] No secrets in code/client/logs; CI masking.
- [x] Compromise + scheduled rotation procedures.

## 11. Future Expansion
Managed secret manager/KMS on migration; automated rotation; short-lived credentials; hardware-backed signing keys; secret-scanning in CI.

## 12. Dependencies
`121`, `122`, `125`, `docs/04-Architecture/53`, `60`.

## 13. Open Questions
- OQ-1 Rotation cadence.
- OQ-2 Secret-scanning tooling in CI (GitLab).

## 14. Risks
- R-1 Secret leak → compromise. Mitigation: BR-1/BR-5 storage + masking + rotation.
- R-2 Mass logout on key rotation. Mitigation: overlap window (§9).
