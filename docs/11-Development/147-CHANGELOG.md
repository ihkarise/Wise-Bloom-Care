# 147 — Changelog

| Field | Value |
|---|---|
| Document | Changelog Policy & Log |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `144-COMMIT_CONVENTION.md`, `docs/01-Product/16-RELEASE_PLAN.md`, `docs/05-Data/77-VERSIONING.md` |

---

## 1. Purpose
Defines the changelog policy — how notable changes are recorded per release — and holds the running log. It gives a human-readable history of what changed, aligned with versioning (`docs/01-Product/16`) and the "Keep a Changelog"-style format.

## 2. Scope
Changelog format, policy, and the log itself. Commit format (its source): `144`; versioning: `docs/01-Product/16`, `docs/05-Data/77`.

## 3. Format
Per release version (newest first), grouped by change type:
- **Added** (feat), **Changed**, **Fixed** (fix), **Security**, **Content** (KB/medical), **Deprecated**, **Removed**.
- Each entry: concise, user-meaningful, referencing requirement/doc where useful.

## 4. Policy
- Every release updates the changelog before tagging (`docs/01-Product/16` §5).
- Notable changes (features, fixes, security, content) are recorded; trivial chores may be omitted.
- Security-relevant changes noted appropriately (without leaking exploit detail).
- Content/knowledge-base version changes recorded (pins the KB version shipped).

## 5. Running Log

### [Unreleased]
- **Added (docs):** Complete architecture & product documentation set across `docs/00`–`13`, `docs/ADR/`, and the `knowledge-base/` content — vision, product, research (WHO/ACOG/FIGO/NICE/CDC/immunization, cited), UX, architecture, data, modules, AI, timeline, security, testing, development, operations, future.
- **Added (content):** Knowledge-base pregnancy week and category content, grounded in cited sources.

_(Product/code releases will be logged here as v1.0 onward per `docs/01-Product/16`.)_

## 6. Business Rules
- BR-1 The changelog is updated before every release tag.
- BR-2 Entries are grouped by type and user-meaningful.
- BR-3 Security entries avoid leaking exploit detail.
- BR-4 Content/KB version changes are recorded (release pins KB version).
- BR-5 Changelog aligns with the version tags (`docs/01-Product/16`).

## 7. Edge Cases
Hotfix releases (patch entries); reverts (noted); pre-1.0 (Unreleased section); doc-only vs. product releases (documentation set is versioned/pinned per release).

## 8. Acceptance Criteria
- [x] Format + policy defined; running log started.
- [x] Release-tag + KB-version alignment rules.

## 9. Future Expansion
Automated changelog generation from Conventional Commits (`144`); per-component changelogs; user-facing "what's new".

## 10. Dependencies
`144`, `docs/01-Product/16`, `docs/05-Data/77`, `docs/07-AI/101`.

## 11. Open Questions
- OQ-1 Auto-generate from commits vs. curated.

## 12. Risks
- R-1 Untracked changes. Mitigation: BR-1 pre-release update.
