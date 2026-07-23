/**
 * SHA-256 / HMAC-SHA256 / PBKDF2 test vectors (docs/09-Security/121 §5).
 * Vectors: FIPS 180-4 (SHA-256), RFC 4231 (HMAC-SHA256), RFC 7914 Appendix A (PBKDF2-HMAC-SHA256).
 */

import { describe, expect, it } from 'vitest';

import {
  bytesToHex,
  hexToBytes,
  hmacSha256,
  pbkdf2Sha256,
  sha256,
  timingSafeEqualHex,
  utf8ToBytes,
} from '../../src/lib/crypto';

describe('sha256', () => {
  it('matches the FIPS 180-4 test vector for the empty string', () => {
    expect(bytesToHex(sha256(utf8ToBytes('')))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('matches the FIPS 180-4 test vector for "abc"', () => {
    expect(bytesToHex(sha256(utf8ToBytes('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the multi-block test vector', () => {
    const input = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
    expect(bytesToHex(sha256(utf8ToBytes(input)))).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });
});

describe('hmacSha256', () => {
  it('matches RFC 4231 test case 1', () => {
    const key = new Uint8Array(20).fill(0x0b);
    const data = utf8ToBytes('Hi There');
    expect(bytesToHex(hmacSha256(key, data))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });

  it('matches RFC 4231 test case 2 (short key, "Jefe" / "what do ya want for nothing?")', () => {
    const key = utf8ToBytes('Jefe');
    const data = utf8ToBytes('what do ya want for nothing?');
    expect(bytesToHex(hmacSha256(key, data))).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });

  it('matches RFC 4231 test case 6 (key longer than the block size)', () => {
    const key = new Uint8Array(131).fill(0xaa);
    const data = utf8ToBytes('Test Using Larger Than Block-Size Key - Hash Key First');
    expect(bytesToHex(hmacSha256(key, data))).toBe(
      '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54',
    );
  });
});

describe('pbkdf2Sha256', () => {
  it('matches the RFC 7914 Appendix A vector for c=1', () => {
    const dk = pbkdf2Sha256(utf8ToBytes('password'), utf8ToBytes('salt'), 1, 32);
    expect(bytesToHex(dk)).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
  });

  it('matches the RFC 7914 Appendix A vector for c=2', () => {
    const dk = pbkdf2Sha256(utf8ToBytes('password'), utf8ToBytes('salt'), 2, 32);
    expect(bytesToHex(dk)).toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
  });

  it('matches the RFC 7914 Appendix A vector for c=4096', () => {
    const dk = pbkdf2Sha256(utf8ToBytes('password'), utf8ToBytes('salt'), 4096, 32);
    expect(bytesToHex(dk)).toBe('c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
  });
});

describe('hex helpers', () => {
  it('round-trips bytes through hex', () => {
    const bytes = Uint8Array.from([0, 1, 15, 16, 255]);
    expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
  });
});

describe('timingSafeEqualHex', () => {
  it('returns true for equal strings and false otherwise', () => {
    expect(timingSafeEqualHex('abcd', 'abcd')).toBe(true);
    expect(timingSafeEqualHex('abcd', 'abce')).toBe(false);
    expect(timingSafeEqualHex('abcd', 'abcde')).toBe(false);
  });
});

describe('utf8ToBytes', () => {
  it('encodes multi-byte characters correctly', () => {
    // "é" (U+00E9) is 2 bytes in UTF-8: 0xC3 0xA9.
    expect(bytesToHex(utf8ToBytes('é'))).toBe('c3a9');
    // A basic multilingual plane emoji requires a surrogate pair and 4 UTF-8 bytes.
    expect(utf8ToBytes('😀').length).toBe(4);
  });
});
