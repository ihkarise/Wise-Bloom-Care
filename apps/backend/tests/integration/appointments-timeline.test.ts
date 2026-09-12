/**
 * Appointments → timeline integration (docs/20-Implementation/208 §8/§9:
 * schedule an appointment; it is recorded on the timeline; a visit's outcome
 * can be recorded; RBAC + audit hold). Drives the full HTTP-shaped pipeline
 * (auth → controller → services → adapter) exactly as production does.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  AppointmentListResponse,
  RegisterResponse,
  ScheduleAppointmentResponse,
  TimelineResponse,
  UpdateAppointmentStatusResponse,
} from '@wise-bloom/api-contract';

function register(
  app: ReturnType<typeof buildTestApp>,
  email = 'jane@example.com',
): RegisterResponse {
  return app.handle({
    method: 'POST',
    path: '/v1/auth/register',
    body: {
      email,
      password: 'correct-horse-battery-staple',
      disclaimer_ack: true,
      maternal_name: 'Jane Doe',
    },
  }).body as RegisterResponse;
}

describe('POST /v1/appointments → timeline', () => {
  it('scheduling returns event + appointment and appears on the timeline', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    });
    expect(response.status).toBe(201);
    const body = response.body as ScheduleAppointmentResponse;
    expect(body.appointment.status).toBe('scheduled');
    expect(body.event.type).toBe('appointment');
    expect(body.event.payload_ref).toBe(body.appointment.appt_id);

    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items.map((e) => e.event_id)).toContain(body.event.event_id);
  });

  it('lists the scheduled appointment', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    });

    const list = app.handle({
      method: 'GET',
      path: '/v1/appointments',
      token: me.session.token,
    }).body as AppointmentListResponse;
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.scheduled_at).toBe('2026-04-01T09:30:00.000Z');
  });

  it('records a visit outcome via the status endpoint without adding a timeline entry', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    }).body as ScheduleAppointmentResponse;

    const updated = app.handle({
      method: 'POST',
      path: '/v1/appointments/status',
      token: me.session.token,
      body: { appt_id: created.appointment.appt_id, status: 'completed' },
    });
    expect(updated.status).toBe(200);
    expect((updated.body as UpdateAppointmentStatusResponse).appointment.status).toBe('completed');

    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items).toHaveLength(1);
  });

  it('refuses a subject outside the caller’s family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: 'someone-elses-maternal-id', scheduled_at: '2026-04-01T09:30:00.000Z' },
    });
    expect(response.status).toBe(403);
  });

  it('refuses to change an appointment in another family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const owner = register(app, 'owner@example.com');
    const other = register(app, 'other@example.com');
    const created = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: owner.session.token,
      body: { subject_id: owner.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    }).body as ScheduleAppointmentResponse;

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments/status',
      token: other.session.token,
      body: { appt_id: created.appointment.appt_id, status: 'cancelled' },
    });
    expect(response.status).toBe(403);
  });

  it('rejects an unknown status with validation_failed', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    }).body as ScheduleAppointmentResponse;

    const response = app.handle({
      method: 'POST',
      path: '/v1/appointments/status',
      token: me.session.token,
      body: { appt_id: created.appointment.appt_id, status: 'rescheduled' },
    });
    expect(response.status).toBe(422);
  });

  it('every appointment write is audited (docs/05-Data/75 BR-1)', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/appointments',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, scheduled_at: '2026-04-01T09:30:00.000Z' },
    });
    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'Appointment',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    register(app);
    const response = app.handle({
      method: 'GET',
      path: '/v1/appointments',
    });
    expect(response.status).toBe(401);
  });
});
