/**
 * TrackingService — the Personal Wellness Tracker (docs/06-Modules/98,
 * `docs/ADR/ADR-007-Personal-Tracker-Timeline-Strategy.md`, Accepted).
 *
 * Owns `TrackerPreference`/`TrackerEntry` only. A mother chooses which curated
 * templates to activate; reactivating an inactive tracker reuses its existing
 * preference row rather than creating a duplicate (98 §9, §22 D-3).
 * `TrackerEntry` is append-only — every recording is a new row, never an
 * edit — and deliberately has **no dependency on `TimelineService`**:
 * per `ADR-007` (Accepted), a tracker entry never emits a shared `Event` row,
 * so `EventType` is never widened and the dashboard timeline is never
 * flooded by high-frequency tracker taps.
 *
 * Value shape is fixed and small — `count | scale | boolean | text` — read
 * from the code-defined `TRACKER_TEMPLATES` catalog; this is deliberately not
 * a generic, user-definable form builder (98 §8, BR-5). Pregnancy-week
 * context, where wanted, is read through `PregnancyService`'s public
 * `gestationalAge` method by the controller (mirroring `contentController`'s
 * pattern) — this service never recomputes gestation math itself.
 */

import { newId } from '../lib/ids';
import { isNotFuture, sanitizeString, ValidationError } from '../lib/validation';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import { TRACKER_TEMPLATES } from '@wise-bloom/domain-types';
import type {
  ISODateTime,
  TrackerEntry,
  TrackerPreference,
  TrackerTemplate,
  UUID,
} from '@wise-bloom/domain-types';

/** Free-text length cap for `text`-type entries (matches Medicines' free-text bound convention, docs/05-Data/73 §4). */
const TEXT_MAX_LENGTH = 200;

/** Default page size for `listEntries` when the caller does not specify one. */
const DEFAULT_ENTRY_PAGE_SIZE = 20;

export interface SetPreferenceInput {
  subjectId: UUID;
  trackerKey: string;
  active: boolean;
}

export interface AddEntryInput {
  subjectId: UUID;
  trackerKey: string;
  value: string;
  createdBy: UUID;
  /** Optional retrospective timestamp (forgiving entry, P9); defaults to now. */
  recordedAt?: ISODateTime;
}

export interface ListEntriesOptions {
  cursor?: string;
  limit?: number;
}

export interface EntryPage {
  items: TrackerEntry[];
  nextCursor?: string;
}

function parseCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }
  const index = Number(cursor);
  return Number.isInteger(index) && index >= 0 ? index : 0;
}

/**
 * Validates and normalises a raw value string per its template's
 * `value_type` (98 §8) — the sole place value shape is interpreted. Rejects
 * anything outside the fixed shape; never accepts an arbitrary/user-defined
 * shape (98 BR-5, not a form builder).
 */
function validateValue(template: TrackerTemplate, raw: string): string {
  switch (template.value_type) {
    case 'count': {
      if (!/^\d+$/.test(raw)) {
        throw new ValidationError('count value must be a non-negative whole number');
      }
      return raw;
    }
    case 'scale': {
      const max = template.scaleMax ?? 5;
      const parsed = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isInteger(parsed) || parsed < 1 || parsed > max) {
        throw new ValidationError(`scale value must be a whole number between 1 and ${max}`);
      }
      return raw;
    }
    case 'boolean': {
      if (raw !== 'true' && raw !== 'false') {
        throw new ValidationError('boolean value must be "true" or "false"');
      }
      return raw;
    }
    case 'text': {
      const trimmed = raw.trim();
      if (trimmed.length === 0) {
        throw new ValidationError('text value must not be empty');
      }
      if (trimmed.length > TEXT_MAX_LENGTH) {
        throw new ValidationError(`text value must be ${TEXT_MAX_LENGTH} characters or fewer`);
      }
      return sanitizeString(trimmed);
    }
  }
}

