/** `Family` ↔ `families` tab mapping (docs/04-Architecture/54 §4). */

import { f, type TableMapping } from './types';

export const FAMILY_TABLE: TableMapping = {
  entity: 'Family',
  tab: 'families',
  pk: 'family_id',
  appendOnly: false,
  immutableFields: [],
  fields: [f('family_id', 'string'), f('owner_user_id', 'string'), f('created_at', 'datetime')],
  foreignKeys: [],
};
