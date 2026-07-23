/**
 * Timeline append-only integration test — service ↔ adapter
 * (docs/20-Implementation/206 §9: "timeline append-only across
 * service↔adapter"). Registers a real account through the HTTP-shaped
 * pipeline, appends/corrects events through `TimelineService` against the
 * real `SheetsStorageAdapter` (in-memory gateway), and reads them back
 * through `GET /v1/timeline`.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type { RegisterResponse, TimelineResponse } from '@wise-bloom/api-contract';

function registerAccount(app: ReturnType<typeof buildTestApp>, email: string): RegisterResponse {
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

describe('Timeline append-only (service ↔ adapter ↔ API)', () => {
  it('starts empty for a fresh registration', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');

    const response = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: registered.session.token,
    });
    expect(response.status).toBe(200);
    expect((response.body as TimelineResponse).items).toEqual([]);
  });

  it('an appended event is readable through GET /v1/timeline', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');

    const event = app.services.timeline.append({
      familyId: registered.family.family_id,
      subjectId: registered.maternal.maternal_id,
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-03-01T09:00:00.000Z',
      createdBy: registered.user.user_id,
    });

    const response = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: registered.session.token,
    });
    const body = response.body as TimelineResponse;
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.event_id).toBe(event.event_id);
  });

  it('a correction never mutates the original row in storage', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');

    const original = app.services.timeline.append({
      familyId: registered.family.family_id,
      subjectId: registered.maternal.maternal_id,
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-03-01T09:00:00.000Z',
      createdBy: registered.user.user_id,
    });
    const originalSnapshot = app.storage.get('Event', original.event_id);

    app.services.timeline.correct(original.event_id, {
      createdBy: registered.user.user_id,
      occurredAt: '2026-03-02T09:00:00.000Z',
    });

    expect(app.storage.get('Event', original.event_id)).toEqual(originalSnapshot);
  });

  it('GET /v1/timeline shows the corrected event, not a duplicate of the original', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');

    const original = app.services.timeline.append({
      familyId: registered.family.family_id,
      subjectId: registered.maternal.maternal_id,
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-03-01T09:00:00.000Z',
      createdBy: registered.user.user_id,
    });
    const corrected = app.services.timeline.correct(original.event_id, {
      createdBy: registered.user.user_id,
      occurredAt: '2026-03-05T09:00:00.000Z',
    });

    const response = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: registered.session.token,
    });
    const body = response.body as TimelineResponse;
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.event_id).toBe(corrected.event_id);
    expect(body.items[0]?.occurred_at).toBe('2026-03-05T09:00:00.000Z');
  });

  it('the adapter itself refuses an in-place update to an Event row (append-only, 54 BR-3)', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');
    const event = app.services.timeline.append({
      familyId: registered.family.family_id,
      subjectId: registered.maternal.maternal_id,
      type: 'note',
      lifeStage: 'pregnancy',
      occurredAt: '2026-03-01T09:00:00.000Z',
      createdBy: registered.user.user_id,
    });

    expect(() => app.storage.update('Event', event.event_id, { version: 99 })).toThrowError(
      /append-only/i,
    );
  });

  it('every timeline read is audited (docs/05-Data/75 BR-1)', () => {
    const app = buildTestApp();
    const registered = registerAccount(app, 'jane@example.com');

    app.handle({ method: 'GET', path: '/v1/timeline', token: registered.session.token });

    const auditRecords = app.storage.query('AuditRecord', {
      actor_user_id: registered.user.user_id,
      entity: 'Event',
      action: 'read',
    });
    expect(auditRecords.length).toBeGreaterThanOrEqual(1);
  });
});
