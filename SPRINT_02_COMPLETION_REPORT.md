# Sprint 02 — Completion Report

| Field                 | Value                                                      |
| --------------------- | ---------------------------------------------------------- |
| Sprint                | 02 — Dashboard + Vitals + Reports over the timeline engine |
| Branch                | `claude/wise-bloom-sprint-02-4j7g1g`                       |
| Base                  | `v1.3.0-sprint-01` (`90eb67a`)                             |
| Milestones            | MS-1.2 (Dashboard), MS-1.3 (Vitals), MS-1.5 (Reports)      |
| Architecture baseline | `v1.0.0-Architecture` (FROZEN — unchanged)                 |
| Spec                  | `docs/20-Implementation/207-SPRINT_02.md`                  |
| Status                | Complete; validated; **no PR opened**                      |

---

## 1. Scope

Delivered the three MS-1 surfaces that make the pregnancy record usable, on top of the
frozen Sprint 01 timeline/auth/family/pregnancy/audit foundation:

- **Vitals (MS-1.3)** — log BP / weight / blood sugar; each log persists, appends a `vital`
  timeline event, and returns a surfacing-only arithmetic trend. Calm, accessible charts.
- **Reports (MS-1.5)** — upload lab/ultrasound metadata with private media; view via
  short-lived, backend-mediated references (never a public link); each upload appends a
  `report` timeline event.
- **Dashboard (MS-1.2)** — at-a-glance life-stage status, metric tiles with trend, and a
  recent-timeline preview, assembled by reading across services with zero cross-module writes.

**Explicitly NOT built** (per spec): delivery, baby, growth-beyond-existing, AI engine,
notifications, prediction, sharing, hardening, and pregnancy work beyond the Sprint 01
foundation.

### Pre-coding decisions (approved before implementation)

1. **Reference bands deferred.** `TrendService` is pure arithmetic
   (current / previous / delta / direction). No ACOG weight-gain or FIGO glucose thresholds
   were introduced — those require sourced clinical work and are out of the Sprint 02
   acceptance criteria. `docs/02-Research/21,22` remain the authoritative source for a later
   sourced feature. This keeps the trend **surfacing-only** and eliminates diagnostic-drift risk.
2. **`/v1/dashboard` added as an additive read endpoint** returning a typed `DashboardSummary`,
   consistent with `56 §9` backward-compatible extension. Existing endpoints unchanged.
   Aggregation lives in `DashboardService`, never in the frontend.
3. **BP stored as two Vital rows** (systolic + diastolic sharing `measured_at`) per the frozen
   domain model, paired back into one logical reading at the service/chart layer. The frozen
   domain types and `CreateVitalRequest` were **not** changed; a BP body is a discriminated
   variant added additively.

---

## 2. Files changed

### Domain / contract (modified — additive only)

- `packages/domain-types/src/index.ts` — added `TrendDirection`, `TrendPoint`, `TrendResult`,
  `BloodPressureReading`, `BloodPressureTrend`, `DashboardMetric`, `DashboardStatus`,
  `DashboardSummary`. (`Vital`/`Report` already existed from Sprint 01.)
- `packages/api-contract/src/index.ts` — added `dashboard` resource; endpoints
  `POST/GET /v1/vitals` payloads extended (`trend` on response; BP variant), `POST/GET /v1/reports`,
  `GET /v1/reports/media`, `GET /v1/dashboard`; types `CreateBloodPressureRequest/Response`,
  `LogVitalRequest/Response`, `CreateReportRequest/Response`, `ReportListResponse`,
  `ReportMediaResponse`, `DashboardResponse`.

### Backend (created)

- `src/services/{TrendService,VitalsService,ReportsService,DashboardService}.ts`
- `src/controllers/{vitalsController,reportsController,dashboardController}.ts`
- `src/lib/media.ts` (short-lived, HMAC-signed, backend-mediated media refs)
- `src/adapters/sheets/tables/{vitals,reports}.ts` (extracted from inline mappings)
- Tests: `tests/services/{trend,vitals,reports,dashboard}.test.ts`,
  `tests/lib/media.test.ts`, `tests/integration/{vitals-timeline,reports-media-privacy}.test.ts`

### Backend (modified)

- `src/adapters/sheets/tables/index.ts` — reference extracted vitals/reports mappings (no schema change).
- `src/services/TimelineService.ts` — added read-only `recent()` for the dashboard preview;
  shared ordering factored out (no behavioural change to `list`).
