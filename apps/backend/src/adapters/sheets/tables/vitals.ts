/**
 * `Vital` ↔ `vitals` tab mapping (docs/04-Architecture/54 §4, docs/05-Data/72 §5).
 *
 * Canonical units are stored (weight kg, glucose mg/dL, BP mmHg); display
 * conversion is client-side (72 BR-1). Blood pressure is two rows — one
 * `context: 'systolic'` and one `context: 'diastolic'` — sharing `measured_at`
 * (frozen domain model); the pairing back into one logical reading happens at
 * the service layer, never in storage.
 */

import { f, type TableMapping } from './types';

export const VITAL_TABLE: TableMapping = {
  entity: 'Vital',
  tab: 'vitals',
  pk: 'vital_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('vital_id', 'string'),
    f('subject_id', 'string'),
    f('type', 'string'),
    f('value', 'number'),
    f('unit', 'string'),
    f('context', 'string', true),
    f('measured_at', 'datetime'),
  ],
  foreignKeys: [],
};
