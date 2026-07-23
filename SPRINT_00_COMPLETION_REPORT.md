# Sprint 00 — Completion Report

| Field                 | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| Sprint                | 00 — Repository Foundation (no product features)             |
| Spec                  | `docs/20-Implementation/205-SPRINT_00.md`                    |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN)                               |
| Layers built          | L0 (repo/env foundation), L1 (independence boundaries)       |
| Status                | **Complete — all acceptance criteria met; validation green** |
| Date                  | 2026-07-22                                                   |

---

## 1. Completed Scope

Sprint 00 delivers a **deployable, fully-wired empty shell** — no product features — with the two independence boundaries made structural, per `205` §1–§2.

- **Monorepo** on pnpm workspaces (`apps/*`, `packages/*`, `tools/*`), Node pinned via `.nvmrc` + `engines`, shared `tsconfig.base.json` (strict), and a shared config package (`201` §2).
- **Tooling**: ESLint (flat config) + Prettier + Husky + commitlint + lint-staged, all wired; commit convention per `144`; PR template from `145`.
- **Two custom boundary lint rules** with RuleTester meta-tests, wired into CI: no `SpreadsheetApp` outside the Sheets adapter (`53` BR-1) and no network outside `apps/web/src/api` (`51` BR-1).
- **`packages/domain-types`** — storage-neutral TS mirror of the data model (`70`, `72`).
- **`packages/api-contract`** — logical API contract mirroring `56` (resource catalogue, representative endpoints, error envelope, typed payloads).
- **`StorageAdapter` interface** (`52` §5) + skeleton **`SheetsStorageAdapter`** that maps domain entities → tabs (`54`) and round-trips an `Event` (behind a testable `SheetGateway` port; the `SpreadsheetApp` implementation is the only code touching Sheets).
- **Adapter-enforced integrity** (`54` §5, `71` §7): PK uniqueness, FK existence, immutable `mother_id`, append-only `events`/`audit_log`.
- **Backend cross-cutting**: controller pipeline (auth-guard/rate-limit/validation stubs → dispatch), `AuditService` (append-only, metadata-only), PHI-safe structured logging (`63`), id/validation libs (incl. formula-injection guard, `73` §8).
- **Frontend shell**: Astro + React island + Tailwind booting with **semantic design tokens only** (`35`, `37`, `38`); typed `api/client.ts` against the contract (the single network boundary).
- **Env/secrets & seeding**: `.clasp.json.example` template (real config git-ignored), Script-Properties config access, synthetic-data seeder (`130` BR-2).
- **CI/CD**: `ci.yml` (lint → type-check → test → build + secret scanning) and `deploy-dev.yml` (frontend artifact + `clasp push` to the isolated dev environment, secret-gated).
- **Docs**: root `README.md` updated with build/run/deploy + monorepo map.

## 2. Files Added

**Root & tooling:** `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.nvmrc`, `.gitignore`, `.prettierignore`, `.lintstagedrc.json`, `eslint.config.ts`, `prettier.config.mjs`, `commitlint.config.js`, `.husky/{pre-commit,commit-msg}`, `.github/pull_request_template.md`, `.github/workflows/{ci.yml,deploy-dev.yml}`.

**`packages/config`:** `package.json`, `eslint/index.ts`, `prettier/index.json`, `tsconfig/{base,library,app}.json`.

**`packages/domain-types`:** `package.json`, `tsconfig.json`, `tsconfig.build.json`, `src/index.ts`.

**`packages/api-contract`:** `package.json`, `tsconfig.json`, `tsconfig.build.json`, `src/index.ts`.

**`tools/lint-rules`:** `package.json`, `tsconfig.json`, `index.ts`, `no-sheets-outside-adapter.ts` (+ `.test.ts`), `no-network-outside-api.ts` (+ `.test.ts`).

**`apps/backend`:** `package.json`, `tsconfig.json`, `appsscript.json`, `.clasp.json.example`, `src/main.ts`, `src/controllers/router.ts`, `src/adapters/StorageAdapter.ts`, `src/adapters/sheets/SheetsStorageAdapter.ts`, `src/adapters/sheets/tables/index.ts`, `src/adapters/sheets/integrity/index.ts`, `src/services/AuditService.ts`, `src/lib/{ids,logging,validation}.ts`, `tests/{adapter.roundtrip,lib}.test.ts`.

**`apps/web`:** `package.json`, `astro.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro`, `src/islands/AppShell.tsx`, `src/styles/tokens.css`, `src/api/client.ts`, `src/domain/index.ts`, `src/lib/.gitkeep`, `public/.gitkeep`, `tests/smoke.test.ts`.

**`scripts/`:** `bootstrap.sh`, `seed-synthetic.ts`.

**`tests/`:** `contract/.gitkeep`, `integrity/.gitkeep`, `e2e/.gitkeep`.

## 3. Files Modified

