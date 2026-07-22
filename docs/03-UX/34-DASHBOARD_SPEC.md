# 34 — Dashboard Specification

| Field | Value |
|---|---|
| Document | Dashboard Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect |
| Last Updated | 2026-07-22 |
| Related | `32-INFORMATION_ARCHITECTURE.md`, `33-NAVIGATION.md`, `docs/06-Modules/81-DASHBOARD_MODULE.md`, `35-DESIGN_SYSTEM.md` |

---

## 1. Purpose

Specifies the Dashboard — the product's home surface and the answer to "what do I need to know and do right now?". It is dashboard-first and timeline-aware, calm, glanceable, and adapts to life stage.

## 2. Scope

Layout, card types, prioritisation logic, life-stage adaptation, and states of the Dashboard. Data/logic ownership is in `docs/06-Modules/81-DASHBOARD_MODULE.md`; visual tokens in `35-DESIGN_SYSTEM.md`.

## 3. Goals

- Convey current status, next actions, and recent history in one calm glance.
- Reduce anxiety: lead with reassurance and "you're on track", not raw alarming data.
- Adapt to the life stage (pregnancy / postpartum+newborn / infancy) without a reset.

## 4. Layout (mobile-first, top → bottom)

1. **Greeting & status header:** warm greeting; current life-stage summary (e.g., "Week 20 · second trimester" or "Baby: 3 months"). For multiple children, a compact selector.
2. **"Right now" card:** the single most important next action (next appointment, due medicine, upcoming vaccination, or a gentle nudge). One primary focus.
3. **Next things:** a short, prioritised list of upcoming items (appointments, medicines, vaccinations, milestones).
4. **Key metrics row:** compact metric tiles (e.g., latest BP, weight trend, baby growth percentile) — each shows current + trend direction, calm colouring, tap-through to detail.
5. **Recent timeline:** the last few timeline events, tappable, with "view full timeline".
6. **Knowledge card:** one contextual, sourced educational card for the current life stage (dismissible).
7. **Assistant entry (v2):** gentle prompt to ask the educational assistant.

## 5. Card Types

| Card | Purpose | Rules |
|---|---|---|
| Status header | Orient the user | Never alarming; plain life-stage language |
| Right-now | One key next action | Exactly one primary; deep-links |
| Next-things | Upcoming items | Prioritised; gentle; ≤5 shown |
| Metric tile | Current + trend | Calm colours; no diagnosis; tap → chart |
| Timeline preview | Recent history | Read-only preview; links to Timeline |
| Knowledge | Educational context | Typed Educational; cites source; dismissible |
| Emergency (conditional) | Surfaced red-flag info | Reserved styling; only from curated set; never auto-inferred |

## 6. Prioritisation Logic

- Time-sensitivity first (overdue/next appointments, due medicines, imminent vaccinations).
- Then continuity-relevant items (e.g., post-delivery: newborn feeding/growth prompts + maternal recovery).
- Calm ceiling: cap the number of surfaced "to-dos" to avoid overwhelm; overflow lives in modules.
- Never fabricate urgency; no manufactured streaks/badges (NG-10).

## 7. Life-Stage Adaptation

- **Pregnancy:** week context, vitals trends, appointments, week knowledge.
- **Delivery transition:** a warm acknowledgement; Child context appears; timeline continues.
- **Postpartum + newborn (parallel):** maternal recovery items + newborn feeding/sleep/growth/vaccination.
- **Infancy/toddler:** growth, milestones, vaccination, journal.

## 8. States

- **First run:** friendly setup guidance; explains sections; no empty walls.
- **Sparse data:** show what exists; invite gentle logging; never fake trends.
- **Loading:** skeleton cards.
- **Loss path:** compassionate, stripped-down dashboard; no baby prompts; supportive resources.

## 9. Business Rules

- BR-1: Exactly one primary "right now" focus per Dashboard render.
- BR-2: Metric tiles never show diagnostic labels; only current + trend + calm framing (`docs/02-Research/28`).
- BR-3: Emergency card appears only from the curated set, never auto-generated from user values (BR-4 of medical disclaimer).
- BR-4: Dashboard adapts to life stage from the single record; no reset at delivery.
- BR-5: To-do surfacing capped to protect calm.

## 10. Edge Cases

- Multiple children → clear selector; per-child metrics.
- Overdue items pile-up → consolidate calmly; avoid alarm cascade.
- Caregiver view → scoped to granted access; sensitive items respect permissions.
- Offline (future) → cached last state; queued actions indicated.

## 11. Acceptance Criteria

- [x] Layout and card types specified with rules.
- [x] Prioritisation and life-stage adaptation defined.
- [x] Calm/anti-alarm rules and emergency-card constraint stated.
- [x] States (first run, sparse, loss) covered.

## 12. Future Expansion

Personalised card ordering, AI-generated (typed, guarded) summaries, widgets/quick-add, and a caregiver-optimised dashboard variant.

## 13. Dependencies

`docs/06-Modules/81-DASHBOARD_MODULE.md`, `35-DESIGN_SYSTEM.md`, `docs/07-AI/*` (v2), `docs/02-Research/28`.

## 14. Open Questions

- OQ-1: Default post-delivery dashboard emphasis (maternal vs. child vs. smart).
- OQ-2: Whether metric tiles are user-configurable in v1.

## 15. Risks

- R-1: Dashboard overwhelm. Mitigation: one primary focus + capped to-dos (BR-1/BR-5).
- R-2: Alarming metric presentation. Mitigation: BR-2 calm framing.
