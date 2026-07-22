# 140 — Coding Standards

| Field | Value |
|---|---|
| Document | Coding Standards |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `141-CONTRIBUTING.md`, `146-DEFINITION_OF_DONE.md`, `docs/04-Architecture/51-FRONTEND_ARCHITECTURE.md`, `52-BACKEND_ARCHITECTURE.md` |

---

## 1. Purpose
Defines the coding standards for Wise Bloom Care so the codebase is consistent, readable, safe, and maintainable — and so the architecture's safety/continuity boundaries are respected in code.

## 2. Scope
Language/style conventions (TypeScript frontend, Apps Script backend), architectural coding rules, safety rules, and tooling. Applies once implementation begins.

## 3. General Principles
- Readable over clever; match surrounding code's idiom.
- Single responsibility; no duplicated logic (P5).
- Type-safe (TypeScript) with domain types from the contract (`packages/domain-types`).
- Fail closed on security; validate all input server-side.
- No secrets/PHI in code, logs, or comments.

## 4. TypeScript / Frontend
- Strict TypeScript; no `any` without justification.
- Feature-first structure (`docs/04-Architecture/51`); components consume **semantic design tokens** only (`docs/03-UX/35`).
- All backend calls via the `api/` client (no ad-hoc fetches).
- Accessibility built-in (semantic HTML/ARIA, `docs/03-UX/40`).
- Lint + format (ESLint + Prettier-class) enforced in CI.

## 5. Apps Script / Backend
- Only the Sheets adapter touches `SpreadsheetApp` (`docs/04-Architecture/53` BR-1).
- Services enforce business/continuity rules; controllers validate + authorise + rate-limit.
- Secrets via Script Properties only (`docs/09-Security/124`).
- Structured logging, no PHI (`docs/04-Architecture/63`).

## 6. Safety Coding Rules (product-specific)
- Medical content rendered only via content-type-aware components (typed + sourced) (`docs/03-UX/36` BR-2).
- AI output only via the guardrail layer (`docs/07-AI/105`).
- Delivery/child creation only via DeliveryService (`docs/06-Modules/88`).
- Append-only/versioned data operations respected (`docs/05-Data/77`).
- Input sanitised incl. spreadsheet formula-injection guard (`docs/05-Data/73`).

## 7. Documentation & Comments
- Comment the *why*, not the obvious *what*; match surrounding density.
- Public service/API functions documented with contracts.
- Keep code and docs in sync; reference doc IDs where useful.

## 8. Tooling
- Lint, format, type-check, and tests in CI (`docs/01-Product/16`).
- Pre-merge checks enforce standards (Definition of Done, `146`).

## 9. Business Rules
- BR-1 Semantic-token-only styling; `api/`-only backend calls; adapter-only Sheets access.
- BR-2 No secrets/PHI in code/logs/comments.
- BR-3 Business/continuity/safety rules live server-side and in designated services.
- BR-4 Lint/format/type-check/tests pass before merge.
- BR-5 Medical content + AI output go through typed/guardrailed paths.

## 10. Edge Cases
Legacy/experimental code (isolated + flagged); performance-critical code (documented trade-offs); generated code (from contract) kept in sync.

## 11. Acceptance Criteria
- [x] Language/style + architectural + safety coding rules defined.
- [x] Tooling + pre-merge enforcement stated.

## 12. Future Expansion
Shared lint config package, codegen for API types, commit hooks, stricter typing over time.

## 13. Dependencies
`141`, `146`, `docs/04-Architecture/51`, `52`, `53`, `docs/03-UX/35`, `36`, `docs/05-Data/73`, `77`, `docs/07-AI/105`.

## 14. Open Questions
- OQ-1 Exact lint/format configs.
- OQ-2 Codegen tooling for domain types.

## 15. Risks
- R-1 Boundary erosion in code. Mitigation: BR-1/BR-3 + review + lint.
- R-2 PHI/secrets in code. Mitigation: BR-2 + secret scanning.
