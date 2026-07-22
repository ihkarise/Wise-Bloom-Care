# 201 — Monorepo Structure

| Field | Value |
|---|---|
| Document | Monorepo / Repository Structure |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Staff Engineer / DevOps Lead |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `docs/04-Architecture/59-FOLDER_STRUCTURE.md`, `51-FRONTEND_ARCHITECTURE.md`, `52-BACKEND_ARCHITECTURE.md`, `53-GOOGLE_APPS_SCRIPT.md`, `docs/ADR/ADR-003-Astro.md` |

---

## 1. Purpose

Specifies the concrete repository layout that implementation will create, expanding the frozen target layout of `docs/04-Architecture/59` into a buildable monorepo with an explanation of **every** folder. This document introduces no new architecture; it operationalises `59` and `51`/`52` structurally. Where `59` leaves an engineering choice open (`59` OQ-1 monorepo tooling), this document records the choice as an implementation decision, not an architecture change.

## 2. Tooling Decision (implementation-level, resolves `59` OQ-1)

- **Package manager & workspaces:** **pnpm workspaces**. Rationale: strict, disk-efficient, first-class monorepo support, no extra orchestrator needed at v1 scale. Recorded as an implementation decision; if it later proves architecturally significant it is escalated via ADR (`200` §11).
- **Language:** TypeScript across `apps/web`, `packages/*`, and `apps/backend` (Apps Script authored in TS, transpiled/pushed via **clasp** per `docs/04-Architecture/53`).
- **Node version:** pinned via `.nvmrc` / `engines` in root `package.json`.

This is the only tooling commitment; nothing else about the frozen structure changes.

## 3. Current vs. Target

The repository **today** contains `docs/` and `knowledge-base/` (design-first, per `59` §3 note). Sprint 00 introduces `apps/`, `packages/`, and root configuration. Existing content is never restructured — only added to.

## 4. Complete Target Layout

