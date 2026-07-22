# 126 — Privacy Policy (Design Basis)

| Field | Value |
|---|---|
| Document | Privacy Policy — Design Basis |
| Status | Approved (Draft 1.0 — requires legal review) |
| Version | 1.0 |
| Owner | Security Architect / Legal (pending) |
| Last Updated | 2026-07-22 |
| Related | `127-TERMS.md`, `docs/05-Data/74-DATA_RETENTION.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the **design basis** for the user-facing privacy policy: the data practices Wise Bloom Care commits to, aligned with a GDPR/HIPAA-friendly, privacy-first posture. This document specifies the substance engineers must implement; the final legal text must be produced/reviewed by qualified counsel for the launch jurisdiction (OQ-1). **This is not legal advice.**

## 2. Scope
Data collected, purposes, lawful basis/consent, sharing, retention, user rights, security, and children's data. Legal text/terms: `127`.

## 3. Privacy Principles
- Privacy-first, data minimisation, purpose limitation, transparency, user control, no data monetisation (NG-9).
- Highly-sensitive health data treated with the strongest protections (`docs/04-Architecture/58`).

## 4. Data We Collect (and why)
- Account/identity (auth) — to provide the service securely.
- Health data (pregnancy/child records, vitals, reports, growth, milestones, vaccinations, journal) — to provide the continuous record the user creates.
- Usage/operational data (no PHI in logs) — reliability/security (`docs/04-Architecture/63`).
- We collect only what's needed for the features the user uses (minimisation).

## 5. How We Use Data
- To provide and secure the product's features (record-keeping, reminders, education, optional AI).
- **We do not sell or rent data, and do not use health data for advertising** (NG-9).
- AI processing uses minimal necessary data with consent + provider DPA (`docs/07-AI/100`).

## 6. Consent & Lawful Basis
- Explicit consent for processing sensitive health data and for optional AI/OCR/voice features.
- Medical disclaimer acknowledged at onboarding (`docs/02-Research/28`).
- Users can withdraw consent for optional processing.

## 7. Sharing
- No third-party data sale.
- Caregiver sharing only by explicit, revocable user grant (`123`, `docs/06-Modules/96`).
- Service providers (hosting, AI/OCR) under data-processing agreements, minimal data, with confidentiality.
- Legal disclosure only where legally required.

## 8. Retention & User Rights
- Retention per `docs/05-Data/74`; long-lived record by intent, bounded by consent/law.
- **Rights:** access/export (`docs/05-Data/76`), correction (versioned), erasure (incl. backups within window, `74`), and objection/withdrawal for optional processing — subject to jurisdiction.

## 9. Security
- TLS, encryption at rest, RBAC, audit logging, rate limiting, secret management (`121`–`124`, `120`).
- Breach notification per `125` and law.

## 10. Children's Data
- The product concerns a child's health data entered by the parent/guardian (data controller = the account-holder relationship as defined by law).
- Special-category/children's-data protections apply; specifics finalised per jurisdiction with counsel (COPPA/GDPR-K/local).

## 11. Business Rules
- BR-1 Data minimisation + purpose limitation enforced.
- BR-2 No sale/rental of data; no health-data advertising.
- BR-3 Explicit consent for sensitive/optional processing; withdrawable.
- BR-4 User rights (access/export/correct/erase) supported technically (`docs/05-Data/74`, `76`, `77`).
- BR-5 Final policy text reviewed by counsel for the launch jurisdiction before launch.

## 12. Edge Cases
Jurisdiction differences (GDPR vs. local); caregiver vs. account-holder rights (only account holder erases); children's-data rules; provider sub-processing; cross-border data transfer (assess per law).

## 13. Acceptance Criteria
- [x] Data collected/used/shared, consent, retention, rights, security, children's data specified as a design basis.
- [x] No-monetisation and minimisation committed.
- [x] Legal-review gate before launch.

## 14. Future Expansion
Jurisdiction-specific policies; data-controls dashboard; DPIA; formal DPO/processes; certifications.

## 15. Dependencies
`127`, `docs/05-Data/74`, `76`, `77`, `120`–`125`, `docs/02-Research/28`, `docs/07-AI/100`.

## 16. Open Questions
- OQ-1 Launch jurisdiction(s) + applicable regime (GDPR/HIPAA/local) and final legal text.
- OQ-2 Cross-border transfer + sub-processor list.
- OQ-3 Children's-data legal specifics.

## 17. Risks
- R-1 Non-compliance. Mitigation: BR-5 legal review + privacy-first design (RSK-12).
- R-2 Over-collection. Mitigation: BR-1 minimisation.
