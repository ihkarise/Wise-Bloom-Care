# Sprint 02 — Live DEV Deployment Report

**Date:** 2026-09-11
**Scope:** Sprint 02 deployment, stabilisation, front-door correction and visual
refinement only. Sprint 03 NOT started. Frozen architecture docs NOT modified.
No product/medical logic changed. No tests weakened. No mocks. No `no-cors`.
Synthetic data only.

**Overall verdict: GO — the live DEV deployment is a usable website and the full
synthetic journey passes end-to-end against the real DEV backend.**

Every fact below is tied to a named workflow run, commit, or command output.

---

## 1. Sprint 02 status

| Area                                   | Status                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| Sprint 00 Foundation                   | COMPLETE                                                        |
| Sprint 01 Identity & Timeline          | COMPLETE                                                        |
| Sprint 02 Dashboard + Vitals + Reports | COMPLETE                                                        |
| Sprint 02 backend                      | LIVE in DEV (Apps Script Web App, anonymous, real Sheet writes) |
| Sprint 02 frontend                     | LIVE on GitHub Pages, with a real landing front door            |
| Google Sheet / Apps Script config      | COMPLETE (owner-side anonymous access resolved)                 |
| Deployment / stabilisation / visual QA | COMPLETE and verified live                                      |
| Sprint 03                              | NOT started (locked)                                            |

## 2. Key facts

| Item                         | Value                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Default branch HEAD (`main`) | `82346ef` (fast-forward merge of `claude/elegant-babbage-kuqfbq`; no divergence)                                   |
| Stabilisation commits        | `920d56d` entry-point CTAs · `8b9c741` landing redesign · `31c67d4` e2e hydration fix · `82346ef` gitignore chore  |
| Release tag                  | `v1.4.0-sprint-02`                                                                                                 |
| **Live website URL**         | `https://ihkarise.github.io/Wise-Bloom-Care/`                                                                      |
| Base path                    | `/Wise-Bloom-Care/` (Astro `base`; internal links via `withBase`)                                                  |
| **Apps Script DEV `/exec`**  | `https://script.google.com/macros/s/AKfycbxGTss7Hpkul4y299TGsTxQj2F26k2DhbHOp9TdvzrLwZJ9b183b5HOUtq6Iu700Cpx/exec` |
| `PUBLIC_API_BASE_URL`        | Baked at build time in `deploy-pages.yml` to the `/exec` above (public config, not a secret)                       |
| Test count                   | **227** (web 50 · backend 163 · lint-rules 9 · cross-app 5)                                                        |

## 3. Deployment workflow results

| Workflow                       | Run                           | Result                                                           |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------- |
| Deploy (dev) — backend (clasp) | #11 `33980627058` @ `d097be1` | **success** — bundled GAS (`doGet`/`doPost`), `ANYONE_ANONYMOUS` |
| Deploy Pages — frontend        | #6 `34637658517` @ `8b9c741`  | **success** — redesigned landing published to Pages              |
| E2E (staging smoke) — live     | #14 `34638654202` @ `31c67d4` | **success** — 19/19, first attempt, no retry (see §6)            |

## 4. Deployment architecture

```
Browser (any, logged out)
  │  https://ihkarise.github.io/Wise-Bloom-Care/   (static Astro + React islands, GitHub Pages)
  │      • base path /Wise-Bloom-Care/ ; internal links via withBase
  │      • single API transport (apps/web/src/api/client.ts)
  ▼  cross-origin, preflight-free (CORS-safelisted headers only; route/token/ids as query params)
Google Apps Script Web App  …/exec   (executeAs USER_DEPLOYING, access ANYONE_ANONYMOUS)
  │      • doGet/doPost from the esbuild bundle (gas-dist/main.js)
  │      • bearer-token auth + family-scope RBAC gate every request server-side
  ▼
Private Google Sheet (v1 storage, behind the swappable StorageAdapter) + private Drive refs
```

The two frozen independence boundaries are intact: the client depends only on
`@wise-bloom/api-contract`; only the `SheetsStorageAdapter` touches Sheets. No
architecture document or ADR was modified in this pass.

## 5. User journey (front door → record)

```
Landing (/) ── Create your account / Log in
      ↓
Register  → account + family + maternal record created (real Sheet write)
      ↓
Login     → bearer session; /app is auth-guarded (redirects to login when signed out)
      ↓
Dashboard → server-aggregated status + recent timeline
      ↓
Vitals / Reports / Timeline → log a vital (trend surfaces), upload a report (private ref), events on timeline
```

The public landing now communicates the product ("One continuous record.", the
mother/child single-record thesis), offers clear primary (**Create your
account**) and secondary (**Log in**) actions, and states the privacy +
educational-not-diagnostic posture. Developer terminology ("Sprint 00 foundation
shell", "Build baseline", "Environment: dev") has been removed from the public
page.

## 6. E2E test result (live, today)

- **Harness:** `e2e/sprint02.spec.ts` — 19 `test.step` checks, real Chromium on a
  GitHub Actions runner (which reaches `github.io` and `script.google.com`),
  against the **deployed** system. No localhost, no mocks, synthetic data only.
- **Result:** run **#14** (`34638654202`, `main` @ `31c67d4`, 2026-09-11 19:26
  UTC) — **success, 19/19 on the first attempt, no retry** (failure-only trace
  artifacts absent; report 185 KB).
