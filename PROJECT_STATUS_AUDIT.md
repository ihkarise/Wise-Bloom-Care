# Wise Bloom Care — Project Status Audit

| Field       | Value                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit date  | 2026-09-07                                                                                                                                                                                                                                              |
| Audited ref | `main` @ `6d8ed0e` (PR #21 merge — Sprint 02 deploy-hardening tip)                                                                                                                                                                                      |
| Auditor     | Automated status audit (branch `claude/wise-bloom-status-audit-ho47xz`)                                                                                                                                                                                 |
| Scope       | Whole-repository status: deployment, sprints, code, tests, architecture, medical governance, and Sprint 03 readiness                                                                                                                                    |
| Method      | Direct inspection of the working tree + independent re-run of the test suite + verification against the real GitHub Actions run history. No claim in this report is taken on trust from a prior report; each is grounded in the evidence logged in §12. |

---

## 1. Executive summary

Wise Bloom Care is a maternal-and-child health record built as a pnpm monorepo:
a static **Astro + React** frontend (GitHub Pages), a **Google Apps Script**
backend (`/exec` Web App), and a **Google Sheet** as the datastore, over a
frozen, fully-specified domain contract.

**Overall status: Sprint 02 complete and live; Sprint 03 not started (code).**

- The full three-tier stack is **deployed and verified working end-to-end**
  against the real deployed system — not mocks — as of 2026-09-06
  (E2E workflow run #9, success on this exact `main` SHA; §4, §12).
- The local quality gate is **green**: **227 automated tests pass, 0 fail**
  (independently re-run in this audit; §6).
- Sprints 00, 01, 02 are delivered. **Sprint 03 (Appointments, Medicines +
  reminders, Notifications subset, Nutrition, Exercise, week-by-week Knowledge)
  has no runtime code yet** — only its pre-authored medical knowledge content
  exists, and the data layer is partly forward-provisioned (§7, §8).
- Three documentation/state inconsistencies were found; none blocks the running
  system, but one is misleading and should be corrected (§9, findings F-1..F-3).

There is **no NO-GO condition on the running system.** The open items are
forward work (Sprint 03) and a stale report on `main`.

---

## 2. What Wise Bloom Care is (context)

A "one continuous record" for pregnancy and early childhood: vitals, reports,
timeline, dashboard, and (from Sprint 03 onward) appointments, medicines with
reminders, nutrition/exercise guidance, and gestational-age-driven educational
knowledge. Medical content is governed: every item surfaced to a user must
carry a closed `content_type` and a non-empty `source_ref`, enforced at both
write and read by `ContentService` (§8).

Architecture decisions are recorded in six ADRs (`docs/ADR/ADR-001..006`):
Google Sheets datastore, Apps Script backend, Astro frontend, token
authentication, AI architecture, and domain strategy. The architecture baseline
is marked **FROZEN** (`v1.0.0-Architecture`); sprints implement against it
rather than changing it.

---

## 3. Repository shape

```
apps/backend    Apps Script backend (services / controllers / adapters / lib)
apps/web        Astro + React frontend (islands, pages, api, state)
packages/       api-contract, domain-types, config (shared, frozen contract)
tools/          lint-rules (custom ESLint rules with their own tests)
tests/          cross-cutting integrity tests (timeline continuity)
e2e/            standalone Playwright project (real deployed-system smoke)
knowledge-base/ authored medical content (40 pregnancy weeks + area scaffolds)
docs/           00-Vision .. 13-Future, ADR/, 20-Implementation/ (sprint specs)
```

---

## 4. Deployment status — the live stack

The three tiers are deployed and were proven to work **together**, end-to-end,
from a GitHub-hosted runner (the sandbox cannot reach `*.github.io` /
`script.google.com`, so the authoritative evidence is the Actions history, not
a probe from this audit environment).

| Tier           | Mechanism                                                         | Latest result                                                                                 | Evidence                                                                                                                                      |
| -------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | `deploy-pages.yml` → GitHub Pages                                 | **success** on `main` `6d8ed0e`                                                               | Deploy Pages run #4 `34027241893` (2026-09-06 10:22)                                                                                          |
| Backend        | `deploy-dev.yml` → clasp push of the esbuild GAS bundle           | **success**                                                                                   | Deploy (dev) run #11 `33980627058` (GAS-bundle fix `d097be1`)                                                                                 |
| Datastore      | Google Sheet DEV                                                  | configured (owner-side: `SPREADSHEET_ID`, `EMAIL_PEPPER`, `ENVIRONMENT=dev`, access = Anyone) | Prerequisite for the green E2E below                                                                                                          |
| **End-to-end** | `e2e.yml` — real Playwright smoke, GitHub Pages → `/exec` → Sheet | **success**                                                                                   | E2E run #9 `34027271464`, job `playwright smoke (deployed)`, step "Run Sprint 02 staging smoke test" = success, ~2.5 min, on `main` `6d8ed0e` |

**The E2E is real, not mocked:** it drives the deployed browser app, which calls
the deployed Apps Script `/exec`, which reads/writes the DEV Sheet — register,
login, log a vital, upload a report, timeline, dashboard, and the
security-boundary checks (unauthenticated `/v1/timeline` rejected;
unauthenticated media mint refused). The job ran the test (it did not skip: step
5 executed for ~2.5 min and concluded success).

Run history shows the honest path to green: E2E runs #1–#8 **failed** during
deploy hardening (client-transport `path`-param fix, the esbuild GAS bundle so
`doGet`/`doPost` actually deploy, anonymous-access manifest, deferred-island
hydration), and run **#9 succeeded** once PR #21 landed on `main`. The system is
green _at the currently-audited SHA_.

**Caveat (honest):** this audit did not re-run a live probe (egress-blocked
here). Run #9 is dated 2026-09-06; `main` has not advanced since, so the
deployed frontend artifact matches the audited code. The Apps Script `/exec`
deployment and the DEV Sheet are owner-managed and _could_ drift independently
of `main`; re-dispatching `e2e.yml` is the one-click way to re-confirm liveness
at any time.

---

## 5. Sprint progress ledger

| Sprint                                                                                            | Spec  | Status                    | Notes                                                              |
| ------------------------------------------------------------------------------------------------- | ----- | ------------------------- | ------------------------------------------------------------------ |
| 00 — Scaffolding                                                                                  | `205` | ✅ Done                   | `SPRINT_00_COMPLETION_REPORT.md`                                   |
| 01 — Pregnancy core, timeline, content gate, auth                                                 | `206` | ✅ Done                   | Release package + CI verification recorded                         |
| 02 — Vitals, reports, dashboard, **first live deploy**                                            | `207` | ✅ Done & live            | Merged (PR #17); deployed; real E2E green (§4)                     |
| 03 — Appointments, Medicines+reminders, Notifications subset, Nutrition, Exercise, week Knowledge | `208` | ⛔ **Not started (code)** | Knowledge content authored; data layer partly pre-provisioned (§7) |
| 04 — Delivery/postpartum                                                                          | `209` | Planned                   | —                                                                  |
| 05 — Newborn/child                                                                                | `210` | Planned                   | —                                                                  |
| 06 — Growth/milestones/vaccination                                                                | `211` | Planned                   | —                                                                  |
| 07 — Full notifications                                                                           | `212` | Planned                   | Sprint 03 ships only the reminder subset                           |
| 08 — Hardening/launch                                                                             | `213` | Planned                   | —                                                                  |

---

## 6. Code & test inventory (independently verified)

**Test gate — re-run in this audit, exit 0:**

| Suite                                  | Files  | Tests   | Result            |
| -------------------------------------- | ------ | ------- | ----------------- |
| `apps/web`                             | 14     | 50      | ✅ pass           |
| `apps/backend`                         | 22     | 163     | ✅ pass           |
| `tools/lint-rules` + `tests/integrity` | 3      | 14      | ✅ pass           |
| **Total**                              | **39** | **227** | **✅ 0 failures** |

This exactly matches the count claimed in the Sprint 02 reports (227). The full
CI gate (`ci.yml`) is lint → format:check → `typecheck` → `pnpm -r test` →
`pnpm -r build`, plus a Gitleaks secret-scanning job. (Note: `pnpm -r test`
picks up the two `apps/*` packages; the `tools/lint-rules` and `tests/integrity`
suites were re-run directly to confirm the remaining 14 — all green.)

**Backend (`apps/backend/src`):**

- Services (12): Auth, Session, Audit, Family, Maternal, Pregnancy, Timeline,
  Content, Trend, Vitals, Reports, Dashboard.
- Controllers (7 + helpers): auth, family, maternal, timeline, vitals, reports,
  dashboard (+ `router`, `rbac`, `requestHelpers`).
- Lib (9): crypto, gestation, ids, logging, media, password, random,
  rateLimiter, validation.
- Sheet table mappings (in `adapters/sheets/tables`): the full frozen entity set
  (see §7).

**Frontend (`apps/web/src`):**

- Feature islands (14): auth (Login/Register/Logout/DisclaimerGate), dashboard
  (Island/RecentTimeline/StatusCards), pregnancy (PregnancySetupIsland), reports
  (Upload/Viewer), timeline (TimelineView), vitals (Log/Chart/TrendCard).
- Pages (4): `index`, `login`, `register`, `app`.
- API modules (8): auth, client, dashboard, family, maternal, reports, timeline,
  vitals — all network goes through `api/` (enforced by the
  `no-network-outside-api` lint rule).

---

## 7. Architecture status (frozen baseline)

The architecture is implemented as designed and its invariants are enforced in
code and tests:

- **Contract-first / frozen shape.** `packages/domain-types` declares the full
  19-entity registry and `packages/api-contract` declares the `/v1` endpoint
  surface _up front_. Sprints fill in services/controllers behind that shape.
  Notably, `Appointment`, `Medicine`, `ContentItem`, and `ScheduleEntry` are
  **already defined as domain types and already have Sheet table mappings**
  (`content_index`, etc.) even though their Sprint 03 services do not exist yet —
  the data layer is forward-provisioned.
- **Layering enforced by custom lint rules (green):**
  `no-sheets-outside-adapter` (services never touch Sheets directly) and
  `no-network-outside-api` (all frontend network via `api/`).
- **Safety invariants covered by tests:** timeline append-only + continuity,
  RBAC fail-closed (a caller cannot act outside their family), media privacy
  (no public URLs; media refs are short-lived and auth-gated), and every write
  audited.
- **GAS transport constraints** are respected (route/token/idempotencyKey/
  correlationId as query params; `text/plain` body; preflight-free; **no
  `no-cors`**), and the backend is shipped as a single esbuild bundle exposing
  global `doGet`/`doPost` (the only shape Apps Script can invoke).

No architecture drift was found. No ADR is contradicted by the current code.

---

## 8. Medical content governance status

- **The gate exists and is strict.** `ContentService` refuses to **register or
  serve** any item lacking a valid `content_type` (one of `educational`,
  `clinical_recommendation`, `emergency_warning`) and a non-empty `source_ref` —
  and re-validates on **read**, not just write, because the Sheet has no schema
  enforcement. `findByTopic` silently drops any corrupted/untyped row.
- **Knowledge content is authored and compliant.** All **40** pregnancy week
  files (`knowledge-base/pregnancy/week01..week40.md`) carry `content_type:
educational` **and** a `source_ref` (e.g. `S-WHO-ANC`, `S-ACOG-GWG`, plus
  named clinical references), a plain-language "educational information, not
  medical advice" disclaimer, and explicit `[FACT / general]` / `[VERIFY]`
  markers so unverified framing is flagged rather than asserted. Other areas
  (nutrition, exercise, emergency, medicines, delivery, …) have typed+sourced
  README scaffolds; emergency content is correctly typed `emergency_warning`.
- **Frontend disclaimer gate** (`features/auth/DisclaimerGate.tsx`) is present.

**Gap (readiness, not compliance):** nothing yet **ingests** the authored week
files into the `content_index`/`ContentItem` store, and no controller calls
`ContentService`, so the compliant content is authored but **not yet served**.
That wiring is exactly Sprint 03's Knowledge task.

---

## 9. Findings (ranked)

**F-1 — `SPRINT_02_DEPLOYMENT_REPORT.md` on `main` still says "NO-GO". (Medium — misleading, not a system defect.)**
The report on `main` records the pre-fix state ("blocked on one owner-side Apps
Script setting"). Reality has since moved on: the owner completed the setting,
the transport/bundle/hydration defects were fixed and merged, and the real E2E
went green (run #9, §4). The corrected GO version was committed only on the
`claude/wise-bloom-deploy-sprint-02` branch (`38b4495`) and never merged to
`main`. **Recommendation:** fold the corrected GO report onto `main` so the
repo's own record matches the verified live state.

**F-2 — Contract endpoints declared but unrouted: `GET /v1/content`, `GET /v1/appointments` (plus `/v1/growth`, `/v1/milestones`, `/v1/vaccinations`). (Low — expected forward stubs.)**
These paths exist in `packages/api-contract` but have no handler in the router /
`handlers` map, and `ContentService` (though instantiated in `buildApp` and
exposed on the app object) is referenced by no controller. This is the intended
"contract ahead of implementation" pattern, but a caller hitting `/v1/content`
today gets a not-found, not content. Wiring these is Sprint 03+ work; noted so
it is not mistaken for a live capability.

**F-3 — Sprint 03 domain types absent: `NutritionEntry`, `ExerciseEntry`, `Notification`. (Low — expected; Sprint 03 scope.)**
Confirmed absent from `packages/domain-types` (0 occurrences) and from the table
map. Sprint 03 §5 explicitly lists adding them. No action now beyond tracking.

**Housekeeping:** the repo root carries a large set of historical review/report
markdown files (Sprint 01 has ~8, Sprint 02 has 3, plus several one-off review
reports). Not a defect, but consolidating superseded reports would reduce noise.

---

## 10. Sprint 03 readiness assessment

**Verdict: ready to start; well-scaffolded; zero runtime code written.**

What is already in place (accelerators):

- Domain types + table mappings for `Appointment`, `Medicine`, `ContentItem`,
  `ScheduleEntry` (data layer forward-provisioned).
- Contract stubs `GET /v1/appointments`, `GET /v1/content`.
- `ContentService` gate (register + serve, typed+sourced) — the hard part of the
  Knowledge/Nutrition/Exercise governance is done.
- All 40 pregnancy week files authored, typed, sourced, disclaimer-bearing.
- A proven deploy + real-E2E pipeline to extend.

What Sprint 03 must build (per `docs/20-Implementation/208-SPRINT_03.md`):

- **Services:** Appointments, Medicines, Nutrition, Exercise, Notification
  (reminder subset). **None exist.**
- **Controllers + routing:** appointments, medicines, nutrition, exercise,
  notifications, **content** (wire the existing `ContentService`). **None exist.**
- **Data:** new tables `nutritionEntries`, `exerciseEntries`, `notifications`;
  new domain types `NutritionEntry`, `ExerciseEntry`, `Notification`.
- **Scheduling:** `lib/schedule.ts` for per-environment reminder scheduling
  (GAS time-driven triggers). No-PHI notification log.
- **Knowledge plumbing:** ingest `knowledge-base/pregnancy/week-NN` into the
  content store (bundled — Apps Script has no runtime filesystem) and serve it
  by gestational age through `ContentService` (always typed + sourced; untyped
  never served — acceptance criterion MS-1.6).
- **Frontend:** appointment/medicine/nutrition/exercise islands + a GA-driven
  `WeekKnowledgeCard`; `DashboardService` next-actions for upcoming
  appointments/medicine reminders; `TimelineView` rendering the new event types.
- **Tests:** unit (CRUD + timeline emission, GA→content mapping, typing),
  integration (reminder fire end-to-end, week-knowledge typed/sourced), a11y AA
  on the new forms, Content-DoD (no invented facts), and an extended real E2E.

Sprint 03's acceptance bars (MS-1.4 reminder fires + logged + visit on timeline;
MS-1.6 GA content always typed+sourced; no-PHI notification logs; per-env
reminders) are all testable against the existing gate + deploy pipeline.

---

## 11. Risks

- **R-1 (medical):** untyped/unsourced guidance leaking to users. _Mitigation
  already present:_ the `ContentService` read+write gate and Content-DoD tests;
  keep every new surface behind it.
- **R-2 (ops):** GAS time-driven trigger quotas/limits for reminders; owner must
  install the trigger manually. _Mitigation:_ the chosen Sprint 03 approach is a
  queue + an authenticated "process due reminders" endpoint the owner wires to a
  trigger — deterministically testable without wall-clock.
- **R-3 (state drift):** the owner-managed `/exec` deployment and DEV Sheet can
  drift from `main`. _Mitigation:_ re-dispatch `e2e.yml` to re-confirm liveness;
  it is the source of truth for "is it actually working right now".
- **R-4 (doc/reality drift):** F-1 is a live example. Keep deployment reports on
  `main` in sync with verified state.

---

## 12. Recommendations (prioritised)

1. **Correct the record (F-1):** merge the GO Sprint 02 deployment report onto
   `main`. Cheap, removes a misleading NO-GO from the source of truth.
2. **Begin Sprint 03 as verified increments**, deploying and re-running the real
   E2E after each: (1) design-system + app shell/nav + week Knowledge; (2)
   Appointments; (3) Medicines + reminders (queue + authenticated process
   endpoint + owner trigger install); (4) Nutrition + Exercise.
3. **Wire `GET /v1/content` first** (F-2): it unlocks serving the already-compliant
   knowledge content and exercises the least new code.
4. **Keep the invariants green** on every increment: layering lint rules, RBAC
   fail-closed, timeline append-only, media privacy, no-PHI logs, a11y AA.
5. **Optional hardening follow-up** flagged in Sprint 02: make the auth forms
   inert until hydrated (a login retry on a cold browser context briefly put the
   password in the URL before React hydrated). Not a data leak to the backend,
   but worth closing.

---

## 13. Evidence log (grounding)

- Audited ref: `main` `6d8ed0e` (local tree clean; audit branch fast-forwarded
  to this SHA from a stale Sprint-01-era tip).
- Test gate: `pnpm -r test` → web 14 files/50 tests, backend 22/163, exit 0;
  `vitest run tools/lint-rules tests/integrity` → 3 files/14 tests. Total 227, 0
  failures.
- GitHub Actions (repo `ihkarise/Wise-Bloom-Care`):
  - E2E `e2e.yml` run #9 `34027271464` — **success** on `6d8ed0e`; job
    `playwright smoke (deployed)` step "Run Sprint 02 staging smoke test"
    success (2026-09-06). Runs #1–#8 failed (deploy-hardening iterations).
  - Deploy Pages `deploy-pages.yml` run #4 `34027241893` — **success** on
    `6d8ed0e`.
  - Deploy (dev) `deploy-dev.yml` run #11 `33980627058` — **success**
    (GAS-bundle fix `d097be1`).
- Code facts verified by direct read: composition root `apps/backend/src/app.ts`
  (7 controllers wired; `content` instantiated but unrouted); router has no
  content/appointments handler; `packages/api-contract` declares `GET /v1/content`
  - `GET /v1/appointments`; `packages/domain-types` 19-entity registry includes
    Appointment/Medicine/ContentItem/ScheduleEntry, excludes
    NutritionEntry/ExerciseEntry/Notification; all 40 `knowledge-base/pregnancy/week*.md`
    carry `content_type` + `source_ref`.

---

_Audit complete. Running system: green and live. Sprint 03: ready to start, not
yet begun. Sprint 04+ started: NO._