- `README.md` (root) — build/run/deploy instructions + monorepo map (Sprint 00 §5).
- **No changes** under `docs/00`–`docs/13` or `docs/ADR/*` — architecture is frozen (`205` §5, `200` §2). Prettier is configured to never touch `docs/` or `knowledge-base/`.

## 4. Architecture References Honoured

`50` (boundaries), `51` (frontend/`api/` boundary), `52` (adapter interface §5, services depend on interface), `53` (Apps Script/clasp, adapter-only Sheets access), `54` (Sheets schema → tables), `56` (API contract), `59`/`201` (folder/monorepo structure), `60` (deploy/env isolation), `63` (PHI-safe logging), `70`/`72` (domain types), `71` (ER/continuity), `73` (validation + injection guard), `75` (audit, append-only, metadata-only), `35`/`37`/`38` (semantic design tokens), `140`/`144`/`145` (standards/commits/PR), `202` gates G-0/G-1, `214` (testing checklist), ADR-001/002/003.

## 5. Acceptance Criteria Checklist (`205` §8)

- [x] `pnpm install && pnpm -r build` succeeds; `pnpm -r lint && pnpm -r typecheck && pnpm -r test` pass.
- [x] Custom lint rules **fail the build** on a planted `SpreadsheetApp` use outside the adapter and a planted `fetch` outside `api/` — verified via RuleTester meta-tests **and** a real ESLint run on planted files (both reported `error`).
- [x] `packages/domain-types` matches `70`/`72`; `packages/api-contract` mirrors the `56` resource catalogue.
- [x] Adapter round-trip test creates + reads one `Event` (via the interface) and produces an audit record with **no PHI in logs** (asserted).
- [x] `deploy-dev` pipeline builds a frontend artifact + performs a secret-gated `clasp push` to the isolated **dev** environment; **no secrets in the repo** (templates only; `.gitignore` + gitleaks).
- [x] Root README documents build/run/deploy.

Gate **G-0** (green CI on empty-but-wired build) and **G-1** (StorageAdapter interface + passing round-trip) are satisfied (`202` §7).

## 6. Tests Executed

| Suite                                                          | Location                                       | Result                             |
| -------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| Boundary rule meta-tests (RuleTester)                          | `tools/lint-rules/*.test.ts`                   | 9 passed                           |
| Adapter round-trip + FK + append-only + audit/PHI-safe logging | `apps/backend/tests/adapter.roundtrip.test.ts` | 5 passed                           |
| Lib units (ids, dates, sanitisation, plausibility, logging)    | `apps/backend/tests/lib.test.ts`               | 12 passed                          |
| Web smoke (shell renders) + typed API client                   | `apps/web/tests/smoke.test.ts`                 | 2 passed                           |
| **Total**                                                      |                                                | **28 passed, 0 failed, 0 skipped** |

Validation run (final): `pnpm -r lint` ✅ · `pnpm -r typecheck` ✅ · `pnpm -r test` ✅ · `pnpm -r build` ✅ · `pnpm format:check` ✅.

## 7. Coverage Summary

Coverage is by **acceptance criterion and boundary**, appropriate to a foundation sprint (no product FRs are in scope, so no "Must FR" traceability applies yet — `214` §6):

- Boundary #1 (API contract): compiles; consumed by the web client. ✅
- Boundary #2 (Storage Adapter): interface + skeleton adapter with passing round-trip + integrity (FK, append-only) tests. ✅
- Both CI boundary lint rules: proven to trip on planted violations. ✅
- PHI-safe logging: allowlist stripping asserted (no redacted value emitted). ✅

## 8. Known Issues / Limitations

1. **Live GAS deploy not executed here.** `deploy-dev.yml` is authored and secret-gated; a real `clasp push` requires the dev `CLASPRC_JSON` + `DEV_SCRIPT_ID` secrets and a dev Apps Script project, which are not available in this environment. The pipeline validates and dry-runs (builds + uploads the frontend artifact; skips GAS push when secrets are absent). The adapter round-trip runs against an in-memory `SheetGateway` (the same interface the `SpreadsheetApp` gateway implements) since live Google Sheets is unavailable in CI.
2. **Astro `typecheck` uses `astro check`**; it emits a generated `src/env.d.ts` (git-ignored, lint-ignored).
3. **`jiti` pinned to v2** in `apps/web`/`apps/backend` devDeps so ESLint's TS flat-config loader is satisfied when run from an app directory (Astro transitively pulls an older jiti).

## 9. Technical Debt

- None introduced beyond the intentional Sprint 00 skeletons (controller pipeline stubs, single fully-mapped round-trip entity). The `TABLES` registry already maps all 19 entities, so later sprints extend behaviour, not structure. No TODO placeholders, dead code, or unused files were committed.

## 10. Go / No-Go Recommendation

**GO.** All Sprint 00 acceptance criteria are met, both independence boundaries are structural and CI-enforced, and the build baseline is objectively green (`205` §12 DoD). The foundation is ready for Sprint 01 (L2/L3). No architecture changes were made or required; no ADR proposals arose.

_Do not begin Sprint 01._
