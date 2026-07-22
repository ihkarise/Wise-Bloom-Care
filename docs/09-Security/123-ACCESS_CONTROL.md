# 123 — Access Control (RBAC)

| Field | Value |
|---|---|
| Document | Access Control |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/06-Modules/96-FAMILY_MODULE.md`, `docs/04-Architecture/57-AUTH_FLOW.md`, `docs/05-Data/75-AUDIT_LOGS.md` |

---

## 1. Purpose
Defines role-based access control: the roles, their permissions, and the least-privilege, fail-closed enforcement that ensures each user can access only the family data they are authorised for. Critical for protecting highly-sensitive health data and caregiver sharing.

## 2. Scope
Roles, permissions, scoping to a family, and enforcement points. Caregiver grant UX: `docs/06-Modules/96`; auth: `docs/04-Architecture/57`.

## 3. Roles
| Role | Description | Scope |
|---|---|---|
| **Account holder** | The mother/owner of the family record | Full control of own family record |
| **Caregiver** | Granted, scoped access (e.g., partner) | Only granted scope of one family |
| **Clinician** (future) | Portal user | Read + structured contribution, per grant |
| **System** | Automated processes | Least privilege; audited |

## 4. Permission Model
- Permissions are scoped to a **family** and (optionally) sub-scoped (e.g., exclude journal).
- **Account holder:** create/read/update (versioned) all own-family data; grant/revoke caregivers; export; request erasure.
- **Caregiver:** read (and optionally limited contribute) within granted scope; cannot grant/revoke, erase, or delete the record.
- **Least privilege:** default deny; grant only what's needed; explicit scopes.

## 5. Enforcement
- **Every API request** is authenticated (`docs/04-Architecture/57`) and authorised against the family/role/scope before any data access (fail closed).
- Authorisation is server-side (application layer), never trusted from the client.
- Media access is authorised + backend-mediated (`docs/04-Architecture/54`).
- All access/authorisation decisions on health data are audited (`docs/05-Data/75`).

## 6. Caregiver Sharing
- Explicit, scoped, revocable grants (`docs/06-Modules/96`); revocation immediate; every grant/revoke/access audited.
- Caregivers cannot escalate privilege or re-share.

## 7. Business Rules
- BR-1 Default deny; least privilege; explicit scopes.
- BR-2 Every request authorised server-side against family/role/scope; fail closed.
- BR-3 Only account holders grant/revoke, erase, or delete; caregivers cannot.
- BR-4 Revocation is immediate; subsequent requests forbidden.
- BR-5 Access-control decisions on health data are audited.

## 8. Edge Cases
Revoked mid-session (immediate forbid); caregiver on multiple families (scoped per family); sensitive sub-scopes (journal) respected; clinician role (future) strictly scoped; disputed access (account-holder authority prevails); system actions (least privilege + audited).

## 9. Acceptance Criteria
- [x] Roles + least-privilege permission model defined.
- [x] Server-side, fail-closed enforcement on every request; audited.
- [x] Caregiver grant/revoke rules; immediate revocation.

## 10. Future Expansion
Granular per-module/time-limited scopes; clinician portal RBAC; delegation/next-of-kin; attribute-based access; break-glass emergency access (audited).

## 11. Dependencies
`docs/06-Modules/96`, `docs/04-Architecture/57`, `54`, `docs/05-Data/75`, `120`.

## 12. Open Questions
- OQ-1 Scope granularity for v1 (all vs. per-module).
- OQ-2 Clinician role permissions (future portal).

## 13. Risks
- R-1 Privilege escalation / over-broad access. Mitigation: BR-1/BR-2 least privilege + fail closed.
- R-2 Stale access after revoke. Mitigation: BR-4 immediate revocation.
