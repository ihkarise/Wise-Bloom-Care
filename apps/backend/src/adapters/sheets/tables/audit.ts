/** `AuditRecord` ↔ `audit_log` tab mapping — append-only (docs/04-Architecture/54 §4, docs/05-Data/75). */

import { f, type TableMapping } from './types';

export const AUDIT_RECORD_TABLE: TableMapping = {
  entity: 'AuditRecord',
  tab: 'audit_log',
  pk: 'audit_id',
  appendOnly: true,
  immutableFields: [],
  fields: [
    f('audit_id', 'string'),
    f('actor_user_id', 'string'),
    f('actor_role', 'string'),
    f('action', 'string'),
    f('entity', 'string'),
    f('entity_id', 'string'),
    f('family_id', 'string', true),
    f('at', 'datetime'),
    f('correlation_id', 'string', true),
    f('meta', 'json', true),
  ],
  foreignKeys: [],
};
