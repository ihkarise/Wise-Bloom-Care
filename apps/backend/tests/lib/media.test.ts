/**
 * MediaService tests (docs/20-Implementation/207 §9 unit: "media ref
 * generation/expiry"; §8/§10: media served only via short-lived,
 * backend-mediated refs — never a public link, R-1).
 */

import { describe, expect, it } from 'vitest';

import { InvalidMediaRefError, isPublicUrl, MediaService } from '../../src/lib/media';

describe('MediaService', () => {
  it('stores a private, non-public media_ref (never a URL)', () => {
    const media = new MediaService('secret');
    const ref = media.storeUpload('https://drive.example/whatever');
    expect(ref.startsWith('media:')).toBe(true);
    expect(isPublicUrl(ref)).toBe(false);
  });

  it('mints a short-lived reference that resolves back to the private media_ref', () => {
    const now = 1_000_000;
    const media = new MediaService('secret', 60_000, () => now);
    const stored = media.storeUpload('handle');
    const minted = media.issueViewRef(stored);
    expect(media.resolveViewRef(minted.media_ref)).toBe(stored);
    expect(new Date(minted.expires_at).getTime()).toBe(now + 60_000);
  });

  it('rejects an expired reference (fail closed)', () => {
    let now = 1_000_000;
    const media = new MediaService('secret', 60_000, () => now);
    const minted = media.issueViewRef(media.storeUpload('handle'));
    now += 60_001;
    expect(() => media.resolveViewRef(minted.media_ref)).toThrow(InvalidMediaRefError);
  });

  it('rejects a tampered signature', () => {
    const media = new MediaService('secret', 60_000, () => 1_000_000);
    const minted = media.issueViewRef(media.storeUpload('handle'));
    const tampered = `${minted.media_ref.slice(0, -1)}${minted.media_ref.endsWith('0') ? '1' : '0'}`;
    expect(() => media.resolveViewRef(tampered)).toThrow(InvalidMediaRefError);
  });

  it('rejects a reference signed by a different secret', () => {
    const issuer = new MediaService('secret-a', 60_000, () => 1_000_000);
    const other = new MediaService('secret-b', 60_000, () => 1_000_000);
    const minted = issuer.issueViewRef(issuer.storeUpload('handle'));
    expect(() => other.resolveViewRef(minted.media_ref)).toThrow(InvalidMediaRefError);
  });

  it('recognises public URLs so they are never stored', () => {
    expect(isPublicUrl('https://x.test/a')).toBe(true);
    expect(isPublicUrl('http://x.test/a')).toBe(true);
    expect(isPublicUrl('//x.test/a')).toBe(true);
    expect(isPublicUrl('media:abc')).toBe(false);
  });
});
