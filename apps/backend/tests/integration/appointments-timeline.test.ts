/**
 * Appointments → timeline integration (docs/20-Implementation/208 §9
 * integration; MS-1.4 "the visit is recorded on the timeline"). Drives the
 * full HTTP-shaped pipeline (auth → controller → services → adapter).
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  AppointmentListResponse,
  CreateAppointmentResponse,
  RegisterResponse,
  TimelineResponse,
  UpdateAppointmentResponse,
} from '@wise-bloom/api-contract';

function register(app: ReturnType<typeof buildTestApp>): RegisterResponse {
  return app.handle({
    method: 'POST',
    path: '/v1/auth/register',
    body: {
      email: 'jane@example.com',
      password: 'correct-horse-battery-staple',
      disclaimer_ack: true,
      maternal_name: 'Jane Doe',
    },
  }).body as RegisterResponse;
}

describe('/v1/appointments', () => {
  it('schedules a visit, returns an appointment event, and it appears on the timeline', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: {
        subject_id: me.maternal.maternal_id,
        scheduled_at: '2026-10-01T09:00:00.000Z',
      },
    });
    expect(response.status).toBe(201);
    const body = response.body as CreateAppointmentResponse;
    expect(body.appointment.status).toBe('scheduled');
    expect(body.event.type).toBe('appointment');

    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items.map((e) => e.event_id)).toContain(body.event.event_id);
  });

  it('lists the caller’s appointments', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-10-01T09:00:00.000Z' },
    });

    const list = app.handle({
      method: 'GET',
      path: '/v1/appointments',
      token: me.session.token,
    }).body as AppointmentListResponse;
    expect(list.items).toHaveLength(1);
  });

  it('updates an appointment’s status via PATCH', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-10-01T09:00:00.000Z' },
    }).body as CreateAppointmentResponse;

    const patched = app.handle({
      method: 'PATCH',
      path: '/v1/appointments',
      token: me.session.token,
      body: { appt_id: created.appointment.appt_id, status: 'completed' },
    });
    expect(patched.status).toBe(200);
    expect((patched.body as UpdateAppointmentResponse).appointment.status).toBe('completed');
  });

  it('refuses a subject outside the caller’s family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: 'someone-elses-maternal-id', scheduled_at: '2026-10-01T09:00:00.000Z' },
    });
    expect(response.status).toBe(403);
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      body: { subject_id: 'x', scheduled_at: '2026-10-01T09:00:00.000Z' },
    });
    expect(response.status).toBe(401);
  });

  it('every appointment write is audited (docs/05-Data/75 BR-1)', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-10-01T09:00:00.000Z' },
    });
    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'Appointment',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});
