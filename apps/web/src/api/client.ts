/**
 * The typed API client — the ONLY place in the web app that talks to the backend
 * (docs/04-Architecture/51 BR-1, enforced by the `no-network-outside-api` lint
 * rule). It depends solely on the API contract (`@wise-bloom/api-contract`), so
 * swapping backend storage causes zero client changes (51 BR-2, NFR-6).
 *
 * This is the shared low-level transport only: URL/query building, headers,
 * idempotency + correlation keys, and error envelopes. Domain-specific calls
 * live in sibling files (`auth.ts`, `family.ts`, ...), one per feature.
 *
 * GAS-compatible, preflight-free transport (docs/04-Architecture/53 §4):
 * the frontend is a static site (GitHub Pages) and the backend is a Google
 * Apps Script Web App on a DIFFERENT origin, so every call is cross-origin.
 * Apps Script cannot answer a CORS preflight (it has no `doOptions` and cannot
 * set response headers), so this client sends ONLY CORS-safelisted request
 * headers and never triggers one. All request plumbing the backend needs — the
 * versioned route `path`, bearer `token`, `idempotencyKey`, `correlationId` —
 * travels as query params, which are exactly what GAS `doGet`/`doPost` expose to
 * `toApiRequest` (apps/backend/src/main.ts). The URL sub-path after `/exec` is
 * `pathInfo`, which the backend never reads, so the route CANNOT live in the
 * pathname; and a custom header would be invisible to GAS anyway.
 * The JSON request body is sent with a `text/plain` content type (also
 * safelisted); the backend parses it with `JSON.parse` regardless of type.
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
  /** Overrides the generated idempotency key for a write (docs/04-Architecture/56 §3). */
  idempotencyKey?: string;
  /** Overrides the generated correlation id for a request (docs/04-Architecture/63). */
  correlationId?: string;
}

function randomId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * A well-formed coded error envelope (docs/04-Architecture/56 §8). Apps Script
 * Web Apps always return HTTP 200 (ContentService cannot set a status code), so
 * a backend error is conveyed only by this shape in the body — never by the HTTP
 * status. No success payload in this API has a top-level `error.code`.
 */
function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error?: { code?: unknown } }).error?.code === 'string'
  );
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
    // The base URL is the bare Apps Script `/exec` endpoint; the route never
    // goes in the pathname (that becomes GAS `pathInfo`, which the backend
    // ignores). Domain query params are set first so a reserved plumbing param
    // below can never be shadowed by one.
    const url = new URL(this.baseUrl);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }

    // Versioned route as the `path` query param — the only place GAS
    // doGet/doPost surface it (apps/backend/src/main.ts reads
    // `event.parameter['path']`, and the router keys on `/v1/...`).
    url.searchParams.set('path', `/${API_VERSION}${path}`);
    // Bearer token as a query param — the mechanism GAS actually reads
    // (apps/backend/src/main.ts). Sending it as an Authorization header would be
    // invisible to GAS AND would trigger a CORS preflight it cannot answer.
    if (this.token) {
      url.searchParams.set('token', this.token);
    }
    // Correlation id on every request, for log correlation (docs/04-Architecture/63).
    url.searchParams.set('correlationId', init.correlationId ?? randomId());
    // Idempotency key on every write, whether or not it has a body
    // (docs/04-Architecture/56 §3). A query param (not a header) is what the GAS
    // entry point reads, so this is what actually preserves idempotency on GAS.
    if (init.method !== 'GET') {
      url.searchParams.set('idempotencyKey', init.idempotencyKey ?? randomId());
    }

    // Only CORS-safelisted request headers, so a cross-origin call never triggers
    // a preflight OPTIONS. `Accept` is always safelisted; `text/plain` is one of
    // the three safelisted `Content-Type` values (the backend JSON-parses the body
    // regardless of the declared type). No Authorization / Idempotency-Key header.
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body !== undefined) {
      headers['Content-Type'] = 'text/plain;charset=UTF-8';
    }

    const response = await this.fetchImpl(url.toString(), {
      method: init.method,
      headers,
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });

    const payload: unknown = await response.json().catch(() => ({}));
    // A non-2xx status (non-GAS backend) OR a coded error envelope in the body
    // (Apps Script, which is always HTTP 200) both signal a failure. The envelope
    // carries the real error code even when the HTTP status cannot.
    if (!response.ok || isErrorEnvelope(payload)) {
      throw new ApiRequestError(response.status, payload as ApiErrorEnvelope);
    }
    return payload as T;
  }
}
