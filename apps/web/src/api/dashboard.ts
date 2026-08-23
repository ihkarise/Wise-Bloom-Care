/**
 * Dashboard API call (docs/04-Architecture/56 §5 `/v1/dashboard`,
 * docs/06-Modules/81). Read-only aggregation; the client never re-derives it.
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type { DashboardResponse } from '@wise-bloom/api-contract';

export function getDashboard(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<DashboardResponse> {
  return client.request<DashboardResponse>('/dashboard', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}
