/**
 * Personal Wellness Tracker API calls (docs/04-Architecture/56 §5
 * `/v1/tracking/*`, docs/06-Modules/98). Activating/deactivating a tracker and
 * recording an observation are both POSTs (not PATCH): the Apps Script
 * transport exposes only GET and POST (docs/04-Architecture/53 §4). All
 * network goes through the shared `ApiClient` (51 BR-1).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  AddTrackerEntryRequest,
  AddTrackerEntryResponse,
  SetTrackerPreferenceRequest,
  SetTrackerPreferenceResponse,
  TrackerEntryListResponse,
  TrackerPreferenceListResponse,
} from '@wise-bloom/api-contract';

export function listTrackerPreferences(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<TrackerPreferenceListResponse> {
  return client.request<TrackerPreferenceListResponse>('/tracking/preferences', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}

export function setTrackerPreference(
  client: ApiClient,
  input: SetTrackerPreferenceRequest,
  scope: FamilyScope = {},
): Promise<SetTrackerPreferenceResponse> {
  return client.request<SetTrackerPreferenceResponse>('/tracking/preferences', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function listTrackerEntries(
  client: ApiClient,
  trackerKey: string,
  cursor?: string,
  scope: FamilyScope = {},
): Promise<TrackerEntryListResponse> {
  return client.request<TrackerEntryListResponse>('/tracking/entries', {
    method: 'GET',
    query: { tracker_key: trackerKey, cursor, family_id: scope.familyId },
  });
}

export function addTrackerEntry(
  client: ApiClient,
  input: AddTrackerEntryRequest,
  scope: FamilyScope = {},
): Promise<AddTrackerEntryResponse> {
  return client.request<AddTrackerEntryResponse>('/tracking/entries', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}
