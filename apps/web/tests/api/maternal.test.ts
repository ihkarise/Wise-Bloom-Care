/**
 * Maternal / pregnancy-episode API module tests (docs/04-Architecture/56 §5
 * `/v1/maternal`).
 */

import { describe, expect, it, vi } from 'vitest';

import { createPregnancyEpisode, getMaternal, listPregnancyEpisodes } from '../../src/api/maternal';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function client(fetchImpl: typeof fetch): ApiClient {
  return new ApiClient({ baseUrl: 'https://x.test', token: 't', fetchImpl });
}

describe('maternal api', () => {
  it('gets the maternal record', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ maternal: { maternal_id: 'm1' } }));
    const result = await getMaternal(client(fetchImpl as unknown as typeof fetch));
    expect(result.maternal.maternal_id).toBe('m1');
  });

  it('creates a pregnancy episode with a forgiving (empty) payload', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ episode: { episode_id: 'e1', status: 'active' }, gestational_age: null }),
    );
    const result = await createPregnancyEpisode(client(fetchImpl as unknown as typeof fetch), {});
    expect(result.episode.episode_id).toBe('e1');
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
  });

  it('lists pregnancy episodes', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const result = await listPregnancyEpisodes(client(fetchImpl as unknown as typeof fetch));
    expect(result.items).toEqual([]);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/maternal/pregnancy-episodes');
  });
});
