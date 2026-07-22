# 35 — Design System

| Field | Value |
|---|---|
| Document | Design System |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `36-COMPONENT_LIBRARY.md`, `37-COLOR_SYSTEM.md`, `38-TYPOGRAPHY.md`, `39-ICONOGRAPHY.md`, `40-ACCESSIBILITY.md`, `docs/00-Vision/04-BRAND_GUIDELINES.md` |

---

## 1. Purpose

Defines the foundational design system: the token architecture, spacing, elevation, motion, data-visualisation principles, and the rules that make every surface feel like one calm, premium product. It is the umbrella under which color, typography, iconography, and components are specified.

## 2. Scope

Design tokens (semantic layer), spacing/layout scale, radius/elevation, motion, states, and data-viz principles (Chart.js usage). Exact color values → `37`; type scale → `38`; icons → `39`; component specs → `36`.

## 3. Token Architecture

Two layers, to support theming and future white-labelling:
- **Primitive tokens:** raw values (e.g., `color.rose.500`, `space.4`). Defined in `37`/`38`.
- **Semantic tokens:** intent-based aliases the UI consumes (e.g., `color.surface`, `color.text.primary`, `color.action`, `color.alert.emergency`, `space.section`). Components reference **semantic** tokens only.

Rule: components never hard-code primitives; only semantic tokens. This enables theme changes and accessibility fixes in one place (single source of truth, P5).

## 4. Spacing & Layout Scale

- Base unit: **4px**; scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Generous whitespace (calm); one primary focus per screen.
- Layout grid: fluid, mobile-first; content max-width on large screens for readability (`41-RESPONSIVE_RULES.md`).

## 5. Radius & Elevation

- Radius: soft, rounded (e.g., `radius.sm` 8, `radius.md` 12, `radius.lg` 16) — warm, non-clinical.
- Elevation: subtle, low-contrast shadows; premium calm, not heavy material.

## 6. Motion

- Purposeful, gentle, fast (respect reduced-motion). Durations ~150–250ms; easing calm.
- Motion communicates continuity (e.g., timeline transitions) — never anxiety-inducing.
- `prefers-reduced-motion` fully honoured (`40-ACCESSIBILITY.md`).

## 7. Interaction States

Every interactive component defines: default, hover, focus (visible focus ring — accessibility), active, disabled, loading, error. States use shape/label + color, never color alone.

## 8. Data Visualisation (Chart.js)

Charts are core (vitals, growth). Principles:
- **Calm, not alarming:** neutral palette; no red-by-default; trend direction shown by shape/label + subtle color.
- **Current / previous / trend / prediction:** the four canonical views; prediction (v2) is visually distinct and labelled as an estimate.
- **Reference bands:** WHO/ACOG bands shown as gentle shaded ranges with clear "reference — discuss with clinician" labelling; out-of-band handled calmly (`docs/02-Research/25`, `21`).
- **No diagnosis in captions** (`docs/02-Research/28`).
- **Accessible charts:** provide text/table alternatives, sufficient contrast, non-color encodings, and ARIA descriptions (`40-ACCESSIBILITY.md`).
- **Sparse data:** never fabricate a line; show points and invite more data.

## 9. Content-Type Styling (safety-critical)

Three reserved visual treatments map to the three content types (`docs/02-Research/28`):
- **Educational:** neutral surface, standard type.
- **Clinical Recommendation:** subtly distinguished (e.g., quoted/attributed style) with source + clinician-review affordance.
- **Emergency Warning:** reserved alert styling (distinct, high-clarity), used **only** for curated emergencies (brand BR-1). Never reused decoratively.

## 10. Theming

- Light theme is primary; dark/other themes are additive via semantic tokens.
- All themes must pass accessibility contrast (`40`).
- Future white-label/clinician theming enabled by the token layer.

## 11. Business Rules

- BR-1: Components consume semantic tokens only.
- BR-2: Emergency styling is reserved for curated emergency content.
- BR-3: Charts never encode meaning by color alone and never diagnose.
- BR-4: Every interactive component implements the full state set incl. visible focus.

## 12. Acceptance Criteria

- [x] Two-layer token architecture defined.
- [x] Spacing, radius, elevation, motion scales set.
- [x] Data-viz and content-type styling principles specified (calm, accessible, non-diagnostic).
- [x] Theming and state rules stated.

## 13. Future Expansion

Design-token export (e.g., JSON/Style Dictionary) shared with code; dark theme; clinician-portal theme; motion library; component analytics.

## 14. Dependencies

`36`, `37`, `38`, `39`, `40`, `41`, `docs/00-Vision/04-BRAND_GUIDELINES.md`, `docs/02-Research/28`.

## 15. Open Questions

- OQ-1: Dark theme in v1 or later.
- OQ-2: Token export/tooling choice (Style Dictionary vs. custom).

## 16. Risks

- R-1: Inconsistent surfaces from hard-coded values. Mitigation: BR-1 semantic-only.
- R-2: Alarming charts. Mitigation: BR-3 calm, non-color, non-diagnostic.
