# 100 — AI Architecture

| Field | Value |
|---|---|
| Document | AI Architecture |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect |
| Last Updated | 2026-07-22 |
| Related | `101-KNOWLEDGE_BASE.md`, `103-RAG_DESIGN.md`, `105-GUARDRAILS.md`, `docs/06-Modules/94-AI_MODULE.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Purpose
Defines the overall architecture of Wise Bloom Care's AI: how educational AI is grounded in the knowledge base (RAG), constrained by guardrails, typed and sourced, and integrated with the product — safely and privately. The governing principle: **AI educates, never diagnoses** (`docs/02-Research/28`).

## 2. Scope
End-to-end AI pipeline (retrieval → generation → guardrails → typed/sourced output), providers, privacy, and integration. Prompt content: `102`; RAG detail: `103`; guardrails: `105`; prediction: `104`.

## 3. Principles
- Educational only; never diagnose/prescribe/decide emergencies (NG-1..NG-3).
- Grounded: answers come from the knowledge base (RAG); no ungrounded medical claims (`docs/02-Research/27` BR-4).
- Guardrailed: every output post-processed for prohibitions + typing + sourcing.
- Private: minimise PHI sent to providers; consent + data-processing agreements.
- Transparent: outputs are typed and cite sources; uncertainty is stated.

## 4. Pipeline

```
User request (+ authorised context)
   │
1. Intent & safety pre-check  ── refuse diagnosis/prescription asks (105)
   │
2. Retrieval (RAG)            ── fetch relevant KB items (101, 103) with source_refs
   │
3. Generation                ── LLM produces educational draft grounded in retrieved content
   │
4. Guardrail post-processing ── enforce prohibitions, content typing, source attach,
   │                            clinician-review; strip anything diagnostic/prescriptive (105)
   │
5. Typed, sourced output     ── Educational / Clinical-Recommendation (never auto Emergency)
   │
6. Logging (guarded, minimal PHI)
```

## 5. Components
- **Retriever:** searches the knowledge base (embeddings/index) for relevant, current, sourced content (`103`).
- **Generator (LLM):** produces educational language grounded in retrieved content; provider abstracted (swap-able) — see `claude` models per platform guidance.
- **Guardrail layer:** deterministic + model-based checks enforcing `105` before display.
- **Content typer/sourcer:** attaches `content_type` + `source_ref` (`docs/02-Research/28`).
- **Prediction engine:** separate, for trend surfacing (`104`) — also non-diagnostic.

## 6. Privacy & Data Handling
- Send the minimum necessary context to the provider; prefer de-identified/aggregated context where possible.
- Consent + provider data-processing agreement required before any PHI-adjacent processing (`docs/09-Security/126`).
- AI logs are minimal and guarded (no unnecessary PHI; `docs/04-Architecture/63`).
- No training on user data without explicit consent.

## 7. Provider Abstraction
- The LLM/embeddings providers sit behind an interface (like the storage adapter) so they can be swapped; default to the latest capable Claude models where used (per platform guidance).
- Fallbacks and rate/error handling defined; degraded mode returns "not enough information / consult your clinician" rather than guessing.

## 8. Business Rules
- BR-1 All AI output passes guardrails before display (`105`).
- BR-2 AI answers are grounded in the KB (RAG); no ungrounded medical claims.
- BR-3 Output is typed + sourced; emergencies only from curated set.
- BR-4 Minimise PHI to providers; consent + DPA required.
- BR-5 AI never auto-acts on user data (read-only w.r.t. records).

## 9. Edge Cases
Low KB coverage (say so; don't fabricate); adversarial prompts (pre-check + guardrails); provider outage (degraded safe mode); non-English (future); ambiguous medical questions (educate + clinician-review).

## 10. Acceptance Criteria
- [x] End-to-end RAG→guardrail→typed/sourced pipeline defined.
- [x] Privacy/provider-abstraction/consent specified.
- [x] Non-diagnostic, grounded, guardrailed principles enforced.

## 11. Future Expansion
Voice (`107`), OCR (`106`), proactive guarded insights, multilingual, on-device inference (privacy), clinician-facing summaries.

## 12. Dependencies
`101`, `102`, `103`, `104`, `105`, `docs/06-Modules/94`, `docs/02-Research/27`, `28`, `docs/09-Security/126`.

## 13. Open Questions
- OQ-1 Provider selection + DPA.
- OQ-2 Embedding/index approach given GAS constraints (external service likely).

## 14. Risks
- R-1 Ungrounded/diagnostic output. Mitigation: BR-1/BR-2 RAG + guardrails.
- R-2 PHI leakage to providers. Mitigation: BR-4 minimisation + consent.
