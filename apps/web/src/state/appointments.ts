/**
 * Appointments UI state (docs/04-Architecture/51 §6). Loads the family's
 * appointments for display, always through `api/appointments.ts` (51 BR-1).
 * The list is the single source of truth; the island re-loads it after a
 * schedule or status change rather than mutating a local copy.
 */

import { useCallback, useEffect, useState } from 'react';

import { listAppointments } from '../api/appointments';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { Appointment } from '@wise-bloom/domain-types';

export interface AppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the family's appointments, newest schedule last (chronological, as the API returns). */
export function useAppointments(client: ApiClient | null): AppointmentsState {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError(null);
    listAppointments(client)
      .then((page) => setAppointments(page.items))
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  return { appointments, loading, error, reload: load };
}
