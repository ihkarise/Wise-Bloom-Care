/**
 * Medicines → timeline integration (docs/20-Implementation/208 §8/§9: add a
 * medicine; it is recorded on the timeline; it can be edited and stopped; RBAC +
 * audit hold; no PHI in audit metadata). Drives the full HTTP-shaped pipeline
 * (auth → controller → services → adapter) exactly as production does.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  AddMedicineResponse,
  MedicineListResponse,
  RegisterResponse,
  TimelineResponse,
  UpdateMedicineResponse,
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

function addIron(app: ReturnType<typeof buildTestApp>, me: RegisterResponse): AddMedicineResponse {
  return app.handle({
    method: 'POST',
    path: '/v1/medicines',
    token: me.session.token,
    body: { subject_id: me.maternal.maternal_id, name: 'Iron tablet', schedule: 'Every morning' },
  }).body as AddMedicineResponse;
}

describe('POST /v1/medicines → timeline', () => {
  it('adding returns event + medicine and appears on the timeline', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/medicines',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, name: 'Iron tablet', schedule: 'Every morning' },
    });
    expect(response.status).toBe(201);
    const body = response.body as AddMedicineResponse;
    expect(body.medicine.name).toBe('Iron tablet');
    expect(body.medicine.active).toBe(true);
    expect(body.event.type).toBe('medicine');
    expect(body.event.payload_ref).toBe(body.medicine.med_id);

    const timeline = app.handle({ method: 'GET', path: '/v1/timeline', token: me.session.token })
      .body as TimelineResponse;
    expect(timeline.items.map((e) => e.event_id)).toContain(body.event.event_id);
  });

  it('lists the added medicine', () => {
    const app = buildTestApp();
    const me = register(app);
    addIron(app, me);

    const list = app.handle({ method: 'GET', path: '/v1/medicines', token: me.session.token })
      .body as MedicineListResponse;
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.name).toBe('Iron tablet');
  });

  it('edits a medicine via /update without adding a timeline entry', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = addIron(app, me);

    const updated = app.handle({
      method: 'POST',
      path: '/v1/medicines/update',
      token: me.session.token,
      body: { med_id: created.medicine.med_id, schedule: 'Twice daily with food' },
    });
    expect(updated.status).toBe(200);
    expect((updated.body as UpdateMedicineResponse).medicine.schedule).toBe(
      'Twice daily with food',
    );

    const timeline = app.handle({ method: 'GET', path: '/v1/timeline', token: me.session.token })
      .body as TimelineResponse;
    expect(timeline.items).toHaveLength(1);
  });

  it('stops a medicine but keeps it in the list (history retained)', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = addIron(app, me);

    const stopped = app.handle({
      method: 'POST',
      path: '/v1/medicines/update',
      token: me.session.token,
      body: { med_id: created.medicine.med_id, active: false },
    });
    expect(stopped.status).toBe(200);
    expect((stopped.body as UpdateMedicineResponse).medicine.active).toBe(false);

    const list = app.handle({ method: 'GET', path: '/v1/medicines', token: me.session.token })
      .body as MedicineListResponse;
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.active).toBe(false);
  });

  it('refuses a subject outside the caller’s family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);

    const response = app.handle({
      method: 'POST',
      path: '/v1/medicines',
      token: me.session.token,
      body: { subject_id: 'someone-elses-maternal-id', name: 'Iron', schedule: 'Daily' },
    });
    expect(response.status).toBe(403);
  });

  it('refuses to change a medicine in another family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const owner = register(app, 'owner@example.com');
    const other = register(app, 'other@example.com');
    const created = addIron(app, owner);

    const response = app.handle({
      method: 'POST',
      path: '/v1/medicines/update',
      token: other.session.token,
      body: { med_id: created.medicine.med_id, active: false },
    });
    expect(response.status).toBe(403);
  });

  it('rejects an empty name with validation_failed', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'POST',
      path: '/v1/medicines',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, name: '   ', schedule: 'Daily' },
    });
    expect(response.status).toBe(422);
  });

  it('returns not_found when updating an unknown medicine', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'POST',
      path: '/v1/medicines/update',
      token: me.session.token,
      body: { med_id: 'does-not-exist', active: false },
    });
    expect(response.status).toBe(404);
  });

  it('every medicine write is audited (docs/05-Data/75 BR-1)', () => {
    const app = buildTestApp();
    const me = register(app);
    addIron(app, me);
    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'Medicine',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });

  it('never puts the medicine name/PHI in audit metadata (docs/05-Data/75 BR-2)', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/medicines',
      token: me.session.token,
      body: {
        subject_id: me.maternal.maternal_id,
        name: 'Very-Secret-Medicine-Name',
        schedule: 'Twice a day',
      },
    });

    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'Medicine',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    for (const audit of audits) {
      // The whole audit record — including meta — must not carry the medicine name or schedule.
      expect(JSON.stringify(audit)).not.toContain('Very-Secret-Medicine-Name');
      expect(JSON.stringify(audit)).not.toContain('Twice a day');
    }
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    register(app);
    const response = app.handle({ method: 'GET', path: '/v1/medicines' });
    expect(response.status).toBe(401);
  });
});
