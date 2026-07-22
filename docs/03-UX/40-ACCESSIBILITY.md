# 40 — Accessibility

| Field | Value |
|---|---|
| Document | Accessibility Standard |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect / QA Architect |
| Last Updated | 2026-07-22 |
| Related | `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `38-TYPOGRAPHY.md`, `41-RESPONSIVE_RULES.md`, `docs/10-Testing/135-SECURITY_TESTS.md` |

---

## 1. Purpose

Defines the accessibility standard Wise Bloom Care must meet so the product works for users with disabilities and low health literacy — a health tool must be usable by everyone. Accessibility is a non-negotiable gate, not a nice-to-have (Principle P10).

## 2. Standard & Scope

- **Target: WCAG 2.2 Level AA** across all core user flows (`docs/01-Product/10-PRD.md` NFR-4).
- Applies to all interactive surfaces, content, charts, forms, navigation, and notifications.
- Covers visual, motor, auditory, cognitive, and situational impairments (incl. one-handed, tired, low-connectivity contexts).

## 3. Perceivable

- **Contrast:** text ≥4.5:1 (normal) / 3:1 (large); non-text UI ≥3:1 (`37` §7).
- **Not color-alone:** status, trends, and emergencies pair color with icon/label/shape.
- **Text alternatives:** informative images/icons have alt/accessible names; decorative ones are hidden.
- **Charts:** provide text/table alternatives and ARIA descriptions; non-color encodings (`35` §8).
- **Media:** captions/transcripts for any audio/video (future voice/education content).

## 4. Operable

- **Keyboard:** all functionality operable by keyboard; no traps; logical focus order; visible focus (`35` BR-4).
- **Touch targets:** ≥44×44px with adequate spacing (`33`, `39`).
- **Motion:** honour `prefers-reduced-motion`; no motion required to understand content; no seizure-inducing flashes.
- **Timing:** no time-limited actions on health-critical flows; reminders are gentle, not coercive.
- **Gestures:** any complex gesture has a simple alternative.

## 5. Understandable

- **Plain language:** low health-literacy-friendly copy (brand voice); jargon glossed.
- **Consistent navigation & labelling** (`32`, `33`; glossary terms).
- **Forms:** clear labels, help text, units, inline errors linked to fields; forgiving validation (P9).
- **Predictable:** no surprising context changes; content-type framing always clear (`docs/02-Research/28`).

## 6. Robust

- **Semantic HTML & ARIA:** correct roles, names, states; landmarks; live regions for async updates.
- **Assistive tech:** verified with screen readers (mobile + desktop) and OS scaling.
- **Progressive enhancement:** core content/actions work without heavy JS where feasible (Astro islands help).

## 7. Health-Context-Specific Rules

- Emergency-warning content must be perceivable by screen readers and not rely on color/icon alone (safety).
- Charts (vitals/growth) must be interpretable non-visually (table/summary).
- Anxiety-aware: avoid alarming patterns; calm, clear error/empty states.

## 8. Testing & Verification

- Automated checks (axe-style) in CI; manual audits per release; screen-reader walkthroughs of core flows (`docs/10-Testing/*`).
- Accessibility is a **release exit gate** (`docs/01-Product/16-RELEASE_PLAN.md`): core flows must pass AA.
- Include users with disabilities in UAT where possible (`docs/10-Testing/133-UAT.md`).

## 9. Business Rules

- BR-1: WCAG 2.2 AA is a hard gate for core flows; a failure blocks release.
- BR-2: No meaning by color/icon/shape alone.
- BR-3: All interactive elements keyboard-operable with visible focus and ≥44px targets.
- BR-4: Content respects OS text scaling and reflows to 200% without loss.
- BR-5: Charts and emergencies have accessible non-visual equivalents.

## 10. Acceptance Criteria

- [x] WCAG 2.2 AA target set across POUR with concrete rules.
- [x] Health-context specifics (emergencies, charts, anxiety-aware) included.
- [x] Verification method + release gate defined.

## 11. Future Expansion

Pursue AAA where feasible; add localisation/RTL accessibility; accessibility statement page; ongoing assistive-tech test matrix; user research with disabled parents.

## 12. Dependencies

`35`, `37`, `38`, `39`, `41`, `docs/10-Testing/*`, `docs/02-Research/28`.

## 13. Open Questions

- OQ-1: Screen-reader/device test matrix scope for v1.
- OQ-2: Availability of disabled participants for UAT.

## 14. Risks

- R-1: "Calm" design causing low contrast. Mitigation: BR-1 gate + `37` verification.
- R-2: Inaccessible charts/emergencies. Mitigation: BR-5 non-visual equivalents.
