/**
 * Integration test for the storage-independence boundary #2
 * (docs/20-Implementation/205 §8, §9; docs/04-Architecture/52 §5).
 *
 * Drives the `StorageAdapter` interface — service-less — to create and read one
 * `Event` against an in-memory Sheets gateway (a stand-in for the dev
 * spreadsheet in CI, where live Google Sheets is unavailable), and verifies that
 * an `AuditService` write produces an audit record with **no PHI in the logs**.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  SheetsStorageAdapter,
  type SheetGateway,
} from '../src/adapters/sheets/SheetsStorageAdapter';
import { newId } from '../src/lib/ids';
import { createLogger, type LogEntry } from '../src/lib/logging';
import { AuditService } from '../src/services/AuditService';

import type { Event, Family } from '@wise-bloom/domain-types';

/** In-memory `SheetGateway` — the same interface the SpreadsheetApp gateway implements. */
class InMemoryGateway implements SheetGateway {
  private readonly tables = new Map<string, { header: string[]; rows: string[][] }>();

  ensureTable(tab: string, header: string[]): void {
    if (!this.tables.has(tab)) {
      this.tables.set(tab, { header, rows: [] });
    }
  }

  readAll(tab: string): string[][] {
    return this.tables.get(tab)?.rows.map((row) => [...row]) ?? [];
  }

  append(tab: string, row: string[]): void {
    this.tables.get(tab)?.rows.push([...row]);
  }

  updateRow(tab: string, index: number, row: string[]): void {
    const table = this.tables.get(tab);
    if (table) {
      table.rows[index] = [...row];
    }
  }
}

function makeFamily(): Family {
  return {
    family_id: newId(),
    owner_user_id: newId(),
    created_at: '2026-01-01T09:00:00.000Z',
  };
}

function makeEvent(family: Family): Event {
  return {
    event_id: newId(),
    family_id: family.family_id,
    subject_id: newId(),
    type: 'vital',
    life_stage: 'pregnancy',
    occurred_at: '2026-02-02T10:30:00.000Z',
    version: 1,
    created_by: family.owner_user_id,
  };
}

describe('SheetsStorageAdapter round-trip', () => {
  it('creates and reads back one Event through the interface', () => {
    const adapter = new SheetsStorageAdapter(new InMemoryGateway());
    const family = makeFamily();
    adapter.create('Family', family);

    const event = makeEvent(family);
    const created = adapter.create('Event', event);
    expect(created).toEqual(event);

    const fetched = adapter.get('Event', event.event_id);
    expect(fetched).toEqual(event);
  });

  it('enforces the family foreign key on Event insert (docs/04-Architecture/54 BR-4)', () => {
    const adapter = new SheetsStorageAdapter(new InMemoryGateway());
    const orphan = makeEvent(makeFamily()); // family never created
    expect(() => adapter.create('Event', orphan)).toThrowError(/foreign key/i);
  });

  it('rejects in-place updates to the append-only events table (docs/05-Data/77)', () => {
    const adapter = new SheetsStorageAdapter(new InMemoryGateway());
    const family = makeFamily();
    adapter.create('Family', family);
    const event = makeEvent(family);
    adapter.create('Event', event);
    expect(() => adapter.update('Event', event.event_id, { version: 2 })).toThrowError(
      /append-only/i,
    );
  });

  it('produces an audit record with no PHI in the operational logs (docs/05-Data/75, docs/04-Architecture/63)', () => {
    const captured: LogEntry[] = [];
    const logger = createLogger({ sink: (entry) => captured.push(entry) });
    const adapter = new SheetsStorageAdapter(new InMemoryGateway());
    const audit = new AuditService(adapter, logger, () => '2026-03-03T12:00:00.000Z');

    const record = audit.record({
      actorUserId: newId(),
      actorRole: 'account_holder',
      action: 'create',
      entity: 'Event',
      entityId: newId(),
      meta: { version: 1 },
    });

    // The audit record was appended to the append-only audit log.
    expect(adapter.get('AuditRecord', record.audit_id)).toEqual(record);

    // Exactly one operational log line, carrying only allowlisted, non-PHI keys.
    expect(captured).toHaveLength(1);
    const line = JSON.stringify(captured[0]);
    expect(captured[0]?.redacted_keys ?? []).toEqual([]);
    expect(line).not.toContain('credential');
    expect(line).not.toContain('Jane'); // names are never logged
    expect(captured[0]?.context.action).toBe('create');
  });

  it('does not touch the console sink by default in this suite', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger({ sink: () => undefined });
    logger.info('noop');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
