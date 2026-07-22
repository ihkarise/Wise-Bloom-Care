# 89 — Baby Module

| Field | Value |
|---|---|
| Document | Baby Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Healthcare Software Architect / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `88-DELIVERY_MODULE.md`, `90-GROWTH_MODULE.md`, `91-MILESTONES_MODULE.md`, `92-VACCINATION_MODULE.md`, `93-JOURNAL_MODULE.md` |

---

## 1. Purpose
Owns the child record and the child's continuous timeline (linked permanently to the mother), plus feeding and sleep logging. It is the parent context for growth, milestones, vaccination, and journal — the child half of the one continuous journey.

## 2. Goals
Maintain the child profile and its continuous, linked timeline; low-friction feeding/sleep logging; anchor child-scoped modules; support multiple children.

## 3. Scope
Owns: `child_records` (post-creation attributes), feeding/sleep entries, child timeline view. Uses: growth/milestones/vaccination/journal (child sub-modules). Out: child creation (owned solely by Delivery `88`).

## 4. Functional Requirements
- FR-1 Present the child profile (created by delivery; linked to mother).
- FR-2 Show the child's continuous timeline as part of the one family record.
- FR-3 Log feeding (type/time) and sleep (start/end) simply, one-handed.
- FR-4 Support multiple children (selectable sub-contexts), each linked to the mother.
- FR-5 Surface newborn/infant educational content by (corrected) age (typed, sourced).

## 5. Non-Functional Requirements
Ultra-low-friction logging (tired parent); accessible; continuity preserved; calm.

## 6. Architecture
ChildService owns child attributes + feeding/sleep; TimelineService provides the continuous stream; content via ContentService (`knowledge-base/newborn/`).

## 7. User Flow
After delivery → baby profile present → log feeding/sleep in seconds → view growth/milestones/vaccination → journal moments (`docs/03-UX/31` J5).

## 8. Data Model
`child_records(... mother_id immutable ...)`; `feeding(id, child_id, type, at)`; `sleep(id, child_id, start, end)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Child records are never created here (only by Delivery `88`); this module reads/updates non-link attributes.
- BR-2 `mother_id` immutable; child timeline is part of the single record (no reset).
- BR-3 Feeding/sleep logging is fast and forgiving (partial data allowed).
- BR-4 Child content is typed + sourced (corrected-age aware for preterm).
- BR-5 Multiple children are independent sub-contexts under one mother.

## 10. Edge Cases
Preterm (corrected age for content); multiple children (clear switching); NICU/irregular early data; caregiver-scoped access; sparse logging (no fake trends).

## 11. Acceptance Criteria
- [x] Linked child profile + continuous timeline.
- [x] Feeding/sleep logging; multi-child support.
- [x] Corrected-age-aware content; creation-only-by-delivery enforced.

## 12. Future Expansion
Richer feeding/sleep analytics (surfacing); growth-of-siblings comparison (careful, non-competitive); toddler+ stages; wearable/device logging.

## 13. Dependencies
`88`, `90`, `91`, `92`, `93`, `knowledge-base/newborn/`, `docs/05-Data/70`, `71`.

## 14. Open Questions
- OQ-1 Feeding/sleep as sub-features vs. own modules (`docs/01-Product/13` OQ-2).
- OQ-2 Multi-child navigation pattern.

## 15. Risks
- R-1 Accidental duplicate child creation. Mitigation: BR-1 (delivery-only).
- R-2 High-friction logging for tired parents. Mitigation: BR-3 low-friction design.