export class TrackingService {
  constructor(
    private readonly storage: StorageAdapter,
    /** Injected for testability; the "recorded at" moment when none is supplied. */
    private readonly now: () => string = () => new Date().toISOString(),
    /**
     * The curated catalog, defaulting to the real v1 `TRACKER_TEMPLATES`.
     * Overridable only for tests: the real catalog currently ships only
     * `count`/`scale` templates (98 §22 D-4), so `boolean`/`text` validation
     * is proven against a fixture catalog here rather than by expanding the
     * production launch set.
     */
    private readonly templates: readonly TrackerTemplate[] = TRACKER_TEMPLATES,
  ) {}

  /** The catalog entry for a tracker key, or a safe validation error — never a generic 404 (a tracker_key is a choice from a fixed catalog, not a stored record). */
  private templateFor(trackerKey: string): TrackerTemplate {
    const template = this.templates.find((candidate) => candidate.tracker_key === trackerKey);
    if (!template) {
      throw new ValidationError(`Unknown tracker: ${trackerKey}`);
    }
    return template;
  }

  /**
   * Activates or deactivates a curated tracker for a subject. The first call
   * for a (`subject_id`, `tracker_key`) pair creates the preference row;
   * every later call updates that SAME row's `active` in place — a
   * reactivation never creates a duplicate (98 §9, §22 D-3). Plain in-place
   * update, no `version` field — matches the real `MedicinesService`/
   * `VitalsService` correctable pattern, not the aspirational versioning
   * document (§22 D-3).
   */
  setPreference(input: SetPreferenceInput): TrackerPreference {
    this.templateFor(input.trackerKey);

    const existing = this.storage.query('TrackerPreference', {
      subject_id: input.subjectId,
      tracker_key: input.trackerKey,
    })[0];

    if (existing) {
      return this.storage.update('TrackerPreference', existing.tracker_pref_id, {
        active: input.active,
      });
    }

    const preference: TrackerPreference = {
      tracker_pref_id: newId(),
      subject_id: input.subjectId,
      tracker_key: input.trackerKey,
      active: input.active,
    };
    return this.storage.create('TrackerPreference', preference);
  }

  /** A subject's tracker preferences: active first, then inactive, each ordered by tracker_key for a stable, calm list (mirrors MedicinesService.list). */
  listPreferences(subjectId: UUID): TrackerPreference[] {
    return this.storage.query('TrackerPreference', { subject_id: subjectId }).sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return a.tracker_key.localeCompare(b.tracker_key);
    });
  }

  /**
   * Records one observation. Always creates a new row — `TrackerEntry` is
   * append-only (never updated, never deleted; a correction is a new entry).
   * Deliberately does not touch `TimelineService`: no shared `Event` row is
   * ever created for a tracker entry (`ADR-007`, Accepted).
   */
  addEntry(input: AddEntryInput): TrackerEntry {
    const template = this.templateFor(input.trackerKey);
    const value = validateValue(template, input.value);

    const recordedAt = input.recordedAt ?? this.now();
    if (!isNotFuture(recordedAt)) {
      throw new ValidationError('recorded_at cannot be in the future');
    }

    const entry: TrackerEntry = {
      tracker_entry_id: newId(),
      subject_id: input.subjectId,
      tracker_key: input.trackerKey,
      value,
      recorded_at: recordedAt,
      version: 1,
      created_by: input.createdBy,
    };
    return this.storage.create('TrackerEntry', entry);
  }

  /** One tracker's recorded history for a subject, newest first, paginated. */
  listEntries(subjectId: UUID, trackerKey: string, options: ListEntriesOptions = {}): EntryPage {
    const all = this.storage
      .query('TrackerEntry', { subject_id: subjectId, tracker_key: trackerKey })
      .sort(
        (a, b) =>
          Date.parse(b.recorded_at) - Date.parse(a.recorded_at) ||
          b.tracker_entry_id.localeCompare(a.tracker_entry_id),
      );

    const limit = options.limit ?? DEFAULT_ENTRY_PAGE_SIZE;
    const start = parseCursor(options.cursor);
    const items = all.slice(start, start + limit);
    const nextIndex = start + items.length;

    return {
      items,
      ...(nextIndex < all.length ? { nextCursor: String(nextIndex) } : {}),
    };
  }
}
