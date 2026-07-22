# 33 — Navigation

| Field | Value |
|---|---|
| Document | Navigation Design |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `32-INFORMATION_ARCHITECTURE.md`, `34-DASHBOARD_SPEC.md`, `41-RESPONSIVE_RULES.md`, `40-ACCESSIBILITY.md` |

---

## 1. Purpose

Specifies the navigation patterns that realise the Information Architecture: how users move between Dashboard, Timeline, contexts, and modules, on mobile-first and larger screens, accessibly and calmly.

## 2. Scope

Primary/secondary navigation patterns, context switching, deep-linking, and states. Excludes visual tokens (see design system) and per-screen layout (see dashboard spec).

## 3. Primary Navigation (mobile-first)

- **Bottom navigation bar** (thumb-reachable, one-handed) with the core anchors:
  1. **Home** (Dashboard)
  2. **Timeline**
  3. **Context hub** (Pregnancy / Child — adapts to current life stage)
  4. **Assistant** (AI) *(v2; placeholder/hidden until enabled)*
  5. **More** (Family, Notifications, Settings)
- Max 5 primary destinations to avoid overload (calm, mobile ergonomics).
- The **Context hub** label/icon reflects the active context; after delivery it offers switching between Pregnancy/Postpartum and Child (and among children).

## 4. Secondary Navigation

- Within a context, modules are reached via a **section list / card grid** (e.g., Pregnancy → Vitals, Nutrition, Medicines, Appointments, Reports, Knowledge).
- Within a module, tabs/segments separate sub-views (e.g., Vitals → BP / Weight / Blood Sugar).
- Breadcrumb or back affordance always present; never trap the user.

## 5. Context Switching (continuity-critical)

- A clear, always-available **context switcher** lets the user move between Pregnancy/Postpartum and Child views **without leaving the single record**.
- Switching context never implies switching accounts or losing history.
- Default context follows life stage: pregnancy pre-delivery; after delivery, the Dashboard intelligently surfaces both, defaulting to the most time-relevant (configurable).

## 6. Larger Screens (tablet/desktop)

- Bottom bar becomes a **left rail**; secondary navigation expands into a persistent sidebar or split view.
- Timeline and Dashboard can appear side-by-side on wide viewports.
- Responsive rules: `41-RESPONSIVE_RULES.md`.

## 7. Deep Linking & Return Paths

- Dashboard cards and timeline events deep-link to module detail and back.
- Notifications deep-link to the relevant action (e.g., a medicine reminder → the medicine).
- Every deep link has a clear return path to Home/Timeline.

## 8. Navigation States

- **First run / empty:** navigation reveals progressively; unavailable contexts (e.g., Child pre-delivery) are absent, not broken.
- **Loading:** skeletons, not spinners where possible; never blank.
- **Error/offline (future):** clear, calm messaging; queued actions indicated.

## 9. Accessibility of Navigation

- Fully keyboard- and screen-reader-navigable; landmarks and labels per `40-ACCESSIBILITY.md`.
- Touch targets ≥ 44×44 px; sufficient spacing.
- Focus order logical; current location announced.
- Not colour-alone: active state uses shape/label + colour.

## 10. Business Rules

- BR-1: ≤5 primary destinations; core actions ≤2 taps from Home (IA findability).
- BR-2: Context switching never changes the underlying record (continuity).
- BR-3: Child context is navigable only after the delivery event exists.
- BR-4: Every screen has an unambiguous back/return path.

## 11. Edge Cases

- Multiple children: context switcher lists children clearly (avatar + name/age).
- Loss path: no Child context; navigation remains coherent and compassionate.
- Caregiver: navigation scoped to granted access; ungranted sections hidden, not error-gated.
- Very small/old devices: bottom bar remains usable; labels may collapse to icons with accessible names.

## 12. Acceptance Criteria

- [x] Primary (bottom bar / rail) and secondary navigation defined.
- [x] Continuity-preserving context switching specified.
- [x] Responsive transformation and accessibility covered.
- [x] States and deep-linking defined.

## 13. Future Expansion

Global search; clinician-portal navigation; quick-add (FAB) for common logging; gesture navigation; personalised shortcuts.

## 14. Dependencies

`32-INFORMATION_ARCHITECTURE.md`, `34-DASHBOARD_SPEC.md`, `40-ACCESSIBILITY.md`, `41-RESPONSIVE_RULES.md`.

## 15. Open Questions

- OQ-1: Is the AI Assistant a bottom-bar item or a persistent floating affordance?
- OQ-2: Default post-delivery context (maternal vs. child vs. smart).

## 16. Risks

- R-1: Navigation overload. Mitigation: BR-1 limits.
- R-2: Context switch reading as account switch. Mitigation: BR-2 + clear labelling.
