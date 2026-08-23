/**
 * Dashboard controller — the aggregated home read model
 * (docs/04-Architecture/56 §5 `/v1/dashboard`, docs/06-Modules/81). Read-only
 * aggregation across services; family-scoped and audited. The dashboard writes
 * no domain data (81 §1).
 */

import { resolveScopedFamily } from './rbac';
import { queryParam, todayIsoDate } from './requestHelpers';
import { requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { DashboardService } from '../services/DashboardService';
import type { FamilyService } from '../services/FamilyService';
import type { DashboardResponse } from '@wise-bloom/api-contract';

export interface DashboardControllerDeps {
  family: FamilyService;
  dashboard: DashboardService;
  audit: AuditService;
}

export function createDashboardController(
  deps: DashboardControllerDeps,
): Record<string, RouteHandler> {
  return {
    'GET /v1/dashboard': (request, actor): { status: number; body: DashboardResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const dashboard = deps.dashboard.build(family.family_id, todayIsoDate());

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Dashboard',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { dashboard } };
    },
  };
}
