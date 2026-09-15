# 42 — Wellness Tracker Specification (Personal Tracker)

| Field | Value |
|---|---|
| Document | Wellness Tracker (Personal Tracker) UI Specification |
| Status | **Proposed — Phase 0 design draft.** Not part of the frozen `v1.0.0-Architecture` baseline. Implementation requires separate approval. |
| Version | 0.1 (Phase 0 draft) |
| Owner | UX Architect (Phase 0 discovery/proposal) |
| Last Updated | 2026-09-15 |
| Related | `docs/06-Modules/98-WELLNESS_TRACKING_MODULE.md`, `32-INFORMATION_ARCHITECTURE.md`, `34-DASHBOARD_SPEC.md`, `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`, `apps/web/src/styles/tokens.css` |

---

## 1. Purpose

Specifies the Wellness Tracker (Personal Tracker) surface: a calm, additive card that lets a mother choose, activate, and record the things she personally wants to keep an eye on — sitting inside the existing authenticated app shell, using only existing design tokens, without a new top-level navigation item.

## 2. Scope

Layout and states of the Tracking island within `apps/web/src/pages/app.astro`'s existing island stack. Data/logic ownership is in `docs/06-Modules/98-WELLNESS_TRACKING_MODULE.md`; visual tokens are unchanged from `35-DESIGN_SYSTEM.md`/`37-COLOR_SYSTEM.md`/`apps/web/src/styles/tokens.css` — this document introduces **no new token**.

## 3. Goals

- Communicate, at a glance: "these are the things *you* have chosen to keep an eye on."
- Make recording fast — one tap for `boolean`/`count`-style trackers, a small control for `scale`/`text`.
- Make choosing/activating trackers feel like picking from a calm menu, not filling out a form.
- Show today's state and historical entries without becoming an analytics dashboard.

## 4. Placement (no navigation change)

`app.astro` is a single, flat, top-to-bottom island stack with no navigation to alter. Current order and proposed insertion point:

```
DashboardIsland
PregnancySetupIsland
WeekKnowledgeCard
──────────────────────────
▶ TrackingIsland   (new — this spec)
──────────────────────────
VitalLogIsland
AppointmentIsland
MedicineIsland
ReportUploadIsland
TimelineView
```

Rationale: it follows the week-context card the mother has just read, and precedes the clinical Vitals log — reading naturally as "your context → what you're personally watching → your clinical measurements." No new route, no new nav item, no change to any other island's position (matches `docs/01-Product/13-MODULE_BREAKDOWN.md` module-boundary discipline and the brief's explicit "no top-level Tracker nav" constraint).

New feature folder, following the existing per-feature convention (`apps/web/src/features/medicines/`, `apps/web/src/features/vitals/`): `apps/web/src/features/tracking/`.

## 5. Layout (mobile-first, top → bottom, within the card)

