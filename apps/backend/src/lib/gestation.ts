/**
 * Gestational-age computation (docs/06-Modules/82 §6, BR-1; docs/01-Product/13 §5).
 *
 * GA/weeks/trimester/EDD are **derived** from LMP — never stored as competing
 * truth (docs/05-Data/70 §5, docs/04-Architecture/55 §6). These are pure
 * functions; PregnancyService calls them for display, and nothing persists
 * their output. Non-diagnostic: they are date arithmetic only, never a
 * clinical judgement (docs/02-Research/28).
 */

import { isIsoDate } from './validation';

import type { ISODate } from '@wise-bloom/domain-types';

/** Naegele's rule: EDD = LMP + 280 days (docs/06-Modules/82 §4 FR-2). */
const GESTATION_DAYS = 280;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDateUtc(date: ISODate): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function formatIsoDateUtc(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Estimated due date from LMP (Naegele's rule). */
export function estimateDueDate(lmp: ISODate): ISODate {
  if (!isIsoDate(lmp)) {
    throw new RangeError(`Invalid LMP date: ${lmp}`);
  }
  return formatIsoDateUtc(parseIsoDateUtc(lmp) + GESTATION_DAYS * MS_PER_DAY);
}

/** Estimated LMP worked backwards from an EDD, when only the EDD is known. */
export function estimateLmpFromDueDate(edd: ISODate): ISODate {
  if (!isIsoDate(edd)) {
    throw new RangeError(`Invalid EDD date: ${edd}`);
  }
  return formatIsoDateUtc(parseIsoDateUtc(edd) - GESTATION_DAYS * MS_PER_DAY);
}

export interface GestationalAge {
  days: number;
  weeks: number;
  /** Days into the current week (0–6). */
  daysIntoWeek: number;
}

/**
 * Gestational age as of a given date, from LMP. Returns `null` when the LMP
 * is unknown (forgiving entry — docs/06-Modules/82 §10, P9) rather than
 * throwing, since "unknown LMP" is an expected, valid state.
 */
export function gestationalAgeAsOf(lmp: ISODate | undefined, asOf: ISODate): GestationalAge | null {
  if (!lmp) {
    return null;
  }
  const days = Math.floor((parseIsoDateUtc(asOf) - parseIsoDateUtc(lmp)) / MS_PER_DAY);
  if (days < 0) {
    return null; // LMP in the future relative to `asOf` — not a plausible pregnancy state to display
  }
  return { days, weeks: Math.floor(days / 7), daysIntoWeek: days % 7 };
}

export type Trimester = 1 | 2 | 3;

/** Trimester from completed gestational weeks (1st: 0–13, 2nd: 14–27, 3rd: 28+). */
export function trimesterFromWeeks(weeks: number): Trimester {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}
