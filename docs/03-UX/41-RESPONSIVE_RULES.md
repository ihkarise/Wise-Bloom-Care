# 41 — Responsive Rules

| Field | Value |
|---|---|
| Document | Responsive Design Rules |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `33-NAVIGATION.md`, `34-DASHBOARD_SPEC.md`, `35-DESIGN_SYSTEM.md`, `40-ACCESSIBILITY.md` |

---

## 1. Purpose

Defines how Wise Bloom Care adapts across screen sizes and input modes, mobile-first. The majority of use is one-handed on a phone, often on poor connectivity; larger screens are enhancements, not the design center (Principle P8).

## 2. Scope

Breakpoints, layout adaptation, navigation transformation, touch/pointer rules, and performance-on-mobile constraints. Offline (PWA) specifics are future (`docs/13-Future`), but the design must not preclude them.

## 3. Breakpoints [PROPOSED]

| Name | Range | Target |
|---|---|---|
| `xs` | < 360px | small/old phones |
| `sm` | 360–599px | phones (primary) |
| `md` | 600–899px | large phones / small tablets |
| `lg` | 900–1199px | tablets / small laptops |
| `xl` | ≥1200px | desktop |

Design and test **phone-first** (`sm`); scale up.

## 4. Layout Adaptation

- **Single-column** on phones; content stacks with generous spacing.
- **Multi-column / split views** emerge at `lg`/`xl` (e.g., Dashboard + Timeline side-by-side).
- **Content max-width** on large screens for readability (`38` line-length rule); avoid full-bleed text.
- Fluid grids and relative units; no fixed pixel layouts that clip on scaling.

## 5. Navigation Transformation

- Phones: bottom navigation bar (thumb zone) (`33`).
- `lg`/`xl`: bottom bar → left rail; secondary nav → persistent sidebar/split.
- Context switcher remains reachable at all sizes (continuity).

## 6. Touch, Pointer & Input

- Touch targets ≥44×44px; spacing to prevent mis-taps (`40`).
- One-handed reach: primary actions in the thumb zone on phones.
- Support pointer/keyboard on larger screens without regressing touch.
- Inputs use appropriate mobile keyboards (numeric for vitals, date pickers).

## 7. Media & Charts

- Images/charts `max-width:100%`, scalable; charts remain legible and accessible at all sizes (`35`, `40`).
- Wide content (tables/charts) scrolls within its own container; the page body never scrolls horizontally.

## 8. Performance on Mobile (constraints)

- Mobile-first performance budget (`docs/01-Product/10-PRD.md` NFR-1); minimise JS via Astro islands (`docs/04-Architecture/51`).
- Optimise images; lazy-load non-critical; skeletons over spinners.
- Design for intermittent connectivity: graceful loading/empty states; future offline queueing must fit the layout.

## 9. Orientation & Scaling

- Support portrait (primary) and landscape without breakage.
- Reflow to 200% text zoom without loss of content/function (`40` BR-4).
- Respect safe areas/notches.

## 10. Business Rules

- BR-1: Phone (`sm`) is the design and test baseline.
- BR-2: No horizontal body scroll; wide content scrolls in its own container.
- BR-3: Touch targets ≥44px; primary actions thumb-reachable on phones.
- BR-4: Layouts reflow (not clip) up to 200% zoom and across orientations.
- BR-5: Larger-screen layouts are enhancements; no feature is desktop-only.

## 11. Acceptance Criteria

- [x] Breakpoints and phone-first baseline defined.
- [x] Layout + navigation transformation specified.
- [x] Touch/pointer, media, performance, and scaling rules stated.

## 12. Future Expansion

Offline PWA layout behaviours; foldable/large-tablet optimisations; clinician-portal responsive patterns; container queries as support matures.

## 13. Dependencies

`33-NAVIGATION.md`, `34-DASHBOARD_SPEC.md`, `35-DESIGN_SYSTEM.md`, `40-ACCESSIBILITY.md`, `docs/04-Architecture/51-FRONTEND_ARCHITECTURE.md`.

## 14. Open Questions

- OQ-1: Final breakpoint values (visual identity/engineering).
- OQ-2: Minimum supported device/OS matrix.

## 15. Risks

- R-1: Desktop-biased design breaking on phones. Mitigation: BR-1 phone-first.
- R-2: Horizontal scroll/clipping on small screens. Mitigation: BR-2/BR-4.
