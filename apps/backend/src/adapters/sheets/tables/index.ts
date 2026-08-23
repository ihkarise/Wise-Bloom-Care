/**
 * Entity ↔ Sheets-tab mappings (docs/04-Architecture/54).
 *
 * Each domain entity maps to exactly one tab ("table"), with an ordered column
 * layout, a primary key, append-only/immutability metadata, and foreign keys —
 * the facts the adapter needs to serialise records to rows and enforce
 * integrity that Sheets itself cannot (54 §5). This table is the *only* place
 * that knows the physical layout; everything above it speaks domain entities.
 *
 * Shipped-module entities each have their own file, one responsibility per
 * module: Sprint 01's users, sessions, families, maternal, pregnancyEpisodes,
 * events, audit (docs/20-Implementation/206 §4); Sprint 02's vitals and reports
 * (docs/20-Implementation/207 §4). Entities not yet owned by a shipped module
 * stay inline below until their sprint gives them a dedicated file.
 */

import { AUDIT_RECORD_TABLE } from './audit';
import { EVENT_TABLE } from './events';
import { FAMILY_TABLE } from './families';
import { MATERNAL_RECORD_TABLE } from './maternal';
import { PREGNANCY_EPISODE_TABLE } from './pregnancyEpisodes';
import { REPORT_TABLE } from './reports';
import { SESSION_TABLE } from './sessions';
import { f, type TableMapping } from './types';
import { USER_TABLE } from './users';
import { VITAL_TABLE } from './vitals';

import type { EntityName } from '@wise-bloom/domain-types';

export type { FieldSpec, FieldType, ForeignKey, TableMapping } from './types';

/**
 * The core tables from docs/04-Architecture/54 §4. Column sets are the
 * authoritative field specs from docs/05-Data/70,72.
 */
export const TABLES: Record<EntityName, TableMapping> = {
  Family: FAMILY_TABLE,
  User: USER_TABLE,
  Session: SESSION_TABLE,
  MaternalRecord: MATERNAL_RECORD_TABLE,
  PregnancyEpisode: PREGNANCY_EPISODE_TABLE,
  Event: EVENT_TABLE,
  AuditRecord: AUDIT_RECORD_TABLE,
  ChildRecord: {
    entity: 'ChildRecord',
    tab: 'child_records',
    pk: 'child_id',
    appendOnly: false,
    immutableFields: ['mother_id', 'episode_id'],
    fields: [
      f('child_id', 'string'),
      f('family_id', 'string'),
      f('mother_id', 'string'),
      f('episode_id', 'string'),
      f('dob', 'date'),
      f('sex', 'string'),
      f('ga_at_birth_weeks', 'number', true),
    ],
    foreignKeys: [
      { field: 'family_id', references: 'Family' },
      { field: 'mother_id', references: 'MaternalRecord' },
      { field: 'episode_id', references: 'PregnancyEpisode' },
    ],
  },
  Vital: VITAL_TABLE,
  GrowthMeasurement: {
    entity: 'GrowthMeasurement',
    tab: 'growth_measurements',
    pk: 'gm_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('gm_id', 'string'),
      f('child_id', 'string'),
      f('indicator', 'string'),
      f('value', 'number'),
      f('unit', 'string'),
      f('measured_at', 'datetime'),
      f('corrected_age_flag', 'boolean', true),
    ],
    foreignKeys: [{ field: 'child_id', references: 'ChildRecord' }],
  },
  Milestone: {
    entity: 'Milestone',
    tab: 'milestones',
    pk: 'ms_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('ms_id', 'string'),
      f('child_id', 'string'),
      f('milestone_code', 'string'),
      f('status', 'string'),
      f('observed_at', 'datetime'),
    ],
    foreignKeys: [{ field: 'child_id', references: 'ChildRecord' }],
  },
  Vaccination: {
    entity: 'Vaccination',
    tab: 'vaccinations',
    pk: 'vax_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('vax_id', 'string'),
      f('child_id', 'string'),
      f('vaccine_code', 'string'),
      f('dose_no', 'number'),
      f('status', 'string'),
      f('given_at', 'datetime', true),
    ],
    foreignKeys: [{ field: 'child_id', references: 'ChildRecord' }],
  },
  Report: REPORT_TABLE,
  JournalEntry: {
    entity: 'JournalEntry',
    tab: 'journal',
    pk: 'journal_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('journal_id', 'string'),
      f('subject_id', 'string'),
      f('body', 'string'),
      f('media_ref', 'string', true),
      f('created_at', 'datetime'),
    ],
    foreignKeys: [],
  },
  Appointment: {
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
  },
  Medicine: {
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
  },
  CaregiverAccess: {
    entity: 'CaregiverAccess',
    tab: 'caregiver_access',
    pk: 'grant_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('grant_id', 'string'),
      f('family_id', 'string'),
      f('user_id', 'string'),
      f('scope', 'string'),
      f('granted_by', 'string'),
      f('revoked_at', 'datetime', true),
    ],
    foreignKeys: [
      { field: 'family_id', references: 'Family' },
      { field: 'user_id', references: 'User' },
    ],
  },
  ContentItem: {
    entity: 'ContentItem',
    tab: 'content_index',
    pk: 'content_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('content_id', 'string'),
      f('life_stage', 'string', true),
      f('topic', 'string'),
      f('content_type', 'string'),
      f('source_ref', 'string'),
      f('kb_path', 'string'),
      f('version', 'string'),
    ],
    foreignKeys: [],
  },
  ScheduleEntry: {
    entity: 'ScheduleEntry',
    tab: 'schedules',
    pk: 'sched_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('sched_id', 'string'),
      f('jurisdiction', 'string'),
      f('version', 'string'),
      f('vaccine_code', 'string'),
      f('dose_no', 'number'),
      f('age_min', 'number'),
      f('age_max', 'number'),
      f('source_ref', 'string'),
    ],
    foreignKeys: [],
  },
};

/** Returns the mapping for an entity (never undefined — the record is exhaustive). */
export function tableFor(entity: EntityName): TableMapping {
  return TABLES[entity];
}