1. **Card header:** "Your tracking" (or similar plain label) + a small "Choose trackers" affordance (opens the template picker). Matches the existing card idiom (`rounded-lg border border-border bg-surface p-5`, as used by `AppShell`'s feature cards and other islands).
2. **Active trackers list (today):** one row per active `TrackerPreference`, each showing its display name and a compact input matching its `value_type` (§7) plus today's recorded value if any.
3. **Empty state (no active trackers):** a calm invitation — "Choose what you'd like to track" — with the same "Choose trackers" affordance, not a wall of empty rows.
4. **History affordance:** a small "View history" link per tracker (or one link for the whole card) opening a simple chronological list of past entries — no charts, no trend lines (`98` §5 Non-Goals).
5. **Pregnancy-week context (conditional):** for a `pregnancy`-context tracker, a small caption showing the current week (read from the existing GA context already available to `WeekKnowledgeCard`/`PregnancySetupIsland` — never recomputed locally, per `98` §11).

## 6. Template Picker (choose/activate/deactivate)

A lightweight picker (inline expandable panel or simple list, not a modal-heavy flow) listing the curated catalog (`98` §7), grouped loosely by `pregnancy` vs `general` context. Each entry has a single toggle: activate / deactivate. Deactivating:
- removes the tracker from the "today" list (§5.2) immediately,
- does **not** delete any history (`98` BR-3),
- is reversible — reactivating shows the tracker again with prior history intact, with an "already tracked before" cue if history exists (e.g., "last recorded 3 days ago") rather than presenting it as brand-new.

## 7. Value-Type Recorders (kept simple, per `98` §8)

| value_type | Recorder UI | Example interaction |
|---|---|---|
| `count` | Stepper (− / value / +) | Tap + to log one more movement |
| `scale` | Small labelled segmented control (e.g., 1–5) | Tap the level that matches |
| `boolean` | Single toggle/switch | Tap to mark "yes, today" |
| `text` | Single-line input, expandable | Type a short note |

No dynamic field composition, no conditional fields, no multi-field forms per tracker (`98` §5 — not a form builder).

## 8. Visual Language (reuse only — no new tokens)

- Surfaces: `bg-surface-raised` cards on `bg-surface` background, `border-border`, existing radius scale (`radius-sm`/`md`/`lg`).
- Primary actions (activate, record, toggle): `color-action` (sage) / `color-action-hover`, matching every other island's primary-action styling.
- Links (e.g., "View history", "Choose trackers"): `color-link` (sky).
- Nothing in this module uses `color-caution` (amber) or `color-alert-emergency` — this module records, it does not warn (`98` §3). If a future curated emergency surface needs to reference tracker data, that remains entirely outside this module's rendering path.
- Typography: existing `text-body`/`text-small`/`text-caption` scale, Inter via the existing font stack — no new type styles.
- Motion/interaction states: default/hover/focus/active/disabled per `35-DESIGN_SYSTEM.md` §7 — every recorder control gets a visible focus ring (`color-focus`), consistent with existing controls.

## 9. Proposed User Flow

```
Choose trackers
      ↓
Activate desired templates from the curated catalog
      ↓
Daily Tracking card shows active trackers
      ↓
One-tap (or minimal-input) recording per value type
      ↓
Today's recorded values visible on the card
      ↓
Historical entries browsable (simple list, no charts)
      ↓
Pregnancy-week context shown where applicable
```

Deactivating a tracker only removes it from step 3 onward; steps already recorded remain retrievable via history (§6).

## 10. States

- **First run / no active trackers:** the empty-state invitation (§5.3) — never an intimidating blank grid of every possible tracker.
- **Some active, none recorded today:** each row shows its recorder control with no value yet — a neutral "not yet today" affordance, never a red/warning treatment (this is a personal record, not a compliance checklist — matches the "gentle, non-coercive" tone already established for Medicines reminders, `85` BR-3).
- **Recorded today:** show the value inline; still allow another entry where the value type is repeatable (`count`, `scale`, `text` — multiple notes in a day are valid; `boolean` typically reflects "yes, at least once today").
- **Loading:** skeleton rows, consistent with other islands.
- **Deactivated tracker, viewed via history:** a plain "inactive" label with a one-tap "reactivate."

## 11. Business Rules

- BR-1: No top-level navigation item is introduced; the tracker lives entirely inside the existing `app.astro` island stack (§4).
- BR-2: No new global design token is introduced; every colour/radius/type value is an existing semantic token (§8).
- BR-3: The card never renders a chart, trend line, streak, badge, or score (`98` §5; NG-10 anxiety-gamification boundary already established for Medicines).
- BR-4: Deactivating a tracker never removes its history from the UI's reach — history remains one tap away via reactivation or the history view (§6, §10).
- BR-5: Pregnancy-week context is read-only display sourced from the existing GA interface — this spec defines no new date-math UI.

## 12. Edge Cases

- No active pregnancy episode: `pregnancy`-context trackers simply omit the week caption (§5.5) rather than showing an error.
- A tracker deactivated then reactivated across the delivery transition (future MS-1.7/1.8): out of scope for this spec's MVP layout — the card only ever reflects the current maternal-subject scope; child-context tracking is explicitly not designed here (`98` §5).
- Very long tracker lists (many templates activated): the card scrolls internally rather than growing the page indefinitely — consistent with the "calm, capped" pattern already used on Dashboard (`34-DASHBOARD_SPEC.md` BR-5).

## 13. Acceptance Criteria (for this Phase 0 document)

- [x] Placement specified with no navigation change (§4).
- [x] Layout, picker, and recorder UI specified for all four value types (§5–§7).
- [x] Confirmed reuse-only of existing design tokens; no new token proposed (§8).
- [x] Deactivate/reactivate preserves history in the UI flow (§6, §10, BR-4).
- [x] No chart/trend/score/streak surface proposed (BR-3).

## 14. Future Expansion

A dedicated "Wellness" surface under a future Mother-Health IA (`docs/03-UX/32-INFORMATION_ARCHITECTURE.md`, not implemented now); contextual tracker surfacing inside a future Pregnancy IA section; richer history views (still without becoming an analytics dashboard) if a concrete need emerges.

## 15. Dependencies

`docs/06-Modules/98-WELLNESS_TRACKING_MODULE.md`, `35-DESIGN_SYSTEM.md`, `37-COLOR_SYSTEM.md`, `40-ACCESSIBILITY.md`, `apps/web/src/styles/tokens.css`, `apps/web/src/pages/app.astro`.

## 16. Open Questions

- OQ-1: Whether the template picker is an inline expandable panel or a separate lightweight screen — a Phase 3 implementation detail, not an architectural one.
- OQ-2: Whether "today" for a `count`/`scale` tracker shows a running tally or the latest entry only — a product decision for Phase 1/3.

## 17. Risks

- R-1: The card growing into a dashboard-like surface over time. Mitigation: BR-3, explicit non-goals (`98` §5).
- R-2: Perceived as a second, competing "form" experience. Mitigation: strict reuse of existing card idiom and tokens (§8, BR-2).
