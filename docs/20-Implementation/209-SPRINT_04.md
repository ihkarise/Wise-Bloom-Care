# 209 — Sprint 04: Delivery Engine (★ Keystone)

| Field | Value |
|---|---|
| Sprint | 04 — Delivery transition: automatic linked baby creation, timeline continuity |
| Status | Planned |
| Milestone | MS-1.7 (keystone) (`204` §4) |
| Layers | L5 (`202` §3) — the critical-path keystone |
| Ships toward | v1 (MVP) — v1 cannot ship without this |
| Architecture Baseline | `v1.0.0-Architecture` (FROZEN) |
| Estimated effort | 2.5 weeks · 2 senior BE + 1 FE + dedicated QA on integrity |

---

## 1. Purpose

Implement **the single most important moment in the product**: the delivery transition, where the pregnancy timeline and the child timeline meet as one continuous stream. `DeliveryService` is the **sole creator** of a child record, writes the **immutable** mother link, is **idempotent**, and handles **loss** compassionately. This sprint is isolated precisely because it is the keystone and highest-risk element (`200` §3.1, `111` R-1). It ships **only** the transition — child-scoped modules come in Sprint 05.

## 2. Objectives

1. `DeliveryService`: on live birth, atomically create ChildRecord(s) with immutable `mother_id` + `episode_id`, append a bridging delivery Event, audit (`88`, `111`, `56` §6).
2. Idempotency: retries never create duplicate children (`56` BR-2, `111` §6).
3. Loss path: close the PregnancyEpisode terminally **without** creating a child; no baby prompts (`111` §5, BR-7).
4. Multiple births: one episode, one delivery Event, multiple distinct children (`71` §9).
5. Continuity: the timeline never resets; postpartum + newborn events continue the same stream (`111` §4).
6. Integrity monitoring: 0 duplicate/orphan children (KPI M1, `64`); rollback runbook exercised (`150`).

## 3. Architecture References

`docs/06-Modules/88` (Delivery module), `docs/08-Timeline/111` (delivery transition — the hinge), `110`,`112`,`113`; `docs/04-Architecture/56` §6 (delivery endpoint), `52` §6 (sole creator/append-only), `64` (integrity KPIs); `docs/05-Data/71` §5–§7 (episode↔child, immutability, integrity), `77` (versioning); `docs/12-Operations/150` (rollback runbook); `docs/00-Vision` BR-V2.

## 4. Files Created

```
apps/backend/src/services/DeliveryService.ts
apps/backend/src/services/ChildService.ts  (minimal: creation via Delivery only + read; full module in Sprint 05)
apps/backend/src/controllers/deliveryController.ts
apps/backend/src/adapters/sheets/tables/{children,deliveries}.ts
apps/backend/src/adapters/sheets/integrity/{immutable-mother-link,idempotency,episode-child-link}.ts
apps/backend/tests/services/delivery.test.ts
apps/backend/tests/integration/{delivery-idempotency,delivery-loss,multiple-births,timeline-bridge}.test.ts
apps/web/src/features/delivery/{DeliveryIsland.tsx,LossPath.tsx,TransitionMoment.tsx}
apps/web/src/api/delivery.ts
tests/integrity/{no-duplicate-children,no-orphan-children,mother-link-immutable,timeline-continuity-across-delivery}.test.ts
```

## 5. Files Modified

- `packages/domain-types` — `ChildRecord` (immutable `mother_id`, `episode_id`), `DeliveryRecord`, `DeliveryOutcome` (live|loss) (from `71`,`72`).
- `packages/api-contract` — `POST /v1/delivery` (idempotency key; newborn[s] or loss), `GET /v1/children`.
- `SheetsStorageAdapter.ts` — children/deliveries persistence with immutability + idempotency + episode↔child integrity (`71` §7).
- `PregnancyService.ts` — episode state machine transitions Active→Delivered|Loss (`111` §3.2); episode cannot re-point mother link.
- `TimelineView.tsx` — render the bridging delivery event across subjects.
- No architecture docs.

## 6. Tasks

1. Implement `DeliveryService.record(...)`:
   - **Live birth:** atomically create ChildRecord(s) `{mother_id immutable, episode_id}`; append one delivery Event bridging episode↔child(ren); audit as an integrity event (`111` §3.1).
   - **Loss:** close episode terminally, append compassionate outcome Event, no child (`111` §5, BR-7).
