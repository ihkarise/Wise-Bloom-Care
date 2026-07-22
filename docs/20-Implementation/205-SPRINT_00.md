# 205 — Sprint 00: Repository Foundation

| Field | Value |
|---|---|
| Sprint | 00 — Foundation (no product features) |
| Status | Planned |
| Milestone | Milestone 0 (`204` §3) |
| Layers | L0, L1 (`202` §3) |
| Ships toward | Build baseline (deployable empty shell) |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 2 weeks · 2 engineers (1 FE, 1 BE) + shared DevOps |

---

## 1. Purpose

Establish the repository, tooling, CI/CD, and the two **independence boundaries** (API contract + Storage Adapter) before any module is built. This sprint ships **no product features** — its output is a deployable, fully-wired empty shell that every later sprint builds on. It exists to make boundary erosion structurally impossible (`200` §3.2, `50` R-1).

## 2. Objectives

1. Monorepo scaffolding per `201` (pnpm workspaces, TS base, lint/format, Node pin).
2. CI pipeline: lint → type-check → test → build, plus the boundary-enforcing lint rules.
3. `packages/domain-types` and `packages/api-contract` compiling from the frozen data model + API spec.
4. `StorageAdapter` interface + `SheetsStorageAdapter` skeleton that round-trips one entity against a dev spreadsheet.
5. Frontend `api/` typed-client skeleton + Astro/React/Tailwind app boots with design tokens.
6. Logging + AuditService scaffolding; env/secrets wiring (Script Properties, build env); synthetic-data seeding.
7. Deployment pipeline dry-run to the **dev** environment (frontend build + GAS clasp push).

## 3. Architecture References

`docs/04-Architecture/50` (boundaries), `51` (frontend stack/structure), `52` (adapter interface §5), `53` (Apps Script/clasp), `54` (Sheets schema), `56` (API contract), `59` (folder structure), `60` (deployment/CI), `63` (logging), `64` (monitoring); `docs/05-Data/70`,`72` (types), `73` (validation), `75` (audit); `docs/11-Development/140`,`142`,`143`,`144` (standards/workflow); `docs/ADR/ADR-001`,`002`,`003`.

## 4. Files Created

```
pnpm-workspace.yaml • package.json • tsconfig.base.json • .nvmrc • .gitignore
.github/workflows/ci.yml • .github/workflows/deploy-dev.yml • .github/pull_request_template.md (from 145)
packages/config/{eslint,prettier,tsconfig}/* • packages/config/package.json
packages/domain-types/src/index.ts (Family, MaternalRecord, PregnancyEpisode, ChildRecord, Event, Vital, ...) • package.json
packages/api-contract/src/index.ts (resources + endpoints mirroring 56) • package.json
apps/web/{astro.config.mjs,tailwind.config.ts,tsconfig.json,package.json}
apps/web/src/{pages/index.astro, styles/tokens.css, api/client.ts, domain/index.ts, lib/.gitkeep}
apps/web/public/.gitkeep • apps/web/tests/smoke.test.ts
apps/backend/{appsscript.json,.clasp.json.example,package.json,tsconfig.json}
apps/backend/src/main.ts • src/controllers/router.ts
apps/backend/src/adapters/StorageAdapter.ts (interface) • src/adapters/sheets/SheetsStorageAdapter.ts
apps/backend/src/adapters/sheets/tables/index.ts • src/adapters/sheets/integrity/index.ts
apps/backend/src/services/AuditService.ts • src/lib/logging.ts • src/lib/ids.ts • src/lib/validation.ts
apps/backend/tests/adapter.roundtrip.test.ts
scripts/seed-synthetic.ts • scripts/bootstrap.sh
tools/lint-rules/no-sheets-outside-adapter.ts • tools/lint-rules/no-network-outside-api.ts
tests/contract/.gitkeep • tests/integrity/.gitkeep • tests/e2e/.gitkeep
README.md (updated root)
```

## 5. Files Modified

- `README.md` (root) — add build/run instructions and monorepo map.
- None under `docs/00`–`docs/13` or `docs/ADR/*` — **architecture is frozen** (`200` §2).

## 6. Tasks

