# Architecture Review Report — Wise Bloom Care

| Field | Value |
|---|---|
| Review type | Principal-Architect audit (production readiness, multi-year roadmap) |
| Scope | All `docs/` (130 files) + `knowledge-base/` (50 files) |
| Date | 2026-07-22 |
| Reviewer role | Principal Software Architect |
| Method | Full cross-document consistency audit + automated reference/terminology checks; violations fixed in place |
| Result | **Ready with minor fixes** (fixes applied in this pass) |

---

## 1. Overall Score

**92 / 100.**

This is an unusually complete and internally coherent documentation set for a pre-implementation product. The founding thesis (one continuous, linked maternal→child record) is threaded consistently from Vision through Operations, safety (educate-never-diagnose, content typing, AI guardrails) is enforced structurally rather than by aspiration, and the storage-independence boundary is real (API contract + storage adapter). The audit found **one genuine cross-document architecture-drift defect** (now fixed), a small number of minor inconsistencies (fixed), and a set of intentional open questions and pending external dependencies (legal review, clinician sign-off of medical specifics) that are correctly flagged as such rather than hidden.

Points are withheld primarily for: real (acknowledged) scalability ceilings in the v1 runtime (Apps Script + Sheets), the volume of `[VERIFY]` medical markers that still require clinician sourcing before user display, and the absence — until this pass — of formal diagrams.

---

## 2. Strengths

- **Continuity thesis is consistent end-to-end.** The one-record / append-only / delivery-is-sole-creator invariants (Vision BR-V1…BR-V5) are referenced and honoured in Data (`55`, `71`, `77`), Modules (`88`, `89`), Timeline (`111`), API (`56`), Testing (`131` TC-DEL-*), and Operations (`150` §4). No document contradicts the thesis.
- **Safety is architural, not aspirational.** Content typing (`docs/02-Research/28`) and AI guardrails (`docs/07-AI/105`) are enforced by dedicated components, gated in testing (`135`, MS-2.1: 0 violations), and reflected in the Non-Goals (`17`) and Definition of Done (`146`).
- **Storage independence is genuine.** Two explicit boundaries (API contract `56`, storage adapter `52`/`54`) plus a storage-neutral logical model (`55`) make the Sheets→Postgres/Supabase migration a new folder, not a rewrite — reflected structurally in `59`.
- **Evidence discipline.** Medical claims trace to WHO/ACOG/FIGO/NICE/CDC/NIS with a master citation register (`27`) and a facts-vs-design (`[FACT]`/`[DESIGN]`) and `[VERIFY]` convention that refuses to invent numbers.
- **Traceability.** Requirements (`10`) → feature matrix (`12`) → modules (`06-Modules`) → test cases (`131`) form a coherent chain; ADRs (`ADR-001…006`) back the significant decisions and are all referenced.
- **Compassion + accessibility treated as first-class** (loss paths, WCAG 2.2 AA as a release gate, manual compassion audits in `132`).

---

## 3. Weaknesses

- **v1 runtime scalability ceiling.** Google Apps Script + Sheets impose quota/latency/concurrency limits and no transactions; integrity is enforced in application code rather than the datastore. This is honestly acknowledged (RSK-9, `53`, `54`) with a migration path, but remains the platform's principal scaling risk.
- **Medical specifics pending verification.** 48 knowledge-base files carry `[VERIFY]` markers for week-specific details; these require clinician/primary-source sign-off before user display. This is correct behaviour (no invented facts) but is real outstanding work.
- **External dependencies gate launch.** Privacy policy and terms are a *design basis* pending qualified-counsel review; AI/OCR/voice depend on provider selection + DPAs. Correctly flagged, not yet closed.
- **Diagrams were absent** until this pass (see Fixes). The docs relied on ASCII; formal ER/sequence/state diagrams are now added at the keystone points but not yet comprehensive.

---

## 4. Critical Findings

> Critical = a document that violates another document (fixed in this pass, per the audit mandate).