```
/
├─ docs/                          # Architecture & product docs (FROZEN baseline) + this section
│  ├─ 00-Vision … 13-Future/      #   frozen architecture set
│  ├─ 20-Implementation/          #   this section (execution docs)
│  └─ ADR/                        #   decision records; ADR proposals land here
│
├─ knowledge-base/                # Versioned medical content, code-independent (docs/07-AI/101)
│  ├─ pregnancy/ delivery/ newborn/ growth/ milestones/
│  ├─ vaccination/ nutrition/ exercise/ emergency/ medicines/
│
├─ apps/
│  ├─ web/                        # Astro + React + TS + Tailwind frontend (docs/04-Architecture/51)
│  │  ├─ src/
│  │  │  ├─ pages/                #   Astro routes (SSG/SSR shells)
│  │  │  ├─ islands/              #   React interactive components (hydrated)
│  │  │  ├─ components/           #   design-system-bound UI components (docs/03-UX/36)
│  │  │  ├─ features/             #   feature modules mirroring docs/06-Modules/*
│  │  │  │  ├─ auth/ dashboard/ pregnancy/ vitals/ reports/ medicines/
│  │  │  │  ├─ appointments/ nutrition/ exercise/ delivery/ baby/
│  │  │  │  ├─ growth/ milestones/ vaccination/ journal/ notifications/
│  │  │  │  ├─ family/ settings/ ai/
│  │  │  ├─ domain/               #   TS types mirroring the API contract (from packages/domain-types)
│  │  │  ├─ api/                  #   THE ONLY place that talks to the backend (typed client)
│  │  │  ├─ state/                #   per-feature stores (server-state cache + local UI state)
│  │  │  ├─ lib/                  #   formatting, dates/GA, units, percentile display helpers
│  │  │  └─ styles/               #   Tailwind config + semantic design tokens (docs/03-UX/35,37,38)
│  │  ├─ public/                  #   static assets (icons, manifest); NO secrets
│  │  ├─ tests/                   #   unit (Vitest) + e2e (Playwright) for the web app
│  │  ├─ astro.config.mjs
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  │
│  └─ backend/                    # Google Apps Script project (docs/04-Architecture/52,53)
│     ├─ src/
│     │  ├─ controllers/          #   auth guard, validation, rate limiting, routing (doGet/doPost)
│     │  ├─ services/             #   domain services (business rules; single source of truth)
│     │  │  ├─ AuthService, SessionService
│     │  │  ├─ FamilyService, MaternalService, PregnancyService, ChildService
│     │  │  ├─ DeliveryService        (SOLE creator of Child + immutable mother link)
│     │  │  ├─ TimelineService        (append-only, versioned events)
│     │  │  ├─ VitalsService, ReportsService, MedicinesService, AppointmentsService
│     │  │  ├─ GrowthService, MilestonesService, VaccinationService, JournalService
│     │  │  ├─ TrendService, PredictionService (surfacing only)
│     │  │  ├─ ContentService         (content typing + source refs)
│     │  │  ├─ AIService              (guardrailed; docs/07-AI)
│     │  │  ├─ NotificationService
│     │  │  └─ AuditService           (every health-data access)
│     │  ├─ adapters/
│     │  │  └─ sheets/            #   THE ONLY place that touches SpreadsheetApp (docs/04-Architecture/53 BR-1)
│     │  │     ├─ SheetsStorageAdapter.ts   (implements the StorageAdapter interface)
│     │  │     ├─ tables/         #   entity↔tab mappings (docs/04-Architecture/54)
│     │  │     └─ integrity/      #   FK/uniqueness/immutability/append-only enforcement (71 §7)
│     │  ├─ lib/                  #   pure helpers (validation, sanitisation, ids, dates)
│     │  └─ main.ts               #   entrypoint: routes requests → controllers
│     ├─ tests/                   #   unit + integration (services ↔ adapter)
│     ├─ appsscript.json          #   GAS manifest (scopes, webapp config)
│     ├─ .clasp.json.example      #   per-env clasp config template (real ones are git-ignored)
│     └─ package.json
│
├─ packages/                      # Shared, storage-neutral packages (the contract lives here)
│  ├─ api-contract/               # Logical API contract definitions (docs/04-Architecture/56)
│  │  ├─ src/                     #   resource + endpoint definitions; future OpenAPI source
│  │  └─ package.json
│  ├─ domain-types/               # TS types mirroring the data model (docs/05-Data/70,72); consumed by both apps
│  │  ├─ src/                     #   Family, MaternalRecord, PregnancyEpisode, ChildRecord, Event, Vital, ...
│  │  └─ package.json
│  └─ config/                     # Shared lint/format/tsconfig base (docs/11-Development/140)
│     ├─ eslint/ prettier/ tsconfig/
│     └─ package.json
│
├─ scripts/                       # Dev/ops scripts (bootstrap, seed synthetic data, deploy helpers)
├─ tools/                         # Local dev tooling (codegen, contract check, lint rules)
├─ tests/                         # Cross-app / contract / integrity test suites (docs/10-Testing)
│  ├─ contract/                   #   client↔contract conformance
│  ├─ integrity/                  #   continuity & delivery-transition integrity (KPI M1/M2)
│  └─ e2e/                        #   full-journey e2e (may host Playwright projects)
│
├─ .github/                       # CI workflows, PR template (docs/11-Development/145), issue templates
│  └─ workflows/                  #   lint, type-check, test, a11y, perf, build, deploy gates
├─ pnpm-workspace.yaml            # workspace globs: apps/*, packages/*
├─ package.json                   # root scripts, engines, workspaces
├─ tsconfig.base.json             # base TS config extended by every package/app
├─ .nvmrc                         # pinned Node version
├─ .gitignore                     # ignores .clasp.json, .env*, build output, node_modules
└─ README.md
```

> Note on CI provider: `docs/04-Architecture/60` OQ-2 anticipates GitLab CI given a private GitLab. This repository is hosted on GitHub; CI is therefore authored under `.github/workflows/`. This is an implementation/hosting detail, not an architecture change — the gates enforced are identical to those `docs/10-Testing/130` §7 and `docs/01-Product/16` require.

## 5. Every Folder Explained

