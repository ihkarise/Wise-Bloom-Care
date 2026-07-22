# 02 — Mission

| Field | Value |
|---|---|
| Document | Mission |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `00-VISION.md`, `01-PRODUCT_MANIFESTO.md`, `docs/01-Product/10-PRD.md` |

---

## 1. Purpose

This document states the mission — the concrete, near-to-mid-term commitment that operationalises the Vision. The Vision describes the destination (a lifetime family health platform); the Mission describes what we are actually building now and the outcomes we hold ourselves to.

## 2. Mission Statement

> **To give every mother one calm, private, evidence-grounded health record that follows her and her child as a single continuous journey — from conception through early childhood — and to make that record so trustworthy and so effortless that no family ever has to reconstruct their own history again.**

## 3. Goals

### 3.1 Primary goals (v1–v2 horizon)
- **G1 — Continuity:** Deliver an unbroken timeline across the delivery transition with automatic, permanently-linked baby profile creation.
- **G2 — Trust:** Ensure every medical statement is evidence-typed (educational / clinical / emergency) and traceable to an authoritative source.
- **G3 — Calm UX:** Ship a timeline-first, dashboard-first experience that measurably reduces user-reported anxiety versus fragmented tools.
- **G4 — Privacy:** Operate privacy-first with role-based access, audit logging, and a GDPR/HIPAA-friendly architecture.
- **G5 — Migratability:** Maintain a frontend fully decoupled from the storage engine.

### 3.2 Secondary goals (v2–v3 horizon)
- Educational AI assistant that explains reports, summarises visits, and surfaces trends and missing data.
- Prediction engine for trend surfacing (weight gain, BP, growth percentiles) — surfacing, never prescribing.
- Family dashboard for caregivers; foundations for a future clinician portal and offline PWA.

## 4. Non-Goals (this horizon)

See `docs/01-Product/17-NON_GOALS.md`. In brief: no diagnosis, no prescribing, no emergency decisioning, no telemedicine, no e-commerce, no social network, no replacement of the clinical record of record.

## 5. Scope

The mission covers the maternal→child continuous record and the modules enumerated in `docs/01-Product/13-MODULE_BREAKDOWN.md`. It excludes any capability listed as Future in `docs/13-Future`.

## 6. Measurable Outcomes (mission KPIs)

Directional targets; authoritative acceptance thresholds live in the PRD and Test Plan.

| # | Outcome | Indicative target |
|---|---|---|
| M1 | Zero duplicate/orphaned child profiles across delivery transition | 0 in production; enforced by data rules |
| M2 | Timeline continuity | 100% of families can view a single unbroken timeline spanning pregnancy→child |
| M3 | Evidence traceability | 100% of surfaced medical statements cite an authoritative source |
| M4 | Content-typing correctness | 100% content labelled educational / clinical / emergency; 0 mixed |
| M5 | Storage decoupling | Backend swap requires 0 frontend component-contract changes |
| M6 | Anxiety reduction | Positive delta on a validated calm/reassurance survey vs. baseline tools |
| M7 | Data safety | 0 unauthorised access events; 100% of health-data access logged |

## 7. Business Rules

- BR-1: Mission KPIs must not conflict with the Vision invariants (BR-V1…BR-V5 in `00-VISION.md`); where they do, the Vision wins.
- BR-2: Any feature proposed under the mission must map to at least one goal (G1–G5) or be rejected as out of horizon.

## 8. Acceptance Criteria

- [x] Mission statement is concrete and time-bounded relative to the Vision.
- [x] Goals are enumerated, prioritised, and mapped to measurable outcomes.
- [x] Non-goals are referenced, not re-litigated.
- [x] KPIs are consistent with `docs/01-Product/10-PRD.md`.

## 9. Future Expansion

As goals G1–G5 are met, the mission horizon advances toward the Vision's lifetime-platform end state, adding clinician and offline capabilities (`docs/13-Future`).

## 10. Dependencies

`00-VISION.md` (invariants), `docs/01-Product/10-PRD.md` (KPI thresholds), `docs/10-Testing/130-TEST_PLAN.md` (verification).

## 11. Open Questions

- OQ-1: Which validated instrument measures "calm/reassurance" (M6)? Deferred to UX research.
- OQ-2: First-launch jurisdiction and its effect on M7's privacy regime.

## 12. Risks

- R-1: KPI drift from Vision invariants. Mitigation: BR-1 precedence rule.
- R-2: Unmeasurable outcomes (esp. M6). Mitigation: select instrument in UX phase before committing threshold.
