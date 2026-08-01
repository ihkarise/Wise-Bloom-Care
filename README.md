# Wise Bloom Care

A premium, privacy-first **Mother & Child Health platform** that preserves **one continuous health record** across the entire family journey — from conception, through pregnancy, delivery, and newborn care, into infancy, toddlerhood, and beyond.

> **Design-first.** This repository holds the complete **architecture and product documentation set** for Wise Bloom Care. Per the project's working method, the platform is fully designed before production features are implemented.
>
> - **Sprint 00 (foundation)** — the monorepo, tooling, CI, the two independence boundaries (API contract + Storage Adapter), and a deployable empty shell. See `docs/20-Implementation/205-SPRINT_00.md` and `SPRINT_00_COMPLETION_REPORT.md`.
> - **Sprint 01 (identity, family graph, pregnancy episode, timeline foundation)** — authentication and bearer sessions, the family/maternal record graph, PregnancyEpisode with derived gestational age, the append-only timeline read side, content typing, family-scope RBAC, audit wiring, and the registration/login/pregnancy-setup/timeline frontend. See `docs/20-Implementation/206-SPRINT_01.md`, `SPRINT_01_COMPLETION_REPORT.md`, `SPRINT_01_PATCH_REPORT.md`, and `SPRINT_01_FINAL_REVIEW.md`.

- **Domain:** care.wisehomeopathy.com
- **Founding thesis:** one journey, one linked record — the mother's pregnancy timeline and the child's growth timeline are two views of a single family record. At delivery, the baby profile is created automatically and permanently linked to the mother. No reset, no migration, no duplicates.
- **Safety:** the product **educates, never diagnoses**; content is typed Educational / Clinical Recommendation / Emergency Warning and never mixed; every medical statement is sourced.

## Documentation map (`docs/`)

| Section           | Contents                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00-Vision`       | Vision, manifesto, mission, principles, brand, glossary                                                                                                         |
| `01-Product`      | PRD, scope, feature matrix, modules, roadmap, milestones, release plan, non-goals, risk register                                                                |
| `02-Research`     | WHO / ACOG / FIGO / NICE, immunization, WHO growth, CDC milestones, references, medical disclaimer (cited)                                                      |
| `03-UX`           | Personas, journeys, IA, navigation, dashboard, design system, components, color, typography, iconography, accessibility, responsive                             |
| `04-Architecture` | System, frontend, backend, Apps Script, Sheets schema, data model, API spec, auth, security, folder structure, deployment, domains, backup, logging, monitoring |
| `05-Data`         | Data dictionary, ERD, field specs, validation, retention, audit logs, import/export, versioning                                                                 |
| `06-Modules`      | 18 module specifications (auth → settings), incl. the delivery-transition keystone                                                                              |
| `07-AI`           | AI architecture, knowledge base, prompt library, RAG, prediction engine, guardrails, OCR, voice                                                                 |
| `08-Timeline`     | Pregnancy, delivery transition, postpartum, baby, vaccine, development timelines                                                                                |
| `09-Security`     | Threat model, encryption, sessions, access control, secrets, incident response, privacy, terms                                                                  |
| `10-Testing`      | Test plan, cases, manual, UAT, performance, security/AI-safety, regression                                                                                      |
| `11-Development`  | Coding standards, contributing, git workflow, branch strategy, commits, PR template, DoD, changelog                                                             |
| `12-Operations`   | Runbook, backup/restore, disaster recovery, maintenance, support guide                                                                                          |
| `13-Future`       | V2, V3, long-term vision, ideas, backlog                                                                                                                        |
| `ADR/`            | ADR-001 Google Sheets · 002 Apps Script · 003 Astro · 004 Auth · 005 AI · 006 Domains                                                                           |

## Knowledge base (`knowledge-base/`)

Independent, versioned medical/educational content that feeds both direct education and AI (RAG): pregnancy weeks `week01`–`week40`, plus category folders (delivery, newborn, growth, milestones, vaccination, nutrition, exercise, emergency, medicines). Every item is typed and sourced; unverified specifics are marked `[VERIFY]` and must be confirmed against a primary source before user display.

## Initial technical stack (per design)

Astro · React · TypeScript · Tailwind CSS · Chart.js (frontend) · Google Apps Script (backend, v1) · private Google Sheets (storage, v1, behind a swappable adapter). The architecture is deliberately modular so the backend can migrate to PostgreSQL / Supabase / Firebase / Cloud SQL **without a frontend rewrite** (the API contract is the boundary).

## Folder tree

```
Wise-Bloom-Care/
├─ README.md
├─ ARCHITECTURE_REVIEW_REPORT.md       # architecture audit (frozen baseline)
├─ IMPLEMENTATION_READINESS_REPORT.md  # implementation-planning readiness
├─ FINAL_REPOSITORY_REVIEW.md          # design-phase repository review
├─ SPRINT_00_COMPLETION_REPORT.md      # Sprint 00 acceptance & Go/No-Go
├─ SPRINT_01_COMPLETION_REPORT.md      # Sprint 01 acceptance & Go/No-Go
├─ SPRINT_01_PATCH_REPORT.md           # Sprint 01 GAS auth-transport patch
├─ SPRINT_01_RELEASE_NOTES.md          # Sprint 01 release notes
├─ SPRINT_01_FINAL_CHECKLIST.md        # Sprint 01 merge/tag checklist
├─ SPRINT_01_FINAL_REVIEW.md           # Sprint 01 final review & Go/No-Go
├─ ISSUES_TO_CREATE.md                 # deferred work queued as GitHub issues
├─ pnpm-workspace.yaml · package.json · tsconfig.base.json · .nvmrc
├─ eslint.config.ts · prettier.config.mjs · commitlint.config.js
├─ apps/
│  ├─ web/                             # Astro + React + TS + Tailwind app
│  └─ backend/                         # Google Apps Script (clasp) backend
├─ packages/
│  ├─ api-contract/                    # boundary #1 — logical API contract (docs 56)
│  ├─ domain-types/                    # shared TS types (docs 70,72)
│  └─ config/                          # shared eslint/prettier/tsconfig
├─ tools/lint-rules/                   # custom boundary lint rules + meta-tests
├─ scripts/                            # bootstrap · synthetic-data seeder
├─ tests/                              # contract · integrity · e2e (cross-app)
├─ .github/workflows/                  # ci.yml · deploy-dev.yml
├─ docs/
│  ├─ 00-Vision/        01-Product/     02-Research/    03-UX/
│  ├─ 04-Architecture/  05-Data/        06-Modules/     07-AI/
│  ├─ 08-Timeline/      09-Security/    10-Testing/     11-Development/
│  ├─ 12-Operations/    13-Future/      20-Implementation/
│  └─ ADR/                              # ADR-001 … ADR-006
└─ knowledge-base/
   ├─ pregnancy/        # week01.md … week40.md + README
   ├─ delivery/  newborn/  growth/  milestones/
   └─ vaccination/  nutrition/  exercise/  emergency/  medicines/
