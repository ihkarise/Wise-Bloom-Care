/**
 * DashboardIsland — the home surface: at-a-glance status + metric tiles +
 * recent timeline (docs/06-Modules/81, docs/20-Implementation/207 MS-1.2).
 * Pure read: it renders the server-aggregated summary and never derives domain
 * facts itself (81 §1). Mobile-first, calm empty/loading states (docs/03-UX/41).
 */
import type { ReactElement } from 'react';

import { useAuthenticatedClient } from '../../state/session';
import { useDashboard } from '../../state/dashboard';
import RecentTimeline from './RecentTimeline';
import StatusCards from './StatusCards';

export interface DashboardIslandProps {
  apiBaseUrl: string;
}

export default function DashboardIsland({ apiBaseUrl }: DashboardIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const { summary, loading, error } = useDashboard(client);

  if (!checked) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
        >
          {error}
        </p>
      ) : null}

      {loading && !summary ? (
        <p aria-live="polite" className="text-small text-text-secondary">
          Loading your dashboard…
        </p>
      ) : null}

      {summary ? (
        <>
          <StatusCards summary={summary} />
          <RecentTimeline events={summary.recent_timeline} />
        </>
      ) : null}
    </div>
  );
}
