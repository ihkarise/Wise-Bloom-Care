/**
 * TrendService tests (docs/20-Implementation/207 §9 unit: "trend computation";
 * §8: trend is surfacing-only — arithmetic current/previous/delta/direction,
 * never diagnostic). Pure computation, no storage.
 */

import { describe, expect, it } from 'vitest';

import { TrendService } from '../../src/services/TrendService';

import type { Vital, VitalContext } from '@wise-bloom/domain-types';

let counter = 0;
function vital(
  type: Vital['type'],
  value: number,
  measured_at: string,
  context?: VitalContext,
): Vital {
  counter += 1;
  return {
    vital_id: `v-${counter}`,
    subject_id: 'maternal-1',
    type,
    value,
    unit: type === 'bp' ? 'mmHg' : type === 'weight' ? 'kg' : 'mg/dL',
    ...(context ? { context } : {}),
    measured_at,
  };
}

describe('TrendService.computeTrend', () => {
  it('reports insufficient_data with a single sample', () => {
    const trend = new TrendService().computeTrend(
      [vital('weight', 60, '2026-03-01T00:00:00.000Z')],
      'weight',
      'kg',
    );
    expect(trend.current?.value).toBe(60);
    expect(trend.previous).toBeNull();
    expect(trend.delta).toBeNull();
    expect(trend.direction).toBe('insufficient_data');
    expect(trend.sampleCount).toBe(1);
  });

  it('reports an empty series as insufficient_data with a null current', () => {
    const trend = new TrendService().computeTrend([], 'weight', 'kg');
    expect(trend.current).toBeNull();
    expect(trend.direction).toBe('insufficient_data');
    expect(trend.sampleCount).toBe(0);
  });

  it('computes current/previous/delta and an upward direction, ordered by time not input', () => {
    const trend = new TrendService().computeTrend(
      [
        vital('weight', 62, '2026-03-08T00:00:00.000Z'),
        vital('weight', 60, '2026-03-01T00:00:00.000Z'),
      ],
      'weight',
      'kg',
    );
    expect(trend.current?.value).toBe(62);
    expect(trend.previous?.value).toBe(60);
    expect(trend.delta).toBe(2);
    expect(trend.direction).toBe('up');
    expect(trend.sampleCount).toBe(2);
  });

  it('reports a downward direction and a steady direction correctly', () => {
    const down = new TrendService().computeTrend(
      [
        vital('blood_sugar', 90, '2026-03-01T00:00:00.000Z'),
        vital('blood_sugar', 85, '2026-03-02T00:00:00.000Z'),
      ],
      'blood_sugar',
      'mg/dL',
    );
    expect(down.delta).toBe(-5);
    expect(down.direction).toBe('down');

    const steady = new TrendService().computeTrend(
      [
        vital('blood_sugar', 90, '2026-03-01T00:00:00.000Z'),
        vital('blood_sugar', 90, '2026-03-02T00:00:00.000Z'),
      ],
      'blood_sugar',
      'mg/dL',
    );
    expect(steady.delta).toBe(0);
    expect(steady.direction).toBe('steady');
  });

  it('filters to the requested type and context', () => {
    const vitals = [
      vital('weight', 60, '2026-03-01T00:00:00.000Z'),
      vital('bp', 120, '2026-03-01T00:00:00.000Z', 'systolic'),
      vital('bp', 80, '2026-03-01T00:00:00.000Z', 'diastolic'),
    ];
    const systolic = new TrendService().computeTrend(vitals, 'bp', 'mmHg', 'systolic');
    expect(systolic.sampleCount).toBe(1);
    expect(systolic.current?.value).toBe(120);
    expect(systolic.context).toBe('systolic');
  });
});

describe('TrendService.computeBloodPressureTrend', () => {
  it('pairs systolic + diastolic sharing a measured_at into one reading', () => {
    const t = '2026-03-01T09:00:00.000Z';
    const bp = new TrendService().computeBloodPressureTrend([
      vital('bp', 118, t, 'systolic'),
      vital('bp', 76, t, 'diastolic'),
    ]);
    expect(bp.readings).toHaveLength(1);
    expect(bp.readings[0]).toEqual({ measured_at: t, systolic: 118, diastolic: 76 });
    expect(bp.systolic.current?.value).toBe(118);
    expect(bp.diastolic.current?.value).toBe(76);
  });

  it('computes an independent trend per component across two readings', () => {
    const bp = new TrendService().computeBloodPressureTrend([
      vital('bp', 120, '2026-03-01T09:00:00.000Z', 'systolic'),
      vital('bp', 80, '2026-03-01T09:00:00.000Z', 'diastolic'),
      vital('bp', 116, '2026-03-08T09:00:00.000Z', 'systolic'),
      vital('bp', 78, '2026-03-08T09:00:00.000Z', 'diastolic'),
    ]);
    expect(bp.readings).toHaveLength(2);
    expect(bp.systolic.delta).toBe(-4);
    expect(bp.systolic.direction).toBe('down');
    expect(bp.diastolic.delta).toBe(-2);
  });

  it('handles an incomplete pair safely — missing side is null, no crash, no invented value', () => {
    const bp = new TrendService().computeBloodPressureTrend([
      vital('bp', 122, '2026-03-01T09:00:00.000Z', 'systolic'),
      // no diastolic for this moment
    ]);
    expect(bp.readings).toHaveLength(1);
    expect(bp.readings[0]?.systolic).toBe(122);
    expect(bp.readings[0]?.diastolic).toBeNull();
    expect(bp.diastolic.current).toBeNull();
    expect(bp.diastolic.direction).toBe('insufficient_data');
  });
});
