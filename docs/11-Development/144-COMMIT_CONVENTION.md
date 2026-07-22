# 144 — Commit Convention

| Field | Value |
|---|---|
| Document | Commit Convention |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `142-GIT_WORKFLOW.md`, `145-PR_TEMPLATE.md`, `147-CHANGELOG.md` |

---

## 1. Purpose
Defines a consistent commit-message convention so history is readable, searchable, and drives the changelog. Uses a Conventional-Commits-style format.

## 2. Scope
Commit message format and rules. Changelog generation: `147`.

## 3. Format
```
<type>(<scope>): <short summary>

<body — the why, context, references to doc IDs / requirements>

<footer — breaking changes, references>
```

## 4. Types
| Type | Use |
|---|---|
| feat | new feature |
| fix | bug fix |
| docs | documentation only |
| refactor | non-behavioural code change |
| test | tests |
| chore | tooling/build/deps |
| perf | performance |
| security | security fix/hardening |
| content | knowledge-base/medical content (typed + sourced) |

## 5. Scope
The area/module (e.g., `vitals`, `delivery`, `07-AI`, `docs`). Encourages traceability to modules/docs.

## 6. Rules
- Imperative, present tense ("add", not "added").
- Short summary ≤ ~72 chars; body explains *why* and references docs/requirements.
- Breaking changes flagged in footer (`BREAKING CHANGE:`).
- No secrets/PHI in messages.
- Content commits reference the `source_ref`/research doc for medical changes.

## 7. Examples
```
feat(delivery): auto-create linked child on delivery event

Implements FR-13 / Vision BR-V2. Idempotent; immutable mother link.
Refs docs/06-Modules/88, docs/08-Timeline/111.
```
```
content(pregnancy): update week20 education per WHO source

Refs docs/02-Research/27 (S-WHO-ANC). Typed Educational + source_ref.
```

## 8. Business Rules
- BR-1 Commits follow `<type>(<scope>): summary` with an explanatory body.
- BR-2 Imperative mood; ≤~72-char summary.
- BR-3 Breaking changes flagged in footer.
- BR-4 No secrets/PHI in messages.
- BR-5 Medical-content commits reference their source.

## 9. Edge Cases
Multi-area changes (prefer splitting; else pick primary scope); revert commits (clear "revert:"); WIP (not on protected branches).

## 10. Acceptance Criteria
- [x] Format, types, scope, and rules defined with examples.
- [x] No-secrets/PHI + source-reference rules stated.

## 11. Future Expansion
Automated changelog from commits; commit linting in CI; commit templates.

## 12. Dependencies
`142`, `145`, `147`.

## 13. Open Questions
- OQ-1 Commit-lint tooling adoption.

## 14. Risks
- R-1 Unreadable history / poor changelog. Mitigation: BR-1/BR-2 convention.
