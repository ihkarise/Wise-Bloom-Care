/**
 * Auth API calls (docs/04-Architecture/56 §5 `/v1/auth/*`). Register and
 * login are the only calls made without a bearer token yet — the caller
 * constructs an `ApiClient` with no `token` for those two, then builds an
 * authenticated client from the returned session (docs/04-Architecture/57).
 */

import type { ApiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from '@wise-bloom/api-contract';

export function register(client: ApiClient, input: RegisterRequest): Promise<RegisterResponse> {
  return client.request<RegisterResponse>('/auth/register', { method: 'POST', body: input });
}

export function login(client: ApiClient, input: LoginRequest): Promise<LoginResponse> {
  return client.request<LoginResponse>('/auth/login', { method: 'POST', body: input });
}

/** Requires a client constructed with the session's token. */
export function logout(client: ApiClient): Promise<{ success: true }> {
  return client.request<{ success: true }>('/auth/logout', { method: 'POST' });
}

/** Requires a client constructed with the session's token. */
export function refresh(client: ApiClient): Promise<RefreshResponse> {
  return client.request<RefreshResponse>('/auth/refresh', { method: 'POST' });
}
