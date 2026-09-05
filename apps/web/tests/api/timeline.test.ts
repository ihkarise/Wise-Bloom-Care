/**
 * Timeline API module tests (docs/04-Architecture/56 §5 `/v1/timeline`, §3 cursor pagination).
 */

import { describe, expect, it, vi } from 'vitest';

import { getTimeline } from '../../src/api/timeline';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('timeline api', () => {
  it('gets the continuous timeline, empty for a fresh family', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await getTimeline(client);
    expect(result.items).toEqual([]);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/timeline');
  });

  it('passes the cursor through for pagination', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await getTimeline(client, { cursor: '20' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('cursor=20');
  });
});
