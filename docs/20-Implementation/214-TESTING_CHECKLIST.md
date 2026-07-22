# 214 — Testing Checklist

| Field | Value |
|---|---|
| Document | Implementation Testing Checklist |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Lead |
| Last Updated | 2026-07-22 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Related | `docs/10-Testing/130`–`136`, `docs/03-UX/40`, `docs/07-AI/105`, `205`–`213` |

---

## 1. Purpose

An operational, per-change and per-release testing checklist that implements the frozen Master Test Plan (`docs/10-Testing/130`) and its specialised docs (`131`–`136`). It does not redefine test strategy; it turns it into checkboxes engineers and QA run every sprint. Synthetic data only — never production PHI (`130` BR-2).

## 2. Test Levels (from `130` §3)

| Level | What it covers | Where | Gate |
|---|---|---|---|
| Unit | services, computations, business rules | `apps/*/tests`, `packages/*` | per PR |
| Integration | service ↔ adapter ↔ API; delivery transition | `apps/backend/tests/integration`, `tests/contract` | per PR |
| Integrity | continuity invariants (delivery, timeline) | `tests/integrity` | release-blocking |
| End-to-end | user journeys across modules | `tests/e2e` (Playwright) | per release |
| Manual/exploratory | UX, edge cases, compassion flows | `132` | per release |
| UAT | real-user acceptance on staging | `133` | pre-prod |
| Performance | budgets, load | `tests/performance`, `134` | per release |
| Security | threat mitigations, RBAC, AI guardrails | `tests/security`, `135` | release-blocking |
| Accessibility | WCAG 2.2 AA | `tests/a11y`, `40` | release-blocking (core flows) |
| Regression | prevent recurrence | `tests/regression`, `136` | per release |

## 3. Per-Change (PR) Checklist

- [ ] Unit tests added/updated for new/changed logic; green.
- [ ] Integration tests for any service↔adapter or API change; green.
- [ ] Lint + type-check pass; boundary lint rules pass (no `SpreadsheetApp` outside adapter; no network outside `api/`).
- [ ] a11y considered for any UI change (semantic HTML/ARIA/keyboard/focus/reduced-motion) (`40`).
- [ ] No secrets/PHI added; synthetic data only (`130` BR-2).
- [ ] Every "Must" FR / vision invariant touched has a verifying test (`130` BR-1).
- [ ] Docs updated/in sync; ADR proposal filed if a defect implies an architecture change (`200` §11).

## 4. Safety-Critical Suites (release-blocking — `130` §4)

### 4.1 Continuity (KPI M1/M2)
- [ ] Delivery creates linked child(ren) **exactly once**; 0 duplicates (`no-duplicate-children`).
- [ ] 0 orphan children — every child links to mother + episode (`no-orphan-children`).
- [ ] `mother_id` immutable — update attempts rejected (`mother-link-immutable`).
- [ ] Timeline unbroken across delivery; maternal + child on one stream (`timeline-continuity-across-delivery`).
- [ ] Loss path creates no child; no baby prompts (`delivery-loss`).
- [ ] Multiple births → N distinct children, one episode/Event (`multiple-births`).
- [ ] Idempotent retry (same key + timeout-retry) → one child set (`delivery-idempotency`).

### 4.2 Content Typing (KPI M3/M4)
- [ ] No medical content served without `content_type` + `source_ref` (`52` BR-5, `28`).
- [ ] Educational / clinical / emergency types never mixed; emergency only from curated set.
- [ ] Client renders medical content only via content-type-aware components (`51` BR-4).

### 4.3 AI Safety (v2, MS-2.1)
- [ ] Adversarial set → **0** diagnostic/prescriptive/emergency-decision outputs (`105`, `130` §4.3) — blocks any AI exposure.
- [ ] AI answers grounded in KB (RAG); ungrounded medical claims refused (`100` BR-2).
- [ ] AI read-only w.r.t. records; writes only AI logs (`100` BR-5).
- [ ] Low-coverage → says so, no fabrication (`100` §9).

### 4.4 Privacy/Security
- [ ] RBAC enforced per resource; out-of-scope → `forbidden` (`123`).
- [ ] No PHI in logs (structured logging strips PHI) (`63`,`75`).
- [ ] Audit completeness on every health-data access (`75`).
- [ ] Media served only via short-lived backend-mediated refs; no public links (`58`).
- [ ] Rate limiting active on auth + write endpoints (`120`).
- [ ] Secret scanning clean; no secrets in repo/frontend (`124`,`60` BR-3).
- [ ] Revoked caregiver → next request `forbidden` (mid-session) (`56` §11).
- [ ] Input sanitised incl. spreadsheet formula-injection guard (`73`).

### 4.5 Accessibility
- [ ] Core flows pass WCAG 2.2 AA (`40`): semantic HTML, ARIA, keyboard, focus, reduced-motion, reflow.
- [ ] Charts ship an accessible text/table alternative (`35` §8).

## 5. Per-Release Checklist (mapped to `130` §7 quality gates)

- [ ] Unit + integration + e2e green.
- [ ] Regression suite green (`136`); no Non-Goal violations (`17`).
- [ ] Continuity + content-typing + privacy suites pass (§4).
- [ ] Accessibility AA on core flows (§4.5).
- [ ] Performance budgets met (`134`).
- [ ] (v2) AI adversarial set: 0 violations (§4.3).
- [ ] Backups verified (`62`); delivery-path rollback runbook drilled (`150`).
- [ ] UAT signed off on staging (`133`).
- [ ] Coverage: every Must FR + vision invariant traced to ≥1 passing test (`130` §5).

## 6. Traceability (from `130` §5)

- Every "Must" FR (`docs/01-Product/10`) → ≥1 case in `131`.
- Every vision invariant (BR-V1..BR-V5) → a verifying test.
- Coverage tracked; gaps for Must FRs **block release** (`130` BR-4).

## 7. Environments & Data

- Tests run on dev/staging with **synthetic data only** (`60`, `130` BR-2).
- Delivery-transition/integrity tests use dedicated synthetic families (`130` §6).

## 8. Acceptance Criteria

- [x] Checklist covers unit → integration → integrity → e2e → manual → UAT → performance → security → a11y → regression.
- [x] Safety-critical suites (continuity, typing, AI, privacy, a11y) marked release-blocking, tied to `130` §4/§7.
- [x] Per-PR and per-release gates defined; traceability + synthetic-data rules restated.

## 9. Dependencies

`docs/10-Testing/130`–`136`, `docs/03-UX/40`, `docs/07-AI/105`, `docs/04-Architecture/64`, `205`–`213`.

## 10. Risks

- R-1: Untested safety-critical paths (`130` R-1). Mitigation: §4 release-blocking suites + gates.
- R-2: Real PHI in tests (`130` R-2). Mitigation: §7 synthetic-only.
