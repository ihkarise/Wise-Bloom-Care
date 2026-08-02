## Issue Review

Pre-merge review of every GitHub issue currently open in this repository, per the Sprint 01 release-manager review. Scope: repository hygiene and process correction only — no new issues were created, no issues were closed, and no priority was changed (none was found to be objectively wrong).

| Field | Value |
| --- | --- |
| Reviewed | All open issues in the repository |
| Issues reviewed | 11 (#5-#15) |
| Duplicates found | 0 |
| Duplicates removed | 0 |
| Overlaps found | 0 |
| Issues needing edits | 0 |
| New issues created | 0 |
| Issues closed | 0 |
| Priorities changed | 0 |

### Method

Each issue was opened and checked for: a clear title, a description that cites its source document or code location, a priority label (P1/P2/P3), category labels, and explicit acceptance criteria. #5 and #14 were opened and read in full as representative samples across the priority range; the remaining nine were verified against the issues list (title, priority, and labels) and cross-checked against `ISSUES_TO_CREATE.md` and `SPRINT_01_FINAL_REVIEW.md` section 9, which both list the same 11 items with the same priorities. No milestones exist yet in the repository (the Milestones page is empty), so the milestone column below reflects the milestone named in the source documents, not one actually applied to the issue in GitHub — this is a known, already-documented post-merge action, not a defect.

### Issue List

| # | Title | Priority | Labels | Milestone (intended, not yet applied) | Recommendation |
| --- | --- | --- | --- | --- | --- |
| #5 | Equalise PBKDF2 timing on the unknown-email login path | P1 | backend, security, sprint-01-followup | Hardening | No action needed. Title, description, and acceptance criteria are clear and verified in full; priority is appropriate for a security anti-enumeration gap. |
| #6 | Compensating rollback for the non-transactional registration flow | P1 | backend, data-integrity, sprint-01-followup | Sprint 02 | No action needed. Priority and labels match the data-integrity risk described in SPRINT_01_PATCH_REPORT.md and the release notes. |
| #7 | Back the rate limiter with CacheService so limits survive GAS invocations | P1 | backend, security, sprint-01-followup | Hardening | No action needed. Consistent with the "effectively unthrottled once deployed" risk called out in the release notes and final review. |
| #8 | Move the bearer session out of localStorage when the deployment model allows | P2 | architecture, frontend, security | v2 - Migration | No action needed. Correctly scoped as blocked on the GAS deployment model rather than on code, hence P2 not P1. |
| #9 | Serialise Sheets writes behind LockService | P2 | architecture, backend, data-integrity | Hardening | No action needed. Matches the documented gap between the architecture doc's description and the adapter's actual (unserialised) behaviour. |
| #10 | Wire automated accessibility checks into CI | P2 | accessibility, ci, sprint-01-followup, testing | Hardening | No action needed. |
| #11 | Add test-coverage measurement to CI | P2 | ci, testing | Hardening | No action needed. |
| #12 | Generate OpenAPI / JSON Schema from the API contract | P3 | api-contract, tooling | Sprint 03 | No action needed. Correctly low priority — the contract is hand-written but internally consistent; this is tooling, not a defect. |
| #13 | Type-check the shared config package | P3 | ci, sprint-01-followup, tooling | Sprint 02 | No action needed. |
| #14 | Lint Astro files | P3 | frontend, tooling | Sprint 02 | No action needed. Read in full — description, rationale, and three concrete acceptance criteria are all present. |
| #15 | Give the landing page a route into the product | P3 | frontend, sprint-01-followup, ux | Sprint 02 | No action needed. Correctly classified as product/UX polish, not a release blocker. |

### Duplicate and Overlap Check

No duplicate titles, descriptions, or acceptance criteria were found across the 11 issues. Each issue maps to exactly one of the eleven deferred items enumerated in `ISSUES_TO_CREATE.md`, and issue numbers #5-#15 account for all eleven with no gaps and no repeats. The five P1/P2 security and data-integrity issues (#5-#9) are related in subject area (all stem from the GAS deployment model or the Sheets-as-database constraint) but each addresses a distinct, independently fixable defect — this is legitimate topical clustering, not overlap.

### Priority Sanity Check

Priorities were cross-checked against the severity language used in `SPRINT_01_FINAL_REVIEW.md` sections 6-7 (Security Review, Technical Debt). The three P1 issues (#5, #6, #7) are exactly the three items that report identifies as the two worth doing first plus the one with the largest blast radius if a registration fails mid-flow; the P2 issues are all "medium severity, documented trade-off"; the P3 issues are all tooling/polish with no security or data-integrity impact. No priority was found to be objectively wrong, so none was changed, per instruction.

### Final Issue List (unchanged)

#5, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15 — all remain open, all as originally filed. No milestones were created or assigned as part of this review (milestone creation is an explicitly out-of-scope post-merge action per `SPRINT_01_FINAL_CHECKLIST.md`).
