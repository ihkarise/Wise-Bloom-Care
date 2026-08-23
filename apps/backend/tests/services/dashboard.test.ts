/**
 * DashboardService tests (docs/20-Implementation/207 §9 unit: "dashboard
 * assembly"; §8: renders status + metrics + recent timeline reading from
 * services, with zero cross-module writes — 81 §1).
 */

import { describe, expect, it } from 'vitest';

import { DashboardService } from '../../src/services/DashboardService';
import { FamilyService } from '../../src/services/FamilyService';
import { MaternalService } from '../../src/services/MaternalService';
import { PregnancyService } from '../../src/services/PregnancyService';
import { TimelineService } from '../../src/services/TimelineService';
import { TrendService } from '../../src/services/TrendService';
import { VitalsService } from '../../src/services/VitalsService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function setup() {
  const storage = createInMemoryAdapter();
  const family = new FamilyService(storage).createFamily('user-1');
  const maternalSvc = new MaternalService(storage);
  const maternal = maternalSvc.createMaternalRecord(family.family_id, { name: 'Jane' });
  const pregnancy = new PregnancyService(storage);
  const timeline = new TimelineService(storage);
  const trend = new TrendService();
  const vitals = new VitalsService(storage, timeline, trend);
  const dashboard = new DashboardService({
    storage,
    timeline,
    trend,
    maternal: maternalSvc,
    pregnancy,
  });
  return { storage, family, maternal, pregnancy, timeline, vitals, dashboard };
}

describe('DashboardService.build', () => {
  it('returns a calm empty shell before any data — no faked trends, no BP tile', () => {
    const { family, dashboard } = setup();
    const summary = dashboard.build(family.family_id, '2026-03-15');
    expect(summary.status.life_stage).toBe('pregnancy');
    expect(summary.metrics).toEqual([]);
    expect(summary.blood_pressure).toBeUndefined();
    expect(summary.recent_timeline).toEqual([]);
  });

  it('surfaces gestational weeks from the active pregnancy episode', () => {
    const { family, maternal, pregnancy, dashboard } = setup();
    pregnancy.createEpisode(maternal.maternal_id, { lmp: '2026-01-01' });
    const summary = dashboard.build(family.family_id, '2026-01-15');
    expect(summary.status.pregnancy_weeks).toBe(2); // 14 days = 2 weeks
  });

  it('builds single-value metric tiles and a paired BP tile from logged vitals', () => {
    const { family, maternal, vitals, dashboard } = setup();
    const at = { familyId: family.family_id, subjectId: maternal.maternal_id, createdBy: 'user-1' };
    vitals.logVital({ ...at, type: 'weight', value: 60, measuredAt: '2026-03-01T08:00:00.000Z' });
    vitals.logVital({ ...at, type: 'weight', value: 61, measuredAt: '2026-03-08T08:00:00.000Z' });
    vitals.logBloodPressure({
      ...at,
      systolic: 118,
      diastolic: 76,
      measuredAt: '2026-03-08T09:00:00.000Z',
    });

    const summary = dashboard.build(family.family_id, '2026-03-15');
    const weight = summary.metrics.find((m) => m.vital_type === 'weight');
    expect(weight?.trend.delta).toBe(1);
    expect(weight?.trend.direction).toBe('up');
    expect(summary.blood_pressure?.systolic.current?.value).toBe(118);
    expect(summary.recent_timeline.length).toBeGreaterThan(0);
  });

  it('previews recent timeline events newest first', () => {
    const { family, maternal, vitals, dashboard } = setup();
    const at = { familyId: family.family_id, subjectId: maternal.maternal_id, createdBy: 'user-1' };
    vitals.logVital({ ...at, type: 'weight', value: 60, measuredAt: '2026-03-01T08:00:00.000Z' });
    vitals.logVital({
      ...at,
      type: 'blood_sugar',
      value: 90,
      measuredAt: '2026-03-05T08:00:00.000Z',
    });

    const summary = dashboard.build(family.family_id, '2026-03-15');
    expect(summary.recent_timeline[0]?.occurred_at).toBe('2026-03-05T08:00:00.000Z');
  });

  it('writes nothing — aggregation only (81 §1, 13 BR-1)', () => {
    const { storage, family, maternal, vitals, dashboard } = setup();
    vitals.logVital({
      familyId: family.family_id,
      subjectId: maternal.maternal_id,
      createdBy: 'user-1',
      type: 'weight',
      value: 60,
      measuredAt: '2026-03-01T08:00:00.000Z',
    });
    const eventsBefore = storage.query('Event', { family_id: family.family_id }).length;
    const vitalsBefore = storage.query('Vital', { subject_id: maternal.maternal_id }).length;

    dashboard.build(family.family_id, '2026-03-15');
    dashboard.build(family.family_id, '2026-03-15');

    expect(storage.query('Event', { family_id: family.family_id })).toHaveLength(eventsBefore);
    expect(storage.query('Vital', { subject_id: maternal.maternal_id })).toHaveLength(vitalsBefore);
  });
});
