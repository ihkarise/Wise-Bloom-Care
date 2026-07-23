/**
 * Maternal / pregnancy-episode API calls (docs/04-Architecture/56 §5
 * `/v1/maternal`, docs/06-Modules/82). Entry is forgiving — every field on a
 * pregnancy episode is optional (P9).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  CreatePregnancyEpisodeRequest,
  MaternalResponse,
  PregnancyEpisodeListResponse,
  PregnancyEpisodeResponse,
} from '@wise-bloom/api-contract';

export function getMaternal(client: ApiClient, scope: FamilyScope = {}): Promise<MaternalResponse> {
  return client.request<MaternalResponse>('/maternal', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}

export function createPregnancyEpisode(
  client: ApiClient,
  input: CreatePregnancyEpisodeRequest,
  scope: FamilyScope = {},
): Promise<PregnancyEpisodeResponse> {
  return client.request<PregnancyEpisodeResponse>('/maternal/pregnancy-episodes', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function listPregnancyEpisodes(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<PregnancyEpisodeListResponse> {
  return client.request<PregnancyEpisodeListResponse>('/maternal/pregnancy-episodes', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}
