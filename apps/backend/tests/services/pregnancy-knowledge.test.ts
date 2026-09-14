/**
 * PregnancyKnowledgeService unit tests (MS-1.6, docs/06-Modules/82 FR-4).
 * Covers the GA→week mapping (including boundaries and unknown GA), authored
 * week resolution, out-of-range rejection, and the typed+sourced gate.
 */

import { describe, expect, it } from 'vitest';

import { PREGNANCY_WEEKS, type PregnancyWeekContent } from '../../src/content/pregnancyWeeks';
import { ContentService, UntypedContentError } from '../../src/services/ContentService';
import {
  PregnancyKnowledgeService,
  WeekOutOfRangeError,
} from '../../src/services/PregnancyKnowledgeService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

import type { GestationalAge } from '../../src/lib/gestation';

function ga(weeks: number): GestationalAge {
  return { days: weeks * 7, weeks, daysIntoWeek: 0 };
}

function service(
  catalog: readonly PregnancyWeekContent[] = PREGNANCY_WEEKS,
): PregnancyKnowledgeService {
  return new PregnancyKnowledgeService(catalog, new ContentService(createInMemoryAdapter()));
}

describe('PregnancyKnowledgeService.weekForGestation', () => {
  it('returns null when gestational age is unknown', () => {
    expect(service().weekForGestation(null)).toBeNull();
  });

  it('maps completed weeks to the same content week', () => {
    expect(service().weekForGestation(ga(12))).toBe(12);
    expect(service().weekForGestation(ga(1))).toBe(1);
    expect(service().weekForGestation(ga(39))).toBe(39);
  });

  it('clamps the very earliest weeks up to week 1', () => {
    expect(service().weekForGestation(ga(0))).toBe(1);
  });

  it('clamps at and beyond term to week 40', () => {
    expect(service().weekForGestation(ga(40))).toBe(40);
    expect(service().weekForGestation(ga(45))).toBe(40);
  });
});

describe('PregnancyKnowledgeService.getWeek', () => {
  it('resolves an authored week with its typed, sourced content and body', () => {
    const result = service().getWeek(12);
    expect(result.week).toBe(12);
    expect(result.content.content_type).toBe('educational');
    expect(result.content.source_ref.length).toBeGreaterThan(0);
    expect(result.content.kb_path).toBe('knowledge-base/pregnancy/week12.md');
    expect(result.title).toBe('Pregnancy — Week 12');
    expect(result.body.length).toBeGreaterThan(0);
  });

  it('resolves every authored week 1..40 as typed + sourced educational content', () => {
    const svc = service();
    for (let week = 1; week <= 40; week += 1) {
      const result = svc.getWeek(week);
      expect(result.content.content_type).toBe('educational');
      expect(result.content.source_ref.trim().length).toBeGreaterThan(0);
      expect(result.body.trim().length).toBeGreaterThan(0);
    }
  });

  it('rejects weeks outside the authored 1..40 range', () => {
    expect(() => service().getWeek(0)).toThrow(WeekOutOfRangeError);
    expect(() => service().getWeek(41)).toThrow(WeekOutOfRangeError);
    expect(() => service().getWeek(12.5)).toThrow(WeekOutOfRangeError);
  });

  it('refuses to serve an untyped/unsourced week through the ContentService gate', () => {
    const bad: PregnancyWeekContent = {
      week: 1,
      topic: 'pregnancy-week-1',
      content_type: '' as never,
      source_ref: '',
      life_stage: 'pregnancy',
      version: '1.0',
      kb_path: 'knowledge-base/pregnancy/week01.md',
      title: 'Pregnancy — Week 1',
      body: 'some body',
    };
    expect(() => service([bad]).getWeek(1)).toThrow(UntypedContentError);
  });
});
