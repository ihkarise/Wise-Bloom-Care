# 50 — System Architecture

| Field | Value |
|---|---|
| Document | System Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `51-FRONTEND_ARCHITECTURE.md`, `52-BACKEND_ARCHITECTURE.md`, `56-API_SPEC.md`, `docs/ADR/*` |

---

## 1. Purpose

Describes the end-to-end system architecture of Wise Bloom Care: the layers, their responsibilities, the boundaries between them, and — critically — the **storage-independence boundary** that lets the v1 backend (Google Apps Script + Google Sheets) be replaced later (Postgres/Supabase/Firebase/Cloud SQL) without rewriting the frontend. This is the top-level technical map; sub-documents detail each layer.

## 2. Scope

Whole-system view: client, API contract, backend adapter, storage, knowledge base, AI, and cross-cutting concerns (auth, logging, security). Detailed schemas/specs live in sibling docs.

## 3. Architectural Goals (from Vision/PRD)

- **Modular & migratable** (NFR-6): frontend depends on an API contract, not on Sheets.
- **Single source of truth** (P5): one owner per fact; derived values computed.
- **Secure & private** (NFR-2/3): RBAC, encryption, audit, validation, rate limiting.
- **Scalable & maintainable**: modules, no duplicated logic; documented boundaries.
- **Mobile-first, offline-ready (future)**: client works on phones/poor networks.

## 4. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Client (Astro + React + TS + Tailwind, Chart.js)             │
│  - UI, state, offline cache (future PWA)                      │
│  - Talks ONLY to the API contract                            │
└───────────────▲──────────────────────────────────────────────┘
                │  API contract (stable, versioned) — §6
┌───────────────┴──────────────────────────────────────────────┐
│ API / Application layer (in Apps Script today)               │
│  - Auth guard, request validation, rate limiting             │
│  - Domain services: timeline, continuity, trends, content    │
│    typing, guardrails                                        │
│  - Depends on the Storage Adapter interface, not Sheets      │
└───────────────▲──────────────────────────────────────────────┘
                │  Storage Adapter interface — §7
┌───────────────┴──────────────────────────────────────────────┐
│ Storage Adapter (v1: Google Sheets) │ Knowledge Base (files) │
│  - Sheets-as-tables (54)            │  - versioned MD content │
│  - swappable: Postgres/Supabase/... │  - feeds education + AI │
└──────────────────────────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │ AI provider(s) │  (educational; guardrailed; docs/07-AI)
        └────────────────┘
```

## 5. Component Responsibilities

- **Client:** presentation, interaction, local state, charts; no business rules that belong server-side; no direct storage access.
- **API/Application layer:** authentication/authorisation, validation, rate limiting, domain logic (timeline append/versioning, continuity/linking, trend/prediction, content typing, AI guardrails), audit logging.
- **Storage Adapter:** persistence behind a stable interface; v1 = Google Sheets via Apps Script; future = relational/BaaS.
- **Knowledge Base:** versioned medical content (files), independent of product logic; consumed by education and AI (RAG).
- **AI provider:** educational generation, always post-processed by guardrails.

## 6. The API Contract (independence boundary #1)

- The client communicates exclusively through a **stable, versioned API** (`56-API_SPEC.md`).
- The contract is defined in terms of **domain resources** (family, maternal record, child, events, vitals, reports, etc.), never storage specifics.
- Changing the backend implementation must not change this contract → no frontend rewrite (NFR-6).

## 7. The Storage Adapter (independence boundary #2)

- The application layer depends on a **Storage Adapter interface** (CRUD + query semantics for domain entities), not on Google Sheets APIs directly.
- v1 implements the adapter over Sheets (`54-GOOGLE_SHEETS_SCHEMA.md`); a future adapter implements it over Postgres/Supabase/Firebase (`55-DATABASE_MODEL.md` is storage-neutral).
- Rationale and trade-offs: `docs/ADR/ADR-001-Google-Sheets.md`, `ADR-002-Apps-Script.md`.

## 8. Cross-Cutting Concerns

- **Auth/session:** `57-AUTH_FLOW.md`, `docs/09-Security/122-SESSION_MANAGEMENT.md`.
- **Security model:** `58-SECURITY_MODEL.md`, `docs/09-Security/*`.
- **Logging/monitoring:** `63-LOGGING.md`, `64-MONITORING.md`.
- **Audit:** `docs/05-Data/75-AUDIT_LOGS.md` (every health-data access).
- **Content typing & guardrails:** `docs/02-Research/28`, `docs/07-AI/105`.

## 9. Continuity in the Architecture

The one-record thesis is enforced at the application layer: the delivery service is the sole creator of a child record and writes the immutable mother-link; the timeline service enforces append-only/versioned events. Storage merely persists what the application layer guarantees. See `docs/05-Data/71-ENTITY_RELATIONSHIP.md`, `docs/08-Timeline/111-DELIVERY_TRANSITION.md`.

## 10. Data Flow (example: log a vital)

1. Client → API `POST /vitals` (auth token).
2. API: authorise → validate → apply business rules → append timeline event → persist via adapter → audit log.
3. API → client: created event + updated trend.
4. Client renders current/previous/trend (calm, non-diagnostic).

## 11. Business Rules

- BR-1: The client never accesses storage directly; only the API contract.
- BR-2: The application layer never calls Sheets APIs directly; only the adapter interface.
- BR-3: Business/continuity rules live server-side (application layer), not in the client.
- BR-4: Every health-data access passes through auth + audit.

## 12. Edge Cases & Constraints

- **Apps Script limits** (quotas, execution time, concurrency): mitigated by caching, batching, and the adapter boundary enabling migration (RSK-9).
- **Sheets as a database**: not relationally enforced; the application layer enforces integrity (keys, links, append-only) — see `54`, `55`.
- **Offline (future):** client-side queue syncs via the same API contract.

## 13. Acceptance Criteria

- [x] Layered architecture with two explicit independence boundaries (API contract, storage adapter).
- [x] Component responsibilities and cross-cutting concerns mapped to docs.
- [x] Continuity enforced at the application layer.
- [x] Apps Script/Sheets constraints acknowledged with mitigations.

## 14. Future Expansion

Swap storage adapter to Postgres/Supabase/Firebase; introduce a dedicated API gateway/service if moving off Apps Script; add offline sync, clinician portal, device ingestion — all behind the existing contract.

## 15. Dependencies

`51`, `52`, `53`, `54`, `55`, `56`, `57`, `58`, `docs/ADR/*`, `docs/05-Data/*`, `docs/09-Security/*`.

## 16. Open Questions

- OQ-1: When to trigger the storage migration (load/quota thresholds).
- OQ-2: Whether the API layer stays in Apps Script or moves to a dedicated service at v2/v3.

## 17. Risks

- R-1: Boundary erosion (client or app layer bypassing abstractions). Mitigation: BR-1/BR-2 + conformance review.
- R-2: Apps Script scaling limits. Mitigation: adapter enables migration; monitor quotas.
