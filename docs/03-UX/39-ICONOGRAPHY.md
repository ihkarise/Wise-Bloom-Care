# 39 — Iconography

| Field | Value |
|---|---|
| Document | Iconography |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`, `36-COMPONENT_LIBRARY.md` |

---

## 1. Purpose

Defines the icon system: style, grid, usage, accessibility, and the special handling of status/emergency icons. Icons reinforce meaning (never replace text labels for critical actions) and maintain the calm, premium, rounded aesthetic.

## 2. Scope

Icon style, sizing, semantics, and accessibility. Icon selection library and asset pipeline are finalised in visual identity (OQ-1).

## 3. Style

- **Rounded, consistent stroke** (soft, warm, non-clinical), single-weight, geometric-humanist.
- Line (outline) icons as default; filled variants for active/selected states.
- Optical alignment on a consistent grid (e.g., 24px) with safe padding.
- Cohesive family — one library, not mixed sources (consistency).

## 4. Sizing

- Standard sizes: 16, 20, 24 (default), 32 (feature).
- Touch targets around icon-only controls ≥ 44×44px (`40`).

## 5. Semantics & Usage

- Icons **support** labels; icon-only controls must have accessible names (`aria-label`).
- Consistent metaphor per concept (one icon = one meaning) tied to the glossary/IA.
- Status icons pair with color + text (never color/icon alone for critical status).
- Life-stage and module icons are consistent across Dashboard, Navigation, Timeline.

## 6. Status & Emergency Icons (safety-critical)

- Non-emergency states use calm icons + `color.caution`.
- **Emergency** uses a distinct, reserved icon + reserved emergency color, only within emergency-warning components (`docs/02-Research/28`, brand BR-1). Never reused decoratively.
- Trends (up/down/stable) use directional icons **plus** text so meaning isn't color-only (`35` §8).

## 7. Accessibility Rules (mandatory)

- Decorative icons: `aria-hidden`; informative icons: accessible name.
- Do not convey critical meaning by icon alone — pair with text.
- Sufficient contrast for informative icons (≥3:1, `37`).
- Scalable (SVG) to respect zoom/scaling.

## 8. Delivery

- SVG, inlined or sprite; optimised; themeable via `currentColor`/semantic tokens.
- Bundle-conscious (performance, offline-ready).

## 9. Business Rules

- BR-1: One icon library; consistent style/grid.
- BR-2: Icon-only controls have accessible names and ≥44px targets.
- BR-3: Emergency icon reserved for curated emergencies.
- BR-4: No critical meaning by icon alone (pair with text/color).

## 10. Acceptance Criteria

- [x] Style, grid, sizing defined.
- [x] Semantics + status/emergency handling specified.
- [x] Accessibility (names, contrast, non-icon-alone) mandated.

## 11. Future Expansion

Finalise icon library; add localised/culturally-appropriate metaphors; illustration set for empty/celebration states; animated (reduced-motion-safe) icons.

## 12. Dependencies

`35-DESIGN_SYSTEM.md`, `36-COMPONENT_LIBRARY.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`.

## 13. Open Questions

- OQ-1: Icon library selection (e.g., a rounded set) vs. bespoke.
- OQ-2: Illustration style for celebratory milestone moments.

## 14. Risks

- R-1: Inconsistent/mixed icons. Mitigation: BR-1 single library.
- R-2: Icon-only ambiguity for critical actions. Mitigation: BR-4 pairing.
