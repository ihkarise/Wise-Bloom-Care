/**
 * Wise Bloom Care — shared domain types.
 *
 * Storage-neutral TypeScript mirror of the authoritative data model
 * (docs/05-Data/70-DATA_DICTIONARY.md and docs/05-Data/72-FIELD_SPECIFICATIONS.md).
 * These types describe domain entities — never spreadsheet ranges or SQL rows —
 * so both the frontend and backend agree on shapes while storage stays swappable
 * (docs/04-Architecture/52 §5, NFR-6).
 *
 * Conventions (docs/05-Data/72 §3):
 *  - IDs are opaque UUID strings.
 *  - `datetime` fields are ISO 8601 UTC strings; `date` fields are ISO 8601 dates.
 *  - Canonical units are stored; display conversion happens client-side.
 *  - Enums are closed sets (docs/05-Data/72 BR-3).
 */

// ---------------------------------------------------------------------------
// Scalar aliases (docs/05-Data/72 §3, §4)
// ---------------------------------------------------------------------------

/** Opaque UUID string. */
export type UUID = string;

/** ISO 8601 date, `YYYY-MM-DD` (docs/05-Data/72 §4). */
export type ISODate = string;

/** ISO 8601 timestamp in UTC (docs/05-Data/72 §4). */
export type ISODateTime = string;

/** Private, backend-mediated media reference; never a public link (docs/05-Data/72 §11). */
export type MediaRef = string;

/** Resolves to a research source in docs/02-Research/27 (docs/05-Data/72 §9). */
export type SourceRef = string;

// ---------------------------------------------------------------------------
// Enumerations (closed sets — docs/05-Data/72)
// ---------------------------------------------------------------------------

/** Account role (docs/05-Data/72 §10). */
export type Role = 'account_holder' | 'caregiver' | 'clinician';

/** Auth identity status (docs/05-Data/70 §User). */
export type UserStatus = 'active' | 'locked';

/** Pre-pregnancy BMI category → weight-gain bands (docs/05-Data/72 §6). */
export type BmiCategory = 'under25' | '25to29' | '30plus' | 'unknown';

/** Parity → NICE scaffold (docs/05-Data/72 §6). */
export type Parity = 'nulliparous' | 'parous' | 'unknown';

/** Pregnancy episode outcome/state (docs/05-Data/70 §PregnancyEpisode). */
export type PregnancyStatus = 'active' | 'delivered' | 'loss';

/** Biological sex — required for the WHO growth curve (docs/05-Data/72 §7). */
export type Sex = 'female' | 'male';

/** Timeline event type (docs/05-Data/72 §8). */
export type EventType =
  | 'vital'
  | 'appointment'
  | 'report'
  | 'medicine'
  | 'delivery'
  | 'growth'
  | 'milestone'
  | 'vaccination'
  | 'journal'
  | 'note';

/** Journey life-stage (docs/05-Data/72 §8). */
export type LifeStage =
  | 'conception'
  | 'pregnancy'
  | 'delivery'
  | 'postpartum'
  | 'newborn'
  | 'infancy'
  | 'toddler'
  | 'child';

/** Vital measurement type (docs/05-Data/70 §Vital). */
export type VitalType = 'bp' | 'weight' | 'blood_sugar';

/** Type-specific vital context (docs/05-Data/70 §Vital, 72 §5). */
export type VitalContext = 'systolic' | 'diastolic' | 'fasting' | '1h_post' | '2h_post' | 'random';

/** WHO growth indicator (docs/05-Data/72 §7). */
export type GrowthIndicator =
  'weight_for_age' | 'length_for_age' | 'weight_for_length' | 'bmi_for_age';

/** CDC milestone status (docs/05-Data/72 §7). */
export type MilestoneStatus = 'achieved' | 'not_yet' | 'not_sure';

/** Immunization dose status (docs/05-Data/72 §7). */
export type VaccinationStatus = 'given' | 'skipped' | 'deferred' | 'scheduled';

/** Appointment status (docs/04-Architecture/54 §appointments). */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';

/** Medical content type — safety-critical (docs/02-Research/28, docs/05-Data/72 §9). */
export type ContentType = 'educational' | 'clinical_recommendation' | 'emergency_warning';

