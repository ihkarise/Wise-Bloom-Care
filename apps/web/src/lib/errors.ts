/**
 * Calm, safe error copy for API failures (docs/00-Vision/03 "Calm" principle;
 * docs/04-Architecture/56 §8 "safe messages, no PHI/internals"). Centralised
 * so every form shows the same tone instead of raw error codes/messages.
 */

import { ApiRequestError } from '../api/client';

import type { ErrorCode } from '@wise-bloom/api-contract';

const MESSAGES_BY_CODE: Record<ErrorCode, string> = {
  validation_failed: 'Please check the highlighted fields and try again.',
  conflict: 'An account with this email already exists — try logging in instead.',
  rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
  unauthenticated: 'That email or password doesn’t match our records.',
  forbidden: 'You don’t have access to that.',
  not_found: 'We couldn’t find that.',
  server_error: 'Something went wrong on our end. Please try again in a moment.',
};

const FALLBACK_MESSAGE = 'Something went wrong on our end. Please try again in a moment.';

/** Maps any thrown error to calm, user-facing copy — never surfaces raw internals. */
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return MESSAGES_BY_CODE[error.envelope.error.code] ?? FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}
