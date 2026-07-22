# 121 — Encryption

| Field | Value |
|---|---|
| Document | Encryption & Data Protection |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `120-THREAT_MODEL.md`, `124-SECRET_MANAGEMENT.md`, `docs/04-Architecture/58-SECURITY_MODEL.md` |

---

## 1. Purpose
Defines how data is protected cryptographically — in transit and at rest — and how sensitive identity data (credentials, email) is hashed/tokenised. Encryption is a core control for confidentiality of highly-sensitive health data.

## 2. Scope
Transit encryption, at-rest encryption, credential/email protection, and forward plans for field-level encryption and key management.

## 3. Data In Transit
- **HTTPS/TLS everywhere** — client ↔ API, API ↔ providers; no plaintext HTTP (`docs/04-Architecture/61` BR-4).
- HSTS recommended; no mixed content; modern TLS.

## 4. Data At Rest
- v1 storage (Google Sheets/Drive) benefits from Google's at-rest encryption for stored data.
- Backups are encrypted at rest (provider) and access-restricted (`docs/04-Architecture/62`).
- **Future field-level encryption** for the most sensitive fields is planned (esp. on migration to a database) — see §7.

## 5. Credential & Identity Protection
- **Passwords:** stored only as **salted hashes** using a strong, slow KDF (e.g., bcrypt/scrypt/Argon2-class); never plaintext/reversible (`docs/04-Architecture/57` BR-1).
- **Email:** hashed/tokenised where feasible to reduce exposure while preserving needed lookups (decision in `docs/05-Data/72` OQ-2).
- **Tokens:** session tokens are opaque or signed with a secret; secrets managed per `124`.

## 6. Key & Secret Management
- Signing/API secrets in Script Properties (v1), rotated per policy (`124`); never in code/client.
- On migration, adopt a managed key/secret service (KMS/secret manager).

## 7. Future Field-Level Encryption
- Plan to encrypt the most sensitive fields at the application layer (envelope encryption with a KMS) so that even storage-layer access does not reveal plaintext PHI.
- Deferred for v1 (Sheets constraints) but the data model/adapter must not preclude it.

## 8. Business Rules
- BR-1 All data in transit uses TLS; no plaintext.
- BR-2 Credentials stored only as strong salted hashes.
- BR-3 Secrets/keys never in code/client; managed per `124`; rotated.
- BR-4 Backups encrypted at rest and access-restricted.
- BR-5 Design must not preclude future field-level encryption.

## 9. Edge Cases
Legacy/old device TLS; provider that requires plaintext (disallowed); key rotation without downtime; crypto-agility (algorithm upgrades) — plan for replaceable algorithms.

## 10. Acceptance Criteria
- [x] Transit (TLS) + at-rest encryption specified.
- [x] Strong salted-hash credentials; email protection noted.
- [x] Secret/key handling + future field-level encryption planned.

## 11. Future Expansion
Field-level/envelope encryption with KMS on migration; end-to-end considerations; hardware-backed keys; crypto-agility policy.

## 12. Dependencies
`120`, `124`, `docs/04-Architecture/57`, `58`, `62`, `docs/05-Data/72`.

## 13. Open Questions
- OQ-1 Email protection method (hash/tokenise/encrypt).
- OQ-2 KDF choice and parameters.
- OQ-3 Field-level encryption timing (v2/v3 on migration).

## 14. Risks
- R-1 PHI exposure at rest. Mitigation: provider encryption now, field-level later (BR-5).
- R-2 Credential compromise. Mitigation: BR-2 strong hashing.
