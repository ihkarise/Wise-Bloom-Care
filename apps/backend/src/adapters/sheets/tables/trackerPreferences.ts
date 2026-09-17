/**
 * `TrackerPreference` ↔ `tracker_preferences` tab mapping (docs/06-Modules/98
 * §9, §22 D-3).
 *
 * Which curated tracker templates a maternal subject has activated. Mirrors
 * the `medicines` table's correctable pattern exactly (`appendOnly: false`):
 * `active` is flipped in place, never versioned, never hard-deleted —
 * deactivating preserves the row and its history (98 BR-3). One row per
 * (`subject_id`, `tracker_key`); reactivating an inactive tracker reuses the
 * same row rather than creating a duplicate. No adapter-level foreign key is
 * declared (matches the `medicines`/`vitals` mapping); subject ownership is
 * enforced fail-closed at the controller boundary (docs/09-Security/123 §5).
 */

import { f, type TableMapping } from './types';

export const TRACKER_PREFERENCE_TABLE: TableMapping = {
  entity: 'TrackerPreference',
  tab: 'tracker_preferences',
  pk: 'tracker_pref_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('tracker_pref_id', 'string'),
    f('subject_id', 'string'),
    f('tracker_key', 'string'),
    f('active', 'boolean'),
  ],
  foreignKeys: [],
};
