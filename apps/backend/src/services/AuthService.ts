/**
 * AuthService — registration, login, logout, refresh (docs/04-Architecture/57,
 * docs/06-Modules/80). Owns Users; orchestrates the registration flow's
 * family + maternal scaffold creation (57 §4 steps 3–5) via the injected
 * FamilyService/MaternalService, then issues the first session.
 *
 * Every rejection path throws a specific, typed error and never reveals
 * *why* a login failed (57 BR-4, anti-enumeration) — the controller maps each
 * error to the standard API error envelope (docs/04-Architecture/56 §8).
 */

import { newId } from '../lib/ids';
import { hashEmail, hashPassword, verifyPassword } from '../lib/password';
import { isEmail } from '../lib/validation';

import type { FamilyService } from './FamilyService';
import type { MaternalService } from './MaternalService';
import type { AuditService } from './AuditService';
import type { SessionService } from './SessionService';
import type { RateLimiter } from '../lib/rateLimiter';
import type { Logger } from '../lib/logging';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Family, MaternalRecord, Session, User } from '@wise-bloom/domain-types';

/** Minimum password length — a structural check only, not a strength meter (docs/05-Data/73 §4). */
const MIN_PASSWORD_LENGTH = 8;

export class AuthValidationError extends Error {
  override readonly name = 'AuthValidationError';
}

/** The email is already registered. Deliberately distinct from `InvalidCredentialsError` — registration
 * conflicts are not the anti-enumeration case login is (57 BR-4 governs login, not signup). */
export class EmailAlreadyRegisteredError extends Error {
  override readonly name = 'EmailAlreadyRegisteredError';
}

/** Generic, non-enumerating failure for any bad-credential path at login (57 BR-4). */
export class InvalidCredentialsError extends Error {
  override readonly name = 'InvalidCredentialsError';
}

export class AuthRateLimitedError extends Error {
  override readonly name = 'AuthRateLimitedError';
}

export interface RegisterInput {
  email: string;
  password: string;
  disclaimerAck: boolean;
  maternalName: string;
  /** Rate-limit bucket key (e.g., the normalised email), chosen by the controller (docs/09-Security/120). */
  rateLimitKey: string;
}

export interface RegisterResult {
  user: User;
  session: Session;
  family: Family;
  maternal: MaternalRecord;
}

export interface LoginInput {
  email: string;
  password: string;
  rateLimitKey: string;
}

export interface LoginResult {
  user: User;
  session: Session;
}

export interface AuthServiceDeps {
  storage: StorageAdapter;
  sessions: SessionService;
  audit: AuditService;
  family: FamilyService;
  maternal: MaternalService;
  logger: Logger;
  /** Server-side keyed-hash pepper for `email_hash` (Script Properties — docs/09-Security/124). */
  emailPepper: string;
  registerLimiter: RateLimiter;
  loginLimiter: RateLimiter;
  now?: () => string;
}

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  private now(): string {
    return (this.deps.now ?? (() => new Date().toISOString()))();
  }

  /** Registration flow (docs/04-Architecture/57 §4): validate → hash → create User → seed Family/Maternal → issue session → audit. */
  register(input: RegisterInput): RegisterResult {
    if (!this.deps.registerLimiter.consume(input.rateLimitKey)) {
      throw new AuthRateLimitedError('Too many registration attempts; please try again later');
    }
    const email = input.email.trim();
    if (!isEmail(email)) {
      throw new AuthValidationError('Invalid email address');
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new AuthValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (!input.maternalName.trim()) {
      throw new AuthValidationError('Missing required field: maternal_name');
    }
    if (!input.disclaimerAck) {
      throw new AuthValidationError('The medical disclaimer must be acknowledged to register');
    }

    const emailHash = hashEmail(email, this.deps.emailPepper);
    if (this.deps.storage.query('User', { email_hash: emailHash }).length > 0) {
      throw new EmailAlreadyRegisteredError('An account with this email already exists');
    }

    const user: User = {
      user_id: newId(),
      email_hash: emailHash,
      credential_hash: hashPassword(input.password),
      role: 'account_holder',
      status: 'active',
      disclaimer_ack_at: this.now(),
    };
    const createdUser = this.deps.storage.create('User', user);

    // Family + maternal scaffold (57 §4 step 4). No adapter-level transactions exist on
    // Sheets (docs/04-Architecture/53 §7); a failure here leaves an orphaned User with
    // no Family — an accepted v1 risk, documented in the Sprint 01 completion report,
    // matching 52 §10's "partial failures use compensating logic" guidance (full
    // rollback is out of scope without a `delete` capability on the adapter).
    const family = this.deps.family.createFamily(createdUser.user_id);
    const maternal = this.deps.maternal.createMaternalRecord(family.family_id, {
      name: input.maternalName,
    });

    const session = this.deps.sessions.issue(createdUser.user_id);

    this.deps.audit.record({
      actorUserId: createdUser.user_id,
      actorRole: createdUser.role,
      action: 'create',
      entity: 'User',
      entityId: createdUser.user_id,
      familyId: family.family_id,
    });

    return { user: createdUser, session, family, maternal };
  }

  /** Login flow (docs/04-Architecture/57 §5): rate-limit → look up → verify → issue session → audit. */
  login(input: LoginInput): LoginResult {
    if (!this.deps.loginLimiter.consume(input.rateLimitKey)) {
      throw new AuthRateLimitedError('Too many login attempts; please try again later');
    }

    const emailHash = hashEmail(input.email.trim(), this.deps.emailPepper);
    const [user] = this.deps.storage.query('User', { email_hash: emailHash });

    const credentialOk = user !== undefined && verifyPassword(input.password, user.credential_hash);
    if (!user || user.status === 'locked' || !credentialOk) {
      if (user) {
        this.deps.audit.record({
          actorUserId: user.user_id,
          actorRole: user.role,
          action: 'login',
          entity: 'User',
          entityId: user.user_id,
          meta: { result: 'failure' },
        });
      } else {
        // No identified actor to attribute an audit record to (75 §4 requires actor_user_id);
        // the operational logger carries the safe, non-PHI trace instead (75 §2).
        this.deps.logger.warn('login_failed', { action: 'login', code: 'unauthenticated' });
      }
      // Generic message on every path — no signal of *why* it failed (57 BR-4).
      throw new InvalidCredentialsError('Invalid email or password');
    }

    const session = this.deps.sessions.issue(user.user_id);
    this.deps.audit.record({
      actorUserId: user.user_id,
      actorRole: user.role,
      action: 'login',
      entity: 'User',
      entityId: user.user_id,
      meta: { result: 'success' },
    });
    return { user, session };
  }

  /** Logout (docs/04-Architecture/57 §7): idempotent revoke + audit when the session was identifiable. */
  logout(token: string): void {
    let userId: string | undefined;
    try {
      userId = this.deps.sessions.validate(token).user_id;
    } catch {
      // Already invalid/unknown/expired — logout still succeeds idempotently.
    }

    this.deps.sessions.revoke(token);

    if (userId) {
      const user = this.deps.storage.get('User', userId);
      this.deps.audit.record({
        actorUserId: userId,
        actorRole: user?.role ?? 'account_holder',
        action: 'revoke',
        entity: 'Session',
        entityId: token,
      });
    }
  }

  /** Refresh (docs/09-Security/122 §3–4): renews the access TTL within the absolute session lifetime. */
  refresh(token: string): Session {
    return this.deps.sessions.refresh(token);
  }
}