| Path | Responsibility | Boundary rule (source) |
|---|---|---|
| `docs/` | Frozen architecture + this execution section | Docs keep numbering; `59` BR-4 |
| `knowledge-base/` | Versioned medical content, independent of code | `59` BR-3; feeds education + RAG (`07-AI/101`) |
| `apps/web/src/pages` | Astro route shells (SSG/SSR) | Islands architecture (`51` §4) |
| `apps/web/src/islands` | React interactive regions | Hydrate only interactive islands (`51` §4) |
| `apps/web/src/components` | Design-system-bound UI | Semantic tokens only (`140` BR-1) |
| `apps/web/src/features/*` | Feature modules ↔ product modules | Map to `docs/06-Modules/*` (`51` §7) |
| `apps/web/src/domain` | Client types mirrored from contract | Source = `packages/domain-types` (`51` §6) |
| `apps/web/src/api` | **Single** backend boundary (typed client) | All network calls here only (`51` BR-1) |
| `apps/web/src/state` | Server-state cache + local UI state | No divergent business rules (`51` BR-3) |
| `apps/web/src/lib` | Display-derived values (GA, trend, percentile) | Computed from API data, not re-implemented divergently (`51` §6) |
| `apps/web/src/styles` | Tailwind + semantic tokens | Tokens from `docs/03-UX/35,37,38` |
| `apps/backend/src/controllers` | Auth guard, validation, rate limiting, routing | `52` §4 |
| `apps/backend/src/services` | Domain services; server-authoritative rules | Single responsibility; no duplicated logic (`52` §6, `13` §3) |
| `apps/backend/src/adapters/sheets` | **Only** place touching `SpreadsheetApp` | `53` BR-1, `59` BR-1 |
| `apps/backend/src/lib` | Pure helpers (ids, dates, sanitisation) | No storage/PHI (`140`) |
| `packages/api-contract` | Storage-neutral contract (independence boundary #1) | `59` §4; `56` |
| `packages/domain-types` | Shared TS types for both apps | `59` BR-2 |
| `packages/config` | Shared lint/format/tsconfig | `140` §8 |
| `scripts/` | Bootstrap, synthetic-data seeding, deploy helpers | Synthetic data only (`130` BR-2) |
| `tools/` | Codegen, contract-conformance, custom lint rules | Enforces boundaries in CI |
| `tests/` | Cross-app contract + integrity + e2e suites | `130` levels |
| `.github/workflows` | CI gates (lint/type/test/a11y/perf/build/deploy) | `60` §4, `01-Product/16` |

## 6. Boundary-Reflecting Structure (why the layout *is* the architecture)

- `packages/api-contract` + `packages/domain-types` make the client/backend contract a real, shared package — the storage-independence boundary is code, not convention (`59` §4).
- All Sheets access is confined to `apps/backend/src/adapters/sheets`; a future `adapters/postgres` sits beside it, so migration is a **new folder, not a rewrite** (`59` §4, `52` §5).
- `knowledge-base/` is separate from all code, so medical content is versioned independently (`59` §4).

## 7. Conventions

- Kebab-case folders; feature-first grouping in the frontend (`59` §5).
- One responsibility per module/folder; shared logic lives in `packages/`, never copied across apps (`59` BR-2).
- Docs remain numbered (`59` BR-4). Large media is **not** stored in the repo (kept in private Drive per `54`); `.gitignore` enforces this.
- Real `.clasp.json` and `.env*` files are git-ignored; only `.example` templates are committed (`60` BR-3, `124`).

## 8. Business Rules

- BR-1: All Sheets access lives under `apps/backend/src/adapters/sheets`; a CI lint rule fails the build if `SpreadsheetApp` is referenced elsewhere (`59` BR-1).
- BR-2: Shared contract/types live in `packages/` and are consumed by both apps (`59` BR-2).
- BR-3: Knowledge base stays code-independent under `knowledge-base/` (`59` BR-3).
- BR-4: Docs remain under `docs/` with the established numbering (`59` BR-4).
- BR-5: No secrets or large media in the repo (`60` BR-3, `54`).

## 9. Acceptance Criteria

- [x] Complete monorepo layout defined, expanding `docs/04-Architecture/59` without altering it.
- [x] Every folder has a stated responsibility and boundary rule.
- [x] Storage-independence boundaries (contract package, sheets adapter) are structural.
- [x] Tooling and CI-hosting decisions recorded as implementation-level, not architecture changes.

## 10. Future Expansion (per `59` §9)

Add `apps/clinician-portal`, `adapters/postgres|supabase`, `packages/ui`, offline/service-worker code, and infra-as-code as the platform grows — each as a new folder beside existing ones.

## 11. Dependencies

`docs/04-Architecture/59`, `51`, `52`, `53`, `60`, `docs/07-AI/101`, `docs/11-Development/140`, `202-BUILD_ORDER.md`.

## 12. Risks

- R-1: Sheets access leaking outside the adapter. Mitigation: BR-1 lint rule + review (`59` R-1).
- R-2: Duplicated logic across apps. Mitigation: BR-2 shared packages (`59` R-2).
