/**
 * Medicines UI state (docs/04-Architecture/51 §6). Loads the mother's medicines
 * for display, always through `api/medicines.ts` (51 BR-1). The list is the
 * single source of truth; the island re-loads it after an add, edit, or stop
 * rather than mutating a local copy.
 */

import { useCallback, useEffect, useState } from 'react';

import { listMedicines } from '../api/medicines';
import { friendlyErrorMessage } from '../lib/errors';

import type { ApiClient } from '../api/client';
import type { Medicine } from '@wise-bloom/domain-types';

export interface MedicinesState {
  medicines: Medicine[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the mother's medicines (active first, then stopped, as the API returns). */
export function useMedicines(client: ApiClient | null): MedicinesState {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError(null);
    listMedicines(client)
      .then((page) => setMedicines(page.items))
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  return { medicines, loading, error, reload: load };
}
