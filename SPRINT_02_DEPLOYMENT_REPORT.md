# Sprint 02 — First Live Deployment Report

**Date:** 2026-09-05
**Scope:** Sprint 02 deployment + hardening only. Sprint 03 NOT started. Frozen
architecture docs NOT modified. No tests weakened. No mocks substituted for the
real end-to-end. No `no-cors`. Synthetic data only.

**Overall verdict: NO-GO (blocked on one owner-side Apps Script setting).**

The frontend is live and correct, the backend code is deployed, and every
in-scope code defect found has been fixed and verified. The one remaining
blocker is **not a code problem**: the deployed Google Apps Script Web App is
refusing anonymous browser access at Google's own auth layer (HTTP 403), which
can only be changed by the project owner in the Apps Script UI. Steps to fix are
in the checklist below.

---

## 1. What is verified working

| Area                              | Status | Evidence                                                                                                                                                              |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sprint 02 merged to `main`        | ✅     | PR #17 merged; tag `v1.4.0-sprint-02` → `c504e4b`                                                                                                                     |
| Frontend build (static Astro)     | ✅     | `pnpm -r build` → `apps/web/dist` "Complete!"; Chart.js bundle `auto.*.js` present (ADR‑003)                                                                          |
| Frontend deployed to GitHub Pages | ✅     | `https://ihkarise.github.io/Wise-Bloom-Care/` — E2E steps 1–3 (home, `/login`, `/register`) load against the live site                                                |
| Base path `/Wise-Bloom-Care/`     | ✅     | Static routes resolve under the project sub-path in E2E                                                                                                               |
| Backend pushed to dev Apps Script | ✅     | `Deploy (dev)` run #10 (`33943841938`) — step "Push backend to dev Apps Script" succeeded; `src/appsscript.json` deployed                                             |
| Dev Web App deployment minted     | ✅     | Same run: `Deployed AKfycbxGTss7…@2`; `EXEC_URL=https://script.google.com/macros/s/AKfycbxGTss7…/exec` (the exact URL the frontend + E2E use — no stale-URL mismatch) |
| Local CI gate                     | ✅     | `lint` clean, `typecheck` clean, **227 tests pass** (web 50, backend 163, lint-rules 9, integration 5), build green                                                   |

---

## 2. Defect found and fixed (in-scope, code)

### Client transport bug — API route was sent in the URL path, not where GAS reads it

**Symptom:** The real Playwright E2E (GitHub Pages → Apps Script → Sheet) failed
at **step 4 (registration)** with the calm fallback message
_"Something went wrong on our end. Please try again in a moment."_

**Root cause:** The API client built the route into the URL **pathname**
(`${baseUrl}/v1${path}` → `…/exec/v1/auth/register`). Google Apps Script exposes
only query/form params and the POST body to `doGet`/`doPost`; the sub-path after
`/exec` is `pathInfo`, which the backend never reads (`apps/backend/src/main.ts`
reads `event.parameter['path']`). Every real browser call therefore resolved to
`POST /` on the backend and never reached the router.

