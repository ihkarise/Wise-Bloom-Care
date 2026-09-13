/**
 * Medicines controller — record the medicines a mother is taking, edit or stop
 * them, and list them (docs/04-Architecture/56 §5 `/v1/medicines`,
 * docs/06-Modules/85, docs/20-Implementation/208). Every access is family-scoped
 * and audited (docs/05-Data/75 BR-1); the app records, it never prescribes
 * (docs/06-Modules/85 BR-1).
 *
 * RBAC detail (docs/09-Security/123 §5): a Medicine carries `subject_id` but no
 * `family_id`, so scope is resolved caller → authorised family → that family's
 * maternal record → `maternal_id`, and every write/read requires the medicine's
 * `subject_id` to equal that `maternal_id`. A foreign subject or a medicine in
 * another family is refused `forbidden` (fail closed, docs/04-Architecture/52 §8).
 *
 * Writes are POSTs because the Apps Script transport exposes only GET and POST
 * (docs/04-Architecture/53 §4): `POST /v1/medicines` adds, `POST
 * /v1/medicines/update` edits or stops an existing medicine.
 *
 * Audit metadata carries no PHI — never the medicine's name or schedule, only
 * the non-identifying `active` flag (docs/05-Data/75 BR-1/BR-2, docs/06-Modules/95 BR-5).
 */

import { ValidationError } from '../lib/validation';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asOptionalString, asRecord, asString, queryParam } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import { MedicineNotFoundError, type MedicinesService } from '../services/MedicinesService';
import type {
  AddMedicineResponse,
  MedicineListResponse,
  UpdateMedicineResponse,
} from '@wise-bloom/api-contract';

export interface MedicinesControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  medicines: MedicinesService;
  audit: AuditService;
}

function mapValidationError(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new ApiException('validation_failed', 422, error.message);
  }
  throw error;
}

/** Reads an optional boolean body field, or fails `validation_failed` when present but not a boolean. */
function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new ApiException('validation_failed', 422, `Invalid field: ${field}`);
  }
  return value;
}

export function createMedicinesController(
  deps: MedicinesControllerDeps,
): Record<string, RouteHandler> {
  return {
    'POST /v1/medicines': (request, actor): { status: number; body: AddMedicineResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      assertMaternalSubject(maternal, asString(body['subject_id'], 'subject_id'));

      let result;
      try {
        result = deps.medicines.add({
          familyId: family.family_id,
          subjectId: maternal.maternal_id,
          createdBy: me.userId,
          name: asString(body['name'], 'name'),
          schedule: asString(body['schedule'], 'schedule'),
          ...(optionalBoolean(body['active'], 'active') !== undefined
            ? { active: body['active'] as boolean }
            : {}),
        });
      } catch (error) {
        mapValidationError(error);
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'Medicine',
        entityId: result.medicine.med_id,
        familyId: family.family_id,
        // No PHI: never the medicine name/schedule — only the non-identifying active flag.
        meta: { active: result.medicine.active },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 201, body: { event: result.event, medicine: result.medicine } };
    },

    'POST /v1/medicines/update': (
      request,
      actor,
    ): { status: number; body: UpdateMedicineResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const medId = asString(body['med_id'], 'med_id');

      // Family-scope the medicine before touching it: a caller can never edit a
      // medicine outside their family (fail closed, docs/04-Architecture/52 §8).
      let existing;
      try {
        existing = deps.medicines.get(medId);
      } catch (error) {
        if (error instanceof MedicineNotFoundError) {
          throw new ApiException('not_found', 404, 'Medicine not found');
        }
        throw error;
      }
      if (existing.subject_id !== maternal.maternal_id) {
        throw new ApiException('forbidden', 403, 'Medicine is not in this family');
      }

      let medicine;
      try {
        medicine = deps.medicines.update({
          medId,
          ...(asOptionalString(body['name'], 'name') !== undefined
            ? { name: body['name'] as string }
            : {}),
          ...(asOptionalString(body['schedule'], 'schedule') !== undefined
            ? { schedule: body['schedule'] as string }
            : {}),
          ...(optionalBoolean(body['active'], 'active') !== undefined
            ? { active: body['active'] as boolean }
            : {}),
        });
      } catch (error) {
        mapValidationError(error);
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'update',
        entity: 'Medicine',
        entityId: medicine.med_id,
        familyId: family.family_id,
        meta: { active: medicine.active },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { medicine } };
    },

    'GET /v1/medicines': (request, actor): { status: number; body: MedicineListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const items = deps.medicines.list(maternal.maternal_id);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Medicine',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },
  };
}
