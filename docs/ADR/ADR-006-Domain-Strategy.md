# ADR-006 — Domain & Endpoint Strategy

| Field | Value |
|---|---|
| Status | Accepted (with one open sub-decision) |
| Date | 2026-07-22 |
| Deciders | DevOps Architect, Enterprise Architect |
| Related | `docs/04-Architecture/61-DOMAINS.md`, `60-DEPLOYMENT.md`, `56-API_SPEC.md` |

---

## 1. Context
The product ships at `care.wisehomeopathy.com` (a subdomain of the parent brand). We need a domain/endpoint strategy that supports environment isolation, TLS everywhere, and decoupling the frontend from the (changeable) GAS backend URL — without forcing frontend rebuilds when the backend redeploys.

## 2. Decision
- **Production domain:** `care.wisehomeopathy.com`; environment subdomains `staging.care…`, `dev.care…` (`docs/04-Architecture/61`).
- **TLS/HTTPS everywhere**; HSTS; no plaintext.
- **Backend decoupling:** the frontend uses a **configured API base URL per environment**, not a hard-coded GAS URL, so backend redeploys don't require frontend rebuilds.
- **Open sub-decision:** whether to introduce an `api.care.wisehomeopathy.com` reverse-proxy/alias in front of the GAS endpoint now or later (OQ-1). Not required for v1 correctness.

## 3. Rationale
- Subdomain aligns with the parent brand while keeping a distinct product property.
- Environment subdomains give clean isolation (`docs/04-Architecture/60`).
- Config-driven API base URL insulates the app from GAS URL churn; an optional `api.` proxy would further stabilise the endpoint and enable a clean cutover at migration.

## 4. Consequences
### Positive
- Brand-aligned, isolated, TLS-secured environments; resilient to backend URL changes.
### Negative / Risks
- Without an `api.` proxy, GAS URL changes still require a config update (not a rebuild) → acceptable for v1.
- Managing multiple subdomains/certs → monitoring for expiry (`docs/04-Architecture/64`).

## 5. Alternatives Considered
- **Separate root domain** (not a subdomain): weaker brand alignment; more setup.
- **Hard-code backend URL:** rejected — brittle to redeploys (violates decoupling).
- **`api.` proxy now:** viable; deferred as an optional enhancement (OQ-1).

## 6. Compliance & Safety Notes
- TLS protects data in transit (`docs/09-Security/121`); no mixed content; media never via public links (`docs/09-Security/123`).

## 7. Review Trigger
Decide the `api.` proxy question before/at backend migration (V3); revisit for additional regional domains (localisation) and the clinician portal.
