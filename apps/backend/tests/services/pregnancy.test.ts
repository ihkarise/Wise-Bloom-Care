/**
 * PregnancyService tests (docs/20-Implementation/206 acceptance criterion:
 * "PregnancyEpisode stores LMP/EDD; GA is computed for display, not persisted
 * redundantly").
 */

import { describe, expect, it } from 'vitest';

import { FamilyService } from '../../src/services/FamilyService';
import { MaternalService } from '../../src/services/MaternalService';
import {
  PregnancyEpisodeNotFoundError,
  PregnancyService,
  PregnancyValidationError,
} from '../../src/services/PregnancyService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function seedMaternal(storage: ReturnType<typeof createInMemoryAdapter>) {
  const family = new FamilyService(storage).createFamily('user-1');
  return new MaternalService(storage).createMaternalRecord(family.family_id, { name: 'Jane' });
}

describe('PregnancyService.createEpisode', () => {
  it('creates an active episode with LMP/EDD stored as given', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);

    const episode = service.createEpisode(maternal.maternal_id, {
      lmp: '2026-01-01',
      edd: '2026-10-08',
    });

    expect(episode.maternal_id).toBe(maternal.maternal_id);
    expect(episode.lmp).toBe('2026-01-01');
    expect(episode.edd).toBe('2026-10-08');
    expect(episode.status).toBe('active');
  });

  it('is forgiving: LMP/EDD/BMI/parity are all optional (P9)', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const episode = new PregnancyService(storage).createEpisode(maternal.maternal_id, {});

    expect(episode.lmp).toBeUndefined();
    expect(episode.edd).toBeUndefined();
    expect(episode.pre_pregnancy_bmi_cat).toBe('unknown');
    expect(episode.parity).toBe('unknown');
  });

  it('rejects a malformed LMP', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    expect(() => service.createEpisode(maternal.maternal_id, { lmp: '01-01-2026' })).toThrow(
      PregnancyValidationError,
    );
  });

  it('rejects an LMP in the future', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    const farFuture = `${new Date().getUTCFullYear() + 5}-01-01`;
    expect(() => service.createEpisode(maternal.maternal_id, { lmp: farFuture })).toThrow(
      PregnancyValidationError,
    );
  });
});

describe('PregnancyService.getEpisode / listEpisodes', () => {
  it('getEpisode returns the episode and throws when absent', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    const episode = service.createEpisode(maternal.maternal_id, {});

    expect(service.getEpisode(episode.episode_id)).toEqual(episode);
    expect(() => service.getEpisode('missing')).toThrow(PregnancyEpisodeNotFoundError);
  });

  it('listEpisodes supports multiple episodes per maternal record (multi-pregnancy, docs/05-Data/71 §5)', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    service.createEpisode(maternal.maternal_id, { lmp: '2024-01-01' });
    service.createEpisode(maternal.maternal_id, { lmp: '2026-01-01' });

    expect(service.listEpisodes(maternal.maternal_id)).toHaveLength(2);
  });
});

describe('PregnancyService.gestationalAge', () => {
  it('computes gestational age for display only — never persisted on the episode', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    const episode = service.createEpisode(maternal.maternal_id, { lmp: '2026-01-01' });

    const ga = service.gestationalAge(episode, '2026-05-21');
    expect(ga).toEqual({ days: 140, weeks: 20, daysIntoWeek: 0 });

    // The stored record itself never gained a gestational-age field.
    expect('gestational_age' in episode).toBe(false);
    expect(storage.get('PregnancyEpisode', episode.episode_id)).toEqual(episode);
  });

  it('returns null when LMP is unknown', () => {
    const storage = createInMemoryAdapter();
    const maternal = seedMaternal(storage);
    const service = new PregnancyService(storage);
    const episode = service.createEpisode(maternal.maternal_id, {});

    expect(service.gestationalAge(episode, '2026-05-21')).toBeNull();
  });
});
