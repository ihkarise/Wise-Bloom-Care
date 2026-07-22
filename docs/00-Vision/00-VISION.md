# 00 — Product Vision

| Field | Value |
|---|---|
| Document | Product Vision |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `01-PRODUCT_MANIFESTO.md`, `02-MISSION.md`, `docs/01-Product/10-PRD.md`, `docs/08-Timeline/110-PREGNANCY_TIMELINE.md` |

---

## 1. Purpose

This document defines the long-term product vision for **Wise Bloom Care**. It exists to give every contributor — engineer, designer, clinician-reviewer, and stakeholder — a single, durable statement of *what we are building, why it matters, and the shape it must eventually take*. Every other document in this repository is downstream of this one. When a design decision, scope trade-off, or prioritisation call is ambiguous, this document is the tie-breaker.

This is not a marketing document and not a specification. It is the north star that keeps a multi-year healthcare platform coherent as teams, technologies, and requirements change.

## 2. The Vision Statement

> **Wise Bloom Care is a premium, privacy-first Mother & Child Health platform that preserves one continuous health record across the entire family journey — from conception, through pregnancy, delivery, and newborn care, into infancy, toddlerhood, and lifelong child health — so that no clinically meaningful moment is ever lost, fragmented, or duplicated.**

The defining idea is **continuity**. Most consumer health apps model a pregnancy as a project that ends at delivery and a baby as a separate, unrelated record that begins at birth. Wise Bloom Care rejects that break. The mother's pregnancy timeline and the child's growth timeline are two views of **one linked family health record**. At delivery, the baby profile is created automatically and permanently linked to the mother's record. The timeline does not restart; it continues.

## 3. Why This Product Exists (Problem Framing)

### 3.1 The fragmentation problem
Expecting families interact with a scattered set of tools: a pregnancy week-tracker, a separate paper "mother & child" booklet issued by a clinic, a vaccination card, a growth chart in a paediatrician's file, lab PDFs in email, and ultrasound images on a phone. None of these share a spine. When a family switches clinics, moves cities, or simply loses the paper booklet, history is lost.

### 3.2 The discontinuity problem
The moment of delivery is the single most information-rich transition in maternal-child health, yet it is exactly where consumer tools reset. Birth weight, gestational age at birth, delivery mode, and Apgar are the *first* data points of the child's life and the *last* of the pregnancy — they belong to both timelines. A platform that cannot hold both sides of that transition cannot claim continuity.

### 3.3 The trust problem
Health information online is abundant and frequently wrong, alarmist, or commercially motivated. Families cannot easily tell an educational fact from a clinical recommendation from an emergency warning. Wise Bloom Care must make that distinction structurally unmistakable (see `docs/02-Research/28-MEDICAL_DISCLAIMER.md`).

### 3.4 The premium gap
Existing tools are either clinical-grade but hostile to consumers, or consumer-friendly but shallow and ad-driven. There is an unserved space for a product that feels calm, warm, and premium *and* is architected with the seriousness of clinical software.

## 4. The One-Journey Model

```
Conception
   │
Pregnancy  ── vitals · nutrition · exercise · appointments · lab & ultrasound reports
   │
Delivery   ── the linked transition: last pregnancy event + first child event
   │
Postpartum ── maternal recovery + newborn care, running in parallel
   │
Newborn
   │
Infancy    ── growth (WHO) · feeding · sleep · developmental milestones · vaccination
   │
Toddler
   │
Child Health
   │
Lifetime Family Health Platform (future)
```

Two invariants define the model and must never be violated:

1. **One health record, not many.** A family is a single record graph. A mother is a node; each child is a node linked to her. There is no "export pregnancy, import into baby app" step. There is no migration.
2. **The timeline is append-only and continuous.** Events are added, never silently replaced. History is always retrievable. The delivery event is the hinge that joins the two views, not a wall between two products.

## 5. Vision Pillars

