# 59 — Repository & Folder Structure

| Field | Value |
|---|---|
| Document | Repository & Folder Structure |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `51-FRONTEND_ARCHITECTURE.md`, `52-BACKEND_ARCHITECTURE.md`, `docs/11-Development/*` |

---

## 1. Purpose

Defines the intended repository layout so documentation, frontend, backend, and knowledge base are organised consistently and the storage-independence boundaries are visible in the structure itself. This governs where code and content live once implementation begins.

## 2. Scope

Top-level repo organisation and the frontend/backend/knowledge-base structure. Detailed frontend `src/` layout: `51`; backend services: `52`.

## 3. Top-Level Layout (target)

```
/
├─ docs/                    # architecture & product docs (this set)
│  ├─ 00-Vision … 13-Future
│  └─ ADR/
├─ knowledge-base/          # versioned medical content (independent of code)
│  ├─ pregnancy/ delivery/ newborn/ growth/ milestones/
│  ├─ vaccination/ nutrition/ exercise/ emergency/ medicines/
├─ apps/
│  ├─ web/                  # Astro + React + TS + Tailwind frontend
│  │  └─ src/ (pages, islands, components, features, domain, api, state, lib, styles)
│  └─ backend/              # Google Apps Script project (clasp)
│     └─ src/ (controllers, services, adapters/sheets, lib)
├─ packages/                # shared, storage-neutral packages
│  ├─ domain-types/         # TS types mirroring the API contract / data model
│  └─ api-contract/         # contract definitions (future OpenAPI)
├─ .github/ or .gitlab/     # CI, PR templates
├─ README.md
└─ (config: package manager, lint, format, tsconfig)
```

> Note: the current repository contains `docs/` and `knowledge-base/`. `apps/` and `packages/` are introduced when implementation begins (design-first, `docs/00-Vision`).

## 4. Boundary-Reflecting Structure

- **`packages/api-contract` + `packages/domain-types`** encode the client/backend contract independently of either app → the storage-independence boundary is a real package, not a convention.
- **`apps/backend/src/adapters/sheets`** isolates all Google Sheets access; a future `adapters/postgres` sits beside it → migration is a new folder, not a rewrite.
- **`knowledge-base/`** is separate from all code → medical content versioned independently (`docs/07-AI/101`).

## 5. Conventions

- Kebab-case folders; feature-first grouping in the frontend (`51`).
- Docs numbered by section for stable ordering.
- Knowledge base organised by domain and life stage; files carry content metadata (`docs/02-Research/28`).
- One responsibility per module/folder; no duplicated logic across apps (shared in `packages/`).

## 6. Business Rules

- BR-1: All Sheets access lives under `apps/backend/src/adapters/sheets`; nowhere else.
- BR-2: Shared contract/types live in `packages/`, consumed by both apps.
- BR-3: Knowledge base stays code-independent under `knowledge-base/`.
- BR-4: Docs remain under `docs/` with the established numbering.

## 7. Edge Cases

- Monorepo tooling (workspaces) vs. polyrepo — current single repo assumed; structure supports either.
- GAS deployment via clasp from `apps/backend` (`53`, `60`).
- Large media not stored in repo (kept in private Drive; `54`).

## 8. Acceptance Criteria

- [x] Top-level layout defined incl. docs, knowledge base, apps, packages.
- [x] Storage-independence boundaries reflected structurally (adapters, contract package).
- [x] Conventions and boundary rules stated.

## 9. Future Expansion

Add `apps/clinician-portal`, `adapters/postgres|supabase`, `packages/ui` (shared components), offline/service-worker code, and infra-as-code as the platform grows.

## 10. Dependencies

`51`, `52`, `53`, `60`, `docs/07-AI/101`, `docs/11-Development/*`.

## 11. Open Questions

- OQ-1: Monorepo tooling choice (workspaces/Nx/Turborepo) — engineering.
- OQ-2: Whether to split knowledge base into its own repo later.

## 12. Risks

- R-1: Sheets access leaking outside the adapter folder. Mitigation: BR-1 + lint/review.
- R-2: Duplicated logic across apps. Mitigation: BR-2 shared packages.
