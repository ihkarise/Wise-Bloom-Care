# 95 — Notification Module

| Field | Value |
|---|---|
| Document | Notification Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Enterprise Architect / UX Architect |
| Last Updated | 2026-07-22 |
| Related | `85-MEDICINES_MODULE.md`, `92-VACCINATION_MODULE.md`, `91-MILESTONES_MODULE.md`, `97-SETTINGS_MODULE.md` |

---

## 1. Purpose
The reminders/alerts engine: it schedules and delivers gentle reminders across appointments, medicines, vaccinations, and milestones, respecting user preferences. Reminders are calm and non-coercive (never anxiety-gamified).

## 2. Goals
Timely, gentle reminders; user-controlled preferences; deep-linking to the relevant action; no coercion or manufactured urgency.

## 3. Scope
Owns: `notifications` queue/log + scheduling. Uses: source modules (appointments/medicines/vaccination/milestones), settings prefs. Out: emergency decisioning (emergencies are curated content, not auto-alerts, NG-3).

## 4. Functional Requirements
- FR-1 Schedule reminders from source-module data (appointment times, medicine schedules, vaccine ages, milestone ages).
- FR-2 Deliver via supported channels (in-app; others per platform capability).
- FR-3 Respect user notification preferences (`97`): types, quiet hours, opt-outs.
- FR-4 Deep-link each reminder to its action.
- FR-5 Consolidate to avoid overload (calm ceiling).

## 5. Non-Functional Requirements
Gentle, non-coercive (NG-10); accessible; reliable scheduling; no PHI in notification payloads beyond necessity.

## 6. Architecture
NotificationService schedules (e.g., GAS time-driven triggers or client-side, `docs/04-Architecture/53` OQ-1) and delivers; reads source data; respects prefs; logs delivery.

## 7. User Flow
Source event (e.g., due medicine) → reminder → user taps → action; preferences adjustable in settings.

## 8. Data Model
`notifications(notif_id, subject_id, type, source_ref, scheduled_at, delivered_at, status)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Reminders are gentle and non-coercive; no streaks/shame (NG-10).
- BR-2 Respect user preferences and quiet hours (`97`).
- BR-3 Consolidate to avoid overload (calm ceiling, mirrors dashboard).
- BR-4 The system does not raise emergency alerts by inference; emergencies are curated content only (`docs/02-Research/28` BR-4).
- BR-5 Minimal PHI in payloads; sensitive detail behind auth in-app.

## 10. Edge Cases
Many overlapping reminders (consolidate); user opted out (respect; still show in-app lists); missed/failed delivery (retry/log); time-zone/DST (schedule in user local time); offline (queue, future).

## 11. Acceptance Criteria
- [x] Scheduling from source modules + preference-respecting delivery.
- [x] Gentle, consolidated, deep-linked reminders.
- [x] No inferred emergency alerts; minimal-PHI payloads.

## 12. Future Expansion
Push notifications (PWA), email/SMS channels, smart timing, caregiver-directed reminders, snooze/critical distinctions.

## 13. Dependencies
`85`, `91`, `92`, appointments (via `81`), `97`, `docs/04-Architecture/53`, `docs/02-Research/28`.

## 14. Open Questions
- OQ-1 Scheduling mechanism (GAS triggers vs client vs external).
- OQ-2 Channels supported in v1 (likely in-app).

## 15. Risks
- R-1 Coercive/overwhelming reminders. Mitigation: BR-1/BR-3.
- R-2 PHI in payloads. Mitigation: BR-5 minimal payloads.
