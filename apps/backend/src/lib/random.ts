/**
 * Random byte generation for salts/secrets (docs/09-Security/121 §5).
 *
 * Built on `newId()` (lib/ids.ts), which already sources cryptographically
 * strong randomness on both runtimes (`Utilities.getUuid` on GAS,
 * `crypto.randomUUID` on Node) — reused here instead of a second
 * runtime-branching random source.
 */

import { hexToBytes } from './crypto';
import { newId } from './ids';

/** Returns `length` cryptographically random bytes. */
export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  let filled = 0;
  while (filled < length) {
    const chunk = hexToBytes(newId().replace(/-/g, ''));
    const take = Math.min(chunk.length, length - filled);
    out.set(chunk.subarray(0, take), filled);
    filled += take;
  }
  return out;
}
