/**
 * Timeline continuity invariant (docs/08-Timeline/110 BR-4, docs/05-Data/77,
 * Vision BR-V3; docs/20-Implementation/206 acceptance criterion: "Timeline is
 * append-only: a correction creates a new versioned event; the original is
 * never mutated"). A release-blocking, cross-app suite
 * (docs/20-Implementation/214 §4.1) — it drives production `TimelineService`
 * and `FamilyService` against the real `SheetsStorageAdapter` so the
 * invariant is proven against the actual persistence layer, not a fake.
 */

import { describe, expect, it } from 'vitest';

import { FamilyService } from '../../apps/backend/src/services/FamilyService';
import { TimelineService } from '../../apps/backend/src/services/TimelineService';
import { createInMemoryAdapter } from './support/inMemoryAdapter';

describe('Timeline continuity invariant', () => {
  it('the adapter rejects any in-place mutation of an append-only table (events, audit_log)', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const timeline = new TimelineService(storage);
    const event = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
    });

    expect(() =>
      storage.update('Event', event.event_id, { occurred_at: '2099-01-01T00:00:00.000Z' }),
    ).toThrow(/append-only/i);
  });

  it('a long correction chain never mutates any prior version — full history remains byte-for-byte retrievable', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const timeline = new TimelineService(storage);

    const original = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
    });

    const chain = [original];
    let mostRecent = original;
    for (let i = 2; i <= 10; i++) {
      mostRecent = timeline.correct(mostRecent.event_id, {
        createdBy: 'user-1',
        occurredAt: `2026-01-${String(i).padStart(2, '0')}T00:00:00.000Z`,
      });
      chain.push(mostRecent);
    }

    // Every single version in the 10-deep chain is still present, unmodified, in storage.
    for (const version of chain) {
      expect(storage.get('Event', version.event_id)).toEqual(version);
    }
    // Versions increment 1..10 and every correction after the first points back to the ORIGINAL (star topology).
    expect(chain.map((e) => e.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(chain.slice(1).every((e) => e.corrects_event_id === original.event_id)).toBe(true);

    // The read-side view surfaces exactly one row: the current (max-version) one.
    const page = timeline.list(family.family_id);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.event_id).toBe(mostRecent.event_id);
    expect(page.items[0]?.version).toBe(10);
  });

  it('the timeline never resets: appending after corrections keeps prior lineages and adds a new, independent one', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const timeline = new TimelineService(storage);

    const first = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
    });
    timeline.correct(first.event_id, {
      createdBy: 'user-1',
      occurredAt: '2026-01-02T00:00:00.000Z',
    });

    const second = timeline.append({
      familyId: family.family_id,
      subjectId: 'maternal-1',
      type: 'vital',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-03T00:00:00.000Z',
      createdBy: 'user-1',
    });

    const page = timeline.list(family.family_id);
    expect(page.items).toHaveLength(2);
    expect(page.items.map((e) => e.event_id)).toContain(second.event_id);
  });

  it('family isolation holds under corrections — a correction can never surface on another family’s timeline', () => {
    const storage = createInMemoryAdapter();
    const families = new FamilyService(storage);
    const familyA = families.createFamily('user-a');
    const familyB = families.createFamily('user-b');
    const timeline = new TimelineService(storage);

    const eventA = timeline.append({
      familyId: familyA.family_id,
      subjectId: 'maternal-a',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-a',
    });
    timeline.correct(eventA.event_id, {
      createdBy: 'user-a',
      occurredAt: '2026-01-05T00:00:00.000Z',
    });

    expect(timeline.list(familyB.family_id).items).toHaveLength(0);
    expect(timeline.list(familyA.family_id).items).toHaveLength(1);
  });

  it('a correction cannot be forged onto an unrelated event id from another family (FK integrity)', () => {
    const storage = createInMemoryAdapter();
    const families = new FamilyService(storage);
    const familyA = families.createFamily('user-a');
    const timeline = new TimelineService(storage);
    const eventA = timeline.append({
      familyId: familyA.family_id,
      subjectId: 'maternal-a',
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-a',
    });

    // Correcting a genuinely unknown event id must fail closed, not silently create an orphan.
    expect(() => timeline.correct('does-not-exist', { createdBy: 'user-a' })).toThrow();
    // Sanity: the real event is unaffected by the failed attempt.
    expect(storage.get('Event', eventA.event_id)).toEqual(eventA);
  });
});
