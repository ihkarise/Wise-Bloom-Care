/**
 * Unit tests for the backend pure helpers (docs/20-Implementation/205 §9):
 * id/date/validation libs and the PHI-stripping logger.
 */

import { describe, expect, it } from 'vitest';

import { isUuid, newId } from '../src/lib/ids';
import { createLogger, stripPhi, type LogEntry } from '../src/lib/logging';
import {
  isIsoDate,
  isIsoDateTime,
  isNotFuture,
  isPlausible,
  sanitizeString,
  ValidationError,
  assertPresent,
} from '../src/lib/validation';

describe('ids', () => {
  it('generates well-formed UUIDs', () => {
    const id = newId();
    expect(isUuid(id)).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});

describe('validation: dates', () => {
  it('accepts ISO dates and datetimes', () => {
    expect(isIsoDate('2026-07-22')).toBe(true);
    expect(isIsoDateTime('2026-07-22T10:30:00.000Z')).toBe(true);
  });

  it('rejects malformed dates', () => {
    expect(isIsoDate('22-07-2026')).toBe(false);
    expect(isIsoDateTime('2026-07-22 10:30')).toBe(false);
  });

  it('rejects future timestamps but allows past/retrospective (P9)', () => {
    const now = Date.parse('2026-07-22T00:00:00.000Z');
    expect(isNotFuture('2026-01-01T00:00:00.000Z', now)).toBe(true);
    expect(isNotFuture('2027-01-01T00:00:00.000Z', now)).toBe(false);
  });
});

describe('validation: formula-injection guard (docs/05-Data/73 §8)', () => {
  it('neutralises leading formula characters', () => {
    expect(sanitizeString('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeString('+1')).toBe("'+1");
    expect(sanitizeString('@ref')).toBe("'@ref");
  });

  it('leaves ordinary strings untouched', () => {
    expect(sanitizeString('Jane Doe')).toBe('Jane Doe');
    expect(sanitizeString('2026-07-22T10:30:00.000Z')).toBe('2026-07-22T10:30:00.000Z');
  });
});

describe('validation: plausibility (non-diagnostic, docs/05-Data/73 §6)', () => {
  it('flags implausible entries as out-of-range', () => {
    expect(isPlausible('bp_systolic', 120)).toBe(true);
    expect(isPlausible('bp_systolic', 900)).toBe(false);
    expect(isPlausible('blood_sugar', 5000)).toBe(false);
  });
});

describe('validation: required fields', () => {
  it('throws a safe ValidationError on missing integrity fields', () => {
    expect(() => assertPresent(undefined, 'mother_id')).toThrow(ValidationError);
    expect(assertPresent('x', 'field')).toBe('x');
  });
});

describe('logging: PHI stripping (docs/04-Architecture/63 §5)', () => {
  it('drops non-allowlisted keys and records only their names', () => {
    const { safe, redactedKeys } = stripPhi({
      action: 'read',
      // The following are PHI-ish and must never reach the log values.
      name: 'Jane Doe',
      bp_systolic: 128,
    });
    expect(safe).toEqual({ action: 'read' });
    expect(redactedKeys.sort()).toEqual(['bp_systolic', 'name']);
  });

  it('never emits a redacted value', () => {
    const captured: LogEntry[] = [];
    const logger = createLogger({ sink: (entry) => captured.push(entry) });
    logger.info('vital_logged', { entity: 'Vital', name: 'Jane', value: 128 });
    const serialized = JSON.stringify(captured);
    expect(serialized).not.toContain('Jane');
    expect(serialized).not.toContain('128');
    expect(captured[0]?.redacted_keys?.sort()).toEqual(['name', 'value']);
  });

  it('suppresses debug logs unless explicitly enabled (docs/04-Architecture/63 BR-4)', () => {
    const captured: LogEntry[] = [];
    const logger = createLogger({ sink: (entry) => captured.push(entry) });
    logger.debug('trace');
    expect(captured).toHaveLength(0);
  });
});
