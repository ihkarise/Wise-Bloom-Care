/**
 * Appointments controller — schedule/record visits and list them
 * (docs/04-Architecture/56 §5 `/v1/appointments`, docs/06-Modules/85,
 * docs/20-Implementation/208 Task 1). Every access is family-scoped and
 * audited — an appointment is health-adjacent personal data (docs/05-Data/75
 * BR-1). The subject is the family's own maternal record (v1), enforced the
 * same way vitals/reports enforce it (rbac.assertMaternalSubject).
 */

import { ValidationError } from '../lib/validation';
import { AppointmentNotFoundError } from '../services/AppointmentsService';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asRecord, asString, queryParam } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AppointmentsService } from '../services/AppointmentsService';
import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type {
  AppointmentListResponse,
  CreateAppointmentResponse,
  UpdateAppointmentResponse,
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
  if (error instanceof AppointmentNotFoundError) {
    throw new ApiException('not_found', 404, error.message);
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
    ): { status: number; body: CreateAppointmentResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const subjectId = asString(body['subject_id'], 'subject_id');
      assertMaternalSubject(maternal, subjectId);

      const correlation = request.correlationId ? { correlationId: request.correlationId } : {};

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
        ...correlation,
      });

      return { status: 201, body: { event: result.event, appointment: result.appointment } };
    },

    'PATCH /v1/appointments': (
      request,
      actor,
    ): { status: number; body: UpdateAppointmentResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);

      let appointment;
      try {
        appointment = deps.appointments.updateStatus(
          asString(body['appt_id'], 'appt_id'),
          maternal.maternal_id,
          asString(body['status'], 'status'),
        );
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
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const items = deps.appointments.list(maternal.maternal_id);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Appointment',
        entityId: maternal.maternal_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },
  };
}
