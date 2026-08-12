/**
 * Chart geometry tests (docs/03-UX/35 §8) — pure sparkline maths.
 */

import { describe, expect, it } from 'vitest';

import { buildSparkline } from '../../src/lib/charts';

describe('buildSparkline', () => {
  it('returns an empty geometry for no points', () => {
    const geo = buildSparkline([]);
    expect(geo.path).toBe('');
    expect(geo.dots).toEqual([]);
  });

  it('centres a single point and draws a single dot', () => {
    const geo = buildSparkline([{ value: 60, at: '2026-03-01T00:00:00.000Z' }], { width: 100 });
    expect(geo.dots).toHaveLength(1);
    expect(geo.dots[0]?.x).toBe(50);
  });

  it('scales the y-axis to the data range and inverts it (max is near the top)', () => {
    const geo = buildSparkline(
      [
        { value: 60, at: '2026-03-01T00:00:00.000Z' },
        { value: 62, at: '2026-03-08T00:00:00.000Z' },
      ],
      { width: 100, height: 100, padding: 0 },
    );
    // Higher value → smaller y (top). min maps to bottom.
    expect(geo.dots[1]!.y).toBeLessThan(geo.dots[0]!.y);
    expect(geo.min).toBe(60);
    expect(geo.max).toBe(62);
    expect(geo.path.startsWith('M')).toBe(true);
  });

  it('draws a flat series along the mid-line instead of dividing by zero', () => {
    const geo = buildSparkline(
      [
        { value: 90, at: '2026-03-01T00:00:00.000Z' },
        { value: 90, at: '2026-03-02T00:00:00.000Z' },
      ],
      { height: 100 },
    );
    expect(geo.dots.every((d) => d.y === 50)).toBe(true);
  });
});
