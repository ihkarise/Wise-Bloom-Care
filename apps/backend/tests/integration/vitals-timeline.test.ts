/**
 * Vitals → timeline integration (docs/20-Implementation/207 §9 integration:
 * "vital → timeline event"; §8: logging a vital returns the created event and
 * an updated trend, and the event appears on the timeline). Drives the full
 * HTTP-shaped pipeline (auth → controller → services → adapter).
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  CreateBloodPressureResponse,
  CreateVitalResponse,
  RegisterResponse,
  TimelineResponse,
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

describe('POST /v1/vitals → timeline', () => {
  it('logging a single vital returns event + trend and appears on the timeline', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/vitals',
      token: me.session.token,
      body: {
        subject_id: me.maternal.maternal_id,
        type: 'weight',
        value: 61,
        measured_at: '2026-03-01T08:00:00.000Z',
      },
    });
    expect(response.status).toBe(201);
    const body = response.body as CreateVitalResponse;
    expect(body.reading).toBe('single');
    expect(body.event.type).toBe('vital');
    expect(body.trend.sampleCount).toBe(1);

    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items.map((e) => e.event_id)).toContain(body.event.event_id);
  });

  it('logging a BP reading creates two Vital rows but one timeline event', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/vitals',
      token: me.session.token,
      body: {
        subject_id: me.maternal.maternal_id,
        type: 'bp',
        systolic: 118,
        diastolic: 76,
        measured_at: '2026-03-01T09:00:00.000Z',
      },
    });
    expect(response.status).toBe(201);
    const body = response.body as CreateBloodPressureResponse;
    expect(body.reading).toBe('bp');
    expect(body.vitals).toHaveLength(2);
    expect(body.trend.readings).toHaveLength(1);

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
      path: '/v1/vitals',
      token: me.session.token,
      body: {
        subject_id: 'someone-elses-maternal-id',
        type: 'weight',
        value: 61,
        measured_at: '2026-03-01T08:00:00.000Z',
      },
    });
    expect(response.status).toBe(403);
  });

  it('every vital write is audited (docs/05-Data/75 BR-1)', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/vitals',
      token: me.session.token,
      body: {
        subject_id: me.maternal.maternal_id,
        type: 'weight',
        value: 61,
        measured_at: '2026-03-01T08:00:00.000Z',
      },
    });
    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'Vital',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});
