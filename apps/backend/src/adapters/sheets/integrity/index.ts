/**
 * Adapter-enforced integrity (docs/04-Architecture/54 §5, docs/05-Data/71 §7).
 *
 * Google Sheets has no relational constraints, so the adapter enforces them:
 * PK uniqueness, FK existence, immutability of write-once links (child.mother_id),
 * and append-only tables (events, audit_log). These are pure checks over the
 * current rows, evaluated by the adapter immediately before each write
 * (docs/04-Architecture/53 §7). They are not yet serialised behind
 * `LockService`, so they are read-then-write rather than atomic — see the
 * StorageAdapter interface docs.
 */

import type { TableMapping } from '../tables/index';

/** A safe integrity error (no PHI) surfaced as `conflict`/`validation_failed` at the API (docs/04-Architecture/56 §8). */
export class IntegrityError extends Error {
  override readonly name = 'IntegrityError';
  constructor(message: string) {
    super(message);
  }
}

/** Rejects a duplicate primary key on insert (docs/04-Architecture/54 §5). */
export function assertUniquePk(
  table: TableMapping,
  id: string,
  existingIds: Iterable<string>,
): void {
  for (const existing of existingIds) {
    if (existing === id) {
      throw new IntegrityError(`Duplicate ${table.pk} in ${table.tab}`);
    }
  }
}

/** A resolver that answers whether a referenced record exists in another table. */
export type ExistenceResolver = (
  references: TableMapping['foreignKeys'][number]['references'],
  id: string,
) => boolean;

/** Rejects writes whose foreign keys do not resolve (docs/04-Architecture/54 BR-4). */
export function assertForeignKeys(
  table: TableMapping,
  record: Record<string, unknown>,
  exists: ExistenceResolver,
): void {
  for (const fk of table.foreignKeys) {
    const value = record[fk.field];
    if (value === undefined || value === null || value === '') {
      continue; // optional/absent references are handled by field-level validation
    }
    if (typeof value !== 'string' || !exists(fk.references, value)) {
      throw new IntegrityError(
        `Unresolved foreign key ${table.tab}.${fk.field} → ${fk.references}`,
      );
    }
  }
}

/** Rejects any change to a write-once field, e.g. child.mother_id (docs/04-Architecture/54 BR-2). */
export function assertImmutableUnchanged(
  table: TableMapping,
  current: Record<string, unknown>,
  changes: Record<string, unknown>,
): void {
  for (const field of table.immutableFields) {
    if (field in changes && changes[field] !== current[field]) {
      throw new IntegrityError(`Field ${table.tab}.${field} is immutable`);
    }
  }
}

/** Rejects in-place updates to append-only tables — corrections are new versions (docs/05-Data/77). */
export function assertNotAppendOnly(table: TableMapping): void {
  if (table.appendOnly) {
    throw new IntegrityError(`${table.tab} is append-only; write a new versioned record instead`);
  }
}
