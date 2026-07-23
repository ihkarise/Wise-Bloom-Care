/**
 * AuthService tests (docs/20-Implementation/206 §9: "auth token lifecycle";
 * acceptance criteria: register+disclaimer, scoped session, rate limiting).
 */

import { describe, expect, it } from 'vitest';

import { createLogger } from '../../src/lib/logging';
import { createInMemoryRateLimiter } from '../../src/lib/rateLimiter';
import {
  AuthRateLimitedError,
  AuthService,
  AuthValidationError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from '../../src/services/AuthService';
import { AuditService } from '../../src/services/AuditService';
import { FamilyService } from '../../src/services/FamilyService';
import { MaternalService } from '../../src/services/MaternalService';
import { SessionService } from '../../src/services/SessionService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

import type { StorageAdapter } from '../../src/adapters/StorageAdapter';

const EMAIL_PEPPER = 'test-pepper';

function buildAuthService(storage: StorageAdapter = createInMemoryAdapter()) {
  const logger = createLogger({ sink: () => undefined });
  const sessions = new SessionService(storage);
  const audit = new AuditService(storage, logger);
  const family = new FamilyService(storage);
  const maternal = new MaternalService(storage);
  const auth = new AuthService({
    storage,
    sessions,
    audit,
    family,
    maternal,
    logger,
    emailPepper: EMAIL_PEPPER,
    registerLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
    loginLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
  });
  return { storage, auth, sessions, audit, family, maternal };
}

const VALID_REGISTER = {
  email: 'jane@example.com',
  password: 'correct-horse-battery-staple',
  disclaimerAck: true,
  maternalName: 'Jane Doe',
  rateLimitKey: 'jane@example.com',
};

describe('AuthService.register', () => {
  it('creates a User, Family, MaternalRecord, and Session together', () => {
    const { auth } = buildAuthService();
    const result = auth.register(VALID_REGISTER);

    expect(result.user.role).toBe('account_holder');
    expect(result.user.status).toBe('active');
    expect(result.user.disclaimer_ack_at).toBeTruthy();
    expect(result.family.owner_user_id).toBe(result.user.user_id);
    expect(result.maternal.family_id).toBe(result.family.family_id);
    expect(result.maternal.profile.name).toBe('Jane Doe');
    expect(result.session.user_id).toBe(result.user.user_id);
  });

  it('never stores the plaintext password or email', () => {
    const { storage, auth } = buildAuthService();
    const result = auth.register(VALID_REGISTER);
    const stored = storage.get('User', result.user.user_id);
    expect(JSON.stringify(stored)).not.toContain('jane@example.com');
    expect(JSON.stringify(stored)).not.toContain('correct-horse-battery-staple');
  });

  it('records an audit entry for the registration (no PHI)', () => {
    const storage = createInMemoryAdapter();
    const logger = createLogger({ sink: () => undefined });
    const audit = new AuditService(storage, logger);
    const auth = new AuthService({
      storage,
      sessions: new SessionService(storage),
      audit,
      family: new FamilyService(storage),
      maternal: new MaternalService(storage),
      logger,
      emailPepper: EMAIL_PEPPER,
      registerLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
      loginLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
    });

    const result = auth.register(VALID_REGISTER);
    const auditRecords = storage.query('AuditRecord', { entity_id: result.user.user_id });
    expect(auditRecords).toHaveLength(1);
    expect(auditRecords[0]?.action).toBe('create');
  });

  it('rejects an invalid email', () => {
    const { auth } = buildAuthService();
    expect(() => auth.register({ ...VALID_REGISTER, email: 'not-an-email' })).toThrow(
      AuthValidationError,
    );
  });

  it('rejects a too-short password', () => {
    const { auth } = buildAuthService();
    expect(() => auth.register({ ...VALID_REGISTER, password: 'short' })).toThrow(
      AuthValidationError,
    );
  });

  it('rejects registration without disclaimer acknowledgement', () => {
    const { auth } = buildAuthService();
    expect(() => auth.register({ ...VALID_REGISTER, disclaimerAck: false })).toThrow(
      AuthValidationError,
    );
  });

  it('rejects a duplicate email (case/whitespace-insensitive)', () => {
    const { auth } = buildAuthService();
    auth.register(VALID_REGISTER);
    expect(() =>
      auth.register({
        ...VALID_REGISTER,
        email: ' Jane@Example.com ',
        maternalName: 'Someone Else',
      }),
    ).toThrow(EmailAlreadyRegisteredError);
  });

  it('is rate-limited', () => {
    const storage = createInMemoryAdapter();
    const logger = createLogger({ sink: () => undefined });
    const auth = new AuthService({
      storage,
      sessions: new SessionService(storage),
      audit: new AuditService(storage, logger),
      family: new FamilyService(storage),
      maternal: new MaternalService(storage),
      logger,
      emailPepper: EMAIL_PEPPER,
      registerLimiter: createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 }),
      loginLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
    });

    auth.register(VALID_REGISTER);
    expect(() => auth.register({ ...VALID_REGISTER, email: 'other@example.com' })).toThrow(
      AuthRateLimitedError,
    );
  });
});

