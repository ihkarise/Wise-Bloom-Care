# ADR-004 — Authentication Approach for v1

| Field | Value |
|---|---|
| Status | Proposed (pending final method choice) |
| Date | 2026-07-22 |
| Deciders | Security Architect, Enterprise Architect |
| Related | `docs/04-Architecture/57-AUTH_FLOW.md`, `docs/09-Security/122-SESSION_MANAGEMENT.md`, `123-ACCESS_CONTROL.md` |

---

## 1. Context
The product protects highly-sensitive health data and needs secure, privacy-first authentication with revocable sessions and RBAC, implementable on the GAS/Sheets stack (ADR-001/002), with a path to MFA and OAuth later.

## 2. Decision
Adopt **email + password** authentication for v1 with:
- Salted, strong-KDF password hashing (never plaintext) (`docs/09-Security/121`).
- Server-side, revocable sessions with short access TTL + bounded absolute lifetime + idle timeout (`docs/09-Security/122`).
- Per-family RBAC, fail-closed authorisation on every request (`docs/09-Security/123`).
- Rate limiting + anti-enumeration; auth events audited (no PHI).
- **MFA planned** for a later release.

> Open: final method may shift to include passwordless/OAuth; this ADR records the v1 baseline and will be updated if the method changes (OQ-1).

## 3. Rationale
- Email+password is universally understood, implementable on GAS, and privacy-controllable.
- Server-side sessions give immediate revocation (critical for sensitive data).
- Keeps the door open to MFA/OAuth without redesign.

## 4. Consequences
### Positive
- Simple, well-understood, revocable, RBAC-ready.
### Negative / Risks
- Passwords are a phishing/breach vector → hashing, rate limiting, revocation, future MFA (RSK-5).
- Session/token handling must be careful on GAS (secrets in Script Properties, `docs/09-Security/124`).

## 5. Alternatives Considered
- **OAuth (Google, etc.):** fewer passwords, but adds provider coupling/consent complexity; candidate for later.
- **Passwordless (magic link/OTP):** good UX/security but delivery infra needed; revisit.
- **MFA at v1:** stronger but adds friction/infra; deferred but planned.

## 6. Compliance & Safety Notes
- No PHI in tokens/logs; fail closed; caregiver access explicit/revocable (`docs/06-Modules/96`).
- Consent/disclaimer at onboarding (`docs/02-Research/28`).

## 7. Review Trigger
Finalise method before v1 auth implementation; revisit for MFA/OAuth/passwordless and for the clinician portal (V3).