### CF-1 — PregnancyEpisode entity drift (FIXED)
- **Symptom:** `71-ENTITY_RELATIONSHIP.md` §5 **resolves** the multi-pregnancy question by formally adopting a `PregnancyEpisode` entity (owning LMP/EDD/outcome), and `73-VALIDATION_RULES.md` and `82-PREGNANCY_MODULE.md` both rely on it — but `55-DATABASE_MODEL.md` still listed it as an unresolved Open Question and omitted it from the core-entity table/relationships; `54-GOOGLE_SHEETS_SCHEMA.md` had no `pregnancy_episodes` tab; `70-DATA_DICTIONARY.md` had no entry; the Glossary (`05`) did not define it.
- **Impact:** Genuine architecture/database drift — the "resolved" data model was inconsistent across the Data and Architecture sections, and LMP/EDD ownership was ambiguous (MaternalRecord vs. PregnancyEpisode).
- **Fix applied (every affected document):**
  - `55` — added `PregnancyEpisode` to core entities and the relationship graph; moved LMP/EDD onto the episode; **closed OQ-1** (now points to the resolution in `71`).
  - `54` — added the `pregnancy_episodes` tab; moved LMP/EDD/BMI/parity off `maternal_records`; added `episode_id` FK to `child_records`.
  - `70` — restructured `MaternalRecord` (profile only), added a `PregnancyEpisode` entity, added `episode_id` to `ChildRecord`; **closed OQ-1**.
  - `05` (Glossary) — added the `Pregnancy episode` entity term (satisfying Glossary BR-1).
  - `52` — added `PregnancyService` to the declared domain-service list (referenced by `82`/`70` but previously undeclared).

No other document-vs-document violations were found. All doc cross-references resolve; all ADR references exist.

---

## 5. Minor Findings

| ID | Finding | Status |
|---|---|---|
| MF-1 | FIGO `22` OQ-2 framed the **canonical glucose unit** as open, though `72` §5 already decides it (mg/dL); only the *display default* is open. | **Fixed** (`22` OQ-2 reworded). |
| MF-2 | No ER / sequence / state diagrams anywhere (audit explicitly requests these). | **Fixed** — mermaid ER diagram added to `71` §3.1; delivery **sequence** + pregnancy-episode **state machine** added to `111` §3.1–3.2. |
| MF-3 | Global medical-disclaimer text lives in `28` §6 and is *quoted* by `127` §4. | **Accepted (by design)** — `28` is the single source; `127` incorporates by reference/quote. Not a duplication defect. |
| MF-4 | `account holder` (prose) vs `account_holder` (enum value) both appear. | **Accepted** — correct register separation (prose vs. identifier); consistent. |
| MF-5 | Numerous `[VERIFY]` markers in the knowledge base. | **Accepted (by design)** — required by the evidence-or-nothing rule; tracked as technical debt (TD-1). |

---

## 6. Cross-Reference Issues

- **Automated check:** every `docs/<section>/<NN-NAME>.md` reference across the corpus **resolves to an existing file** (0 broken links, verified after fixes).
- **ADR references:** all `ADR-001…006` references resolve to existing ADR files.
- **Terminology:** entity naming is consistent between the Glossary (`05`), Data Dictionary (`70`), and Logical Model (`55`) after the PregnancyEpisode reconciliation. Ubiquitous-language terms (family record, maternal record, pregnancy episode, child record, event, delivery event) are used uniformly.
- **Residual (intentional) cross-refs:** several docs reference `[VERIFY]`/OQ items and future docs (clinician portal, offline) that are deliberately forward-looking, not broken references.

---

## 7. Technical Debt

| ID | Debt | Severity | Owner area |
|---|---|---|---|
| TD-1 | `[VERIFY]` week-specific medical specifics need clinician/primary-source sign-off before user display. | Medium | `02-Research`, `knowledge-base` |
| TD-2 | Immunization schedule (India NIS) exact booster ages to be re-verified against the current official NIS before ship. | Medium | `24`, `92` |
| TD-3 | Privacy policy / terms are a design basis pending qualified-counsel review for the launch jurisdiction. | High (launch-gating) | `126`, `127` |
| TD-4 | AI/OCR/voice provider selection + Data-Processing Agreements not yet chosen. | Medium | `07-AI`, `126` |
| TD-5 | Integrity is application-enforced (Sheets has no constraints/transactions); relies on adapter discipline + `LockService`. | Medium | `52`, `53`, `54` |
| TD-6 | RPO/RTO, P95 latency budgets, and load-concurrency targets are proposals, not baselined numbers. | Low | `62`, `152`, `134` |
| TD-7 | Diagram coverage is now seeded (ER + delivery sequence/state) but not comprehensive across all modules/flows. | Low | multiple |
| TD-8 | Design tokens, API contract (OpenAPI), and KB front-matter schema are described but not yet machine-readable/lintable. | Low | `35`, `56`, `101` |

---

## 8. Future Recommendations

