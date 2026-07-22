# 96 — Family Module (Caregivers)

| Field | Value |
|---|---|
| Document | Family/Caregiver Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect / UX Architect |
| Last Updated | 2026-07-22 |
| Related | `80-AUTH_MODULE.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/05-Data/75-AUDIT_LOGS.md` |

---

## 1. Purpose
Enables the account holder to share their family record with caregivers (e.g., a partner) via explicit, scoped, revocable access, and provides a shared family dashboard. Sharing is opt-in and privacy-first.

## 2. Goals
Let caregivers stay informed and help, without compromising the account holder's control or privacy; explicit, auditable, revocable access.

## 3. Scope
Owns: `caregiver_access` grants + the caregiver-scoped experience. Uses: Auth roles (`80`), RBAC (`123`). Out: caregivers creating/erasing the record (only the account holder can).

## 4. Functional Requirements
- FR-1 Account holder invites/grants a caregiver with a defined scope.
- FR-2 Caregiver accesses a scoped family dashboard (glanceable status + next things).
- FR-3 Account holder revokes access immediately at any time.
- FR-4 All grants/revocations/accesses are audited (`docs/05-Data/75`).
- FR-5 Scope controls what a caregiver can see/do (least privilege).

## 5. Non-Functional Requirements
Privacy-first (opt-in, off by default); RBAC-enforced; audited; accessible.

## 6. Architecture
FamilyService manages grants; RBAC checks at every request (`docs/09-Security/123`); caregiver views are scoped reads; AuditService logs access.

## 7. User Flow
Account holder → invite caregiver → set scope → caregiver joins → scoped dashboard; account holder can revoke anytime (`docs/03-UX/31` J7).

## 8. Data Model
`caregiver_access(grant_id, family_id, user_id, scope, granted_by, revoked_at)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Sharing is off by default; access is explicit, scoped, and revocable.
- BR-2 Only the account holder can grant/revoke; caregivers cannot re-share, erase, or delete the record.
- BR-3 Every grant/revoke/access is audited.
- BR-4 Least-privilege scope enforced by RBAC on every request.
- BR-5 Revocation takes effect immediately (subsequent requests forbidden).

## 10. Edge Cases
Revoked mid-session (immediate forbid); multiple caregivers (independent grants/scopes); caregiver on multiple families; sensitive items (journal) respect scope; disputed access (account holder authority prevails).

## 11. Acceptance Criteria
- [x] Explicit, scoped, revocable caregiver access + shared dashboard.
- [x] Only account holder grants/revokes; least privilege; audited.
- [x] Immediate revocation.

## 12. Future Expansion
Granular per-module scopes; time-limited access; caregiver roles (view vs. contribute); clinician access (portal); emergency/next-of-kin access flows.

## 13. Dependencies
`80`, `docs/09-Security/123`, `docs/05-Data/75`, `docs/03-UX/31`.

## 14. Open Questions
- OQ-1 Caregiver sharing in v1 or v2 (PRD OQ-2).
- OQ-2 Scope granularity for v1 (all-or-scoped).

## 15. Risks
- R-1 Over-broad/unrevoked access. Mitigation: BR-1/BR-4/BR-5 least-privilege + immediate revoke.
- R-2 Caregiver altering control. Mitigation: BR-2 account-holder authority.
