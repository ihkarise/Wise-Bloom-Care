# ADR-007 — Personal Tracker Entries Do Not Flood the Shared Timeline

| Field | Value |
|---|---|
| Status | Proposed (Phase 0 — pending governance approval; not yet Accepted) |
| Date | 2026-09-15 |
| Deciders | Principal Product Architect (Phase 0 discovery/proposal) — pending review |
| Related | `docs/06-Modules/98-WELLNESS_TRACKING_MODULE.md`, `docs/05-Data/77-VERSIONING.md` §5, `docs/01-Product/13-MODULE_BREAKDOWN.md` §3 BR-3, `packages/domain-types/src/index.ts` (`EventType`), `apps/backend/src/adapters/sheets/tables/events.ts` |

---

## 1. Context

The frozen architecture requires every module that produces user-visible history to emit typed, append-only events into the shared `Event` timeline (`docs/01-Product/13-MODULE_BREAKDOWN.md` §3 BR-3; `apps/backend/src/adapters/sheets/tables/events.ts`), consumed by `TimelineView.tsx` / `RecentTimeline.tsx` (Dashboard's "recent timeline"). `EventType` (`packages/domain-types/src/index.ts`) is a small, deliberately closed enum: `vital | appointment | report | medicine | delivery | growth | milestone | vaccination | journal | note`.

The proposed Wellness Tracking module (`docs/06-Modules/98-WELLNESS_TRACKING_MODULE.md`) is, by design, **customisable and potentially high-frequency**: a mother may log baby movement several times a day, every day. Naively treating every `TrackerEntry` as a shared `Event` was identified during Phase 0 discovery as a risk to the shared timeline's usefulness and to the closed `EventType` enum.

## 2. Decision

**`TrackerEntry` maintains its own append-only history table and does not emit a shared `Event` row per recorded tap.** The Wellness Tracking module reads/writes only `TrackerPreference`/`TrackerEntry`; it does **not** widen `EventType`, and it does **not** write to the `events` table at all in MVP.

Where a user wants to see their tracking activity, the Wellness Tracking island renders it directly from `TrackerEntry` history (today's view + historical view — `98` §13); the shared Dashboard/`TimelineView` feed is not the mechanism for this in MVP.

## 3. Rationale

- **Enum stability.** `EventType` is consumed across every existing module's timeline rendering. Widening it to accommodate arbitrary, user-defined tracker keys would either require a generic `'tracker'` type (losing the enum's descriptive precision) or one enum value per template (unbounded growth as the catalog grows) — both degrade a frozen, cross-cutting type for one module's benefit.
- **Signal quality.** Dashboard's "recent timeline" (`docs/06-Modules/81-DASHBOARD_MODULE.md`) is meant to surface meaningful events — a medicine change, an appointment, a delivery. A mother logging "movement" ten times today would bury those in her own feed, and in everyone else's derived views that read the same table.
- **Module boundary.** `13-MODULE_BREAKDOWN.md` BR-1 ("a module must not write to another module's owned data directly") does not itself forbid writing to the shared `events` table — multiple modules already do — but the *volume* mismatch is new: clinical/administrative events are low-frequency by nature; tracker taps are not. This architecture has not previously had to absorb that failure mode.
- **Reversibility.** Keeping tracker history in its own table is the easier direction to relax later (e.g., a daily digest event — §4) than the reverse (retroactively de-duplicating an already-flooded shared timeline).

## 4. Alternative Considered and Rejected (for MVP)

**Daily-aggregated shared `Event`:** introduce a `tracker` (or similarly named) `EventType`, but emit at most one `Event` per subject per tracker per day (an aggregate/summary), rather than one per tap.

- **Rejected for MVP** because: it still requires widening the closed `EventType` enum now, for a benefit (a tracker line appearing in the general timeline) that is not requested by the product brief; and it adds aggregation-timing complexity (when does "today's" aggregate event get written — on first tap? last tap? an end-of-day sweep?) that pulls in scheduling/background-job machinery explicitly out of scope for this module (`98` §5 Non-Goals).
- **Not discarded permanently:** if a future need emerges to surface tracking activity in the general timeline (e.g., a caregiver wants a single "she logged wellness today" line), this is the documented fallback — implemented then, as its own reviewed change, not assumed now.

## 5. Consequences

### Positive
- No change to the frozen `EventType` enum; every existing module's timeline logic is untouched.
- Dashboard/timeline signal quality is preserved regardless of tracker usage volume.
- `TrackerEntry`'s own history table can use append-only semantics tuned to its own access patterns (queried by subject + tracker + date range) rather than the general-purpose `events` shape.

### Negative / Risks
- Tracker activity is **not** visible in the general Dashboard timeline in MVP — a mother must open the Wellness Tracking island to see her own history. Accepted as correct for MVP per the module's own scope (`98` §13: the daily card and history view are the intended surfaces).
- A future decision to surface aggregated tracker activity in the shared timeline will need its own review (§4) rather than being automatic.

## 6. Alternatives Considered

- **Emit an `Event` per tap:** rejected — timeline flooding (§3).
- **Daily-aggregated `Event`:** considered, rejected for MVP, documented as the fallback (§4).
- **Own append-only history (chosen):** matches `docs/05-Data/77-VERSIONING.md` §5's general append-only-entity pattern without requiring it to route through the shared `events` table specifically.

## 7. Compliance & Safety Notes

No safety-relevant consequence: this is a data-shape/timeline decision, not a change to the non-diagnostic boundary (`98` §3) or to RBAC/audit behaviour (`98` §14), both of which apply identically to `TrackerEntry`'s own history table.

## 8. Review Trigger

Before Phase 2 (backend implementation) begins — confirm this ADR is Accepted, not just Proposed. Revisit if product requests tracker activity to appear in the shared/general timeline (§4 fallback), or if `EventType` needs restructuring for unrelated reasons.
