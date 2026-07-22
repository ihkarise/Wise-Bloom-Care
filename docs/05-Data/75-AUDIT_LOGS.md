# 75 — Audit Logs

| Field | Value |
|---|---|
| Document | Audit Logs |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `63-LOGGING.md` (arch), `74-DATA_RETENTION.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/09-Security/125-INCIDENT_RESPONSE.md` |

---

## 1. Purpose

Defines the audit log — the append-only, access-controlled record of who accessed or changed sensitive health data, when, and how. Auditability is a core security/privacy requirement (NFR-2/3) and the evidence base for incident response and compliance. Distinct from operational logging (`docs/04-Architecture/63`).

## 2. Scope

Audit event model, what is/ isn't recorded, integrity, retention, and access. Operational logs: `63`. Retention: `74`. Access control: `123`.

## 3. What Is Audited

- Access to highly-sensitive data (reads of health records/reports/media) where policy requires.
- All **changes** to health data (create/version/soft-delete/erasure).
- Auth/security events: login success/failure counts, session revocation, caregiver grant/revoke.
- Administrative/config actions on production data.
- The **delivery transition** (child creation) — high-value integrity event.

## 4. Audit Record Model

| Field | Meaning |
|---|---|
| audit_id | PK (uuid) |
| actor_user_id | who (never PHI beyond the id) |
| actor_role | account_holder/caregiver/clinician/system |
| action | read/create/update(version)/soft_delete/erase/grant/revoke/login/… |
| entity | entity type (e.g., Vital, ChildRecord) |
| entity_id | affected record id |
| family_id | scope |
| at | timestamp (UTC) |
| correlation_id | request trace (`63`) |
| meta | safe context (e.g., version number) — **no health content** |

> The audit log records **that** something happened and by whom — **not** the sensitive content itself.

## 5. What Is NOT in the Audit Log

- No health values / medical content / media contents.
- No credentials/tokens/secrets.
- No free-text PHI. (Meta is limited to safe, non-identifying context.)

## 6. Integrity

- **Append-only:** audit records are never updated or deleted in place (`77` semantics; enforced by adapter/services).
- Tamper-resistance: restricted write path (only AuditService), restricted access, and (future) integrity hashing/chaining.
- Stored in a protected location (dedicated audit tab/store), access-controlled (`123`).

## 7. Retention & Access

- Retained per policy (long; ≥ regulatory minimum) (`74`).
- Access strictly limited (security/admin roles); **audit-log access is itself audited**.
- Used for incident investigation (`125`), compliance, and integrity monitoring (`docs/04-Architecture/64`).

## 8. Use in Monitoring & Incident Response

- Feeds integrity checks (e.g., detect anomalous access, verify delivery-transition integrity).
- Primary evidence source during incidents (`125`).
- Supports data-subject requests (proving access/erasure) (`74`, `126`).

## 9. Business Rules

- BR-1: Every access/change to highly-sensitive health data is audited (metadata only).
- BR-2: Audit records contain no health content, secrets, or free-text PHI.
- BR-3: Audit log is append-only and written only by AuditService.
- BR-4: Audit-log access is restricted and itself audited.
- BR-5: Audit retention meets policy/regulatory minimums (`74`).

## 10. Edge Cases

- High-volume reads → audit at appropriate granularity to remain useful without overwhelming (policy-defined; e.g., audit sensitive reads and all writes).
- Erasure → the erasure action is audited (metadata) even as content is removed (`74` BR-4).
- System/automated actions → attributed to `system` actor with correlation ID.
- Backup/restore of audit log → preserves append-only integrity.

## 11. Acceptance Criteria

- [x] Audit event model defined (metadata only, no content).
- [x] Append-only integrity, restricted + self-audited access specified.
- [x] Retention and incident/monitoring usage stated.
- [x] Distinct from operational logging.

## 12. Future Expansion

Cryptographic hash-chaining/immutable store; SIEM integration; user-visible access log ("who saw my data"); automated anomaly detection on audit stream.

## 13. Dependencies

`63`, `74`, `77`, `docs/09-Security/123`, `125`, `126`, `docs/04-Architecture/64`.

## 14. Open Questions

- OQ-1: Granularity of read auditing (all sensitive reads vs. sampled) — policy + performance trade-off.
- OQ-2: Whether to expose a user-facing access log in v1/v2.

## 15. Risks

- R-1: PHI leaking into audit meta. Mitigation: BR-2 metadata-only.
- R-2: Audit tampering. Mitigation: BR-3/BR-4 append-only + restricted + self-audited.
