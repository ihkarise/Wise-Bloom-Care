/** `Session` ↔ `sessions` tab mapping (docs/04-Architecture/55 §3, docs/09-Security/122). */

import { f, type TableMapping } from './types';

export const SESSION_TABLE: TableMapping = {
  entity: 'Session',
  tab: 'sessions',
  pk: 'session_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('session_id', 'string'),
    f('user_id', 'string'),
    f('issued_at', 'datetime'),
    f('expires_at', 'datetime'),
  ],
  foreignKeys: [{ field: 'user_id', references: 'User' }],
};
