/**
 * Content API module tests (docs/04-Architecture/56 §5 `/v1/content`, MS-1.6).
 * Confirms the call targets the right route/method and passes the optional
 * `week` selector as a query param.
 */

import { describe, expect, it, vi } from 'vitest';

import { getWeekKnowledge } from '../../src/api/content';
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

const RESPONSE = {
  content: {
    content_id: 'pregnancy-week-12',
    topic: 'pregnancy-week-12',
    content_type: 'educational',
    source_ref: 'S-WHO-ANC',
    kb_path: 'knowledge-base/pregnancy/week12.md',
    version: '1.0',
  },
  title: 'Pregnancy — Week 12',
  body: '## Stage',
  week: 12,
  gestational_age: { days: 84, weeks: 12, daysIntoWeek: 0 },
};

describe('content api', () => {
  it('fetches the current week via GET /v1/content (no week param)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(RESPONSE));
    const result = await getWeekKnowledge(client(fetchImpl as unknown as typeof fetch));
    expect(result.week).toBe(12);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('path')).toBe('/v1/content');
    expect(parsed.searchParams.get('week')).toBeNull();
    expect(init.method).toBe('GET');
  });

  it('fetches an explicit week via the week query param', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ...RESPONSE, week: 20 }));
    await getWeekKnowledge(client(fetchImpl as unknown as typeof fetch), { week: 20 });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('week')).toBe('20');
  });
});
