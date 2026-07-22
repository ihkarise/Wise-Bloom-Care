# 163 — Ideas

| Field | Value |
|---|---|
| Document | Ideas Parking Lot |
| Status | Living document |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `164-BACKLOG.md`, `160-V2.md`, `161-V3.md`, `docs/01-Product/17-NON_GOALS.md` |

---

## 1. Purpose
A curated parking lot for future ideas — captured so they aren't lost, but explicitly **not commitments**. Ideas are evaluated against the vision, principles, and non-goals before they ever become backlog items.

## 2. Scope
Unprioritised, non-committed ideas. Committed/queued work: `164-BACKLOG.md`.

## 3. Idea Categories

### 3.1 Experience
- Printable/keepsake memory book from the journal.
- "What's new this week" gentle digest.
- Partner/caregiver companion experience.
- Celebratory milestone moments (delightful, calm).

### 3.2 Intelligence (guarded)
- Visit-prep summaries and question suggestions (educational).
- Personalised (non-diagnostic) education based on the record.
- Missing-data nudges expanded across modules.

### 3.3 Health breadth
- Lactation/feeding support content.
- Mental-wellbeing (educational, safe) check-ins with crisis routing to curated emergencies.
- Sibling/second-pregnancy continuity views.

### 3.4 Ecosystem
- FHIR export/import for clinician portability.
- Wearable/device integrations.
- Clinician collaboration tools.

### 3.5 Access
- Additional languages/markets; localised schedules & emergency numbers.
- Low-bandwidth/offline enhancements.

## 4. Evaluation Gate (before an idea becomes backlog)
Each idea must pass:
- Aligns with the vision + principles (`docs/00-Vision`).
- Does **not** violate a non-goal (`docs/01-Product/17`).
- Passes the "test of a feature" (continuity, calm, safety, privacy, truth).
- Has a plausible, safe design (esp. for anything touching medical content/AI).

## 5. Business Rules
- BR-1 Ideas are non-committed until they pass the evaluation gate and enter the backlog.
- BR-2 No idea that violates a non-goal is promoted.
- BR-3 Medical/AI ideas require a safe, guardrailed design before promotion.

## 6. Acceptance Criteria
- [x] Ideas captured by category.
- [x] Evaluation gate defined (vision/principles/non-goals/test-of-a-feature).

## 7. Dependencies
`164`, `160`, `161`, `docs/00-Vision/*`, `docs/01-Product/17`.

## 8. Open Questions
- OQ-1 Prioritisation method for promoting ideas.

## 9. Risks
- R-1 Chasing ideas that break principles. Mitigation: BR-2/BR-3 evaluation gate.
