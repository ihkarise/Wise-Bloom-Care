# 93 — Journal Module

| Field | Value |
|---|---|
| Document | Journal Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect / Enterprise Architect |
| Last Updated | 2026-07-22 |
| Related | `89-BABY_MODULE.md`, `docs/09-Security/123-ACCESS_CONTROL.md`, `docs/04-Architecture/54-GOOGLE_SHEETS_SCHEMA.md` |

---

## 1. Purpose
A private space for notes, photos, and meaningful moments across the journey (pregnancy and child). It adds warmth and memory-keeping to the continuous record, integrated with the timeline.

## 2. Goals
Easy capture of notes/photos/moments; private by default; timeline integration; emotionally warm.

## 3. Scope
Owns: `journal` entries + media references. Uses: private media storage; timeline. Out: medical interpretation of journal content (it's personal, not clinical).

## 4. Functional Requirements
- FR-1 Create journal entries (text + optional media).
- FR-2 Attach to the timeline by date/subject (pregnancy or child).
- FR-3 Private by default; sharing only via explicit family access (`96`).
- FR-4 View/edit/delete (versioned soft-delete) entries.

## 5. Non-Functional Requirements
Private/secure media (private Drive, backend-mediated); accessible; warm UX; low friction.

## 6. Architecture
JournalService owns entries; media as private `media_ref` (`docs/04-Architecture/54` §6); timeline events; access authorised + audited.

## 7. User Flow
Capture a moment → optionally add a photo → it appears on the timeline; revisit memories (`docs/03-UX/31` J5).

## 8. Data Model
`journal(journal_id, subject_id, body, media_ref, created_at, version)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Journal is private by default; shared only via explicit, revocable family access.
- BR-2 Media stored privately; never public links; access audited.
- BR-3 Deletion is versioned soft-delete (history preserved) unless erasure requested (`docs/05-Data/77`, `74`).
- BR-4 No medical interpretation of journal content.

## 10. Edge Cases
Large/many media (limits, Drive); caregiver visibility (scoped); loss path (memory-keeping handled with compassion; user controls retention); export includes journal (`docs/05-Data/76`).

## 11. Acceptance Criteria
- [x] Notes + media entries; timeline integration.
- [x] Private-by-default; secure media; audited.
- [x] Versioned soft-delete; export-inclusive.

## 12. Future Expansion
Rich media (video), milestone-linked memories, shareable (opt-in) keepsakes, printable memory book, on-device drafts (offline).

## 13. Dependencies
`89`, `96`, `docs/04-Architecture/54`, `docs/09-Security/123`, `docs/05-Data/70`, `74`, `76`, `77`.

## 14. Open Questions
- OQ-1 Media type/size limits.
- OQ-2 Keepsake/export format.

## 15. Risks
- R-1 Media exposure. Mitigation: BR-2 private/audited.
- R-2 Loss-path insensitivity. Mitigation: §10 compassionate handling.
