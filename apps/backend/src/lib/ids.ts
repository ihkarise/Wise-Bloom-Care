/**
 * ID generation (docs/04-Architecture/54 §5: adapter-generated UUID PKs).
 *
 * Pure helper — no storage, no PHI (docs/11-Development/140). Works both on the
 * Apps Script runtime (`Utilities.getUuid`) and under Node/Vitest
 * (`crypto.randomUUID`).
 */

/** Returns a fresh opaque UUID string. */
export function newId(): string {
  // Apps Script runtime.
  if (typeof Utilities !== 'undefined' && typeof Utilities.getUuid === 'function') {
    return Utilities.getUuid();
  }
  // Node / browser test runtime.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  // Deterministic-shape fallback (should not be reached in supported runtimes).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** RFC-4122 UUID shape check (docs/05-Data/73 §4). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