| Pillar | What it means | Where it is enforced |
|---|---|---|
| **Continuity** | One linked record from conception onward; no resets, no duplicate profiles. | `docs/05-Data`, `docs/08-Timeline` |
| **Trust & Safety** | Educational vs. clinical vs. emergency content never mixed; AI never diagnoses. | `docs/07-AI/105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |
| **Privacy-first** | Private repo, private data store, role-based access, GDPR/HIPAA-friendly design. | `docs/09-Security` |
| **Premium calm** | Minimal, warm, medical, calming UX; timeline-first and dashboard-first. | `docs/03-UX` |
| **Modularity** | Backend can migrate (Sheets → Postgres/Supabase/Firebase) without a frontend rewrite. | `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md` |
| **Evidence-grounded** | Content references WHO, ACOG, FIGO, NICE, CDC; facts are never invented. | `docs/02-Research` |
| **Longevity** | Designed as a multi-year platform, not a single-season pregnancy tracker. | This document, `docs/13-Future` |

## 6. Scope of the Vision

### 6.1 In scope (the platform we are committing to)
- A continuous maternal → child health record for a family unit.
- Pregnancy tracking: vitals (BP, weight, weight-gain, blood sugar), nutrition, exercise, medicine tracking, appointments, lab & ultrasound reports, week-by-week knowledge.
- The delivery transition and automatic, permanent creation of the linked baby profile.
- Postpartum (maternal) and newborn (infant) care running in parallel.
- Child growth on WHO standards, developmental milestones, vaccination schedule, feeding, sleep, journal.
- A family dashboard, notifications, settings, and an educational AI assistant.
- Analytics and a trend/prediction engine that surfaces (never prescribes).

### 6.2 Explicitly out of scope for the vision (see `docs/01-Product/17-NON_GOALS.md`)
- Diagnosis, prescribing, or any emergency decision-making.
- Replacing the clinician relationship or the medical record of record.
- Telemedicine, e-commerce, or social networking as core identity.

### 6.3 Future scope (see `docs/13-Future`)
- Doctor / clinician portal.
- Offline-first PWA.
- Multi-child, multi-caregiver family graphs at scale.
- Additional life stages beyond early childhood.

## 7. Target Users (summary)

The primary user is the **expecting or new mother**. Secondary users include partners/caregivers (family dashboard) and, in future phases, clinicians (doctor portal). Full personas live in `docs/03-UX/30-USER_PERSONAS.md`; this document only asserts that the mother's continuous journey is the organising principle around which all personas are arranged.

## 8. Success Definition (Vision-level)

We will know the vision is being realised when:

- A family can view a single, unbroken timeline that spans from an early pregnancy vital to a toddler vaccination, with no gap at delivery.
- Zero duplicate or orphaned profiles are created across the mother→child transition.
- Users can always distinguish educational information from clinical recommendation from emergency warning without training.
- The backend datastore can be swapped without changing a single frontend component contract.
- Clinician reviewers can trace any surfaced medical statement to a cited, reputable source.

Concrete, measurable KPIs and acceptance thresholds are defined in `docs/01-Product/10-PRD.md` and `docs/10-Testing/130-TEST_PLAN.md`; they must remain consistent with the definition above.

## 9. Guiding Principles (see `03-PRODUCT_PRINCIPLES.md` for the full set)

1. One journey, one record — continuity over convenience.
2. Educate, never diagnose.
3. Calm over clever — the product should lower a user's anxiety, not raise it.
4. Privacy is a feature, not a setting.
5. Single source of truth — no duplicated data, no duplicated logic.
6. Design for migration — today's storage is an implementation detail.
7. Evidence or nothing — never invent a medical fact.

## 10. Non-Functional North Stars

- **Modular & migratable:** frontend depends on an API contract, not on Google Sheets.
- **Scalable:** the data model must not assume one child, one caregiver, or one device.
- **Mobile-first & offline-capable (future):** the majority of use is on a phone, often with poor connectivity.
- **Secure & auditable:** every access to health data is authorised and logged.
- **Maintainable & documented:** every module is specified before it is built.

## 11. Business Rules (Vision-level invariants)

- BR-V1: A child record MUST always reference exactly one maternal record it originated from; that link is immutable once delivery is recorded.
- BR-V2: The system MUST NOT create a second profile for the same child; the delivery event is the sole creator of the child profile.
- BR-V3: Timeline events MUST be append-only; corrections are new, attributed, versioned events, never destructive edits (see `docs/05-Data/77-VERSIONING.md`).
- BR-V4: Any AI or automated output that touches medical judgement MUST carry a clinician-review recommendation and MUST NOT prescribe or diagnose.
- BR-V5: Content MUST be typed as Educational, Clinical Recommendation, or Emergency Warning and MUST NOT be visually or semantically mixed.

## 12. Edge Cases the Vision Must Withstand

- Pregnancy loss (miscarriage, stillbirth, termination): the timeline must handle a compassionate, non-erasing end state without forcing a baby profile. (Detailed in `docs/06-Modules/88-DELIVERY_MODULE.md`.)
- Multiple births (twins/triplets): one delivery event links multiple child nodes to one mother.
- Multiple pregnancies over time for the same mother.
- A child cared for by multiple caregivers; a caregiver caring for multiple children.
- Data entered retrospectively (e.g., a user joining at 30 weeks or after birth).

The vision does not solve these here; it *commits* that the architecture must not make them impossible.

## 13. Acceptance Criteria for This Document

- [x] States a single, unambiguous vision statement.
- [x] Defines the one-journey / one-record model and its invariants.
- [x] Names the vision pillars and maps each to an enforcing document.
- [x] Distinguishes in-scope, out-of-scope, and future scope.
- [x] Establishes vision-level business rules and hard edge cases.
- [x] Is consistent with the master brief (continuity, privacy, AI-as-educator, migratable backend).

## 14. Future Expansion

The architecture must accommodate, without redesign: a clinician portal, offline PWA, multi-family/household graphs, wearable and device integrations, richer prediction, and additional life stages beyond toddlerhood — ultimately a **lifetime family health platform**. See `docs/13-Future/162-LONG_TERM_VISION.md`.

## 15. Dependencies

- Medical grounding: `docs/02-Research/*` (WHO, ACOG, FIGO, NICE, CDC).
- Data continuity model: `docs/05-Data/71-ENTITY_RELATIONSHIP.md`.
- Timeline mechanics: `docs/08-Timeline/*`.
- Safety framing: `docs/07-AI/105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

## 16. Open Questions

- OQ-1: What is the minimum viable "family unit" for v1 — single mother + single child, or mother + multiple children from the start? (Impacts data model complexity; see PRD.)
- OQ-2: Does v1 include any caregiver sharing, or is the family dashboard read-only for a single account holder initially?
- OQ-3: Jurisdiction of first launch (affects immunization schedule defaults and privacy regime — GDPR vs. local). See `docs/02-Research/24-GOVT_IMMUNIZATION.md`.

## 17. Risks

- R-1: **Scope gravity** — continuity tempts us to build everything at once. Mitigation: phased release plan (`docs/01-Product/16-RELEASE_PLAN.md`).
- R-2: **Medical liability** — surfacing anything that reads as advice. Mitigation: strict content typing and guardrails.
- R-3: **Storage lock-in** — building tightly to Google Sheets. Mitigation: enforced API-contract boundary (`docs/04-Architecture/52-BACKEND_ARCHITECTURE.md`).
- R-4: **Emotional harm** — mishandling loss/complication flows. Mitigation: compassionate-design review as an explicit acceptance gate.
