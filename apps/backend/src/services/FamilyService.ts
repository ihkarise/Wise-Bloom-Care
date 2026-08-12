/**
 * FamilyService — owns the family record graph root (docs/05-Data/70 §Family,
 * docs/20-Implementation/206 objective 6).
 *
 * Sprint 01 scope is creation + lookup of the family graph created at
 * registration (docs/04-Architecture/57 §4 step 4); caregiver grant/revoke
 * (docs/06-Modules/96) extends this service in a later sprint without
 * changing this contract (docs/20-Implementation/203 §5).
 */

import { newId } from '../lib/ids';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Family, UUID } from '@wise-bloom/domain-types';

export class FamilyNotFoundError extends Error {
  override readonly name = 'FamilyNotFoundError';
}

export class FamilyService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /** Creates the family graph root for a newly registered account holder. */
  createFamily(ownerUserId: UUID): Family {
    const family: Family = {
      family_id: newId(),
      owner_user_id: ownerUserId,
      created_at: this.now(),
    };
    return this.storage.create('Family', family);
  }

  /** Fetches a family by id; throws when absent (fail closed at the RBAC boundary). */
  getFamily(familyId: UUID): Family {
    const family = this.storage.get('Family', familyId);
    if (!family) {
      throw new FamilyNotFoundError(`Family ${familyId} not found`);
    }
    return family;
  }

  /** The family owned by a given user, or `null` (an account holder owns exactly one family in v1 — docs/05-Data/71 §4). */
  findFamilyOwnedBy(ownerUserId: UUID): Family | null {
    const [family] = this.storage.query('Family', { owner_user_id: ownerUserId });
    return family ?? null;
  }

  /**
   * Family-scope RBAC check (docs/09-Security/123 §5, §7): true only when
   * `userId` owns `familyId`. Caregiver-scope grants extend this in a later
   * sprint (`96`); until then, ownership is the sole grant of access.
   */
  isAuthorised(userId: UUID, familyId: UUID): boolean {
    const family = this.storage.get('Family', familyId);
    return family !== null && family.owner_user_id === userId;
  }
}
