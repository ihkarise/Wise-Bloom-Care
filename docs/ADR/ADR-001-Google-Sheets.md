# ADR-001 — Use Google Sheets as the v1 Data Store

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-07-22 |
| Deciders | Enterprise Architect, Database Architect, DevOps Architect |
| Related | `docs/04-Architecture/54-GOOGLE_SHEETS_SCHEMA.md`, `52-BACKEND_ARCHITECTURE.md`, `ADR-002-Apps-Script.md` |

---

## 1. Context
Wise Bloom Care must start quickly, cheaply, and privately as a multi-year platform, while preserving the ability to move to a real database later. We need a v1 data store that requires no infrastructure to operate and integrates with the chosen backend runtime (Google Apps Script, ADR-002). The data is highly sensitive (maternal/child health).

## 2. Decision
Use **private Google Sheets** as the v1 persistence layer, modelled as sheet-tabs-as-tables (`docs/04-Architecture/54`), accessed **only** through a Storage Adapter interface (`docs/04-Architecture/52`). Media (reports/images) is stored in **private Google Drive**, referenced by the backend.

## 3. Rationale
- **Zero-infra, low-cost, fast start**; private by default; native to Apps Script.
- **Reversible:** the adapter boundary means Sheets can be replaced with Postgres/Supabase/Firebase/Cloud SQL without frontend changes (NFR-6).
- Sufficient for expected v1 scale.

## 4. Consequences
### Positive
- Immediate, cheap, private storage; no ops burden for v1.
- Clean migration path via the adapter.
### Negative / Risks
- **No relational constraints/transactions** → integrity enforced by the adapter/services (keys, FKs, immutability, append-only) (`docs/04-Architecture/54` §5).
- **Scale/quota limits** → mitigated by batching/caching/locking and a defined migration threshold (RSK-9, `docs/04-Architecture/53`).
- **Concurrency** → `LockService` + append-only patterns.

## 5. Alternatives Considered
- **Managed DB (Postgres/Supabase/Firebase) now:** more robust but adds infra/cost/setup; deferred (NG-12) — chosen as the migration target instead.
- **Firebase/Firestore now:** viable but changes the runtime story; revisit at migration.

## 6. Compliance & Safety Notes
- Highly-sensitive data → restricted access, encryption at rest (provider), audit, private media (`docs/09-Security/*`).
- Backups mandatory and verified (`docs/04-Architecture/62`).

## 7. Review Trigger
Revisit when scale/quota thresholds approach, integrity needs exceed adapter enforcement, or multi-region/clinician load arrives (→ ADR for migration).
