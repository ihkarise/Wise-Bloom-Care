# 98 — Wellness Tracking Module (Personal Tracker)

| Field | Value |
|---|---|
| Document | Wellness Tracking Module Specification |
| Status | **Architecture ratified — Phase 1 review complete (2026-09-17).** Data model, timeline strategy, audit stance, and v1 catalog decided (§22). Still not part of the frozen `v1.0.0-Architecture` baseline; Phase 2 (implementation) requires a separate, explicit authorization beyond this document (`docs/20-Implementation/216-DEFINITION_OF_READY.md` BR-2). |
| Version | 0.2 (Phase 1 ratified) |
| Owner | Principal Product Architect (Phase 0 discovery/proposal; Phase 1 decisions recorded per product owner review) |
| Last Updated | 2026-09-17 |
| Related | `docs/01-Product/13-MODULE_BREAKDOWN.md`, `docs/01-Product/15-MILESTONES.md`, `docs/13-Future/164-BACKLOG.md`, `docs/ADR/ADR-007-Personal-Tracker-Timeline-Strategy.md`, `docs/06-Modules/82-PREGNANCY_MODULE.md`, `docs/06-Modules/83-VITALS_MODULE.md`, `docs/05-Data/77-VERSIONING.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/05-Data/75-AUDIT_LOGS.md`, `docs/03-UX/42-WELLNESS_TRACKER_SPEC.md` |

---

## 1. Purpose

Give a mother a private, personal place to keep an eye on the things *she* cares about during pregnancy and beyond — baby movement, bloating, sleep, mood, and anything else she chooses — without the product deciding for her which symptoms matter. This module **records observations she chooses to keep**; it does not diagnose, interpret, or grade them.

## 2. Boundary: Wellness Tracking vs. Clinical Vitals (`83`)

These are deliberately separate modules and must not be merged:

| | Vitals (`83`) | Wellness Tracking (this module) |
|---|---|---|
| What it measures | Clinician-relevant clinical measurements: BP, weight, blood sugar | Whatever the mother personally chooses to watch |
| Who decides what's tracked | Fixed set, clinically defined | The mother, from a curated catalog |
| Interpretation | Trend/current/previous shown, never diagnostic | None — a bare record of what she reported |
| Value shape | Fixed clinical units (mmHg, kg, mg/dL) | Varies per template: count / scale / boolean / text |

A tracker template must never be added to make Vitals redundant, and Vitals must never grow a "customisable" mode — the two stay separate per `docs/01-Product/13-MODULE_BREAKDOWN.md` §3 single-responsibility rule.

## 3. Non-Diagnostic Boundary (hard constraint)

This module **never**:
- diagnoses, interprets, or grades a symptom,
- infers danger or safety from a recorded value,
- generates a red-flag/clinical recommendation from tracker data,
- sends a medical alert based on a threshold.

It is a personal record only. Curated emergency/warning content (`docs/02-Research/28`) remains the sole source of safety guidance, wholly separate from this module. This mirrors NG-2/NG-10 (`docs/01-Product/17-NON_GOALS.md`) already applied to Medicines (`85` BR-1).

## 4. Goals

- Let a mother choose, from a curated catalog, which things she wants to track.
- Make recording a value fast (one tap where the value type allows it).
- Preserve history even when a tracker is turned off — "inactive" is not "deleted."
- Show pregnancy-week context where relevant, without owning gestational-age logic.

## 5. Non-Goals (v1 / MVP)

Notifications/reminders/push/SMS/email; background reminder engines; symptom interpretation or threshold alerts; analytics dashboards/charts/trend surfacing; complex reporting or doctor summaries; exports; a generic user-defined form builder or arbitrary user-created tracker schemas; child/baby tracker ownership; a new top-level navigation item; any redesign of the existing IA/navigation. (Full non-goals list: `docs/01-Product/17-NON_GOALS.md` — this module adds no exception to it.)

## 6. Scope

**Owns:** `TrackerPreference` (which curated templates a maternal subject has activated) and `TrackerEntry` (the append-only observations recorded against them) — see §9 for the current, *unfrozen* shape of these.

**Uses:** `PregnancyService`'s public gestational-age interface (`docs/06-Modules/82-PREGNANCY_MODULE.md`) for read-only week context — never recomputes GA itself (`docs/01-Product/13-MODULE_BREAKDOWN.md` §5 single-source-of-truth; `apps/backend/src/lib/gestation.ts` remains the sole implementation). Reuses `AuditService`, `StorageAdapter`, and the family-scoping RBAC helpers unchanged.

