# 51 — Frontend Architecture

| Field | Value |
|---|---|
| Document | Frontend Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `50-SYSTEM_ARCHITECTURE.md`, `56-API_SPEC.md`, `docs/03-UX/36-COMPONENT_LIBRARY.md`, `docs/ADR/ADR-003-Astro.md` |

---

## 1. Purpose

Specifies the frontend architecture: framework choices (Astro + React + TypeScript + Tailwind + Chart.js), rendering strategy, state management, the API client boundary, and the module/folder organisation. The overriding constraint: the frontend depends only on the **API contract**, never on storage (NFR-6).

## 2. Scope

Client-side architecture and conventions. Visual/component design is in `docs/03-UX/*`; API shape in `56-API_SPEC.md`.

## 3. Stack & Rationale

- **Astro** — content-first, islands architecture → minimal JS, fast on mobile/poor networks (`docs/ADR/ADR-003-Astro.md`).
- **React (islands)** — interactivity where needed (forms, charts, dashboards).
- **TypeScript** — type-safe domain models mirrored from the API contract.
- **Tailwind CSS** — utility styling bound to design-system semantic tokens (`docs/03-UX/35`).
- **Chart.js** — vitals/growth charts (calm, accessible; `docs/03-UX/35` §8).

## 4. Rendering Strategy

- Static/SSG for content and shells; **islands** for interactive regions (dashboard cards, charts, forms).
- Mobile-first performance budget (NFR-1): ship minimal JS; hydrate only interactive islands.
- Progressive enhancement: core content readable with limited JS; charts/forms enhance.
- Future PWA: architecture must allow a service worker + offline cache without restructuring (`docs/13-Future`).

## 5. Layered Client Structure

```
src/
  pages/            # Astro routes (shells, SSG/SSR)
  islands/          # React interactive components
  components/       # UI components (design-system-bound)
  features/         # feature modules (pregnancy, vitals, growth, ...)
  domain/           # TS types mirroring API contract + client-side rules
  api/              # API client (the ONLY place that talks to the backend)
  state/            # state management (per-feature stores)
  lib/              # utils (formatting, dates/GA, units)
  styles/           # Tailwind + tokens
```

- **`api/` is the single boundary**: all network calls go through a typed API client generated/derived from the contract (`56`). No component calls storage or raw endpoints directly (mirrors system BR-1).

## 6. State Management

- Server state via the API client with caching/invalidation (e.g., a query-cache pattern); local UI state per island.
- Domain types in `domain/` are the client's source of truth for shapes, mirrored from the API contract; avoid duplicating business rules that belong server-side (P5).
- Derived display values (trends, GA, percentiles) are computed from API data via `lib/`, not re-implemented divergently.

## 7. Feature Modules

Each feature (e.g., `features/vitals`) contains its UI, island(s), API calls (via `api/`), and types (from `domain/`). Features map to product modules (`docs/06-Modules/*`) and consume shared components/tokens — no duplicated component logic (P5, `docs/03-UX/36` BR-1).

## 8. Content-Type Enforcement (safety)

Medical content is rendered only through content-type-aware components requiring `content_type` + `source_ref` (`docs/03-UX/36` BR-2, `docs/02-Research/28`). The client never fabricates medical content or emergency states.

## 9. Accessibility & Responsiveness

Built to WCAG 2.2 AA (`docs/03-UX/40`) and responsive rules (`docs/03-UX/41`): semantic HTML, ARIA, keyboard, focus, reduced-motion, reflow. Charts ship with accessible alternatives.

## 10. Performance

- Code-split by route/island; lazy-load non-critical; optimise images; skeletons.
- Cache API responses; minimise re-fetch; debounce inputs.
- Budget enforced in CI/perf tests (`docs/10-Testing/134`).

## 11. Business Rules

- BR-1: All backend communication goes through `api/` (typed client); no ad-hoc fetches in components.
- BR-2: Client depends on the API contract only; swapping storage causes zero client changes.
- BR-3: Business/continuity rules are not re-implemented client-side in a way that can diverge from the server.
- BR-4: Medical content renders only via content-type-aware components.

## 12. Edge Cases

- Offline/poor network (future): queue writes; show cached state; never lose user input.
- Large datasets (long timelines/charts): virtualise/paginate.
- Localisation/RTL (future): externalised strings; mirrored layout.

## 13. Acceptance Criteria

- [x] Stack and rendering strategy defined with rationale (islands, mobile-first).
- [x] Single API boundary (`api/`) and storage-independence stated.
- [x] Feature-module structure and content-type enforcement specified.
- [x] Accessibility/responsiveness/performance covered.

## 14. Future Expansion

PWA/service worker + offline sync; i18n/RTL; design-token import from the system; micro-frontend split if the app grows; clinician-portal frontend.

## 15. Dependencies

`50`, `56`, `docs/03-UX/*`, `docs/ADR/ADR-003-Astro.md`, `docs/06-Modules/*`.

## 16. Open Questions

- OQ-1: State/query library choice (e.g., a query-cache lib) — engineering decision.
- OQ-2: API client generation (codegen from contract vs. hand-written typed client).

## 17. Risks

- R-1: Business logic leaking into the client and diverging. Mitigation: BR-3 + server-authoritative rules.
- R-2: JS bloat hurting mobile. Mitigation: islands + budget (§10).
