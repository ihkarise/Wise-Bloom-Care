/**
 * Credential hashing (docs/04-Architecture/57 BR-1, docs/09-Security/121 §5).
 *
 * Passwords are stored only as salted PBKDF2-HMAC-SHA256 hashes — never
 * plaintext or reversibly encrypted. The iteration count is a deliberate v1
 * trade-off: Apps Script has no native, hardware-accelerated KDF (no
 * bcrypt/scrypt/Argon2 primitive, no Web Crypto global — docs/04-Architecture/53
 * §6), so this uses the pure-JS PBKDF2 in `crypto.ts` at an iteration count
 * tuned to stay well inside GAS's execution budget for a synchronous
 * request/response call. Documented as technical debt (see the Sprint 01
 * completion report): raise the iteration count or move to a native KDF on
 * migration off Apps Script (docs/04-Architecture/52 §12).
 */

import {
  bytesToHex,
  hexToBytes,
  hmacSha256,
  pbkdf2Sha256,
  timingSafeEqualHex,
  utf8ToBytes,
} from './crypto';
import { randomBytes } from './random';

const ALGO_TAG = 'pbkdf2-sha256';
/**
 * Chosen for a synchronous request/response call on Apps Script, which has no
 * hardware-accelerated KDF: ~250-300ms per hash in pure JS at this count,
 * comfortably inside GAS's execution budget while still meaningfully
 * stretching brute-force cost. Lower than OWASP's native-implementation
 * guidance (600k+) by necessity — see the Sprint 01 completion report.
 */
const DEFAULT_ITERATIONS = 20_000;
const SALT_LEN_BYTES = 16;
const KEY_LEN_BYTES = 32;

/** Hashes a plaintext password into a self-describing `algo$iterations$salt$hash` string. */
export function hashPassword(password: string, iterations: number = DEFAULT_ITERATIONS): string {
  const salt = randomBytes(SALT_LEN_BYTES);
  const derived = pbkdf2Sha256(utf8ToBytes(password), salt, iterations, KEY_LEN_BYTES);
  return [ALGO_TAG, iterations, bytesToHex(salt), bytesToHex(derived)].join('$');
}

/** Verifies a plaintext password against a hash produced by `hashPassword`. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== ALGO_TAG) {
    return false;
  }
  const iterations = Number(parts[1]);
  const saltHex = parts[2] as string;
  const expectedHex = parts[3] as string;
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }
  const salt = hexToBytes(saltHex);
  const derived = pbkdf2Sha256(utf8ToBytes(password), salt, iterations, expectedHex.length / 2);
  return timingSafeEqualHex(bytesToHex(derived), expectedHex);
}

/**
 * Deterministic, keyed hash of an email address for storage/lookup
 * (docs/05-Data/72 §10 `email_hash`). Normalises case/whitespace so login
 * lookups are consistent. Keyed with a server-side pepper (Script
 * Properties, docs/09-Security/124) — a plain (unkeyed) hash would let
 * anyone with the stored value recover the email via a dictionary of common
 * addresses; the pepper makes that infeasible without the secret.
 */
export function hashEmail(email: string, pepper: string): string {
  const normalised = email.trim().toLowerCase();
  return bytesToHex(hmacSha256(utf8ToBytes(pepper), utf8ToBytes(normalised)));
}
