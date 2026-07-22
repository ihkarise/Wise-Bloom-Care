# 210 — Sprint 05: Baby Module (Growth, WHO Charts, Milestones, Vaccination)

| Field | Value |
|---|---|
| Sprint | 05 — Baby core: growth, WHO charts, CDC milestones, vaccination, journal |
| Status | Planned |
| Milestone | MS-1.8 (`204` §4) |
| Layers | L6 (`202` §3) |
| Ships toward | v1 (MVP) — completes the Continuous Record feature set |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 3–4 engineers (parallel tracks P3) |

---

## 1. Purpose

Complete the child side of the continuous record: **Baby** profile/timeline, **Growth** (WHO measurements + charts), **Milestones** (CDC developmental), **Vaccination** (schedule + tracking), and **Journal**. All are child-scoped and therefore depend on Sprint 04 having created the child (`202` gate G-4, `203` §5). Exit gate MS-1.8: *WHO charts render; CDC milestones & vaccine reminders work*.

## 2. Objectives

1. Full `ChildService`: child profile + continuous timeline; feeding/sleep (`89`).
2. GrowthService: WHO growth measurements; percentile/z computed server-side; corrected age for preterm (`90`, `25`, `56`).
3. WHO growth charts (Chart.js), calm + accessible (`35` §8, `40`).
4. MilestonesService: CDC developmental milestones; non-diagnostic status (`91`, `26`).
5. VaccinationService: immunization schedule + tracking (given/skipped/deferred) + reminders (`92`, `24`).
6. JournalService: notes/photos/moments (child or maternal subject) (`93`).

## 3. Architecture References

`docs/06-Modules/89` (Baby), `90` (Growth), `91` (Milestones), `92` (Vaccination), `93` (Journal); `docs/02-Research/24` (govt immunization), `25` (WHO child growth), `26` (developmental milestones); `docs/04-Architecture/56` (`/v1/children`,`/v1/growth`,`/v1/milestones`,`/v1/vaccinations`,`/v1/journal`), `52` §6 (Trend/percentile surfacing-only); `docs/08-Timeline/113`,`114`,`115`; `docs/05-Data/72`,`73`.

## 4. Files Created

```
apps/backend/src/services/{GrowthService,MilestonesService,VaccinationService,JournalService}.ts
apps/backend/src/controllers/{childController,growthController,milestonesController,vaccinationController,journalController}.ts
apps/backend/src/adapters/sheets/tables/{growthMeasurements,milestones,vaccinations,journalEntries}.ts
apps/backend/src/lib/{who-percentile.ts,corrected-age.ts}
apps/backend/tests/services/{child,growth,milestones,vaccination,journal}.test.ts
apps/backend/tests/integration/{growth-percentile,vaccine-reminder,corrected-age}.test.ts
apps/web/src/features/baby/{BabyProfileIsland.tsx,FeedingSleepLog.tsx}
apps/web/src/features/growth/{GrowthLogIsland.tsx,WHOChart.tsx}
apps/web/src/features/milestones/{MilestoneIsland.tsx}
apps/web/src/features/vaccination/{VaccinationIsland.tsx,VaccineSchedule.tsx}
apps/web/src/features/journal/{JournalIsland.tsx}
apps/web/src/api/{children.ts,growth.ts,milestones.ts,vaccinations.ts,journal.ts}
```

## 5. Files Modified

- `packages/domain-types` — `GrowthMeasurement`, `Milestone`, `Vaccination`, `JournalEntry`, child feeding/sleep shapes (from `72`).
- `packages/api-contract` — child-scoped endpoints.
- `SheetsStorageAdapter.ts` — new child-scoped tables + integrity.
- `ChildService.ts` — extend the minimal Sprint-04 service to full module (creation still only via DeliveryService — `13` BR-2).
- `DashboardService.ts` — surface child status + vaccine reminders + milestone prompts.
- `NotificationService.ts` — add vaccination + milestone reminders.
- `TimelineView.tsx` — render child events on the same stream.
- No architecture docs.

