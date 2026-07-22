# 01 — Product Manifesto

| Field | Value |
|---|---|
| Document | Product Manifesto |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Principal Product Architect |
| Last Updated | 2026-07-22 |
| Related | `00-VISION.md`, `02-MISSION.md`, `03-PRODUCT_PRINCIPLES.md` |

---

## 1. Purpose

The manifesto is the *emotional and philosophical* companion to the Vision. Where the Vision defines **what** we build, the manifesto defines **the beliefs and posture** with which we build it. It is written to be quotable and usable in a design review to settle "does this feel like us?" questions. It binds engineering, design, and clinical review to a shared temperament.

## 2. Scope

Applies to every surface, decision, and word shipped under Wise Bloom Care. It does not define features (see PRD) or requirements; it defines conviction.

## 3. What We Believe

**A family's health is one continuous story.** A pregnancy is not a project that ends. A baby is not a new file. The moment of birth is a bridge, not a border. We refuse to make families re-enter their own history.

**Calm is a clinical feature.** Anxiety is the default emotional state of pregnancy and early parenthood. A product here that raises the reader's heart rate has failed, however accurate it is. Every screen should leave a tired parent slightly more reassured than they arrived.

**Educate, never diagnose.** We explain, contextualise, compare to yesterday, and point to the guideline. When a decision requires medical judgement, we hand the family gently back to their clinician. We will never let a machine pretend to be a doctor.

**Privacy is dignity.** This is the most intimate data a person will ever record: their body, their pregnancy, their child. We treat it as if it were our own family's — private by default, shared only by explicit choice, never sold, never mined.

**Truth is not optional.** Every medical statement traces to WHO, ACOG, FIGO, NICE, CDC, or an equivalent authority. When we don't know, we say so. We never invent a number to fill a gap.

**One source of truth.** No duplicated data. No duplicated logic. No "the pregnancy app says X but the baby app says Y." One record, one truth, one timeline.

**Today's storage is a footnote.** We are building a decade-long platform on a spreadsheet today because it lets us start. We architect so that swapping the engine underneath never touches the experience above.

**Warmth and rigour are not enemies.** Software can feel like a handwritten note and be engineered like a hospital system. We will not trade one for the other.

## 4. What We Refuse

- We refuse to reset the timeline at birth.
- We refuse to create a second profile for the same child.
- We refuse to mix education, recommendation, and emergency into one undifferentiated stream.
- We refuse to prescribe, diagnose, or make an emergency call for a family.
- We refuse dark patterns, engagement-baiting anxiety, and advertising against a family's health.
- We refuse to invent medical facts, or to present design decisions as clinical evidence.
- We refuse to lock ourselves to one vendor's storage.

## 5. How We Work (posture, not process)

- **Design before build.** Every module is specified before a line of production code. This repository is the proof.
- **Assume the tired parent.** Our default reviewer is a sleep-deprived parent at 3 a.m., not an engineer at a desk.
- **State assumptions out loud.** When we must assume, we write it down and mark it. Silence is not a specification.
- **Fact and design are separate.** We always label which is which.
- **Small, safe, reversible.** We ship in phases and keep the ability to migrate, roll back, and correct.

## 6. The Test of a Feature

Before anything ships, it must pass all five:

1. **Continuity** — does it respect the one-record, append-only timeline?
2. **Calm** — does it lower, not raise, the reader's anxiety?
3. **Safety** — is medical content correctly typed and non-diagnostic?
4. **Privacy** — is the data protected and access authorised and logged?
5. **Truth** — is every claim grounded and every assumption labelled?

If a feature fails any one, it is not ready — regardless of how polished it looks.

## 7. Acceptance Criteria for This Document

- [x] Expresses beliefs and refusals aligned to the Vision's pillars and invariants.
- [x] Provides an operational "test of a feature" usable in review.
- [x] Contains no feature specifications (correctly deferred to PRD/modules).

## 8. Dependencies

Downstream principles formalise this manifesto: `03-PRODUCT_PRINCIPLES.md`. Safety claims are enforced by `docs/07-AI/105-GUARDRAILS.md` and `docs/02-Research/28-MEDICAL_DISCLAIMER.md`.

## 9. Open Questions

- OQ-1: Should the manifesto be surfaced (in adapted form) to users as an "our promises" page? Deferred to `docs/09-Security/126-PRIVACY_POLICY.md` and brand.

## 10. Risks

- R-1: A manifesto with no enforcement becomes decoration. Mitigation: the "test of a feature" is referenced by the Definition of Done (`docs/11-Development/146-DEFINITION_OF_DONE.md`).
