# 32 — Information Architecture

| Field | Value |
|---|---|
| Document | Information Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Information Architect |
| Last Updated | 2026-07-22 |
| Related | `33-NAVIGATION.md`, `34-DASHBOARD_SPEC.md`, `docs/01-Product/13-MODULE_BREAKDOWN.md`, `docs/08-Timeline/*` |

---

## 1. Purpose

Defines how information is organised, labelled, and related across Wise Bloom Care so users can find what they need with minimal effort. The IA encodes the continuity thesis structurally: pregnancy and child content are branches of **one journey**, not separate apps.

## 2. Scope

Content hierarchy, primary sections, labelling/taxonomy, and the relationship between the Dashboard, Timeline, and modules. Visual navigation patterns are in `33-NAVIGATION.md`; screen layout in `34-DASHBOARD_SPEC.md`.

## 3. Organising Principles

- **Timeline-first & dashboard-first:** the two anchors. The Dashboard answers "what now?"; the Timeline answers "what happened / what's coming?".
- **One journey, two contexts:** a single family record presents a *Pregnancy context* and, after delivery, a *Child context* — switchable but never separate records.
- **Progressive disclosure:** surface the essential; reveal depth on demand (calm, low-overwhelm).
- **Single source of truth:** each fact appears in one authoritative place; other surfaces reference it.

## 4. Top-Level Structure

```
Home (Dashboard)
Timeline (continuous journey)
Pregnancy  [context]
  ├─ Vitals (BP, weight, weight gain, blood sugar)
  ├─ Nutrition
  ├─ Exercise
  ├─ Medicines
  ├─ Appointments
  ├─ Reports (Lab, Ultrasound)
  └─ Week Knowledge
Child  [context — appears after delivery]
  ├─ Baby Profile
  ├─ Growth (WHO charts)
  ├─ Milestones (CDC)
  ├─ Vaccination
  ├─ Feeding & Sleep
  └─ Journal
Family (caregivers)
AI Assistant
Notifications
Settings (profile, privacy, notifications, export)
```

## 5. Context Model (continuity)

- Before delivery: **Pregnancy** context is primary; **Child** context is hidden/not-yet.
- At delivery (J4): **Child** context activates automatically, permanently linked; **Pregnancy** transitions into a postpartum/history view.
- After delivery: both contexts coexist — postpartum (maternal recovery) and child care run in parallel; the user can move between them; the Timeline shows both interleaved as one continuous stream.
- Multiple children: each child is a selectable sub-context under **Child**, all linked to the same maternal record.

## 6. Labelling & Taxonomy

- Use ubiquitous-language terms (`docs/00-Vision/05-GLOSSARY.md`) consistently as labels.
- Avoid clinical jargon in navigation labels; prefer plain, warm words ("Growth", "Milestones", "Reports").
- Content-type badges (Educational / Clinical / Emergency) are a cross-cutting taxonomy applied to content items, not a navigation section.
- Life-stage tags (pregnancy week, child age) contextualise content and timeline entries.

## 7. Relationships & Cross-Linking

- Timeline events link back to their owning module detail (e.g., a vitals event → the vitals chart).
- Dashboard cards deep-link into modules and the timeline.
- Knowledge content is cross-linked by life stage (pregnancy week, child age) and by topic; emergency-warning cards are linked but visually separated (`docs/02-Research/28`).
- Reports link to any AI explanation (v2) and to the timeline entry for the visit.

## 8. Findability Rules

- Any core action reachable within ≤2 taps from the Dashboard.
- Search across timeline/records (v2) respects privacy and never leaks across families.
- Empty/first-run states explain what a section is for (educational, calm).

## 9. Business Rules

- BR-1: Pregnancy and Child are contexts of one record; the IA never presents them as separate accounts.
- BR-2: The Child context is created only by the delivery event (Vision BR-V2).
- BR-3: Every content item surfaced carries its content-type taxonomy.
- BR-4: Navigation labels use glossary-approved terms.

## 10. Edge Cases

- Pre-delivery: Child context must be cleanly absent, not a broken/empty tab.
- Loss path: Child context is not created; history remains accessible compassionately.
- Multiple children/pregnancies over time: context switching must remain simple and unambiguous.
- Caregiver view: same IA, scoped by granted access.

## 11. Acceptance Criteria

- [x] Top-level structure defined and mapped to modules.
- [x] Continuity encoded via the two-context, one-record model.
- [x] Labelling tied to glossary; content-type taxonomy applied cross-cuttingly.
- [x] Findability and cross-linking rules stated.

## 12. Future Expansion

Add clinician-portal IA, search/filter across the journey, multi-child scaling patterns, and additional life-stage contexts toward the lifetime platform.

## 13. Dependencies

`33-NAVIGATION.md`, `34-DASHBOARD_SPEC.md`, `docs/00-Vision/05-GLOSSARY.md`, `docs/08-Timeline/*`.

## 14. Open Questions

- OQ-1: How to present multiple children in navigation (switcher vs. list) — pending multi-child v1 decision.
- OQ-2: Whether AI Assistant is a top-level section or a persistent affordance.

## 15. Risks

- R-1: IA implying two separate apps. Mitigation: BR-1 one-record contexts.
- R-2: Overloaded navigation. Mitigation: progressive disclosure; ≤2-tap rule.
