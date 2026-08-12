/**
 * Wise Bloom Care — logical API contract.
 *
 * The stable, versioned boundary between client and backend
 * (docs/04-Architecture/56-API_SPEC.md). It is expressed in domain terms and
 * MUST NOT change when the backend storage or runtime changes — this is the
 * migration guarantee (NFR-6, docs/04-Architecture/56 §9 BR-1).
 *
 * This package is storage-neutral: it references domain types
 * (`@wise-bloom/domain-types`) and never Sheets/SQL specifics.
 */

import type {
  Appointment,
  BloodPressureTrend,
  BmiCategory,
  ContentItem,
  DashboardSummary,
  Event,
  Family,
  GrowthMeasurement,
  ISODate,
  ISODateTime,
  MaternalProfile,
  MaternalRecord,
  Milestone,
  Parity,
  PregnancyEpisode,
  Report,
  Role,
  Session,
  TrendResult,
  UUID,
  UserStatus,
  Vaccination,
  Vital,
} from '@wise-bloom/domain-types';

// ---------------------------------------------------------------------------
// Conventions (docs/04-Architecture/56 §3)
// ---------------------------------------------------------------------------

/** Contract version prefix. Breaking changes introduce a new version (§9). */
export const API_VERSION = 'v1' as const;
export type ApiVersion = typeof API_VERSION;

/** HTTP methods used by the logical contract. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Standard error codes (docs/04-Architecture/56 §8). */
export type ErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'validation_failed'
  | 'conflict'
  | 'rate_limited'
  | 'server_error';

/** Error payload (docs/04-Architecture/56 §3). Safe messages only — no PHI/internals. */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/** Consistent error envelope `{ error: { code, message, details? } }` (§3). */
export interface ApiErrorEnvelope {
  error: ApiError;
}

/** Cursor-based page of list results (docs/04-Architecture/56 §3 pagination). */
export interface Paginated<T> {
  items: T[];
  next_cursor?: string;
}

/**
 * Bearer auth is required on every request (docs/04-Architecture/56 §3, docs/04-Architecture/57).
 * Write endpoints accept an idempotency key (§3, delivery keystone §6).
 */
export interface RequestContext {
  token: string;
  idempotencyKey?: string;
  correlationId?: string;
}

// ---------------------------------------------------------------------------
// Resource catalogue (docs/04-Architecture/56 §4)
// ---------------------------------------------------------------------------

/** Family-scoped + reference resources. Mirrors docs/04-Architecture/56 §4. */
export const RESOURCES = [
  'auth',
  'family',
  'maternal',
  'children',
  'timeline',
  'vitals',
  'appointments',
  'medicines',
  'reports',
  'delivery',
  'growth',
  'milestones',
  'vaccinations',
  'journal',
  'family/access',
  'notifications',
  'content',
  'ai',
  'export',
  'dashboard',
] as const;

export type Resource = (typeof RESOURCES)[number];

// ---------------------------------------------------------------------------
// Endpoint catalogue (docs/04-Architecture/56 §5)
// ---------------------------------------------------------------------------

/** A logical endpoint definition. On GAS these are realised via doGet/doPost (§3). */
export interface EndpointDefinition {
  method: HttpMethod;
  path: string;
  purpose: string;
  /** Whether the endpoint mutates state (accepts an idempotency key). */
  write: boolean;
}

/**
 * Representative endpoints mirroring docs/04-Architecture/56 §5. This is the
 * design-level catalogue; concrete request/response JSON is derived from
 * docs/05-Data/72 during implementation and kept backward-compatible (§9).
 */
