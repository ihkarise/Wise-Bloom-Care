# Sprint 02 — Live DEV Deployment Report

**Date:** 2026-09-11
**Scope:** Sprint 02 deployment verification + hardening only. Sprint 03 NOT
started. Frozen architecture docs NOT modified. No tests weakened. No mocks
substituted for the real end-to-end. No `no-cors`. Synthetic data only.

**Overall verdict: GO — the live DEV deployment is usable end-to-end.**

The previous edition of this report (2026-09-05) concluded **NO-GO**, blocked on
an owner-side Apps Script anonymous-access setting (HTTP 403). That blocker has
since been resolved: the deployed backend now serves anonymous browser calls,
and a real-browser end-to-end run (GitHub Pages → Apps Script → Google Sheet)
completed the **full** synthetic user journey today. Every fact below is tied to
a named workflow run, commit, or local command output.

---

## 1. Verified current state (evidence)

| #   | Item                         | Value / status                                                                                                            | Evidence                                   |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Working branch (this change) | `claude/elegant-babbage-kuqfbq`                                                                                           | `git branch --show-current`                |
| 2   | Default branch HEAD          | `main` @ `6d8ed0e` (Merge PR #21)                                                                                         | `git log -1 origin/main`                   |
| 3   | Sprint 02 tag                | `v1.4.0-sprint-02` (`git describe` → `v1.4.0-sprint-02-20-g6d8ed0e`)                                                      | `git tag`                                  |
| 4   | Deploy workflow (frontend)   | `.github/workflows/deploy-pages.yml` — push to `main` (apps/web, packages) + manual                                       | run #4 `34027241893` **success**           |
| 5   | Deploy workflow (backend)    | `.github/workflows/deploy-dev.yml` — manual dispatch, clasp push of the bundled GAS                                       | run #11 `33980627058` **success**          |
| 6   | GitHub Pages config          | Project site, base `/Wise-Bloom-Care/` (astro.config `base`)                                                              | `deploy-pages` → `actions/deploy-pages@v4` |
| 7   | **Live frontend URL**        | `https://ihkarise.github.io/Wise-Bloom-Care/`                                                                             | reached by E2E steps 1–3 today             |
| 8   | Live backend `/exec`         | `https://script.google.com/macros/s/AKfycbxGTss7Hpkul4y299TGsTxQj2F26k2DhbHOp9TdvzrLwZJ9b183b5HOUtq6Iu700Cpx/exec`        | `deploy-pages.yml`, `e2e.yml`, run #10     |
| 9   | `PUBLIC_API_BASE_URL`        | Baked at build time in `deploy-pages.yml` to the `/exec` above (public config, not a secret — docs/04-Architecture/60 §4) | workflow env                               |
| 10  | Backend deploy status        | Bundled (esbuild → `gas-dist/main.js` exposing `doGet`/`doPost`), manifest `ANYONE_ANONYMOUS`, pushed to dev project      | run #11 @ `d097be1`                        |
| 11  | Frontend deploy status       | Static Astro built + published to Pages; Chart.js in its own lazy `auto.*.js` chunk (~71 kB gzip)                         | `deploy-pages` run #4                      |
| 12  | E2E status                   | **PASS** — see §3                                                                                                         | run #10 `34634690769` (2026-09-11)         |
| 13  | Test count                   | **227** (web 50 · backend 163 · lint-rules 9 · cross-app 5)                                                               | `pnpm -r test` today, all green            |

---

## 2. Deployment architecture

```
Browser (any)
  │  https://ihkarise.github.io/Wise-Bloom-Care/   (static Astro + React islands, GitHub Pages)
  │      • base path /Wise-Bloom-Care/ (astro `base`; internal links via withBase)
  │      • single API transport in apps/web/src/api/client.ts
  ▼  cross-origin, preflight-free (CORS-safelisted headers only; route/token/ids as query params)
Google Apps Script Web App  …/exec   (executeAs USER_DEPLOYING, access ANYONE_ANONYMOUS)
  │      • doGet/doPost from the esbuild bundle (gas-dist/main.js)
  │      • bearer-token auth + family-scope RBAC gate every request server-side
  ▼
Private Google Sheet (v1 storage, behind the swappable StorageAdapter) + private Drive refs
```

The two frozen independence boundaries are intact: the client depends only on
`@wise-bloom/api-contract`; only the `SheetsStorageAdapter` touches Sheets.

---

## 3. Real end-to-end result (live, today)

- **Harness:** `e2e/sprint02.spec.ts` — 19 `test.step` checks, real Chromium on a
  GitHub Actions runner (which can reach `github.io` and `script.google.com`),
  against the **deployed** system. No localhost, no mocks, synthetic data only.
  Unchanged and not weakened.
- **Run:** `E2E (staging smoke)` #10 — id `34634690769`, ref `main` @ `6d8ed0e`,
  started 2026-09-11 18:41 UTC. **Job conclusion: success.**
- **Coverage proven live:** site loads → login/register routes → **registration
  (real Sheet write)** → login in a second browser context → authenticated app
  shell → family/maternal record resolves → timeline empty state → dashboard
  (server-aggregated) → **log a weight vital** → trend surfaces (62.5 kg) →
  vital appears on timeline → **upload synthetic lab report** → report appears
  on timeline → unauthenticated `/v1/timeline` refused (`unauthenticated`) →
  media ref requires auth → logout clears session → log back in → session
  persists across reload → direct `/app` without a session redirects to login.
- **Reliability note (honest):** run #10 recorded **1 flaky** — attempt 1 failed
  at step 4 (registration) with a _client-side_ `validation_failed` ("Please
  check the highlighted fields"), then **passed in full on the configured
  retry**. Root cause is a submit-before-hydrate timing race in the automated
  test (Playwright fills the `client:load` form faster than it hydrates), not a
  backend error and not something a human typing over several seconds hits. The
  prior green run #9 (2026-09-06) passed on the **first** attempt with no retry.
  Playwright is configured with `retries: 1` specifically for slow GAS
  cold-starts. Tracked as a Sprint 03 test-hardening item (add an explicit
  hydration wait); no product defect.

---

## 4. Deployment-hardening PRs #18–#21 (all merged, none redundant)

| PR  | What it fixed                                                                                                  | State                      |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------------- |
| #18 | GAS-safe transport, base-path, Pages + E2E workflows, web-app config                                           | Merged → `main` 2026-09-05 |
| #19 | clasp 3.4.1 pin, redeploy `/exec` to pushed code, manifest into `src/`, `ANYONE_ANONYMOUS`                     | Merged → `main` 2026-09-05 |
| #20 | esbuild bundle of the GAS backend so `doGet`/`doPost` actually deploy; client route sent as `path` query param | Merged → `main` 2026-09-06 |
| #21 | eager-hydrate (`client:load`) the vitals + reports islands so the `/app` core flow works                       | Merged → `main` 2026-09-06 |

No hardening work was duplicated in this pass. The merged fixes were **verified**
by the fresh live E2E rather than rewritten.

---

## 5. Visual QA (deployed frontend)

Real screenshots were captured against a local build served under the true
`/Wise-Bloom-Care/` base path (desktop 1280px and mobile 390px).

**A — Deployment blockers (fixed this pass):**

- **Landing page had no way in.** `/` rendered the Sprint 00 empty shell
  (headline + dev "foundation shell" copy + a "Build baseline / Environment"
  diagnostic card) with **no link to Register or Login** — a dead end for anyone
  opening the front door. Fixed on `claude/elegant-babbage-kuqfbq` (commit
  `920d56d`): primary **"Create your account" → /register** and secondary
  **"Log in" → /login** CTAs (base-path-correct via `withBase`), product copy in
  place of the dev-shell sentence, and a de-emphasized "Preview environment:
  dev" note. The `One continuous record.` heading (relied on by E2E step 1) is
  unchanged; the smoke test now also asserts both entry links. **Pending deploy
  to `main`.**

**B — Sprint 03 UX improvements (not done here):**

- Hero vertical whitespace (content sits low under a tall empty band).
- A richer, real landing beyond a single hero.
- E2E registration flake → add an explicit hydration wait (test robustness).

**C — Future design improvements (not done here):**

- Full application chrome/navigation for the authenticated `/app` surfaces,
  richer dashboard visuals, illustrations, marketing landing, brand polish.

Login, register, and the `/app` unauthenticated redirect were all clean,
functional, cross-linked, and responsive — no blockers there.

---

## 6. Security status

- **Anonymous GAS endpoint is intentional and gated in-app.** Google-level access
  is `ANYONE_ANONYMOUS` so the static browser app can call `/exec`; every request
  is still gated by bearer-token auth + family-scope RBAC server-side
  (docs/04-Architecture/53 §7). The live E2E proves an unauthenticated
  `/v1/timeline` is refused (`unauthenticated`) and a media ref cannot be minted
  without auth.
- **No secrets in the repo.** `PUBLIC_API_BASE_URL` is public config; the media
  signing key is derived at runtime from a Script Property; deploy creds live in
  GitHub secrets only.
- **Media privacy** (short-lived, HMAC-signed, backend-mediated refs; no public
  link) and **audit logging** (metadata-only, no PHI) are unchanged from Sprint 02.
- This pass changed one presentational island only; no auth, RBAC, storage, or
  API-contract code was touched.

---

## 7. Remaining deployment work

1. **Deploy the landing entry-point fix.** Merge `claude/elegant-babbage-kuqfbq`
   into `main` → `deploy-pages` republishes Pages → the live front door gains the
   Register/Login CTAs. (The journey already works today by going straight to
   `…/Wise-Bloom-Care/register`.)
2. **Optional test hardening.** Add a hydration wait to the registration/login
   E2E helpers to remove the intermittent retry.

Nothing else blocks manual use of the live DEV site.

---

## 8. Sprint 03 readiness

Foundation (Sprint 00), identity/timeline (Sprint 01), and dashboard/vitals/
reports (Sprint 02) are complete, merged, tagged (`v1.4.0-sprint-02`), and — as
of today — **verified working on the live DEV deployment end-to-end**. The
architecture remains frozen and unchanged. Sprint 03 has **not** been started and
should begin only after manual sign-off on the live journey.

---

## 9. Definition of Done for this phase

> "I can open the Wise Bloom Care website myself and successfully complete the
> basic synthetic user journey against the real DEV backend."

- **Live URL loads and serves the app:** ✅ (E2E steps 1–3, today).
- **Full synthetic journey against the real DEV backend:** ✅ (E2E run #10, 19/19
  checks on the successful attempt, today).
- **Front-door navigation:** ✅ in code on the working branch; **awaiting deploy**
  to `main` to reach the live site. Until then the journey is reachable via
  `/register` and `/login` directly.

---

## 10. Guardrails honored

- Sprint 03: NOT started. Delivery / baby / AI: NOT implemented.
- Frozen architecture docs: NOT modified. Medical logic: unchanged.
- Tests: none weakened, skipped, or deleted; smoke test coverage added. 227 pass.
- Real E2E: kept real; never replaced with mocks; run live today.
- `no-cors`: not used. Secrets: none exposed. No fabricated URLs or results.
