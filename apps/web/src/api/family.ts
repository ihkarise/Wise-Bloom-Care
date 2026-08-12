/**
 * Family API calls (docs/04-Architecture/56 §5 `/v1/family`). Read-only in
 * Sprint 01 — the family is created once, at registration.
 */

import type { ApiClient } from './client';
import type { FamilyResponse } from '@wise-bloom/api-contract';

export interface FamilyScope {
  /** Omit to resolve the caller's own family (docs/09-Security/123 §5). */
  familyId?: string;
}

export function getFamily(client: ApiClient, scope: FamilyScope = {}): Promise<FamilyResponse> {
  return client.request<FamilyResponse>('/family', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}
