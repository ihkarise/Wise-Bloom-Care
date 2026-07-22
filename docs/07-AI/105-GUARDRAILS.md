# 105 — AI Guardrails

| Field | Value |
|---|---|
| Document | AI Guardrails |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect / Clinical Informatics / Security Architect |
| Last Updated | 2026-07-22 |
| Related | `100-AI_ARCHITECTURE.md`, `102-PROMPT_LIBRARY.md`, `103-RAG_DESIGN.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md`, `docs/10-Testing/135-SECURITY_TESTS.md` |

---

## 1. Purpose
Defines the guardrail layer that **technically enforces** the AI's safety constraints — independent of prompts — so that no AI output diagnoses, prescribes, decides emergencies, or asserts ungrounded/mistyped medical content. This is a safety-critical control implementing Non-Goals NG-1..NG-3 and the content-typing standard (`docs/02-Research/28`).

## 2. Scope
Pre- and post-processing guardrails around AI generation. Prompts (`102`) are a complementary layer; guardrails do not trust prompts alone.

## 3. Guardrail Stages
1. **Input/intent pre-check:** detect and refuse diagnosis/prescription/emergency-decision requests; sanitise for prompt-injection; block disallowed intents before generation.
2. **Grounding check:** verify the answer is supported by retrieved KB content (`103`); strip or downgrade unsupported medical claims.
3. **Prohibition check:** scan output for diagnostic/prescriptive/emergency-decision language; remove/refuse if present.
4. **Typing & sourcing:** ensure output is typed (educational/clinical) and carries `source_ref`; attach mandatory clinician-review; ensure any emergency content is from the curated set only.
5. **Safety fallback:** if checks fail and can't be safely repaired, return a safe response ("I can't help with that; here's general information / please consult your clinician").

## 4. Hard Prohibitions (enforced)
The AI output MUST NOT:
- Diagnose or imply a diagnosis (NG-1).
- Prescribe/recommend a specific drug/dose or adjust a regimen (NG-2).
- Decide whether a situation is an emergency (NG-3) — may only surface curated emergency guidance directing to care.
- Assert medical facts not grounded in the KB (`docs/02-Research/27` BR-4).
- Present design/assumption as clinical evidence.
- Auto-act on records.

## 5. Determinism + Model-Based Checks
- **Deterministic checks:** pattern/lexicon and structural rules (e.g., detect "you have", dosage patterns, "it's an emergency") — fast, auditable.
- **Model-based checks:** a safety classifier/LLM check for subtler violations and grounding.
- Both must pass; deterministic checks are the non-bypassable floor.

## 6. Testing & Assurance
- Maintained **adversarial test set** (jailbreaks, diagnosis baits, injection) run against every prompt/guardrail/version (`docs/10-Testing/135`).
- Release gate: **0 diagnostic/prescriptive/emergency-decision outputs** on the adversarial set (MS-2.1, `docs/01-Product/15`).
- Guardrail changes are versioned and re-tested.

## 7. Business Rules
- BR-1 Every AI output passes guardrails before display; prompts are not trusted alone.
- BR-2 Hard prohibitions (NG-1..NG-3, no ungrounded facts) enforced technically.
- BR-3 Output typed + sourced + clinician-review; emergencies curated-only.
- BR-4 Deterministic checks are the non-bypassable floor; model checks add depth.
- BR-5 AI shipping is gated on passing the adversarial safety set (0 violations).

## 8. Edge Cases
Subtle implied diagnosis (model check + downgrade); prompt-injection via report/user text (input pre-check + sanitisation); multilingual evasion (future coverage); model updates (re-run adversarial set); guardrail false positives (safe fallback preferred over unsafe output).

## 9. Acceptance Criteria
- [x] Multi-stage guardrails (input, grounding, prohibition, typing/sourcing, fallback) defined.
- [x] Hard prohibitions enforced technically, independent of prompts.
- [x] Adversarial testing + 0-violation release gate specified.

## 10. Future Expansion
Continuous red-teaming, guardrail telemetry/monitoring, on-device pre-filtering, localisation of safety lexicons, third-party safety audits.

## 11. Dependencies
`100`, `102`, `103`, `docs/02-Research/27`, `28`, `docs/01-Product/17`, `docs/10-Testing/135`, `docs/01-Product/15`.

## 12. Open Questions
- OQ-1 Safety-classifier approach/provider.
- OQ-2 Acceptable false-positive rate vs. safety trade-off.

## 13. Risks
- R-1 Guardrail bypass → harmful output. Mitigation: BR-1/BR-4 layered + adversarial gate (RSK-11).
- R-2 Over-blocking degrading usefulness. Mitigation: safe-fallback tuning (§8).