1. Initialise pnpm workspaces; pin Node (`.nvmrc`, `engines`); create `tsconfig.base.json` and `packages/config`.
2. Author ESLint/Prettier config + two custom lint rules: **no `SpreadsheetApp` outside `adapters/sheets`** (`53` BR-1) and **no network calls outside `apps/web/src/api`** (`51` BR-1). Wire both into CI so violations fail the build.
3. Populate `packages/domain-types` from `docs/05-Data/70`,`72` and `packages/api-contract` from `docs/04-Architecture/56` (resource catalogue + representative endpoints; storage-neutral).
4. Define the `StorageAdapter` interface (`create/get/query/update(append,version)/list`, domain-entity vocabulary — `52` §5). Implement a **skeleton** `SheetsStorageAdapter` that maps one entity (e.g., `Event`) to a Sheets tab (`54`) and round-trips it.
5. Scaffold the backend router (`doGet`/`doPost` → controllers) with an auth-guard stub, input validation stub (`73`), and rate-limit stub (`120`) — no business logic yet.
6. Stand up `AuditService` + structured logging that strips PHI (`63`, `75`); wire an audit call into the adapter round-trip.
7. Scaffold `apps/web`: Astro + React island + Tailwind with **semantic tokens only** (`35`,`37`,`38`); build the typed `api/client.ts` against `packages/api-contract` (no real endpoints yet, but typed).
8. Write `scripts/seed-synthetic.ts` (synthetic data only — `130` BR-2) and clasp env templates.
9. CI: `ci.yml` (lint→type→test→build) and `deploy-dev.yml` (frontend build artifact + `clasp push` to dev GAS). Verify a dry-run deploy to **dev** succeeds.
10. Root `README.md` update; verify `git-ignore` excludes `.clasp.json`, `.env*`, build output.

## 7. Deliverables

- Green CI on an empty-but-wired build (`202` gate G-0).
- Compiling `domain-types` + `api-contract` packages (boundary #1 exists).
- `StorageAdapter` interface + skeleton Sheets adapter with a passing round-trip test (boundary #2 exists, `202` gate G-1).
- Booting Astro/React/Tailwind shell with tokens; typed `api/` client.
- Working dev deployment pipeline; synthetic-data seeder; PHI-safe logging + audit scaffolding.

## 8. Acceptance Criteria

- [ ] `pnpm install && pnpm -r build` succeeds; `pnpm -r lint && pnpm -r typecheck && pnpm -r test` pass in CI.
- [ ] Custom lint rules **fail** the build on a planted `SpreadsheetApp` use outside the adapter and a planted `fetch` outside `api/` (proves the boundaries are enforced, not just documented).
- [ ] `packages/domain-types` types match `docs/05-Data/70`/`72`; `packages/api-contract` mirrors `docs/04-Architecture/56` resource catalogue.
- [ ] Adapter round-trip test creates+reads one `Event` against a dev spreadsheet and produces an audit record with no PHI in logs.
- [ ] `deploy-dev` pipeline pushes a frontend build + GAS deployment to the isolated **dev** environment; no secrets in repo (`60` BR-3).
- [ ] Root README documents build/run/deploy.

## 9. Testing (see `214`)

- **Unit:** adapter mapping helpers; id/date/validation libs; logging PHI-stripping.
- **Integration:** `adapter.roundtrip.test.ts` (service-less create→read via the interface).
- **CI meta-tests:** the two boundary lint rules trip on planted violations.
- **Smoke:** frontend `smoke.test.ts` renders the shell; dev deploy smoke check.

## 10. Risks

- R-1: Boundaries documented but not enforced → erosion later. Mitigation: custom lint rules in CI (Task 2) with meta-tests (§8).
- R-2: Apps Script/clasp env friction. Mitigation: `.clasp.json.example` templates + dev-only dry run; document in README (`53`, `60`).
- R-3: Secrets accidentally committed. Mitigation: `.gitignore` + secret scanning in CI (`140` R-2).

## 11. Rollback

- Foundation-only sprint with no production data. Rollback = revert the sprint's merge commit(s) on the feature branch; dev environment is disposable (synthetic data). No production deploy occurs in Sprint 00, so there is nothing user-facing to roll back. GAS dev deployment can be repointed to the prior (empty) version (`60` §7).

## 12. Definition of Done

Per `217` / `docs/11-Development/146`: standards + lint/type pass; tests green; boundaries enforced in CI; no secrets/PHI; docs (root README) in sync; PR reviewed with template checklist (`145`); every commit leaves the project deployable. No product feature is claimed — DoD here is the **build baseline**, objectively green.

## 13. Dependencies

Blocks: every later sprint (`202` §7 gate G-0/G-1). Depends on: frozen architecture set accepted (MS-0.6). Inputs: `201`, `202`, `203`.
