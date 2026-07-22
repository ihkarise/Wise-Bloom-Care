# ADR-005 — AI Architecture: Grounded, Guardrailed, Educational

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-07-22 |
| Deciders | AI Systems Architect, Clinical Informatics, Security Architect |
| Related | `docs/07-AI/100-AI_ARCHITECTURE.md`, `103-RAG_DESIGN.md`, `105-GUARDRAILS.md`, `docs/02-Research/28-MEDICAL_DISCLAIMER.md` |

---

## 1. Context
The product includes an educational AI assistant that must **never** diagnose, prescribe, or make emergency decisions, must not fabricate medical facts, and must keep sensitive data private. The AI must be safe by construction, not by hope.

## 2. Decision
Adopt a **RAG + guardrails** architecture (`docs/07-AI/100`):
- **Grounding:** answers are retrieved from the versioned, sourced knowledge base (RAG, `docs/07-AI/103`); no parametric-only medical claims; insufficient coverage → "not enough information, consult your clinician."
- **Guardrails:** every output passes an independent guardrail layer (deterministic + model-based) enforcing prohibitions (NG-1..NG-3), content typing, sourcing, and clinician-review (`docs/07-AI/105`) — prompts are not trusted alone.
- **Provider abstraction:** LLM/embeddings behind a swappable interface; default to the latest capable Claude models where used.
- **Privacy:** minimal PHI to providers; consent + DPA; guarded logs.
- **Release gate:** 0 diagnostic/prescriptive/emergency outputs on the adversarial set (MS-2.1).

## 3. Rationale
- RAG makes answers sourced and current, satisfying "evidence or nothing" (P6).
- Independent guardrails provide defense-in-depth for the highest-stakes safety property (medical safety).
- Provider abstraction avoids lock-in and enables model upgrades.

## 4. Consequences
### Positive
- Safe-by-construction, sourced, non-diagnostic AI; swappable providers; testable safety gate.
### Negative / Risks
- RAG infra (embeddings/index) likely needs an external service given GAS limits (OQ) → provider abstraction + privacy controls.
- Guardrails add latency/complexity and possible false positives → prefer safe fallback (`docs/07-AI/105` §8).

## 5. Alternatives Considered
- **Prompt-only safety:** rejected — insufficient for medical safety; prompts can be bypassed.
- **Ungrounded LLM answers:** rejected — fabrication risk (RSK-7).
- **No AI in v1:** accepted for v1 (AI is v2); this ADR governs when it ships.

## 6. Compliance & Safety Notes
- Emergencies are curated-only (`docs/02-Research/28` BR-4); AI never auto-acts on records; consent/DPA for processing (`docs/09-Security/126`).

## 7. Review Trigger
Before shipping any AI feature (guardrail gate); on provider/model change; on any AI-safety incident (`docs/09-Security/125`).
