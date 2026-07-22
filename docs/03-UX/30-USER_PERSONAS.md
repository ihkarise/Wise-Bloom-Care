# 30 — User Personas

| Field | Value |
|---|---|
| Document | User Personas |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `31-USER_JOURNEYS.md`, `docs/01-Product/10-PRD.md`, `docs/00-Vision/00-VISION.md` |

---

## 1. Purpose

Defines the people Wise Bloom Care serves: their goals, contexts, anxieties, and needs. Personas keep design and engineering decisions anchored to real human situations rather than abstract features. They are the "who" behind every requirement in the PRD.

## 2. Scope

Covers primary and secondary personas for v1–v2 and names the future clinician persona (v3). Personas are archetypes, not real individuals; they are informed by the maternal-child domain and the product's continuity thesis.

## 3. Primary Persona — Aisha, the Expecting Mother

- **Snapshot:** 29, first pregnancy, ~18 weeks. Works full-time. Smartphone-first; limited time; moderate health literacy.
- **Goals:** Keep everything about her pregnancy in one calm place; understand whether things are "normal"; not miss appointments, medicines, or tests; understand her lab/ultrasound reports without panic.
- **Anxieties:** Fear of doing something wrong; information overload; conflicting advice online; losing records.
- **Context of use:** Short sessions on a phone — waiting rooms, evenings, commutes; sometimes poor connectivity.
- **Needs from the product:** Timeline-first clarity; gentle reminders; trustworthy, sourced information; simple, forgiving data entry; reassurance.
- **Success looks like:** She feels organised and calmer; nothing important slips; she arrives at appointments prepared.

## 4. Primary Persona (later stage) — Meera, the New Mother

- **Snapshot:** Same account holder as pregnancy, now postpartum with a newborn. Sleep-deprived; managing her own recovery *and* the baby.
- **Goals:** Not start over after birth; track baby's growth, feeding, sleep, and vaccinations; keep her own postpartum recovery visible; know what's normal for the newborn.
- **Anxieties:** Is the baby growing/feeding okay? Am I recovering okay? Overwhelm.
- **Context:** Very short, one-handed sessions at odd hours; high fatigue.
- **Needs:** Continuity (no reset); parallel maternal+newborn views; extremely low-friction logging; calm, non-judgemental tone; vaccination/milestone reminders.
- **Success:** The record simply continued; she trusts the growth/vaccination tracking; logging takes seconds.

## 5. Secondary Persona — Ravi, the Partner/Caregiver

- **Snapshot:** 32, partner of the account holder. Wants to help and stay informed.
- **Goals:** Know upcoming appointments; help manage reminders; feel involved.
- **Anxieties:** Feeling like a bystander; not knowing how to help.
- **Context:** Occasional use; wants glanceable status.
- **Needs:** A shared family dashboard with explicit, granted, revocable access; clear "next things"; respectful of the account holder's control.
- **Success:** He knows what's coming and can help without needing to ask.

## 6. Future Persona (v3) — Dr. Nair, the Clinician

- **Snapshot:** Obstetrician/paediatrician; time-poor; sees the family periodically.
- **Goals (future):** Quickly review a family's continuous, structured record; contribute structured notes.
- **Needs (future):** A dedicated portal, strict RBAC, and clear provenance; never burdened with consumer noise.
- **Note:** Out of v1 scope; the architecture must not preclude this persona (`docs/13-Future`).

## 7. Anti-Personas (who we are NOT designing for)

- The user seeking a **diagnosis** or **prescription** from an app (we redirect to clinicians; NG-1/NG-2).
- The user wanting a **social feed** or **public sharing** of pregnancy (out of scope; NG-8).
- The **data broker / advertiser** (never a customer; NG-9).

## 8. Cross-Persona Needs

- Calm, reassuring tone (all personas are anxious or tired).
- One-handed, mobile-first, low-friction interaction.
- Trust: sourced content, privacy, no dark patterns.
- Continuity: the record follows the family, never resets.

## 9. Business Rules

- BR-1: Every "Must" PRD feature maps to a primary-persona goal.
- BR-2: Caregiver access (Ravi) is always explicit, granted, and revocable by the account holder.
- BR-3: No design may assume high health literacy or unlimited time/attention.

## 10. Acceptance Criteria

- [x] Primary, secondary, future, and anti-personas defined.
- [x] Each persona has goals, anxieties, context, needs, and success.
- [x] Continuity and calm needs are explicit across personas.

## 11. Future Expansion

Add personas for multi-child families, single parents, LGBTQ+ families and inclusive language needs, low-connectivity/low-literacy users, and the clinician persona set as the portal is scoped.

## 12. Dependencies

`31-USER_JOURNEYS.md`, `docs/01-Product/10-PRD.md`, `docs/03-UX/40-ACCESSIBILITY.md`.

## 13. Open Questions

- OQ-1: Is the caregiver persona (Ravi) in v1 or v2? (mirrors PRD OQ-2).
- OQ-2: Inclusive terminology for the birthing parent (see Glossary OQ-1).

## 14. Risks

- R-1: Designing for an idealised, attentive user. Mitigation: BR-3 tired-parent default; anti-personas.
