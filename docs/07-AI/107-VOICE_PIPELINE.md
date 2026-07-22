# 107 — Voice Pipeline

| Field | Value |
|---|---|
| Document | Voice Pipeline Design |
| Status | Approved (Draft 1.0 — Future/v3) |
| Version | 1.0 |
| Owner | AI Systems Architect |
| Last Updated | 2026-07-22 |
| Related | `100-AI_ARCHITECTURE.md`, `105-GUARDRAILS.md`, `docs/03-UX/40-ACCESSIBILITY.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the (future/v3) voice interface enabling hands-free logging and educational Q&A — valuable for a tired, one-handed parent. Voice interactions are subject to the **same guardrails, typing, and privacy rules** as text AI; nothing about voice relaxes safety.

## 2. Scope
Speech-to-text (STT) input for logging/queries and text-to-speech (TTS) output for educational responses. Subject to `105` guardrails and `100` architecture. This is a future capability; the design ensures the architecture doesn't preclude it.

## 3. Principles
- Same safety everywhere: voice output passes identical guardrails (`105`); never diagnoses/prescribes/decides emergencies.
- Accessibility win: voice improves access (one-handed, low-literacy, visual impairment) (`docs/03-UX/40`), but must have non-voice equivalents.
- Privacy: audio is sensitive; process minimally with consent + DPA.
- Confirmation for data entry: voice-logged values are confirmed before saving (like OCR).

## 4. Pipeline
```
User speech
   │
1. STT → text (private, consented)
   │
2. Intent: log data | ask question
   │  ├─ log → parse to candidate values → USER CONFIRM → save (73 validation)
   │  └─ ask → RAG + generate + GUARDRAILS (100, 103, 105) → typed/sourced answer
   │
3. TTS → spoken educational answer (+ on-screen text + sources)
```

## 5. Data Entry via Voice
- Voice-captured values are candidates; confirmed before entering the record (parallels OCR `106` BR-1).
- Validation/plausibility applied (`docs/05-Data/73`).

## 6. Q&A via Voice
- Routed through the standard AI pipeline (RAG + guardrails); spoken answers are the guardrailed, typed, sourced text; emergency guidance is curated-only and directs to care.
- On-screen text + source citations accompany spoken answers (accessibility + transparency).

## 7. Privacy & Security
- Audio consent + DPA; minimal retention; no PHI in logs; access-controlled + audited (`docs/09-Security/126`).
- On-device STT considered for privacy (future).

## 8. Business Rules
- BR-1 Voice output passes the same guardrails as text (`105`); no relaxation.
- BR-2 Voice-entered values are confirmed before saving.
- BR-3 Audio is consented, minimally retained, and access-controlled/audited.
- BR-4 Spoken answers are typed + sourced; emergencies curated-only.
- BR-5 Non-voice equivalents always available (accessibility; no voice-only critical path).

## 9. Edge Cases
Misrecognition (confirm before save; easy correction); noisy environments; accents/dialects/languages (coverage limits; fallback to typing); privacy in shared spaces (user awareness); provider failure (fallback to text).

## 10. Acceptance Criteria
- [x] STT/TTS pipeline with guardrail parity and confirmation-before-save.
- [x] Privacy/consent + accessibility (non-voice equivalents) specified.
- [x] Q&A routed through standard AI guardrails; curated emergencies.

## 11. Future Expansion
Multilingual voice, on-device processing, wake-word hands-free logging, voice accessibility enhancements, caregiver voice profiles.

## 12. Dependencies
`100`, `103`, `105`, `106`, `docs/03-UX/40`, `docs/05-Data/73`, `docs/09-Security/126`, `docs/02-Research/28`.

## 13. Open Questions
- OQ-1 STT/TTS provider (privacy-compatible) + DPA.
- OQ-2 On-device vs. cloud processing.
- OQ-3 First languages supported.

## 14. Risks
- R-1 Unsafe spoken medical output. Mitigation: BR-1/BR-4 guardrail parity.
- R-2 Audio privacy exposure. Mitigation: BR-3 consent/minimal/audited.
