/**
 * Family controller — the family record graph (docs/04-Architecture/56 §5
 * `/v1/family`). Read-only in Sprint 01: the family is created once, at
 * registration (`authController`); caregiver grant/revoke extends this
 * controller in a later sprint (docs/06-Modules/96) without changing this
 * route's contract.
 */

import { resolveScopedFamily } from './rbac';
import { queryParam } from './requestHelpers';
import { requireActor, type RouteHandler } from './router';

import type { FamilyService } from '../services/FamilyService';
import type { FamilyResponse } from '@wise-bloom/api-contract';

export interface FamilyControllerDeps {
  family: FamilyService;
}

export function createFamilyController(deps: FamilyControllerDeps): Record<string, RouteHandler> {
  return {
    'GET /v1/family': (request, actor): { status: number; body: FamilyResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      return { status: 200, body: { family } };
    },
  };
}
