/**
 * Timeline controller — the continuous, paginated event stream
 * (docs/04-Architecture/56 §5 `GET /v1/timeline`, docs/08-Timeline/110).
 * Read-only: events are appended by the domain services that produce them
 * (a later sprint's VitalsService etc. — docs/20-Implementation/203 §4);
 * Sprint 01 ships the read side and the append-only guarantee it depends on.
 */

import { resolveScopedFamily } from './rbac';
import { queryParam } from './requestHelpers';
import { requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { TimelineService } from '../services/TimelineService';
import type { TimelineResponse } from '@wise-bloom/api-contract';

export interface TimelineControllerDeps {
  family: FamilyService;
  timeline: TimelineService;
  audit: AuditService;
}

export function createTimelineController(
  deps: TimelineControllerDeps,
): Record<string, RouteHandler> {
  return {
    'GET /v1/timeline': (request, actor): { status: number; body: TimelineResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const cursor = queryParam(request, 'cursor');
      const page = deps.timeline.list(family.family_id, cursor ? { cursor } : {});

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Event',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return {
        status: 200,
        body: { items: page.items, ...(page.nextCursor ? { next_cursor: page.nextCursor } : {}) },
      };
    },
  };
}
