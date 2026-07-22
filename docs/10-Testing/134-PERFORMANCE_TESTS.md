# 134 — Performance Tests

| Field | Value |
|---|---|
| Document | Performance Testing |
| Status | Approved (Draft 1.0) |
| Version | 1.0 |
| Owner | QA Architect / DevOps Architect |
| Last Updated | 2026-07-22 |
| Related | `130-TEST_PLAN.md`, `docs/01-Product/10-PRD.md`, `docs/04-Architecture/53-GOOGLE_APPS_SCRIPT.md`, `64-MONITORING.md` |

---

## 1. Purpose
Defines performance testing to ensure Wise Bloom Care is fast and reliable on the primary context — a mid-range phone on a poor network — and that the Google Apps Script backend stays within acceptable latency and quota limits.

## 2. Scope
Frontend load/interaction performance, API latency, and GAS quota/limit behaviour. Budgets from PRD NFR-1. Monitoring: `docs/04-Architecture/64`.

## 3. Targets (from NFR-1)
| Metric | Target |
|---|---|
| Dashboard interactive (first load) | < 2.5s on mid-range phone / 3G-class network |
| Repeat load | < 1s |
| Core API P95 latency (login, timeline, vitals, delivery) | within budget (set per baseline) |
| Chart render (vitals/growth) | smooth, no jank on mid-range device |

## 4. Test Types
- **Frontend:** Lighthouse-style/web-vitals on throttled mid-range device + slow network; bundle-size budget (islands, `docs/04-Architecture/51`).
- **API latency:** measure hot endpoints under representative data sizes (long timelines, many measurements).
- **Load/soak:** simulate concurrent users within expected v1 scale; observe GAS latency/quota behaviour.
- **Data-size scaling:** large timelines/charts (pagination/virtualisation, `docs/04-Architecture/51`).

## 5. GAS-Specific
- Verify batching/caching/locking keep latency acceptable (`docs/04-Architecture/53` §6).
- Measure quota headroom under load; identify the migration trigger threshold (RSK-9).
- Cold-start latency measured; mitigations (cache warm paths) verified.

## 6. Process
- Baseline measured; budgets enforced in CI where feasible; regressions block release.
- Performance is a release exit-gate item (`docs/01-Product/16`).
- Results feed monitoring thresholds (`docs/04-Architecture/64`).

## 7. Business Rules
- BR-1 Frontend meets NFR-1 budgets on a mid-range phone/slow network.
- BR-2 Hot API endpoints meet P95 latency budgets under representative data.
- BR-3 GAS quota headroom measured; migration threshold identified.
- BR-4 Performance regressions block release.
- BR-5 Large-data scaling (timeline/charts) verified.

## 8. Edge Cases
Very long timelines/many children; poor/intermittent networks; low-end devices; GAS throttling under load; large media (Drive) fetch.

## 9. Acceptance Criteria
- [x] Targets + test types (frontend, API, load, scaling) defined.
- [x] GAS quota/latency behaviour tested with mitigations.
- [x] Release-gate + monitoring linkage.

## 10. Future Expansion
Continuous performance CI, real-user monitoring (RUM), load testing at higher scale post-migration, chaos testing.

## 11. Dependencies
`130`, `docs/01-Product/10`, `16`, `docs/04-Architecture/51`, `53`, `64`.

## 12. Open Questions
- OQ-1 Concrete P95 latency budgets (set from baseline).
- OQ-2 Expected v1 concurrency for load tests.

## 13. Risks
- R-1 Poor mobile performance. Mitigation: BR-1 budgets + islands.
- R-2 GAS limits binding at scale. Mitigation: BR-3 threshold + migration path.
