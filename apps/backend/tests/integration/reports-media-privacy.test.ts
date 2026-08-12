/**
 * Reports media-privacy integration (docs/20-Implementation/207 §8: report
 * media is served only through short-lived backend-mediated refs; no public
 * URL exists — docs/04-Architecture/58, docs/06-Modules/84 BR-1). Drives the
 * full HTTP-shaped pipeline.
 */

import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../support/testApp';

import type {
  CreateReportResponse,
  RegisterResponse,
  ReportListResponse,
  ReportMediaResponse,
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

function upload(app: ReturnType<typeof buildTestApp>, me: RegisterResponse): CreateReportResponse {
  return app.handle({
    method: 'POST',
    path: '/v1/reports',
    token: me.session.token,
    body: {
      subject_id: me.maternal.maternal_id,
      kind: 'ultrasound',
      media_upload_ref: 'client-upload-handle',
    },
  }).body as CreateReportResponse;
}

const PUBLIC_URL_RE = /^(https?:|ftp:|\/\/)/i;

describe('Reports media privacy', () => {
  it('stored report metadata carries a private media_ref — never a public URL', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = upload(app, me);
    expect(created.report.media_ref).not.toMatch(PUBLIC_URL_RE);

    // The persisted row itself contains no public link.
    const stored = app.storage.get('Report', created.report.report_id);
    expect(stored?.media_ref).not.toMatch(PUBLIC_URL_RE);
  });

  it('a report upload appears on the timeline (continuity, 84 BR-5)', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = upload(app, me);
    const timeline = app.handle({
      method: 'GET',
      path: '/v1/timeline',
      token: me.session.token,
    }).body as TimelineResponse;
    expect(timeline.items.map((e) => e.event_id)).toContain(created.event.event_id);
    expect(timeline.items[0]?.type).toBe('report');
  });

  it('the list endpoint returns metadata only — no public media link', () => {
    const app = buildTestApp();
    const me = register(app);
    upload(app, me);
    const list = app.handle({
      method: 'GET',
      path: '/v1/reports',
      token: me.session.token,
    }).body as ReportListResponse;
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.media_ref).not.toMatch(PUBLIC_URL_RE);
  });

  it('media is fetched via a short-lived, expiring backend-mediated ref (not a public link)', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = upload(app, me);

    const media = app.handle({
      method: 'GET',
      path: '/v1/reports/media',
      token: me.session.token,
      query: { report_id: created.report.report_id },
    });
    expect(media.status).toBe(200);
    const body = media.body as ReportMediaResponse;
    expect(body.media_ref).not.toMatch(PUBLIC_URL_RE);
    expect(new Date(body.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('minting a media ref requires authentication (fail closed)', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = upload(app, me);
    const media = app.handle({
      method: 'GET',
      path: '/v1/reports/media',
      query: { report_id: created.report.report_id },
    });
    expect(media.status).toBe(401);
  });

  it('a caller cannot mint a media ref for a report outside their family', () => {
    const app = buildTestApp();
    const me = register(app);
    const created = upload(app, me);

    const other = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: {
        email: 'mallory@example.com',
        password: 'correct-horse-battery-staple',
        disclaimer_ack: true,
        maternal_name: 'Mallory',
      },
    }).body as RegisterResponse;

    const media = app.handle({
      method: 'GET',
      path: '/v1/reports/media',
      token: other.session.token,
      query: { report_id: created.report.report_id },
    });
    expect(media.status).toBe(403);
  });
});
