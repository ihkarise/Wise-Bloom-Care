# 57 — Authentication Flow

| Field | Value |
|---|---|
| Document | Authentication & Session Flow |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `56-API_SPEC.md`, `58-SECURITY_MODEL.md`, `docs/09-Security/122-SESSION_MANAGEMENT.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/ADR/ADR-004-Authentication.md` |

---

## 1. Purpose

Defines how users authenticate and how sessions are established, maintained, and revoked. Because the data is highly sensitive (health, pregnancy, child), authentication is a security-critical flow with privacy-first defaults.

## 2. Scope

Registration, login, session tokens, refresh, logout, and revocation at the architecture level. Detailed session policy: `docs/09-Security/122`; RBAC: `123`; decision rationale: `docs/ADR/ADR-004-Authentication.md`.

## 3. Principles

- Privacy-first; least privilege; fail closed.
- No PHI in tokens/logs.
- Sessions expirable and revocable; caregiver access explicit and revocable.
- Defense in depth: validation, rate limiting, audit on auth events.

## 4. Registration Flow

1. Client → `POST /v1/auth/register` (email + credential).
2. Backend: validate/sanitise; rate-limit; check uniqueness; store user with **hashed** credential (never plaintext) and **hashed/tokenised email** where feasible (`docs/09-Security/121`).
3. Require medical-disclaimer acknowledgement (`docs/02-Research/28`).
4. Create the family record + maternal record scaffold.
5. Issue a session (§6). Audit the registration event (non-PHI).

## 5. Login Flow

1. Client → `POST /v1/auth/login`.
2. Backend: rate-limit; verify credential against hash; on success issue session token; on failure return generic error (no user enumeration).
3. Audit login (success/failure counts; no sensitive detail).

## 6. Sessions & Tokens

- On success, issue a **bearer session token** (opaque or signed) with expiry; store server-side session state (`sessions`) enabling revocation.
- Token sent on every API request (`56`); backend validates + authorises per family/role (`123`).
- **Refresh:** short-lived access with refresh/renewal within an absolute session lifetime (`docs/09-Security/122`).
- Secrets (signing keys) in Script Properties (`docs/09-Security/124`); rotated per policy.

## 7. Logout & Revocation

- `POST /v1/auth/logout` invalidates the server-side session immediately.
- Admin/self revocation supported; revoking caregiver access is immediate (`docs/06-Modules/96`), audited.
- Compromise response: bulk-revoke sessions (`docs/09-Security/125`).

## 8. Roles & Access (summary)

- Roles: **account holder** (mother/owner), **caregiver** (granted, scoped), **clinician** (future). RBAC detail: `123`.
- Authorisation is per-family-resource; caregivers see only granted scope.

## 9. Business Rules

- BR-1: Credentials stored only as salted hashes; never plaintext/reversible.
- BR-2: Every API request is authenticated; unauthenticated = rejected (fail closed).
- BR-3: Sessions are expirable and server-side revocable.
- BR-4: Auth events are audited without PHI; errors avoid user enumeration.
- BR-5: Caregiver access is explicit, scoped, revocable, and audited.

## 10. Edge Cases

- Brute-force/credential stuffing → rate limiting + lockout/backoff (`docs/09-Security/120`).
- Token theft → short lifetimes + revocation + anomaly monitoring.
- Concurrent sessions/devices → allowed but individually revocable.
- Forgotten credential → secure reset flow (rate-limited, no enumeration) — detail in `122`.
- Offline (future) → tokens cached securely; re-auth on expiry when back online.

## 11. Acceptance Criteria

- [x] Registration/login/session/logout/revocation flows defined.
- [x] Hashed credentials, server-side revocable sessions, refresh model specified.
- [x] Roles/RBAC summarised; caregiver access explicit/revocable.
- [x] Auth-event auditing and anti-enumeration stated.

## 12. Future Expansion

MFA/2FA; passwordless/OAuth options; device management UI; clinician-portal auth; biometric unlock on PWA.

## 13. Dependencies

`56`, `58`, `docs/09-Security/121`, `122`, `123`, `124`, `125`, `docs/ADR/ADR-004-Authentication.md`.

## 14. Open Questions

- OQ-1: Primary auth method for v1 (email+password vs. OAuth/passwordless) — see ADR-004.
- OQ-2: MFA in v1 or v2.

## 15. Risks

- R-1: Credential compromise. Mitigation: hashing (BR-1), rate limiting, revocation, future MFA.
- R-2: Session hijack. Mitigation: short-lived tokens + revocation + monitoring.
