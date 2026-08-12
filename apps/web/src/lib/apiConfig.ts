/**
 * Public frontend config (docs/04-Architecture/60 §4: "the frontend only
 * holds the API base URL + public config; no secrets", BR-3). Astro only
 * exposes `PUBLIC_`-prefixed env vars to client code — that prefix is itself
 * the guarantee that nothing sensitive ends up here.
 */

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8788';

export function apiBaseUrl(): string {
  const configured = import.meta.env.PUBLIC_API_BASE_URL;
  return configured && configured.length > 0 ? configured : DEFAULT_DEV_API_BASE_URL;
}
