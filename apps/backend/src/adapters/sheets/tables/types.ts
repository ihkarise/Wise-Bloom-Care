/**
 * Shared table-mapping types (docs/04-Architecture/54). Split out so each
 * entity↔tab mapping can live in its own small file (docs/20-Implementation/206
 * §4) while sharing one vocabulary.
 */

import type { EntityName } from '@wise-bloom/domain-types';

export type FieldType = 'string' | 'number' | 'boolean' | 'json' | 'date' | 'datetime';

export interface FieldSpec {
  /** Column name (row-1 header) and the record property it maps to. */
  name: string;
  type: FieldType;
  /** Optional per docs/05-Data/72 (partial/retrospective data is allowed). */
  optional?: boolean;
}

export interface ForeignKey {
  field: string;
  references: EntityName;
}

export interface TableMapping {
  entity: EntityName;
  tab: string;
  pk: string;
  /** Append-only tables are never updated in place (docs/04-Architecture/54 BR-3). */
  appendOnly: boolean;
  /** Fields written once and never changed (e.g., child.mother_id — 54 BR-2). */
  immutableFields: string[];
  fields: FieldSpec[];
  foreignKeys: ForeignKey[];
}

export function f(name: string, type: FieldType, optional = false): FieldSpec {
  return optional ? { name, type, optional } : { name, type };
}
