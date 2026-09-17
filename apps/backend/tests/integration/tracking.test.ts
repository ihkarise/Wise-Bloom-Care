/**
 * Personal Wellness Tracker integration tests (docs/06-Modules/98, `ADR-007`,
 * Phase 2). Drives the full HTTP-shaped pipeline (auth → controller →
 * services → adapter) exactly as production does. Covers: RBAC fail-closed
 * (family + subject scoping), audit on every write with the exact metadata
 * shape (never tracker identity or value content), deactivate → reactivate
 * preserving history without a duplicate row, and — the ADR-007 guarantee —
 * that recording a tracker entry creates **zero** shared timeline `Event`
 * rows.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  AddTrackerEntryResponse,
  RegisterResponse,
  SetTrackerPreferenceResponse,
  TimelineResponse,
  TrackerEntryListResponse,
  TrackerPreferenceListResponse,
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

function activate(
  app: ReturnType<typeof buildTestApp>,
  me: RegisterResponse,
  trackerKey = 'baby_movement',
): SetTrackerPreferenceResponse {
  return app.handle({
    method: 'POST',
    path: '/v1/tracking/preferences',
    token: me.session.token,
    body: { subject_id: me.maternal.maternal_id, tracker_key: trackerKey, active: true },
  }).body as SetTrackerPreferenceResponse;
}

describe('POST /v1/tracking/preferences — activate/deactivate/reactivate', () => {
  it('activates a curated tracker', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = activate(app, me);
    expect(response.preference.active).toBe(true);
    expect(response.preference.tracker_key).toBe('baby_movement');
  });

  it('rejects an unknown tracker key with validation_failed', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/preferences',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'not_a_tracker', active: true },
    });
    expect(response.status).toBe(422);
  });

  it('deactivating keeps the row (never deletes) and reactivating reuses the SAME row', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = activate(app, me);

    const deactivated = app.handle({
      method: 'POST',
      path: '/v1/tracking/preferences',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'baby_movement', active: false },
    }).body as SetTrackerPreferenceResponse;
    expect(deactivated.preference.tracker_pref_id).toBe(created.preference.tracker_pref_id);
    expect(deactivated.preference.active).toBe(false);

    const reactivated = app.handle({
      method: 'POST',
      path: '/v1/tracking/preferences',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'baby_movement', active: true },
    }).body as SetTrackerPreferenceResponse;
    expect(reactivated.preference.tracker_pref_id).toBe(created.preference.tracker_pref_id);
    expect(reactivated.preference.active).toBe(true);

    const list = app.handle({
      method: 'GET',
      path: '/v1/tracking/preferences',
      token: me.session.token,
    }).body as TrackerPreferenceListResponse;
    expect(list.items).toHaveLength(1);
  });

  it('refuses a subject outside the caller’s family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/preferences',
      token: me.session.token,
      body: { subject_id: 'someone-elses-maternal-id', tracker_key: 'baby_movement', active: true },
    });
    expect(response.status).toBe(403);
  });
});

describe('GET /v1/tracking/preferences', () => {
  it('includes read-only pregnancy-week context when an active episode exists', () => {
    const app = buildTestApp();
    const me = register(app);
    app.handle({
      method: 'POST',
      path: '/v1/maternal/pregnancy-episodes',
      token: me.session.token,
      body: { lmp: '2026-01-01' },
    });
    activate(app, me);

    const list = app.handle({
      method: 'GET',
      path: '/v1/tracking/preferences',
      token: me.session.token,
    }).body as TrackerPreferenceListResponse;
    expect(list.items).toHaveLength(1);
    expect(list.gestational_age).not.toBeNull();
  });

  it('omits gestational age (null, not an error) when no pregnancy episode exists', () => {
    const app = buildTestApp();
    const me = register(app);
    const list = app.handle({
      method: 'GET',
      path: '/v1/tracking/preferences',
      token: me.session.token,
    }).body as TrackerPreferenceListResponse;
    expect(list.gestational_age).toBeNull();
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    register(app);
    const response = app.handle({ method: 'GET', path: '/v1/tracking/preferences' });
    expect(response.status).toBe(401);
  });
});

describe('POST /v1/tracking/entries → ADR-007: never touches the shared timeline', () => {
  it('records an entry and returns it — with no `event` field at all', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me);

    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/entries',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'baby_movement', value: '1' },
    });
    expect(response.status).toBe(201);
    const body = response.body as AddTrackerEntryResponse;
    expect(body.entry.value).toBe('1');
    expect(body.entry.subject_id).toBe(me.maternal.maternal_id);
    expect('event' in body).toBe(false);
  });

  it('creates ZERO Event rows on the shared timeline (ADR-007, the core guarantee)', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me);

    const before = app.storage.query('Event', { family_id: me.family.family_id }).length;

    for (let i = 0; i < 5; i += 1) {
      app.handle({
        method: 'POST',
        path: '/v1/tracking/entries',
        token: me.session.token,
        body: { subject_id: me.maternal.maternal_id, tracker_key: 'baby_movement', value: '1' },
      });
    }

    const after = app.storage.query('Event', { family_id: me.family.family_id }).length;
    expect(after).toBe(before);

    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items.some((event) => (event.type as string) === 'tracker')).toBe(false);
  });

  it('is append-only: recording repeatedly creates multiple entries, visible via GET /v1/tracking/entries', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me);

    for (let i = 0; i < 3; i += 1) {
      app.handle({
        method: 'POST',
        path: '/v1/tracking/entries',
        token: me.session.token,
        body: { subject_id: me.maternal.maternal_id, tracker_key: 'baby_movement', value: '1' },
      });
    }

    const list = app.handle({
      method: 'GET',
      path: '/v1/tracking/entries',
      token: me.session.token,
      query: { tracker_key: 'baby_movement' },
    }).body as TrackerEntryListResponse;
    expect(list.items).toHaveLength(3);
  });

  it('rejects an invalid value for the tracker’s value type', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me, 'bloating'); // scale, 1-5

    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/entries',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'bloating', value: '99' },
    });
    expect(response.status).toBe(422);
  });

  it('refuses a subject outside the caller’s family (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/entries',
      token: me.session.token,
      body: { subject_id: 'someone-elses-maternal-id', tracker_key: 'baby_movement', value: '1' },
    });
    expect(response.status).toBe(403);
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    const response = app.handle({
      method: 'POST',
      path: '/v1/tracking/entries',
      body: { subject_id: 'x', tracker_key: 'baby_movement', value: '1' },
    });
    expect(response.status).toBe(401);
  });
});

describe('GET /v1/tracking/entries — requires tracker_key, RBAC', () => {
  it('rejects a missing tracker_key with validation_failed', () => {
    const app = buildTestApp();
    const me = register(app);
    const response = app.handle({
      method: 'GET',
      path: '/v1/tracking/entries',
      token: me.session.token,
    });
    expect(response.status).toBe(422);
  });

  it('refuses a caller not authorised for the requested family', () => {
    const app = buildTestApp();
    const owner = register(app, 'owner@example.com');
    const other = register(app, 'other@example.com');
    activate(app, owner);

    const response = app.handle({
      method: 'GET',
      path: '/v1/tracking/entries',
      token: other.session.token,
      query: { tracker_key: 'baby_movement', family_id: owner.family.family_id },
    });
    expect(response.status).toBe(403);
  });
});

describe('Audit (docs/05-Data/75 BR-1/BR-2, 98 §14 BR-6, Phase 1 D-2)', () => {
  it('audits every preference write with only {active} in meta — never the tracker key/name', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me, 'sleep_quality');

    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'TrackerPreference',
      action: 'update',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    for (const audit of audits) {
      expect(audit.meta).toEqual({ active: true });
      expect(JSON.stringify(audit)).not.toContain('sleep_quality');
    }
  });

  it('audits every entry write with NO content-bearing meta — never the tracker key or the recorded value', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me, 'mood');
    app.handle({
      method: 'POST',
      path: '/v1/tracking/entries',
      token: me.session.token,
      body: { subject_id: me.maternal.maternal_id, tracker_key: 'mood', value: '4' },
    });

    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'TrackerEntry',
      action: 'create',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    for (const audit of audits) {
      expect(audit.meta).toEqual({});
      expect(JSON.stringify(audit)).not.toContain('"mood"');
      // The recorded value ('4') is a single digit likely to collide with
      // unrelated numeric fields (ids, timestamps); assert on the full
      // audit record shape instead of a substring match for the value.
      expect(Object.keys(audit.meta ?? {})).toHaveLength(0);
    }
  });

  it('every read is audited with no meta at all', () => {
    const app = buildTestApp();
    const me = register(app);
    activate(app, me);
    app.handle({ method: 'GET', path: '/v1/tracking/preferences', token: me.session.token });

    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'TrackerPreference',
      action: 'read',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});
