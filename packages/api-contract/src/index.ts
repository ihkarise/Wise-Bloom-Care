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
  Event,
  GrowthMeasurement,
  Milestone,
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
  { method: 'GET', path: '/v1/timeline', purpose: 'continuous timeline', write: false },
  { method: 'POST', path: '/v1/vitals', purpose: 'log a vital', write: true },
  { method: 'GET', path: '/v1/vitals', purpose: 'vital series', write: false },
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

/** `POST /v1/vitals` request. Partial/retrospective entry is allowed (P9). */
export interface CreateVitalRequest {
  subject_id: Vital['subject_id'];
  type: Vital['type'];
  value: Vital['value'];
  unit: Vital['unit'];
  context?: Vital['context'];
  measured_at: Vital['measured_at'];
}

/** `POST /v1/vitals` → the logged event plus the created vital (docs/04-Architecture/56 §5). */
export interface CreateVitalResponse {
  event: Event;
  vital: Vital;
}

/** `GET /v1/vitals?type=` → a vital series for charting. */
export type VitalSeriesResponse = Paginated<Vital>;

/** `GET /v1/appointments` → list. */
export type AppointmentListResponse = Paginated<Appointment>;

/** `GET /v1/growth?child=` → WHO growth series. */
export type GrowthSeriesResponse = Paginated<GrowthMeasurement>;

/** `GET /v1/milestones?child=` → non-diagnostic milestone status. */
export type MilestoneListResponse = Paginated<Milestone>;

/** `GET /v1/vaccinations?child=` → dose records. */
export type VaccinationListResponse = Paginated<Vaccination>;
