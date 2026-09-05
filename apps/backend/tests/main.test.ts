/**
 * Entry-point request translation tests (apps/backend/src/main.ts).
 *
 * Google Apps Script Web Apps expose only query/form params and the POST body
 * to doGet/doPost — never custom request headers (docs/04-Architecture/53 §4).
 * These tests exercise that real translation seam directly (not the router in
 * isolation): they prove the bearer token, which the frontend sends as a
 * `token` query param (apps/web/src/api/client.ts), is read into
 * ApiRequest.token and kept out of the generic domain query bag.
 */

import { describe, expect, it } from 'vitest';

import { toApiRequest } from '../src/main';

type DoGet = GoogleAppsScript.Events.DoGet;
type DoPost = GoogleAppsScript.Events.DoPost;

function gasGet(parameter: Record<string, string>): DoGet {
  return { parameter } as unknown as DoGet;
}

function gasPost(parameter: Record<string, string>, body: unknown): DoPost {
  const postData = { contents: JSON.stringify(body) };
  return { parameter, postData } as unknown as DoPost;
}

describe('toApiRequest (GAS entry-point translation)', () => {
  it('reads the bearer token from the `token` query param, not a header', () => {
    const request = toApiRequest('GET', gasGet({ path: '/timeline', token: 'sess-123' }));
    expect(request.token).toBe('sess-123');
  });

  it('keeps reserved plumbing params out of the domain query bag', () => {
    const params = { path: '/timeline', token: 'sess-123', family_id: 'fam-1', cursor: '5' };
    const request = toApiRequest('GET', gasGet(params));
    expect(request.token).toBe('sess-123');
    expect(request.query).toEqual({ family_id: 'fam-1', cursor: '5' });
    expect(request.query?.token).toBeUndefined();
  });

  it('leaves the token undefined for an unauthenticated (public) request', () => {
    const request = toApiRequest('POST', gasPost({ path: '/auth/login' }, { email: 'a' }));
    expect(request.token).toBeUndefined();
    expect(request.body).toEqual({ email: 'a' });
  });

  it('reads idempotencyKey and correlationId from query params (the GAS-readable seam)', () => {
    // The frontend sends these as query params because GAS cannot read request
    // headers (apps/web/src/api/client.ts); they must land on the request, not
    // in the generic domain query bag.
    const request = toApiRequest(
      'POST',
      gasPost(
        {
          path: '/vitals',
          token: 'sess-123',
          idempotencyKey: 'idem-abc',
          correlationId: 'corr-xyz',
        },
        { vital_type: 'weight', value: 60 },
      ),
    );
    expect(request.idempotencyKey).toBe('idem-abc');
    expect(request.correlationId).toBe('corr-xyz');
    expect(request.query?.idempotencyKey).toBeUndefined();
    expect(request.query?.correlationId).toBeUndefined();
    expect(request.body).toEqual({ vital_type: 'weight', value: 60 });
  });

  it('rejects a malformed JSON body rather than silently accepting it', () => {
    const badPost = { parameter: { path: '/vitals' }, postData: { contents: '{ not json' } };
    expect(() => toApiRequest('POST', badPost as unknown as DoPost)).toThrow();
  });
});
