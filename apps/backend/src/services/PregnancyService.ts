/**
 * PregnancyService — owns the PregnancyEpisode (docs/06-Modules/82).
 *
 * A pregnancy episode anchors LMP/EDD, BMI category, parity, and status; it is
 * the anchor for all pregnancy-scoped data (docs/05-Data/71 §5). Gestational
 * age/weeks/trimester are derived on read via `lib/gestation.ts` — never
 * stored (82 BR-1, docs/20-Implementation/206 acceptance criteria). Entry is
 * forgiving: LMP/EDD may be unknown (P9); BMI category and parity fall back to
 * `'unknown'` rather than being left absent, since both are required-but-open
 * enums (docs/05-Data/72 §6).
 */

import { gestationalAgeAsOf, type GestationalAge } from '../lib/gestation';
import { newId } from '../lib/ids';
import { isIsoDate, isNotFuture } from '../lib/validation';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type {
  BmiCategory,
  ISODate,
  Parity,
  PregnancyEpisode,
  UUID,
} from '@wise-bloom/domain-types';

export class PregnancyValidationError extends Error {
  override readonly name = 'PregnancyValidationError';
}

export class PregnancyEpisodeNotFoundError extends Error {
  override readonly name = 'PregnancyEpisodeNotFoundError';
}

export interface CreatePregnancyEpisodeInput {
  lmp?: ISODate;
  edd?: ISODate;
  pre_pregnancy_bmi_cat?: BmiCategory;
  parity?: Parity;
}

export class PregnancyService {
  constructor(private readonly storage: StorageAdapter) {}

  /** Creates a new (active) pregnancy episode under a maternal record (docs/05-Data/71 §5). */
  createEpisode(maternalId: UUID, input: CreatePregnancyEpisodeInput): PregnancyEpisode {
    if (input.lmp !== undefined) {
      if (!isIsoDate(input.lmp)) {
        throw new PregnancyValidationError('Invalid LMP date');
      }
      if (!isNotFuture(`${input.lmp}T00:00:00.000Z`)) {
        throw new PregnancyValidationError('LMP cannot be in the future');
      }
    }
    if (input.edd !== undefined && !isIsoDate(input.edd)) {
      throw new PregnancyValidationError('Invalid EDD date');
    }

    const episode: PregnancyEpisode = {
      episode_id: newId(),
      maternal_id: maternalId,
      ...(input.lmp !== undefined ? { lmp: input.lmp } : {}),
      ...(input.edd !== undefined ? { edd: input.edd } : {}),
      pre_pregnancy_bmi_cat: input.pre_pregnancy_bmi_cat ?? 'unknown',
      parity: input.parity ?? 'unknown',
      status: 'active',
    };
    return this.storage.create('PregnancyEpisode', episode);
  }

  getEpisode(episodeId: UUID): PregnancyEpisode {
    const episode = this.storage.get('PregnancyEpisode', episodeId);
    if (!episode) {
      throw new PregnancyEpisodeNotFoundError(`PregnancyEpisode ${episodeId} not found`);
    }
    return episode;
  }

  /** All episodes for a maternal record, most-recently-created first (docs/06-Modules/82 FR-6, multi-episode support). */
  listEpisodes(maternalId: UUID): PregnancyEpisode[] {
    return this.storage.query('PregnancyEpisode', { maternal_id: maternalId });
  }

  /**
   * Gestational age as of a date, derived from the episode's LMP —
   * never persisted (docs/06-Modules/82 BR-1). `null` when LMP is unknown.
   */
  gestationalAge(episode: PregnancyEpisode, asOf: ISODate): GestationalAge | null {
    return gestationalAgeAsOf(episode.lmp, asOf);
  }
}
