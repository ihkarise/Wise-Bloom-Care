# 31 — User Journeys

| Field | Value |
|---|---|
| Document | User Journeys |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `30-USER_PERSONAS.md`, `32-INFORMATION_ARCHITECTURE.md`, `34-DASHBOARD_SPEC.md`, `docs/08-Timeline/*`, `docs/06-Modules/*` |

---

## 1. Purpose

Describes the end-to-end journeys through Wise Bloom Care, emphasising the continuity thesis (one record across the delivery transition). Each journey lists the steps, the emotional state, the modules involved, and the continuity/safety touchpoints, so designers and engineers share one mental model of the flows.

## 2. Scope

The core journeys spanning conception → pregnancy → delivery transition → postpartum/newborn → infancy. Detailed screen specs live in module and dashboard docs; timeline mechanics in `docs/08-Timeline/*`.

## 3. Journey Map (overview)

```
Onboard → Start pregnancy → Track (vitals/meds/appts/reports/knowledge)
   → Delivery event → [AUTO] linked baby profile → Postpartum + Newborn (parallel)
   → Infancy (growth/milestones/vaccination/feeding/sleep/journal) → continuing timeline
```

## 4. Core Journeys

### J1 — Onboarding & starting the journey
1. Register / authenticate (`80-AUTH`); acknowledge medical disclaimer (`docs/02-Research/28`).
2. Set up the maternal record: name, LMP or EDD (or "I don't know yet"), basic profile.
3. Dashboard seeds with gestational context and first "next things".
- **Emotion:** hopeful, slightly overwhelmed. **Design:** minimal fields, forgiving, reassuring; never block on unknown dates (Principle P9).

### J2 — Daily / weekly tracking
1. Open dashboard → see current status + next actions + recent timeline.
2. Log a vital (BP/weight/blood sugar) → see current / previous / trend.
3. Optionally read the week's knowledge card (educational, sourced).
- **Emotion:** seeking reassurance. **Design:** logging in seconds; trends framed calmly; no alarming colours (`35-DESIGN_SYSTEM`).

### J3 — Appointments & reports
1. Add an appointment → receive gentle reminders (`95-NOTIFICATION`).
2. After a visit, upload a lab/ultrasound report (`84-REPORTS`).
3. (v2) AI explains the report in educational terms + clinician-review; a visit summary is added to the timeline.
- **Emotion:** anxious about results. **Design:** reports stored safely; explanations never diagnose; source-typed content.

### J4 — The delivery transition (keystone)
1. Record the delivery event (mode, GA at birth, birth metrics, Apgar) (`88-DELIVERY`).
2. **Automatically**, the baby profile is created and permanently linked to the mother — no new account, no migration, no duplicate (Vision BR-V2).
3. The timeline **continues**; postpartum (maternal) and newborn (infant) views appear in parallel.
- **Emotion:** joy, exhaustion, sometimes fear. **Design:** the most carefully designed moment; continuity must be visible and effortless; compassionate handling of loss (see J6).

### J5 — Newborn & infancy care
1. Log growth → WHO percentile chart (`90-GROWTH`).
2. Milestone prompts appear by (corrected) age (`91-MILESTONES`); caregiver marks achieved/not-yet/not-sure.
3. Vaccination reminders by schedule (`92-VACCINATION`); mark doses given.
4. Log feeding/sleep; add journal moments (`93-JOURNAL`).
- **Emotion:** tired, protective. **Design:** one-handed, ultra-low-friction; celebrate milestones; calm on not-yet-met + clinician-review.

### J6 — Compassionate paths (edge journeys)
- **Pregnancy loss:** the journey can reach a compassionate terminal state **without** forcing a baby profile (BR-7); tone is gentle; no reminders that would cause harm; data is preserved unless the user chooses otherwise. (`88-DELIVERY`.)
- **Complications / NICU:** the timeline accommodates extended/irregular events; never scolds; surfaces support resources (educational) and clinician-review.
- **Retrospective onboarding:** user joins at 30 weeks or post-birth; the flow reconstructs the timeline from provided data without blocking (P9).

### J7 — Caregiver involvement
1. Account holder grants a caregiver explicit, revocable access (`96-FAMILY`).
2. Caregiver sees a shared family dashboard (glanceable status + next things).
- **Design:** privacy-first; access is opt-in and auditable (`docs/05-Data/75-AUDIT_LOGS`).

## 5. Continuity & Safety Touchpoints (per journey)

| Journey | Continuity touchpoint | Safety touchpoint |
|---|---|---|
| J1 | Single record created | Disclaimer acknowledged |
| J2 | Append-only timeline events | Calm trend framing; no diagnosis |
| J3 | Visit summary joins timeline | Report explanation typed + clinician-review |
| J4 | Auto-linked baby profile; timeline continues | Loss path; no duplicate profiles |
| J5 | Child timeline is same record | Milestones non-diagnostic; vaccination = record+remind |
| J6 | History preserved | Compassionate tone; support resources |
| J7 | Same record, shared | Explicit, revocable, audited access |

## 6. Business Rules

- BR-1: No journey creates a second profile for an existing person (Vision BR-V2).
- BR-2: No journey blocks progress on a missing non-critical field (P9).
- BR-3: Every journey step that surfaces medical content applies content typing (`docs/02-Research/28`).
- BR-4: The delivery transition (J4) is designed and tested as the keystone experience (MS-1.7).

## 7. Edge Cases

- Multiple births in J4 → one delivery event links multiple children.
- Revised due date mid-journey → gestational context recomputed; history versioned.
- Caregiver access revoked mid-journey → immediate effect; audit logged.
- Offline capture (future) → events queue and sync without breaking continuity.

## 8. Acceptance Criteria

- [x] All core journeys mapped with steps, emotion, modules.
- [x] Delivery transition detailed as the keystone with auto-linked profile.
- [x] Compassionate/edge journeys included (loss, complications, retrospective).
- [x] Continuity + safety touchpoints tabulated per journey.

## 9. Future Expansion

Add clinician-portal journeys, offline journeys, multi-child family journeys, and richer AI-assisted journeys (visit prep, summaries) as those ship.

## 10. Dependencies

`30-USER_PERSONAS.md`, `34-DASHBOARD_SPEC.md`, `docs/06-Modules/*`, `docs/08-Timeline/*`.

## 11. Open Questions

- OQ-1: Caregiver journey (J7) in v1 or v2.
- OQ-2: Exact loss-path flow wording — requires compassionate-design + clinical review.

## 12. Risks

- R-1: Delivery transition feeling like a reset. Mitigation: BR-4 keystone design/test.
- R-2: Loss path causing harm. Mitigation: J6 compassionate design gate.