- `src/controllers/rbac.ts` — added shared `requireFamilyMaternal` + `assertMaternalSubject` scoping helpers.
- `src/controllers/requestHelpers.ts` — added `asNumber`.
- `src/controllers/maternalController.ts` — reuse the shared maternal-scoping helper.
- `src/app.ts` — wired the four new services + three controllers; media signing key **derived**
  from the existing `EMAIL_PEPPER` (no new required deployment secret).

### Frontend (created)

- `src/api/{vitals,reports,dashboard}.ts`
- `src/state/{vitals,dashboard}.ts`
- `src/lib/{charts,trend-format}.ts`
- `src/features/vitals/{VitalLogIsland,VitalTrendCard,VitalChart}.tsx`
- `src/features/reports/{ReportUploadIsland,ReportViewer}.tsx`
- `src/features/dashboard/{DashboardIsland,StatusCards,RecentTimeline}.tsx`
- Tests: `tests/api/{vitals,reports,dashboard}.test.ts`, `tests/lib/{charts,trend-format}.test.ts`,
  `tests/features/vital-chart.test.tsx`

### Frontend (modified)

- `src/features/timeline/TimelineView.tsx` — render a per-event type badge (vital/report events).
- `src/pages/app.astro` — mount Dashboard, Vitals, and Reports islands.

### Untouched (as required)

All of `docs/00-*`…`docs/13-*`, `docs/ADR/*`, `docs/20-Implementation/*`; auth / session /
family / pregnancy / content code; the StorageAdapter interface and Sheets integrity logic;
every pre-existing test.

---

## 3. Features implemented

| Deliverable                                                               | Result |
| ------------------------------------------------------------------------- | ------ |
| Log BP/weight/blood-sugar → current/previous/trend + calm chart (MS-1.3)  | ✅     |
| Upload + view lab/ultrasound reports with private media handling (MS-1.5) | ✅     |
| Dashboard with at-a-glance status + recent timeline (MS-1.2)              | ✅     |

---

## 4. Architecture references

- Backend layering / DI composition root: `docs/04-Architecture/52 §4`, `app.ts`.
- StorageAdapter boundary preserved (services never touch Sheets): `52 §5`, `54`.
- Trend surfacing-only: `52 §6`, `docs/06-Modules/83 BR-1`.
- Media privacy (short-lived, backend-mediated, no public link): `docs/04-Architecture/58`,
  `docs/06-Modules/84 BR-1`.
- Dashboard aggregation, zero cross-module writes: `docs/06-Modules/81 §1`, `docs/00-Vision/13 BR-1`.
- API contract stability / additive extension: `docs/04-Architecture/56 §9`.
- Frontend single-transport rule (all network via `api/`): `docs/04-Architecture/51 BR-1`.
- Charts / a11y: `docs/03-UX/35 §8`, `docs/03-UX/40`.

---

## 5. Tests

- **Backend:** 22 files, **161 tests** pass (was 133 at Sprint 01 end; **+28**, no coverage removed).
  New: trend arithmetic; vitals validation + formula-guard + BP two-row semantics; media
  ref generation / signature / expiry; reports metadata + timeline event; dashboard assembly +
  zero-write proof; `vital → timeline` and `reports media privacy` integration.
- **Frontend:** 14 files, **44 tests** pass (**+9**). New: vitals/reports/dashboard API modules;
  chart geometry; non-diagnostic trend copy; `VitalChart` a11y (image label + data-table alternative).

### BP acceptance-test coverage (decision 3)

1. one BP submission → two Vital rows ✅ (`vitals.test.ts`)
2. both rows share `measured_at` ✅
3. `TrendService` pairs them correctly ✅ (`trend.test.ts`)
4. chart/dashboard treat one BP as one reading ✅ (`dashboard.test.ts`, island render)
5. incomplete/mismatched pairs handled safely (null side, no crash, no invented value) ✅

---

## 6. CI

Reproduced the full CI gate (`.github/workflows/ci.yml`) locally, all green:

