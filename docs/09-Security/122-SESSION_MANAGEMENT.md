# 122 — Session Management

| Field | Value |
|---|---|
| Document | Session Management |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/04-Architecture/57-AUTH_FLOW.md`, `120-THREAT_MODEL.md`, `125-INCIDENT_RESPONSE.md` |

---

## 1. Purpose
Defines session policy: token issuance, lifetime, refresh, storage, and revocation — so that sessions protecting sensitive health data are short-lived, revocable, and resistant to theft.

## 2. Scope
Session tokens and lifecycle. Auth flow: `docs/04-Architecture/57`; encryption of tokens/secrets: `121`, `124`.

## 3. Session Model
- On login, issue a **bearer session token** (opaque or signed) referencing **server-side session state** (enables revocation).
- Token sent on every API request; validated + authorised per family/role (`123`).
- **Access + refresh:** short-lived access; refresh/renewal within an **absolute session lifetime**; re-auth after absolute expiry.

## 4. Lifetimes (proposed)
| Parameter | Proposed | Notes |
|---|---|---|
| Access token TTL | short (e.g., minutes–hours) | limits theft window |
| Absolute session lifetime | bounded (e.g., days) | re-auth required after |
| Idle timeout | present | logout after inactivity |
Final values set with security review; must balance safety and the tired-parent UX (avoid frequent forced logouts mid-task).

## 5. Storage (client)
- Store tokens securely (avoid XSS-exposable storage where possible); mitigate XSS/CSRF per platform best practice.
- No secrets in client; token is a bearer credential, protected accordingly.

## 6. Revocation
- Server-side session state allows **immediate revocation** (logout, admin, compromise).
- **Bulk revoke** on compromise (`125`).
- Caregiver access revocation is immediate and independent (`123`, `docs/06-Modules/96`).

## 7. Anti-Theft / Anti-Abuse
- Rate limiting + lockout/backoff on auth (`120`).
- Anomaly monitoring (unusual access) → alert/incident (`docs/04-Architecture/64`, `125`).
- Short TTLs + revocation limit stolen-token value.

## 8. Business Rules
- BR-1 Sessions are server-side and immediately revocable.
- BR-2 Short access TTL + bounded absolute lifetime; idle timeout.
- BR-3 Tokens protected client-side; no secrets in client.
- BR-4 Compromise → bulk revoke; auth events audited (no PHI).
- BR-5 Session policy balances safety with not disrupting active care tasks.

## 9. Edge Cases
Long-running logging session (avoid mid-task logout via refresh); multiple devices (independent, individually revocable); token theft (short TTL + revoke + monitor); offline (future: secure cached token, re-auth on expiry); forgotten credential (secure reset, rate-limited, no enumeration).

## 10. Acceptance Criteria
- [x] Server-side, revocable sessions with short access TTL + absolute lifetime + idle timeout.
- [x] Secure client storage; bulk revocation on compromise.
- [x] Anti-theft controls; UX-balanced.

## 11. Future Expansion
MFA, device management UI, step-up auth for sensitive actions, biometric unlock (PWA), refresh-token rotation.

## 12. Dependencies
`docs/04-Architecture/57`, `121`, `124`, `120`, `125`, `docs/04-Architecture/64`, `docs/06-Modules/96`.

## 13. Open Questions
- OQ-1 Exact TTL/absolute/idle values.
- OQ-2 Client token storage mechanism.

## 14. Risks
- R-1 Session hijack. Mitigation: BR-1/BR-2 short-lived + revocable + monitoring.
- R-2 Forced logout mid-care harming UX. Mitigation: BR-5 balanced policy.
