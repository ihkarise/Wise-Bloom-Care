# 14 — Roadmap

| Field | Value |
|---|---|
| Document | Product Roadmap |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `15-MILESTONES.md`, `16-RELEASE_PLAN.md`, `11-PRODUCT_SCOPE.md`, `docs/13-Future/*` |

---

## 1. Purpose

Communicates the phased, theme-based direction of Wise Bloom Care over a multi-year horizon. The roadmap is intentionally **theme- and outcome-oriented**, not date-committed, to avoid false precision; concrete sequencing and gates live in `15-MILESTONES.md` and `16-RELEASE_PLAN.md`.

## 2. Roadmap Themes

| Phase | Theme | Outcome |
|---|---|---|
| **Phase 0 — Architecture** (now) | Design before build | Complete, reviewed documentation set (this repository). |
| **Phase 1 — Continuous Record (v1)** | Prove continuity | A family can track pregnancy, cross the delivery transition without a reset, and manage baby core (growth, milestones, vaccination). |
| **Phase 2 — Assistance & Insight (v2)** | Make it smart & shared | Educational AI assistant, prediction/trends, caregiver sharing, guided nutrition/exercise, report explanation/OCR. |
| **Phase 3 — Ecosystem (v3)** | Open the platform | Clinician portal, offline PWA, device integrations, multi-jurisdiction. |
| **Phase 4 — Lifetime Platform (v4+)** | Extend the journey | Additional life stages toward a lifetime family health platform. |

## 3. Phase Detail

### Phase 0 — Architecture (current)
Deliverable: the full `docs/` and `knowledge-base/` set, reviewed. Exit gate: documentation acceptance criteria met; ADRs recorded.

### Phase 1 — Continuous Record (v1 / MVP)
- Foundation: auth, family record, timeline, dashboard, settings, notifications.
- Pregnancy: vitals, medicines, appointments, reports (upload/view), week knowledge.
- Transition: delivery event, auto linked baby profile, loss handling.
- Baby core: profile/timeline, WHO growth, CDC milestones, vaccination.
- Exit gate: continuity KPIs met (0 duplicate profiles; 100% timeline continuity); WCAG 2.2 AA on core flows; security baseline.

### Phase 2 — Assistance & Insight (v2)
- AI assistant with guardrails; report explanation; OCR.
- Prediction engine (weight gain, BP, growth percentile) — surfacing only.
- Caregiver/family sharing; guided nutrition & exercise; richer journal/feeding/sleep.
- Exit gate: AI guardrail conformance (0 diagnostic/prescriptive outputs); prediction framed educationally.

### Phase 3 — Ecosystem (v3)
- Clinician/doctor portal (read + structured contribution).
- Offline-first PWA with sync; device/wearable integration; localisation.
- Exit gate: storage migration validated (backend swap with 0 frontend contract changes); offline data integrity.

### Phase 4 — Lifetime Platform (v4+)
- Additional life stages; long-term family health; broader analytics.
- See `docs/13-Future/162-LONG_TERM_VISION.md`.

## 4. Sequencing Principles

- Continuity (Phase 1) precedes intelligence (Phase 2): we prove the record before we reason over it.
- Safety gates precede AI exposure: guardrails must pass before AI ships.
- Migration is validated before ecosystem scale: the storage boundary is proven before clinician/offline load.

## 5. Business Rules

- BR-1: A phase cannot start until the prior phase's exit gate passes (except non-blocking research spikes).
- BR-2: Roadmap changes are recorded (changelog `docs/11-Development/147-CHANGELOG.md`); architecturally significant shifts require an ADR.

## 6. Acceptance Criteria

- [x] Phases are theme-based with explicit outcomes and exit gates.
- [x] Reconciles with `11-PRODUCT_SCOPE.md` tiers and `16-RELEASE_PLAN.md`.
- [x] Sequencing principles stated.

## 7. Future Expansion

Beyond Phase 4, the roadmap extends to a full lifetime family health platform; new phases append with theme + outcome + exit gate.

## 8. Dependencies

`11-PRODUCT_SCOPE.md`, `15-MILESTONES.md`, `16-RELEASE_PLAN.md`, `docs/13-Future/*`.

## 9. Open Questions

- OQ-1: Indicative calendar timeframes per phase (deliberately omitted until team capacity is known).
- OQ-2: Whether caregiver sharing lands in Phase 1 or Phase 2.

## 10. Risks

- R-1: Date pressure forcing premature phase entry. Mitigation: exit-gate discipline (BR-1).
- R-2: Intelligence before continuity. Mitigation: sequencing principle (§4).
