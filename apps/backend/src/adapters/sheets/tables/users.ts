/** `User` ↔ `users` tab mapping (docs/04-Architecture/54 §4, docs/06-Modules/80 §8). */

import { f, type TableMapping } from './types';

export const USER_TABLE: TableMapping = {
  entity: 'User',
  tab: 'users',
  pk: 'user_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('user_id', 'string'),
    f('email_hash', 'string'),
    f('credential_hash', 'string'),
    f('role', 'string'),
    f('status', 'string'),
    f('disclaimer_ack_at', 'datetime', true),
  ],
  foreignKeys: [],
};
