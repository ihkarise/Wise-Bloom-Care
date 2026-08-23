/**
 * Vitals UI state (docs/04-Architecture/51 §6). Loads a vital series for
 * charting and wraps logging, always through `api/vitals.ts` (51 BR-1). Trends
 * are never computed here — they are read from the server response, which is
 * the single source of truth for surfacing-only trends (51 BR-3, 83 BR-1).
 */

import { useCallback, useEffect, useState } from 'react';

import { getVitalSeries } from '../api/vitals';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { Vital, VitalContext, VitalType } from '@wise-bloom/domain-types';

export interface VitalSeriesState {
  vitals: Vital[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the owned series for one vital type (optionally a BP component context). */
export function useVitalSeries(
  client: ApiClient | null,
  type: VitalType,
  context?: VitalContext,
): VitalSeriesState {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError(null);
    getVitalSeries(client, { type, ...(context ? { context } : {}) })
      .then((page) => setVitals(page.items))
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [client, type, context]);

  useEffect(() => {
    load();
  }, [load]);

  return { vitals, loading, error, reload: load };
}
