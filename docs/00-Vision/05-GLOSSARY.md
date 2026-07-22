# 05 — Glossary

| Field | Value |
|---|---|
| Document | Glossary & Ubiquitous Language |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Information Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/05-Data/70-DATA_DICTIONARY.md`, `docs/04-Architecture/55-DATABASE_MODEL.md`, `docs/02-Research/27-REFERENCES.md` |

---

## 1. Purpose

Establishes the **ubiquitous language** of Wise Bloom Care: one agreed term for each concept, used identically across product, design, data, and engineering documents. Ambiguous or synonymous terms cause data-model drift and cross-team miscommunication; this glossary is the single authority on vocabulary. Where a term also names a data entity, the authoritative field-level definition lives in `docs/05-Data/70-DATA_DICTIONARY.md` and this entry links to it.

## 2. Scope

Covers product/domain terms, clinical/obstetric terms used in the product, and platform/architecture terms. It defines *meaning within Wise Bloom Care*; it is not a medical dictionary and does not restate full clinical definitions (those cite `docs/02-Research`).

## 3. Conventions

- **Preferred term** is bold. **Avoid** lists deprecated synonyms.
- Clinical terms carry a source pointer; they are informational, not diagnostic.
- Entity terms are marked **[entity]** and map to the data model.

## 4. Product & Domain Terms

| Term | Definition | Notes / Avoid |
|---|---|---|
| **Family record** **[entity]** | The single linked graph representing one family: one maternal node and one or more child nodes. | The unit of continuity. Avoid: "account data". |
| **Maternal record** **[entity]** | The mother/birthing-parent node; the anchor for one or more pregnancy episodes. | Avoid: "mom profile". |
| **Pregnancy episode** **[entity]** | One pregnancy of a mother (its own LMP/EDD and outcome); children link to their originating episode. Supports multiple pregnancies over time and loss (episode ends without a child). | See `docs/05-Data/71` §5. Avoid: conflating with the maternal record. |
| **Child record / Baby profile** **[entity]** | A child node, permanently linked to the maternal record it originated from. | Created only by the delivery event. Avoid: "kid account". |
| **Journey** | The continuous, append-only sequence of a family's health from conception onward. | The organising metaphor. |
| **Timeline** **[entity]** | The chronological, append-only stream of events across the journey. | See `docs/08-Timeline`. |
| **Event** **[entity]** | A single timestamped, typed, attributed entry on the timeline (vital, appointment, report, milestone, etc.). | Append-only; corrections are new versioned events. |
| **Delivery event** | The hinge event that ends the pregnancy view and creates the linked child record. | Sole creator of a child record. |
| **Life stage** | A named phase: conception, pregnancy, delivery, postpartum, newborn, infancy, toddler, child. | Drives contextual content. |
| **Content type** | One of: Educational, Clinical Recommendation, Emergency Warning. | Must never be mixed. See `docs/02-Research/28-MEDICAL_DISCLAIMER.md`. |
| **Knowledge base** | The independent, versioned medical content store feeding education and AI. | `knowledge-base/`. Separate from product logic. |
| **Trend** | A derived view of a metric over time: current, previous, trend, prediction. | Surfacing only, never prescriptive. |
| **Prediction** | A model-derived projection of a metric (e.g., weight-gain trajectory). | Educational; recommends clinician review. |
| **Caregiver** | A non-birthing user with granted access to a family record (e.g., partner). | Family dashboard. Access is explicit. |
| **Clinician** | A medical professional; a future role with a dedicated portal. | Not a v1 user role. |

## 5. Clinical / Obstetric Terms (informational)

These are used in-product for education and context only; full definitions and sources in `docs/02-Research`.

| Term | Short definition | Source pointer |
|---|---|---|
| **LMP** | Last Menstrual Period; common basis for estimating gestational age. | `docs/02-Research/20-WHO_GUIDELINES.md` |
| **EDD / Due date** | Estimated Date of Delivery. | ACOG dating guidance |
| **Gestational age (GA)** | Duration of pregnancy, typically in weeks + days. | WHO/ACOG |
| **Antenatal / Prenatal care** | Care during pregnancy before birth. | `20-WHO_GUIDELINES.md` |
| **Trimester** | One of three ~13-week pregnancy phases. | ACOG |
| **Vitals** | Tracked measures: blood pressure, weight, weight gain, blood sugar. | `docs/06-Modules/83-VITALS_MODULE.md` |
| **Postpartum** | The period after delivery focused on maternal recovery. | `docs/06-Modules/88-DELIVERY_MODULE.md`, `docs/08-Timeline/112-POSTPARTUM.md` |
| **Neonatal / Newborn** | The first ~28 days of the infant's life. | WHO |
| **Apgar** | A newborn wellbeing score recorded at birth. | Recorded at delivery |
| **Milestone** | An expected developmental achievement by an age range. | CDC — `docs/02-Research/26-DEVELOPMENTAL_MILESTONES.md` |
| **Growth standard** | WHO Child Growth Standards; percentile/z-score references. | `docs/02-Research/25-WHO_CHILD_GROWTH.md` |
| **Immunization schedule** | The recommended vaccination timeline. | `docs/02-Research/24-GOVT_IMMUNIZATION.md` |
| **Red flag** | A symptom that warrants urgent clinical attention. | Surfaced only as typed Emergency Warning |

## 6. Platform / Architecture Terms

| Term | Definition | Source pointer |
|---|---|---|
| **API contract** | The stable interface the frontend depends on, independent of storage. | `docs/04-Architecture/56-API_SPEC.md` |
| **Backend adapter** | The swappable implementation behind the API (Apps Script/Sheets today; Postgres/Supabase/Firebase later). | `docs/04-Architecture/52-BACKEND_ARCHITECTURE.md` |
| **Sheet-as-table** | A Google Sheet tab modelled as a relational table for v1 storage. | `docs/04-Architecture/54-GOOGLE_SHEETS_SCHEMA.md` |
| **Audit log** | Immutable record of who accessed/changed what health data and when. | `docs/05-Data/75-AUDIT_LOGS.md` |
| **Guardrail** | An AI safety constraint preventing diagnosis/prescription/emergency decisions. | `docs/07-AI/105-GUARDRAILS.md` |
| **RAG** | Retrieval-Augmented Generation; grounding AI answers in the knowledge base. | `docs/07-AI/103-RAG_DESIGN.md` |
| **ADR** | Architecture Decision Record. | `docs/ADR/` |
| **PWA** | Progressive Web App; the future offline-capable delivery target. | `docs/13-Future` |

## 7. Deprecated / Forbidden Terms

| Do not use | Use instead | Why |
|---|---|---|
| "Baby app", "pregnancy app" (as separate products) | "the platform" / a module name | Reinforces the fragmentation we reject. |
| "Migrate the pregnancy into the baby" | "the delivery transition" | There is no migration; it is one record. |
| "Diagnosis" (for any product output) | "educational information" / "trend" | We never diagnose. |
| "Delete an event" | "add a correction (versioned)" | Timeline is append-only. |

## 8. Business Rules

- BR-1: Any new domain concept introduced in any document must be added here before merge if it is not already defined.
- BR-2: Entity terms here must match `docs/05-Data/70-DATA_DICTIONARY.md`; on conflict, the Data Dictionary is authoritative for field-level detail and this glossary for conceptual meaning — the two must be reconciled, not left divergent.

## 9. Acceptance Criteria

- [x] Every core concept in the master brief has exactly one preferred term.
- [x] Entity terms cross-link to the data model / data dictionary.
- [x] Deprecated synonyms are listed to prevent drift.
- [x] Clinical terms are marked informational with source pointers.

## 10. Future Expansion

Add terms for the clinician portal, offline sync, wearables/devices, and additional life stages as those areas are specified. Consider generating a machine-readable term list to lint documentation.

## 11. Dependencies

`docs/05-Data/70-DATA_DICTIONARY.md`, `docs/02-Research/*`, `docs/04-Architecture/*`.

## 12. Open Questions

- OQ-1: Preferred term for the birthing parent that is inclusive yet clear — "mother" (brief default) vs. "birthing parent". Current default: "mother", with inclusive copy where appropriate (UX to confirm).
- OQ-2: Term for a pregnancy that does not result in a live birth, handled compassionately (see delivery module).

## 13. Risks

- R-1: Glossary going stale as docs evolve. Mitigation: BR-1 merge gate; periodic reconciliation with Data Dictionary.