**Out:** any clinical vitals data, any child-subject data, any AI/interpretation, any notification/reminder engine.

## 7. Curated Template Catalog (illustrative, not frozen)

A code-level `TRACKER_TEMPLATES` catalog is proposed as the *initial UX starting point* — not a schema constraint and not exhaustive. Each template conceptually carries: a tracker key, display name, `context` (`pregnancy` | `general`), a `value_type` (§8), validation rules, and presentation metadata. Examples the catalog might start with:

| Example key | Example value_type | Context |
|---|---|---|
| baby_movement | count | pregnancy |
| nausea | scale | pregnancy |
| heartburn | scale | pregnancy |
| bloating | boolean | general |
| vomiting | scale | general |
| diarrhea | boolean | general |
| pain_discomfort | scale | general |
| mood | scale | general |
| sleep_hours | count | general |
| appetite | scale | general |
| swelling | boolean | general |
| other (free text) | text | general |

**These are illustrative starting examples, not a frozen requirement.** None of this list needs to ship in full for v1 — the curated set at launch is a product decision made at Phase 1, not fixed by this document. New templates can be added to the catalog later without a data-model or UI redesign (§10).

## 8. Value Types (kept deliberately simple)

`count` · `scale` · `boolean` · `text`. A `TrackerEntry.value` is stored as `string` and interpreted per its template's `value_type`; the template owns validation. This is **not** a generic form-builder: value types are a fixed, small set, not user-definable (§5 Non-Goals).

## 9. Conceptual Data Model — proposed for discussion, **not frozen**

Two conceptual entities, shaped to match existing conventions rather than invented fresh:

- **TrackerPreference** — modelled on the *correctable* pattern used by `medicines` (`apps/backend/src/adapters/sheets/tables/medicines.ts`, `appendOnly: false`): maternal-subject-owned, identifies which template it activates, carries an `active` boolean that is flipped, never deleted (turning a tracker off retains every prior `TrackerPreference`/`TrackerEntry` row — satisfies "inactive ≠ delete"). **Phase 1 decision (§22):** follows the *actual* Medicines/Vitals implementation — plain in-place update of `active`, no `version`/current-flag field — not the `docs/05-Data/77-VERSIONING.md` §4 correctable-record convention, which neither `medicines.ts` nor `vitals.ts` actually implements despite both being correctable tables.
- **TrackerEntry** — modelled on the *append-only* pattern used by `events` (`apps/backend/src/adapters/sheets/tables/events.ts`, `docs/05-Data/77-VERSIONING.md` §5): maternal-subject-owned, references the tracker/template, carries the `value` (string, interpreted per §8), a recording timestamp, and the standard append-only/versioning fields already used elsewhere (`created_by`, `version`; correction-via-new-entry rather than in-place edit, matching `77` BR-1).

Before either is frozen, Phase 1 must: confirm exact field names against `docs/05-Data/70-DATA_DICTIONARY.md`/`72-FIELD_SPECIFICATIONS.md` conventions; confirm PK/FK naming against the existing `TableMapping`/`f(...)` pattern (`apps/backend/src/adapters/sheets/tables/types.ts`); confirm whether any existing table already covers part of this need — the Journal module (`93-JOURNAL_MODULE.md`) was inspected as the closest neighbour during Phase 0 discovery and is free-text/media-oriented, not a substitute for typed, templated, repeatable observations. Child-subject ownership is explicitly excluded from `subject_id` scope in v1 (§5).

## 10. Extensibility

New templates append to the `TRACKER_TEMPLATES` catalog (code-level, versioned with the release like other reference data — `docs/05-Data/77-VERSIONING.md` §7) without touching the `TrackerPreference`/`TrackerEntry` schema or the UI shell. This is the mechanism that keeps §7's list illustrative rather than a source of schema churn.

## 11. Architecture (proposed, for Phase 1)

A `TrackingService` in the application layer, following the existing service/controller/adapter split (`docs/04-Architecture/52-BACKEND_ARCHITECTURE.md`): owns `TrackerPreference`/`TrackerEntry` only, reads GA through `PregnancyService`'s public method (never duplicating gestation math), writes audit records through the existing `AuditService` with a **non-PHI metadata allowlist** (§14), and enforces family→maternal-subject scoping through the existing `resolveScopedFamily`/`requireFamilyMaternal`/`assertMaternalSubject` helpers (`apps/backend/src/controllers/rbac.ts`) — no new authorization mechanism.

