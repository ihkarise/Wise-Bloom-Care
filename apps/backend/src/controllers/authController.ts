/**
 * Auth controller — register/login/logout/refresh (docs/04-Architecture/56
 * §5 `/v1/auth/*`, docs/04-Architecture/57).
 *
 * Register and login are the two **public** routes in the whole API (no
 * session exists yet); every AuthService error is mapped to the standard
 * error envelope here so the router's generic catch-all never has to guess a
 * domain error's code (docs/04-Architecture/56 §8).
 */

import {
  AuthRateLimitedError,
  AuthValidationError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  type AuthService,
} from '../services/AuthService';
import { asRecord, asString } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type {
  AuthSession,
  LoginResponse,
  PublicUser,
  RefreshResponse,
  RegisterResponse,
} from '@wise-bloom/api-contract';
import type { Session, User } from '@wise-bloom/domain-types';

function toPublicUser(user: User): PublicUser {
  return { user_id: user.user_id, role: user.role, status: user.status };
}

function toAuthSession(session: Session): AuthSession {
  return {
    token: session.session_id,
    issued_at: session.issued_at,
    expires_at: session.expires_at,
  };
}

/** Maps a typed AuthService error to the coded API envelope (docs/04-Architecture/56 §8). Re-throws anything else. */
function mapAuthError(error: unknown): never {
  if (error instanceof AuthValidationError) {
    throw new ApiException('validation_failed', 422, error.message);
  }
  if (error instanceof EmailAlreadyRegisteredError) {
    throw new ApiException('conflict', 409, error.message);
  }
  if (error instanceof InvalidCredentialsError) {
    throw new ApiException('unauthenticated', 401, error.message);
  }
  if (error instanceof AuthRateLimitedError) {
    throw new ApiException('rate_limited', 429, error.message);
  }
  throw error;
}

export function createAuthController(deps: { auth: AuthService }): Record<string, RouteHandler> {
  const { auth } = deps;

  return {
    'POST /v1/auth/register': (request): { status: number; body: RegisterResponse } => {
      const body = asRecord(request.body);
      const email = asString(body['email'], 'email');
      const password = asString(body['password'], 'password');
      const maternalName = asString(body['maternal_name'], 'maternal_name');
      const disclaimerAck = body['disclaimer_ack'] === true;

      try {
        const result = auth.register({
          email,
          password,
          disclaimerAck,
          maternalName,
          rateLimitKey: email.trim().toLowerCase(),
        });
        return {
          status: 201,
          body: {
            user: toPublicUser(result.user),
            session: toAuthSession(result.session),
            family: result.family,
            maternal: result.maternal,
          },
        };
      } catch (error) {
        mapAuthError(error);
      }
    },

    'POST /v1/auth/login': (request): { status: number; body: LoginResponse } => {
      const body = asRecord(request.body);
      const email = asString(body['email'], 'email');
      const password = asString(body['password'], 'password');

      try {
        const result = auth.login({ email, password, rateLimitKey: email.trim().toLowerCase() });
        return {
          status: 200,
          body: { user: toPublicUser(result.user), session: toAuthSession(result.session) },
        };
      } catch (error) {
        mapAuthError(error);
      }
    },

    'POST /v1/auth/logout': (_request, actor): { status: number; body: { success: true } } => {
      const me = requireActor(actor);
      auth.logout(me.sessionId);
      return { status: 200, body: { success: true } };
    },

    'POST /v1/auth/refresh': (_request, actor): { status: number; body: RefreshResponse } => {
      const me = requireActor(actor);
      try {
        const session = auth.refresh(me.sessionId);
        return { status: 200, body: { session: toAuthSession(session) } };
      } catch {
        throw new ApiException('unauthenticated', 401, 'Session could not be refreshed');
      }
    },
  };
}
