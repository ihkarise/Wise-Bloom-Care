# 88 — Delivery Module (The Transition Keystone)

| Field | Value |
|---|---|
| Document | Delivery Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Healthcare Software Architect / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `82-PREGNANCY_MODULE.md`, `89-BABY_MODULE.md`, `docs/08-Timeline/111-DELIVERY_TRANSITION.md`, `docs/04-Architecture/56-API_SPEC.md` |

---

## 1. Purpose
The keystone module: it records the delivery event and **automatically creates the baby profile, permanently linked to the mother**, so the timeline continues without a reset, migration, or duplicate. It also handles multiple births and pregnancy loss compassionately. This is the single most important continuity mechanism in the product.

## 2. Goals
Capture the delivery; create linked child record(s) exactly once; continue the timeline; handle loss with compassion; never duplicate a profile.

## 3. Scope
Owns: `delivery` event; is the **sole creator** of `child_records` and the immutable mother link (Vision BR-V2). Uses: pregnancy episode (`82`), baby module (`89`). Out: newborn ongoing care (owned by `89`).

## 4. Functional Requirements
- FR-1 Record delivery details: mode, GA at birth, birth metrics (weight/length/head), Apgar, time.
- FR-2 On live birth: atomically create child record(s) with immutable `mother_id` + originating episode link + a delivery timeline event; timeline continues.
- FR-3 Support multiple births: one delivery event → multiple distinct child records.
- FR-4 Idempotent creation: retries never create duplicate children.
- FR-5 Loss path: record a compassionate terminal episode state **without** creating a child; no baby prompts thereafter.
- FR-6 Activate postpartum (maternal) + newborn (child) parallel contexts (`docs/03-UX/32`).

## 5. Non-Functional Requirements
Atomicity/idempotency (no duplicates, no partial state); careful compassionate UX (`docs/03-UX/31` J6); rollback runbook (`docs/12-Operations/150`); fully audited (delivery is a high-value integrity event, `docs/05-Data/75`).

## 6. Architecture
DeliveryService in the application layer is the only creator of child records; uses idempotency keys + locking (`docs/04-Architecture/53`); emits the delivery event; sets immutable link. Contract: `POST /v1/delivery` (`docs/04-Architecture/56` §6).

## 7. User Flow
Record delivery → (live) baby profile appears automatically, linked → timeline continues; postpartum + newborn contexts activate. (Loss) compassionate terminal state; supportive resources (educational); no forced baby profile (`docs/03-UX/31` J4/J6).

## 8. Data Model
`delivery` event + `child_records(child_id, family_id, mother_id [immutable], dob, sex, ga_at_birth)` (`docs/05-Data/70`, `71`).

## 9. Business Rules
- BR-1 DeliveryService is the **sole** creator of child records (Vision BR-V2).
- BR-2 `mother_id` is set once and immutable (Vision BR-V1).
- BR-3 Creation is idempotent — retries create no duplicates.
- BR-4 Multiple births → multiple distinct children under one delivery event.
- BR-5 Loss path never forces a child; compassionate terminal state (BR-7 of PRD).
- BR-6 The delivery event is audited; integrity monitored (0 duplicate/orphan children, `docs/04-Architecture/64`).

## 10. Edge Cases
Retry/timeout during creation (idempotency); twins/triplets; stillbirth/neonatal loss (compassionate, distinct handling); preterm (record GA at birth for corrected age); home vs. hospital birth; correcting delivery details (versioned; cannot re-point mother link, `docs/05-Data/77`).

## 11. Acceptance Criteria
- [x] Delivery capture + automatic, idempotent, linked child creation (0 duplicates).
- [x] Multiple births supported.
- [x] Compassionate loss path (no forced child).
- [x] Parallel postpartum/newborn activation; audited + monitored.

## 12. Future Expansion
Structured birth-outcome data for clinician portal; richer postpartum onboarding; support resources directory (educational) for loss; NICU-stay handling.

## 13. Dependencies
`82`, `89`, `docs/08-Timeline/111`, `112`, `docs/04-Architecture/56`, `53`, `docs/05-Data/70`, `71`, `75`, `77`, `docs/12-Operations/150`.

## 14. Open Questions
- OQ-1 Exact loss-path flow wording (compassionate + clinical review).
- OQ-2 Support-resource directory scope for loss.

## 15. Risks
- R-1 Duplicate/orphan child (breaks continuity). Mitigation: BR-1..BR-3 + monitoring (RSK-2).
- R-2 Emotional harm on loss path. Mitigation: BR-5 compassionate design gate.
