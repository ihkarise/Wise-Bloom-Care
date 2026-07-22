/**
 * Request controller / router (docs/04-Architecture/52 §4).
 *
 * Wires the cross-cutting request pipeline — authenticate → rate-limit →
 * validate → dispatch — that every endpoint passes through. Sprint 00 ships the
 * pipeline as skeleton stubs (no business logic, no domain handlers yet); later
 * sprints register service-backed handlers (docs/20-Implementation/205 Task 5).
 * The contract these route to is docs/04-Architecture/56.
 */

import { ENDPOINTS, type ErrorCode, type HttpMethod } from '@wise-bloom/api-contract';

import type { Logger } from '../lib/logging';

export interface ApiRequest {
  method: HttpMethod;
  path: string;
  /** Bearer token (docs/04-Architecture/57). Absent → unauthenticated. */
  token?: string;
  idempotencyKey?: string;
  correlationId?: string;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

/** The authenticated caller. Identity resolution is added with AuthService (Sprint 01). */
export interface Actor {
  authenticated: true;
}

/** A safe, coded error surfaced through the standard envelope (docs/04-Architecture/56 §8). */
export class ApiException extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
};

function fail(code: ErrorCode, message: string): never {
  throw new ApiException(code, STATUS_BY_CODE[code], message);
}

/** A route handler. The registry is populated by domain controllers in later sprints. */
export type RouteHandler = (request: ApiRequest, actor: Actor) => ApiResponse;

export interface RouterDeps {
  logger: Logger;
  /** METHOD + ' ' + path → handler. Empty in Sprint 00. */
  handlers?: Record<string, RouteHandler>;
}

const KNOWN_ROUTES = new Set(ENDPOINTS.map((e) => `${e.method} ${e.path}`));

export function createRouter(deps: RouterDeps): (request: ApiRequest) => ApiResponse {
  const handlers = deps.handlers ?? {};

  /** Auth guard stub — fail closed when no token is present (docs/04-Architecture/52 §7). */
  function authenticate(request: ApiRequest): Actor {
    if (!request.token) {
      fail('unauthenticated', 'Missing bearer token');
    }
    return { authenticated: true };
  }

  /** Rate-limit stub — per-user/endpoint budgets are added in hardening (docs/09-Security/120). */
  function enforceRateLimit(_request: ApiRequest): void {
    // No-op in Sprint 00; the hook exists so the pipeline shape is fixed.
  }

  /** Input-validation stub — structural/plausibility checks land per endpoint (docs/05-Data/73). */
  function validate(_request: ApiRequest): void {
    // No-op in Sprint 00; validation helpers live in lib/validation.
  }

  function dispatch(request: ApiRequest, actor: Actor): ApiResponse {
    const key = `${request.method} ${request.path}`;
    const handler = handlers[key];
    if (handler) {
      return handler(request, actor);
    }
    // Known contract route with no handler yet, or an unknown route.
    fail('not_found', KNOWN_ROUTES.has(key) ? 'Not implemented in Sprint 00' : 'Unknown route');
  }

  return function handle(request: ApiRequest): ApiResponse {
    try {
      const actor = authenticate(request);
      enforceRateLimit(request);
      validate(request);
      return dispatch(request, actor);
    } catch (error) {
      if (error instanceof ApiException) {
        deps.logger.warn('request_failed', {
          method: request.method,
          endpoint: request.path,
          code: error.code,
          status: error.status,
          ...(request.correlationId ? { correlation_id: request.correlationId } : {}),
        });
        return {
          status: error.status,
          body: { error: { code: error.code, message: error.message } },
        };
      }
      // Never leak internals/PHI (docs/04-Architecture/52 §8, 56 §8).
      deps.logger.error('request_error', {
        method: request.method,
        endpoint: request.path,
        ...(request.correlationId ? { correlation_id: request.correlationId } : {}),
      });
      return { status: 500, body: { error: { code: 'server_error', message: 'Internal error' } } };
    }
  };
}
