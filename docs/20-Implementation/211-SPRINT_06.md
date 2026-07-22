# 211 — Sprint 06: Knowledge & AI Engine (RAG, Prompts, Guardrails)

| Field | Value |
|---|---|
| Sprint | 06 — Educational AI: guardrails first, then RAG + assistant |
| Status | Planned |
| Milestone | MS-2.1 (guardrails, blocking), MS-2.2 (AI assistant) (`204` §7) |
| Layers | L7 (`202` §3) — not on the v1 critical path |
| Ships toward | v2 (Assistance & Insight) — does not block v1 |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 3 weeks · 2 BE/AI + 1 FE + safety/red-team reviewer |

---

## 1. Purpose

Build the educational AI capability strictly in safety order: the **guardrail framework first** (MS-2.1, which blocks all AI exposure — `15` BR-3), then RAG grounding in the knowledge base, the prompt system, and the assistant surfaces (explain a report, summarise a visit). Governing principle: **AI educates, never diagnoses** (`100` §1). No AI output reaches a user until the adversarial set yields **0 violations** (`202` gate G-5).

## 2. Objectives

1. **Guardrail layer** (built and verified first): enforce prohibitions (no diagnosis/prescription/emergency-decision), content typing, source attachment, clinician-review; strip anything diagnostic/prescriptive (`105`, `100` §4).
2. RAG retriever + knowledge-base index (`101`, `103`), returning items with `source_ref`.
3. Prompt system (`102`) producing educational drafts grounded in retrieved content.
4. Provider abstraction (LLM/embeddings behind an interface, swappable; default to latest capable Claude models per platform guidance) (`100` §7).
5. AIService pipeline: intent/safety pre-check → retrieve → generate → guardrail → typed/sourced output → guarded logging (`100` §4).
6. Assistant surfaces: explain a report, summarise a visit — educational-typed (`94`, `56` `/v1/ai/*`).

## 3. Architecture References

`docs/07-AI/100` (AI architecture), `101` (knowledge base), `102` (prompt library), `103` (RAG), `105` (guardrails); `docs/06-Modules/94` (AI module); `docs/04-Architecture/56` (`/v1/ai/*`), `63` (logging); `docs/02-Research/27`,`28` (sources, disclaimer/typing); `docs/09-Security/126` (privacy/consent/DPA); `docs/ADR/ADR-005-AI-Architecture`.

## 4. Files Created

```
apps/backend/src/services/ai/{GuardrailService,RetrieverService,GeneratorService,AIService}.ts
apps/backend/src/services/ai/providers/{LLMProvider.ts (interface),EmbeddingsProvider.ts (interface)}
apps/backend/src/controllers/aiController.ts
apps/backend/src/lib/ai/{intent-precheck.ts,source-attach.ts,phi-minimize.ts}
apps/backend/tests/ai/{guardrail-adversarial,retriever-grounding,ai-pipeline,phi-minimization}.test.ts
tests/security/ai-adversarial-set.test.ts (0 diagnostic/prescriptive/emergency outputs)
apps/web/src/features/ai/{AssistantIsland.tsx,ExplainReport.tsx,VisitSummary.tsx,SourceCitation.tsx}
apps/web/src/api/ai.ts
tools/rag/build-index.ts (knowledge-base → embeddings index)
```

## 5. Files Modified

- `packages/api-contract` — `/v1/ai/explain`, `/v1/ai/summarise` (guardrailed; educational-typed).
- `packages/domain-types` — `AIRequest`, `AIResponse` (typed + sourced), `RetrievedItem`.
- `ContentService.ts` — apply typing/sourcing to AI output (`52` BR-5).
- `apps/backend/src/lib/logging.ts` — AI logs minimal + guarded, no unnecessary PHI (`63`, `100` §6).
- No architecture docs.

## 6. Tasks