/** Audit action (docs/05-Data/75 §4). */
export type AuditAction =
  'read' | 'create' | 'update' | 'soft_delete' | 'erase' | 'grant' | 'revoke' | 'login';

/** Actor role recorded on an audit record (docs/05-Data/75 §4). */
export type ActorRole = Role | 'system';

// ---------------------------------------------------------------------------
// Core entities (docs/05-Data/70 §4)
// ---------------------------------------------------------------------------

/** Family record graph root (docs/05-Data/70 §Family). */
export interface Family {
  family_id: UUID;
  owner_user_id: UUID;
  created_at: ISODateTime;
}

/** Auth identity (docs/05-Data/70 §User). Secrets are hashed, never plaintext. */
export interface User {
  user_id: UUID;
  /** Hashed/tokenised email (docs/09-Security/121). */
  email_hash: string;
  /** Salted password hash; never plaintext (docs/05-Data/72 §10, BR-5). */
  credential_hash: string;
  role: Role;
  status: UserStatus;
  /** When the medical disclaimer was acknowledged at registration (docs/02-Research/28 BR-5, docs/04-Architecture/57 §4). Absent = not yet acknowledged. */
  disclaimer_ack_at?: ISODateTime;
}

/**
 * Session token record (docs/04-Architecture/55 §3 "id, user, issued/expires").
 * `session_id` is the opaque bearer token itself (docs/04-Architecture/57 §6
 * "opaque ... session token"; docs/05-Data/72 §3 "IDs are opaque UUID
 * strings") — there is no separate token field to keep in sync.
 */
export interface Session {
  session_id: UUID;
  user_id: UUID;
  /** Session start; anchors the absolute lifetime ceiling (docs/09-Security/122 §3–4). */
  issued_at: ISODateTime;
  /** Rolling access-TTL expiry; extended by refresh, capped by the absolute lifetime. */
  expires_at: ISODateTime;
}

/** Mother profile subfields (docs/05-Data/70 §MaternalRecord). Highly-sensitive. */
export interface MaternalProfile {
  name: string;
  dob?: ISODate;
  contact?: string;
}

/** Maternal record node (docs/05-Data/70 §MaternalRecord). */
export interface MaternalRecord {
  maternal_id: UUID;
  family_id: UUID;
  profile: MaternalProfile;
}

/**
 * One pregnancy of a mother (docs/05-Data/71 §5). Anchors pregnancy-scoped data
 * and the delivery outcome. LMP/EDD are optional to allow partial/retrospective
 * entry (P9); GA is derived, never stored (docs/05-Data/70 §5).
 */
export interface PregnancyEpisode {
  episode_id: UUID;
  maternal_id: UUID;
  lmp?: ISODate;
  edd?: ISODate;
  pre_pregnancy_bmi_cat: BmiCategory;
  parity: Parity;
  status: PregnancyStatus;
}

/**
 * Child record node (docs/05-Data/70 §ChildRecord). Created solely by
 * DeliveryService; `mother_id` is immutable (docs/05-Data/71 CC-1, Vision BR-V2).
 */
export interface ChildRecord {
  child_id: UUID;
  family_id: UUID;
  /** Immutable link to the mother; written once at delivery. */
  readonly mother_id: UUID;
  /** Originating pregnancy episode. */
  readonly episode_id: UUID;
  dob: ISODate;
  sex: Sex;
  /** Gestational age at birth (weeks) — drives corrected age (docs/05-Data/72 §7). */
  ga_at_birth_weeks?: number;
}

/**
 * Append-only timeline event (docs/05-Data/70 §Event). `subject_id` is
 * polymorphic — a maternal or child record — unifying the one continuous
 * timeline (docs/05-Data/71 §3). Corrections are new versions, never edits:
 * since `event_id` is a unique PK, a correction is a brand-new row
 * (docs/05-Data/77 §5) — `corrects_event_id` links it back to the original so
 * the "current" version of a lineage can be resolved (77 §4, `version`).
 */
export interface Event {
  event_id: UUID;
  family_id: UUID;
  subject_id: UUID;
  type: EventType;
  life_stage: LifeStage;
  occurred_at: ISODateTime;
  payload_ref?: UUID;
  version: number;
  created_by: UUID;
  /** The original event's id — set only on correction rows; absent on the original (docs/05-Data/77 §5). */
  corrects_event_id?: UUID;
}

