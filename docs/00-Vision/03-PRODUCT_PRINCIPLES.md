# 03 — Product Principles

| Field | Value |
|---|---|
| Document | Product Principles |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `00-VISION.md`, `01-PRODUCT_MANIFESTO.md`, `docs/03-UX/35-DESIGN_SYSTEM.md`, `docs/11-Development/146-DEFINITION_OF_DONE.md` |

---

## 1. Purpose

Product Principles turn the Vision and Manifesto into **decision rules**. Where the manifesto is belief, this document is the operational rulebook a designer or engineer consults when two good options conflict. Each principle is stated, justified, given a "therefore" consequence, and paired with an anti-pattern so it is testable in review.

## 2. Scope

Applies to all product, UX, data, and engineering decisions. Principles are ranked: when two principles conflict, the lower-numbered one wins.

## 3. The Principles (in priority order)

### P1 — One journey, one record
**Statement:** A family is a single linked record; the maternal and child timelines are two views of one graph.
**Therefore:** Never create a second profile for the same person; never fork the timeline at delivery; corrections are versioned events, not overwrites.
**Anti-pattern:** "Let's just make a new baby account and copy the birth data over."

### P2 — Educate, never diagnose
**Statement:** The product informs and contextualises; it never diagnoses, prescribes, or makes emergency decisions.
**Therefore:** Every output touching medical judgement recommends clinician review; content is typed educational / clinical / emergency and never mixed.
**Anti-pattern:** A trend chart captioned "Your BP indicates preeclampsia."

### P3 — Calm over clever
**Statement:** Reducing the reader's anxiety outranks feature richness or visual novelty.
**Therefore:** Prefer reassurance, plain language, and progressive disclosure; hide alarming raw data behind clear, gentle context.
**Anti-pattern:** A red flashing badge on a value that is within normal range.

### P4 — Privacy is a feature, not a setting
**Statement:** Data is private by default; sharing is explicit, minimal, and revocable.
**Therefore:** Least-privilege access, audit every health-data read/write, no third-party data sale, ever.
**Anti-pattern:** "Share with family" on by default.

### P5 — Single source of truth
**Statement:** No duplicated data, no duplicated logic.
**Therefore:** Each fact has one authoritative home; derived values are computed, not copied; business rules live in one place.
**Anti-pattern:** Storing "weeks pregnant" as a field that can drift from the due date it derives from.

### P6 — Evidence or nothing
**Statement:** Medical content is grounded in recognised authorities; we never invent facts.
**Therefore:** Cite WHO/ACOG/FIGO/NICE/CDC; mark assumptions explicitly; separate fact from design decision.
**Anti-pattern:** A confident number with no source.

### P7 — Design for migration
**Statement:** The storage engine is an implementation detail.
**Therefore:** The frontend depends on a stable API contract, not on Google Sheets; swapping the backend must not change component contracts.
**Anti-pattern:** A React component that reads a Google Sheet range directly.

### P8 — Mobile-first, offline-ready
**Statement:** The primary device is a phone, often on poor connectivity.
**Therefore:** Design for small screens and intermittent networks first; treat offline (future PWA) as a first-class constraint, not an afterthought.
**Anti-pattern:** A desktop-only dashboard that collapses awkwardly on mobile.

### P9 — Progressive, forgiving data entry
**Statement:** Users arrive at any point in the journey with partial information.
**Therefore:** Support retrospective entry, partial records, and "I don't know yet"; never block the timeline on a missing field.
**Anti-pattern:** Requiring the exact LMP date before any pregnancy feature works.

### P10 — Accessible to everyone
**Statement:** Health tools must work for users with disabilities and low health literacy.
**Therefore:** Meet WCAG 2.2 AA; plain language; sufficient contrast; screen-reader-complete flows (`docs/03-UX/40-ACCESSIBILITY.md`).
**Anti-pattern:** Colour as the only signal of a warning.

## 4. Applying Principles (conflict resolution)

When two principles pull in different directions, resolve by priority number (P1 highest). Document the trade-off in the relevant ADR (`docs/ADR/`). Example: P3 (calm) vs. P6 (evidence) — showing an alarming-but-true value — is resolved by keeping the true value (P6 cannot be violated) while framing it calmly and adding clinician-review guidance (satisfying P3's intent within P2).

## 5. Business Rules

- BR-1: Every PR's Definition of Done references these principles; a reviewer may block on a principle violation.
- BR-2: A principle can only be changed via an ADR, not silently.

## 6. Acceptance Criteria

- [x] Principles are ranked and individually testable (statement + therefore + anti-pattern).
- [x] A conflict-resolution rule exists.
- [x] Principles map cleanly onto Vision pillars and Manifesto refusals.

## 7. Future Expansion

New principles (e.g., for clinician-facing surfaces, or for AI personalisation) will be appended with the next available number and slotted into the priority order via ADR.

## 8. Dependencies

`00-VISION.md`, `01-PRODUCT_MANIFESTO.md`; enforced through `docs/11-Development/146-DEFINITION_OF_DONE.md` and `docs/ADR/`.

## 9. Open Questions

- OQ-1: Should P8 (offline) be a v1 hard requirement or a v2 goal? Currently v2 (see release plan).

## 10. Risks

- R-1: Principle inflation dilutes priority. Mitigation: keep the set small; changes require ADR.
