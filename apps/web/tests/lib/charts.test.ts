/**
 * Chart config tests (docs/ADR/ADR-003-Astro, docs/03-UX/35 §8) — the pure
 * Chart.js line-config builder: value mapping, dataset labelling, calm framing,
 * and reduced-motion. No DOM, no canvas: geometry lives in Chart.js now, so the
 * unit boundary is the configuration we hand it.
 */

import { describe, expect, it } from 'vitest';

import { buildLineChartConfig, formatChartLabel } from '../../src/lib/charts';

describe('buildLineChartConfig', () => {
  it('produces one empty dataset for no points', () => {
    const cfg = buildLineChartConfig([], { label: 'Weight', unit: 'kg' });
    expect(cfg.type).toBe('line');
    expect(cfg.data.datasets).toHaveLength(1);
    expect(cfg.data.datasets[0]?.data).toEqual([]);
    expect(cfg.data.labels).toEqual([]);
  });

  it('maps values oldest→newest and labels the dataset with its unit', () => {
    const cfg = buildLineChartConfig(
      [
        { value: 60, at: '2026-03-01T00:00:00.000Z' },
        { value: 62, at: '2026-03-08T00:00:00.000Z' },
      ],
      { label: 'Weight', unit: 'kg' },
    );
    expect(cfg.data.datasets[0]?.data).toEqual([60, 62]);
    expect(cfg.data.datasets[0]?.label).toBe('Weight (kg)');
    expect(cfg.data.labels).toHaveLength(2);
  });

  it('animates by default but disables animation under reduced motion', () => {
    const normal = buildLineChartConfig([{ value: 1, at: '2026-03-01T00:00:00.000Z' }], {
      label: 'BP',
      unit: 'mmHg',
    });
    expect(normal.options?.animation).not.toBe(false);

    const calm = buildLineChartConfig([{ value: 1, at: '2026-03-01T00:00:00.000Z' }], {
      label: 'BP',
      unit: 'mmHg',
      reducedMotion: true,
    });
    expect(calm.options?.animation).toBe(false);
  });

  it('hides the legend and keeps a single calm series (no diagnosis, no bands)', () => {
    const cfg = buildLineChartConfig([{ value: 90, at: '2026-03-01T00:00:00.000Z' }], {
      label: 'Sugar',
      unit: 'mg/dL',
    });
    expect(cfg.options?.plugins?.legend?.display).toBe(false);
    expect(cfg.data.datasets).toHaveLength(1);
  });
});

describe('formatChartLabel', () => {
  it('formats an ISO date into a short, non-empty label', () => {
    expect(formatChartLabel('2026-03-08T00:00:00.000Z')).toMatch(/\w/);
  });

  it('passes an unparseable value straight through', () => {
    expect(formatChartLabel('not-a-date')).toBe('not-a-date');
  });
});
