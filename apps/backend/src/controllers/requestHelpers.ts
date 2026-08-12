/**
 * Small, shared request-parsing helpers for domain controllers
 * (docs/05-Data/73 §4 structural validation, docs/04-Architecture/56 §3
 * conventions). Kept out of each controller so parsing/validation-failure
 * behaviour is identical everywhere (no duplicated logic).
 */

import { ApiException, type ApiRequest } from './router';

/** Parses the request body as a plain JSON object, or fails `validation_failed`. */
export function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ApiException('validation_failed', 422, 'Expected a JSON object body');
  }
  return body as Record<string, unknown>;
}

/** Required non-empty string field. */
export function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ApiException('validation_failed', 422, `Missing or invalid field: ${field}`);
  }
  return value;
}

/** Optional string field — `undefined` when absent, still type-checked when present. */
export function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return asString(value, field);
}

/** Reads a query-string parameter (docs/04-Architecture/56 §3). */
export function queryParam(request: ApiRequest, key: string): string | undefined {
  return request.query?.[key];
}

/** Today's date in ISO 8601 (`YYYY-MM-DD`) — for computing "as of today" derived views (docs/06-Modules/82 §6). */
export function todayIsoDate(now: () => Date = () => new Date()): string {
  const iso = now().toISOString();
  return iso.slice(0, 10);
}
