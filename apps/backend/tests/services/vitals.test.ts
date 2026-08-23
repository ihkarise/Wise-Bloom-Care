/**
 * VitalsService tests (docs/20-Implementation/207 §9 unit: "vitals
 * validation/formula-guard"; §8: logging a vital returns the created record +
 * trend; BP is two rows sharing measured_at, paired into one logical reading).
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/lib/validation';
import { FamilyService } from '../../src/services/FamilyService';
import { TimelineService } from '../../src/services/TimelineService';
import { TrendService } from '../../src/services/TrendService';
import { VitalsService } from '../../src/services/VitalsService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function setup() {
  const storage = createInMemoryAdapter();
  const family = new FamilyService(storage).createFamily('user-1');
  const timeline = new TimelineService(storage);
  const vitals = new VitalsService(storage, timeline, new TrendService());
  return { storage, family, timeline, vitals };
}

const base = {
  familyId: '',
  subjectId: 'maternal-1',
  createdBy: 'user-1',
};

describe('VitalsService.logVital', () => {
  it('persists a weight vital, appends a vital timeline event, and returns a trend', () => {
    const { storage, family, vitals } = setup();
    const result = vitals.logVital({
      ...base,
      familyId: family.family_id,
      type: 'weight',
      value: 61.5,
      measuredAt: '2026-03-01T08:00:00.000Z',
    });

    expect(result.vital.type).toBe('weight');
    expect(result.vital.unit).toBe('kg'); // canonical default
    expect(storage.get('Vital', result.vital.vital_id)).not.toBeNull();
    expect(result.event.type).toBe('vital');
    expect(result.trend.sampleCount).toBe(1);
    expect(result.trend.direction).toBe('insufficient_data');
  });

  it('returns an updated trend as the series grows', () => {
    const { family, vitals } = setup();
    vitals.logVital({
      ...base,
      familyId: family.family_id,
      type: 'weight',
      value: 60,
      measuredAt: '2026-03-01T08:00:00.000Z',
    });
    const second = vitals.logVital({
      ...base,
      familyId: family.family_id,
      type: 'weight',
      value: 61,
      measuredAt: '2026-03-08T08:00:00.000Z',
    });
    expect(second.trend.delta).toBe(1);
    expect(second.trend.direction).toBe('up');
  });

  it('rejects a future measured_at and a non-positive value', () => {
    const { family, vitals } = setup();
    expect(() =>
      vitals.logVital({
        ...base,
        familyId: family.family_id,
        type: 'weight',
        value: 60,
        measuredAt: '2999-01-01T00:00:00.000Z',
      }),
    ).toThrow(ValidationError);
    expect(() =>
      vitals.logVital({
        ...base,
        familyId: family.family_id,
        type: 'weight',
        value: 0,
        measuredAt: '2026-03-01T08:00:00.000Z',
      }),
    ).toThrow(ValidationError);
  });

  it('neutralises a formula-injection attempt in the unit string (docs/05-Data/73 §8)', () => {
    const { vitals, family } = setup();
    const result = vitals.logVital({
      ...base,
      familyId: family.family_id,
      type: 'weight',
      value: 60,
      unit: '=SUM(A1:A9)',
      measuredAt: '2026-03-01T08:00:00.000Z',
    });
    expect(result.vital.unit.startsWith("'")).toBe(true);
  });
});

describe('VitalsService.logBloodPressure', () => {
  it('one BP submission produces exactly two Vital rows', () => {
    const { storage, family, vitals } = setup();
    const result = vitals.logBloodPressure({
      ...base,
      familyId: family.family_id,
      systolic: 118,
      diastolic: 76,
      measuredAt: '2026-03-01T09:00:00.000Z',
    });
    expect(result.vitals).toHaveLength(2);
    const stored = storage.query('Vital', { subject_id: 'maternal-1', type: 'bp' });
    expect(stored).toHaveLength(2);
  });

  it('both rows share an identical measured_at and split into systolic/diastolic contexts', () => {
    const { family, vitals } = setup();
    const result = vitals.logBloodPressure({
      ...base,
      familyId: family.family_id,
      systolic: 118,
      diastolic: 76,
      measuredAt: '2026-03-01T09:00:00.000Z',
    });
    const [systolic, diastolic] = result.vitals;
    expect(systolic?.measured_at).toBe('2026-03-01T09:00:00.000Z');
    expect(diastolic?.measured_at).toBe(systolic?.measured_at);
    expect(systolic?.context).toBe('systolic');
    expect(diastolic?.context).toBe('diastolic');
  });

  it('records one logical BP timeline event (not two) and pairs the trend', () => {
    const { family, timeline, vitals } = setup();
    const result = vitals.logBloodPressure({
      ...base,
      familyId: family.family_id,
      systolic: 118,
      diastolic: 76,
      measuredAt: '2026-03-01T09:00:00.000Z',
    });
    expect(result.event.type).toBe('vital');
    expect(timeline.list(family.family_id).items).toHaveLength(1);
    expect(result.trend.readings).toHaveLength(1);
    expect(result.trend.systolic.current?.value).toBe(118);
    expect(result.trend.diastolic.current?.value).toBe(76);
  });

  it('rejects a non-positive systolic or diastolic', () => {
    const { family, vitals } = setup();
    expect(() =>
      vitals.logBloodPressure({
        ...base,
        familyId: family.family_id,
        systolic: 0,
        diastolic: 76,
        measuredAt: '2026-03-01T09:00:00.000Z',
      }),
    ).toThrow(ValidationError);
  });
});
