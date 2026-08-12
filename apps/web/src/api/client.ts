/**
 * The typed API client — the ONLY place in the web app that talks to the backend
 * (docs/04-Architecture/51 BR-1, enforced by the `no-network-outside-api` lint
 * rule). It depends solely on the API contract (`@wise-bloom/api-contract`), so
 * swapping backend storage causes zero client changes (51 BR-2, NFR-6).
 *
 * This is the shared low-level transport only: URL/query building, headers,
 * idempotency keys, and error envelopes. Domain-specific calls live in
 * sibling files (`auth.ts`, `family.ts`, `maternal.ts`, `timeline.ts`, ...),
 * one per feature, each a thin typed wrapper around `request()` — every
 * request still carries a bearer token once authenticated
 * (docs/04-Architecture/57) and every write carries an idempotency key
 * (docs/04-Architecture/56 §3).
 */

import { API_VERSION } from '@wise-bloom/api-contract';

import type { ApiErrorEnvelope } from '@wise-bloom/api-contract';

export interface ApiClientOptions {
  /** Backend base URL (public config only — never a secret; docs/04-Architecture/60 §4). */
  baseUrl: string;
  /** Bearer token from the auth flow (docs/04-Architecture/57). Absent before login/registration. */
  token?: string;
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

export interface RequestInitLite {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
  private readonly token: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  /** Issues one request against `/v1{path}`. Public so per-feature modules under `api/` can build on it. */
  async request<T>(path: string, init: RequestInitLite): Promise<T> {
    const url = new URL(`${this.baseUrl}/${API_VERSION}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) {
      // Google Apps Script Web Apps (doGet/doPost) cannot read custom request
      // headers - only query/form params reach the entry point
      // (docs/04-Architecture/53 section 4). The bearer token is therefore sent
      // as a `token` query param, the mechanism the backend actually reads
      // (apps/backend/src/main.ts). The Authorization header is kept too: it is
      // harmless to GAS and lets a future non-GAS backend read the bearer token
      // the standard way (docs/04-Architecture/57).
      url.searchParams.set('token', this.token);
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    // Every write carries an idempotency key, whether or not it has a body (docs/04-Architecture/56 §3).
    if (init.method !== 'GET') {
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
}
