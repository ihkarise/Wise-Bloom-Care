/**
 * Sheets Storage Adapter (v1) — the ONLY place that touches `SpreadsheetApp`
 * (docs/04-Architecture/53 BR-1, enforced by the `no-sheets-outside-adapter`
 * lint rule). It implements the storage-neutral `StorageAdapter` interface over
 * Google Sheets by mapping domain entities to tabs/rows (docs/04-Architecture/54).
 *
 * The physical Sheets access is isolated behind a small `SheetGateway` port, so
 * the mapping/integrity logic is unit-testable with an in-memory fake while the
 * production path uses `SpreadsheetApp`.
 */

import { sanitizeString } from '../../lib/validation';
import {
  assertForeignKeys,
  assertImmutableUnchanged,
  assertNotAppendOnly,
  assertUniquePk,
  IntegrityError,
} from './integrity/index';
import { tableFor, type FieldSpec, type TableMapping } from './tables/index';

import type { StorageAdapter, UpdateOptions } from '../StorageAdapter';
import type { DomainEntities, EntityName } from '@wise-bloom/domain-types';

/**
 * Minimal tabular port the adapter needs. The SpreadsheetApp implementation is
 * below; tests supply an in-memory implementation. Rows exclude the header.
 */
export interface SheetGateway {
  /** Create the tab with the given header if it does not yet exist. */
  ensureTable(tab: string, header: string[]): void;
  /** All data rows (header excluded), each aligned to the header order. */
  readAll(tab: string): string[][];
  /** Append one data row. */
  append(tab: string, row: string[]): void;
  /** Overwrite the data row at `index` (0-based among data rows). */
  updateRow(tab: string, index: number, row: string[]): void;
}

type Row = string[];

function serializeCell(field: FieldSpec, value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  switch (field.type) {
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'json':
      return sanitizeString(JSON.stringify(value));
    case 'string':
    case 'date':
    case 'datetime':
    default:
      return sanitizeString(String(value));
  }
}

function deserializeCell(field: FieldSpec, cell: string): unknown {
  if (cell === '') {
    return undefined;
  }
  switch (field.type) {
    case 'number':
      return Number(cell);
    case 'boolean':
      return cell === 'true';
    case 'json':
      return JSON.parse(cell);
    case 'string':
    case 'date':
    case 'datetime':
    default:
      return cell;
  }
}

export class SheetsStorageAdapter implements StorageAdapter {
  constructor(private readonly gateway: SheetGateway) {}

  private header(table: TableMapping): string[] {
    return table.fields.map((field) => field.name);
  }

  private serialize(table: TableMapping, record: Record<string, unknown>): Row {
    return table.fields.map((field) => serializeCell(field, record[field.name]));
  }

  private deserialize<E extends EntityName>(table: TableMapping, row: Row): DomainEntities[E] {
    const record: Record<string, unknown> = {};
    table.fields.forEach((field, index) => {
      const value = deserializeCell(field, row[index] ?? '');
      if (value !== undefined) {
        record[field.name] = value;
      }
    });
    return record as unknown as DomainEntities[E];
  }

  private pkIndex(table: TableMapping): number {
    return table.fields.findIndex((field) => field.name === table.pk);
  }

  private rows(table: TableMapping): Row[] {
    this.gateway.ensureTable(table.tab, this.header(table));
    return this.gateway.readAll(table.tab);
  }

  create<E extends EntityName>(entity: E, record: DomainEntities[E]): DomainEntities[E] {
    const table = tableFor(entity);
    const asRecord = record as unknown as Record<string, unknown>;
    const id = asRecord[table.pk];
    if (typeof id !== 'string' || id === '') {
      throw new IntegrityError(`Missing ${table.pk} on ${entity}`);
    }

    const pkIndex = this.pkIndex(table);
    const existingIds = this.rows(table).map((row) => row[pkIndex] ?? '');
    assertUniquePk(table, id, existingIds);
    assertForeignKeys(table, asRecord, (references, refId) => this.get(references, refId) !== null);

    this.gateway.append(table.tab, this.serialize(table, asRecord));
    return record;
  }

  get<E extends EntityName>(entity: E, id: string): DomainEntities[E] | null {
    const table = tableFor(entity);
    const pkIndex = this.pkIndex(table);
    const match = this.rows(table).find((row) => row[pkIndex] === id);
    return match ? this.deserialize<E>(table, match) : null;
  }

  query<E extends EntityName>(entity: E, filter: Partial<DomainEntities[E]>): DomainEntities[E][] {
    const table = tableFor(entity);
    const entries = Object.entries(filter as unknown as Record<string, unknown>);
    return this.rows(table)
      .map((row) => this.deserialize<E>(table, row))
      .filter((record) => {
        const asRecord = record as unknown as Record<string, unknown>;
        return entries.every(([key, value]) => asRecord[key] === value);
      });
  }

  list<E extends EntityName>(entity: E): DomainEntities[E][] {
    const table = tableFor(entity);
    return this.rows(table).map((row) => this.deserialize<E>(table, row));
  }

  update<E extends EntityName>(
    entity: E,
    id: string,
    changes: Partial<DomainEntities[E]>,
    options: UpdateOptions = {},
  ): DomainEntities[E] {
    const table = tableFor(entity);
    assertNotAppendOnly(table);

    const pkIndex = this.pkIndex(table);
    const rows = this.rows(table);
    const index = rows.findIndex((row) => row[pkIndex] === id);
    if (index === -1) {
      throw new IntegrityError(`${entity} ${id} not found`);
    }

    const current = this.deserialize<E>(table, rows[index] as Row) as unknown as Record<
      string,
      unknown
    >;
    const changeRecord = changes as unknown as Record<string, unknown>;
    assertImmutableUnchanged(table, current, changeRecord);

    if (options.expectedVersion !== undefined && current['version'] !== options.expectedVersion) {
      throw new IntegrityError(`Version conflict updating ${entity} ${id}`);
    }

    const next: Record<string, unknown> = { ...current, ...changeRecord };
    if (typeof current['version'] === 'number') {
      next['version'] = (current['version'] as number) + 1;
    }

    this.gateway.updateRow(table.tab, index, this.serialize(table, next));
    return next as unknown as DomainEntities[E];
  }
}

/**
 * Production `SheetGateway` backed by a single per-environment spreadsheet
 * (docs/04-Architecture/54 §3). This is the only code that references
 * `SpreadsheetApp`; keep all Sheets primitives here.
 */
export class SpreadsheetAppGateway implements SheetGateway {
  private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor(spreadsheetId: string) {
    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }

  private sheet(tab: string): GoogleAppsScript.Spreadsheet.Sheet {
    const existing = this.spreadsheet.getSheetByName(tab);
    return existing ?? this.spreadsheet.insertSheet(tab);
  }

  ensureTable(tab: string, header: string[]): void {
    const sheet = this.sheet(tab);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }
  }

  readAll(tab: string): string[][] {
    const sheet = this.sheet(tab);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) {
      return [];
    }
    return sheet
      .getRange(2, 1, lastRow - 1, lastCol)
      .getValues()
      .map((row) => row.map((cell) => (cell === '' ? '' : String(cell))));
  }

  append(tab: string, row: string[]): void {
    this.sheet(tab).appendRow(row);
  }

  updateRow(tab: string, index: number, row: string[]): void {
    this.sheet(tab)
      .getRange(index + 2, 1, 1, row.length)
      .setValues([row]);
  }
}
