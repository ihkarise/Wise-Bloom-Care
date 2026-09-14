/**
 * Bundled week-by-week pregnancy knowledge catalogue (MS-1.6,
 * docs/06-Modules/82 FR-4, docs/07-AI/101 §7).
 *
 * The data is generated verbatim from the knowledge base by
 * `scripts/build-kb.mjs` (run via `pnpm --filter @wise-bloom/backend gen:kb`, and
 * automatically before the GAS bundle). The authored content in
 * `knowledge-base/pregnancy/week01..40.md` remains the single source of truth
 * (docs/07-AI/101 BR-2); this module only makes it available to the Apps Script
 * runtime, which has no filesystem access. A drift test
 * (tests/content/pregnancy-weeks.test.ts) guards the two against divergence.
 */

import rawWeeks from './pregnancy-weeks.generated.json';

import type { ContentType, LifeStage } from '@wise-bloom/domain-types';

/** One authored pregnancy week's typed+sourced content (docs/02-Research/28 BR-1). */
export interface PregnancyWeekContent {
  /** Gestational week this content describes (1..40). */
  week: number;
  /** Stable content topic/id, e.g. `pregnancy-week-12`. */
  topic: string;
  content_type: ContentType;
  /** Non-empty source reference(s), resolving to docs/02-Research/27. */
  source_ref: string;
  life_stage: LifeStage;
  version: string;
  /** Path to the authored source in the knowledge base. */
  kb_path: string;
  /** Human-readable title, e.g. "Pregnancy — Week 12". */
  title: string;
  /** The authored Markdown body (title line stripped), copied verbatim from the KB. */
  body: string;
}

/** The 40 authored pregnancy weeks, ordered week 1 → 40. */
export const PREGNANCY_WEEKS: readonly PregnancyWeekContent[] = rawWeeks.map((week) => ({
  week: week.week,
  topic: week.topic,
  content_type: week.content_type as ContentType,
  source_ref: week.source_ref,
  life_stage: week.life_stage as LifeStage,
  version: week.version,
  kb_path: week.kb_path,
  title: week.title,
  body: week.body,
}));
