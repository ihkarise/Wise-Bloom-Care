/**
 * LogoutButton — the one interactive control the authenticated shell needs
 * to exercise `POST /v1/auth/logout` (docs/04-Architecture/57 §7). Kept
 * separate from RegisterIsland/LoginIsland since it mounts on a different
 * page (`app.astro`) with different pre-conditions (requires a session).
 */
import { useState, type ReactElement } from 'react';

import { logout } from '../../api/auth';
import { withBase } from '../../lib/paths';
import { useAuthenticatedClient } from '../../state/session';

export interface LogoutButtonProps {
  apiBaseUrl: string;
}

export default function LogoutButton({ apiBaseUrl }: LogoutButtonProps): ReactElement | null {
  const { client, setStored, checked } = useAuthenticatedClient(apiBaseUrl);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!checked || !client) {
    return null;
  }

  async function handleClick(): Promise<void> {
    if (!client) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout(client);
    } finally {
      setStored(null);
      window.location.assign(withBase('/login'));
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={loggingOut}
      className="rounded-md border border-border px-3 py-1.5 text-small font-medium text-text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
    >
      {loggingOut ? 'Logging out…' : 'Log out'}
    </button>
  );
}
