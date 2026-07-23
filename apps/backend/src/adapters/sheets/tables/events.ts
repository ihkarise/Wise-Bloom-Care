/** `Event` ↔ `events` tab mapping — append-only timeline (docs/04-Architecture/54 §4, docs/05-Data/77). */

import { f, type TableMapping } from './types';

export const EVENT_TABLE: TableMapping = {
  entity: 'Event',
  tab: 'events',
  pk: 'event_id',
  appendOnly: true,
  immutableFields: [],
  fields: [
    f('event_id', 'string'),
    f('family_id', 'string'),
    f('subject_id', 'string'),
    f('type', 'string'),
    f('life_stage', 'string'),
    f('occurred_at', 'datetime'),
    f('payload_ref', 'string', true),
    f('version', 'number'),
    f('created_by', 'string'),
    f('corrects_event_id', 'string', true),
  ],
  // Self-referential: a correction's corrects_event_id must resolve to an existing Event (docs/05-Data/77 §5).
  foreignKeys: [
    { field: 'family_id', references: 'Family' },
    { field: 'corrects_event_id', references: 'Event' },
  ],
};
