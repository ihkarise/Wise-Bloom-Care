# 132 — Manual & Exploratory Testing

| Field | Value |
|---|---|
| Document | Manual & Exploratory Testing |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect |
| Last Updated | 2026-07-22 |
| Related | `130-TEST_PLAN.md`, `133-UAT.md`, `docs/03-UX/40-ACCESSIBILITY.md` |

---

## 1. Purpose
Defines manual and exploratory testing — the human-judgement checks for UX quality, emotional tone, edge cases, and compassion flows that automated tests can't fully assess (e.g., does the loss path *feel* compassionate? Does the dashboard *feel* calm?).

## 2. Scope
Manual test charters, exploratory sessions, and heuristic reviews (calm, continuity, safety). Automated cases: `131`; UAT: `133`.

## 3. Exploratory Charters
| Charter | Goal |
|---|---|
| Calm audit | Does each screen lower, not raise, anxiety? (Manifesto "test of a feature") |
| Continuity audit | Does the record ever *feel* like it resets, esp. at delivery? |
| Compassion audit | Do loss/complication flows feel humane; no baby prompts after loss? |
| Content-typing audit | Are educational/clinical/emergency clearly distinct, never mixed? |
| One-handed/tired-parent audit | Can key tasks be done one-handed, quickly, sleep-deprived? |
| Forgiving-entry audit | Can users progress with partial/unknown data (P9)? |

## 4. Heuristic Review (against principles)
Reviewers check screens against Product Principles (`docs/00-Vision/03`): one-record continuity, educate-not-diagnose, calm-over-clever, privacy, single-source-of-truth, accessibility. A principle violation is a defect.

## 5. Manual Edge-Case Sessions
Loss path; multiple births; twins on the dashboard; preterm corrected age; retrospective onboarding; revoked caregiver mid-use; overdue pile-up; sparse data; sensitive report results; postpartum mental-health red-flag routing (curated emergency).

## 6. Accessibility Manual Passes
Screen-reader walkthroughs of core flows; keyboard-only navigation; 200% zoom reflow; color-contrast + non-color-cue checks (`docs/03-UX/40`). Complements automated a11y checks.

## 7. Process
- Time-boxed exploratory sessions with charters; findings logged with severity.
- Compassion/calm findings treated as first-class defects (brand-critical).
- Manual passes required before each release (`docs/01-Product/16`).

## 8. Business Rules
- BR-1 Calm, continuity, and compassion audits are mandatory pre-release.
- BR-2 Principle violations are defects.
- BR-3 Manual accessibility passes on core flows each release.
- BR-4 Edge/compassion flows (loss, twins, preterm) manually verified.
- BR-5 Synthetic data only.

## 9. Edge Cases
Emotionally sensitive flows require reviewers briefed for compassion; diverse-device manual testing; low-connectivity manual checks.

## 10. Acceptance Criteria
- [x] Exploratory charters + heuristic review defined.
- [x] Manual edge/compassion + accessibility passes specified.
- [x] Pre-release manual gate stated.

## 11. Future Expansion
Usability studies with real parents; moderated compassion reviews with clinicians; device lab; diary studies.

## 12. Dependencies
`130`, `133`, `docs/00-Vision/03`, `docs/03-UX/40`, `docs/06-Modules/88`.

## 13. Open Questions
- OQ-1 Who conducts compassion review (clinician + UX).
- OQ-2 Device/browser matrix for manual passes.

## 14. Risks
- R-1 Emotional harm missed by automation. Mitigation: BR-1 compassion audits.
- R-2 Accessibility gaps. Mitigation: BR-3 manual a11y passes.
