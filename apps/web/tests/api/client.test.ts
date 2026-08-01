/**
 * ApiClient transport tests (docs/04-Architecture/51 BR-1/BR-2,
 * docs/04-Architecture/56 §3: bearer auth, idempotency keys, error envelope).
 */

import { describe, expect, it, vi } from 'vitest';

import { ApiClient, ApiRequestError } from '../../src/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiClient', () => {
  it('constructs against the contract and issues a bearer-authenticated request', async () => {
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
    // Google Apps Script Web Apps cannot read custom headers, so the bearer
    // token must also ride as a query param the entry point reads
    // (apps/backend/src/main.ts). Regression guard for the GAS auth transport.
    expect(url).toContain('token=synthetic-token');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer synthetic-token',
    );
  });

  it('omits the Authorization header when no token is set (pre-login/register)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/auth/login', { method: 'POST', body: { email: 'a', password: 'b' } });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    // A public (unauthenticated) route must not attach a token query param either.
    expect(url).not.toContain('token=');
  });

  it('attaches an Idempotency-Key to every write, even with no body', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/auth/logout', { method: 'POST' });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBeTruthy();
  });

  it('never attaches an Idempotency-Key to a GET', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.request('/timeline', { method: 'GET' });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBeUndefined();
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
});
