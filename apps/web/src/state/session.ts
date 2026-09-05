/**
 * Client-side session state (docs/04-Architecture/51 §6, docs/09-Security/122
 * §5 "Storage (client)"). Persists the bearer token and public user/session
 * shape so islands can restore an authenticated `ApiClient` across page
 * loads — Astro pages are static shells; the session lives entirely in the
 * browser (`localStorage`), never in this project's absent server-side
 * session store (no PHI here, only the opaque bearer credential — 122 BR-3).
 *
 * Known trade-off (documented in the Sprint 01 completion report):
 * `localStorage` is readable by any script on the page, unlike an httpOnly
 * cookie. A GAS web app has no straightforward way to set cross-origin
 * httpOnly cookies for a statically-hosted SPA frontend, so this is the
 * pragmatic choice for a bearer-token architecture (docs/ADR/ADR-004) —
 * mitigated by the short access-TTL + revocable sessions already in place
 * (docs/09-Security/122 §4, §6).
 */

import { useEffect, useMemo, useState } from 'react';

import { ApiClient } from '../api/client';
import { withBase } from '../lib/paths';

import type { AuthSession, PublicUser } from '@wise-bloom/api-contract';

const STORAGE_KEY = 'wise-bloom.session.v1';

export interface StoredSession {
  user: PublicUser;
  session: AuthSession;
}

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export function saveSession(value: StoredSession): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function loadSession(): StoredSession | null {
  if (!hasWindow()) {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Reactive session state for React islands; re-reads `localStorage` on mount (client-only). */
export function useSession(): {
  stored: StoredSession | null;
  /** False until the initial `localStorage` read has happened — avoids a false "logged out" flash. */
  checked: boolean;
  setStored: (value: StoredSession | null) => void;
} {
  const [stored, setStoredState] = useState<StoredSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setStoredState(loadSession());
    setChecked(true);
  }, []);

  function setStored(value: StoredSession | null): void {
    if (value) {
      saveSession(value);
    } else {
      clearSession();
    }
    setStoredState(value);
  }

  return { stored, checked, setStored };
}

/**
 * The common "this island needs an authenticated session" pattern (docs/04-Architecture/57):
 * redirects to `/login` once it's confirmed there is no session, and otherwise
 * returns a ready-to-use `ApiClient` carrying the bearer token.
 */
export function useAuthenticatedClient(apiBaseUrl: string): {
  client: ApiClient | null;
  stored: StoredSession | null;
  checked: boolean;
  setStored: (value: StoredSession | null) => void;
} {
  const { stored, checked, setStored } = useSession();

  useEffect(() => {
    if (checked && !stored && hasWindow()) {
      window.location.assign(withBase('/login'));
    }
  }, [checked, stored]);

  const client = useMemo(() => {
    if (!stored) {
      return null;
    }
    return new ApiClient({ baseUrl: apiBaseUrl, token: stored.session.token });
  }, [apiBaseUrl, stored]);

  return { client, stored, checked, setStored };
}
