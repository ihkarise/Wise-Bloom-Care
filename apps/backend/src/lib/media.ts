/**
 * Media referencing — short-lived, backend-mediated references to private
 * report media (docs/04-Architecture/58, docs/06-Modules/84 BR-1).
 *
 * The independence rule for media privacy: the stored `media_ref` is a private,
 * opaque identifier — never a public URL — and the only way to view media is a
 * freshly minted, HMAC-signed reference that *expires*. There is no durable
 * public link anywhere in the system (verified by
 * tests/integration/reports-media-privacy.test.ts).
 *
 * The signing primitive is the project's dependency-free `hmacSha256`, so this
 * behaves identically on Google Apps Script and under Node/Vitest (same reason
 * as `lib/crypto.ts`). Tokens are stateless: `{expiresAtMs}.{mediaRef}.{sig}`,
 * where `sig = HMAC(secret, "{expiresAtMs}.{mediaRef}")`. A private media_ref
 * (`media:<uuid>`) contains no `.`; the two structural dots delimit the token
 * unambiguously.
 */

import { bytesToHex, hmacSha256, utf8ToBytes } from './crypto';
import { newId } from './ids';

import type { ISODateTime } from '@wise-bloom/domain-types';

/** Default lifetime of a minted view reference — deliberately short (docs/04-Architecture/58). */
export const DEFAULT_MEDIA_TTL_MS = 5 * 60 * 1000;

/** A minted, expiring reference the client presents back to the backend to view media. */
export interface MintedMediaRef {
  media_ref: string;
  expires_at: ISODateTime;
}

/** Refused when a view reference is malformed, tampered with, or expired (fail closed). */
export class InvalidMediaRefError extends Error {
  override readonly name = 'InvalidMediaRefError';
}

/** True when a value looks like a public URL — such a value must never be stored as a media_ref. */
export function isPublicUrl(value: string): boolean {
  return /^(https?:|ftp:|\/\/)/i.test(value.trim());
}

export class MediaService {
  private readonly key: Uint8Array;

  constructor(
    signingSecret: string,
    private readonly ttlMs: number = DEFAULT_MEDIA_TTL_MS,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.key = utf8ToBytes(signingSecret);
  }

  /**
   * Turns an opaque client upload handle into a private, non-public
   * `media_ref`. The handle itself is never persisted or exposed; the stored
   * reference is a fresh opaque id, so nothing derived from client input can
   * become a durable public link (84 BR-1).
   */
  storeUpload(_uploadHandle: string): string {
    return `media:${newId()}`;
  }

  private sign(payload: string): string {
    return bytesToHex(hmacSha256(this.key, utf8ToBytes(payload)));
  }

  /** Mints a short-lived, signed reference for viewing a private media_ref. */
  issueViewRef(mediaRef: string): MintedMediaRef {
    const expiresAtMs = this.now() + this.ttlMs;
    const payload = `${expiresAtMs}.${mediaRef}`;
    return {
      media_ref: `${payload}.${this.sign(payload)}`,
      expires_at: new Date(expiresAtMs).toISOString(),
    };
  }

  /**
   * Validates a minted view reference and returns the private media_ref it
   * points to. Fails closed on any structural error, bad signature, or expiry
   * (docs/04-Architecture/52 §8).
   */
  resolveViewRef(ref: string, nowMs: number = this.now()): string {
    const firstDot = ref.indexOf('.');
    const lastDot = ref.lastIndexOf('.');
    if (firstDot <= 0 || lastDot <= firstDot) {
      throw new InvalidMediaRefError('Malformed media reference');
    }
    const expiresAtMs = Number(ref.slice(0, firstDot));
    const mediaRef = ref.slice(firstDot + 1, lastDot);
    const signature = ref.slice(lastDot + 1);
    if (!Number.isFinite(expiresAtMs) || mediaRef.length === 0 || signature.length === 0) {
      throw new InvalidMediaRefError('Malformed media reference');
    }
    if (this.sign(`${expiresAtMs}.${mediaRef}`) !== signature) {
      throw new InvalidMediaRefError('Invalid media reference signature');
    }
    if (expiresAtMs <= nowMs) {
      throw new InvalidMediaRefError('Media reference has expired');
    }
    return mediaRef;
  }
}
