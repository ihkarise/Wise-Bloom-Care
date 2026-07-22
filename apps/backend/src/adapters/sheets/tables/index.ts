/**
 * Entity ↔ Sheets-tab mappings (docs/04-Architecture/54).
 *
 * Each domain entity maps to exactly one tab ("table"), with an ordered column
 * layout, a primary key, append-only/immutability metadata, and foreign keys —
 * the facts the adapter needs to serialise records to rows and enforce
 * integrity that Sheets itself cannot (54 §5). This table is the *only* place
 * that knows the physical layout; everything above it speaks domain entities.
 */

import type { EntityName } from '@wise-bloom/domain-types';

export type FieldType = 'string' | 'number' | 'boolean' | 'json' | 'date' | 'datetime';

export interface FieldSpec {
  /** Column name (row-1 header) and the record property it maps to. */
  name: string;
  type: FieldType;
  /** Optional per docs/05-Data/72 (partial/retrospective data is allowed). */
  optional?: boolean;
}

export interface ForeignKey {
  field: string;
  references: EntityName;
}

export interface TableMapping {
  entity: EntityName;
  tab: string;
  pk: string;
  /** Append-only tables are never updated in place (docs/04-Architecture/54 BR-3). */
  appendOnly: boolean;
  /** Fields written once and never changed (e.g., child.mother_id — 54 BR-2). */
  immutableFields: string[];
  fields: FieldSpec[];
  foreignKeys: ForeignKey[];
}

function f(name: string, type: FieldType, optional = false): FieldSpec {
  return optional ? { name, type, optional } : { name, type };
}

/**
 * The core tables from docs/04-Architecture/54 §4. Column sets are the
 * authoritative field specs from docs/05-Data/70,72.
 */
export const TABLES: Record<EntityName, TableMapping> = {
  Family: {
    entity: 'Family',
    tab: 'families',
    pk: 'family_id',
    appendOnly: false,
    immutableFields: [],
    fields: [f('family_id', 'string'), f('owner_user_id', 'string'), f('created_at', 'datetime')],
    foreignKeys: [],
  },
  User: {
    entity: 'User',
    tab: 'users',
    pk: 'user_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('user_id', 'string'),
      f('email_hash', 'string'),
      f('credential_hash', 'string'),
      f('role', 'string'),
      f('status', 'string'),
    ],
    foreignKeys: [],
  },
  Session: {
    entity: 'Session',
    tab: 'sessions',
    pk: 'session_id',
    appendOnly: false,
    immutableFields: [],
    fields: [f('session_id', 'string'), f('user_id', 'string'), f('expires_at', 'datetime')],
    foreignKeys: [{ field: 'user_id', references: 'User' }],
  },
  MaternalRecord: {
    entity: 'MaternalRecord',
    tab: 'maternal_records',
    pk: 'maternal_id',
    appendOnly: false,
    immutableFields: [],
    fields: [f('maternal_id', 'string'), f('family_id', 'string'), f('profile', 'json')],
    foreignKeys: [{ field: 'family_id', references: 'Family' }],
  },
  PregnancyEpisode: {
    entity: 'PregnancyEpisode',
    tab: 'pregnancy_episodes',
    pk: 'episode_id',
    appendOnly: false,
    immutableFields: [],
    fields: [
      f('episode_id', 'string'),
      f('maternal_id', 'string'),
      f('lmp', 'date', true),
      f('edd', 'date', true),
      f('pre_pregnancy_bmi_cat', 'string'),
      f('parity', 'string'),
      f('status', 'string'),
    ],
    foreignKeys: [{ field: 'maternal_id', references: 'MaternalRecord' }],
  },
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
  Event: {
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
    ],
    foreignKeys: [{ field: 'family_id', references: 'Family' }],
  },
  Vital: {
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
  },
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
  Report: {
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
  },
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
  AuditRecord: {
    entity: 'AuditRecord',
    tab: 'audit_log',
    pk: 'audit_id',
    appendOnly: true,
    immutableFields: [],
    fields: [
      f('audit_id', 'string'),
      f('actor_user_id', 'string'),
      f('actor_role', 'string'),
      f('action', 'string'),
      f('entity', 'string'),
      f('entity_id', 'string'),
      f('family_id', 'string', true),
      f('at', 'datetime'),
      f('correlation_id', 'string', true),
      f('meta', 'json', true),
    ],
    foreignKeys: [],
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
