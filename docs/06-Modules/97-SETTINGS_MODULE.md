# 97 — Settings Module

| Field | Value |
|---|---|
| Document | Settings Module Specification |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | UX Architect / Security Architect |
| Last Updated | 2026-07-22 |
| Related | `docs/09-Security/126-PRIVACY_POLICY.md`, `docs/05-Data/76-IMPORT_EXPORT.md`, `95-NOTIFICATION_MODULE.md` |

---

## 1. Purpose
Central place for the user to manage profile, privacy, notification preferences, units/locale, data export, and account controls. It is where the user exercises control and consent over their data.

## 2. Goals
Give users clear control over profile, privacy, notifications, and their data (export/erasure); surface the medical disclaimer; be simple and reassuring.

## 3. Scope
Owns: user preferences (notifications, units/locale, privacy toggles). Provides entry points to: data export (`76`), account/erasure, disclaimer/privacy (`126`), caregiver management (`96`). Out: the actual data records (owned by domain modules).

## 4. Functional Requirements
- FR-1 Manage profile (name, contact) and units/locale (kg/lb, mg/dL/mmol/L, language) — canonical storage unchanged (`docs/05-Data/72`).
- FR-2 Manage notification preferences (types, quiet hours, opt-outs) (`95`).
- FR-3 Manage privacy: view disclaimer/privacy policy; manage consent; access caregiver sharing (`96`).
- FR-4 Export data (`76`); request account/data erasure (`74`).
- FR-5 Account controls: change credential, sessions/logout, delete account.

## 5. Non-Functional Requirements
Clear, reassuring; accessible; privacy-first defaults; changes audited where security-relevant.

## 6. Architecture
SettingsService owns preferences; delegates export/erasure to data modules; surfaces disclaimer/privacy content; security-relevant changes audited.

## 7. User Flow
Settings → adjust units/notifications/privacy → export or manage account → confirm disclaimer/consent.

## 8. Data Model
`user_preferences(user_id, units, locale, notif_prefs, privacy_prefs)` (`docs/05-Data/70`).

## 9. Business Rules
- BR-1 Privacy-first defaults (sharing off; minimal data).
- BR-2 Units/locale affect display only; canonical storage unchanged (`docs/05-Data/72` BR-1).
- BR-3 Export always available; erasure honoured per policy (`docs/05-Data/74`).
- BR-4 Security-relevant changes (credential, sessions, erasure) authenticated + audited.
- BR-5 Disclaimer/privacy always accessible (`docs/02-Research/28` BR-5).

## 10. Edge Cases
Unit change mid-history (display converts; data unchanged); locale without full translation (fallback); erasure request (confirmation + export offer); caregiver managing settings (scope-limited); account deletion (grace period, `docs/05-Data/74`).

## 11. Acceptance Criteria
- [x] Profile/units/locale/notifications/privacy management.
- [x] Export + erasure entry points; disclaimer/privacy accessible.
- [x] Privacy-first defaults; audited security changes.

## 12. Future Expansion
MFA management, connected devices, data-controls dashboard ("who saw my data"), theme selection, language expansion, accessibility preferences.

## 13. Dependencies
`95`, `96`, `docs/05-Data/72`, `74`, `76`, `docs/09-Security/126`, `docs/02-Research/28`.

## 14. Open Questions
- OQ-1 Default unit/locale by jurisdiction.
- OQ-2 Theme/dark-mode toggle in v1.

## 15. Risks
- R-1 Confusing data controls. Mitigation: clear, reassuring UX + BR-3.
- R-2 Unaudited sensitive changes. Mitigation: BR-4 audit.