A direct runner probe confirmed this precisely: calling the old pathname URL
returns **HTTP 401** with a Google HTML error page ("unable to open the file at
this time"), which — having no `Access-Control-Allow-Origin` header — the browser
cannot read, so `fetch` rejects and the UI shows the generic fallback.

**Fix (`apps/web/src/api/client.ts`, commit `e32b619`):** send the versioned
route as the `path` query param (`/v1{path}`) — the value GAS actually reads and
the router keys on. Transport is otherwise unchanged and still preflight-free:
only CORS-safelisted headers, all plumbing (`path`, `token`, `idempotencyKey`,
`correlationId`) as query params, JSON body sent as `text/plain`. **No
`no-cors`.**

**Tests updated (not weakened):** the eight API-module transport tests now assert
the route travels as the decoded `path` query param rather than a pathname
substring. All 50 web tests pass.

> This fix is committed and pushed on `claude/wise-bloom-deploy-sprint-02`. It is
> **necessary but not sufficient**: even with the correct transport, the deployed
> backend currently refuses anonymous access (see §3).

---

## 3. Remaining blocker (owner-side — NOT code)

### The deployed Web App refuses anonymous access (HTTP 403)

A direct probe from a GitHub runner (which can reach `script.google.com`) called
the **correct** GAS transport against the live `/exec`:

| Probe | Request                                                     | Result                                                                                                     |
| ----- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A     | `GET  …/exec?path=/v1/timeline`                             | **HTTP 403** — Google access-denied HTML, no `Access-Control-Allow-Origin`, request never reached our code |
| B     | `POST …/exec?path=/v1/auth/register` (text/plain JSON body) | **HTTP 403** — same Google HTML page                                                                       |
| C     | `POST …/exec/v1/auth/register` (old pathname mechanism)     | **HTTP 401** — Google "unable to open the file" HTML page                                                  |

A healthy anonymous deployment would instead return our JSON envelope (e.g.
`{"error":{"code":"unauthenticated",…}}` for probe A). Getting a Google 403/401
HTML page means the request is rejected **before** `doGet`/`doPost` runs — i.e.
the Web App is not actually served anonymously.

This is **not** a stale URL (the `/exec` is the freshly-minted v2 deployment from
run #10) and **not** a manifest error — `apps/backend/src/appsscript.json`
correctly declares:

```json
"webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
```

Google is simply not honoring anonymous access for this deployment. That is
controlled by the project owner in the Apps Script UI (and possibly by a Google
account/Workspace policy), so it cannot be fixed from code or CI.

---

## 4. Owner checklist to unblock (no coding required)

Do these in the **dev** Apps Script project (the one whose Script ID is stored in
the `DEV_SCRIPT_ID` secret):

1. **Open the project** at <https://script.google.com> → your Wise Bloom dev
   project.
2. **Deploy → Manage deployments.** Select the active deployment named
   `sprint-02 dev …` (deployment id begins `AKfycbxGTss7…`).
3. Click the **pencil (Edit)**. Set:
   - **Execute as:** _Me (your email)_
   - **Who has access:** _Anyone_ &nbsp;(the most open option — **not** "Anyone
     with Google account", **not** "Only myself")
   - Click **Deploy**.
4. When Google prompts, **Authorize access** and **Allow** the requested
   permissions (Google Sheets + external requests). This one-time consent is
   required because the app executes as you.
5. **Confirm Script Properties** (Project Settings ⚙ → _Script properties_):
   - `SPREADSHEET_ID` = the Google Sheet's id
   - `EMAIL_PEPPER` = a long random string
   - _(optional)_ `ENVIRONMENT` = `dev`
     The backend reads these at runtime; the current 403 hides whether they're set,
     so please verify them while you're in there.
6. **Verify anonymously:** open the `/exec` URL in a **private/incognito** window
   (logged out). Success looks like **JSON text**, e.g.
   `{"error":{"code":"not_found","message":"Unknown route"}}` for the bare URL —
   **not** a Google sign-in or "unable to open the file" page.
7. **Tell Claude it's done.** I will then: re-run `Deploy (dev)`, merge the
   transport fix to `main` (redeploys Pages with the corrected client), and re-run
   the real Playwright E2E (GitHub Pages → Apps Script → Sheet).

> **If your account is Google Workspace (not consumer Gmail):** an admin policy
> may block anonymous web apps entirely. If step 3 won't let you pick "Anyone",
> that's the cause, and we'd need a decision on an alternative (e.g. a thin public
> proxy in front of the Web App). Consumer Gmail accounts allow "Anyone".

---

## 5. Real E2E status

- **Harness:** `e2e/sprint02.spec.ts` — 19 `test.step` checks, real browser,
  GitHub-runner only, against the deployed system. No mocks, no localhost,
  synthetic data only. **Unchanged and not weakened.**
- **Result:** run `33958088514` — steps 1–3 (static routes) **PASS**; step 4
  (registration, first real backend call) **FAIL** — blocked by the §3 backend
  403, not by the frontend.
- Once §4 is done, the same E2E is expected to advance through registration →
  login → vitals → reports → dashboard → privacy boundaries → logout.

---

## 6. Guardrails honored

- **Sprint 03:** NOT started. No Sprint 03 files, branches, or scaffolding.
- **Frozen architecture docs:** NOT modified.
- **Tests:** none weakened, skipped, or deleted; transport tests strengthened to
  assert the real GAS contract. 227 tests pass.
- **Real E2E:** kept real; never replaced with mocks.
- **`no-cors`:** not used anywhere.
- **Secrets:** never printed. The diagnostic probe used only the public `/exec`
  URL and synthetic data, and has been removed from the workflow.
- **No fabricated URLs / results / Sheet data:** every fact above is tied to a
  named workflow run, commit, or local command output.

---

## 7. Final status

| Item                                   | Result                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Backend (code push + deployment)       | Deployed, but **not anonymously reachable** — 403 (owner-side)                              |
| Frontend                               | **PASS** — live at `https://ihkarise.github.io/Wise-Bloom-Care/`                            |
| Real E2E (Pages → Apps Script → Sheet) | **FAIL at step 4** — blocked by backend 403                                                 |
| 19-step smoke                          | **3 / 19** (static routes) — remainder blocked by backend 403                               |
| Local CI gate                          | **PASS** — lint, typecheck, 227 tests, build                                                |
| Secrets                                | Safe — no values exposed                                                                    |
| Architecture frozen                    | **YES**                                                                                     |
| Sprint 03 started                      | **NO**                                                                                      |
| **Overall**                            | **NO-GO** — pending the §4 owner checklist (one Apps Script access setting + authorization) |
