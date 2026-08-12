/**
 * Maternal / Pregnancy controller — the maternal record and its pregnancy
 * episodes (docs/04-Architecture/56 §5 `/v1/maternal`,
 * docs/20-Implementation/206 objective 6). Every health-data access here is
 * audited (docs/05-Data/75 BR-1) — MaternalRecord and PregnancyEpisode are
 * both Highly-sensitive (docs/05-Data/70).
 */

import { PregnancyValidationError, type PregnancyService } from '../services/PregnancyService';
import { requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asRecord, queryParam, todayIsoDate } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type {
  CreatePregnancyEpisodeRequest,
  MaternalResponse,
  PregnancyEpisodeListResponse,
  PregnancyEpisodeResponse,
} from '@wise-bloom/api-contract';
import type { BmiCategory, Parity } from '@wise-bloom/domain-types';

export interface MaternalControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  pregnancy: PregnancyService;
  audit: AuditService;
}

function parseCreateEpisodeBody(body: Record<string, unknown>): CreatePregnancyEpisodeRequest {
  return {
    ...(typeof body['lmp'] === 'string' ? { lmp: body['lmp'] } : {}),
    ...(typeof body['edd'] === 'string' ? { edd: body['edd'] } : {}),
    ...(typeof body['pre_pregnancy_bmi_cat'] === 'string'
      ? { pre_pregnancy_bmi_cat: body['pre_pregnancy_bmi_cat'] as BmiCategory }
      : {}),
    ...(typeof body['parity'] === 'string' ? { parity: body['parity'] as Parity } : {}),
  };
}

export function createMaternalController(
  deps: MaternalControllerDeps,
): Record<string, RouteHandler> {
  return {
    'GET /v1/maternal': (request, actor): { status: number; body: MaternalResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'MaternalRecord',
        entityId: maternal.maternal_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { maternal } };
    },

    'POST /v1/maternal/pregnancy-episodes': (
      request,
      actor,
    ): { status: number; body: PregnancyEpisodeResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const input = parseCreateEpisodeBody(asRecord(request.body));

      let episode;
      try {
        episode = deps.pregnancy.createEpisode(maternal.maternal_id, input);
      } catch (error) {
        if (error instanceof PregnancyValidationError) {
          throw new ApiException('validation_failed', 422, error.message);
        }
        throw error;
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'PregnancyEpisode',
        entityId: episode.episode_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return {
        status: 201,
        body: {
          episode,
          gestational_age: deps.pregnancy.gestationalAge(episode, todayIsoDate()),
        },
      };
    },

    'GET /v1/maternal/pregnancy-episodes': (
      request,
      actor,
    ): { status: number; body: PregnancyEpisodeListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const today = todayIsoDate();
      const items = deps.pregnancy.listEpisodes(maternal.maternal_id).map((episode) => ({
        episode,
        gestational_age: deps.pregnancy.gestationalAge(episode, today),
      }));

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'PregnancyEpisode',
        entityId: maternal.maternal_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },
  };
}
