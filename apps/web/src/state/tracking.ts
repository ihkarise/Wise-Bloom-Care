/**
 * Wellness Tracker UI state (docs/04-Architecture/51 §6). Loads the mother's
 * tracker preferences (plus read-only pregnancy-week context) and, per
 * tracker, its recorded history — always through `api/tracking.ts` (51 BR-1).
 * Mirrors `state/medicines.ts`: the loaded list is the single source of
 * truth; a caller reloads after an activate/deactivate/record rather than
 * mutating a local copy.
 */

import { useCallback, useEffect, useState } from 'react';

import { listTrackerEntries, listTrackerPreferences } from '../api/tracking';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { GestationalAgeView } from '@wise-bloom/api-contract';
import type { TrackerEntry, TrackerPreference } from '@wise-bloom/domain-types';

export interface TrackerPreferencesState {
  preferences: TrackerPreference[];
  /** Read-only, server-computed; `null` when no active pregnancy episode/LMP is known. */
  gestationalAge: GestationalAgeView | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the mother's tracker choices (active and inactive) plus pregnancy-week context. */
export function useTrackerPreferences(client: ApiClient | null): TrackerPreferencesState {
  const [preferences, setPreferences] = useState<TrackerPreference[]>([]);
  const [gestationalAge, setGestationalAge] = useState<GestationalAgeView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError(null);
    listTrackerPreferences(client)
      .then((response) => {
        setPreferences(response.items);
        setGestationalAge(response.gestational_age);
      })
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  return { preferences, gestationalAge, loading, error, reload: load };
}

export interface TrackerEntriesState {
  /** Newest first. */
  entries: TrackerEntry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  reload: () => void;
  loadMore: () => void;
}

/** Loads one tracker's recorded history, newest first, paginated (no charts — a plain list, 98 §5). */
export function useTrackerEntries(
  client: ApiClient | null,
  trackerKey: string,
): TrackerEntriesState {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    (pageCursor: string | undefined, append: boolean) => {
      if (!client) {
        return;
      }
      setLoading(true);
      setError(null);
      listTrackerEntries(client, trackerKey, pageCursor)
        .then((page) => {
          setEntries((prev) => (append ? [...prev, ...page.items] : page.items));
          setCursor(page.next_cursor);
        })
        .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
        .finally(() => setLoading(false));
    },
    [client, trackerKey],
  );

  useEffect(() => {
    setEntries([]);
    setCursor(undefined);
    fetchPage(undefined, false);
    // Re-runs only when the client or the tracker being viewed changes.
  }, [client, trackerKey]);

  return {
    entries,
    loading,
    error,
    hasMore: cursor !== undefined,
    reload: () => fetchPage(undefined, false),
    loadMore: () => fetchPage(cursor, true),
  };
}