- **Verified live:** landing loads and offers entry links → login/register routes
  → **registration (real Sheet write)** → login in a second browser context →
  authenticated app shell → family/maternal record resolves → timeline empty
  state → dashboard (server-aggregated) → **log a weight vital** → trend surfaces
  (62.5 kg) → vital on timeline → **upload a synthetic lab report** → report on
  timeline → unauthenticated `/v1/timeline` refused (`unauthenticated`) → media
  ref requires auth → logout clears the session → log back in → session persists
  across reload → direct `/app` without a session redirects to login. No data
  leakage between synthetic users (each run uses a unique timestamped email;
  cross-family access is refused).
- **Flake fixed (not hidden):** the auto-run right after the redesign deploy
  (#13 `34637752738`) failed at the login step with a client-side
  `validation_failed`. Root cause was a submit-before-hydrate race **in the
  test** — it filled the Astro `client:load` auth form before the island's
  dynamic import hydrated, so an empty field reached the backend. Fixed in
  `31c67d4` by waiting for network idle (island hydrated) before typing and
  asserting each value stuck — a strengthening, no assertion weakened, no product
  change. Confirmed by the clean #14 pass. (A human typing over several seconds
  never hits this; only an instant programmatic fill did.)

## 7. Visual QA result

Real desktop (1280px) and mobile (390px) screenshots were reviewed. The landing
was rebuilt from the Sprint 00 shell into a calm, healthcare-appropriate front
door on the existing semantic design tokens only (no new libraries, no
architecture change): brand nav, a focused hero with the product thesis and
primary/secondary actions, a three-card "What Wise Bloom Care does" section, a
"Private by design" trust band, and a footer. Responsive and readable at phone
and desktop widths; no console errors that affect use (only a benign root
`/favicon.ico` 404 outside the base path). Login, register and the `/app`
auth-redirect were already clean and cross-linked. Deferred (NOT done here, and
NOT blockers): a favicon, richer illustration/imagery, and any deeper design
system work — these are Sprint 03 / future items.

## 8. Security status

- Anonymous Google-level access to `/exec` is intentional; every request is still
  gated by bearer-token auth + family-scope RBAC server-side. The live E2E proves
  unauthenticated `/v1/timeline` is refused and media refs cannot be minted
  without auth.
- No secrets in the repo; `PUBLIC_API_BASE_URL` is public config; the media
  signing key is derived at runtime from a Script Property; deploy credentials
  live in GitHub secrets only.
- Media privacy (short-lived, backend-mediated refs; no public URL) and
  metadata-only audit logging (no PHI) are unchanged.
- This pass touched one presentational island and the e2e harness only.

## 9. Known limitations

- **Report media is metadata-only in v1** (private ref + short-lived view refs
  enforced; byte transfer + OCR are later sprints).
- **Clinical reference bands intentionally absent** (trend is surfacing-only).
- **Dashboard "next actions" minimal** — appointment/medicine/vaccination modules
  are not in Sprint 02.
- **No favicon yet** on the landing (Sprint 03 polish).
- Apps Script cold starts can add latency to the first backend call; the E2E
  keeps `retries: 1` for that reason.

## 10. Remaining blockers

None for Sprint 02 deployment/stabilisation. The live site is openable and the
full synthetic journey passes end-to-end against the real DEV backend.

## 11. Exact next recommended stage

**Sprint 03 — Delivery transition (the continuity keystone): auto-create the
linked child profile at delivery with no duplicates (docs/06-Modules/88,
docs/08-Timeline/111, MS-1.7).** Do NOT begin until explicitly approved.

---

## Final gate — GO / NO-GO

| Check        | Result | Evidence                                                                      |
| ------------ | ------ | ----------------------------------------------------------------------------- |
| CODE         | PASS   | lint, format, typecheck (0 errors), **227 tests**, build — all green today    |
| BACKEND      | PASS   | Deploy (dev) #11 success; live `/exec` serves anonymous real Sheet writes     |
| FRONTEND     | PASS   | Deploy Pages #6 success; static Astro + Chart.js lazy chunk                   |
| GITHUB PAGES | PASS   | Live at `/Wise-Bloom-Care/`; base-path routing correct; no 404 on entry       |
| LANDING PAGE | PASS   | Real front door: thesis + Create-account/Log-in CTAs; no dev terminology      |
| AUTH JOURNEY | PASS   | register → login → app → logout → re-login → persists (E2E #14)               |
| E2E          | PASS   | run #14 `34638654202` — 19/19, first attempt, live deployed system            |
| VISUAL QA    | PASS   | redesigned landing verified at desktop + mobile; calm, healthcare-appropriate |

**OVERALL: GO for Sprint 03** — pending your explicit approval. Sprint 03 remains
locked until you approve it.
