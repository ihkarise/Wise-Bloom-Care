# 12 — Feature Matrix

| Field | Value |
|---|---|
| Document | Feature Matrix |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `10-PRD.md`, `11-PRODUCT_SCOPE.md`, `13-MODULE_BREAKDOWN.md`, `16-RELEASE_PLAN.md` |

---

## 1. Purpose

Provides a single traceability matrix mapping every feature to its owning module, PRD requirement, priority, release tier, and status. It is the at-a-glance planning and traceability artefact used in release gating and coverage checks.

## 2. Legend

- **Priority (MoSCoW):** M = Must, S = Should, C = Could, W = Won't (this horizon).
- **Tier:** target release (v1 / v2 / v3).
- **Status:** Spec = specified in docs; Planned; Deferred.
- **FR:** requirement ID from `10-PRD.md`.

## 3. Matrix

| Feature | Module | FR | Priority | Tier | Status |
|---|---|---|---|---|---|
| Registration / login / session | `80-AUTH` | FR-1 | M | v1 | Spec |
| Single linked family record | Data model | FR-2 | M | v1 | Spec |
| Append-only versioned timeline | Timeline/`05-Data` | FR-3 | M | v1 | Spec |
| Dashboard (status, next actions, recent) | `81-DASHBOARD` | FR-4 | M | v1 | Spec |
| Blood pressure tracking + chart | `83-VITALS` | FR-5 | M | v1 | Spec |
| Weight & weight-gain tracking + chart | `83-VITALS` | FR-5 | M | v1 | Spec |
| Blood sugar tracking + chart | `83-VITALS` | FR-5 | M | v1 | Spec |
| Nutrition logging (basic) | `86-NUTRITION` | FR-6 | S | v1 | Spec |
| Nutrition guided programme | `86-NUTRITION` | FR-6 | S | v2 | Planned |
| Exercise logging (basic) | `87-EXERCISE` | FR-7 | S | v1 | Spec |
| Exercise guided programme | `87-EXERCISE` | FR-7 | S | v2 | Planned |
| Medicine/supplement tracker + reminders | `85-MEDICINES` | FR-8 | M | v1 | Spec |
| Appointments + reminders | `81`/`95` | FR-9 | M | v1 | Spec |
| Visit summaries | `94-AI`/reports | FR-9 | S | v2 | Planned |
| Lab report upload/view | `84-REPORTS` | FR-10 | M | v1 | Spec |
| Ultrasound report upload/view | `84-REPORTS` | FR-10 | M | v1 | Spec |
| AI report explanation (educational) | `94-AI` | FR-10 | S | v2 | Planned |
| OCR extraction from reports | `docs/07-AI/106` | FR-10 | C | v2 | Planned |
| Week-by-week pregnancy knowledge | KB/`82` | FR-11 | M | v1 | Spec |
| Delivery event capture | `88-DELIVERY` | FR-12 | M | v1 | Spec |
| Auto linked baby-profile creation | `88`/`89` | FR-13 | M | v1 | Spec |
| Compassionate loss handling | `88` | FR-14 | M | v1 | Spec |
| Multiple births support | `88`/`89` | FR-15 | S | v1 | Spec |
| Baby profile + continuous timeline | `89-BABY` | FR-16 | M | v1 | Spec |
| WHO growth charts | `90-GROWTH` | FR-17 | M | v1 | Spec |
| CDC developmental milestones | `91-MILESTONES` | FR-18 | M | v1 | Spec |
| Vaccination schedule + reminders | `92-VACCINATION` | FR-19 | M | v1 | Spec |
| Feeding & sleep logging | `89`/journal | FR-20 | S | v1 | Spec |
| Journal (notes/photos) | `93-JOURNAL` | FR-21 | S | v1 | Spec |
| Family dashboard / caregiver sharing | `96-FAMILY` | FR-22 | S | v1/v2* | Spec |
| Notifications/reminders engine | `95-NOTIFICATION` | FR-23 | M | v1 | Spec |
| Settings (profile/privacy/notifications/export) | `97-SETTINGS` | FR-24 | M | v1 | Spec |
| Educational AI assistant | `94-AI` | FR-25 | S | v2 | Planned |
| Prediction engine (trends) | `docs/07-AI/104` | FR-26 | C | v2 | Planned |
| Data export/import | `docs/05-Data/76` | FR-27 | S | v1 | Spec |
| Voice input pipeline | `docs/07-AI/107` | — | C | v3 | Deferred |
| Clinician / doctor portal | — | — | W (v1) | v3 | Deferred |
| Offline PWA | — | — | W (v1) | v3 | Deferred |
| Wearable/device integration | — | — | W (v1) | v3 | Deferred |

\* Caregiver sharing tier pending PRD OQ-2.

## 4. Coverage Checks (business rules)

- BR-1: Every "Must" feature has status Spec before v1 code start.
- BR-2: Every feature row maps to exactly one owning module (or an explicit cross-module note).
- BR-3: Every "Must" feature maps to ≥1 acceptance test in `docs/10-Testing/131-TEST_CASES.md`.
- BR-4: No feature ships that violates a Non-Goal (`17-NON_GOALS.md`).

## 5. Acceptance Criteria

- [x] All PRD FRs represented.
- [x] Priorities and tiers reconcile with `11-PRODUCT_SCOPE.md` and `16-RELEASE_PLAN.md`.
- [x] Each feature has an owning module.

## 6. Future Expansion

Add columns for owner/assignee, effort estimate, and test-coverage link when execution planning begins; keep the matrix as the master traceability grid.

## 7. Dependencies

`10-PRD.md`, `13-MODULE_BREAKDOWN.md`, `16-RELEASE_PLAN.md`, `docs/10-Testing/131-TEST_CASES.md`.

## 8. Open Questions

- OQ-1: Caregiver sharing tier (v1 vs v2).
- OQ-2: Whether AI report explanation can reach v1 if guardrails mature early.

## 9. Risks

- R-1: Matrix drifting from module docs. Mitigation: reconcile at each release-planning checkpoint.
