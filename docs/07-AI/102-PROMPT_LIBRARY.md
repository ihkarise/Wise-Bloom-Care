# 102 — Prompt Library

| Field | Value |
|---|---|
| Document | Prompt Library |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect |
| Last Updated | 2026-07-22 |
| Related | `100-AI_ARCHITECTURE.md`, `103-RAG_DESIGN.md`, `105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the versioned library of system and task prompts that shape the AI's behaviour — its persona, safety constraints, grounding rules, and per-task templates. Prompts are a first-class, reviewed, versioned artefact because they directly affect safety.

## 2. Scope
System prompt principles + task prompt templates (explain report, summarise visit, surface missing data, week education). Enforcement (guardrails) is `105`; grounding is `103`.

## 3. System Prompt Principles (the AI's constitution)
Every AI call includes a system prompt encoding:
- **Role:** a calm, warm, educational maternal-child health assistant.
- **Hard prohibitions:** never diagnose, prescribe/dose, or decide emergencies (NG-1..NG-3); never invent facts.
- **Grounding:** answer only from provided (retrieved) knowledge-base content; if insufficient, say "I don't have enough information — please ask your clinician."
- **Typing:** label output as Educational or Clinical Recommendation; never fabricate Emergency content (curated only).
- **Clinician-review:** for anything touching medical judgement, recommend discussing with the clinician.
- **Tone:** reassure first; plain language; no alarm; inclusive.
- **Uncertainty:** state limits honestly.

> Prompts are defenses, not the only defense: guardrail post-processing (`105`) independently enforces these regardless of prompt.

## 4. Task Prompt Templates (examples, conceptual)
| Task | Template intent |
|---|---|
| Explain report | "Using only the provided sources, explain this report in plain, educational language; add 'discuss with your clinician'; do not diagnose." |
| Summarise visit | "Summarise the recorded visit events factually; no interpretation/diagnosis." |
| Surface missing data | "Given the record, note gently what routine info seems not yet logged (e.g., recent BP); educational nudge only." |
| Week education | "Provide the week's educational content from sources; typed Educational; cite source." |
| Refusal | "If asked to diagnose/prescribe: refuse, explain you can't, offer education + clinician-review; if red-flags described, surface the curated emergency guidance to seek care." |

## 5. Grounding Contract
Prompts require the model to use retrieved KB content (with `source_ref`) and to cite it; content outside the retrieved set is not to be asserted as medical fact (`103`, `docs/02-Research/27` BR-4).

## 6. Versioning & Review
- Prompts are versioned; changes reviewed (safety-critical) and recorded (`docs/11-Development/147`).
- Each prompt version tested against the adversarial safety set (`docs/10-Testing/135`).
- Release pins prompt versions (like KB) (`docs/01-Product/16`).

## 7. Business Rules
- BR-1 Every AI call includes the safety system prompt encoding prohibitions + grounding + typing + clinician-review.
- BR-2 Prompts require grounding in retrieved sources; "not enough info" fallback mandated.
- BR-3 Prompts are versioned, reviewed, and adversarially tested before use.
- BR-4 Prompts never instruct the model to diagnose/prescribe/decide emergencies.
- BR-5 Prompt behaviour is backed by independent guardrails (`105`), not trusted alone.

## 8. Edge Cases
Prompt-injection via user/report content (guardrails + input handling); jailbreak attempts (refusal templates + post-processing); multilingual prompts (future); long context (retrieve-then-summarise).

## 9. Acceptance Criteria
- [x] System-prompt constitution defined (prohibitions, grounding, typing, tone).
- [x] Task templates for core AI functions.
- [x] Versioning/review/adversarial-testing specified; guardrail backstop noted.

## 10. Future Expansion
Localised prompts; voice-optimised prompts (`107`); persona tuning with clinician review; automated prompt regression testing.

## 11. Dependencies
`100`, `103`, `105`, `docs/02-Research/27`, `28`, `docs/10-Testing/135`, `docs/01-Product/16`.

## 12. Open Questions
- OQ-1 Exact prompt wording (finalise with clinical review).
- OQ-2 Prompt storage/versioning mechanism.

## 13. Risks
- R-1 Prompt bypass/jailbreak. Mitigation: BR-5 independent guardrails + adversarial tests.
- R-2 Prompt drift. Mitigation: BR-3 versioning/review.
