/**
 * Auth API module tests (docs/04-Architecture/56 §5 `/v1/auth/*`).
 */

import { describe, expect, it, vi } from 'vitest';

import { login, logout, refresh, register } from '../../src/api/auth';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('auth api', () => {
  it('register posts to /v1/auth/register without requiring a token', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ user: {}, session: { token: 'new-token' }, family: {}, maternal: {} }),
    );
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await register(client, {
      email: 'jane@example.com',
      password: 'correct-horse-battery-staple',
      disclaimer_ack: true,
      maternal_name: 'Jane Doe',
    });

    expect(result.session.token).toBe('new-token');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1/auth/register');
    expect(init.method).toBe('POST');
  });

  it('login posts credentials to /v1/auth/login', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ user: {}, session: { token: 't' } }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await login(client, { email: 'jane@example.com', password: 'x' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('/v1/auth/login');
  });

  it('logout uses the authenticated client (token on the GAS-readable query param)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 'session-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await logout(client);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1/auth/logout');
    // The token rides as a query param (Apps Script cannot read an Authorization
    // header); no preflight-triggering header is sent.
    expect(url).toContain('token=session-token');
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('refresh calls /v1/auth/refresh', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ session: { token: 't' } }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await refresh(client);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('/v1/auth/refresh');
  });
});
