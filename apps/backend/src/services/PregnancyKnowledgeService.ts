/**
 * PregnancyKnowledgeService — surfaces week-by-week pregnancy knowledge by
 * gestational age (MS-1.6; docs/06-Modules/82 §3 "week-knowledge surfacing",
 * FR-4; docs/20-Implementation/208 §6 Task 4).
 *
 * The pregnancy module owns week-knowledge surfacing (docs/06-Modules/82 §3);
 * this service maps a gestational age to one of the authored weeks
 * (`knowledge-base/pregnancy/week01..40`, bundled via `content/pregnancyWeeks`)
 * and serves it **only after** ContentService confirms it is typed + sourced
 * (docs/06-Modules/82 §6, docs/02-Research/28 BR-1). It records nothing and
 * derives nothing that is stored — GA is computed on read (82 BR-1). It never
 * invents content or weeks outside the authored 1..40 range.
 */

import type { GestationalAge } from '../lib/gestation';
import type { ContentService } from './ContentService';
import type { PregnancyWeekContent } from '../content/pregnancyWeeks';
import type { ContentItem } from '@wise-bloom/domain-types';

/** Authored range of week content (`knowledge-base/pregnancy/week01..40`). */
export const MIN_PREGNANCY_WEEK = 1;
export const MAX_PREGNANCY_WEEK = 40;

/** A requested week has no authored content (outside 1..40). */
export class WeekOutOfRangeError extends Error {
  override readonly name = 'WeekOutOfRangeError';
}

/** One resolved week's knowledge: the typed+sourced index plus its authored body. */
export interface WeekKnowledge {
  week: number;
  content: ContentItem;
  title: string;
  body: string;
}

export class PregnancyKnowledgeService {
  constructor(
    private readonly catalog: readonly PregnancyWeekContent[],
    private readonly content: ContentService,
  ) {}

  /**
   * Maps gestational age (completed weeks) to an authored content week, clamped
   * to [1,40] so the earliest weeks show week 1 and at/after term shows week 40.
   * Returns `null` when GA is unknown (no/future LMP) — there is no week to
   * surface (docs/06-Modules/82 §10, forgiving entry).
   */
  weekForGestation(ga: GestationalAge | null): number | null {
    if (!ga) {
      return null;
    }
    return Math.min(Math.max(ga.weeks, MIN_PREGNANCY_WEEK), MAX_PREGNANCY_WEEK);
  }

  /**
   * Resolves one authored week's knowledge, validated typed + sourced through
   * ContentService before it is served (docs/02-Research/28 BR-1/BR-2). Throws
   * `WeekOutOfRangeError` for any week outside the authored 1..40 range.
   */
  getWeek(week: number): WeekKnowledge {
    if (!Number.isInteger(week) || week < MIN_PREGNANCY_WEEK || week > MAX_PREGNANCY_WEEK) {
      throw new WeekOutOfRangeError(`No authored knowledge for week ${week}`);
    }
    const entry = this.catalog.find((candidate) => candidate.week === week);
    if (!entry) {
      throw new WeekOutOfRangeError(`No authored knowledge for week ${week}`);
    }
    const content = this.content.assertServable({
      content_id: entry.topic,
      life_stage: entry.life_stage,
      topic: entry.topic,
      content_type: entry.content_type,
      source_ref: entry.source_ref,
      kb_path: entry.kb_path,
      version: entry.version,
    });
    return { week, content, title: entry.title, body: entry.body };
  }
}
