/**
 * In-memory backing for the real `SheetsStorageAdapter` (production code,
 * `apps/backend/src`), so this cross-app integrity suite exercises actual
 * append-only/PK/FK enforcement rather than a re-implemented fake
 * (docs/20-Implementation/201 §5: `tests/integrity` validates invariants
 * that span apps). Deliberately not shared with
 * `apps/backend/tests/support/inMemoryAdapter.ts` — that file is private test
 * fixture of the backend package; this suite depends only on backend
 * *production* source, keeping the dependency direction one-way.
 */

import {
  SheetsStorageAdapter,
  type SheetGateway,
} from '../../../apps/backend/src/adapters/sheets/SheetsStorageAdapter';

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

export function createInMemoryAdapter(): SheetsStorageAdapter {
  return new SheetsStorageAdapter(new InMemoryGateway());
}
