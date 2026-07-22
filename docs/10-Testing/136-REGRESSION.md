# 136 — Regression Testing

| Field | Value |
|---|---|
| Document | Regression Testing |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect |
| Last Updated | 2026-07-22 |
| Related | `130-TEST_PLAN.md`, `131-TEST_CASES.md`, `135-SECURITY_TESTS.md`, `docs/01-Product/16-RELEASE_PLAN.md` |

---

## 1. Purpose
Defines regression testing to ensure that changes never silently break existing behaviour — especially the safety-critical properties (continuity, content typing, privacy, AI safety) that must hold across every release.

## 2. Scope
The regression suite composition, when it runs, and the guarantee that critical invariants are protected against regression. Cases: `131`; security/AI: `135`.

## 3. Regression Suite Composition
- **Critical-invariant core (always run):**
  - Delivery transition: linked child created once, immutable link, 0 duplicate/orphan (TC-DEL-*).
  - Append-only/versioned timeline (TC-TL-1).
  - Content typing: no mixed types; medical content sourced (TC-TYPE-1).
  - RBAC/privacy: caregiver scope + immediate revocation; no PHI in logs; audit completeness (`135`).
  - (v2) AI adversarial safety set (0 violations, `135`).
- **Feature regression:** representative cases per module (`131`).
- **Bug-fix regression:** every fixed defect gains a regression test to prevent recurrence.

## 4. When It Runs
- On every meaningful change (CI where feasible) for the critical-invariant core.
- Full regression before each release (`docs/01-Product/16`).
- After dependency/model/prompt updates (esp. AI safety set).

## 5. Guarantees
- The critical-invariant core must be green to merge/release; a regression here is a release blocker.
- Every production incident/defect results in a new regression test (learn-and-lock).

## 6. Business Rules
- BR-1 Critical-invariant core (continuity, typing, privacy, AI safety) runs on every change and blocks on failure.
- BR-2 Full regression passes before each release.
- BR-3 Every fixed defect adds a regression test.
- BR-4 Model/prompt/dependency changes re-run the relevant regression (incl. AI safety).
- BR-5 Synthetic data only.

## 7. Edge Cases
Flaky tests (quarantine + fix; never ignore critical-invariant flakes); large suite runtime (prioritise critical core in fast CI, full suite pre-release); environment drift (staging parity).

## 8. Acceptance Criteria
- [x] Critical-invariant core defined and gating.
- [x] Feature + bug-fix regression policy stated.
- [x] Run cadence + release-blocking rules defined.

## 9. Future Expansion
Automated CI regression, test-impact analysis, visual regression for UI, contract-test regression for the API, mutation testing.

## 10. Dependencies
`130`, `131`, `135`, `docs/01-Product/16`, `docs/06-Modules/88`.

## 11. Open Questions
- OQ-1 CI runtime budget vs. full-suite frequency.
- OQ-2 Flaky-test policy specifics.

## 12. Risks
- R-1 Silent regression of continuity/safety. Mitigation: BR-1 gating core.
- R-2 Recurring defects. Mitigation: BR-3 learn-and-lock.
