# 125 — Incident Response

| Field | Value |
|---|---|
| Document | Incident Response |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | Security Architect |
| Last Updated | 2026-07-22 |
| Related | `120-THREAT_MODEL.md`, `126-PRIVACY_POLICY.md`, `docs/12-Operations/150-RUNBOOK.md`, `docs/04-Architecture/64-MONITORING.md` |

---

## 1. Purpose
Defines how security and privacy incidents (breaches, unauthorised access, data-integrity events) are detected, contained, eradicated, recovered from, and communicated — including breach-notification obligations. Given the sensitivity of the data, a clear incident process is essential.

## 2. Scope
Security/privacy incident lifecycle and communication. Operational (non-security) incidents: `docs/12-Operations/150`. Monitoring/alerting: `docs/04-Architecture/64`.

## 3. Incident Types
- Data breach / unauthorised access to PHI.
- Account takeover / credential compromise.
- Data-integrity events (e.g., duplicate/orphan child — continuity breach).
- Secret/key leak.
- AI safety incident (a harmful/prohibited output reaching a user).
- Provider (AI/OCR) incident.

## 4. Lifecycle (NIST-style)
1. **Detect:** via monitoring/alerts (`docs/04-Architecture/64`), audit anomalies (`docs/05-Data/75`), or reports.
2. **Triage & classify:** severity (critical = PHI breach, safety, data loss).
3. **Contain:** revoke sessions/keys, disable affected access, isolate; halt affected AI feature if safety incident.
4. **Eradicate:** fix root cause (patch, rotate secrets, correct data).
5. **Recover:** restore from backup if needed (`docs/12-Operations/151`); verify integrity; re-enable.
6. **Notify:** users/authorities per breach-notification obligations and timelines (`126`).
7. **Post-incident review:** document, learn, update controls/threat model/register.

## 5. Roles & Escalation
- On-call receives critical alerts; escalates to Security owner.
- Clear escalation for PHI breaches and safety incidents (immediate).
- Decision authority for user/regulator notification defined with legal.

## 6. Communication & Breach Notification
- Affected users notified per policy/law; transparent, calm, actionable messaging.
- Regulators notified within legally required windows (jurisdiction-dependent; `126`).
- No blame-shifting; honest disclosure of scope and remediation.

## 7. Special: Data-Integrity & AI Safety Incidents
- **Continuity breach** (duplicate/orphan child): treat as critical; contain, correct via versioning, root-cause; monitored by integrity checks (`docs/04-Architecture/64` BR-2).
- **AI safety incident** (prohibited output shipped): halt/roll back the AI feature, review guardrails/prompts, add to adversarial set, and re-gate (`docs/07-AI/105`).

## 8. Business Rules
- BR-1 Critical incidents (PHI breach, data loss, safety) escalate immediately with defined authority.
- BR-2 Containment includes session/key revocation as appropriate.
- BR-3 Breach notification follows policy/law within required timelines (`126`).
- BR-4 Every incident has a post-incident review updating controls + threat model + risk register.
- BR-5 AI safety incidents halt the feature and re-gate on guardrails.

## 9. Edge Cases
Provider-side breach (coordinate + notify); insider incident; false-positive alert (triage, don't ignore integrity alerts); incident during a release (roll back, `docs/04-Architecture/60`); simultaneous incidents (prioritise by severity).

## 10. Acceptance Criteria
- [x] Incident types + NIST-style lifecycle defined.
- [x] Roles/escalation + breach-notification obligations stated.
- [x] Special handling for continuity + AI safety incidents.
- [x] Post-incident review loop.

## 11. Future Expansion
Formal IR playbooks/runbooks, tabletop exercises, SIEM integration, on-call rotation, legal/PR templates, status page.

## 12. Dependencies
`120`, `124`, `126`, `docs/12-Operations/150`, `151`, `docs/04-Architecture/64`, `docs/07-AI/105`, `docs/01-Product/18`.

## 13. Open Questions
- OQ-1 Breach-notification timelines for launch jurisdiction.
- OQ-2 On-call/escalation staffing.

## 14. Risks
- R-1 Slow/uncoordinated response. Mitigation: BR-1 escalation + playbooks.
- R-2 Non-compliant notification. Mitigation: BR-3 legal-aligned timelines.
