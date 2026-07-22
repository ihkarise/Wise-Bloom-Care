# 38 — Typography

| Field | Value |
|---|---|
| Document | Typography |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`, `docs/00-Vision/04-BRAND_GUIDELINES.md` |

---

## 1. Purpose

Defines the typographic system: typeface intent, type scale, weights, line-heights, and readability/accessibility rules. Type must feel warm yet serious and be highly legible for tired, anxious readers.

## 2. Scope

Type tokens and rules consumed via the design system. Exact typeface selection is finalised in visual identity (OQ-1); rules here are binding regardless of the final face.

## 3. Typeface Intent

- A **humanist sans-serif** for UI and body: friendly, legible, calm (not corporate-cold, not childish).
- Optional a warmer display face for large headings/moments (journal, milestones) if it passes legibility.
- System-font fallback stack for performance and offline (future PWA).
- [PROPOSED] e.g., Inter / a humanist sans for UI; final choice per visual identity.

## 4. Type Scale [PROPOSED]

Modular, mobile-first (base 16px). Tokens are semantic (`text.display`, `text.h1…h3`, `text.body`, `text.small`, `text.caption`).

| Token | Size / line-height | Use |
|---|---|---|
| `text.display` | 32 / 40 | rare hero moments |
| `text.h1` | 24 / 32 | screen title |
| `text.h2` | 20 / 28 | section title |
| `text.h3` | 18 / 26 | card title |
| `text.body` | 16 / 26 | primary reading (generous line-height for calm) |
| `text.small` | 14 / 22 | secondary |
| `text.caption` | 12 / 18 | metadata, labels |

## 5. Weights

- Regular (400) body; Medium (500) emphasis/labels; Semibold (600) headings.
- Avoid ultra-thin weights (legibility/contrast).

## 6. Readability Rules

- Line length ~45–75 characters on larger screens (content max-width).
- Generous line-height (≥1.5 for body) — calm, accessible.
- Left-aligned body (LTR); support RTL mirroring (future).
- Never justify body text (rivers hurt readability).
- Plain language pairs with plain type (brand voice).

## 7. Accessibility Rules (mandatory)

- Respect user font-size / OS scaling; layouts must reflow, not clip, up to at least 200% (WCAG 2.2 AA reflow) — `40`.
- Minimum body size 16px; never below 12px for meaningful text.
- Sufficient contrast with backgrounds (`37` §7).
- Do not encode meaning by weight/size alone for critical status (pair with icon/label).

## 8. Content-Type Typography

- Educational: standard body.
- Clinical recommendation: attributed style (e.g., quote/label) — distinct but calm.
- Emergency warning: high-clarity, action-first; strong but within reserved styling (`docs/02-Research/28`, brand BR-1).

## 9. Business Rules

- BR-1: Type consumed via semantic tokens (`35` BR-1).
- BR-2: Body ≥16px; respect OS scaling and 200% reflow.
- BR-3: No meaning by type alone for critical status.
- BR-4: Typeface must include required language glyphs before entering a market (localisation).

## 10. Acceptance Criteria

- [x] Type scale, weights, line-heights defined as semantic tokens.
- [x] Readability + accessibility (scaling, reflow, min size, contrast) mandated.
- [x] Content-type typography addressed.

## 11. Future Expansion

Finalise typeface(s); add localisation/script coverage; variable-font optimisation; dark-theme adjustments; clinician-portal type.

## 12. Dependencies

`35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`.

## 13. Open Questions

- OQ-1: Final typeface selection and licensing.
- OQ-2: Script/language coverage for first markets.

## 14. Risks

- R-1: Poor legibility for tired users. Mitigation: generous sizing/line-height, BR-2.
- R-2: Missing glyphs in a market. Mitigation: BR-4 pre-market check.
