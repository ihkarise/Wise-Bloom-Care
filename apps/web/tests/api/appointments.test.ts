/**
 * Appointments API module tests (docs/04-Architecture/56 §5 `/v1/appointments`).
 * Confirms each call targets the right route/method — status updates go through
 * POST (GAS has no PATCH, docs/04-Architecture/53 §4).
 */

import { describe, expect, it, vi } from 'vitest';

import {
  listAppointments,
  scheduleAppointment,
  updateAppointmentStatus,
} from '../../src/api/appointments';
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

describe('appointments api', () => {
  it('schedules an appointment via POST /v1/appointments', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ event: { event_id: 'e1' }, appointment: { appt_id: 'a1' } }),
    );
    const result = await scheduleAppointment(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'm1',
      scheduled_at: '2026-04-01T09:30:00.000Z',
    });
    expect(result.appointment.appt_id).toBe('a1');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments');
    expect(init.method).toBe('POST');
  });

  it('updates status via POST /v1/appointments/status', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ appointment: { appt_id: 'a1', status: 'completed' } }),
    );
    const result = await updateAppointmentStatus(client(fetchImpl as unknown as typeof fetch), {
      appt_id: 'a1',
      status: 'completed',
    });
    expect(result.appointment.status).toBe('completed');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments/status');
    expect(init.method).toBe('POST');
  });

  it('lists appointments via GET /v1/appointments', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const result = await listAppointments(client(fetchImpl as unknown as typeof fetch));
    expect(result.items).toEqual([]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/appointments');
    expect(init.method).toBe('GET');
  });
});
