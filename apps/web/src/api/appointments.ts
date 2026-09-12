/**
 * Appointments API calls (docs/04-Architecture/56 §5 `/v1/appointments`,
 * docs/06-Modules/95). Scheduling records the appointment and returns the
 * timeline event it created; updating status records a visit's outcome. All
 * network goes through the shared `ApiClient` (51 BR-1).
 *
 * Status updates are a POST (not PATCH): the Apps Script transport exposes only
 * GET and POST (docs/04-Architecture/53 §4).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  AppointmentListResponse,
  ScheduleAppointmentRequest,
  ScheduleAppointmentResponse,
  UpdateAppointmentStatusRequest,
  UpdateAppointmentStatusResponse,
} from '@wise-bloom/api-contract';

export function scheduleAppointment(
  client: ApiClient,
  input: ScheduleAppointmentRequest,
  scope: FamilyScope = {},
): Promise<ScheduleAppointmentResponse> {
  return client.request<ScheduleAppointmentResponse>('/appointments', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function updateAppointmentStatus(
  client: ApiClient,
  input: UpdateAppointmentStatusRequest,
  scope: FamilyScope = {},
): Promise<UpdateAppointmentStatusResponse> {
  return client.request<UpdateAppointmentStatusResponse>('/appointments/status', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function listAppointments(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<AppointmentListResponse> {
  return client.request<AppointmentListResponse>('/appointments', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}