/** Vital measurement (docs/05-Data/70 §Vital). Canonical units per docs/05-Data/72 §5. */
export interface Vital {
  vital_id: UUID;
  subject_id: UUID;
  type: VitalType;
  value: number;
  unit: string;
  context?: VitalContext;
  measured_at: ISODateTime;
}

/** WHO growth measurement (docs/05-Data/70, docs/04-Architecture/54 §growth_measurements). */
export interface GrowthMeasurement {
  gm_id: UUID;
  child_id: UUID;
  indicator: GrowthIndicator;
  value: number;
  unit: string;
  measured_at: ISODateTime;
  corrected_age_flag?: boolean;
}

/** CDC milestone observation (docs/05-Data/70, 72 §7). Non-diagnostic. */
export interface Milestone {
  ms_id: UUID;
  child_id: UUID;
  milestone_code: string;
  status: MilestoneStatus;
  observed_at: ISODateTime;
}

/** Immunization dose (docs/05-Data/70, docs/04-Architecture/54 §vaccinations). */
export interface Vaccination {
  vax_id: UUID;
  child_id: UUID;
  vaccine_code: string;
  dose_no: number;
  status: VaccinationStatus;
  given_at?: ISODateTime;
}

/** Lab/ultrasound artefact metadata; media lives in private Drive (docs/05-Data/70 §Report). */
export interface Report {
  report_id: UUID;
  subject_id: UUID;
  kind: string;
  media_ref: MediaRef;
  uploaded_at: ISODateTime;
}

/** Journal entry (docs/05-Data/70 §JournalEntry). */
export interface JournalEntry {
  journal_id: UUID;
  subject_id: UUID;
  body: string;
  media_ref?: MediaRef;
  created_at: ISODateTime;
}

/** Appointment (docs/04-Architecture/54 §appointments). */
export interface Appointment {
  appt_id: UUID;
  family_id: UUID;
  subject_id: UUID;
  scheduled_at: ISODateTime;
  status: AppointmentStatus;
}

/** Medicine/supplement schedule (docs/04-Architecture/54 §medicines). */
export interface Medicine {
  med_id: UUID;
  subject_id: UUID;
  name: string;
  schedule: string;
  active: boolean;
}

/** RBAC caregiver grant (docs/05-Data/70 §CaregiverAccess). */
export interface CaregiverAccess {
  grant_id: UUID;
  family_id: UUID;
  user_id: UUID;
  scope: string;
  granted_by: UUID;
  revoked_at?: ISODateTime;
}

/**
 * Audit record (docs/05-Data/75 §4). Records *that* something happened and by
 * whom — never the sensitive content itself (BR-2). Append-only (BR-3).
 */
