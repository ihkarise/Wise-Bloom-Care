/**
 * Shared test helper: a real `SheetsStorageAdapter` backed by an in-memory
 * `SheetGateway`, so service tests exercise the actual serialise/integrity
 * logic (PK/FK/append-only/immutability) rather than a hand-rolled fake
 * (docs/20-Implementation/206 §9 unit/integration tests). Mirrors the
 * in-memory gateway already proven in tests/adapter.roundtrip.test.ts,
 * factored out so it is not duplicated across service test files.
 */

import {
  SheetsStorageAdapter,
  type SheetGateway,
} from '../../src/adapters/sheets/SheetsStorageAdapter';

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

/** A fresh, empty `SheetsStorageAdapter` over an in-memory gateway — one per test for isolation. */
export function createInMemoryAdapter(): SheetsStorageAdapter {
  return new SheetsStorageAdapter(new InMemoryGateway());
}