export const ENDPOINTS = [
  { method: 'POST', path: '/v1/auth/register', purpose: 'create account', write: true },
  { method: 'POST', path: '/v1/auth/login', purpose: 'authenticate', write: true },
  { method: 'POST', path: '/v1/auth/logout', purpose: 'end session', write: true },
  {
    method: 'POST',
    path: '/v1/auth/refresh',
    purpose: 'renew the session within its absolute lifetime',
    write: true,
  },
  { method: 'GET', path: '/v1/family', purpose: 'the caller’s family record', write: false },
  { method: 'GET', path: '/v1/maternal', purpose: 'the caller’s maternal record', write: false },
  {
    method: 'POST',
    path: '/v1/maternal/pregnancy-episodes',
    purpose: 'create a pregnancy episode (LMP/EDD)',
    write: true,
  },
  {
    method: 'GET',
    path: '/v1/maternal/pregnancy-episodes',
    purpose: 'list the maternal record’s pregnancy episodes',
    write: false,
  },
  { method: 'GET', path: '/v1/timeline', purpose: 'continuous timeline', write: false },
  { method: 'GET', path: '/v1/content', purpose: 'a typed, sourced content item', write: false },
  { method: 'POST', path: '/v1/vitals', purpose: 'log a vital', write: true },
  { method: 'GET', path: '/v1/vitals', purpose: 'vital series', write: false },
  {
    method: 'POST',
    path: '/v1/reports',
    purpose: 'upload a report (metadata + private media)',
    write: true,
  },
  { method: 'GET', path: '/v1/reports', purpose: 'list report metadata', write: false },
  {
    method: 'GET',
    path: '/v1/reports/media',
    purpose: 'mint a short-lived, backend-mediated media reference (report_id query param)',
    write: false,
  },
  {
    method: 'GET',
    path: '/v1/dashboard',
    purpose: 'at-a-glance status + metric tiles + recent timeline (aggregation only)',
    write: false,
  },
  { method: 'GET', path: '/v1/appointments', purpose: 'list appointments', write: false },
  {
    method: 'POST',
    path: '/v1/delivery',
    purpose: 'record delivery; creates linked child(ren); idempotent; sole creator',
    write: true,
  },
  { method: 'GET', path: '/v1/children', purpose: 'list children', write: false },
  { method: 'POST', path: '/v1/growth', purpose: 'add measurement', write: true },
  { method: 'GET', path: '/v1/milestones', purpose: 'milestone status', write: false },
  { method: 'POST', path: '/v1/vaccinations', purpose: 'record dose', write: true },
  { method: 'POST', path: '/v1/family/access', purpose: 'grant caregiver', write: true },
  { method: 'DELETE', path: '/v1/family/access/{id}', purpose: 'revoke caregiver', write: true },
] as const satisfies readonly EndpointDefinition[];

export type EndpointPath = (typeof ENDPOINTS)[number]['path'];

// ---------------------------------------------------------------------------
// Representative typed payloads (docs/04-Architecture/56 §5, derived from docs/05-Data/72)
// ---------------------------------------------------------------------------

/** `GET /v1/timeline?cursor=` → one continuous stream (docs/04-Architecture/56 BR-3). */
export type TimelineResponse = Paginated<Event>;

/**
 * `POST /v1/vitals` request for a single-value vital (weight, blood_sugar, or
 * one BP component). Partial/retrospective entry is allowed (P9). Blood
 * pressure is logged as a *pair* via `CreateBloodPressureRequest` instead —
 * the request body is a discriminated union (see `LogVitalRequest`).
 */
export interface CreateVitalRequest {
  subject_id: Vital['subject_id'];
  type: Vital['type'];
  value: Vital['value'];
  unit: Vital['unit'];
  context?: Vital['context'];
  measured_at: Vital['measured_at'];
}

/**
 * `POST /v1/vitals` request for a blood-pressure reading. One submission →
 * two Vital rows (systolic + diastolic) sharing `measured_at`, i.e. one
 * logical BP event (docs/05-Data/72 §5, frozen domain model). The two-row
 * split is an implementation detail of storage; the client submits one reading.
 */
export interface CreateBloodPressureRequest {
  subject_id: Vital['subject_id'];
  /** Discriminates this from a single-value vital body. */
  type: 'bp';
  systolic: number;
  diastolic: number;
  /** Canonical unit is mmHg (docs/05-Data/72 §5); defaults server-side when omitted. */
  unit?: string;
  measured_at: Vital['measured_at'];
}

/** `POST /v1/vitals` body — either a single-value vital or a paired BP reading. */
export type LogVitalRequest = CreateVitalRequest | CreateBloodPressureRequest;

/**
 * `POST /v1/vitals` → the logged event plus the created vital and its
 * arithmetic trend (docs/04-Architecture/56 §5 "returns event + trend").
 * `trend` is surfacing-only — never diagnostic (docs/06-Modules/83 BR-1).
 */
export interface CreateVitalResponse {
  reading: 'single';
  event: Event;
  vital: Vital;
  trend: TrendResult;
}

/**
 * `POST /v1/vitals` (BP) → one event, the two created Vital rows, and the
 * paired blood-pressure trend. `vitals` is `[systolic, diastolic]`.
 */
export interface CreateBloodPressureResponse {
  reading: 'bp';
  event: Event;
  vitals: Vital[];
  trend: BloodPressureTrend;
}

/** `POST /v1/vitals` response — discriminated on `reading`. */
export type LogVitalResponse = CreateVitalResponse | CreateBloodPressureResponse;

/** `GET /v1/vitals?type=` → a vital series for charting. */
export type VitalSeriesResponse = Paginated<Vital>;

// ---------------------------------------------------------------------------
// Reports (docs/06-Modules/84, docs/04-Architecture/56 §7, 58 media privacy)
// ---------------------------------------------------------------------------

/**
 * `POST /v1/reports` request. The client hands the backend an opaque upload
 * handle (never a public URL); the backend mints and stores a private
 * `media_ref` from it (docs/06-Modules/84 BR-1). Retrospective `uploaded_at`
 * is allowed (P9).
 */