export interface AuditRecord {
  audit_id: UUID;
  actor_user_id: UUID;
  actor_role: ActorRole;
  action: AuditAction;
  entity: string;
  entity_id: UUID;
  family_id?: UUID;
  at: ISODateTime;
  correlation_id?: string;
  /** Safe, non-identifying context only — no health content (docs/05-Data/75 §4). */
  meta?: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Derived, surfacing-only views (docs/04-Architecture/52 §6, docs/06-Modules/81,83)
// ---------------------------------------------------------------------------
//
// These are NEVER persisted — they are computed on read from owned records and
// returned for display only. They carry no clinical interpretation: trends are
// arithmetic (current/previous/delta/direction), never diagnostic
// (docs/06-Modules/83 BR-1, docs/02-Research/28). Reference bands (ACOG/FIGO)
// are deliberately out of scope here (Sprint 02 decision) — arithmetic only.

/** Direction of a trend, or that there is not yet enough data to say. */
export type TrendDirection = 'up' | 'down' | 'steady' | 'insufficient_data';

/** One point in a vital series — the value and when it was measured. */
export interface TrendPoint {
  value: number;
  measured_at: ISODateTime;
}

/**
 * Arithmetic trend over a single numeric vital series (docs/04-Architecture/52
 * §6 "current/previous/trend"). `delta = current - previous`. `direction` is
 * the sign of the delta (`steady` when equal). All surfacing-only — never a
 * diagnosis (docs/06-Modules/83 BR-1).
 */
export interface TrendResult {
  type: VitalType;
  /** The series context this trend describes (e.g. systolic/diastolic for BP); absent for single-series vitals. */
  context?: VitalContext;
  unit: string;
  current: TrendPoint | null;
  previous: TrendPoint | null;
  /** `current - previous`, or `null` when fewer than two samples exist. */
  delta: number | null;
  direction: TrendDirection;
  /** Number of samples the trend was computed from — lets the UI avoid faking a trend from sparse data (83 §10). */
  sampleCount: number;
}

/** One paired blood-pressure reading — systolic and diastolic sharing a `measured_at`. */
export interface BloodPressureReading {
  measured_at: ISODateTime;
  systolic: number | null;
  diastolic: number | null;
}

/**
 * Blood pressure is stored as two Vital rows (systolic + diastolic) sharing a
 * `measured_at` (frozen domain model — docs/05-Data/72 §5). This view pairs
 * them back into logical readings and a trend per component, so the UI treats
 * one BP reading as one thing while storage stays two rows.
 */
export interface BloodPressureTrend {
  systolic: TrendResult;
  diastolic: TrendResult;
  /** The paired readings, newest last, for charting one BP reading as one point. */
  readings: BloodPressureReading[];
}

/**
 * A single at-a-glance metric tile on the dashboard for a single-value vital
 * (weight, blood sugar) (docs/06-Modules/81 FR-4). Blood pressure is a paired
 * reading and is surfaced separately via `DashboardSummary.blood_pressure`.
 */
export interface DashboardMetric {
  vital_type: Exclude<VitalType, 'bp'>;
  label: string;
  trend: TrendResult;
}

/** Life-stage status header for the dashboard (docs/06-Modules/81 FR-1). */
export interface DashboardStatus {
  life_stage: LifeStage;
  /** Gestational age in weeks when in an active pregnancy with a known LMP; else absent. */
  pregnancy_weeks?: number;
}

/**
 * The dashboard read model (docs/06-Modules/81). Pure aggregation across owned
 * records via services — the dashboard owns no domain data and writes nothing
 * (81 §1, docs/00-Vision/13 BR-1). Surfacing-only, calm, non-diagnostic.
 */
export interface DashboardSummary {
  family_id: UUID;
  generated_at: ISODateTime;
  status: DashboardStatus;
  /** Latest single-value metric tiles with arithmetic trend (weight, blood sugar). */
  metrics: DashboardMetric[];
  /** Paired blood-pressure trend tile, when any BP has been logged (81 FR-4). */
  blood_pressure?: BloodPressureTrend;
  /** Most-recent timeline events, newest first (81 FR-5). */
  recent_timeline: Event[];
}

/** Knowledge-base content index item (docs/05-Data/70 §ContentItem). Reference data. */
export interface ContentItem {
  content_id: UUID;
  life_stage?: LifeStage;
  topic: string;
  content_type: ContentType;
  source_ref: SourceRef;
  kb_path: string;
  version: string;
}

/** Immunization schedule reference entry (docs/04-Architecture/54 §schedules). */
export interface ScheduleEntry {
  sched_id: UUID;
  jurisdiction: string;
  version: string;
  vaccine_code: string;
  dose_no: number;
  age_min: number;
  age_max: number;
  source_ref: SourceRef;
}

// ---------------------------------------------------------------------------
// Entity registry (for the storage adapter's domain vocabulary — docs/04-Architecture/52 §5)
// ---------------------------------------------------------------------------

/** Map of domain entity name → its type. Adapters speak this vocabulary, not ranges. */
export interface DomainEntities {
  Family: Family;
  User: User;
  Session: Session;
  MaternalRecord: MaternalRecord;
  PregnancyEpisode: PregnancyEpisode;
  ChildRecord: ChildRecord;
  Event: Event;
  Vital: Vital;
  GrowthMeasurement: GrowthMeasurement;
  Milestone: Milestone;
  Vaccination: Vaccination;
  Report: Report;
  JournalEntry: JournalEntry;
  Appointment: Appointment;
  Medicine: Medicine;
  CaregiverAccess: CaregiverAccess;
  AuditRecord: AuditRecord;
  ContentItem: ContentItem;
  ScheduleEntry: ScheduleEntry;
}

/** Union of the domain entity names the adapter interface operates over. */
export type EntityName = keyof DomainEntities;
