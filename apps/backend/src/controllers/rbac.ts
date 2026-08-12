/**
 * Family-scope RBAC enforcement at the controller boundary
 * (docs/09-Security/123 §5, §7; docs/20-Implementation/206 objective 2/task 2).
 *
 * Every family-scoped endpoint resolves its target family through this one
 * helper: default to the caller's own family when no `family_id` is given
 * (the common case — an account holder has exactly one family), and fail
 * closed with `forbidden` the moment a caller names a family they are not
 * authorised for. Centralising this means every controller enforces scope
 * identically (52 BR-1, no duplicated logic).
 */

import { ApiException, type AuthenticatedActor } from './router';

import type { FamilyService } from '../services/FamilyService';
import type { Family } from '@wise-bloom/domain-types';

export function resolveScopedFamily(
  familyService: FamilyService,
  actor: AuthenticatedActor,
  requestedFamilyId: string | undefined,
): Family {
  if (requestedFamilyId) {
    if (!familyService.isAuthorised(actor.userId, requestedFamilyId)) {
      throw new ApiException('forbidden', 403, 'Not authorised for this family');
    }
    return familyService.getFamily(requestedFamilyId);
  }

  const family = familyService.findFamilyOwnedBy(actor.userId);
  if (!family) {
    throw new ApiException('not_found', 404, 'No family found for this account');
  }
  return family;
}