export interface CreateReportRequest {
  subject_id: Report['subject_id'];
  kind: Report['kind'];
  /** Opaque, backend-mediated upload handle — resolved to a private media_ref; never a public link. */
  media_upload_ref: string;
  uploaded_at?: Report['uploaded_at'];
}

/** `POST /v1/reports` → the stored metadata plus the timeline event it created (84 BR-5). */
export interface CreateReportResponse {
  event: Event;
  report: Report;
}

/** `GET /v1/reports?subject_id=` → report metadata only. Media is fetched separately via a short-lived ref. */
export type ReportListResponse = Paginated<Report>;

/**
 * `GET /v1/reports/media?report_id=` → a short-lived, backend-mediated
 * reference to the private media. It expires (`expires_at`) and is never a
 * durable public link (docs/04-Architecture/58, docs/06-Modules/84 BR-1).
 */
export interface ReportMediaResponse {
  report_id: Report['report_id'];
  /** Opaque, expiring reference the client presents back to the backend to view the media. */
  media_ref: string;
  expires_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Dashboard (docs/06-Modules/81 — aggregation only, reads across services)
// ---------------------------------------------------------------------------

/** `GET /v1/dashboard` → the aggregated read model (docs/06-Modules/81). */
export interface DashboardResponse {
  dashboard: DashboardSummary;
}

/** `GET /v1/appointments` → list. */
export type AppointmentListResponse = Paginated<Appointment>;

/** `GET /v1/growth?child=` → WHO growth series. */
export type GrowthSeriesResponse = Paginated<GrowthMeasurement>;

/** `GET /v1/milestones?child=` → non-diagnostic milestone status. */
export type MilestoneListResponse = Paginated<Milestone>;

/** `GET /v1/vaccinations?child=` → dose records. */
export type VaccinationListResponse = Paginated<Vaccination>;

// ---------------------------------------------------------------------------
// Auth / Family / Maternal / Pregnancy / Content (docs/20-Implementation/206)
// ---------------------------------------------------------------------------

/**
 * The safe, public view of a `User` — never the credential/email hashes
 * (docs/04-Architecture/58 §7: the client holds no secrets and the API never
 * returns them).
 */
export interface PublicUser {
  user_id: UUID;
  role: Role;
  status: UserStatus;
}

/** An issued or renewed session (docs/04-Architecture/57 §6). `token` is the bearer credential to send on every request. */
export interface AuthSession {
  token: Session['session_id'];
  issued_at: Session['issued_at'];
  expires_at: Session['expires_at'];
}

/** `POST /v1/auth/register` request. Disclaimer acknowledgement is mandatory (docs/02-Research/28 BR-5). */
export interface RegisterRequest {
  email: string;
  password: string;
  disclaimer_ack: true;
  /** The account holder's name, used to seed the MaternalRecord profile (docs/04-Architecture/57 §4). */
  maternal_name: string;
}

/** `POST /v1/auth/register` response — account + session + the seeded family/maternal scaffold. */
export interface RegisterResponse {
  user: PublicUser;
  session: AuthSession;
  family: Family;
  maternal: MaternalRecord;
}

/** `POST /v1/auth/login` request. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** `POST /v1/auth/login` response. */
export interface LoginResponse {
  user: PublicUser;
  session: AuthSession;
}

/** `POST /v1/auth/refresh` response — the bearer token is unchanged; only the expiry moves. */
export interface RefreshResponse {
  session: AuthSession;
}

/** `GET /v1/family` response. */
export interface FamilyResponse {
  family: Family;
}

/** `GET /v1/maternal` response. */
export interface MaternalResponse {
  maternal: MaternalRecord;
}

/** `POST /v1/maternal/pregnancy-episodes` request. Forgiving: all fields optional (P9). */
export interface CreatePregnancyEpisodeRequest {
  lmp?: ISODate;
  edd?: ISODate;
  pre_pregnancy_bmi_cat?: BmiCategory;
  parity?: Parity;
}

/** Derived gestational-age view, computed for display only (docs/06-Modules/82 BR-1) — never persisted. */
export interface GestationalAgeView {
  days: number;
  weeks: number;
  daysIntoWeek: number;
}

/** `POST|GET /v1/maternal/pregnancy-episodes` item response. */
export interface PregnancyEpisodeResponse {
  episode: PregnancyEpisode;
  /** `null` when LMP is unknown (forgiving entry, P9). */
  gestational_age: GestationalAgeView | null;
}

/** `GET /v1/maternal/pregnancy-episodes` list response — each item includes its derived GA (BR-1: server-computed, never re-derived client-side, docs/04-Architecture/51 BR-3). */
export type PregnancyEpisodeListResponse = Paginated<PregnancyEpisodeResponse>;

/** `GET /v1/content` response — refuses to resolve untyped/unsourced items (docs/02-Research/28 BR-1/BR-2). */
export interface ContentItemResponse {
  content: ContentItem;
}

/** Re-exported for convenience where callers only need the maternal profile shape. */
export type { MaternalProfile };