describe('AuthService.login', () => {
  it('logs in with the correct credentials and issues a session', () => {
    const { auth } = buildAuthService();
    auth.register(VALID_REGISTER);

    const result = auth.login({
      email: VALID_REGISTER.email,
      password: VALID_REGISTER.password,
      rateLimitKey: VALID_REGISTER.email,
    });
    expect(result.session.user_id).toBe(result.user.user_id);
  });

  it('rejects a wrong password with a generic, non-enumerating error', () => {
    const { auth } = buildAuthService();
    auth.register(VALID_REGISTER);

    expect(() =>
      auth.login({ email: VALID_REGISTER.email, password: 'wrong-password', rateLimitKey: 'k' }),
    ).toThrow(InvalidCredentialsError);
  });

  it('rejects an unknown email with the SAME error type as a wrong password (anti-enumeration, 57 BR-4)', () => {
    const { auth } = buildAuthService();
    auth.register(VALID_REGISTER);

    let unknownEmailError: unknown;
    let wrongPasswordError: unknown;
    try {
      auth.login({ email: 'nobody@example.com', password: 'irrelevant123', rateLimitKey: 'k1' });
    } catch (error) {
      unknownEmailError = error;
    }
    try {
      auth.login({ email: VALID_REGISTER.email, password: 'wrong-password', rateLimitKey: 'k2' });
    } catch (error) {
      wrongPasswordError = error;
    }
    expect(unknownEmailError).toBeInstanceOf(InvalidCredentialsError);
    expect(wrongPasswordError).toBeInstanceOf(InvalidCredentialsError);
    expect((unknownEmailError as Error).message).toBe((wrongPasswordError as Error).message);
  });

  it('is rate-limited', () => {
    const storage = createInMemoryAdapter();
    const logger = createLogger({ sink: () => undefined });
    const auth = new AuthService({
      storage,
      sessions: new SessionService(storage),
      audit: new AuditService(storage, logger),
      family: new FamilyService(storage),
      maternal: new MaternalService(storage),
      logger,
      emailPepper: EMAIL_PEPPER,
      registerLimiter: createInMemoryRateLimiter({ limit: 100, windowMs: 60_000 }),
      loginLimiter: createInMemoryRateLimiter({ limit: 1, windowMs: 60_000 }),
    });
    auth.register(VALID_REGISTER);

    // The first attempt consumes the single allowed slot (and fails on bad credentials).
    expect(() =>
      auth.login({ email: VALID_REGISTER.email, password: 'wrong', rateLimitKey: 'same-key' }),
    ).toThrow(InvalidCredentialsError);
    // The second attempt — even with correct credentials — is rejected by the limiter first.
    expect(() =>
      auth.login({
        email: VALID_REGISTER.email,
        password: VALID_REGISTER.password,
        rateLimitKey: 'same-key',
      }),
    ).toThrow(AuthRateLimitedError);
  });
});

describe('AuthService.logout / refresh', () => {
  it('logout revokes the session; a second logout is idempotent', () => {
    const { auth } = buildAuthService();
    const { session } = auth.register(VALID_REGISTER);

    expect(() => auth.logout(session.session_id)).not.toThrow();
    expect(() => auth.logout(session.session_id)).not.toThrow();
    expect(() => auth.refresh(session.session_id)).toThrow();
  });

  it('refresh renews an active session', () => {
    const { auth } = buildAuthService();
    const { session } = auth.register(VALID_REGISTER);
    const refreshed = auth.refresh(session.session_id);
    expect(refreshed.session_id).toBe(session.session_id);
    expect(Date.parse(refreshed.expires_at)).toBeGreaterThanOrEqual(Date.parse(session.expires_at));
  });
});
