/**
 * The typed API client — the ONLY place in the web app that talks to the backend
 * (docs/04-Architecture/51 BR-1, enforced by the `no-network-outside-api` lint
 * rule). It depends solely on the API contract (`@wise-bloom/api-contract`), so
 * swapping backend storage causes zero client changes (51 BR-2, NFR-6).
 *
 * Sprint 00 ships the client typed against the contract; endpoints are not yet
 * implemented server-side. Every request carries a bearer token (docs/04-Architecture/57)
 * and writes carry an idempotency key (docs/04-Architecture/56 §3).
 */

import { API_VERSION } from '@wise-bloom/api-contract';

import type {
  ApiErrorEnvelope,
  CreateVitalRequest,
  CreateVitalResponse,
  GrowthSeriesResponse,
  MilestoneListResponse,
  TimelineResponse,
  VaccinationListResponse,
  VitalSeriesResponse,
} from '@wise-bloom/api-contract';

export interface ApiClientOptions {
  /** Backend base URL (public config only — never a secret; docs/04-Architecture/60 §4). */
  baseUrl: string;
  /** Bearer token obtained from the auth flow (docs/04-Architecture/57). */
  token: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/** Thrown on a non-2xx response, carrying the safe coded error envelope (docs/04-Architecture/56 §8). */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly envelope: ApiErrorEnvelope,
  ) {
    super(envelope.error.message);
    this.name = 'ApiRequestError';
  }
}

interface RequestInitLite {
  method: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
  idempotencyKey?: string;
}

function newIdempotencyKey(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private async request<T>(path: string, init: RequestInitLite): Promise<T> {
    const url = new URL(`${this.baseUrl}/${API_VERSION}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    };
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['Idempotency-Key'] = init.idempotencyKey ?? newIdempotencyKey();
    }

    const response = await this.fetchImpl(url.toString(), {
      method: init.method,
      headers,
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });

    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiRequestError(response.status, payload as ApiErrorEnvelope);
    }
    return payload as T;
  }

  /** `GET /v1/timeline?cursor=` — one continuous stream (docs/04-Architecture/56 §5, BR-3). */
  getTimeline(cursor?: string): Promise<TimelineResponse> {
    return this.request<TimelineResponse>('/timeline', { method: 'GET', query: { cursor } });
  }

  /** `POST /v1/vitals` — log a vital; returns the event + trend (docs/04-Architecture/56 §5). */
  createVital(input: CreateVitalRequest): Promise<CreateVitalResponse> {
    return this.request<CreateVitalResponse>('/vitals', { method: 'POST', body: input });
  }

  /** `GET /v1/vitals?type=` — a vital series for charts. */
  getVitals(type: string, cursor?: string): Promise<VitalSeriesResponse> {
    return this.request<VitalSeriesResponse>('/vitals', { method: 'GET', query: { type, cursor } });
  }

  /** `GET /v1/growth?child=` — WHO growth series. */
  getGrowth(childId: string, cursor?: string): Promise<GrowthSeriesResponse> {
    return this.request<GrowthSeriesResponse>('/growth', {
      method: 'GET',
      query: { child: childId, cursor },
    });
  }

  /** `GET /v1/milestones?child=` — non-diagnostic milestone status. */
  getMilestones(childId: string): Promise<MilestoneListResponse> {
    return this.request<MilestoneListResponse>('/milestones', {
      method: 'GET',
      query: { child: childId },
    });
  }

  /** `GET /v1/vaccinations?child=` — dose records. */
  getVaccinations(childId: string): Promise<VaccinationListResponse> {
    return this.request<VaccinationListResponse>('/vaccinations', {
      method: 'GET',
      query: { child: childId },
    });
  }
}
