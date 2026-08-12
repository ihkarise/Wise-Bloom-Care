/**
 * MaternalService — owns the mother/birthing-parent node (docs/05-Data/70
 * §MaternalRecord). Created once, at registration, as the family's maternal
 * scaffold (docs/04-Architecture/57 §4 step 4); PregnancyService anchors
 * pregnancy-scoped data to it (docs/06-Modules/82).
 */

import { newId } from '../lib/ids';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { MaternalProfile, MaternalRecord, UUID } from '@wise-bloom/domain-types';

export class MaternalRecordNotFoundError extends Error {
  override readonly name = 'MaternalRecordNotFoundError';
}

export class MaternalService {
  constructor(private readonly storage: StorageAdapter) {}

  /** Creates the maternal record scaffold for a family (one per family in v1 — docs/05-Data/71 §4). */
  createMaternalRecord(familyId: UUID, profile: MaternalProfile): MaternalRecord {
    const record: MaternalRecord = {
      maternal_id: newId(),
      family_id: familyId,
      profile,
    };
    return this.storage.create('MaternalRecord', record);
  }

  getMaternalRecord(maternalId: UUID): MaternalRecord {
    const record = this.storage.get('MaternalRecord', maternalId);
    if (!record) {
      throw new MaternalRecordNotFoundError(`MaternalRecord ${maternalId} not found`);
    }
    return record;
  }

  /** The maternal record belonging to a family, or `null`. */
  findByFamily(familyId: UUID): MaternalRecord | null {
    const [record] = this.storage.query('MaternalRecord', { family_id: familyId });
    return record ?? null;
  }
}
