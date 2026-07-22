# 207 — Sprint 02: Timeline Engine, Dashboard, Vitals, Charts, Reports

| Field | Value |
|---|---|
| Sprint | 02 — Dashboard + Vitals + Reports over the timeline engine |
| Status | Planned |
| Milestone | MS-1.2, MS-1.3, MS-1.5 (`204` §4) |
| Layers | L3 (`202` §3) |
| Ships toward | v1 (MVP) |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 3 engineers (2 BE/FE split, 1 FE charts) |

---

## 1. Purpose

Turn the timeline foundation into a usable record: the **Dashboard** (at-a-glance status + recent timeline), **Vitals** (BP/weight/blood-sugar with current/previous/trend and calm charts), and **Reports** (lab/ultrasound upload/view). Delivers three MS-1 milestones that make the pregnancy record real.

## 2. Objectives

1. TrendService: current/previous/trend/prediction-input computation — surfacing only, never diagnostic (`52` §6).
2. VitalsService: log BP, weight, weight-gain delta, blood sugar; emit timeline events; return trend (`83`, `56`).
3. Chart.js vitals charts: calm, accessible, with accessible text alternatives (`51` §9, `35` §8).
4. ReportsService: upload/store metadata + media refs (backend-mediated, short-lived URLs), view (`84`, `56` §7).
5. Dashboard read model: status, next actions, recent timeline across modules (`81`).

## 3. Architecture References

`docs/06-Modules/81` (Dashboard), `83` (Vitals), `84` (Reports); `docs/04-Architecture/56` (`/v1/vitals`, `/v1/reports`, `/v1/timeline`), `52` §6 (Trend), `58` (media privacy); `docs/05-Data/72`,`73` (fields/validation); `docs/03-UX/34` (dashboard spec), `35` §8 (charts), `40` (a11y), `41` (responsive); `docs/08-Timeline/110`.

## 4. Files Created

```
apps/backend/src/services/{VitalsService,ReportsService,TrendService,DashboardService}.ts
apps/backend/src/controllers/{vitalsController,reportsController,dashboardController}.ts
apps/backend/src/adapters/sheets/tables/{vitals,reports}.ts
apps/backend/src/lib/media.ts (short-lived, backend-mediated refs)
apps/backend/tests/services/{vitals,reports,trend,dashboard}.test.ts
apps/backend/tests/integration/{vitals-timeline,reports-media-privacy}.test.ts
apps/web/src/features/vitals/{VitalLogIsland.tsx,VitalTrendCard.tsx,VitalChart.tsx}
apps/web/src/features/reports/{ReportUploadIsland.tsx,ReportViewer.tsx}
apps/web/src/features/dashboard/{DashboardIsland.tsx,StatusCards.tsx,RecentTimeline.tsx}
apps/web/src/lib/{charts.ts,trend-format.ts}
apps/web/src/api/{vitals.ts,reports.ts,dashboard.ts}
apps/web/src/state/{vitals.ts,dashboard.ts}
```

## 5. Files Modified

- `packages/domain-types` — `Vital`, `Report`, `TrendResult`, `DashboardSummary` (from `72`).
- `packages/api-contract` — `/v1/vitals` (POST/GET series), `/v1/reports`, dashboard read.
- `SheetsStorageAdapter.ts` — vitals/reports persistence + integrity.
- `TimelineView.tsx` — render vital/report events.
- No architecture docs.

## 6. Tasks

1. TrendService: compute current/previous/delta/trend from owned vitals; expose to Vitals + Dashboard; never emit diagnosis (`52` §6).
2. VitalsService: validate input (`73`; formula-injection guard), persist, append timeline event, return event + trend (`56` §5).
3. Charts: Chart.js islands for BP/weight/blood-sugar; reduced-motion respected; accessible data-table alternative (`40`, `35` §8).
4. ReportsService: store report metadata + media refs; serve media only via short-lived, backend-mediated references — never public links (`56` §7, `58`).
5. DashboardService: assemble status + next actions + recent timeline (reads across modules via services, not cross-writes — `13` BR-1).
6. Frontend: vitals logging + trend cards + charts; report upload/viewer; dashboard islands (mobile-first, `41`). All via `api/`.
7. Tests per §9.

## 7. Deliverables

- Log BP/weight/blood-sugar → see current/previous/trend + calm chart (MS-1.3).
- Upload and view lab/ultrasound reports with private media handling (MS-1.5).
- Dashboard with at-a-glance status + recent timeline (MS-1.2).

## 8. Acceptance Criteria

- [ ] Logging a vital returns the created event **and** an updated trend; the event appears on the timeline (`56` §5).
- [ ] Trend is surfacing-only — no diagnostic/prescriptive language anywhere in vitals output (`52` §6, `17` non-goals).
- [ ] Report media is served only through short-lived backend-mediated refs; no public URL exists (`58`, verified by `reports-media-privacy.test.ts`).
- [ ] Dashboard renders status + next actions + recent timeline reading from services, with zero cross-module writes (MS-1.2, `13` BR-1).
- [ ] Charts pass AA with an accessible text/table alternative and respect reduced-motion (`40`, `35` §8).
- [ ] Input validation blocks spreadsheet formula-injection (`73`).

## 9. Testing (see `214`)

- **Unit:** trend computation; vitals validation/formula-guard; media ref generation/expiry; dashboard assembly.
- **Integration:** vital → timeline event; report media privacy (no public link).
- **e2e:** log vitals → view trend/chart; upload → view report; open dashboard (`131`).
- **a11y:** vitals form, charts (alt table), report viewer, dashboard pass AA (`40`).
- **Performance:** dashboard + chart render within budget (`134`).

## 10. Risks

- R-1: Media leaking via public links (`58`). Mitigation: backend-mediated short-lived refs + privacy test (Task 4, §8).
- R-2: Trend drifting into diagnosis (`17`). Mitigation: surfacing-only framing + copy review + content typing.
- R-3: Chart JS bloat hurting mobile (`51` R-2). Mitigation: island lazy-load + perf budget (`134`).

## 11. Rollback

- Frontend: redeploy prior build. Backend: repoint GAS to prior version (`60` §7). Data: staging/dev synthetic; restore spreadsheet from backup if needed (`151`). Feature-flag vitals/reports/dashboard so a partial rollback disables a surface without breaking auth/timeline.

## 12. Definition of Done

Per `217`/`146`: MS-1.2/1.3/1.5 exit gates met; surfacing-only + media-privacy verified; a11y AA on new surfaces; tests green; docs in sync; reviewed; deployable.

## 13. Dependencies

Depends on: Sprint 01 (Timeline, Content, Family, Pregnancy, Audit). Blocks: Sprint 03 (dashboard/reminders build on this), Sprint 07 (analytics/prediction reuse TrendService).
