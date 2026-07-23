/**
 * Input validation helpers (docs/05-Data/73).
 *
 * Server-authoritative, forgiving (P9), and non-diagnostic: plausibility checks
 * flag likely typos for confirmation — they never interpret values medically
 * (73 §6, BR-3). Includes the spreadsheet formula-injection guard (73 §8, BR-5).
 * These are pure helpers; business/continuity rules live in services.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
// Structural check only — not a full RFC 5322 validator (deliverability is proven by use, not by regex).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Strips ASCII control characters before storage (docs/05-Data/73 §8).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');
const FORMULA_PREFIX_RE = /^[=+\-@]/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

export function isIsoDateTime(value: string): boolean {
  return ISO_DATETIME_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/** Structural email format check (docs/05-Data/73 §4). Not a proof of deliverability. */
export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/**
 * Neutralises spreadsheet/CSV formula injection: a stored string beginning with
 * `=`, `+`, `-`, or `@` is prefixed with an apostrophe so Sheets treats it as
 * text, not a formula (docs/05-Data/73 §8, BR-5). Control characters are stripped.
 */
export function sanitizeString(input: string): string {
  const withoutControls = input.replace(CONTROL_CHARS_RE, '');
  if (FORMULA_PREFIX_RE.test(withoutControls)) {
    return `'${withoutControls}`;
  }
  return withoutControls;
}

/** Rejects timestamps in the future (docs/05-Data/73 §6, "not in the future"). */
export function isNotFuture(iso: string, now: number = Date.now()): boolean {
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t <= now;
}

export type PlausibilityField =
  'bp_systolic' | 'bp_diastolic' | 'weight_adult' | 'weight_infant' | 'blood_sugar';

/**
 * Data-entry sanity ranges (docs/05-Data/73 §6). Values outside the range are
 * flagged for user confirmation — explicitly NOT clinical thresholds.
 */
export const PLAUSIBILITY_RANGES: Record<PlausibilityField, { min: number; max: number }> = {
  bp_systolic: { min: 60, max: 260 },
  bp_diastolic: { min: 30, max: 160 },
  weight_adult: { min: 30, max: 250 },
  weight_infant: { min: 0.3, max: 30 },
  blood_sugar: { min: 20, max: 600 },
};

/** True when a value falls inside its plausible range (a quality check, not a diagnosis). */
export function isPlausible(field: PlausibilityField, value: number): boolean {
  const range = PLAUSIBILITY_RANGES[field];
  return value >= range.min && value <= range.max;
}

/** A safe, non-PHI validation error (docs/04-Architecture/56 §8). */
export class ValidationError extends Error {
  override readonly name = 'ValidationError';
  constructor(message: string) {
    super(message);
  }
}

/** Throws when a required-for-integrity value is missing (docs/05-Data/73 §4). */
export function assertPresent<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`Missing required field: ${field}`);
  }
  return value;
}
