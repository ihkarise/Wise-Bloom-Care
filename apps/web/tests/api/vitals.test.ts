/**
 * Vitals API module tests (docs/04-Architecture/56 §5 `/v1/vitals`).
 */

import { describe, expect, it, vi } from 'vitest';

import { getVitalSeries, logBloodPressure, logVital } from '../../src/api/vitals';
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

describe('vitals api', () => {
  it('logs a single vital via POST', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        reading: 'single',
        event: { event_id: 'e1' },
        vital: { vital_id: 'v1' },
        trend: {},
      }),
    );
    const result = await logVital(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'm1',
      type: 'weight',
      value: 61,
      unit: 'kg',
      measured_at: '2026-03-01T08:00:00.000Z',
    });
    expect(result.reading).toBe('single');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1/vitals');
    expect(init.method).toBe('POST');
  });

  it('logs a blood-pressure reading via POST', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ reading: 'bp', event: { event_id: 'e1' }, vitals: [{}, {}], trend: {} }),
    );
    const result = await logBloodPressure(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'm1',
      type: 'bp',
      systolic: 118,
      diastolic: 76,
      measured_at: '2026-03-01T09:00:00.000Z',
    });
    expect(result.reading).toBe('bp');
  });

  it('reads a vital series with a type filter', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    await getVitalSeries(client(fetchImpl as unknown as typeof fetch), { type: 'bp' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('type=bp');
  });
});