## 12. Timeline Participation

Per `docs/ADR/ADR-007-Personal-Tracker-Timeline-Strategy.md` (proposed, this session): `TrackerEntry` maintains its **own** append-only history and does **not** emit a row to the shared `Event`/timeline table per tap. See the ADR for the full rationale and the rejected alternative.

## 13. User Flow (proposed)

Choose trackers → activate desired ones from the catalog → a daily tracking card shows active trackers → one-tap (or minimal-input) recording per value type → today's recorded values are visible → historical entries are browsable → pregnancy-week context is shown where the template's context is `pregnancy` and gestational age is known. Deactivating a tracker removes it from the daily card only; its history and preference row remain, and it can be reactivated later with history intact.

## 14. Security & Privacy

- Family → maternal-subject scoping via existing RBAC helpers (§11); fail-closed on any cross-family or cross-subject access, exactly as Vitals/Medicines/Reports already do.
- Every read/write of tracker data is audited via `AuditService`. Per its existing contract, `meta` **must never** contain: tracker name, tracker key, recorded value, or free-text observation — mirroring the existing "no health content" rule already documented on `AuditService.record()`.
- No PHI in operational logs (`docs/04-Architecture/63-LOGGING.md`).
- Child tracking is out of scope for v1 (§5); there is no `child_records` table to scope against yet regardless (MS-1.7/MS-1.8 pending).

## 15. Business Rules

- BR-1 The module never diagnoses, interprets, grades, or alerts on a tracked value (§3).
- BR-2 The mother chooses which trackers are active; the catalog is a starting point, not an exhaustive or frozen list (§7).
- BR-3 Deactivating a tracker preserves its history; it never deletes `TrackerEntry` rows (§9, §13).
- BR-4 `TrackerEntry` does not participate in the shared `Event` timeline per entry (§12, `ADR-007`).
- BR-5 Value types are limited to `count | scale | boolean | text`; this is not a user-definable form builder (§8).
- BR-6 Audit metadata for this module never carries tracker identity or value content (§14).
- BR-7 Child-subject tracking is out of scope until explicitly authorised in a future module revision (§5).

## 16. Edge Cases

