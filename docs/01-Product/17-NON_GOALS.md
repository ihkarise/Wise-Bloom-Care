# 17 — Non-Goals

| Field | Value |
|---|---|
| Document | Non-Goals |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/00-Vision/00-VISION.md`, `11-PRODUCT_SCOPE.md`, `docs/07-AI/105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose

Explicitly enumerates what Wise Bloom Care **will not** be or do. Non-goals are as important as goals: they prevent scope drift, protect users from harm, and keep the product on the right side of medical, legal, and ethical lines. Unlike "deferred" scope, non-goals are deliberate, standing exclusions — they change only via an explicit Vision revision and ADR.

## 2. Categorical Non-Goals

### 2.1 Clinical non-goals (safety-critical)
- **NG-1 — No diagnosis.** The product never states or implies a diagnosis. Outputs are educational information or trends only.
- **NG-2 — No prescribing / dosing.** It never prescribes medicine, recommends a specific drug/dose, or adjusts a regimen.
- **NG-3 — No emergency decision-making.** It never tells a user whether a situation is or isn't an emergency in place of a clinician; it surfaces typed emergency *warnings* that direct users to seek care.
- **NG-4 — Not the record of record.** It is not an Electronic Health Record and does not replace clinical documentation or the clinician relationship.
- **NG-5 — No treatment planning.** It does not create or manage a treatment plan.

### 2.2 Product/business non-goals
- **NG-6 — No telemedicine.** No live clinical consultation or triage service in the core product.
- **NG-7 — No e-commerce / marketplace / advertising.** The product is not a store and does not run ads, especially not against health data.
- **NG-8 — No social network.** No public profiles, feeds, or follower mechanics as a core identity.
- **NG-9 — No data monetisation.** User health data is never sold, rented, or mined for advertising.
- **NG-10 — No gamification of health anxiety.** No streaks/badges that pressure or shame; reminders are gentle, not coercive.

### 2.3 Technical non-goals (this horizon)
- **NG-11 — Not multi-tenant-clinic software (v1).** v1 is family-facing; clinician/clinic multi-tenancy is a future consideration (`docs/13-Future`).
- **NG-12 — No premature storage optimisation.** v1 does not build for Postgres/Supabase now; it builds the *boundary* that makes migration possible (`docs/04-Architecture/52-BACKEND_ARCHITECTURE.md`).
- **NG-13 — No offline in v1.** Offline PWA is Phase 3, not v1 (design must not preclude it).

## 3. Why Each Non-Goal Exists

| Non-goal | Rationale |
|---|---|
| NG-1..NG-5 | User safety and legal/medical liability; the product educates, clinicians practice medicine. |
| NG-6..NG-9 | Trust and dignity; avoids commercial conflicts of interest over intimate health data. |
| NG-10 | Aligns with "calm over clever" (P3); protects vulnerable users. |
| NG-11..NG-13 | Focus and phasing; prevents premature complexity while preserving future options. |

## 4. Boundary Statements (what we *do* instead)

- Instead of diagnosing → we **explain** and **recommend clinician review**.
- Instead of prescribing → we **track** medicines the clinician prescribed and **remind**.
- Instead of emergency triage → we **surface typed emergency warnings** that say "seek care now".
- Instead of being the EHR → we are the family's **continuous personal companion record**.

## 5. Business Rules

- BR-1: No feature may ship that requires violating a clinical non-goal (NG-1..NG-5) to be useful.
- BR-2: Any proposal to change a non-goal requires an ADR and Vision revision; product/design cannot waive it unilaterally.
- BR-3: AI guardrails (`docs/07-AI/105-GUARDRAILS.md`) must enforce NG-1..NG-3 technically, not just by policy.

## 6. Acceptance Criteria

- [x] All safety-critical clinical non-goals enumerated with rationale.
- [x] Business and technical non-goals stated and reconciled with scope tiers.
- [x] Each non-goal paired with a "what we do instead" boundary.
- [x] Change-control rule (ADR + Vision revision) defined.

## 7. Future Expansion

Some technical non-goals (NG-11, NG-13) are horizon-bound and expected to relax in later phases via governed decisions; clinical non-goals (NG-1..NG-5) are permanent.

## 8. Dependencies

`docs/00-Vision/00-VISION.md`, `docs/07-AI/105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `11-PRODUCT_SCOPE.md`.

## 9. Open Questions

- OQ-1: Exact wording of user-facing emergency warnings (clinical review) — `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

## 10. Risks

- R-1: Feature pressure eroding clinical non-goals. Mitigation: BR-1..BR-3 hard governance + technical guardrails.
