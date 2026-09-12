/**
 * `Appointment` ↔ `appointments` tab mapping (docs/04-Architecture/54 §4,
 * docs/04-Architecture/55 §Appointment, docs/06-Modules/95).
 *
 * A pregnancy visit belongs to a family and a subject (the maternal record in
 * v1) and carries a scheduled time and a status (docs/05-Data/72 §8 enum). The
 * frozen field set is minimal — `appt_id`, `family_id`, `subject_id`,
 * `scheduled_at`, `status` — so nothing here interprets or duplicates the
 * clinician's plan; the appointment scaffold is context only (docs/08-Timeline/110).
 */

import { f, type TableMapping } from './types';

export const APPOINTMENT_TABLE: TableMapping = {
  entity: 'Appointment',
  tab: 'appointments',
  pk: 'appt_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('appt_id', 'string'),
    f('family_id', 'string'),
    f('subject_id', 'string'),
    f('scheduled_at', 'datetime'),
    f('status', 'string'),
  ],
  foreignKeys: [{ field: 'family_id', references: 'Family' }],
};
