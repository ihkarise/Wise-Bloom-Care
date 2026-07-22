# 141 — Contributing

| Field | Value |
|---|---|
| Document | Contributing Guide |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `140-CODING_STANDARDS.md`, `142-GIT_WORKFLOW.md`, `145-PR_TEMPLATE.md`, `146-DEFINITION_OF_DONE.md` |

---

## 1. Purpose
Explains how to contribute to Wise Bloom Care: the design-first workflow, expectations, and the review process — ensuring the product's safety, continuity, and privacy principles are upheld in every change.

## 2. Scope
Contribution process for docs and (once implementation begins) code. Git specifics: `142`; PR: `145`; DoD: `146`.

## 3. Design-First Principle
- **Documentation precedes implementation** (`docs/00-Vision`): a feature is specified (module doc + acceptance criteria) before code.
- Architecturally significant decisions require an **ADR** (`docs/ADR/`).
- Changes reference the relevant doc IDs.

## 4. Contribution Workflow
1. Pick/relate work to a requirement (`docs/01-Product`) or doc.
2. Branch per `142`/`143`.
3. Make focused changes matching coding standards (`140`).
4. Add/adjust tests (`docs/10-Testing`), incl. safety-critical where relevant.
5. Update docs (single source of truth; keep in sync).
6. Open a PR using the template (`145`); pass CI + review + DoD (`146`).

## 5. Review Expectations
- At least one reviewer; safety-critical changes (delivery, content typing, AI, security, data model) require heightened review and may need clinician/security sign-off.
- Reviewers may block on principle violations (`docs/00-Vision/03`).
- Be frugal and clear in PR discussion.

## 6. Safety & Sensitivity
- Never commit secrets or real PHI (use synthetic data).
- Medical content changes must be typed + sourced and reviewed (`docs/02-Research/28`, `docs/07-AI/101`).
- Compassion-sensitive flows (loss) require careful review.

## 7. Business Rules
- BR-1 Design-first: spec + acceptance criteria before implementation; ADR for significant decisions.
- BR-2 Every change references relevant docs and keeps docs in sync.
- BR-3 Safety-critical changes require heightened review/sign-off.
- BR-4 No secrets/real PHI in contributions.
- BR-5 PRs pass CI + review + Definition of Done.

## 8. Edge Cases
Hotfixes (expedited but still reviewed + tested); doc-only changes (lighter path); large refactors (ADR + phased); external contributors (future; private repo now).

## 9. Acceptance Criteria
- [x] Design-first workflow + review expectations defined.
- [x] Safety/sensitivity rules stated.
- [x] Links to git/PR/DoD.

## 10. Future Expansion
Contributor onboarding, CODEOWNERS for safety-critical areas, external-contributor policy, automated doc-sync checks.

## 11. Dependencies
`140`, `142`, `143`, `145`, `146`, `docs/00-Vision/03`, `docs/ADR/`, `docs/10-Testing/*`.

## 12. Open Questions
- OQ-1 CODEOWNERS mapping for safety-critical modules.
- OQ-2 Clinician sign-off process for medical content.

## 13. Risks
- R-1 Unreviewed safety-critical change. Mitigation: BR-3 heightened review.
- R-2 Docs drifting from code. Mitigation: BR-2 sync requirement.
