# 37 — Color System

| Field | Value |
|---|---|
| Document | Color System |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `35-DESIGN_SYSTEM.md`, `38-TYPOGRAPHY.md`, `40-ACCESSIBILITY.md`, `docs/00-Vision/04-BRAND_GUIDELINES.md` |

---

## 1. Purpose

Defines the color system: primitive palette, semantic color tokens, usage rules, and accessibility constraints. Color must express the premium-calm brand while never becoming the sole signal of meaning and always meeting WCAG contrast. Values below are the **initial design proposal** (marked [PROPOSED]); final values are ratified during visual identity work (OQ-1) but must satisfy the rules here regardless.

## 2. Scope

Palette and semantic mapping. Consumed via semantic tokens per `35`. Emergency styling reservation per `docs/00-Vision/04-BRAND_GUIDELINES.md` BR-1.

## 3. Palette Intent

Warm, natural, low-saturation base evoking calm and "bloom": warm neutrals, gentle greens (growth), soft rose (warmth). Restrained accents for action. A single reserved alert hue for genuine emergencies only.

## 4. Primitive Palette [PROPOSED]

> Illustrative starting values; must pass §7 contrast before use.

| Token | Value | Notes |
|---|---|---|
| `neutral.50…900` | warm greys (e.g., `#FAF8F5` → `#1F1B18`) | surfaces & text |
| `sage.100…700` | gentle green (e.g., `#EAF1EA` → `#3E6B4F`) | growth/positive, primary accent candidate |
| `rose.100…700` | soft rose (e.g., `#FBEEF0` → `#9E4B5A`) | warmth, highlights |
| `sky.100…700` | calm blue (e.g., `#EAF1F7` → `#2F5D80`) | info/links |
| `amber.100…700` | soft amber | non-emergency caution |
| `alert.100…700` | reserved emergency red (e.g., `#FCEBEA` → `#B3261E`) | **emergency only** |

## 5. Semantic Tokens

| Semantic token | Maps to (intent) |
|---|---|
| `color.surface` / `surface.raised` | neutral.50 / white |
| `color.text.primary` / `.secondary` | neutral.900 / neutral.600 |
| `color.action` / `action.hover` | sage.600 / sage.700 (primary action) |
| `color.link` | sky.600 |
| `color.positive` | sage.600 (trend up/good) |
| `color.caution` | amber.600 (non-emergency) |
| `color.alert.emergency` | alert.600 (**reserved**) |
| `color.chart.[1..n]` | calm categorical set (non-alarming) |
| `color.focus` | high-contrast focus ring |
| `color.border` | neutral.200 |

## 6. Usage Rules

- Components use **semantic** tokens only (`35` BR-1).
- **Emergency** color (`color.alert.emergency`) is reserved for curated emergency content (brand BR-1); never for decoration, non-emergency warnings, or trend "bad" states.
- Non-emergency caution uses `color.caution` (amber), not the emergency red.
- Charts use the calm categorical set and **never** encode meaning by color alone (`35` §8, BR-3).
- Gender-neutral: no pink/blue defaults for the child (brand BR-3).

## 7. Accessibility Constraints (mandatory)

- Text contrast ≥ **4.5:1** (normal) / **3:1** (large) — WCAG 2.2 AA (`40`).
- Non-text UI (icons, focus, borders) ≥ **3:1**.
- Never color-alone: pair with icon/label/shape (esp. status, trends, emergencies).
- Verify all semantic pairings in light (and future dark) themes before ship.

## 8. Theming

- Light theme primary; dark theme (future) redefines primitives behind the same semantic tokens.
- All themes must pass §7.

## 9. Business Rules

- BR-1: Only semantic tokens in components.
- BR-2: Emergency hue reserved for curated emergencies.
- BR-3: Every semantic text/background pairing passes AA contrast, verified.
- BR-4: No color-alone meaning.

## 10. Acceptance Criteria

- [x] Primitive palette + semantic mapping defined (proposed values flagged).
- [x] Reserved emergency color rule stated.
- [x] AA contrast + non-color-alone constraints mandated.
- [x] Gender-neutral default rule included.

## 11. Future Expansion

Finalise ratified values in visual identity; add dark theme; clinician-portal palette; verified token export with contrast metadata.

## 12. Dependencies

`35-DESIGN_SYSTEM.md`, `40-ACCESSIBILITY.md`, `docs/00-Vision/04-BRAND_GUIDELINES.md`, `docs/02-Research/28`.

## 13. Open Questions

- OQ-1: Final ratified hex values (visual identity).
- OQ-2: Dark theme timing.

## 14. Risks

- R-1: Calm palette failing contrast. Mitigation: BR-3 verification gate.
- R-2: Emergency red overuse diluting urgency. Mitigation: BR-2 reservation.
