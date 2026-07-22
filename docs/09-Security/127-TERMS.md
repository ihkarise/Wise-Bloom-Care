# 127 — Terms of Service (Design Basis)

| Field | Value |
|---|---|
| Document | Terms of Service — Design Basis |
| Status | Approved (Draft 1.0 — requires legal review) |
| Version | 1.0 |
| Owner | Security Architect / Legal (pending) |
| Last Updated | 2026-07-22 |
| Related | `126-PRIVACY_POLICY.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `docs/01-Product/17-NON_GOALS.md` |

---

## 1. Purpose
Defines the **design basis** for the Terms of Service: the commitments, disclaimers, and user obligations governing use of Wise Bloom Care. It ensures the medical disclaimer and non-goals are legally reflected. The final legal text must be produced/reviewed by qualified counsel (OQ-1). **This is not legal advice.**

## 2. Scope
Service description, medical disclaimer, acceptable use, accounts, liability limits, and changes — as a design basis. Privacy: `126`.

## 3. Service Description
- Wise Bloom Care is an **educational and record-keeping** platform for maternal and child health — a continuous family health record with reminders and optional educational AI.
- It is **not** a medical device, medical service, or a substitute for professional care (`docs/02-Research/28`, `docs/01-Product/17`).

## 4. Medical Disclaimer (must be prominent)
Incorporates the global disclaimer from `docs/02-Research/28` §6:
> The product provides educational information and helps organise a health record. It does not provide medical advice, diagnosis, or treatment and does not replace a clinician. In an emergency, contact local emergency services immediately.
- Users acknowledge this at onboarding (`docs/02-Research/28` BR-5).

## 5. Acceptable Use
- Provide accurate information; use for personal/family health record-keeping.
- No misuse, unauthorised access, scraping, or attempts to break security.
- Respect others' data; caregivers use access only as granted.
- No reliance on the product for emergency or diagnostic decisions (NG-1..NG-3).

## 6. Accounts & Responsibilities
- Users are responsible for safeguarding credentials.
- Account holder controls the family record and caregiver access (`123`, `docs/06-Modules/96`).
- Age/guardianship: the account holder must be legally able to manage the record (incl. the child's, per law) (`126` §10).

## 7. Liability & Warranties (basis)
- Educational information is provided "as is" for general understanding; not a guarantee of outcomes.
- Limitation of liability and warranty disclaimers per applicable law — **final wording by counsel**.
- The product's role ends at education/record-keeping; medical decisions rest with clinicians (boundary from `docs/01-Product/17`).

## 8. Changes & Termination
- Terms may change with notice; continued use implies acceptance (per law).
- Users may export (`docs/05-Data/76`) and delete/erase (`docs/05-Data/74`) their data.
- Account termination and data handling per retention/privacy.

## 9. Business Rules
- BR-1 The medical disclaimer is incorporated and acknowledged at onboarding.
- BR-2 Terms reflect the non-goals (no diagnosis/prescription/emergency decisions).
- BR-3 Acceptable-use prohibits security misuse and unauthorised access.
- BR-4 Users retain export/erasure rights (`docs/05-Data/74`, `76`).
- BR-5 Final terms reviewed by counsel for the launch jurisdiction before launch.

## 10. Edge Cases
Jurisdiction differences; guardianship/age; caregiver disputes (account-holder authority); changes to terms mid-use (notice + acceptance); enterprise/clinician terms (future portal).

## 11. Acceptance Criteria
- [x] Service description, medical disclaimer, acceptable use, accounts, liability basis, and changes specified.
- [x] Non-goals and disclaimer legally reflected.
- [x] Legal-review gate before launch.

## 12. Future Expansion
Clinician/enterprise terms; jurisdiction-specific terms; DPA templates for providers; accessibility statement.

## 13. Dependencies
`126`, `docs/02-Research/28`, `docs/01-Product/17`, `docs/05-Data/74`, `76`.

## 14. Open Questions
- OQ-1 Launch jurisdiction + final legal text and liability framing.
- OQ-2 Whether any market classifies the product as a medical device (changes obligations).

## 15. Risks
- R-1 Inadequate disclaimer/liability framing → legal exposure. Mitigation: BR-1/BR-5 disclaimer + counsel.
- R-2 Terms conflicting with non-goals. Mitigation: BR-2 alignment.
