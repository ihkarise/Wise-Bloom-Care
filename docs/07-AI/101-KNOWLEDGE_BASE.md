# 101 — Knowledge Base

| Field | Value |
|---|---|
| Document | Knowledge Base Design |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | AI Systems Architect / Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `103-RAG_DESIGN.md`, `docs/02-Research/27-REFERENCES.md`, `28-MEDICAL_DISCLAIMER.md`, `knowledge-base/*` |

---

## 1. Purpose
Defines the knowledge base (KB): the independent, versioned store of medical/educational content that powers both direct education (week cards, tips) and AI (RAG). The KB is separated from product logic so medical knowledge can be reviewed, versioned, and updated independently.

## 2. Scope
KB structure, content metadata, typing/sourcing, versioning, and review governance. Physical content lives in `knowledge-base/`. Retrieval mechanics: `103`.

## 3. Structure
```
knowledge-base/
  pregnancy/ week01.md … week40.md
  delivery/ newborn/ growth/ milestones/
  vaccination/ nutrition/ exercise/ emergency/ medicines/
```
Each domain holds content items (Markdown) with front-matter metadata. Life-stage and topic taxonomy mirrors the IA (`docs/03-UX/32`) and glossary.

## 4. Content Item Metadata (required)
Every content item carries:
- `content_type`: educational | clinical_recommendation | emergency_warning (`docs/02-Research/28`).
- `source_ref`: resolves to `docs/02-Research/27` (evidence-or-nothing, P6).
- `life_stage` / `topic` tags; `age`/`week` where relevant.
- `version` + `last_reviewed` + `review_due` (freshness).
- Optional: `related` links.

> Items without valid `content_type` + `source_ref` (for medical claims) fail review and cannot ship (`docs/02-Research/28` BR-2).

## 5. Content Governance
- **Facts vs. design** separated (`[FACT]`/`[DESIGN]`); no invented facts (`docs/02-Research/27` BR-4).
- Sourced to WHO/ACOG/FIGO/NICE/CDC/NIS (`docs/02-Research/*`).
- Reviewed on a cadence; guideline changes trigger re-review (`docs/02-Research/27` BR-5).
- Emergency-warning items are a curated, carefully-reviewed set (the only source of emergency content, `docs/02-Research/28` BR-4).

## 6. Independent Versioning
- KB is versioned independently of product code (`docs/05-Data/77` §7); releases pin a KB version (`docs/01-Product/16`).
- Enables reproducing what a user saw and safe content updates.

## 7. Use by Product & AI
- **Direct:** week cards, tips, milestone/vaccine education surfaced by ContentService (typed + sourced).
- **AI (RAG):** retriever indexes KB items; AI answers are grounded in and cite them (`103`).

## 8. Business Rules
- BR-1 Every medical content item is typed + sourced; else it fails review.
- BR-2 KB is code-independent and versioned independently.
- BR-3 Emergency content exists only as a curated KB set.
- BR-4 Facts vs. design separated; no invented facts.
- BR-5 Review cadence + guideline-change re-review enforced.

## 9. Edge Cases
Missing coverage (AI says "not enough info"; content team fills gap); conflicting sources (prefer primary/most-current; document); localisation (translated items keyed to source version); deprecated content (versioned out, not silently changed).

## 10. Acceptance Criteria
- [x] Structure + required metadata (type, source, version, review) defined.
- [x] Governance (facts/design, sourcing, review, curated emergencies) stated.
- [x] Independent versioning + release pinning specified.

## 11. Future Expansion
Structured/semantic content model; multilingual KB; clinician-reviewed content workflow; content-authoring tooling; automated `source_ref` linting.

## 12. Dependencies
`103`, `docs/02-Research/27`, `28`, `docs/05-Data/77`, `docs/01-Product/16`, `knowledge-base/*`.

## 13. Open Questions
- OQ-1 Front-matter schema formalisation + lint tooling.
- OQ-2 Authoring/review workflow + who signs off medical content.

## 14. Risks
- R-1 Stale/incorrect content. Mitigation: BR-5 review + BR-1 sourcing.
- R-2 Untyped content reaching users/AI. Mitigation: BR-1 review gate.