A tracker deactivated mid-pregnancy and reactivated postpartum (history intact, spanning the transition); a `pregnancy`-context tracker viewed when no active pregnancy episode exists (GA context simply absent, not an error); a mother activating a template then wanting "just a private note" (the `text` value type covers this without a form builder); multiple entries the same day for a `count`/`scale` tracker (append-only — all retained, "today's value" is a view over the day's entries, not a single mutable cell).

## 17. Acceptance Criteria (for this Phase 0 document)

- [x] Purpose and boundary against Vitals stated (§2).
- [x] Non-diagnostic constraint stated as a hard rule (§3).
- [x] Curated catalog presented as illustrative, not frozen (§7).
- [x] Conceptual data model proposed without inventing schema ahead of Phase 1 review (§9).
- [x] Timeline strategy deferred to `ADR-007`, not decided silently (§12).
- [x] Security/RBAC/audit plan reuses existing mechanisms only (§14).

## 18. Future Expansion

Mother Health → Wellness placement in a future IA (`docs/03-UX/32-INFORMATION_ARCHITECTURE.md`, out of scope here); pregnancy-context trackers surfacing contextually within a future Pregnancy IA; richer value types (never a generic form builder) if a concrete need emerges; caregiver-visible sharing of tracker history (gated the same way as MS-2.4 caregiver sharing generally).

## 19. Dependencies

`docs/06-Modules/82-PREGNANCY_MODULE.md` (GA read interface), `83-VITALS_MODULE.md` (boundary), `docs/05-Data/77-VERSIONING.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/05-Data/75-AUDIT_LOGS.md`, `docs/ADR/ADR-007-Personal-Tracker-Timeline-Strategy.md`, `docs/01-Product/17-NON_GOALS.md`, `docs/03-UX/42-WELLNESS_TRACKER_SPEC.md`.

## 20. Open Questions

- ~~OQ-1 Exact v1 launch subset of the template catalog (§7) — a product decision, not an architecture one.~~ **Resolved at Phase 1 — see §22.**
- ~~OQ-2 Exact field names/PK-FK shape for `TrackerPreference`/`TrackerEntry` (§9) — resolved at Phase 1, against `docs/05-Data/70`/`72`.~~ **Resolved at Phase 1 — see §22.**
- OQ-3 Whether/how caregiver read access to tracker history is scoped, if at all, before MS-2.4. *(still open — not addressed by Phase 1)*
- OQ-4 Final milestone slot (`docs/01-Product/15-MILESTONES.md` MS-1.10, proposed) — confirm at governance review alongside this document. *(still open — MS-1.10 remains proposed pending a separate milestone-ratification review; this document's own architecture is ratified per §22)*

## 21. Risks

- R-1 Catalog scope creep into a form builder. Mitigation: BR-5, §5 Non-Goals.
- R-2 Timeline flooding from high-frequency entries. Mitigation: BR-4, `ADR-007`.
- R-3 PHI leakage via audit/log metadata. Mitigation: BR-6, existing `AuditService` contract.
- R-4 Perception that this module blocks or competes with MS-1.7. Mitigation: explicit sequencing in `docs/01-Product/15-MILESTONES.md` and `docs/13-Future/164-BACKLOG.md`.

## 22. Phase 1 Decisions (Ratified 2026-09-17)

Grounded against the live repository (`main`, then `ceefc43`) rather than assumed from this document's own proposals. Resolves OQ-1 and OQ-2 above; does not by itself authorize implementation (`13-MODULE_BREAKDOWN.md` §2.5, `docs/20-Implementation/216` BR-2 still require a separate Phase 2 authorization).

- **D-1 Timeline strategy:** `ADR-007` **Accepted** (was Proposed). Verified against the live `EventType` union and `TimelineService`/`TimelineView.tsx`/`RecentTimeline.tsx` — both frontend files consume `EventType` through TypeScript-exhaustive label maps, and `TimelineService.list()`/`recent()` page at 20/5 respectively, confirming the flooding risk `ADR-007` argued from principle is real in the current implementation, not hypothetical.
- **D-2 Audit metadata (resolves ambiguity in §14, tightens it):** confirmed as written — `TrackerPreference` writes carry `meta: { active: boolean }` only (mirrors `medicines.ts`'s existing audit calls exactly); `TrackerEntry` writes carry **no** content-bearing `meta` at all — not the tracker key, not the value. `AuditService`'s contract is not modified; this is caller discipline, same as Medicines already demonstrates.
- **D-3 `TrackerPreference` field shape (resolves OQ-2, supersedes the `77-VERSIONING.md` §4 reference in §9):** `tracker_pref_id` (pk) · `subject_id` · `tracker_key` · `active` (boolean). Plain in-place update on `active`, no `version`/current-flag field, no hard delete — matches the actual `medicines.ts`/`vitals.ts` implementation, not the versioning document's aspirational correctable-record convention (a pre-existing documented-vs-implemented gap in the repository, not something this module introduces or is expected to fix). `TrackerEntry` keeps the append-only shape already described in §9 (`tracker_entry_id`, `subject_id`, `tracker_key`, `value`, `recorded_at`, `version`, `created_by`), mirroring `events.ts`. Exact conventions to be re-verified against `apps/backend/src/adapters/sheets/tables/types.ts` at the start of Phase 2, not assumed frozen by this paragraph.
- **D-4 V1 launch catalog (resolves OQ-1 — supersedes §7's illustrative table as the *launch* subset only; §7's full list remains the long-run illustrative catalog):**

  | Tracker | value_type | context |
  |---|---|---|
  | Baby movement / kicking | count | pregnancy |
  | Bloating | scale | pregnancy |
  | Vomiting | count | pregnancy |
  | Diarrhea | count | pregnancy |
  | Appetite | scale | general |
  | Sleep quality | scale | general |
  | Pain / discomfort | scale | general |
  | Mood | scale | general |

  Not frozen — §7's extensibility mechanism (code-defined `TRACKER_TEMPLATES` catalog, no schema change to add a template) applies to this list exactly as it does to §7's. **Flagged for Phase 2 attention, not overridden here:** this specific eight-tracker set exercises only `count` and `scale`; no launch tracker exercises `boolean` or `text`. Phase 2's test plan should still prove `boolean`/`text` handling exists and works (via test fixtures, or by adding one `boolean`/`text` tracker to the launch set), since §8's four value types are an architectural commitment independent of which templates ship first.
