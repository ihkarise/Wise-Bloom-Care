/**
 * Vitals controller — log a vital and read a vital series
 * (docs/04-Architecture/56 §5 `/v1/vitals`, docs/06-Modules/83,
 * docs/20-Implementation/207). Every access is family-scoped and audited —
 * vitals are Highly-sensitive health data (docs/05-Data/70, 75 BR-1).
 *
 * `POST /v1/vitals` accepts a discriminated body: a paired blood-pressure
 * reading (`type: 'bp'` with systolic/diastolic → two Vital rows, one event)
 * or a single-value vital (weight/blood_sugar). Both return the created
 * event, record(s), and a surfacing-only trend (never diagnostic, 83 BR-1).
 */

import { ValidationError } from '../lib/validation';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asNumber, asRecord, asString, queryParam } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type { VitalsService } from '../services/VitalsService';
import type {
  CreateBloodPressureResponse,
  CreateVitalResponse,
  VitalSeriesResponse,
} from '@wise-bloom/api-contract';
import type { VitalContext, VitalType } from '@wise-bloom/domain-types';

export interface VitalsControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  vitals: VitalsService;
  audit: AuditService;
}

const SINGLE_VITAL_TYPES: readonly VitalType[] = ['weight', 'blood_sugar'];

function mapValidationError(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new ApiException('validation_failed', 422, error.message);
  }
  throw error;
}

export function createVitalsController(deps: VitalsControllerDeps): Record<string, RouteHandler> {
  return {
    'POST /v1/vitals': (
      request,
      actor,
    ): { status: number; body: CreateVitalResponse | CreateBloodPressureResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const subjectId = asString(body['subject_id'], 'subject_id');
      assertMaternalSubject(maternal, subjectId);

      const correlation = request.correlationId ? { correlationId: request.correlationId } : {};
      const type = asString(body['type'], 'type');

      if (type === 'bp') {
        let result;
        try {
          result = deps.vitals.logBloodPressure({
            familyId: family.family_id,
            subjectId: maternal.maternal_id,
            createdBy: me.userId,
            systolic: asNumber(body['systolic'], 'systolic'),
            diastolic: asNumber(body['diastolic'], 'diastolic'),
            ...(typeof body['unit'] === 'string' ? { unit: body['unit'] } : {}),
            measuredAt: asString(body['measured_at'], 'measured_at'),
          });
        } catch (error) {
          mapValidationError(error);
        }

        deps.audit.record({
          actorUserId: me.userId,
          actorRole: me.role,
          action: 'create',
          entity: 'Vital',
          entityId: result.event.event_id,
          familyId: family.family_id,
          meta: { vital_type: 'bp' },
          ...correlation,
        });

        return {
          status: 201,
          body: {
            reading: 'bp',
            event: result.event,
            vitals: result.vitals,
            trend: result.trend,
          },
        };
      }

      if (!SINGLE_VITAL_TYPES.includes(type as VitalType)) {
        throw new ApiException('validation_failed', 422, `Unsupported vital type: ${type}`);
      }

      let result;
      try {
        result = deps.vitals.logVital({
          familyId: family.family_id,
          subjectId: maternal.maternal_id,
          createdBy: me.userId,
          type: type as Exclude<VitalType, 'bp'>,
          value: asNumber(body['value'], 'value'),
          ...(typeof body['unit'] === 'string' ? { unit: body['unit'] } : {}),
          ...(typeof body['context'] === 'string'
            ? { context: body['context'] as VitalContext }
            : {}),
          measuredAt: asString(body['measured_at'], 'measured_at'),
        });
      } catch (error) {
        mapValidationError(error);
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'Vital',
        entityId: result.vital.vital_id,
        familyId: family.family_id,
        meta: { vital_type: type },
        ...correlation,
      });

      return {
        status: 201,
        body: { reading: 'single', event: result.event, vital: result.vital, trend: result.trend },
      };
    },

    'GET /v1/vitals': (request, actor): { status: number; body: VitalSeriesResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);

      const type = queryParam(request, 'type') as VitalType | undefined;
      const context = queryParam(request, 'context') as VitalContext | undefined;
      const items = deps.vitals.listSeries(maternal.maternal_id, type, context);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Vital',
        entityId: maternal.maternal_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },
  };
}
