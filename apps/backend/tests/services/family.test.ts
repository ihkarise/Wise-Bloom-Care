/**
 * FamilyService tests (docs/20-Implementation/206 §8: family-scope RBAC).
 */

import { describe, expect, it } from 'vitest';

import { FamilyNotFoundError, FamilyService } from '../../src/services/FamilyService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

describe('FamilyService', () => {
  it('creates a family owned by the given user', () => {
    const storage = createInMemoryAdapter();
    const family = new FamilyService(storage).createFamily('user-1');
    expect(family.owner_user_id).toBe('user-1');
    expect(family.created_at).toBeTruthy();
  });

  it('getFamily returns the stored family and throws when absent', () => {
    const storage = createInMemoryAdapter();
    const service = new FamilyService(storage);
    const family = service.createFamily('user-1');

    expect(service.getFamily(family.family_id)).toEqual(family);
    expect(() => service.getFamily('missing')).toThrow(FamilyNotFoundError);
  });

  it('findFamilyOwnedBy finds the owner’s family or null', () => {
    const storage = createInMemoryAdapter();
    const service = new FamilyService(storage);
    const family = service.createFamily('user-1');

    expect(service.findFamilyOwnedBy('user-1')).toEqual(family);
    expect(service.findFamilyOwnedBy('user-2')).toBeNull();
  });

  it('isAuthorised is true only for the owner (fail-closed RBAC scope check, 123)', () => {
    const storage = createInMemoryAdapter();
    const service = new FamilyService(storage);
    const family = service.createFamily('user-1');

    expect(service.isAuthorised('user-1', family.family_id)).toBe(true);
    expect(service.isAuthorised('user-2', family.family_id)).toBe(false);
    expect(service.isAuthorised('user-1', 'nonexistent-family')).toBe(false);
  });
});
