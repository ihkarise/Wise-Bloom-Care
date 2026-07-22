# 27 — References (Master Citation List)

| Field | Value |
|---|---|
| Document | Master Citation List & Source Governance |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Maternal & Child Health Domain Researcher |
| Last Updated | 2026-07-22 |
| Related | `20`–`26`, `28-MEDICAL_DISCLAIMER.md`, `knowledge-base/*`, `docs/07-AI/101-KNOWLEDGE_BASE.md` |

---

## 1. Purpose

The single, authoritative list of medical and technical sources cited across Wise Bloom Care's research docs and knowledge base, plus the governance rules for how sources are used, cited, and kept current. Any medical statement in the product must trace to an entry here (evidence-or-nothing, Principle P6).

## 2. Scope

Covers medical guideline sources (WHO, ACOG, FIGO, NICE, CDC, national immunization) and citation governance. Technical/architecture references live with their respective docs and ADRs.

## 3. Source Register

### 3.1 Maternal / Antenatal
| Ref | Source | URL |
|---|---|---|
| S-WHO-ANC | WHO, *Recommendations on antenatal care for a positive pregnancy experience* (2016) | https://www.who.int/publications/i/item/9789241549912 |
| S-WHO-ANC-HL | WHO, ANC highlights & key messages (WHO-RHR-18.02) | https://www.who.int/publications/i/item/WHO-RHR-18.02 |
| S-ACOG-PE | ACOG, Preeclampsia & High Blood Pressure During Pregnancy (FAQ) | https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy |
| S-ACOG-GWG | ACOG gestational weight gain (via AAFP summary; aligns with IOM/NAM 2009) | https://www.aafp.org/pubs/afp/issues/2006/0415/p1471.html |
| S-FIGO-GDM | Hod et al., FIGO Initiative on GDM (2015), Int J Gynecol Obstet | https://obgyn.onlinelibrary.wiley.com/doi/10.1016/S0020-7292%2815%2930033-3 |
| S-NICE-ANC | NICE NG201, Antenatal care (2021) | https://www.nice.org.uk/guidance/ng201 |

### 3.2 Child Growth & Development
| Ref | Source | URL |
|---|---|---|
| S-WHO-GROWTH | WHO Child Growth Standards (2006), Acta Paediatrica | https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1651-2227.2006.tb02378.x |
| S-WHO-GROWTH-T | WHO Child Growth Standards tools/tables | https://www.who.int/tools/child-growth-standards |
| S-CDC-MILE | CDC Developmental Milestones ("Learn the Signs. Act Early.") | https://www.cdc.gov/ncbddd/actearly/milestones/index.html |
| S-AAP-MILE | Zubler et al., Evidence-Informed Milestones, Pediatrics 2022;149(3) | https://publications.aap.org/pediatrics/article/149/3/e2021052138/184748/ |

### 3.3 Immunization
| Ref | Source | URL |
|---|---|---|
| S-IND-NIS | India National Immunization Schedule (NHM) | https://nhm.gov.in/New_Updates_2018/NHM_Components/Immunization/report/National_%20Immunization_Schedule.pdf |
| S-UNICEF-IN | UNICEF India immunization schedule | https://www.unicef.org/india/know-your-childs-immunization-schedule |
| S-WHO-IMM | WHO immunization data (by country) | https://immunizationdata.who.int |

## 4. Citation Governance (business rules)

- BR-1: Every user-facing medical statement carries a `source_ref` matching an entry here (enforced in content metadata; `docs/07-AI/101-KNOWLEDGE_BASE.md`).
- BR-2: Sources are cited with title + publisher + year + URL; primary sources (issuing bodies) are preferred over secondary summaries. Where a secondary source is used for convenience, the primary source is also listed.
- BR-3: **Facts vs. design** are separated in every research/KB doc (`[FACT]`/`[DESIGN]`).
- BR-4: **Never invent facts.** If a needed figure is not verifiable against a listed source, it is marked `[VERIFY: source]` and must not ship in user-facing copy until verified.
- BR-5: **Freshness:** each source has a review cadence; guideline sources are re-checked at least annually and before any release that touches dependent content (`docs/01-Product/16-RELEASE_PLAN.md`).

## 5. Source Freshness Log

| Ref | Last verified | Next review due |
|---|---|---|
| S-WHO-ANC | 2026-07-22 | ≤ 2027-07 or next release |
| S-ACOG-GWG / S-ACOG-PE | 2026-07-22 | ≤ 2027-07 or next release |
| S-FIGO-GDM | 2026-07-22 | ≤ 2027-07 or next release |
| S-NICE-ANC | 2026-07-22 | ≤ 2027-07 or next release |
| S-WHO-GROWTH | 2026-07-22 | ≤ 2027-07 or next release |
| S-CDC-MILE / S-AAP-MILE | 2026-07-22 | ≤ 2027-07 or next release |
| S-IND-NIS | 2026-07-22 (re-verify exact booster ages pre-ship) | before each release |

## 6. Acceptance Criteria

- [x] Every source cited in `20`–`26` and the knowledge base appears here.
- [x] Governance rules (traceability, primary-source preference, no-invention, freshness) defined.
- [x] Freshness log established with review cadence.

## 7. Future Expansion

Add CDC/ACIP, UKHSA, and WHO position papers as jurisdictions expand; add postnatal/newborn and lactation sources; consider a machine-readable citation index to lint content `source_ref`s.

## 8. Dependencies

`20`–`26`, `28-MEDICAL_DISCLAIMER.md`, `docs/07-AI/101-KNOWLEDGE_BASE.md`, `knowledge-base/*`.

## 9. Open Questions

- OQ-1: Tooling to automatically lint that every KB item's `source_ref` resolves here.
- OQ-2: Whether to store citations in a structured file (e.g., BibTeX/JSON) in addition to this doc.

## 10. Risks

- R-1: Content citing stale guidance. Mitigation: BR-5 freshness log + release gate.
- R-2: Secondary-source drift. Mitigation: BR-2 primary-source preference.