1. **Build the guardrail layer first** (`105`): deterministic + model-based checks; refuse diagnosis/prescription asks at intent pre-check; strip prohibited output; require `content_type` + `source_ref`; never auto-emit Emergency type (`100` BR-3). Ship it behind a flag with the assistant disabled.
2. Assemble the adversarial test set and run it against the guardrail layer; **do not proceed** to expose AI until it yields 0 violations (`202` G-5, `130` §4.3).
3. RetrieverService + index build (`tools/rag/build-index.ts`) over `knowledge-base/`; return items with `source_ref` (`101`,`103`).
4. Provider abstraction: `LLMProvider`/`EmbeddingsProvider` interfaces (swappable like the storage adapter); default to latest capable Claude models per platform guidance; degraded mode returns "not enough information / consult your clinician" rather than guessing (`100` §7).
5. AIService pipeline wiring (pre-check → retrieve → generate → guardrail → typed/sourced → guarded log). Minimise PHI to providers; require consent + DPA before PHI-adjacent processing (`100` §6, `126`).
6. Assistant surfaces: explain-report, visit-summary; render only via content-type-aware components with visible source citations (`51` BR-4).
7. Tests per §9.

## 7. Deliverables

- Guardrail framework passing the adversarial set with 0 violations (MS-2.1).
- RAG-grounded, typed + sourced educational AI: explain a report, summarise a visit (MS-2.2).
- Swappable provider abstraction; PHI-minimising, consented pipeline.

## 8. Acceptance Criteria

- [ ] **MS-2.1:** the AI adversarial set produces **0 diagnostic/prescriptive/emergency-decision outputs** (`15` MS-2.1, `130` §4.3) — release-blocking for any AI exposure.
- [ ] Every AI answer is grounded in retrieved knowledge-base content and carries `content_type` + `source_ref`; ungrounded medical claims are refused (`100` BR-2/BR-3).
- [ ] AI is read-only w.r.t. records — it never writes to health data, only AI logs (`100` BR-5).
- [ ] Low KB coverage → the assistant says so and does not fabricate (`100` §9).
- [ ] PHI sent to providers is minimised; processing requires consent + DPA (`100` BR-4, `126`).
- [ ] Provider outage → safe degraded mode, no guessing (`100` §7).

## 9. Testing (see `214` §5 — safety-critical)

- **Unit:** guardrail rules; intent pre-check; source attachment; PHI minimisation.
- **Integration:** full AI pipeline (retrieve→generate→guardrail→typed/sourced).
- **Security/adversarial (release-blocking):** `ai-adversarial-set.test.ts` = 0 violations; PHI-minimization test; refusal on diagnosis/prescription asks.
- **Grounding:** retriever returns sourced items; generator stays within retrieved content.
- **e2e:** explain a (synthetic) report; summarise a (synthetic) visit — output typed + cited (`131`).
- **a11y:** assistant + citation UI pass AA (`40`).

## 10. Risks

- R-1: Ungrounded/diagnostic output (`100` R-1). Mitigation: guardrails-first + RAG + adversarial gate (Tasks 1–2; §8 release-blocking).
- R-2: PHI leakage to providers (`100` R-2). Mitigation: PHI minimisation + consent/DPA (Task 5).
- R-3: Provider lock-in / outage. Mitigation: provider abstraction + degraded safe mode (Task 4).
- R-4: Embedding/index approach under GAS constraints (`100` OQ-2) — external index service likely. Mitigation: index built offline via `tools/rag`; retrieval behind the provider interface. If this proves architecturally significant, raise an ADR proposal (`200` §11) — do not edit `100`.

## 11. Rollback

- AI ships behind a feature flag, **default off**, until MS-2.1 passes. Rollback = disable the flag (instant, no data impact — AI is read-only). Backend repoint to prior GAS version; frontend redeploy. No AI writes to health data, so there is no data rollback surface (`100` BR-5).

## 12. Definition of Done

Per `217`/`146` **plus** the AI safety bar: MS-2.1 adversarial gate = 0 violations before any exposure; outputs typed + sourced + grounded; read-only; PHI-minimised with consent/DPA; a11y AA; tests green; docs in sync; reviewed; deployable. Per `16` BR-3, no AI release ships without guardrail conformance.

## 13. Dependencies

Depends on: Sprint 01 (ContentService), the knowledge base (already authored, code-independent). Gated by: MS-2.1. Does **not** block v1 (`200` §4, `202` §5). Blocks: Sprint 07 prediction surfacing that reuses the non-diagnostic framing.