| Gate                                                                       | Result                                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm lint` + `pnpm -r lint` (incl. no-sheets / no-network boundary rules) | ✅                                                                            |
| `pnpm format:check`                                                        | ✅                                                                            |
| `pnpm -r typecheck` (tsc + astro check, 0 errors)                          | ✅                                                                            |
| `pnpm -r test` (205 tests)                                                 | ✅                                                                            |
| `pnpm -r build`                                                            | ✅                                                                            |
| Secret scanning (gitleaks)                                                 | ✅ no secrets committed — media key derived at runtime from a Script Property |

---

## 7. Security

Every Sprint 01 control is preserved and extended, none weakened:

- **RBAC / family scoping** — every vitals/reports/dashboard route resolves scope through
  `resolveScopedFamily`; a client-supplied `subject_id` must equal the family's maternal record
  (`assertMaternalSubject`) or the request is `forbidden`. Cross-family media minting is rejected
  (proven by integration test).
- **Auth / sessions** — all new routes are protected; none added to `PUBLIC_ROUTES`. Fail closed.
- **Audit logging** — every vital/report/dashboard access records a metadata-only audit entry
  (no PHI), verified by tests.
- **PHI-safe logging** — audit metadata carries only non-identifying keys (e.g. `vital_type`).
- **Input validation + formula-injection** — service-level structural validation; unit/kind strings
  sanitised; the adapter's `sanitizeString` still neutralises `= + - @` at the storage boundary.
- **Media privacy** — stored `media_ref` is a private opaque id; viewing requires a fresh,
  HMAC-signed, expiring reference; no durable public link exists anywhere (privacy integration test).
- **StorageAdapter / API boundary / GAS transport** — unchanged; new media endpoint uses a query
  param (`report_id`) rather than a path segment, matching the GAS `doGet`/`doPost` transport and the
  router's exact-match dispatch.

---

## 8. Known limitations

1. **Report media is metadata-only in v1.** The client sends an opaque upload handle (the chosen
   file's name); byte transfer to private Drive + OCR (`docs/07-AI/106`) is a later sprint. The
   **privacy boundary is already fully enforced** (private ref + short-lived view refs).
2. **Charts use inline SVG, not Chart.js.** The spec named Chart.js; an accessible inline-SVG
   sparkline was chosen instead to keep the build hermetic and honour the R-3 bundle-bloat
   mitigation (zero added dependency). It meets the §8 acceptance criteria — AA, data-table
   alternative, reduced-motion respected (no animation).
3. **Clinical reference bands intentionally absent** (approved decision 1) — deferred to sourced work.
4. **Dashboard `next actions` are minimal** — appointments/medicines/vaccinations modules are not
   in Sprint 02, so those sources are empty by design; the status + metrics + recent-timeline
   sections are fully populated.
5. **`recent()` scans the family's events in memory** — fine for MVP data volumes; a windowed read
   is a future optimisation.

---

## 9. Technical debt

- No new debt introduced beyond the limitations above. Existing tracked debt (GitHub Issues
  #5–#15) was not touched and not duplicated.
- Follow-ups worth tracking (not blockers): real media byte pipeline; sourced ACOG/FIGO reference
  bands (from `docs/02-Research/21,22`); dashboard next-actions once appointment/medicine modules ship.

---

## 10. Acceptance criteria (spec §8)

- [x] Logging a vital returns the created event **and** an updated trend; the event appears on the timeline.
- [x] Trend is surfacing-only — no diagnostic/prescriptive language anywhere in vitals output.
- [x] Report media served only through short-lived backend-mediated refs; no public URL exists
      (verified by `reports-media-privacy.test.ts`).
- [x] Dashboard renders status + next actions + recent timeline reading from services, with zero
      cross-module writes.
- [x] Charts pass AA with an accessible text/table alternative and respect reduced-motion.
- [x] Input validation blocks spreadsheet formula-injection.

---

## 11. Definition of Done (spec §12)

- [x] MS-1.2 / 1.3 / 1.5 exit behaviours delivered.
- [x] Surfacing-only + media-privacy verified by tests.
- [x] a11y AA on new surfaces (image label + data-table alt; no motion).
- [x] Tests green; no coverage reduced.
- [x] Docs in sync — frozen architecture unchanged; no architecture docs modified.
- [x] Deployable (build passes; no new required deployment secret).

---

## 12. Final recommendation

Sprint 02 is complete and fully validated against the frozen architecture. **Ready for Sprint 02
completion review**, after which a PR may be opened from `claude/wise-bloom-sprint-02-4j7g1g`.
No PR has been opened and Sprint 03 has not been started, per instructions.
