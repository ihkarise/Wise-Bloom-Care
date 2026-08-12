/**
 * Timeline UI state (docs/04-Architecture/51 §6 "per-feature stores").
 * Server state (the event list) lives here as a small React hook; islands
 * consume it rather than re-implementing fetch/pagination logic themselves
 * (51 BR-1: all calls still go through `api/timeline.ts`).
 */

import { useCallback, useEffect, useState } from 'react';

import { getTimeline } from '../api/timeline';

import type { ApiClient } from '../api/client';
import type { Event } from '@wise-bloom/domain-types';

export interface TimelineState {
  items: Event[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function useTimeline(client: ApiClient | null): TimelineState {
  const [items, setItems] = useState<Event[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (nextCursor: string | undefined, replace: boolean) => {
      if (!client) {
        return;
      }
      setLoading(true);
      setError(null);
      getTimeline(client, { cursor: nextCursor })
        .then((page) => {
          setItems((previous) => (replace ? page.items : [...previous, ...page.items]));
          setCursor(page.next_cursor);
          setHasMore(Boolean(page.next_cursor));
        })
        .catch(() => {
          // Calm, non-alarming failure — the timeline shows what it has and lets the user retry.
          setError('We couldn’t load your timeline right now. Please try again.');
        })
        .finally(() => setLoading(false));
    },
    [client],
  );

  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    setHasMore(true);
    load(undefined, true);
  }, [client, load]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      load(cursor, false);
    }
  }, [cursor, hasMore, loading, load]);

  return { items, loading, error, hasMore, loadMore };
}
