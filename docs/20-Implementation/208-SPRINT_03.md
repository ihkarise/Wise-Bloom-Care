# 208 — Sprint 03: Pregnancy Management (Appointments, Medicines, Nutrition, Exercise, Knowledge)

| Field | Value |
|---|---|
| Sprint | 03 — Pregnancy management + week-by-week knowledge |
| Status | Planned |
| Milestone | MS-1.4, MS-1.6 (`204` §4) |
| Layers | L4 (`202` §3) |
| Ships toward | v1 (MVP) |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 3–4 engineers (parallel tracks P2) |

---

## 1. Purpose

Complete the pregnancy-management surface: **Appointments**, **Medicines** (with reminders), **Nutrition** and **Exercise** guidance/logging, and **week-by-week knowledge** surfaced from the knowledge base by gestational age. These modules are parallelisable (`203` §8 set P2) behind the pregnancy core.

## 2. Objectives

1. AppointmentsService: schedule/record visits; emit timeline events; feed reminders (`85` adj., `56`).
2. MedicinesService: medicine/supplement schedule + log + reminders (`85`).
3. NotificationService (reminder subset): fire medicine/appointment reminders (`95`) — full coverage in Sprint 07.
4. NutritionService + ExerciseService: guidance (typed+sourced) + logging (`86`, `87`).
5. Week-by-week knowledge: GA-driven surfacing of `knowledge-base/pregnancy/*` via ContentService (`101`, `28`).

## 3. Architecture References

`docs/06-Modules/85` (Medicines), `86` (Nutrition), `87` (Exercise), `95` (Notifications); `docs/04-Architecture/56` (`/v1/appointments`,`/v1/medicines`,`/v1/notifications`,`/v1/content`); `docs/07-AI/101` (knowledge base); `docs/02-Research/20`–`23`,`27`,`28` (guidance sources, typing); `docs/05-Data/72`,`73`; `docs/08-Timeline/110`.

## 4. Files Created

```
apps/backend/src/services/{AppointmentsService,MedicinesService,NutritionService,ExerciseService,NotificationService}.ts
apps/backend/src/controllers/{appointmentsController,medicinesController,nutritionController,exerciseController,notificationsController,contentController}.ts
apps/backend/src/adapters/sheets/tables/{appointments,medicines,nutritionEntries,exerciseEntries,notifications}.ts
apps/backend/src/lib/schedule.ts (reminder scheduling; GAS time-driven triggers per env, 60 §5)
apps/backend/tests/services/{appointments,medicines,nutrition,exercise,notification,content-ga}.test.ts
apps/backend/tests/integration/{reminder-fire,week-knowledge}.test.ts
apps/web/src/features/appointments/{AppointmentIsland.tsx}
apps/web/src/features/medicines/{MedicineScheduleIsland.tsx,MedicineLog.tsx}
apps/web/src/features/nutrition/{NutritionIsland.tsx}
apps/web/src/features/exercise/{ExerciseIsland.tsx}
apps/web/src/features/pregnancy/{WeekKnowledgeCard.tsx}
apps/web/src/api/{appointments.ts,medicines.ts,nutrition.ts,exercise.ts,notifications.ts,content.ts}
```

## 5. Files Modified

- `packages/domain-types` — `Appointment`, `Medicine`, `NutritionEntry`, `ExerciseEntry`, `Notification`, `ContentItem` (from `72`).
- `packages/api-contract` — corresponding endpoints.
- `SheetsStorageAdapter.ts` — new tables + integrity.
- `DashboardService.ts` — surface upcoming appointments/medicine reminders in next-actions.
- `TimelineView.tsx` — render appointment/medicine events.
- No architecture docs.

## 6. Tasks

1. AppointmentsService + MedicinesService: CRUD, timeline events, validation (`73`). Medicines produce reminder entries.
2. NotificationService (subset): schedule + fire reminders via GAS time-driven triggers per environment (`60` §5); log to notification queue; no PHI (`63`).
3. NutritionService + ExerciseService: guidance content served **only** via ContentService (typed + sourced, `28`); logging of entries to timeline.
4. Week-by-week knowledge: map GA → `knowledge-base/pregnancy/week-NN`; serve through ContentService with `content_type`+`source_ref` (`101`, `28`). Never fabricate content client-side (`51` BR-4).
5. Frontend: appointment + medicine islands; nutrition/exercise guidance+log; `WeekKnowledgeCard` driven by GA. All via `api/`.
6. Tests per §9.

## 7. Deliverables

- Schedule/record appointments; reminders fire; visit recorded to timeline (MS-1.4).
- Medicine schedule + logging + reminders (MS-1.4).
- Nutrition/exercise guidance (typed+sourced) + logging.
- GA-driven week-by-week knowledge surfaced from the knowledge base (MS-1.6).

## 8. Acceptance Criteria

- [ ] A scheduled reminder (medicine/appointment) fires and is logged; the visit is recorded on the timeline (MS-1.4).
- [ ] Week-by-week content is surfaced by GA and always carries `content_type` + `source_ref`; untyped content is never served (MS-1.6, `28`, `52` BR-5).
- [ ] Nutrition/exercise guidance renders only through content-type-aware components (`51` BR-4).
- [ ] Notification logs contain no PHI (`63`).
- [ ] Reminders are per-environment (dev/staging/prod isolation, `60` BR-1).

## 9. Testing (see `214`)

- **Unit:** appointment/medicine CRUD + timeline emission; reminder scheduling; GA→content mapping; content typing.
- **Integration:** reminder fires end-to-end; week-knowledge served with typing/sourcing.
- **e2e:** add medicine → receive reminder → log dose; view week content (`131`).
- **a11y:** appointment/medicine/nutrition/exercise forms + week card pass AA (`40`).
- **Content DoD:** week content typed, sourced, no invented facts (`146` §4, `27`).

## 10. Risks

- R-1: Untyped/unsourced medical guidance leaking (`28`). Mitigation: ContentService gate + Content DoD tests.
- R-2: GAS trigger quota/limits for reminders (`53`, `52` R-2). Mitigation: batch scheduling; per-env triggers; monitor (`64`).
- R-3: Reminder timezone/GA edge errors. Mitigation: `lib/schedule.ts` unit tests incl. edge cases.

## 11. Rollback

- Feature-flag each surface (appointments/medicines/nutrition/exercise/week-knowledge) so any one can be disabled without affecting the record. Backend repoint to prior GAS version; disable time-driven triggers on rollback (`60` §5). Frontend redeploy prior build. Data staging/dev synthetic.

## 12. Definition of Done

Per `217`/`146`: MS-1.4/1.6 exit gates met; content typed+sourced (Content DoD); reminders fire per-env; no PHI; a11y AA; tests green; docs in sync; reviewed; deployable.

## 13. Dependencies

Depends on: Sprint 01 (pregnancy core, timeline, content), Sprint 02 (dashboard next-actions). Blocks: Sprint 07 (full notifications), and provides the pregnancy record that Sprint 04 delivers from.
