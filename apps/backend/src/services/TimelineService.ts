/**
 * TimelineService — the append-only, versioned, polymorphic-subject timeline
 * (docs/04-Architecture/52 §6, docs/08-Timeline/110, docs/05-Data/77 §5).
 *
 * `append` writes a brand-new original event (version 1). `correct` never
 * mutates the original — since `event_id` is a unique PK, a correction is a
 * new row with an incremented version, linked back to the original via
 * `corrects_event_id` (docs/05-Data/77 §5). `list` returns one entry per
 * logical event — the current (max-version) row of each correction lineage —
 * paginated by an opaque numeric cursor (docs/04-Architecture/56 §3).
 */

import { newId } from '../lib/ids';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Event, EventType, ISODateTime, LifeStage, UUID } from '@wise-bloom/domain-types';

/** Default page size for `list` when the caller does not specify one. */
const DEFAULT_PAGE_SIZE = 20;

export class TimelineEventNotFoundError extends Error {
  override readonly name = 'TimelineEventNotFoundError';
}

export interface AppendEventInput {
  familyId: UUID;
  subjectId: UUID;
  type: EventType;
  lifeStage: LifeStage;
  occurredAt: ISODateTime;
  createdBy: UUID;
  payloadRef?: UUID;
}

export interface CorrectEventInput {
  createdBy: UUID;
  occurredAt?: ISODateTime;
  payloadRef?: UUID;
}

export interface ListTimelineOptions {
  cursor?: string;
  limit?: number;
}

export interface TimelinePage {
  items: Event[];
  nextCursor?: string;
}

function parseCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }
  const index = Number(cursor);
  return Number.isInteger(index) && index >= 0 ? index : 0;
}

export class TimelineService {
  constructor(private readonly storage: StorageAdapter) {}

  private mustGet(eventId: UUID): Event {
    const event = this.storage.get('Event', eventId);
    if (!event) {
      throw new TimelineEventNotFoundError(`Event ${eventId} not found`);
    }
    return event;
  }

  /** Appends a brand-new, original timeline event (version 1) — append-only (77 §5). */
  append(input: AppendEventInput): Event {
    const event: Event = {
      event_id: newId(),
      family_id: input.familyId,
      subject_id: input.subjectId,
      type: input.type,
      life_stage: input.lifeStage,
      occurred_at: input.occurredAt,
      version: 1,
      created_by: input.createdBy,
      ...(input.payloadRef !== undefined ? { payload_ref: input.payloadRef } : {}),
    };
    return this.storage.create('Event', event);
  }

  /**
   * Corrects an event by appending a new, versioned event that references the
   * original — the original row is never mutated (77 §5). `eventId` may be
   * the original or any prior correction in its lineage; the new row always
   * links back to the lineage's original via `corrects_event_id`.
   */
  correct(eventId: UUID, changes: CorrectEventInput): Event {
    const referenced = this.mustGet(eventId);
    const rootId = referenced.corrects_event_id ?? referenced.event_id;
    const current = this.currentVersion(rootId);

    const corrected: Event = {
      ...current,
      event_id: newId(),
      version: current.version + 1,
      created_by: changes.createdBy,
      corrects_event_id: rootId,
      ...(changes.occurredAt !== undefined ? { occurred_at: changes.occurredAt } : {}),
      ...(changes.payloadRef !== undefined ? { payload_ref: changes.payloadRef } : {}),
    };
    return this.storage.create('Event', corrected);
  }

  /** The current (max-version) row for a correction lineage rooted at `rootId`. */
  private currentVersion(rootId: UUID): Event {
    const root = this.mustGet(rootId);
    const corrections = this.storage.query('Event', { corrects_event_id: rootId });
    return corrections.reduce(
      (latest, candidate) => (candidate.version > latest.version ? candidate : latest),
      root,
    );
  }

  /**
   * The current (max-version) row of every correction lineage for a family,
   * ordered ascending by when it occurred. Shared by `list` and `recent`.
   */
  private orderedCurrentEvents(familyId: UUID): Event[] {
    const all = this.storage.query('Event', { family_id: familyId });

    const currentByLineage = new Map<UUID, Event>();
    for (const event of all) {
      const rootId = event.corrects_event_id ?? event.event_id;
      const existing = currentByLineage.get(rootId);
      if (!existing || event.version > existing.version) {
        currentByLineage.set(rootId, event);
      }
    }

    return [...currentByLineage.values()].sort(
      (a, b) =>
        Date.parse(a.occurred_at) - Date.parse(b.occurred_at) ||
        a.event_id.localeCompare(b.event_id),
    );
  }

  /**
   * The continuous, paginated timeline for a family (docs/04-Architecture/56
   * §3, §5). Returns one entry per logical event — the current version of
   * each correction lineage — ordered by when it occurred.
   */
  list(familyId: UUID, options: ListTimelineOptions = {}): TimelinePage {
    const ordered = this.orderedCurrentEvents(familyId);

    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const start = parseCursor(options.cursor);
    const items = ordered.slice(start, start + limit);
    const nextIndex = start + items.length;

    return {
      items,
      ...(nextIndex < ordered.length ? { nextCursor: String(nextIndex) } : {}),
    };
  }

  /**
   * The most recent logical events for a family, newest first — for the
   * dashboard's recent-timeline preview (docs/06-Modules/81 FR-5). Read-only.
   */
  recent(familyId: UUID, limit = 5): Event[] {
    const ordered = this.orderedCurrentEvents(familyId);
    return ordered.slice(Math.max(0, ordered.length - limit)).reverse();
  }
}
