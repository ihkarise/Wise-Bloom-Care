/**
 * Dashboard API module test (docs/04-Architecture/56 §5 `/v1/dashboard`).
 */

import { describe, expect, it, vi } from 'vitest';

import { getDashboard } from '../../src/api/dashboard';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('dashboard api', () => {
  it('gets the dashboard summary', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ dashboard: { family_id: 'f1', metrics: [], recent_timeline: [] } }),
    );
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await getDashboard(client);
    expect(result.dashboard.family_id).toBe('f1');
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('/v1/dashboard');
  });
});