2. Enforce **idempotency** with the request idempotency key: a retry returns the same children, never new ones (`56` BR-2). Store idempotency records in the adapter.
3. Enforce **immutability** of `mother_id` at the adapter integrity layer: any update attempt is rejected (`71` CC-1).
4. Enforce **episode↔child linkage** and **no-duplicate-child** invariants (`71` CC-2/CC-4).
5. Support **multiple births**: one Event, N children under one episode (`71` §9).
6. Wire the episode state machine in `PregnancyService` (Active→Delivered|Loss); versioned corrections to delivery details cannot re-point the mother link (`111` §8).
7. Emit integrity metrics for monitoring (0 duplicate/orphan — KPI M1, `64`).
8. Frontend: delivery capture island (mode/GA-at-birth/metrics/Apgar; one-or-many newborns), compassionate loss path (no baby prompts), calm+celebratory transition moment (`111` OQ-1).
9. Exercise the delivery-path **rollback runbook** on staging (`150`).
10. Tests per §9 — integrity tests are release-blocking.

## 7. Deliverables

- `POST /v1/delivery` creates linked child(ren) exactly once, with immutable mother link, on the continuous timeline (MS-1.7).
- Loss path closes the episode compassionately with no child.
- Multiple-birth support; idempotent retries; integrity monitoring live.
- Frontend transition + loss experiences.

## 8. Acceptance Criteria

- [ ] A live-birth delivery auto-creates the linked baby profile with immutable `mother_id`; the timeline continues unbroken (MS-1.7, `111` §3).
- [ ] **0 duplicates:** submitting the same delivery twice (same idempotency key, and a retry-after-timeout scenario) yields exactly one child set (`56` BR-2, verified by `delivery-idempotency` + `no-duplicate-children`).
- [ ] **0 orphans:** every created child links to a mother and an episode (`no-orphan-children`).
- [ ] Attempting to change a child's `mother_id` is rejected at the adapter (`mother-link-immutable`).
- [ ] Loss outcome creates **no** child and shows no baby prompts (`delivery-loss`, BR-7).
- [ ] Multiple births produce N distinct children under one episode/Event (`multiple-births`).
- [ ] The timeline spans maternal (postpartum) + child (newborn) as one stream (`timeline-continuity-across-delivery`).
- [ ] The delivery rollback runbook has been executed successfully on staging (`150`).

## 9. Testing (see `214` §4 — safety-critical)

- **Unit:** DeliveryService live/loss/multiple; episode state machine; idempotency key handling.
- **Integration:** idempotent retry; loss path; multiple births; timeline bridge event.
- **Integrity (release-blocking):** no-duplicate-children, no-orphan-children, mother-link-immutable, timeline-continuity-across-delivery — these map to KPI M1/M2 and gate the release (`130` §4).
- **Security:** delivery authorised + audited as an integrity event (`75`).
- **e2e:** pregnancy → record delivery → baby profile appears, timeline continues; separately, loss path.
- **a11y:** delivery + loss flows pass AA; loss path copy reviewed for compassion (`40`, `111` R-2).

## 10. Risks

- R-1: Reset/duplicate/orphan breaking continuity (`111` R-1, RSK-2). Mitigation: idempotency + immutability + integrity tests + monitoring (Tasks 2–4, 7; §9 release-blocking).
- R-2: Emotional harm on the loss path (`111` R-2). Mitigation: BR-4 compassionate design; no forced baby prompts; copy review.
- R-3: Partial failure mid-transition (`52` §10). Mitigation: atomic create + compensating logic + audit + rollback runbook (Task 9, `150`).
- R-4: Concurrent delivery submissions. Mitigation: idempotency + version/conflict handling (`56` §11 `409 conflict`).

## 11. Rollback

- **Dedicated runbook** (`docs/12-Operations/150`) because of criticality (`16` §6): backend repoint to prior GAS version; if a bad delivery record was written, use the documented compensating procedure; restore the environment spreadsheet from verified backup if integrity is compromised (`151`, `62`). Delivery must be forward-safe and reversible where feasible (`16` §6). Feature-flag the delivery endpoint so it can be disabled while preserving the rest of v1.

## 12. Definition of Done

Per `217`/`146` **plus** the keystone bar: MS-1.7 exit gate met (auto-create linked baby, 0 duplicates, loss path works); all integrity tests green; monitoring shows 0 duplicate/orphan; rollback runbook exercised; a11y + compassion review done; no PHI/secrets; docs in sync; reviewed; deployable. Per `15` BR-2, **v1 cannot ship without this sprint's exit gate.**

## 13. Dependencies

Depends on: Sprint 01 (Timeline, Pregnancy/Episode, Audit), Sprint 03 (a populated pregnancy record to deliver from). Blocks: Sprint 05 (all child-scoped modules — `202` gate G-4, `203` §5) and the v1 release entirely.
