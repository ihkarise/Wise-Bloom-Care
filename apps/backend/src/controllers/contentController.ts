/**
 * Content controller — surfaces typed, sourced knowledge-base content
 * (docs/04-Architecture/56 §5 `/v1/content`, docs/07-AI/101). In v1 this serves
 * GA-driven week-by-week pregnancy knowledge (MS-1.6, docs/06-Modules/82 FR-4):
 * given the caller's active pregnancy episode, it returns the current week's
 * authored content (or an explicit `week` query param, 1..40, for browsing).
 *
 * Every access is authenticated, family-scoped, and audited (docs/05-Data/75
 * BR-1); it fails closed on any subject outside the caller's family
 * (docs/04-Architecture/52 §8). Content is served **only** through
 * ContentService's typed+sourced gate — untyped content is never returned
 * (docs/02-Research/28 BR-1/BR-2). The client never fabricates content
 * (docs/04-Architecture/51 §8).
 */

import { requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { queryParam, todayIsoDate } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';
import {
  WeekOutOfRangeError,
  type PregnancyKnowledgeService,
} from '../services/PregnancyKnowledgeService';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type { PregnancyService } from '../services/PregnancyService';
import type { ContentItemResponse } from '@wise-bloom/api-contract';

export interface ContentControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  pregnancy: PregnancyService;
  knowledge: PregnancyKnowledgeService;
  audit: AuditService;
}

export function createContentController(deps: ContentControllerDeps): Record<string, RouteHandler> {
  return {
    'GET /v1/content': (request, actor): { status: number; body: ContentItemResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);

      // Current gestational age (as of today) from the mother's active episode —
      // server-computed, never stored (docs/06-Modules/82 BR-1). Drives the
      // default week and gives the reader their week-in-pregnancy context.
      const activeEpisodes = deps.pregnancy
        .listEpisodes(maternal.maternal_id)
        .filter((episode) => episode.status === 'active');
      const currentEpisode = activeEpisodes[activeEpisodes.length - 1];
      const gestationalAge = currentEpisode
        ? deps.pregnancy.gestationalAge(currentEpisode, todayIsoDate())
        : null;

      // Which week: an explicit `week` query param (browsing 1..40), otherwise
      // the GA-derived current week. No GA and no explicit week → nothing to
      // surface yet (the reader hasn't set an LMP): a calm not-found.
      const weekParam = queryParam(request, 'week');
      let week: number;
      if (weekParam !== undefined) {
        const parsed = Number(weekParam);
        if (!Number.isInteger(parsed)) {
          throw new ApiException('validation_failed', 422, 'Week must be a whole number');
        }
        week = parsed;
      } else {
        const derived = deps.knowledge.weekForGestation(gestationalAge);
        if (derived === null) {
          throw new ApiException('not_found', 404, 'No pregnancy week available yet');
        }
        week = derived;
      }

      let resolved;
      try {
        resolved = deps.knowledge.getWeek(week);
      } catch (error) {
        if (error instanceof WeekOutOfRangeError) {
          throw new ApiException('validation_failed', 422, 'Week must be between 1 and 40');
        }
        throw error;
      }

      // Reading week knowledge is a health-data access → audited (docs/05-Data/75
      // BR-1). Metadata carries no PHI — no gestational age, no week, no content:
      // only the family scope, mirroring the medicines list read (75 BR-2).
      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'ContentItem',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return {
        status: 200,
        body: {
          content: resolved.content,
          title: resolved.title,
          body: resolved.body,
          week: resolved.week,
          gestational_age: gestationalAge,
        },
      };
    },
  };
}
