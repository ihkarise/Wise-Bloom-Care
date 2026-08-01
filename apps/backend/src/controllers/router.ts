/**
 * Request controller / router (docs/04-Architecture/52 §4).
 *
 * Wires the cross-cutting request pipeline — authenticate → dispatch — that
 * every endpoint passes through. Authentication is real as of Sprint 01:
 * `resolveActor` turns a bearer token into an `AuthenticatedActor` via
 * SessionService (docs/04-Architecture/57 §6), fail closed on anything invalid
 * (52 §8). A small set of routes — register/login — are public (no session
 * exists yet) and are dispatched with a `null` actor. The contract these route
 * to is docs/04-Architecture/56.
 *
 * The other two pipeline concerns are deliberately not router-level stages:
 * rate limiting is endpoint-specific and lives in AuthService behind an
 * injected `RateLimiter` (docs/09-Security/120), and payload validation is
 * per-endpoint and lives in each controller (docs/05-Data/73). The router
 * owns only what is genuinely common to every route.
 */

import { ENDPOINTS, type ErrorCode, type HttpMethod } from '@wise-bloom/api-contract';

import type { Logger } from '../lib/logging';
import type { Role, UUID } from '@wise-bloom/domain-types';

export interface ApiRequest {
  method: HttpMethod;
  path: string;
  /** Bearer token (docs/04-Architecture/57). Absent → unauthenticated (unless the route is public). */
  token?: string;
  idempotencyKey?: string;
  correlationId?: string;
  body?: unknown;
  /** Query-string parameters (docs/04-Architecture/56 §3 cursor/filter params). */
  query?: Record<string, string>;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

/** The authenticated caller, resolved from a validated session (docs/09-Security/123 §5). */
export interface AuthenticatedActor {
  authenticated: true;
  userId: UUID;
  role: Role;
  sessionId: UUID;
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

/**
 * Fails closed with `unauthenticated` if the route resolved no actor. Public
 * routes never call this; every protected-route handler starts with it so
 * the rest of the handler can treat `actor` as always present.
 */
export function requireActor(actor: AuthenticatedActor | null): AuthenticatedActor {
  if (!actor) {
    fail('unauthenticated', 'Authentication required');
  }
  return actor;
}

/** A route handler. `actor` is `null` only for routes listed in `publicRoutes`. */
export type RouteHandler = (request: ApiRequest, actor: AuthenticatedActor | null) => ApiResponse;

export interface RouterDeps {
  logger: Logger;
  /** METHOD + ' ' + path → handler. */
  handlers?: Record<string, RouteHandler>;
  /** Routes dispatched without a token (docs/04-Architecture/57 §4–5: register/login). */
  publicRoutes?: ReadonlySet<string>;
  /** Bearer token → authenticated actor; throws to fail closed on anything invalid/expired (122 BR-1). */
  resolveActor?: (token: string) => AuthenticatedActor;
}

const KNOWN_ROUTES = new Set(ENDPOINTS.map((e) => `${e.method} ${e.path}`));

export function createRouter(deps: RouterDeps): (request: ApiRequest) => ApiResponse {
  const handlers = deps.handlers ?? {};
  const publicRoutes = deps.publicRoutes ?? new Set<string>();

  /** Auth guard — public routes skip it; every other route requires a token that resolves to a live session. */
  function authenticate(request: ApiRequest, routeKey: string): AuthenticatedActor | null {
    if (publicRoutes.has(routeKey)) {
      return null;
    }
    if (!request.token) {
      fail('unauthenticated', 'Missing bearer token');
    }
    if (!deps.resolveActor) {
      fail('server_error', 'Authentication is not configured');
    }
    try {
      return deps.resolveActor(request.token);
    } catch {
      fail('unauthenticated', 'Invalid or expired session');
    }
  }

  function dispatch(
    request: ApiRequest,
    routeKey: string,
    actor: AuthenticatedActor | null,
  ): ApiResponse {
    const handler = handlers[routeKey];
    if (handler) {
      return handler(request, actor);
    }
    // Known contract route with no handler yet, or an unknown route.
    fail('not_found', KNOWN_ROUTES.has(routeKey) ? 'Not implemented' : 'Unknown route');
  }

  return function handle(request: ApiRequest): ApiResponse {
    const routeKey = `${request.method} ${request.path}`;
    try {
      const actor = authenticate(request, routeKey);
      return dispatch(request, routeKey, actor);
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
