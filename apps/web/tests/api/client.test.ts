/**
 * ApiClient transport tests (docs/04-Architecture/51 BR-1/BR-2, 56 §3, 53 §4).
 *
 * The frontend (static GitHub Pages) calls the backend (Google Apps Script Web
 * App) cross-origin, so the transport must be **preflight-free**: only
 * CORS-safelisted request headers, and all request plumbing (bearer token,
 * idempotency key, correlation id) as query params — the only thing GAS
 * `doGet`/`doPost` expose to the entry point (apps/backend/src/main.ts). These
 * tests are the regression guard for that seam.
 */

import { describe, expect, it, vi } from 'vitest';

import { ApiClient, ApiRequestError } from '../../src/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Headers that would trigger a CORS preflight OPTIONS that Apps Script cannot answer. */
function assertNoPreflightHeaders(headers: Record<string, string>): void {
  expect(headers['Authorization']).toBeUndefined();
  expect(headers['authorization']).toBeUndefined();
  expect(headers['Idempotency-Key']).toBeUndefined();
  // Content-Type, if present, must be a CORS-safelisted value (text/plain), never application/json.
  const contentType = headers['Content-Type'];
  if (contentType !== undefined) {
    expect(contentType.toLowerCase()).toContain('text/plain');
    expect(contentType.toLowerCase()).not.toContain('application/json');
  }
}

describe('ApiClient', () => {
  it('sends the bearer token as a query param, not an Authorization header', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 'synthetic-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.request<{ items: unknown[] }>('/timeline', { method: 'GET' });
    expect(result.items).toEqual([]);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1/timeline');
    // The token reaches the backend through the GAS-readable `token` query param.
    expect(url).toContain('token=synthetic-token');
    assertNoPreflightHeaders(init.headers as Record<string, string>);
  });

  it('omits the token query param when no token is set (pre-login/register)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/auth/login', { method: 'POST', body: { email: 'a', password: 'b' } });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    // A public (unauthenticated) route must not attach a token query param.
    expect(url).not.toContain('token=');
    assertNoPreflightHeaders(init.headers as Record<string, string>);
  });

  it('attaches an idempotencyKey query param to every write, even with no body', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/auth/logout', { method: 'POST' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    // Idempotency travels as the query param the GAS entry point actually reads
    // (a header would be invisible to Apps Script). Regression for lost idempotency.
    expect(url).toMatch(/idempotencyKey=[^&]+/);
    assertNoPreflightHeaders(init.headers as Record<string, string>);
  });

  it('never attaches an idempotencyKey to a GET', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/timeline', { method: 'GET' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).not.toContain('idempotencyKey=');
  });

  it('honours an explicit idempotencyKey override', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/vitals', { method: 'POST', body: {}, idempotencyKey: 'fixed-key-123' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('idempotencyKey=fixed-key-123');
  });

  it('attaches a correlationId query param to every request', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/timeline', { method: 'GET' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toMatch(/correlationId=[^&]+/);
  });

  it('serialises the request body as JSON with a text/plain content type', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const body = { email: 'a@b.test', nested: { n: 1 } };
    await client.request('/auth/register', { method: 'POST', body });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    // The body is still JSON — the backend JSON.parses it regardless of content type.
    expect(init.body).toBe(JSON.stringify(body));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain;charset=UTF-8',
    );
  });

  it('builds query parameters and skips undefined ones', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/timeline', {
      method: 'GET',
      query: { cursor: '5', family_id: undefined },
    });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('cursor=5');
    expect(url).not.toContain('family_id');
  });

  it('throws ApiRequestError with the safe coded envelope on a non-2xx response', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        { error: { code: 'forbidden', message: 'Not authorised for this family' } },
        403,
      ),
    );
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.request('/family', { method: 'GET' })).rejects.toMatchObject({
      status: 403,
      envelope: { error: { code: 'forbidden' } },
    });
  });

  it('is an instance of ApiRequestError on failure', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { code: 'unauthenticated', message: 'Missing bearer token' } }, 401),
    );
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    let caught: unknown;
    try {
      await client.request('/family', { method: 'GET' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ApiRequestError);
  });

  it('treats a coded error envelope in a 200 body as a failure (Apps Script cannot set a status)', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { code: 'unauthenticated', message: 'nope' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(client.request('/family', { method: 'GET' })).rejects.toMatchObject({
      envelope: { error: { code: 'unauthenticated' } },
    });
  });
});
