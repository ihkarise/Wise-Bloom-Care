/**
 * `Appointment` ↔ `appointments` tab mapping (docs/04-Architecture/54 §4,
 * docs/05-Data/72). An appointment is a scheduled or recorded visit — a plan,
 * so `scheduled_at` may be in the future (unlike a measured vital). The frozen
 * schema is deliberately minimal: id, family, subject, when, status
 * (docs/04-Architecture/55 §Appointment). Family-scoped via a foreign key to
 * `Family`; the subject is the family's maternal record (enforced at the
 * service/controller boundary, not by an FK, so the timeline can later span
 * other subjects).
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
