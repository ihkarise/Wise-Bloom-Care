/**
 * `Report` ↔ `reports` tab mapping (docs/04-Architecture/54 §4, docs/06-Modules/84).
 *
 * Stores metadata + a private `media_ref` only — never the media bytes and
 * never a public URL. Media is served exclusively through short-lived,
 * backend-mediated references (docs/04-Architecture/58, 84 BR-1).
 */

import { f, type TableMapping } from './types';

export const REPORT_TABLE: TableMapping = {
  entity: 'Report',
  tab: 'reports',
  pk: 'report_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('report_id', 'string'),
    f('subject_id', 'string'),
    f('kind', 'string'),
    f('media_ref', 'string'),
    f('uploaded_at', 'datetime'),
  ],
  foreignKeys: [],
};
