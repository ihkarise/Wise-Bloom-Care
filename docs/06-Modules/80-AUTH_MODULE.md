# 80 — Authentication Module

| Field | Value |
|---|---|
| Document | Auth Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/04-Architecture/57-AUTH_FLOW.md`, `docs/09-Security/122-SESSION_MANAGEMENT.md`, `123-ACCESS_CONTROL.md`, `96-FAMILY_MODULE.md` |

---

## 1. Purpose
Provides identity, authentication, session management, and role-based access for Wise Bloom Care. It is the gate protecting all sensitive health data and the owner of Users, Sessions, and Roles.

## 2. Goals
- Secure registration/login/logout; revocable sessions; RBAC (account holder, caregiver, future clinician).
- Privacy-first, fail-closed, audited auth (`docs/04-Architecture/57`).

## 3. Scope
Owns: `users`, `sessions`, role assignment. In scope: register, login, logout, session refresh/revocation, password reset, RBAC checks. Out of scope: caregiver *grant* UX (owned by Family module `96`, but uses this module's roles); MFA (future).

## 4. Functional Requirements
- FR-1 Register with email + credential; hash credential; acknowledge disclaimer; create family + maternal scaffold.
- FR-2 Login with rate limiting and generic errors (no enumeration).
- FR-3 Issue/validate bearer session tokens; refresh within absolute lifetime.
- FR-4 Logout + server-side revocation; bulk-revoke on compromise.
- FR-5 Secure password reset (rate-limited, no enumeration).
- FR-6 Enforce RBAC per family resource on every request.
- FR-7 Audit auth events (no PHI).

## 5. Non-Functional Requirements
Fail closed; no secrets/PHI in tokens or logs; hashing per `docs/09-Security/121`; sessions per `122`.

## 6. Architecture
AuthService + SessionService in the application layer (`docs/04-Architecture/52`); tokens validated at controllers; RBAC via `123`. Secrets in Script Properties (`124`).

## 7. User Flow
Register → disclaimer → session; Login → session; each request → authorise; Logout/revoke. Detail: `docs/04-Architecture/57`.

## 8. Data Model
`users(user_id, email_hash, credential_hash, role, status)`, `sessions(session_id, user_id, issued, expires)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Credentials stored as salted hashes only.
- BR-2 Every API request authenticated; unauthenticated rejected.
- BR-3 Sessions expirable + server-side revocable.
- BR-4 Auth events audited without PHI; errors avoid enumeration.
- BR-5 RBAC enforced per family resource (least privilege).

## 10. Edge Cases
Brute force (rate limit/lockout); token theft (short life + revoke); multi-device sessions; forgotten credential (secure reset); offline re-auth (future).

## 11. Acceptance Criteria
- [x] Register/login/logout/refresh/reset + RBAC specified.
- [x] Hashing, revocation, audit, anti-enumeration enforced.
- [x] Fail-closed and no-secrets/PHI rules stated.

## 12. Future Expansion
MFA/2FA, passwordless/OAuth, device management, clinician auth, biometric unlock (PWA).

## 13. Dependencies
`docs/04-Architecture/57`, `docs/09-Security/121`–`125`, `96`.

## 14. Open Questions
- OQ-1 Primary auth method for v1 (ADR-004).
- OQ-2 MFA in v1 or v2.

## 15. Risks
- R-1 Credential compromise → hashing, rate limiting, revocation, future MFA.
- R-2 Session hijack → short-lived tokens + revocation + monitoring.
