# 106 — OCR Pipeline

| Field | Value |
|---|---|
| Document | OCR Pipeline Design |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/06-Modules/84-REPORTS_MODULE.md`, `105-GUARDRAILS.md`, `docs/05-Data/73-VALIDATION_RULES.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the (v2) OCR pipeline that extracts text/structured values from uploaded lab reports so they can be contextualised educationally and (optionally) charted. Extracted values are **always user-reviewed and never auto-trusted or auto-acted on** — OCR errors must never silently enter the health record.

## 2. Scope
OCR of report images/PDFs into text/structured candidate values, with review. Report storage/viewing: `84`; AI explanation: `94`/`100`; guardrails: `105`.

## 3. Principles
- Assist, don't decide: OCR proposes; the user confirms.
- Never auto-trust: extracted medical values are candidates until the user reviews/corrects them.
- Privacy: process minimally; images are sensitive (private Drive, `docs/04-Architecture/54`).
- No diagnosis: extraction + educational explanation only (`docs/02-Research/28`).

## 4. Pipeline
```
Uploaded report (image/PDF, private)
   │
1. Pre-process (deskew, denoise) 
   │
2. OCR → raw text
   │
3. Structure extraction → candidate fields (test, value, unit, range) with confidence
   │
4. Validation (73) → plausibility flags on candidates
   │
5. USER REVIEW → confirm/correct/discard (nothing saved to record without confirmation)
   │
6. On confirm → stored as user-reviewed values; optional educational explanation (94, guardrailed)
```

## 5. Confidence & Review
- Each candidate carries a confidence; low-confidence flagged prominently.
- The original image remains the source of truth (human-visible); extracted values are clearly marked as OCR candidates until confirmed.
- Implausible candidates flagged by validation (`docs/05-Data/73`) for correction.

## 6. Privacy & Security
- Images are highly sensitive; kept private; sent to OCR provider only as necessary with consent + DPA (`docs/09-Security/126`, `100` §6).
- No PHI in logs; results access-controlled + audited.

## 7. Business Rules
- BR-1 Extracted values are candidates; nothing enters the record without explicit user confirmation.
- BR-2 The original report image is the visible source of truth.
- BR-3 Extraction never diagnoses; any explanation is educational + clinician-review (`105`).
- BR-4 Validation/plausibility applied to candidates before/at review.
- BR-5 OCR processing respects privacy (consent/DPA, minimal data, audited).

## 8. Edge Cases
Poor scans/handwriting (low confidence; user enters manually); multi-page/multi-panel reports; non-standard units/formats (normalise + confirm); unsupported languages (future); provider failure (manual entry fallback — report still stored/viewable, `84`).

## 9. Acceptance Criteria
- [x] Pipeline with mandatory user review before any value is saved.
- [x] Confidence/validation on candidates; image as source of truth.
- [x] Privacy/consent + non-diagnostic guardrails.

## 10. Future Expansion
Structured lab trends from confirmed values (educational); ultrasound metric extraction; multilingual OCR; on-device OCR for privacy.

## 11. Dependencies
`84`, `94`, `100`, `105`, `docs/05-Data/73`, `docs/04-Architecture/54`, `docs/09-Security/126`, `docs/02-Research/28`.

## 12. Open Questions
- OQ-1 OCR provider (privacy-compatible) + DPA.
- OQ-2 Which report types/lab panels to support first.

## 13. Risks
- R-1 Wrong values entering the record. Mitigation: BR-1/BR-2 mandatory review + image source-of-truth (RSK-13).
- R-2 Image privacy exposure. Mitigation: BR-5 private processing/audit.
