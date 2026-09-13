/**
 * Medicines API calls (docs/04-Architecture/56 §5 `/v1/medicines`,
 * docs/06-Modules/85). Adding a medicine records it and returns the timeline
 * event it created; updating edits a medicine or stops/restarts it. All network
 * goes through the shared `ApiClient` (51 BR-1).
 *
 * Updates are a POST (not PATCH): the Apps Script transport exposes only GET and
 * POST (docs/04-Architecture/53 §4).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  AddMedicineRequest,
  AddMedicineResponse,
  MedicineListResponse,
  UpdateMedicineRequest,
  UpdateMedicineResponse,
} from '@wise-bloom/api-contract';

export function addMedicine(
  client: ApiClient,
  input: AddMedicineRequest,
  scope: FamilyScope = {},
): Promise<AddMedicineResponse> {
  return client.request<AddMedicineResponse>('/medicines', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function updateMedicine(
  client: ApiClient,
  input: UpdateMedicineRequest,
  scope: FamilyScope = {},
): Promise<UpdateMedicineResponse> {
  return client.request<UpdateMedicineResponse>('/medicines/update', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function listMedicines(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<MedicineListResponse> {
  return client.request<MedicineListResponse>('/medicines', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}
