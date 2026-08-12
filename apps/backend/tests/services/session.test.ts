/**
 * SessionService tests (docs/20-Implementation/206 §9: "session expiry").
 */

import { describe, expect, it } from 'vitest';

import {
  ABSOLUTE_LIFETIME_MS,
  ACCESS_TTL_MS,
  SessionAuthenticationError,
  SessionService,
} from '../../src/services/SessionService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

import type { SheetsStorageAdapter } from '../../src/adapters/sheets/SheetsStorageAdapter';

function clock(startMs: number) {
  let t = startMs;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

/** Sessions carry a FK to User (docs/04-Architecture/54 §5); seed a minimal one so `issue()` passes integrity. */
function seedUser(adapter: SheetsStorageAdapter, userId: string): void {
  adapter.create('User', {
    user_id: userId,
    email_hash: `hash-${userId}`,
    credential_hash: 'irrelevant',
    role: 'account_holder',
    status: 'active',
  });
}

describe('SessionService', () => {
  it('issues a session with the expected access TTL', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const c = clock(Date.parse('2026-01-01T00:00:00.000Z'));
    const sessions = new SessionService(adapter, c.now);

    const session = sessions.issue('user-1');
    expect(session.user_id).toBe('user-1');
    expect(Date.parse(session.expires_at) - Date.parse(session.issued_at)).toBe(ACCESS_TTL_MS);
  });

  it('validates a fresh session and rejects an unknown token', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const sessions = new SessionService(adapter);
    const session = sessions.issue('user-1');

    expect(sessions.validate(session.session_id)).toEqual(session);
    expect(() => sessions.validate('does-not-exist')).toThrow(SessionAuthenticationError);
  });

  it('rejects an expired session (fail closed)', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const c = clock(Date.parse('2026-01-01T00:00:00.000Z'));
    const sessions = new SessionService(adapter, c.now);
    const session = sessions.issue('user-1');

    c.advance(ACCESS_TTL_MS + 1);
    expect(() => sessions.validate(session.session_id)).toThrow(SessionAuthenticationError);
  });

  it('refresh extends the access TTL', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const c = clock(Date.parse('2026-01-01T00:00:00.000Z'));
    const sessions = new SessionService(adapter, c.now);
    const session = sessions.issue('user-1');

    c.advance(ACCESS_TTL_MS / 2);
    const refreshed = sessions.refresh(session.session_id);
    expect(Date.parse(refreshed.expires_at)).toBe(c.now() + ACCESS_TTL_MS);
  });

  it('refresh cannot extend past the absolute session lifetime', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const c = clock(Date.parse('2026-01-01T00:00:00.000Z'));
    const sessions = new SessionService(adapter, c.now);
    const session = sessions.issue('user-1');

    // Keep refreshing just before each expiry until we approach the absolute ceiling.
    let elapsed = 0;
    while (elapsed + ACCESS_TTL_MS / 2 < ABSOLUTE_LIFETIME_MS) {
      c.advance(ACCESS_TTL_MS / 2);
      elapsed += ACCESS_TTL_MS / 2;
      sessions.refresh(session.session_id);
    }
    // Push past the absolute ceiling — refresh must now fail closed.
    c.advance(ABSOLUTE_LIFETIME_MS);
    expect(() => sessions.refresh(session.session_id)).toThrow(SessionAuthenticationError);
  });

  it('revoke immediately invalidates the session (logout)', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    const sessions = new SessionService(adapter);
    const session = sessions.issue('user-1');

    sessions.revoke(session.session_id);
    expect(() => sessions.validate(session.session_id)).toThrow(SessionAuthenticationError);
  });

  it('revoke is idempotent for an unknown token', () => {
    const adapter = createInMemoryAdapter();
    const sessions = new SessionService(adapter);
    expect(() => sessions.revoke('unknown-token')).not.toThrow();
  });

  it('revokeAllForUser bulk-revokes every session for a user (compromise response)', () => {
    const adapter = createInMemoryAdapter();
    seedUser(adapter, 'user-1');
    seedUser(adapter, 'user-2');
    const sessions = new SessionService(adapter);
    const a = sessions.issue('user-1');
    const b = sessions.issue('user-1');
    const other = sessions.issue('user-2');

    sessions.revokeAllForUser('user-1');

    expect(() => sessions.validate(a.session_id)).toThrow(SessionAuthenticationError);
    expect(() => sessions.validate(b.session_id)).toThrow(SessionAuthenticationError);
    expect(sessions.validate(other.session_id)).toEqual(other);
  });
});