```

The monorepo layout is specified in `docs/20-Implementation/201-MONOREPO_STRUCTURE.md` (expanding `docs/04-Architecture/59-FOLDER_STRUCTURE.md`).

## Getting started

**Prerequisites:** Node `22.22.2` (see `.nvmrc`) and pnpm ≥ 10 (`corepack enable`).

```bash
./scripts/bootstrap.sh      # install deps, scaffold clasp config, set up git hooks
# or, manually:
pnpm install
```

**Everyday commands** (run from the repo root):

| Command                             | What it does                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm -r lint` / `pnpm lint`        | ESLint incl. the two boundary rules (no `SpreadsheetApp` outside the adapter; no network outside `apps/web/src/api`)                   |
| `pnpm format:check` / `pnpm format` | Prettier compliance check / auto-format (`docs/` and `knowledge-base/` are excluded — see `.prettierignore`)                           |
| `pnpm -r typecheck`                 | Strict TypeScript across every package                                                                                                 |
| `pnpm -r test`                      | Vitest: 161 tests — crypto vectors, auth/session/timeline services, integration, cross-app integrity, boundary meta-tests, web islands |
| `pnpm -r build`                     | Build all packages and the Astro web app                                                                                               |
| `pnpm --filter @wise-bloom/web dev` | Run the frontend locally                                                                                                               |
| `pnpm seed:synthetic`               | Emit a synthetic (never real PHI) family dataset                                                                                       |

**CI** (`.github/workflows/ci.yml`) runs lint → format-check → type-check → test → build plus secret scanning on every push/PR — this is gate **G-0**.

**Deploy (dev)** (`.github/workflows/deploy-dev.yml`) builds the frontend artifact and pushes the Apps Script backend to the isolated **dev** environment via `clasp`. It runs on manual dispatch and only when the `DEV_SCRIPT_ID` and `CLASPRC_JSON` environment secrets are configured — **no secrets live in the repo** (`docs/04-Architecture/60` BR-3). Copy `apps/backend/.clasp.json.example` → `.clasp.json` (git-ignored) for local dev.

### The two independence boundaries

1. **API contract** (`packages/api-contract`, mirrors `docs/04-Architecture/56`) — the client depends only on this, never on storage.
2. **Storage Adapter** (`apps/backend/src/adapters/StorageAdapter.ts`, per `docs/04-Architecture/52` §5) — services depend on this interface; the v1 `SheetsStorageAdapter` is the only code that touches Google Sheets. A future Postgres/Supabase adapter is a new folder, not a rewrite.

## Architecture map (one line)

`Client (Astro/React/TS/Tailwind/Chart.js)` → **API contract** (`docs/04-Architecture/56`) → `Application layer (Apps Script services)` → **Storage Adapter** (`docs/04-Architecture/52`) → `Google Sheets (v1) + private Drive`. The two bold boundaries make the storage engine swappable without a frontend rewrite. See `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md`.

## Reading order (onboarding)

1. `docs/00-Vision/00-VISION.md` — the one-record thesis and invariants.
2. `docs/01-Product/10-PRD.md` — requirements and KPIs.
3. `docs/04-Architecture/50-SYSTEM_ARCHITECTURE.md` — layers and boundaries.
4. `docs/05-Data/71-ENTITY_RELATIONSHIP.md` — the data model (ER diagram).
5. `docs/06-Modules/88-DELIVERY_MODULE.md` + `docs/08-Timeline/111-DELIVERY_TRANSITION.md` — the continuity keystone.
6. `docs/02-Research/28-MEDICAL_DISCLAIMER.md` + `docs/07-AI/105-GUARDRAILS.md` — the safety model.

## Development order (implementation sequence)

Follow the phased plan in `docs/01-Product/14-ROADMAP.md`, `15-MILESTONES.md`, and `13-Future/164-BACKLOG.md`:

1. **Foundation** — auth, single family record, append-only timeline, dashboard (`80`,`81`).
2. **Pregnancy core** — vitals, medicines, appointments, reports, week knowledge (`82`–`87`).
3. **Delivery transition (keystone)** — auto-create the linked child; no duplicates (`88`, MS-1.7).
4. **Baby core** — WHO growth, CDC milestones, vaccination (`89`–`92`).
5. **Cross-cutting** — notifications, settings, export, hardening (a11y, security, backups).
6. **v2+** — AI (behind guardrails), prediction, sharing; then v3 migration/portal/offline.
