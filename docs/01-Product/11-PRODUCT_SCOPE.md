# 11 — Product Scope

| Field | Value |
|---|---|
| Document | Product Scope |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `10-PRD.md`, `12-FEATURE_MATRIX.md`, `17-NON_GOALS.md`, `16-RELEASE_PLAN.md` |

---

## 1. Purpose

Defines the precise boundaries of what Wise Bloom Care includes and excludes across releases, so that scope decisions are explicit and defensible. It complements the PRD (which says *what the product does*) by drawing the line around *how far it goes* in each release.

## 2. Scope Model

Scope is expressed per release tier. A capability is either **In** (committed for that tier), **Deferred** (planned later tier), or **Excluded** (a non-goal). Non-goals are enumerated in `17-NON_GOALS.md` and are never "deferred"—they are deliberate exclusions.

| Tier | Theme |
|---|---|
| v1 (MVP) | Continuous record: pregnancy tracking → delivery transition → baby core (growth, milestones, vaccination). |
| v2 | Assistance & insight: AI assistant, prediction engine, family/caregiver, richer reports. |
| v3+ | Ecosystem: clinician portal, offline PWA, devices, additional life stages. |

## 3. In Scope — v1 (MVP)

- **Account & continuity:** auth/session; single family record; append-only, versioned timeline; dashboard.
- **Pregnancy core:** vitals (BP, weight, weight gain, blood sugar) with current/previous/trend; medicine tracker + reminders; appointments + reminders; lab & ultrasound report upload/view; week-by-week knowledge.
- **Delivery transition:** delivery event; automatic linked baby-profile creation; compassionate loss handling.
- **Baby core:** baby profile & continuous timeline; WHO growth charts; CDC milestones; vaccination schedule + reminders.
- **Cross-cutting:** notifications; settings; data export; audit logging; privacy controls.
- **Content:** typed educational / clinical / emergency content, grounded in `docs/02-Research`.

## 4. In Scope — v2

- Educational AI assistant (explain reports, summarise visits, surface trends & missing data, generate reminders/summaries) with guardrails.
- Prediction engine (weight-gain trajectory, BP trend, growth percentile projection) — surfacing only.
- Nutrition & exercise modules elevated from basic logging to guided programmes.
- Family dashboard / caregiver sharing (if deferred from v1 per PRD OQ-2).
- Feeding & sleep richer analytics; journal media.
- OCR pipeline for report extraction; broader report types.

## 5. In Scope — v3+ (Ecosystem)

- Clinician / doctor portal (read + structured contributions).
- Offline-first PWA with sync.
- Wearable/device integrations.
- Additional life stages beyond toddlerhood toward a lifetime family platform.
- Multi-language / multi-jurisdiction expansion.

## 6. Explicitly Excluded (see `17-NON_GOALS.md`)

- Diagnosis, prescription, dosing advice, emergency decisioning.
- Telemedicine / live clinical consultation.
- E-commerce, marketplace, advertising.
- Social networking / public feeds.
- Being the medical record of record / EHR replacement.
- Selling or mining user data.

## 7. Scope Boundaries & Interfaces

- **With clinicians:** the product *organises and educates*; it does not *practice medicine*. The boundary is the clinician-review recommendation.
- **With the knowledge base:** medical content lives in `knowledge-base/` and `docs/02-Research`, versioned independently of product logic.
- **With storage:** v1 uses Apps Script + Google Sheets behind the API contract; later tiers may swap storage with no frontend scope change.

## 8. Business Rules

- BR-1: A capability may move from Deferred → In only via `16-RELEASE_PLAN.md` update + ADR if architecturally significant.
- BR-2: An Excluded item may only become In-scope via an explicit Vision/Non-Goals revision (ADR), never silently.
- BR-3: v1 must not ship any capability that requires diagnosis/prescription to be useful.

## 9. Acceptance Criteria

- [x] Every PRD "Must" FR is In scope for v1.
- [x] Every deferred capability names its target tier.
- [x] Exclusions reconcile exactly with `17-NON_GOALS.md`.
- [x] Scope tiers reconcile with `16-RELEASE_PLAN.md` and `14-ROADMAP.md`.

## 10. Future Expansion

Scope tiers extend naturally as the platform grows; the tiering method (In / Deferred / Excluded per release) remains the governance mechanism.

## 11. Dependencies

`10-PRD.md`, `12-FEATURE_MATRIX.md`, `13-MODULE_BREAKDOWN.md`, `14-ROADMAP.md`, `16-RELEASE_PLAN.md`, `17-NON_GOALS.md`.

## 12. Open Questions

- OQ-1: Caregiver sharing — v1 or v2? (mirrors PRD OQ-2).
- OQ-2: Are nutrition/exercise "basic logging" in v1 or fully deferred to v2? (Currently: basic in v1, guided in v2.)

## 13. Risks

- R-1: Scope creep via "just one more thing" in v1. Mitigation: BR-1 governance + release plan.
- R-2: Under-scoping v1 continuity (the differentiator). Mitigation: continuity is non-negotiable in v1.
