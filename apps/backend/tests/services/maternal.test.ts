/**
 * MaternalService tests (docs/20-Implementation/206 objective 6).
 */

import { describe, expect, it } from 'vitest';

import { FamilyService } from '../../src/services/FamilyService';
import { MaternalRecordNotFoundError, MaternalService } from '../../src/services/MaternalService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

describe('MaternalService', () => {
  it('creates a maternal record scaffold under a family', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const maternal = new MaternalService(storage).createMaternalRecord(family.family_id, {
      name: 'Jane Doe',
    });

    expect(maternal.family_id).toBe(family.family_id);
    expect(maternal.profile.name).toBe('Jane Doe');
  });

  it('rejects a maternal record for a nonexistent family (FK integrity, docs/04-Architecture/54 BR-4)', () => {
    const storage = createInMemoryAdapter();
    const service = new MaternalService(storage);
    expect(() => service.createMaternalRecord('missing-family', { name: 'Jane' })).toThrow(
      /foreign key/i,
    );
  });

  it('getMaternalRecord returns the record and throws when absent', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const service = new MaternalService(storage);
    const maternal = service.createMaternalRecord(family.family_id, { name: 'Jane' });

    expect(service.getMaternalRecord(maternal.maternal_id)).toEqual(maternal);
    expect(() => service.getMaternalRecord('missing')).toThrow(MaternalRecordNotFoundError);
  });

  it('findByFamily finds the family’s maternal record or null', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    const otherFamily = new FamilyService(storage).createFamily('user-2');
    const service = new MaternalService(storage);
    const maternal = service.createMaternalRecord(family.family_id, { name: 'Jane' });

    expect(service.findByFamily(family.family_id)).toEqual(maternal);
    expect(service.findByFamily(otherFamily.family_id)).toBeNull();
  });
});