1. **Close the medical-verification loop (TD-1/TD-2):** assign a clinician reviewer; replace `[VERIFY]` markers with sourced facts or remove the specifics; re-verify NIS ages. Gate KB release on this.
2. **Formalise the contract (TD-8):** author the API as OpenAPI and generate the client `domain-types`; encode the KB front-matter as a schema and lint that every content item has `content_type` + a resolvable `source_ref`.
3. **Baseline the numbers (TD-6):** set RPO/RTO, latency budgets, and expected concurrency from a prototype so the GAS-migration threshold (RSK-9) is a measured trigger, not a guess.
4. **Expand diagrams (TD-7):** add sequence diagrams for auth/session and report+OCR flows, and a state machine for the child vaccination/milestone overlays.
5. **Pre-stage the migration ADR:** draft the target-storage ADR (Postgres/Supabase) now so the boundary is exercised before V3 load arrives.
6. **Legal/DPA track (TD-3/TD-4):** start counsel review and provider DPAs early — they are the true launch-gating items, not engineering.

---

## 9. Consistency Verification — Vision → Future chain

| Layer | Verified against | Result |
|---|---|---|
| Vision → PRD | Invariants BR-V1…V5, non-goals, KPIs carried into `10`/`17` | ✅ Consistent |
| PRD → Architecture | FRs map to system/API/module boundaries (`50`,`52`,`56`) | ✅ Consistent |
| Architecture → Data | Logical model `55` ↔ Sheets `54` ↔ dictionary `70` ↔ ERD `71` | ✅ Consistent **after CF-1 fix** |
| Data → Modules | Entity ownership matches module specs (incl. PregnancyService) | ✅ Consistent **after CF-1 fix** |
| Modules → AI | AI reads modules, never auto-acts; guarded (`94`,`100`,`105`) | ✅ Consistent |
| AI → Security | Guardrails + PHI-minimisation + consent (`105`,`126`,`120`) | ✅ Consistent |
| Security → Testing | Threat mitigations + AI adversarial set have tests (`135`) | ✅ Consistent |
| Testing → Operations | Gates feed release/runbook/monitoring (`16`,`150`,`64`) | ✅ Consistent |
| Operations → Future | Migration/clinician/offline gated on validated boundary (`161`) | ✅ Consistent |

The founding chain is coherent end-to-end; the only break (Architecture↔Data via PregnancyEpisode) has been repaired.

---

## 10. Grades

| Dimension | Grade | Rationale |
|---|---|---|
| **Architecture** | **A−** | Clean layering, real independence boundaries, sole-creator continuity; capped by v1 runtime scale ceiling and app-enforced integrity. |
| **Documentation** | **A** | Complete, uniform structure, traceable, strong cross-referencing; diagrams now seeded. |
| **Maintainability** | **A−** | Single-source-of-truth discipline, versioning, DoD gates; some contracts not yet machine-enforced (TD-8). |
| **Scalability** | **B+** | Migration path is designed and structural, but v1 (GAS/Sheets) is a genuine ceiling until exercised (TD-5/TD-6). |
| **Medical Knowledge** | **B+** | Well-sourced, correctly typed, honest about uncertainty; held back by outstanding `[VERIFY]`/NIS verification (TD-1/TD-2). |
| **AI Architecture** | **A−** | RAG + independent guardrails + adversarial release gate is a strong, safe-by-construction design; unproven until implemented/tested. |

---

## 11. Readiness Score

**Readiness: 8.6 / 10 — Ready with minor fixes.**

The documentation set is production-grade and internally consistent after this pass. It is ready to proceed into implementation of the v1 keystone (auth + continuous record + delivery transition). The remaining blockers are **non-engineering** (legal review, clinician verification of medical specifics, provider DPAs) and are correctly isolated; none require re-architecting.

---

## 12. Overall Recommendation

> **✅ Ready with minor fixes.**

- The single critical cross-document defect (CF-1, PregnancyEpisode drift) and all minor inconsistencies found in this audit **have been fixed in place** across every affected document.
- No document currently violates another (verified: 0 broken cross-references, consistent entity terminology, all ADRs resolve, Vision→Future chain coherent).
- Proceed to v1 implementation. Track TD-1…TD-4 as launch-gating items (medical verification, NIS re-verification, legal review, provider DPAs) and TD-5…TD-8 as roadmap hygiene.

_Not "Ready" outright only because of the outstanding external verifications (medical + legal), which are prerequisites for a live product handling real health data — not because of any architectural deficiency._
