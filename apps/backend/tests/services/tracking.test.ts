/**
 * TrackingService tests (docs/06-Modules/98, Phase 2). Covers preference
 * activate/deactivate/reactivate (never a duplicate row), append-only entry
 * recording, value validation for all four value types — `count`/`scale`
 * against the real v1 catalog, `boolean`/`text` against a fixture catalog
 * (98 §22 D-4: the real v1 launch catalog ships only count/scale trackers, so
 * boolean/text are proven here without expanding the production catalog) —
 * unknown-tracker rejection, and listing/pagination.
 */

import { describe, expect, it } from 'vitest';

import { TrackingService } from '../../src/services/TrackingService';
import { ValidationError } from '../../src/lib/validation';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

import type { TrackerTemplate } from '@wise-bloom/domain-types';

/**
 * Fixture catalog exercising all four value types — NOT the production v1
 * catalog (`@wise-bloom/domain-types` `TRACKER_TEMPLATES`, which ships only
 * count/scale per 98 §22 D-4). Used solely to prove boolean/text validation
 * works, per the ratified requirement to test them without expanding the
 * real launch set.
 */
const FIXTURE_TEMPLATES: readonly TrackerTemplate[] = [
  {
    tracker_key: 'fixture_count',
    label: 'Fixture count',
    value_type: 'count',
    context: 'general',
  },
  {
    tracker_key: 'fixture_scale',
    label: 'Fixture scale',
    value_type: 'scale',
    context: 'general',
    scaleMax: 5,
  },
  {
    tracker_key: 'fixture_boolean',
    label: 'Fixture boolean',
    value_type: 'boolean',
    context: 'general',
  },
  { tracker_key: 'fixture_text', label: 'Fixture text', value_type: 'text', context: 'general' },
];

function setup(now: () => string = () => '2026-05-01T08:00:00.000Z') {
  const storage = createInMemoryAdapter();
  const tracking = new TrackingService(storage, now, FIXTURE_TEMPLATES);
  return { storage, tracking };
}

/** Uses the real production catalog (98 §22 D-4) — no fixture override. */
function setupRealCatalog(now: () => string = () => '2026-05-01T08:00:00.000Z') {
  const storage = createInMemoryAdapter();
  const tracking = new TrackingService(storage, now);
  return { storage, tracking };
}

const SUBJECT = 'maternal-1';
const ACTOR = 'user-1';

describe('TrackingService.setPreference', () => {
  it('creates a preference on first activation', () => {
    const { tracking } = setup();
    const pref = tracking.setPreference({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      active: true,
    });
    expect(pref.active).toBe(true);
    expect(pref.subject_id).toBe(SUBJECT);
    expect(pref.tracker_key).toBe('fixture_count');
  });

  it('reuses the same row on reactivation — never a duplicate', () => {
    const { tracking } = setup();
    const first = tracking.setPreference({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      active: true,
    });
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_count', active: false });
    const reactivated = tracking.setPreference({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      active: true,
    });

    expect(reactivated.tracker_pref_id).toBe(first.tracker_pref_id);
    expect(tracking.listPreferences(SUBJECT)).toHaveLength(1);
  });

  it('deactivating never deletes the row', () => {
    const { tracking } = setup();
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_count', active: true });
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_count', active: false });
    expect(tracking.listPreferences(SUBJECT)).toHaveLength(1);
    expect(tracking.listPreferences(SUBJECT)[0]?.active).toBe(false);
  });

  it('rejects an unknown tracker key', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.setPreference({
        subjectId: SUBJECT,
        trackerKey: 'not_a_real_tracker',
        active: true,
      }),
    ).toThrow(ValidationError);
  });
});

describe('TrackingService.listPreferences', () => {
  it('active first, then inactive, each ordered by tracker_key', () => {
    const { tracking } = setup();
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_text', active: true });
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_boolean', active: true });
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_count', active: false });

    const list = tracking.listPreferences(SUBJECT);
    expect(list.map((p) => p.tracker_key)).toEqual([
      'fixture_boolean',
      'fixture_text',
      'fixture_count',
    ]);
    expect(list.map((p) => p.active)).toEqual([true, true, false]);
  });

  it('scopes to the requested subject', () => {
    const { tracking } = setup();
    tracking.setPreference({ subjectId: SUBJECT, trackerKey: 'fixture_count', active: true });
    expect(tracking.listPreferences(SUBJECT)).toHaveLength(1);
    expect(tracking.listPreferences('another-subject')).toHaveLength(0);
  });
});

describe('TrackingService.addEntry — count', () => {
  it('accepts a non-negative integer', () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '3',
      createdBy: ACTOR,
    });
    expect(entry.value).toBe('3');
    expect(entry.version).toBe(1);
    expect(entry.subject_id).toBe(SUBJECT);
  });

  it('rejects a negative number', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_count',
        value: '-1',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects a non-integer', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_count',
        value: '1.5',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });
});

