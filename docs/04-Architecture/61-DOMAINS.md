# 61 — Domains & DNS

| Field | Value |
|---|---|
| Document | Domains & DNS |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `60-DEPLOYMENT.md`, `58-SECURITY_MODEL.md`, `docs/ADR/ADR-006-Domain-Strategy.md` |

---

## 1. Purpose

Defines the domain and DNS strategy for Wise Bloom Care, including the production domain, environment subdomains, TLS, and the backend endpoint arrangement.

## 2. Scope

Domain naming, subdomains per environment, TLS/HTTPS, and how the frontend reaches the GAS backend. Rationale: `docs/ADR/ADR-006-Domain-Strategy.md`.

## 3. Domains

| Purpose | Domain |
|---|---|
| Production app | `care.wisehomeopathy.com` |
| Staging (proposed) | `staging.care.wisehomeopathy.com` |
| Dev/preview (proposed) | `dev.care.wisehomeopathy.com` / local |

`care.wisehomeopathy.com` is a subdomain of the existing `wisehomeopathy.com`, aligning the product with the parent brand while keeping it a distinct property.

## 4. Backend Endpoint

- The GAS web app is exposed at a Google-provided URL per deployment (`53`, `60`).
- The frontend references the backend via a configured **API base URL** (per environment), not a hard-coded storage detail (`51`, `56`).
- Options for a cleaner API host (proposed): a `api.care.wisehomeopathy.com` reverse-proxy/alias in front of the GAS endpoint — decision in `ADR-006`. Not required for v1 correctness.

## 5. TLS / HTTPS

- HTTPS everywhere; valid TLS certs for all app domains (`58` — data in transit).
- HSTS recommended; no mixed content.
- Certificates managed by the host/CDN (auto-renewing preferred).

## 6. DNS Records (indicative)

- `care` → frontend host/CDN (A/AAAA/CNAME per provider).
- `staging.care`, `dev.care` → respective hosts.
- Optional `api.care` → proxy in front of GAS (if adopted).
- TTLs set to allow reasonably fast failover.

## 7. Business Rules

- BR-1: Production uses `care.wisehomeopathy.com` over HTTPS only.
- BR-2: Environments use distinct subdomains; never share hostnames.
- BR-3: The frontend uses a configured API base URL per environment; no hard-coded backend specifics in components.
- BR-4: All domains enforce TLS; no plaintext HTTP.

## 8. Edge Cases

- GAS endpoint URL changes on redeploy → decouple via config (and optional `api.` proxy) so the frontend needn't rebuild for backend URL changes.
- Domain/cert expiry → monitoring + auto-renew (`64`).
- Subdomain takeover risk → manage DNS carefully; remove stale records.

## 9. Acceptance Criteria

- [x] Production domain and environment subdomains defined.
- [x] Backend endpoint decoupling (API base URL / optional proxy) specified.
- [x] TLS/HTTPS mandated across domains.

## 10. Future Expansion

Dedicated `api.` host on backend migration; clinician-portal subdomain; regional domains for localisation; CDN/edge config.

## 11. Dependencies

`60`, `58`, `56`, `docs/ADR/ADR-006-Domain-Strategy.md`, `64`.

## 12. Open Questions

- OQ-1: Adopt `api.care.wisehomeopathy.com` proxy in v1 or later?
- OQ-2: DNS/host provider specifics.

## 13. Risks

- R-1: Backend URL churn breaking the app. Mitigation: BR-3 config decoupling.
- R-2: Cert/domain lapse. Mitigation: monitoring + auto-renew.
