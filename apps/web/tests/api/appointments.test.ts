/**
 * Appointments API module tests (docs/04-Architecture/56 §5 `/v1/appointments`).
 * Asserts the shared client builds the right route + method for each call.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  getAppointments,
  scheduleAppointment,
  updateAppointment,
} from '../../src/api/appointments';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeClient(fetchImpl: ReturnType<typeof vi.fn>): ApiClient {
  return new ApiClient({
    baseUrl: 'https://x.test',
    token: 't',
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
}

describe('appointments api', () => {
  it('schedules an appointment via POST /v1/appointments', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ event: { event_id: 'e1' }, appointment: { appt_id: 'a1' } }),
    );
    const client = makeClient(fetchImpl);

    const result = await scheduleAppointment(client, {
      subject_id: 'm1',
      scheduled_at: '2026-10-01T09:00:00.000Z',
    });
    expect(result.appointment.appt_id).toBe('a1');

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { method: string }];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments');
    expect(init.method).toBe('POST');
  });

  it('lists appointments via GET /v1/appointments', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = makeClient(fetchImpl);

    const result = await getAppointments(client);
    expect(result.items).toEqual([]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { method: string }];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments');
    expect(init.method).toBe('GET');
  });

  it('updates status via PATCH /v1/appointments', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ appointment: { appt_id: 'a1', status: 'completed' } }),
    );
    const client = makeClient(fetchImpl);

    const result = await updateAppointment(client, { appt_id: 'a1', status: 'completed' });
    expect(result.appointment.status).toBe('completed');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { method: string }];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments');
    expect(init.method).toBe('PATCH');
  });
});
