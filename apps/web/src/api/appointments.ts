/**
 * Appointments API calls (docs/04-Architecture/56 §5 `/v1/appointments`,
 * docs/06-Modules/85). Scheduling a visit records it on the continuous
 * timeline; the list drives the upcoming-visits view. All network goes through
 * the shared `ApiClient` (51 BR-1).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  AppointmentListResponse,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
} from '@wise-bloom/api-contract';

export function scheduleAppointment(
  client: ApiClient,
  input: CreateAppointmentRequest,
  scope: FamilyScope = {},
): Promise<CreateAppointmentResponse> {
  return client.request<CreateAppointmentResponse>('/appointments', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function getAppointments(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<AppointmentListResponse> {
  return client.request<AppointmentListResponse>('/appointments', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}

export function updateAppointment(
  client: ApiClient,
  input: UpdateAppointmentRequest,
  scope: FamilyScope = {},
): Promise<UpdateAppointmentResponse> {
  return client.request<UpdateAppointmentResponse>('/appointments', {
    method: 'PATCH',
    body: input,
    query: { family_id: scope.familyId },
  });
}
