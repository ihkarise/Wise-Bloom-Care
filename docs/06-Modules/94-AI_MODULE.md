# 94 — AI Assistant Module

| Field | Value |
|---|---|
| Document | AI Assistant Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect / Clinical Informatics |
| Last Updated | 2026-07-22 |
| Related | `docs/07-AI/100-AI_ARCHITECTURE.md`, `103-RAG_DESIGN.md`, `105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
The educational AI assistant (v2): it explains, educates, summarises, surfaces trends and missing data, and generates reminders and visit summaries — grounded in the knowledge base and strictly guardrailed. It **never** diagnoses, prescribes, or makes emergency decisions.

## 2. Goals
Helpful, calm, sourced educational assistance; report/visit explanation; trend/missing-data surfacing — all safe by construction (guardrails, content typing).

## 3. Scope
Owns: AI request handling + AI logs. Uses: knowledge base (RAG), module data (read), guardrails. Out: diagnosis, prescription, emergency decisions, treatment planning (NG-1..NG-5).

## 4. Functional Requirements
- FR-1 Explain reports and concepts in educational, sourced language (typed Educational + clinician-review).
- FR-2 Summarise visits and generate visit-prep summaries.
- FR-3 Surface trends and **missing data** (e.g., "no BP logged recently").
- FR-4 Generate gentle reminders/summaries.
- FR-5 Refuse diagnosis/prescription requests; redirect to education + clinician-review; surface curated emergency guidance if red-flags are described.

## 5. Non-Functional Requirements
Guardrails enforced technically (`docs/07-AI/105`); every output typed + sourced; no PHI leakage to third parties beyond necessity + consent; adversarial-tested (`docs/10-Testing/135`).

## 6. Architecture
AIService orchestrates: retrieve from KB (RAG, `docs/07-AI/103`) → generate → **post-process through guardrails** (typing, prohibitions, source attach) → return. AI logs (no PHI beyond necessity) retained per policy. Full design: `docs/07-AI/100`.

## 7. User Flow
User asks / taps "explain" → assistant returns educational, sourced answer + clinician-review; diagnosis asks are redirected safely (`docs/03-UX/31` J3).

## 8. Data Model
AI request/response logs (guarded, minimal); reads other modules' data with authorisation.

## 9. Business Rules
- BR-1 Every AI output touching medical judgement includes clinician-review and never diagnoses/prescribes (Vision BR-V4; NG-1/NG-2).
- BR-2 Output is post-processed through guardrails before display (`docs/07-AI/105`).
- BR-3 Output is typed (educational/clinical/emergency) + sourced from the KB (`docs/02-Research/28`).
- BR-4 Emergency content only from the curated set; never generated (`docs/02-Research/28` BR-4).
- BR-5 AI never auto-acts on data (e.g., never changes a record or a medicine).

## 10. Edge Cases
"Do I have X?" (refuse diagnosis → educate + clinician-review; surface curated emergency card if red-flags described); ambiguous/unsafe prompt (default Educational + clinician-review); low KB coverage (say "not enough information"; never fabricate — `docs/02-Research/27` BR-4); non-English input (future localisation).

## 11. Acceptance Criteria
- [x] Explain/summarise/surface-trends/reminders specified.
- [x] Guardrail post-processing + typing + sourcing enforced.
- [x] Refusal/redirect behaviour for diagnosis/prescription; curated-only emergencies.

## 12. Future Expansion
Voice interface (`docs/07-AI/107`); proactive (guarded) insights; personalised summaries; multilingual; clinician-facing summaries.

## 13. Dependencies
`docs/07-AI/100`, `101`, `102`, `103`, `105`, `docs/02-Research/28`, `docs/10-Testing/135`.

## 14. Open Questions
- OQ-1 AI in v1 (Should) vs v2 — depends on guardrail readiness (`docs/01-Product/10` OQ-4).
- OQ-2 AI provider selection + data-processing agreement.

## 15. Risks
- R-1 Prescriptive/diagnostic output. Mitigation: BR-1/BR-2 guardrails + adversarial tests (RSK-11).
- R-2 Fabricated facts. Mitigation: RAG grounding + BR-3 sourcing + "not enough info".