describe('TrackingService.addEntry — scale', () => {
  it("accepts a value within the template's scale range", () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_scale',
      value: '3',
      createdBy: ACTOR,
    });
    expect(entry.value).toBe('3');
  });

  it('rejects a value above the scale max', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_scale',
        value: '6',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects zero (scale is 1-indexed)', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_scale',
        value: '0',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });
});

describe('TrackingService.addEntry — boolean (fixture catalog, 98 §22 D-4)', () => {
  it('accepts "true"', () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_boolean',
      value: 'true',
      createdBy: ACTOR,
    });
    expect(entry.value).toBe('true');
  });

  it('accepts "false"', () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_boolean',
      value: 'false',
      createdBy: ACTOR,
    });
    expect(entry.value).toBe('false');
  });

  it('rejects anything else', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_boolean',
        value: 'yes',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });
});

describe('TrackingService.addEntry — text (fixture catalog, 98 §22 D-4)', () => {
  it('accepts and trims a short note', () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_text',
      value: '  Felt tired  ',
      createdBy: ACTOR,
    });
    expect(entry.value).toBe('Felt tired');
  });

  it('rejects an empty note', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_text',
        value: '   ',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects a note over the length bound', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_text',
        value: 'x'.repeat(201),
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });

  it('neutralises spreadsheet formula injection (docs/05-Data/73 §8)', () => {
    const { tracking } = setup();
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_text',
      value: '=HYPERLINK("http://evil","x")',
      createdBy: ACTOR,
    });
    expect(entry.value.startsWith("'=")).toBe(true);
  });
});

describe('TrackingService.addEntry — general', () => {
  it('rejects an unknown tracker key', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'no_such_tracker',
        value: '1',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });

  it('is append-only: recording twice creates two entries, never overwrites', () => {
    const { tracking } = setup();
    tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '1',
      createdBy: ACTOR,
    });
    tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '1',
      createdBy: ACTOR,
    });
    const page = tracking.listEntries(SUBJECT, 'fixture_count');
    expect(page.items).toHaveLength(2);
  });

  it('defaults recorded_at to now when omitted', () => {
    const { tracking } = setup(() => '2026-05-01T08:00:00.000Z');
    const entry = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '1',
      createdBy: ACTOR,
    });
    expect(entry.recorded_at).toBe('2026-05-01T08:00:00.000Z');
  });

  it('rejects a future recorded_at', () => {
    const { tracking } = setup();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_count',
        value: '1',
        createdBy: ACTOR,
        recordedAt: '2099-01-01T00:00:00.000Z',
      }),
    ).toThrow(ValidationError);
  });
});

describe('TrackingService.listEntries', () => {
  it('returns newest first, scoped to subject + tracker', () => {
    const { tracking } = setup(() => '2026-05-01T08:00:00.000Z');
    tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '1',
      createdBy: ACTOR,
      recordedAt: '2026-04-30T08:00:00.000Z',
    });
    tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_count',
      value: '2',
      createdBy: ACTOR,
      recordedAt: '2026-05-01T08:00:00.000Z',
    });
    tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'fixture_scale',
      value: '3',
      createdBy: ACTOR,
    });

    const page = tracking.listEntries(SUBJECT, 'fixture_count');
    expect(page.items.map((e) => e.value)).toEqual(['2', '1']);
  });

  it('paginates with a cursor', () => {
    const { tracking } = setup();
    for (let i = 0; i < 3; i += 1) {
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_count',
        value: String(i),
        createdBy: ACTOR,
      });
    }
    const page1 = tracking.listEntries(SUBJECT, 'fixture_count', { limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBeDefined();

    const page2 = tracking.listEntries(SUBJECT, 'fixture_count', {
      limit: 2,
      ...(page1.nextCursor !== undefined ? { cursor: page1.nextCursor } : {}),
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeUndefined();
  });
});

describe('TrackingService — real v1 catalog (98 §22 D-4)', () => {
  it('accepts a value for every real launch tracker', () => {
    const { tracking } = setupRealCatalog();
    const movement = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'baby_movement',
      value: '1',
      createdBy: ACTOR,
    });
    expect(movement.value).toBe('1');
    const bloating = tracking.addEntry({
      subjectId: SUBJECT,
      trackerKey: 'bloating',
      value: '3',
      createdBy: ACTOR,
    });
    expect(bloating.value).toBe('3');
  });

  it('rejects a tracker key that is not part of the real catalog', () => {
    const { tracking } = setupRealCatalog();
    expect(() =>
      tracking.addEntry({
        subjectId: SUBJECT,
        trackerKey: 'fixture_boolean',
        value: 'true',
        createdBy: ACTOR,
      }),
    ).toThrow(ValidationError);
  });
});
