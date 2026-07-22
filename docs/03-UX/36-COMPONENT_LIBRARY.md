# 36 — Component Library

| Field | Value |
|---|---|
| Document | Component Library |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `38-TYPOGRAPHY.md`, `40-ACCESSIBILITY.md`, `docs/04-Architecture/51-FRONTEND_ARCHITECTURE.md` |

---

## 1. Purpose

Catalogs the reusable UI components, their responsibilities, variants, states, props (conceptual), and accessibility requirements. It ensures a single, consistent, accessible set of building blocks (no duplicated component logic, P5) implemented in React within Astro (`docs/04-Architecture/51`).

## 2. Scope

Component inventory and contracts at a design level. Implementation details (framework specifics) live in frontend architecture; visual tokens in the design system.

## 3. Component Principles

- Consume **semantic tokens** only (`35` BR-1).
- Every interactive component implements the full state set incl. visible focus (`35` BR-4).
- Accessible by construction: roles, names, keyboard, contrast (`40`).
- Composable and single-responsibility; content-type-aware where they render medical content.

## 4. Foundation Components

| Component | Responsibility | Key variants / states | A11y notes |
|---|---|---|---|
| Button | Primary actions | primary/secondary/tertiary/destructive; loading/disabled | Role button; focus ring; ≥44px |
| Input / Field | Data entry | text/number/date/select; error/help/disabled | Labelled; error announced; units shown |
| Form | Grouped entry | validation summary; inline errors | Logical order; error linkage |
| Card | Container | default/interactive/emphasis | Interactive cards are buttons/links |
| Modal / Sheet | Focused task | bottom-sheet (mobile)/dialog | Focus trap; escape; return focus |
| Toast / Inline alert | Feedback | success/info/warning | Non-color cues; polite live region |
| Tabs / Segments | Sub-view switch | — | Roving tabindex; ARIA tabs |
| List / Timeline item | History rows | event types | Semantic list; readable order |
| Empty state | First-run/sparse | contextual copy | Explains purpose |
| Skeleton | Loading | — | aria-busy |

## 5. Domain Components

| Component | Responsibility | Notes |
|---|---|---|
| Metric tile | Current value + trend | Calm color; tap→chart; no diagnosis (`35` §8) |
| Trend chart | Chart.js line/area | current/previous/trend/prediction; reference bands; text alternative |
| Growth chart | WHO percentile plot | sex/age-correct curve; ±2SD band; corrected-age aware (`docs/02-Research/25`) |
| Reminder card | Upcoming item | gentle; deep-links |
| Knowledge card | Educational content | typed Educational; cites source; dismissible |
| Clinical-recommendation block | Guideline context | attributed; clinician-review affordance |
| Emergency-warning card | Red-flag info | **reserved** styling; curated-only; action-first (`docs/02-Research/28`) |
| Milestone item | Achieved/not-yet/not-sure | supportive; non-diagnostic |
| Vaccination row | Dose status | given/skipped/deferred; reminder |
| Report viewer | Lab/ultrasound artefact | secure; optional AI explanation (v2) |
| Context switcher | Pregnancy/Child/among children | continuity-preserving (`33` BR-2) |
| Timeline | Continuous event stream | append-only; grouped by life stage |

## 6. Content-Type-Aware Components (safety-critical)

Knowledge card, clinical-recommendation block, and emergency-warning card map 1:1 to the three content types and enforce their styling and disclaimers (`docs/02-Research/28`). These components require valid `content_type` + `source_ref` props and refuse to render medical content without them (BR-2 below).

## 7. Component States (standard set)

default · hover · focus (visible) · active · disabled · loading · error · empty. Defined once in `35`; every component conforms.

## 8. Business Rules

- BR-1: No component hard-codes primitive tokens or duplicates shared logic.
- BR-2: Content-type-aware components require `content_type` + (for medical claims) `source_ref`; otherwise they render an error/placeholder, never unlabeled medical content.
- BR-3: Charts provide a non-visual alternative (table/text) and non-color encodings.
- BR-4: Interactive components meet touch-target and focus-visibility requirements (`40`).

## 9. Edge Cases

- Very long values/labels: truncation with accessible full text.
- RTL/localisation: components must support mirroring and translated strings (future).
- Sparse/missing data in charts: show points, not fabricated lines.
- Emergency card must never be styled like a normal alert or reused (brand BR-1).

## 10. Acceptance Criteria

- [x] Foundation + domain components inventoried with responsibilities, variants, a11y.
- [x] Content-type-aware components enforce typing + source.
- [x] Standard state set applied; token/duplication rules stated.

## 11. Future Expansion

FAB/quick-add, search components, caregiver-scoped variants, clinician-portal components, charting enhancements (velocity, corrected-age toggles), and a Storybook-style living catalogue.

## 12. Dependencies

`35-DESIGN_SYSTEM.md`, `37`, `38`, `39`, `40`, `docs/04-Architecture/51-FRONTEND_ARCHITECTURE.md`, `docs/02-Research/28`.

## 13. Open Questions

- OQ-1: Component implementation approach (headless lib vs. bespoke) — see frontend architecture.
- OQ-2: Living catalogue tooling.

## 14. Risks

- R-1: Unlabeled medical content via a generic card. Mitigation: BR-2 typed components.
- R-2: Inaccessible charts. Mitigation: BR-3 alternatives.
