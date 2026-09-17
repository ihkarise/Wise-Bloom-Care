/**
 * Personal Wellness Tracker controller (docs/04-Architecture/56 §5
 * `/v1/tracking/*`, docs/06-Modules/98, `ADR-007`). Every access is
 * family-scoped and audited (docs/05-Data/75 BR-1); this module records what
 * a mother chooses to watch — it never diagnoses, interprets, or alerts
 * (98 §3).
 *
 * RBAC detail (docs/09-Security/123 §5), identical to Medicines/Vitals: a
 * `TrackerPreference`/`TrackerEntry` carries `subject_id` but no `family_id`,
 * so scope is resolved caller → authorised family → that family's maternal
 * record → `maternal_id`, and every write requires the target `subject_id` to
 * equal that `maternal_id`. A foreign subject is refused `forbidden` (fail
 * closed, docs/04-Architecture/52 §8).
 *
 * Writes are POSTs because the Apps Script transport exposes only GET and
 * POST (docs/04-Architecture/53 §4).
 *
 * Audit metadata (98 §14, BR-6, ratified Phase 1 D-2): a preference write
 * carries only `{ active: boolean }` — never the tracker's name/key. An entry
 * write carries no content-bearing metadata at all — never the tracker key,
 * never the recorded value, never free text.
 *
 * `TrackerEntry` never touches `TimelineService` — no shared `Event` row is
 * ever created here (`ADR-007`, Accepted).
 */

import { ValidationError } from '../lib/validation';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asOptionalString, asRecord, asString, queryParam, todayIsoDate } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import type { PregnancyService } from '../services/PregnancyService';
import type { TrackingService } from '../services/TrackingService';
import type {
  AddTrackerEntryResponse,
  SetTrackerPreferenceResponse,
  TrackerEntryListResponse,
  TrackerPreferenceListResponse,
} from '@wise-bloom/api-contract';

export interface TrackingControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  pregnancy: PregnancyService;
  tracking: TrackingService;
  audit: AuditService;
}

function mapValidationError(error: unknown): never {
  if (error instanceof ValidationError) {
    throw new ApiException('validation_failed', 422, error.message);
  }
  throw error;
}

/** Required boolean body field (mirrors medicinesController's `optionalBoolean`, but required). */
function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ApiException('validation_failed', 422, `Missing or invalid field: ${field}`);
  }
  return value;
}

export function createTrackingController(
  deps: TrackingControllerDeps,
): Record<string, RouteHandler> {
  return {
    'GET /v1/tracking/preferences': (
      request,
      actor,
    ): { status: number; body: TrackerPreferenceListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);

      const items = deps.tracking.listPreferences(maternal.maternal_id);

      // Read-only pregnancy-week context, exactly the contentController pattern:
      // never recomputed here, never persisted (docs/06-Modules/98 §11).
      const activeEpisodes = deps.pregnancy
        .listEpisodes(maternal.maternal_id)
        .filter((episode) => episode.status === 'active');
      const currentEpisode = activeEpisodes[activeEpisodes.length - 1];
      const gestationalAge = currentEpisode
        ? deps.pregnancy.gestationalAge(currentEpisode, todayIsoDate())
        : null;

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'TrackerPreference',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items, gestational_age: gestationalAge } };
    },

    'POST /v1/tracking/preferences': (
      request,
      actor,
    ): { status: number; body: SetTrackerPreferenceResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const subjectId = asString(body['subject_id'], 'subject_id');
      assertMaternalSubject(maternal, subjectId);

      let preference;
      try {
        preference = deps.tracking.setPreference({
          subjectId: maternal.maternal_id,
          trackerKey: asString(body['tracker_key'], 'tracker_key'),
          active: requiredBoolean(body['active'], 'active'),
        });
      } catch (error) {
        mapValidationError(error);
      }

      // No PHI: never the tracker's key/name — only the non-identifying active flag (98 BR-6).
      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'update',
        entity: 'TrackerPreference',
        entityId: preference.tracker_pref_id,
        familyId: family.family_id,
        meta: { active: preference.active },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { preference } };
    },

    'GET /v1/tracking/entries': (
      request,
      actor,
    ): { status: number; body: TrackerEntryListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const trackerKey = queryParam(request, 'tracker_key');
      if (!trackerKey) {
        throw new ApiException('validation_failed', 422, 'Missing or invalid field: tracker_key');
      }

      const cursor = queryParam(request, 'cursor');
      const page = deps.tracking.listEntries(maternal.maternal_id, trackerKey, {
        ...(cursor !== undefined ? { cursor } : {}),
      });

      // Read audit carries no meta — never the tracker key (98 BR-6), mirroring the preferences read above.
      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'TrackerEntry',
        entityId: family.family_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return {
        status: 200,
        body: { items: page.items, ...(page.nextCursor ? { next_cursor: page.nextCursor } : {}) },
      };
    },

    'POST /v1/tracking/entries': (
      request,
      actor,
    ): { status: number; body: AddTrackerEntryResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      const subjectId = asString(body['subject_id'], 'subject_id');
      assertMaternalSubject(maternal, subjectId);

      let entry;
      try {
        entry = deps.tracking.addEntry({
          subjectId: maternal.maternal_id,
          trackerKey: asString(body['tracker_key'], 'tracker_key'),
          value: asString(body['value'], 'value'),
          createdBy: me.userId,
          ...(asOptionalString(body['recorded_at'], 'recorded_at') !== undefined
            ? { recordedAt: body['recorded_at'] as string }
            : {}),
        });
      } catch (error) {
        mapValidationError(error);
      }

      // No content-bearing meta at all — never the tracker key, never the value (98 BR-6, Phase 1 D-2).
      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'TrackerEntry',
        entityId: entry.tracker_entry_id,
        familyId: family.family_id,
        meta: {},
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 201, body: { entry } };
    },
  };
}
