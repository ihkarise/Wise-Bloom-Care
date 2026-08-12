/**
 * Client session state tests (docs/09-Security/122 §5).
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { clearSession, loadSession, saveSession, useSession } from '../../src/state/session';

const SAMPLE = {
  user: { user_id: 'u1', role: 'account_holder' as const, status: 'active' as const },
  session: {
    token: 'tok-1',
    issued_at: '2026-01-01T00:00:00.000Z',
    expires_at: '2026-01-01T00:30:00.000Z',
  },
};

describe('session storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a session through localStorage', () => {
    expect(loadSession()).toBeNull();
    saveSession(SAMPLE);
    expect(loadSession()).toEqual(SAMPLE);
  });

  it('clears the stored session', () => {
    saveSession(SAMPLE);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('returns null for corrupted storage rather than throwing', () => {
    window.localStorage.setItem('wise-bloom.session.v1', 'not-json');
    expect(loadSession()).toBeNull();
  });
});

describe('useSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('restores a persisted session on mount', async () => {
    saveSession(SAMPLE);
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.stored).toEqual(SAMPLE));
  });

  it('setStored(null) clears the session from storage', async () => {
    saveSession(SAMPLE);
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.stored).toEqual(SAMPLE));

    act(() => result.current.setStored(null));
    expect(loadSession()).toBeNull();
  });
});
