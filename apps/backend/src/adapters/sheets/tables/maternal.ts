/** `MaternalRecord` ↔ `maternal_records` tab mapping (docs/04-Architecture/54 §4). */

import { f, type TableMapping } from './types';

export const MATERNAL_RECORD_TABLE: TableMapping = {
  entity: 'MaternalRecord',
  tab: 'maternal_records',
  pk: 'maternal_id',
  appendOnly: false,
  immutableFields: [],
  fields: [f('maternal_id', 'string'), f('family_id', 'string'), f('profile', 'json')],
  foreignKeys: [{ field: 'family_id', references: 'Family' }],
};
