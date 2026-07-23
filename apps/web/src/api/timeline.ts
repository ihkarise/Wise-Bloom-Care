/**
 * Timeline API calls (docs/04-Architecture/56 §5, §3 cursor pagination;
 * docs/08-Timeline/110). Read-only — events are appended by the domain
 * modules that produce them.
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type { TimelineResponse } from '@wise-bloom/api-contract';

export function getTimeline(
  client: ApiClient,
  options: FamilyScope & { cursor?: string } = {},
): Promise<TimelineResponse> {
  return client.request<TimelineResponse>('/timeline', {
    method: 'GET',
    query: { family_id: options.familyId, cursor: options.cursor },
  });
}