## 6. Tasks

1. Extend `ChildService`: profile, continuous child timeline, feeding/sleep logging. **Creation remains DeliveryService-only** (`13` BR-2).
2. GrowthService: persist measurements; compute WHO percentile/z via `who-percentile.ts` (sourced from `25`); apply corrected age for preterm via `corrected-age.ts` (`113`). Surfacing-only, non-diagnostic (`52` §6).
3. WHO charts: Chart.js islands with WHO reference bands; accessible table alternative; reduced-motion (`35` §8, `40`).
4. MilestonesService: CDC milestone status (`26`); explicitly non-diagnostic phrasing (`91`, `17`); milestone prompts to Notifications.
5. VaccinationService: schedule from `24`; record given/skipped/deferred; reminders via NotificationService (`92`, `95`).
6. JournalService: notes/photos/moments with private media handling (backend-mediated refs, `58`).
7. Frontend: baby profile, growth log+chart, milestones, vaccination schedule, journal. All via `api/`.
8. Tests per §9.

## 7. Deliverables

- Baby profile + continuous child timeline (MS-1.8).
- Growth logging with WHO percentile charts (MS-1.8).
- CDC milestone tracking (non-diagnostic) (MS-1.8).
- Vaccination schedule + tracking + reminders (MS-1.8).
- Journal with private media.

## 8. Acceptance Criteria

- [ ] WHO growth charts render from logged measurements with correct percentile/z; preterm uses corrected age (MS-1.8, `growth-percentile`, `corrected-age`).
- [ ] Child records are created **only** via DeliveryService; no other path can create a child (`13` BR-2 — regression-tested against Sprint 04 invariants).
- [ ] Milestone status is non-diagnostic (no clinical judgement language) (`91`, `17`).
- [ ] Vaccine reminders fire per schedule; status given/skipped/deferred recorded (MS-1.8, `vaccine-reminder`).
- [ ] Journal media served only via short-lived backend-mediated refs (`58`).
- [ ] Child events appear on the same continuous timeline as maternal events (`113`).

## 9. Testing (see `214`)

- **Unit:** WHO percentile/z; corrected age; milestone status mapping; vaccine schedule; feeding/sleep.
- **Integration:** growth→percentile→chart data; vaccine reminder end-to-end; corrected-age preterm case.
- **Regression:** child-creation-only-via-Delivery invariant still holds (guards against Sprint 04 regressions).
- **e2e:** log growth → see WHO chart; record vaccine → reminder; add milestone; journal entry (`131`).
- **a11y:** all new surfaces + WHO chart alt table pass AA (`40`).
- **Content DoD:** growth/milestone/vaccine reference data sourced (`25`,`26`,`24`,`27`).

## 10. Risks

- R-1: Percentile/corrected-age miscalculation → misleading display. Mitigation: unit tests against WHO reference values (`25`); surfacing-only framing.
- R-2: Milestone/growth phrasing drifting into diagnosis (`17`). Mitigation: non-diagnostic copy + content typing review.
- R-3: A non-Delivery child-creation path introduced accidentally. Mitigation: regression test on the sole-creator invariant (§9).

## 11. Rollback

- Feature-flag each child surface (growth/milestones/vaccination/journal). Backend repoint to prior GAS version; frontend redeploy prior build; disable vaccine/milestone triggers on rollback. Data staging/dev synthetic; restore from backup if needed (`151`).

## 12. Definition of Done

Per `217`/`146`: MS-1.8 exit gate met; WHO charts + CDC milestones + vaccine reminders working; sole-creator invariant intact; surfacing-only + sourced content; a11y AA; tests green; docs in sync; reviewed; deployable.

## 13. Dependencies

Depends on: Sprint 04 (children exist), Sprint 01 (timeline/content/audit), Sprint 03 (NotificationService). Blocks: Sprint 08 hardening (baby flows in the a11y/perf/security sweep). Completes v1 feature set for v1 Beta.
