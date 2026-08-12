/**
 * Full auth-flow integration test (docs/20-Implementation/206 §9: "full auth
 * flow (register→login→authorised call→logout)"; acceptance criteria:
 * scoped session token, unauthenticated rejected, out-of-family-scope
 * forbidden).
 */

import { describe, expect, it } from 'vitest';

import type { ApiResponse } from '../../src/controllers/router';
import { buildTestApp } from '../support/testApp';

import type {
  FamilyResponse,
  LoginResponse,
  MaternalResponse,
  RegisterResponse,
} from '@wise-bloom/api-contract';

function registerBody(email: string) {
  return {
    email,
    password: 'correct-horse-battery-staple',
    disclaimer_ack: true,
    maternal_name: 'Jane Doe',
  };
}

describe('Full auth flow: register → login → authorised call → logout', () => {
  it('registers, then makes an authorised call with the issued token', () => {
    const app = buildTestApp();

    const registerResponse = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    });
    expect(registerResponse.status).toBe(201);
    const registered = registerResponse.body as RegisterResponse;
    expect(registered.user.role).toBe('account_holder');
    expect(registered.session.token).toBeTruthy();

    const familyResponse = app.handle({
      method: 'GET',
      path: '/v1/family',
      token: registered.session.token,
    });
    expect(familyResponse.status).toBe(200);
    expect((familyResponse.body as FamilyResponse).family.family_id).toBe(
      registered.family.family_id,
    );
  });

  it('rejects unauthenticated requests (missing token)', () => {
    const app = buildTestApp();
    const response = app.handle({ method: 'GET', path: '/v1/family' });
    expect(response.status).toBe(401);
    expect((response.body as { error: { code: string } }).error.code).toBe('unauthenticated');
  });

  it('rejects requests with an invalid/unknown token (fail closed)', () => {
    const app = buildTestApp();
    const response = app.handle({ method: 'GET', path: '/v1/family', token: 'not-a-real-token' });
    expect(response.status).toBe(401);
  });

  it('logs in with the registered credentials and receives a new scoped session', () => {
    const app = buildTestApp();
    app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    });

    const loginResponse = app.handle({
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'jane@example.com', password: 'correct-horse-battery-staple' },
    });
    expect(loginResponse.status).toBe(200);
    const { session } = loginResponse.body as LoginResponse;
    expect(session.token).toBeTruthy();

    const maternalResponse = app.handle({
      method: 'GET',
      path: '/v1/maternal',
      token: session.token,
    });
    expect(maternalResponse.status).toBe(200);
    expect((maternalResponse.body as MaternalResponse).maternal.profile.name).toBe('Jane Doe');
  });

  it('logout revokes the session; subsequent authenticated calls are rejected', () => {
    const app = buildTestApp();
    const register = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    }).body as RegisterResponse;

    const logoutResponse = app.handle({
      method: 'POST',
      path: '/v1/auth/logout',
      token: register.session.token,
    });
    expect(logoutResponse.status).toBe(200);

    const afterLogout = app.handle({
      method: 'GET',
      path: '/v1/family',
      token: register.session.token,
    });
    expect(afterLogout.status).toBe(401);
  });

  it('refresh renews the session without changing the bearer token', () => {
    const app = buildTestApp();
    const register = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    }).body as RegisterResponse;

    const refreshResponse = app.handle({
      method: 'POST',
      path: '/v1/auth/refresh',
      token: register.session.token,
    });
    expect(refreshResponse.status).toBe(200);
    const refreshed = (refreshResponse.body as { session: { token: string; expires_at: string } })
      .session;
    expect(refreshed.token).toBe(register.session.token);
  });

  it('requests outside family scope are forbidden (RBAC, docs/09-Security/123)', () => {
    const app = buildTestApp();
    const userA = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('a@example.com'),
    }).body as RegisterResponse;
    const userB = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('b@example.com'),
    }).body as RegisterResponse;

    // A has a valid session, but requests B's family explicitly.
    const response = app.handle({
      method: 'GET',
      path: '/v1/family',
      token: userA.session.token,
      query: { family_id: userB.family.family_id },
    });
    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe('forbidden');
  });

  it('a valid session accessing its own family by explicit id succeeds', () => {
    const app = buildTestApp();
    const registered = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    }).body as RegisterResponse;

    const response: ApiResponse = app.handle({
      method: 'GET',
      path: '/v1/family',
      token: registered.session.token,
      query: { family_id: registered.family.family_id },
    });
    expect(response.status).toBe(200);
  });

  it('rejects registration without disclaimer acknowledgement with a validation error', () => {
    const app = buildTestApp();
    const response = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: { ...registerBody('jane@example.com'), disclaimer_ack: false },
    });
    expect(response.status).toBe(422);
  });

  it('rejects a duplicate registration with a conflict', () => {
    const app = buildTestApp();
    app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    });
    const response = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    });
    expect(response.status).toBe(409);
  });

  it('produces audit records for registration and login, with no PHI in them (docs/05-Data/75)', () => {
    const app = buildTestApp();
    const registered = app.handle({
      method: 'POST',
      path: '/v1/auth/register',
      body: registerBody('jane@example.com'),
    }).body as RegisterResponse;

    app.handle({
      method: 'POST',
      path: '/v1/auth/login',
      body: { email: 'jane@example.com', password: 'correct-horse-battery-staple' },
    });

    const auditRecords = app.storage.query('AuditRecord', {
      actor_user_id: registered.user.user_id,
    });
    const actions = auditRecords.map((record) => record.action);
    expect(actions).toContain('create'); // registration
    expect(actions).toContain('login');
    expect(JSON.stringify(auditRecords)).not.toContain('jane@example.com');
    expect(JSON.stringify(auditRecords)).not.toContain('Jane Doe');
  });
});
