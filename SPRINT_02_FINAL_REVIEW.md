# Sprint 02 — Final Release Review

| Field                 | Value                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Sprint                | 02 — Dashboard + Vitals + Reports over the timeline engine       |
| Branch                | `claude/wise-bloom-sprint-02-4j7g1g`                             |
| Base                  | `v1.3.0-sprint-01` (`90eb67a`) — Sprint 01, merged + tagged      |
| Milestones            | MS-1.2 (Dashboard), MS-1.3 (Vitals), MS-1.5 (Reports) — `204` §4 |
| Spec                  | `docs/20-Implementation/207-SPRINT_02.md`                        |
| Architecture baseline | `v1.0.0-Architecture` (FROZEN — unchanged)                       |
| Review date           | 2026-08-23                                                       |
| Decision              | **GO WITH NOTES** (see §12)                                      |

---

## 1. Scope (verified against the branch, not the report)

Three MS-1 surfaces on the frozen Sprint 01 foundation:

- **Dashboard (MS-1.2)** — `DashboardService` + `dashboardController` + `/v1/dashboard`; at-a-glance
  status, metric tiles with trend, recent-timeline preview. Aggregation-only, zero cross-module writes.
- **Vitals (MS-1.3)** — `VitalsService` + `TrendService` + `vitalsController`; log BP / weight / blood
  sugar, append a `vital` timeline event, return a surfacing-only arithmetic trend. BP stored as two
  Vital rows sharing `measured_at`, paired at the service layer. **Chart.js** vitals charts.
- **Reports (MS-1.5)** — `ReportsService` + `reportsController` + `lib/media.ts`; upload lab/ultrasound
  metadata, view via short-lived HMAC-signed backend-mediated refs. Never a public link.

Out of scope and confirmed absent: delivery, baby/growth, AI, notifications, prediction, sharing,
medicines, appointments, week-by-week knowledge, hardening. **No Sprint 03 work is present.**

## 2. Architecture compliance

| Check                                                             | Result                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Frozen docs (00–13), ADRs, docs/20 unchanged                      | ✅ verified — diff since `v1.0.0-architecture` is empty for those paths |
| Charting library = **Chart.js** (ADR-003, `51` §9, `83`)          | ✅ **fixed this review** — see §3                                       |
| StorageAdapter boundary (services never touch Sheets)             | ✅ `no-sheets-outside-adapter` lint rule green                          |
| Single transport (all network via `api/`)                         | ✅ `no-network-outside-api` lint rule green                             |
| API contract additive / backward-compatible (`56` §9)             | ✅ `/v1/dashboard`, `/v1/reports*`, BP variant added additively         |
| Trend surfacing-only, no diagnosis / no reference bands (`52` §6) | ✅ arithmetic only; verified by `trend.test.ts` copy assertions         |
| Media privacy — no public link (`58`, `84`)                       | ✅ `reports-media-privacy.test.ts`                                      |

## 3. Chart.js deviation — resolved (the one true release blocker)

