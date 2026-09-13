/**
 * Medicines API module tests (docs/04-Architecture/56 §5 `/v1/medicines`).
 * Confirms each call targets the right route/method — adds and updates go
 * through POST (GAS has no PATCH, docs/04-Architecture/53 §4).
 */

import { describe, expect, it, vi } from 'vitest';

import { addMedicine, listMedicines, updateMedicine } from '../../src/api/medicines';
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

describe('medicines api', () => {
  it('adds a medicine via POST /v1/medicines', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ event: { event_id: 'e1' }, medicine: { med_id: 'm1' } }),
    );
    const result = await addMedicine(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'subj1',
      name: 'Iron tablet',
      schedule: 'Every morning',
    });
    expect(result.medicine.med_id).toBe('m1');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/medicines');
    expect(init.method).toBe('POST');
  });

  it('updates a medicine via POST /v1/medicines/update', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ medicine: { med_id: 'm1', active: false } }),
    );
    const result = await updateMedicine(client(fetchImpl as unknown as typeof fetch), {
      med_id: 'm1',
      active: false,
    });
    expect(result.medicine.active).toBe(false);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/medicines/update');
    expect(init.method).toBe('POST');
  });

  it('lists medicines via GET /v1/medicines', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const result = await listMedicines(client(fetchImpl as unknown as typeof fetch));
    expect(result.items).toEqual([]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/medicines');
    expect(init.method).toBe('GET');
  });
});
