/**
 * Content API calls (docs/04-Architecture/56 §5 `/v1/content`, docs/07-AI/101).
 * In v1 this fetches GA-driven week-by-week pregnancy knowledge (MS-1.6,
 * docs/06-Modules/82 FR-4): with no `week`, the backend returns the current week
 * derived from the mother's active pregnancy episode; an explicit `week` (1..40)
 * fetches that week for browsing. All network goes through the shared
 * `ApiClient` (51 BR-1); the content is served typed + sourced by the backend
 * and rendered through a content-type-aware component (51 §8).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type { ContentItemResponse } from '@wise-bloom/api-contract';

export interface WeekKnowledgeQuery {
  /** An explicit pregnancy week to fetch (1..40); omit for the GA-derived current week. */
  week?: number;
}

export function getWeekKnowledge(
  client: ApiClient,
  query: WeekKnowledgeQuery = {},
  scope: FamilyScope = {},
): Promise<ContentItemResponse> {
  return client.request<ContentItemResponse>('/content', {
    method: 'GET',
    query: {
      family_id: scope.familyId,
      ...(query.week !== undefined ? { week: String(query.week) } : {}),
    },
  });
}
