# 212 — Sprint 07: Notifications, Analytics, Prediction, Polish

| Field | Value |
|---|---|
| Sprint | 07 — Full notifications, analytics/monitoring, prediction, family sharing, polish |
| Status | Planned |
| Milestone | MS-2.3 (prediction), MS-2.4 (sharing), completes MS-1.4 (`204` §7) |
| Layers | L7 (prediction) + L8 (platform completeness) (`202` §3) |
| Ships toward | v1.x / v2 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 3 engineers |

---

## 1. Purpose

Complete the platform's cross-cutting capabilities: **full Notifications** coverage across modules, **Analytics/monitoring** wired to the continuity + safety KPIs, the **Prediction engine** (trend/projection surfacing, framed educationally), **caregiver/family sharing** (explicit, revocable, audited), and interaction **polish**. Prediction is surfacing-only and inherits the non-diagnostic framing (`104`, `52` §6).

## 2. Objectives

1. NotificationService full coverage: reminders/alerts across Medicines, Appointments, Vaccination, Milestones (`95`, `13` §4).
2. Analytics/monitoring: emit + dashboard the KPIs — continuity (0 duplicate/orphan), content typing, privacy, performance (`64`).
3. PredictionEngine: weight-gain/BP/growth-percentile projections — surfacing only, educationally framed (`104`, MS-2.3).
4. Family sharing: caregiver access grant/revoke, RBAC, immediate effect, audited (`96`, `123`, MS-2.4).
5. Settings completion: profile, privacy, notification prefs, export (`97`, `76`).
6. Polish: interaction/transition refinement within design-system tokens (`35`, `36`).

## 3. Architecture References

`docs/06-Modules/95` (Notifications), `96` (Family), `97` (Settings); `docs/07-AI/104` (prediction engine); `docs/04-Architecture/64` (monitoring), `63` (logging); `docs/09-Security/123` (access control), `docs/05-Data/75` (audit), `76` (import/export); `docs/03-UX/35`,`36` (design system/components), `41` (responsive).

## 4. Files Created

```
apps/backend/src/services/{PredictionService.ts (full),AnalyticsService.ts,SettingsService.ts}
apps/backend/src/controllers/{familyAccessController,settingsController,exportController,notificationsController (extend)}.ts
apps/backend/src/adapters/sheets/tables/{caregiverAccess,userPreferences}.ts
apps/backend/tests/services/{prediction,analytics,family-access,settings,export}.test.ts
apps/backend/tests/integration/{notifications-coverage,caregiver-revoke,kpi-metrics}.test.ts
apps/web/src/features/notifications/{NotificationCenter.tsx}
apps/web/src/features/family/{FamilyAccessIsland.tsx,CaregiverList.tsx}
apps/web/src/features/settings/{SettingsIsland.tsx,PrivacyPrefs.tsx,ExportData.tsx}
apps/web/src/features/dashboard/{PredictionCard.tsx}
apps/web/src/api/{family-access.ts,settings.ts,export.ts}
```

## 5. Files Modified

- `NotificationService.ts` — extend to full cross-module coverage.
- `TrendService.ts` → feed `PredictionService` (surfacing-only).
- `DashboardService.ts` — surface predictions + notification center.
- `packages/api-contract` — `/v1/family/access` (POST/DELETE), `/v1/notifications`, `/v1/export`, settings.
- `packages/domain-types` — `CaregiverAccess`, `UserPreferences`, `Prediction`, `ExportBundle`.
- `SheetsStorageAdapter.ts` — new tables + integrity (access grants audited).
- No architecture docs.

## 6. Tasks

1. NotificationService: unify reminder/alert generation across Medicines/Appointments/Vaccination/Milestones; per-env triggers; no PHI in logs (`63`).
2. AnalyticsService + monitoring: emit metrics for continuity (KPI M1/M2), content typing (M3/M4), privacy, performance; wire to monitoring (`64`).
3. PredictionService: projections from owned data (weight-gain, BP, growth percentile); **surfacing only**, educationally framed, never diagnostic (`104`, `52` §6, `17`).
4. Family sharing: `POST /v1/family/access` (explicit grant), `DELETE` (immediate revoke); RBAC enforced; a revoked caregiver's next request is `forbidden` (`56` §11); every grant/revoke audited (`123`, `75`).
5. Settings: profile, privacy, notification prefs, data export (`76`; export is user-initiated, synthetic-safe format).
6. Polish: refine transitions/microinteractions using design-system tokens only (`35`,`36`); respect reduced-motion (`40`).
7. Tests per §9.

## 7. Deliverables

- Full notification coverage across modules.
- KPI analytics + monitoring dashboards live (`64`).
- Educationally-framed prediction surfacing (MS-2.3).
- Explicit, revocable, audited caregiver sharing (MS-2.4).
- Complete settings incl. export; polished interactions.

## 8. Acceptance Criteria

- [ ] Reminders/alerts fire for all four trigger sources (Medicines, Appointments, Vaccination, Milestones) (`13` §4, `notifications-coverage`).
- [ ] Prediction output is surfacing-only and educationally framed — no diagnostic/prescriptive language (MS-2.3, `104`, `17`).
- [ ] Granting caregiver access is explicit and audited; revoking takes effect immediately (next request `forbidden`) (MS-2.4, `caregiver-revoke`, `123`).
- [ ] KPI metrics (continuity, typing, privacy, performance) are emitted and visible in monitoring (`64`, `kpi-metrics`).
- [ ] Data export produces the user's data in the documented format; no other user's data leaks (`76`, RBAC).
- [ ] Polish changes use only semantic design tokens (`140` BR-1).

## 9. Testing (see `214`)

- **Unit:** prediction projections; analytics metric emission; access grant/revoke; settings; export bundling.
- **Integration:** notification coverage; caregiver revoke mid-session → forbidden; KPI metrics surfaced.
- **Security:** RBAC on sharing + export; audit completeness on grants/revokes (`135`).
- **e2e:** grant/revoke caregiver; view prediction card; export data; adjust notification prefs (`131`).
- **a11y:** notification center, family access, settings, prediction card pass AA (`40`).

## 10. Risks

- R-1: Prediction drifting into diagnosis (`17`, `104`). Mitigation: surfacing-only framing + content typing + copy review.
- R-2: Caregiver access not revoking promptly → privacy breach (`123`). Mitigation: immediate-effect design + mid-session-revoke test.
- R-3: Export leaking cross-user data. Mitigation: RBAC-scoped export + test (§9).

## 11. Rollback

- Feature-flag prediction, sharing, and export independently. Backend repoint to prior GAS version; disable new triggers; frontend redeploy. Sharing revocations are forward-safe. Data staging/dev synthetic; restore from backup if needed (`151`).

## 12. Definition of Done

Per `217`/`146`: MS-2.3/2.4 exit gates met; prediction surfacing-only; sharing explicit/revocable/audited; KPIs monitored; a11y AA; no PHI/secrets; tests green; docs in sync; reviewed; deployable.

## 13. Dependencies

Depends on: Sprints 02–05 (data to notify/predict on; TrendService), Sprint 06 (non-diagnostic framing pattern). Feeds Sprint 08 hardening (monitoring + a11y/perf polish inputs).
