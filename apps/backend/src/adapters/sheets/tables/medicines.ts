/**
 * `Medicine` ↔ `medicines` tab mapping (docs/04-Architecture/54 §4,
 * docs/05-Data/70, docs/06-Modules/85 §8).
 *
 * A medicine/supplement the mother is taking belongs to a subject (the maternal
 * record in v1) and carries a free-text name and schedule plus an `active` flag.
 * The frozen field set is minimal and exact — `med_id`, `subject_id`, `name`,
 * `schedule`, `active` — so nothing here prescribes, doses, or advises
 * (docs/06-Modules/85 BR-1). There is deliberately **no `notes` field**: the
 * frozen data model omits it (docs/06-Modules/85 §8), which resolves the stray
 * mention of "notes" in that doc's FR-1 in favour of the data model.
 *
 * The table is correctable (`appendOnly: false`) so a medicine can be edited or
 * stopped (`active: false`) in place; history is preserved by the append-only
 * `medicine` timeline event and by never hard-deleting the row
 * (docs/06-Modules/85 §10, FR-4). No adapter-level foreign key is declared
 * (matching the frozen mapping); subject ownership is enforced fail-closed at
 * the controller boundary (docs/09-Security/123 §5).
 */

import { f, type TableMapping } from './types';

export const MEDICINE_TABLE: TableMapping = {
  entity: 'Medicine',
  tab: 'medicines',
  pk: 'med_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('med_id', 'string'),
    f('subject_id', 'string'),
    f('name', 'string'),
    f('schedule', 'string'),
    f('active', 'boolean'),
  ],
  foreignKeys: [],
};
