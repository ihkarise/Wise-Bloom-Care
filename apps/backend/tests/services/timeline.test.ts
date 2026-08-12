/**
 * TimelineService tests (docs/20-Implementation/206 §9: "timeline
 * append/version"; acceptance criteria: append-only, corrections never mutate
 * the original, paginated list).
 */

import { describe, expect, it } from 'vitest';

import { FamilyService } from '../../src/services/FamilyService';
import { TimelineEventNotFoundError, TimelineService } from '../../src/services/TimelineService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function seedFamily(storage: ReturnType<typeof createInMemoryAdapter>) {
  return new FamilyService(storage).createFamily('user-1');
}

describe('TimelineService.append', () => {
  it('creates an original event at version 1', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);

    const event = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-02-02T10:00:00.000Z',
      createdBy: 'user-1',
    });

    expect(event.version).toBe(1);
    expect(event.corrects_event_id).toBeUndefined();
  });
});

describe('TimelineService.correct', () => {
  it('never mutates the original row — a correction is a new event referencing it', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);
    const original = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-02-02T10:00:00.000Z',
      createdBy: 'user-1',
    });

    const corrected = timeline.correct(original.event_id, {
      createdBy: 'user-1',
      occurredAt: '2026-02-03T10:00:00.000Z',
    });

    expect(corrected.event_id).not.toBe(original.event_id);
    expect(corrected.version).toBe(2);
    expect(corrected.corrects_event_id).toBe(original.event_id);
    expect(corrected.occurred_at).toBe('2026-02-03T10:00:00.000Z');

    // The original row, fetched fresh from storage, is byte-for-byte unchanged.
    expect(storage.get('Event', original.event_id)).toEqual(original);
  });

  it('chains multiple corrections back to the same lineage root', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);
    const original = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-02-02T10:00:00.000Z',
      createdBy: 'user-1',
    });

    const first = timeline.correct(original.event_id, {
      createdBy: 'user-1',
      occurredAt: '2026-02-03T10:00:00.000Z',
    });
    // Correcting via the *correction's* id must still resolve to the same lineage root.
    const second = timeline.correct(first.event_id, {
      createdBy: 'user-1',
      occurredAt: '2026-02-04T10:00:00.000Z',
    });

    expect(second.version).toBe(3);
    expect(second.corrects_event_id).toBe(original.event_id);
  });

  it('throws for an unknown event id', () => {
    const storage = createInMemoryAdapter();
    const timeline = new TimelineService(storage);
    expect(() => timeline.correct('missing', { createdBy: 'user-1' })).toThrow(
      TimelineEventNotFoundError,
    );
  });
});

describe('TimelineService.list', () => {
  it('is empty for a family with no events', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);
    expect(timeline.list(family.family_id)).toEqual({ items: [] });
  });

  it('shows only the current version of a corrected event, not both rows', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);
    const original = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-02-02T10:00:00.000Z',
      createdBy: 'user-1',
    });
    const corrected = timeline.correct(original.event_id, {
      createdBy: 'user-1',
      occurredAt: '2026-02-05T10:00:00.000Z',
    });

    const page = timeline.list(family.family_id);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.event_id).toBe(corrected.event_id);
  });

  it('orders by occurred_at and paginates via an opaque cursor', () => {
    const storage = createInMemoryAdapter();
    const family = seedFamily(storage);
    const timeline = new TimelineService(storage);
    const times = [
      '2026-01-03T10:00:00.000Z',
      '2026-01-01T10:00:00.000Z',
      '2026-01-02T10:00:00.000Z',
    ];
    for (const occurredAt of times) {
      timeline.append({
        familyId: family.family_id,
        subjectId: 'maternal-1',
        type: 'note',
        lifeStage: 'pregnancy',
        occurredAt,
        createdBy: 'user-1',
      });
    }

    const page1 = timeline.list(family.family_id, { limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.occurred_at).toBe('2026-01-01T10:00:00.000Z');
    expect(page1.items[1]?.occurred_at).toBe('2026-01-02T10:00:00.000Z');
    expect(page1.nextCursor).toBeDefined();

    const page2 = timeline.list(family.family_id, {
      limit: 2,
      ...(page1.nextCursor ? { cursor: page1.nextCursor } : {}),
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.occurred_at).toBe('2026-01-03T10:00:00.000Z');
    expect(page2.nextCursor).toBeUndefined();
  });

  it('only returns events for the requested family (family scoping)', () => {
    const storage = createInMemoryAdapter();
    const familyA = seedFamily(storage);
    const familyB = new FamilyService(storage).createFamily('user-2');
    const timeline = new TimelineService(storage);

    timeline.append({
      familyId: familyA.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T10:00:00.000Z',
      createdBy: 'user-1',
    });

    expect(timeline.list(familyB.family_id).items).toHaveLength(0);
  });
});
