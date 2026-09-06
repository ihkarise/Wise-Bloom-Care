# Sprint 02 — First Live Deployment Report

**Date:** 2026-09-06
**Scope:** Sprint 02 deployment + hardening only. Sprint 03 NOT started. Frozen
architecture docs NOT modified. No tests weakened. No mocks substituted for the
real end-to-end. No `no-cors`. Synthetic data only. No secrets exposed.

**Overall verdict: GO.** The full stack is live and the real end-to-end test
passes against the deployed system (GitHub Pages → Apps Script → Google Sheet).

---

## 1. Final status

| Item                                   | Result         | Evidence                                                                                                                                     |
| -------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend (Apps Script Web App)          | ✅ **PASS**    | Anonymous `/exec` returns real JSON; registration writes the Sheet and returns a session                                                     |
| Frontend (GitHub Pages)                | ✅ **PASS**    | Live at `https://ihkarise.github.io/Wise-Bloom-Care/` (Pages deploy from `main` `6d8ed0e`)                                                   |
| Real E2E (Pages → Apps Script → Sheet) | ✅ **PASS**    | E2E run `34027271464` on `main` `6d8ed0e` — **green** (1 flaky retry, see §4)                                                                |
| 19-step smoke                          | ✅ **19 / 19** | Same run: registration, login, family/maternal, timeline, vitals, reports, dashboard, auth/media privacy, logout, session persistence, guard |
| CI on `main`                           | ✅ **PASS**    | CI run `34027241911` (`6d8ed0e`) green — lint, format, type-check, **227 tests**, build, secret scan                                         |
| Secrets                                | ✅ Safe        | Script Properties set manually in Apps Script; never in repo/CI; probe redacts tokens; no values printed                                     |
| Architecture frozen                    | ✅ **YES**     | No `docs/04-Architecture` or other frozen docs changed                                                                                       |
| Sprint 03 started                      | ✅ **NO**      | No Sprint 03 files, branches, or scaffolding                                                                                                 |
| **Overall**                            | 🟢 **GO**      |                                                                                                                                              |

`main` head: `6d8ed0e`. Tag `v1.4.0-sprint-02` → `c504e4b`. Dev Web App `/exec`
deployment id begins `AKfycbxGTss7…` (version 4, `ANYONE_ANONYMOUS`).

---

## 2. Defects found and fixed (all in-scope)

Five distinct blockers stood between "Sprint 02 code merged" and "working live
deployment". Each was root-caused from real evidence and fixed.

1. **Client sent the API route in the URL path, not where GAS reads it.**
   `ApiClient` built the route into the pathname (`…/exec/v1/...`); GAS only
   reads `event.parameter['path']`, so every call resolved to `POST /`. Fixed:
   route now travels as the `path` query param (`apps/web/src/api/client.ts`).
   Still preflight-free; no `no-cors`. Transport tests updated to assert the
   decoded `path` param.

2. **The backend never deployed any code — only the manifest.** `clasp push`
   with `rootDir: src` sent just `appsscript.json` (clasp v3 doesn't
   transpile/bundle TypeScript; `build` was `tsc --noEmit`). So the Apps Script
   project had no `doGet` → "Script function not found: doGet". Fixed: added an
   esbuild GAS bundle (`apps/backend/scripts/build-gas.mjs`) that compiles the
   whole ES-module graph into one `gas-dist/main.js` with global `doGet`/`doPost`;
   `deploy-dev` now builds it and pushes `gas-dist`. Verified: `clasp push` now
   reports `Pushed 2 files` (`main.js` + `appsscript.json`) and refreshes `/exec`
   to a new version.

3. **The Web App refused anonymous access (HTTP 403).** Owner-side: enabled
   "Who has access = **Anyone**" and authorized the deploying account's scopes in
   the Apps Script UI. Confirmed by an anonymous runner probe: protected `GET`
   returns `{"error":{"code":"unauthenticated"}}`.

4. **Runtime config missing (`SPREADSHEET_ID` / `EMAIL_PEPPER`).** Owner-side:
   created a new empty Google Sheet and set the two required Script Properties
   (plus `ENVIRONMENT=dev`). The backend auto-creates its 19 tabs + headers on
   first write. Confirmed: anonymous registration returns a session (real Sheet
   round-trip).

5. **The app's primary form was hidden below the fold.** `VitalLogIsland` and
   `ReportUploadIsland` were mounted `client:visible`, so "log a vital in
   seconds" only rendered after scrolling. Fixed: both mounted `client:load`
   (`apps/web/src/pages/app.astro`) — better UX and deterministic for the E2E.

---

## 3. What the real E2E verified

`e2e/sprint02.spec.ts` — a real Chromium browser on a GitHub runner, against the
deployed system, synthetic data only, no mocks. All 19 checks pass: site loads;
`/login` and `/register` routes; **registration (real Sheet write)**; login in a
second browser context; authenticated shell; family/maternal record resolves;
empty timeline; server-aggregated dashboard; **log a weight vital**; trend
surfaced; vital on the timeline after reload; **upload a report**; report on the
timeline; protected endpoint rejects unauthenticated access; media privacy
boundary; logout clears the session; session persists across reload; and direct
`/app` navigation without a session redirects to `/login`.

A separate anonymous backend probe (removed after use) independently confirmed
the backend: protected `GET` → `unauthenticated` envelope; anonymous
registration → session. Token values were redacted; no secrets printed.

---

## 4. Known follow-ups (not blocking GO)

- **One flaky retry.** E2E attempt 1 failed at step 5 (login in a _cold_ second
  browser context) and attempt 2 passed all 19. `retries: 1` is a deliberate
  config choice ("Apps Script is slow and can cold-start"). Root cause: the
  login button was clicked before the React island hydrated on the cold context,
  so the browser did a **native GET form submit** (fields, incl. password, went
  into the URL) and stayed on `/login`; the warm retry used the JS handler and
  passed. Recommended hardening (own change): prevent the auth forms from
  native-submitting before hydration (e.g. render the submit control inert until
  the island hydrates), which also closes the password-in-URL edge case. Real
  users are unlikely to submit within the sub-second hydration window, but it is
  worth closing.
- **GAS latency.** Real Sheet writes are slow (seconds each); the E2E uses
  generous timeouts accordingly.

---

## 5. Guardrails honored

- Sprint 03 not started.
- Frozen architecture/product docs untouched.
- No tests weakened, skipped, or deleted; transport tests strengthened; the E2E
  still exercises the full real flow.
- Real E2E kept real — never replaced with mocks.
- No `no-cors`.
- Secrets: `SPREADSHEET_ID` / `EMAIL_PEPPER` live only in Apps Script Script
  Properties (per `docs/09-Security/124`); never committed, never printed;
  diagnostics redact tokens.
- Every fact above is tied to a named workflow run, commit, or command output.
