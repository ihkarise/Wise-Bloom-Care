/**
 * Dashboard UI state (docs/04-Architecture/51 §6). Loads the aggregated read
 * model through `api/dashboard.ts` (51 BR-1) and exposes a calm loading/error
 * surface plus a `reload` for after a new vital/report is logged.
 */

import { useCallback, useEffect, useState } from 'react';

import { getDashboard } from '../api/dashboard';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { DashboardSummary } from '@wise-bloom/domain-types';

export interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDashboard(client: ApiClient | null): DashboardState {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError(null);
    getDashboard(client)
      .then((response) => setSummary(response.dashboard))
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error, reload: load };
}
