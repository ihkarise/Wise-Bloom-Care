/**
 * Week-by-week knowledge integration (MS-1.6, docs/06-Modules/82 FR-4,
 * docs/20-Implementation/208 §8/§9). Drives the full HTTP-shaped pipeline
 * (auth → controller → services → bundled KB) exactly as production does: the
 * current week is derived from the mother's active pregnancy episode's GA and
 * served typed + sourced; browsing by explicit week works; unknown GA, bad
 * weeks, RBAC, auth, and PHI-safe auditing all hold.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type { ContentItemResponse, RegisterResponse } from '@wise-bloom/api-contract';

type App = ReturnType<typeof buildTestApp>;

function register(app: App, email = 'jane@example.com'): RegisterResponse {
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

/** ISO date `days` days before today (UTC). */
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Registers and starts an active pregnancy episode with an LMP giving ~`weeks` GA today. */
function registerWithGestation(
  app: App,
  weeks: number,
  email = 'jane@example.com',
): RegisterResponse {
  const me = register(app, email);
  app.handle({
    method: 'POST',
    path: '/v1/maternal/pregnancy-episodes',
    token: me.session.token,
    body: { lmp: isoDaysAgo(weeks * 7) },
  });
  return me;
}

describe('GET /v1/content — week-by-week knowledge', () => {
  it('surfaces the GA-derived current week, typed + sourced, with its body', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12);

    const response = app.handle({ method: 'GET', path: '/v1/content', token: me.session.token });
    expect(response.status).toBe(200);
    const body = response.body as ContentItemResponse;
    expect(body.week).toBe(12);
    expect(body.content.content_type).toBe('educational');
    expect(body.content.source_ref.length).toBeGreaterThan(0);
    expect(body.content.kb_path).toBe('knowledge-base/pregnancy/week12.md');
    expect(body.title).toBe('Pregnancy — Week 12');
    expect(body.body).toContain('Educational information');
    expect(body.gestational_age?.weeks).toBe(12);
  });

  it('serves an explicit week for browsing', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12);

    const response = app.handle({
      method: 'GET',
      path: '/v1/content',
      token: me.session.token,
      query: { week: '20' },
    });
    expect(response.status).toBe(200);
    const body = response.body as ContentItemResponse;
    expect(body.week).toBe(20);
    expect(body.title).toBe('Pregnancy — Week 20');
  });

  it('rejects weeks outside the authored 1..40 range with validation_failed', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12);
    for (const week of ['0', '41', 'abc', '12.5']) {
      const response = app.handle({
        method: 'GET',
        path: '/v1/content',
        token: me.session.token,
        query: { week },
      });
      expect(response.status).toBe(422);
    }
  });

  it('returns not_found when there is no active episode / no gestational age', () => {
    const app = buildTestApp();
    const me = register(app); // no pregnancy episode created
    const response = app.handle({ method: 'GET', path: '/v1/content', token: me.session.token });
    expect(response.status).toBe(404);
  });

  it('does not derive a week from a non-active (e.g. delivered) episode', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12);
    // Close the only episode; the default (GA-driven) week then has no source.
    const episodes = app.storage.query('PregnancyEpisode', {
      maternal_id: me.maternal.maternal_id,
    });
    app.storage.update('PregnancyEpisode', episodes[0]!.episode_id, { status: 'delivered' });

    const response = app.handle({ method: 'GET', path: '/v1/content', token: me.session.token });
    expect(response.status).toBe(404);
  });

  it('requires authentication', () => {
    const app = buildTestApp();
    registerWithGestation(app, 12);
    const response = app.handle({ method: 'GET', path: '/v1/content' });
    expect(response.status).toBe(401);
  });

  it('refuses a family the caller is not authorised for (RBAC, fail closed)', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12, 'owner@example.com');
    const other = register(app, 'other@example.com');

    const response = app.handle({
      method: 'GET',
      path: '/v1/content',
      token: me.session.token,
      query: { family_id: other.family.family_id },
    });
    expect(response.status).toBe(403);
  });

  it('audits the read without any PHI in the audit metadata (75 BR-1/BR-2)', () => {
    const app = buildTestApp();
    const me = registerWithGestation(app, 12);
    app.handle({ method: 'GET', path: '/v1/content', token: me.session.token });

    const audits = app.storage.query('AuditRecord', {
      actor_user_id: me.user.user_id,
      entity: 'ContentItem',
      action: 'read',
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    for (const audit of audits) {
      // No week, no gestational age, no content body in the audit record.
      expect(audit.meta).toBeUndefined();
      expect(JSON.stringify(audit)).not.toContain('Educational information');
    }
  });
});
