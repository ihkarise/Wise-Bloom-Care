/**
 * The Storage Adapter interface — independence boundary #2 and the migration key
 * (docs/04-Architecture/52 §5).
 *
 * It speaks in **domain entities** (Family, Event, Vital, …), never spreadsheet
 * ranges or SQL. Services depend on this interface only (52 BR-1); the v1 Sheets
 * implementation sits behind it, and a future Postgres/Supabase adapter is a new
 * class beside it — a new folder, not a rewrite (docs/04-Architecture/59 §4).
 */

import type { DomainEntities, EntityName } from '@wise-bloom/domain-types';

/** Field-equality filter over an entity's stored columns (docs/04-Architecture/52 §5 `query`). */
export type QueryFilter<E extends EntityName> = Partial<DomainEntities[E]>;

/** Update semantics (docs/04-Architecture/52 §5: append/version). */
export interface UpdateOptions {
  /**
   * `version` bumps a correctable record's version (default). `append` is used
   * for append-only entities where a correction is a brand-new row (docs/05-Data/77).
   */
  mode?: 'version' | 'append';
  /** Expected current version for optimistic concurrency (docs/04-Architecture/56 §11 `409 conflict`). */
  expectedVersion?: number;
}

/**
 * Storage-neutral CRUD + query over domain entities. Consistency/transaction
 * guarantees are expressed at the service level; the v1 adapter approximates
 * them on Sheets with append-only tables, adapter-enforced PK/FK/immutability
 * checks, and optimistic `expectedVersion` concurrency — there are no
 * multi-write transactions (docs/04-Architecture/53 §7). The `LockService`-based
 * serialisation that §7 also describes is not yet wired in; single-writer
 * safety therefore relies on the append-only pattern alone.
 */
export interface StorageAdapter {
  /** Insert a new record; the adapter enforces PK uniqueness and FK existence. */
  create<E extends EntityName>(entity: E, record: DomainEntities[E]): DomainEntities[E];

  /** Fetch a single record by primary key, or `null` if absent. */
  get<E extends EntityName>(entity: E, id: string): DomainEntities[E] | null;

  /** Return records matching every field in the filter (field-equality). */
  query<E extends EntityName>(entity: E, filter: QueryFilter<E>): DomainEntities[E][];

  /** List all records for an entity (adapter may page internally at scale). */
  list<E extends EntityName>(entity: E): DomainEntities[E][];

  /**
   * Apply changes to a record. Rejects changes to immutable fields and in-place
   * edits of append-only entities (docs/04-Architecture/54 BR-2/BR-3).
   */
  update<E extends EntityName>(
    entity: E,
    id: string,
    changes: Partial<DomainEntities[E]>,
    options?: UpdateOptions,
  ): DomainEntities[E];
}
