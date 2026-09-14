/**
 * Bundled pregnancy-week catalogue drift + typing guard (MS-1.6,
 * docs/07-AI/101 BR-1/BR-2, docs/02-Research/28 BR-1).
 *
 * The backend serves week content from `content/pregnancyWeeks` (bundled for the
 * Apps Script runtime), but the knowledge base is the single source of truth.
 * This test reads the authored `knowledge-base/pregnancy/week01..40.md` from disk
 * and fails if the bundle ever diverges (stale generation) or if any week is not
 * typed + sourced — so untyped content can never be shipped.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PREGNANCY_WEEKS } from '../../src/content/pregnancyWeeks';

const KB_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../knowledge-base/pregnancy',
);

const VALID_CONTENT_TYPES = ['educational', 'clinical_recommendation', 'emergency_warning'];

describe('bundled pregnancy week catalogue', () => {
  it('has exactly the 40 authored weeks, unique and in order', () => {
    expect(PREGNANCY_WEEKS).toHaveLength(40);
    expect(PREGNANCY_WEEKS.map((week) => week.week)).toEqual(
      Array.from({ length: 40 }, (_unused, index) => index + 1),
    );
  });

  it('every week is typed + sourced (untyped content is never bundled, 28 BR-1)', () => {
    for (const week of PREGNANCY_WEEKS) {
      expect(VALID_CONTENT_TYPES).toContain(week.content_type);
      expect(week.source_ref.trim().length).toBeGreaterThan(0);
      expect(week.life_stage).toBe('pregnancy');
      expect(week.body.trim().length).toBeGreaterThan(0);
      expect(week.version.trim().length).toBeGreaterThan(0);
    }
  });

  it('matches the authored knowledge base verbatim (no drift)', () => {
    for (const week of PREGNANCY_WEEKS) {
      const fileName = `week${String(week.week).padStart(2, '0')}.md`;
      expect(week.kb_path).toBe(`knowledge-base/pregnancy/${fileName}`);

      const fileText = readFileSync(resolve(KB_DIR, fileName), 'utf8');
      // The bundled body is copied verbatim from the file (front-matter + the
      // single H1 title line stripped), so the file still contains it contiguously.
      expect(fileText).toContain(week.body);
      // The title is the file's H1.
      expect(fileText).toContain(`# ${week.title}`);
      // The bundled content_type is exactly the file's front-matter content_type.
      expect(fileText).toContain(`content_type: ${week.content_type}`);
    }
  });
});
