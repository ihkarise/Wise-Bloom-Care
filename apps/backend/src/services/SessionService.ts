/**
 * SessionService — bearer session issuance, validation, refresh, and
 * revocation (docs/04-Architecture/57 §6, docs/09-Security/122).
 *
 * `session_id` doubles as the opaque bearer token (see the `Session` domain
 * type) — there is no separate token field to keep in sync. Every check is
 * fail-closed: an unknown or expired session is rejected the same way as no
 * session at all (122 BR-1, docs/04-Architecture/52 §8).
 */

import { newId } from '../lib/ids';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Session, UUID } from '@wise-bloom/domain-types';

/** Access-token TTL — short-lived; renewed by `refresh` (docs/09-Security/122 §4). */
export const ACCESS_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Absolute session lifetime ceiling — `refresh` can never extend past this (122 §4). */
export const ABSOLUTE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Thrown for any invalid/expired/absent session — callers map this to `unauthenticated` (fail closed). */
export class SessionAuthenticationError extends Error {
  override readonly name = 'SessionAuthenticationError';
}

export class SessionService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Issues a new session for a user. The returned `session_id` is the bearer token to hand back to the client. */
  issue(userId: UUID): Session {
    const issuedAt = this.now();
    const session: Session = {
      session_id: newId(),
      user_id: userId,
      issued_at: new Date(issuedAt).toISOString(),
      expires_at: new Date(issuedAt + ACCESS_TTL_MS).toISOString(),
    };
    return this.storage.create('Session', session);
  }

  /** Validates a bearer token; throws (fail closed) when it is absent, unknown, or expired. */
  validate(token: string): Session {
    const session = this.storage.get('Session', token);
    if (!session) {
      throw new SessionAuthenticationError('Unknown session');
    }
    if (Date.parse(session.expires_at) <= this.now()) {
      throw new SessionAuthenticationError('Session expired');
    }
    return session;
  }

  /** Renews a still-valid session's access TTL, capped at its absolute lifetime (122 §3–4). */
  refresh(token: string): Session {
    const session = this.validate(token);
    const ceiling = Date.parse(session.issued_at) + ABSOLUTE_LIFETIME_MS;
    const nextExpiry = Math.min(this.now() + ACCESS_TTL_MS, ceiling);
    if (nextExpiry <= this.now()) {
      throw new SessionAuthenticationError(
        'Session past its absolute lifetime; re-authentication required',
      );
    }
    return this.storage.update('Session', session.session_id, {
      expires_at: new Date(nextExpiry).toISOString(),
    });
  }

  /** Immediately and idempotently revokes a session (logout — docs/04-Architecture/57 §7). */
  revoke(token: string): void {
    const session = this.storage.get('Session', token);
    if (!session) {
      return;
    }
    this.storage.update('Session', session.session_id, {
      expires_at: new Date(this.now()).toISOString(),
    });
  }

  /** Bulk-revokes every session for a user — the compromise response (docs/09-Security/122 §6, BR-4). */
  revokeAllForUser(userId: UUID): void {
    for (const session of this.storage.query('Session', { user_id: userId })) {
      this.storage.update('Session', session.session_id, {
        expires_at: new Date(this.now()).toISOString(),
      });
    }
  }
}
