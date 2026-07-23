/**
 * Gestational-age computation tests (docs/06-Modules/82 BR-1; PregnancyEpisode
 * acceptance criterion in docs/20-Implementation/206 §8: "GA is computed for
 * display, not persisted redundantly").
 */

import { describe, expect, it } from 'vitest';

import {
  estimateDueDate,
  estimateLmpFromDueDate,
  gestationalAgeAsOf,
  trimesterFromWeeks,
} from '../../src/lib/gestation';

describe('estimateDueDate', () => {
  it('applies Naegele’s rule (LMP + 280 days)', () => {
    expect(estimateDueDate('2026-01-01')).toBe('2026-10-08');
  });

  it('rejects a malformed LMP', () => {
    expect(() => estimateDueDate('01-01-2026')).toThrow(RangeError);
  });
});

describe('estimateLmpFromDueDate', () => {
  it('inverts estimateDueDate', () => {
    const lmp = '2026-01-01';
    expect(estimateLmpFromDueDate(estimateDueDate(lmp))).toBe(lmp);
  });
});

describe('gestationalAgeAsOf', () => {
  it('returns null when LMP is unknown (forgiving entry, P9)', () => {
    expect(gestationalAgeAsOf(undefined, '2026-06-01')).toBeNull();
  });

  it('computes weeks/days at exactly 20 weeks', () => {
    const ga = gestationalAgeAsOf('2026-01-01', '2026-05-21'); // 140 days later
    expect(ga).toEqual({ days: 140, weeks: 20, daysIntoWeek: 0 });
  });

  it('computes partial weeks correctly', () => {
    const ga = gestationalAgeAsOf('2026-01-01', '2026-05-24'); // 143 days later
    expect(ga).toEqual({ days: 143, weeks: 20, daysIntoWeek: 3 });
  });

  it('returns null for an implausible future LMP relative to asOf', () => {
    expect(gestationalAgeAsOf('2026-06-01', '2026-01-01')).toBeNull();
  });
});

describe('trimesterFromWeeks', () => {
  it('buckets weeks into the three trimesters', () => {
    expect(trimesterFromWeeks(0)).toBe(1);
    expect(trimesterFromWeeks(13)).toBe(1);
    expect(trimesterFromWeeks(14)).toBe(2);
    expect(trimesterFromWeeks(27)).toBe(2);
    expect(trimesterFromWeeks(28)).toBe(3);
    expect(trimesterFromWeeks(40)).toBe(3);
  });
});
