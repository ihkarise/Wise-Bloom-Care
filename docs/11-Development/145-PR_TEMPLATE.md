# 145 — Pull/Merge Request Template

| Field | Value |
|---|---|
| Document | PR/MR Template |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Software Architect |
| Last Updated | 2026-07-22 |
| Related | `141-CONTRIBUTING.md`, `144-COMMIT_CONVENTION.md`, `146-DEFINITION_OF_DONE.md` |

---

## 1. Purpose
Defines the template every merge request uses, ensuring changes are described, tested, and checked against the product's safety/continuity/privacy gates before merge.

## 2. Scope
The MR template content and checklist. DoD: `146`.

## 3. Template

```markdown
## Summary
What & why. Reference requirements/doc IDs (e.g., FR-13, docs/06-Modules/88).

## Changes
- Key changes (bullet).

## Type
feat / fix / docs / refactor / test / chore / perf / security / content

## Testing
- Tests added/updated (link cases, docs/10-Testing/131).
- How verified (incl. safety-critical if applicable).

## Safety & Privacy checklist
- [ ] No secrets/PHI added (synthetic data only)
- [ ] Medical content typed + sourced (docs/02-Research/28) — if applicable
- [ ] AI output goes through guardrails (docs/07-AI/105) — if applicable
- [ ] Continuity invariants respected (no duplicate/orphan child; append-only) — if applicable
- [ ] RBAC / audit / access rules respected — if applicable
- [ ] Accessibility (WCAG 2.2 AA) considered (docs/03-UX/40)

## Docs
- [ ] Relevant docs updated / in sync

## ADR
- [ ] ADR added/updated if architecturally significant (docs/ADR/)

## Screenshots / Notes (optional)
```

## 4. Usage Rules
- Fill all applicable sections; N/A where truly not applicable.
- Safety-critical changes require the relevant checklist items ticked + heightened review (`141` BR-3).
- Reviewers verify the checklist, not just the code.

## 5. Business Rules
- BR-1 Every MR uses this template.
- BR-2 Safety/privacy checklist completed honestly; false ticks are a process violation.
- BR-3 Docs-in-sync + ADR-if-significant confirmed.
- BR-4 Testing described and linked.
- BR-5 Reviewers verify the checklist as part of approval.

## 6. Edge Cases
Docs-only MR (checklist mostly N/A); hotfix (expedited but checklist still applies); large MR (encourage splitting).

## 7. Acceptance Criteria
- [x] Template with summary/changes/type/testing/safety/docs/ADR sections.
- [x] Safety-critical checklist embedded.
- [x] Reviewer-verifies-checklist rule.

## 8. Future Expansion
Repo-level `.gitlab/merge_request_templates/`; automated checklist enforcement; CODEOWNERS auto-review.

## 9. Dependencies
`141`, `144`, `146`, `docs/02-Research/28`, `docs/07-AI/105`, `docs/03-UX/40`.

## 10. Open Questions
- OQ-1 Enforce checklist via CI bot?

## 11. Risks
- R-1 Rubber-stamped checklists. Mitigation: BR-2/BR-5 honest completion + reviewer verification.
