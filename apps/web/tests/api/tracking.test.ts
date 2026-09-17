/**
 * Personal Wellness Tracker API module tests (docs/04-Architecture/56 §5
 * `/v1/tracking/*`). Confirms each call targets the right route/method —
 * activating a tracker and recording an entry both go through POST (GAS has
 * no PATCH, docs/04-Architecture/53 §4).
 */

import { describe, expect, it, vi } from 'vitest';

import {
  addTrackerEntry,
  listTrackerEntries,
  listTrackerPreferences,
  setTrackerPreference,
} from '../../src/api/tracking';
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

describe('tracking api', () => {
  it('lists preferences via GET /v1/tracking/preferences', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [], gestational_age: null }));
    const result = await listTrackerPreferences(client(fetchImpl as unknown as typeof fetch));
    expect(result.items).toEqual([]);
    expect(result.gestational_age).toBeNull();
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/tracking/preferences');
    expect(init.method).toBe('GET');
  });

  it('activates a tracker via POST /v1/tracking/preferences', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ preference: { tracker_pref_id: 'p1', active: true } }),
    );
    const result = await setTrackerPreference(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'subj1',
      tracker_key: 'baby_movement',
      active: true,
    });
    expect(result.preference.active).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/tracking/preferences');
    expect(init.method).toBe('POST');
  });

  it('lists a tracker’s entries via GET /v1/tracking/entries with the tracker_key query param', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const result = await listTrackerEntries(
      client(fetchImpl as unknown as typeof fetch),
      'baby_movement',
    );
    expect(result.items).toEqual([]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/tracking/entries');
    expect(new URL(url).searchParams.get('tracker_key')).toBe('baby_movement');
    expect(init.method).toBe('GET');
  });

  it('records an entry via POST /v1/tracking/entries', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ entry: { tracker_entry_id: 'e1', value: '1' } }),
    );
    const result = await addTrackerEntry(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'subj1',
      tracker_key: 'baby_movement',
      value: '1',
    });
    expect(result.entry.value).toBe('1');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/tracking/entries');
    expect(init.method).toBe('POST');
  });
});
