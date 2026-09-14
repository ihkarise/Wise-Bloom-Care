/**
 * Week-by-week knowledge UI state (docs/04-Architecture/51 §6, MS-1.6). Loads
 * the current pregnancy week's content through `api/content.ts` (51 BR-1), and
 * lets the reader browse to another week. A `not_found` from the backend means
 * there is no active pregnancy episode / gestational age yet (the reader hasn't
 * set an LMP) — that is a calm empty state, not an error.
 */

import { useCallback, useEffect, useState } from 'react';

import { getWeekKnowledge } from '../api/content';
import { ApiRequestError } from '../api/client';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { ContentItemResponse } from '@wise-bloom/api-contract';

export interface WeekKnowledgeState {
  data: ContentItemResponse | null;
  loading: boolean;
  error: string | null;
  /** True when there is no pregnancy week to show yet (no active episode / unknown LMP). */
  notAvailable: boolean;
  /** Reload the current selection (the GA-derived week, or the last week browsed to). */
  reload: () => void;
  /** Fetch a specific week (1..40). */
  goToWeek: (week: number) => void;
}

/** Loads week-by-week knowledge; defaults to the mother's current (GA-derived) week. */
export function useWeekKnowledge(client: ApiClient | null): WeekKnowledgeState {
  const [data, setData] = useState<ContentItemResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  // undefined → the GA-derived current week; a number → an explicit browsed week.
  const [week, setWeek] = useState<number | undefined>(undefined);

  const load = useCallback(
    (target: number | undefined) => {
      if (!client) {
        return;
      }
      setLoading(true);
      setError(null);
      setNotAvailable(false);
      getWeekKnowledge(client, target === undefined ? {} : { week: target })
        .then((response) => setData(response))
        .catch((caught: unknown) => {
          if (caught instanceof ApiRequestError && caught.envelope.error.code === 'not_found') {
            setData(null);
            setNotAvailable(true);
            return;
          }
          setError(friendlyErrorMessage(caught));
        })
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    load(week);
  }, [load, week]);

  return {
    data,
    loading,
    error,
    notAvailable,
    reload: useCallback(() => load(week), [load, week]),
    goToWeek: useCallback((next: number) => setWeek(next), []),
  };
}
