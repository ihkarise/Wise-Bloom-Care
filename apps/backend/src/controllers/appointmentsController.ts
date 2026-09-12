/**
 * Appointments controller — schedule/record visits, update a visit's outcome,
 * and list appointments (docs/04-Architecture/56 §5 `/v1/appointments`,
 * docs/06-Modules/95, docs/20-Implementation/208). Every access is family-scoped
 * and audited (docs/05-Data/75 BR-1).
 *
 * Writes are POSTs because the Apps Script transport exposes only GET and POST
 * (docs/04-Architecture/53 §4) — there is no PATCH on GAS. Scheduling and
 * recording an outcome are therefore two distinct POST routes rather than a
 * PATCH: `POST /v1/appointments` creates, `POST /v1/appointments/status` moves
 * an existing appointment's status.
 */

import { ValidationError } from '../lib/validation';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asRecord, asString, queryParam } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import {
  AppointmentNotFoundError,
  isAppointmentStatus,
  type AppointmentsService,
} from '../services/AppointmentsService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type {
  AppointmentListResponse,
  ScheduleAppointmentResponse,
  UpdateAppointmentStatusResponse,
} from '@wise-bloom/api-contract';
import type { AppointmentStatus } from '@wise-bloom/domain-types';

export interface AppointmentsControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  appointments: AppointmentsService;
  audit: AuditService;
}

function mapValidationError(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new ApiException('validation_failed', 422, error.message);
  }
  throw error;
}

export function createAppointmentsController(
  deps: AppointmentsControllerDeps,
): Record<string, RouteHandler> {
  return {
    'POST /v1/appointments': (
      request,
      actor,
    ): { status: number; body: ScheduleAppointmentResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      assertMaternalSubject(maternal, asString(body['subject_id'], 'subject_id'));

      let result;
      try {
        result = deps.appointments.schedule({
          familyId: family.family_id,
          subjectId: maternal.maternal_id,
          createdBy: me.userId,
          scheduledAt: asString(body['scheduled_at'], 'scheduled_at'),
          ...(typeof body['status'] === 'string'
            ? { status: body['status'] as AppointmentStatus }
            : {}),
        });
      } catch (error) {
        mapValidationError(error);
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'Appointment',
        entityId: result.appointment.appt_id,
        familyId: family.family_id,
        meta: { status: result.appointment.status },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 201, body: { event: result.event, appointment: result.appointment } };
    },

    'POST /v1/appointments/status': (
      request,
      actor,
    ): { status: number; body: UpdateAppointmentStatusResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      // A maternal record must exist for this family before its appointments are touched.
      requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const apptId = asString(body['appt_id'], 'appt_id');
      const status = asString(body['status'], 'status');
      if (!isAppointmentStatus(status)) {
        throw new ApiException(
          'validation_failed',
          422,
          `Unsupported appointment status: ${status}`,
        );
      }

      // Family-scope the appointment before touching it: a caller can never
      // change an appointment outside their family (fail closed, 52 §8).
      let existing;
      try {
        existing = deps.appointments.get(apptId);
      } catch (error) {
        if (error instanceof AppointmentNotFoundError) {
          throw new ApiException('not_found', 404, 'Appointment not found');
        }
        throw error;
      }
      if (existing.family_id !== family.family_id) {
        throw new ApiException('forbidden', 403, 'Appointment is not in this family');
      }

      let appointment;
      try {
        appointment = deps.appointments.updateStatus({ apptId, status });
      } catch (error) {
        mapValidationError(error);
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'update',
        entity: 'Appointment',
        entityId: appointment.appt_id,
        familyId: family.family_id,
        meta: { status: appointment.status },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { appointment } };
    },

    'GET /v1/appointments': (request, actor): { status: number; body: AppointmentListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      requireFamilyMaternal(deps.maternal, family.family_id);
      const items = deps.appointments.list(family.family_id);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Appointment',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },
  };
}
