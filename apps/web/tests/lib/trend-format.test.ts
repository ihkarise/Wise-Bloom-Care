/**
 * Trend-format tests (docs/06-Modules/83 BR-1) — copy is factual and
 * NON-diagnostic (no thresholds, no "high"/"normal").
 */

import { describe, expect, it } from 'vitest';

import { describeTrend, formatDelta, formatDirection } from '../../src/lib/trend-format';

import type { TrendResult } from '@wise-bloom/domain-types';

function trend(partial: Partial<TrendResult>): TrendResult {
  return {
    type: 'weight',
    unit: 'kg',
    current: null,
    previous: null,
    delta: null,
    direction: 'insufficient_data',
    sampleCount: 0,
    ...partial,
  };
}

describe('trend-format', () => {
  it('describes each direction factually, without diagnosis', () => {
    expect(formatDirection('up')).toBe('Higher than your last reading');
    expect(formatDirection('down')).toBe('Lower than your last reading');
    expect(formatDirection('steady')).toBe('About the same as last time');
    expect(formatDirection('insufficient_data')).toContain('Not enough readings');
    // No clinical/diagnostic language anywhere (comparatives like "higher" are fine).
    for (const dir of ['up', 'down', 'steady', 'insufficient_data'] as const) {
      expect(formatDirection(dir).toLowerCase()).not.toMatch(
        /\b(normal|abnormal|diagnos|hypertension|hypertensive|elevated|concerning)\b/,
      );
    }
  });

  it('formats a signed delta or null when there is no previous reading', () => {
    expect(formatDelta(trend({ delta: 2 }))).toBe('+2 kg since your last reading');
    expect(formatDelta(trend({ delta: -1 }))).toBe('-1 kg since your last reading');
    expect(formatDelta(trend({ delta: null }))).toBeNull();
  });

  it('builds an accessible sentence for a trend', () => {
    const t = trend({
      current: { value: 62, measured_at: '2026-03-08T00:00:00.000Z' },
      previous: { value: 60, measured_at: '2026-03-01T00:00:00.000Z' },
      delta: 2,
      direction: 'up',
      sampleCount: 2,
    });
    expect(describeTrend(t, 'Weight')).toContain('Weight: 62 kg');
    expect(describeTrend(trend({}), 'Weight')).toBe('Weight: no readings yet.');
  });
});
