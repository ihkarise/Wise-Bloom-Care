/**
 * `TrackerEntry` ↔ `tracker_entries` tab mapping (docs/06-Modules/98 §9, §12,
 * `ADR-007`).
 *
 * Append-only, one row per recorded observation — mirrors the `events` table's
 * shape (`version`, `created_by`, correction-via-new-row) but is its own table,
 * deliberately never the shared `events` table (`ADR-007`, Accepted: no
 * `EventType` widening, no per-tap `Event` row). Queried by subject + tracker
 * + date range, not by family. No adapter-level foreign key is declared
 * (matches `medicines`/`vitals`); subject ownership is enforced fail-closed
 * at the controller boundary (docs/09-Security/123 §5).
 */

import { f, type TableMapping } from './types';

export const TRACKER_ENTRY_TABLE: TableMapping = {
  entity: 'TrackerEntry',
  tab: 'tracker_entries',
  pk: 'tracker_entry_id',
  appendOnly: true,
  immutableFields: [],
  fields: [
    f('tracker_entry_id', 'string'),
    f('subject_id', 'string'),
    f('tracker_key', 'string'),
    f('value', 'string'),
    f('recorded_at', 'datetime'),
    f('version', 'number'),
    f('created_by', 'string'),
  ],
  foreignKeys: [],
};
