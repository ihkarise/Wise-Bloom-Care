# 81 — Dashboard Module

| Field | Value |
|---|---|
| Document | Dashboard Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/03-UX/34-DASHBOARD_SPEC.md`, `95-NOTIFICATION_MODULE.md`, `docs/08-Timeline/*` |

---

## 1. Purpose
The home surface answering "what do I need to know and do now?" — dashboard-first, calm, glanceable, life-stage-adaptive. It reads across modules; it owns no domain data of its own (aggregation only).

## 2. Goals
Convey current status, next actions, and recent timeline in one calm glance; reduce anxiety; adapt to life stage without a reset.

## 3. Scope
In: aggregation/prioritisation of status, next-things, metric tiles, recent timeline, contextual knowledge card, emergency card (curated). Out: authoring domain data (owned by respective modules); UX layout detail (`docs/03-UX/34`).

## 4. Functional Requirements
- FR-1 Show life-stage status header (pregnancy week / child age; multi-child selector).
- FR-2 Surface one primary "right now" action.
- FR-3 Prioritised next-things (appointments, medicines, vaccinations, milestones), capped.
- FR-4 Metric tiles (latest BP, weight trend, growth percentile) — current + trend, calm, tap-through.
- FR-5 Recent timeline preview → full timeline.
- FR-6 Contextual educational knowledge card (typed, sourced, dismissible).
- FR-7 Conditionally surface curated emergency card (never auto-inferred).

## 5. Non-Functional Requirements
Performance budget (NFR-1); accessible (`docs/03-UX/40`); no diagnosis; calm framing.

## 6. Architecture
Dashboard aggregation service reads via other services (`docs/04-Architecture/52`); no direct storage of domain facts; renders content via content-type-aware components (`docs/03-UX/36`).

## 7. User Flow
Open app → dashboard → glance status/next → tap into module/timeline. Life-stage adaptation on delivery (`docs/03-UX/31` J4).

## 8. Data Model
Reads: events, vitals, appointments, medicines, growth, milestones, vaccinations. Owns: (optional) user dashboard preferences.

## 9. Business Rules
- BR-1 Exactly one primary "right now" focus per render.
- BR-2 Metric tiles never diagnose; current + trend + calm framing.
- BR-3 Emergency card only from curated set (`docs/02-Research/28` BR-4).
- BR-4 Adapts to life stage from the single record; no reset at delivery.
- BR-5 To-do surfacing capped for calm.

## 10. Edge Cases
Multiple children (selector); overdue pile-up (consolidate calmly); caregiver-scoped view; sparse data (no fake trends); loss path (compassionate stripped dashboard).

## 11. Acceptance Criteria
- [x] Aggregation, prioritisation, life-stage adaptation specified.
- [x] Calm/anti-alarm + curated-emergency rules stated.
- [x] Reads-only (no domain-data ownership) confirmed.

## 12. Future Expansion
Personalised ordering, AI summaries (guarded), widgets/quick-add, caregiver-optimised variant.

## 13. Dependencies
`docs/03-UX/34`, all read modules, `95`, `docs/07-AI/*` (v2).

## 14. Open Questions
- OQ-1 Post-delivery default emphasis (maternal/child/smart).
- OQ-2 User-configurable tiles in v1.

## 15. Risks
- R-1 Overwhelm → BR-1/BR-5 caps.
- R-2 Alarming metrics → BR-2 calm framing.
