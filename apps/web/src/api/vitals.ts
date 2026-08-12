/**
 * Vitals API calls (docs/04-Architecture/56 §5 `/v1/vitals`, docs/06-Modules/83).
 * Logging returns the created record(s) + a surfacing-only trend; the series
 * feeds the charts. All network goes through the shared `ApiClient` (51 BR-1).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  CreateBloodPressureRequest,
  CreateBloodPressureResponse,
  CreateVitalRequest,
  CreateVitalResponse,
  VitalSeriesResponse,
} from '@wise-bloom/api-contract';
import type { VitalContext, VitalType } from '@wise-bloom/domain-types';

export function logVital(
  client: ApiClient,
  input: CreateVitalRequest,
  scope: FamilyScope = {},
): Promise<CreateVitalResponse> {
  return client.request<CreateVitalResponse>('/vitals', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function logBloodPressure(
  client: ApiClient,
  input: CreateBloodPressureRequest,
  scope: FamilyScope = {},
): Promise<CreateBloodPressureResponse> {
  return client.request<CreateBloodPressureResponse>('/vitals', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function getVitalSeries(
  client: ApiClient,
  options: FamilyScope & { type?: VitalType; context?: VitalContext } = {},
): Promise<VitalSeriesResponse> {
  return client.request<VitalSeriesResponse>('/vitals', {
    method: 'GET',
    query: { family_id: options.familyId, type: options.type, context: options.context },
  });
}