The branch originally shipped an inline-SVG sparkline and documented it as an accepted trade-off
("no chart dependency"). But **Chart.js is mandated at the frozen architecture level** — `docs/ADR/
ADR-003-Astro` ("Chart.js for the required calm, accessible charts"), `docs/04-Architecture/50` and
`51` (stack: "Astro + React + TS + Tailwind + Chart.js"), and `docs/06-Modules/83` ("charts via
Chart.js accessible components"). The architecture does **not** permit the deviation, and it must not
be dissolved by editing an ADR. So this review took **Option A: implement Chart.js.**

- `charts.ts` — now a pure `buildLineChartConfig(points, options)` returning a `ChartConfiguration<'line'>`
  (no DOM, unit-tested). Calm framing: single series, legend hidden, gentle tension.
- `VitalChart.tsx` — renders the config on a `<canvas>`; **`chart.js/auto` is dynamically imported**
  so the ~71 kB (gzip) library is emitted as a separate `_astro/auto.*.js` chunk and loads only when
  a chart mounts. The initial `client.js` bundle is unchanged — R-3 (bundle bloat) honoured.
- Accessibility preserved: `<canvas role="img">` with a factual `aria-label`, an always-present
  data-table alternative, and `prefers-reduced-motion` disables animation. Where no 2D context exists
  (SSR/tests), the data-table stands in on its own.

## 4. Acceptance criteria (`207` §8) — evidence

| Criterion                                                              | Status | Evidence                                                                     |
| ---------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Logging a vital returns event **and** trend; appears on timeline       | ✅     | `integration/vitals-timeline.test.ts`                                        |
| Trend surfacing-only — no diagnostic/prescriptive language             | ✅     | `services/trend.test.ts`, `lib/trend-format` tests                           |
| Report media via short-lived backend refs; no public URL               | ✅     | `integration/reports-media-privacy.test.ts`                                  |
| Dashboard = status + next actions + recent timeline; zero cross-writes | ✅     | `services/dashboard.test.ts`                                                 |
| Charts AA + text/table alternative + reduced-motion                    | ✅     | `features/vital-chart.test.tsx`; Chart.js animation off under reduced motion |
| Input validation blocks formula-injection                              | ✅     | `services/vitals.test.ts`; adapter `sanitizeString`                          |

## 5. Tests (exact, from local gate run — reproduced CI)

- **Backend:** 22 files, **161 tests** — pass.
- **Frontend:** 14 files, **46 tests** — pass (charts config builder +2 vs the pre-review 44).
- **Total: 207 tests, 0 failures.**
- Safety-critical suites green: timeline append-only/continuity, RBAC fail-closed, media privacy,
  vital→timeline, audit-on-read.

## 6. Six-gate result (local, `.github/workflows/ci.yml`)

| Gate                                              | Result |
| ------------------------------------------------- | ------ |
| `pnpm lint` + `pnpm -r lint` (boundary rules)     | ✅     |
| `pnpm format:check` (Prettier)                    | ✅     |
| `pnpm -r typecheck` (tsc + `astro check`, 0 errs) | ✅     |
| `pnpm -r test` (207)                              | ✅     |
| `pnpm -r build` (Chart.js lazy chunk confirmed)   | ✅     |
| Secret scan (gitleaks) — runs in CI               | ⏳ CI  |

## 7. Security

Every Sprint 01 control preserved; none weakened. RBAC family-scoping on every vitals/reports/dashboard
route (fail-closed; cross-family media minting rejected). All new routes auth-protected, none public.
Audit metadata-only (no PHI). Media privacy: private opaque `media_ref`; viewing requires a fresh,
HMAC-signed, expiring ref; no durable public link. Media signing key derived from the existing
`EMAIL_PEPPER` Script Property — **no new required secret**, nothing committed. Adding Chart.js
introduced no secret and no network egress (it is a client render library; dynamic `import()` of a
bundled module, not a fetch).

## 8. Accessibility

Built accessibly at the surface level: `VitalChart` exposes an image label + data-table alternative +
reduced-motion; forms/labels present on the vitals/report islands. **Automated a11y (axe) sweeps across
all flows are not yet wired** — per `204` §5 WCAG 2.2 AA verification is a **v1 RC / Sprint 08** exit
gate, not a Sprint 02 gate. Classified NON-BLOCKING, tracked to hardening.

## 9. Performance

The chart island lazy-loads Chart.js (separate chunk), keeping the initial bundle small. **Formal
performance-budget evidence (`134`) is not captured** — also a **v1 RC / Sprint 08** gate per `204` §5.
NON-BLOCKING, tracked to hardening.

## 10. E2E status

`tests/e2e/` holds only `.gitkeep` — **no browser E2E yet.** The Sprint 02 safety-critical flows
(continuity, media privacy, RBAC, vital→timeline) are covered by service↔adapter↔API **integration**
tests. Full browser E2E becomes meaningful only against a served target; it is scheduled for the first
live deployment smoke (this task's Phases 10–11) and hardening (Sprint 08). NON-BLOCKING for merge.

## 11. Deployment readiness

Deployable: build passes, no new required secret. **First live deployment is blocked on inputs only the
repository owner can provide** (see the deployment plan in the PR and `SPRINT_02_DEPLOYMENT_REPORT.md`
when produced):

- Frontend (GitHub Pages): repo **Pages must be enabled** (Settings → Pages → Source: GitHub Actions);
  a Pages workflow + `PUBLIC_API_BASE_URL` are needed post-merge.
- Backend (Google Apps Script): `deploy-dev.yml` has **never run** and is dry-run without secrets —
  needs `CLASPRC_JSON`, `DEV_SCRIPT_ID`, a Google Sheet (`SPREADSHEET_ID`), and `EMAIL_PEPPER`.

None of these are merge blockers; they gate the _deployment_, not the code.

## 12. Decision — GO WITH NOTES

Sprint 02 meets its milestone exit behaviours (MS-1.2/1.3/1.5), the frozen architecture is intact, the
sole architecture deviation (Chart.js) is resolved, and all six gates pass locally with 207 tests.

**Notes (non-blocking, tracked):**

1. Automated a11y (axe) and performance-budget evidence deferred to v1 RC / Sprint 08 per `204` §5.
2. Browser E2E deferred to first-deployment smoke + Sprint 08; integration tests cover the
   safety-critical flows now.
3. Report media is metadata-only in v1 (byte pipeline + OCR later); the privacy boundary is fully
   enforced today.
4. Live deployment blocked on owner-supplied Pages setting + Apps Script/Sheets secrets (§11).

**Recommendation:** open the Sprint 02 PR to `main`; merge on approval; tag `v1.4.0-sprint-02` at the
merge commit; then proceed to the first staging deployment once the §11 inputs are provided.
