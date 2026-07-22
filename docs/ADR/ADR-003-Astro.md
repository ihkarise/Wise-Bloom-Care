# ADR-003 — Use Astro + React + TypeScript + Tailwind for the Frontend

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-07-22 |
| Deciders | Enterprise Architect, UX Architect |
| Related | `docs/04-Architecture/51-FRONTEND_ARCHITECTURE.md`, `docs/03-UX/35-DESIGN_SYSTEM.md` |

---

## 1. Context
The frontend must be fast on mid-range phones and poor networks (mobile-first, NFR-1), accessible (WCAG 2.2 AA), maintainable, and decoupled from the backend/storage. It must support interactive charts (vitals/growth) and a premium, calm UI, with a path to an offline PWA later.

## 2. Decision
Build the frontend with **Astro** (islands architecture) + **React** (interactive islands) + **TypeScript** + **Tailwind CSS**, with **Chart.js** for charts. All backend calls go through a single typed API client (`api/`); components consume semantic design tokens only (`docs/03-UX/35`).

## 3. Rationale
- **Astro islands** ship minimal JS → fast on mobile/poor networks; content-first with interactivity where needed.
- **React** for rich interactions (forms, dashboards, charts); large ecosystem.
- **TypeScript** for type-safe domain models mirrored from the API contract.
- **Tailwind** for consistent, token-bound styling.
- **Chart.js** for the required calm, accessible charts.
- Architecture supports a future PWA/service worker without restructuring.

## 4. Consequences
### Positive
- Excellent mobile performance; accessible; maintainable; storage-decoupled.
### Negative / Risks
- Islands model requires discipline about what hydrates (perf budget) → enforced in CI (`docs/10-Testing/134`).
- Charting accessibility needs explicit non-visual alternatives (`docs/03-UX/40`).

## 5. Alternatives Considered
- **Next.js/React SPA:** heavier JS by default; more work to hit mobile budgets.
- **SvelteKit:** strong perf, smaller ecosystem/team familiarity.
- **Plain SSR templates:** simpler but weaker for rich interactivity/charts.

## 6. Compliance & Safety Notes
- Frontend holds no secrets; medical content only via content-type-aware components (`docs/03-UX/36`).
- Accessibility is a release gate (`docs/03-UX/40`).

## 7. Review Trigger
Revisit if mobile performance budgets can't be met, PWA/offline needs force changes, or team/ecosystem considerations shift.
