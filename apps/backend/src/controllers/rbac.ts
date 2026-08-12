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
import type { MaternalService } from '../services/MaternalService';
import type { Family, MaternalRecord, UUID } from '@wise-bloom/domain-types';

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

/**
 * The maternal record scaffolding a family (one per family in v1 — docs/05-Data/71
 * §4). Fails `not_found` when absent. Centralised so every subject-scoped
 * controller resolves the maternal subject identically (52 BR-1).
 */
export function requireFamilyMaternal(
  maternalService: MaternalService,
  familyId: UUID,
): MaternalRecord {
  const record = maternalService.findByFamily(familyId);
  if (!record) {
    throw new ApiException('not_found', 404, 'No maternal record found for this family');
  }
  return record;
}

/**
 * Family-scoping on a client-supplied `subject_id`: in v1 the only valid vital/
 * report subject is the family's own maternal record. Any other id is refused
 * `forbidden` — a caller can never write to or read a subject outside their
 * family (docs/09-Security/123 §5, fail closed 52 §8).
 */
export function assertMaternalSubject(record: MaternalRecord, subjectId: UUID): void {
  if (subjectId !== record.maternal_id) {
    throw new ApiException('forbidden', 403, 'Subject is not in this family');
  }
}
