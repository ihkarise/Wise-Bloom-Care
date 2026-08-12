/**
 * Pure, dependency-free SHA-256 / HMAC-SHA256 / PBKDF2 (FIPS 180-4, RFC 2104,
 * RFC 8018).
 *
 * Credential hashing (docs/09-Security/121 §5) needs a synchronous primitive
 * that behaves identically on Google Apps Script (no Node builtins, no Web
 * Crypto global) and under Node/Vitest. Branching between GAS's `Utilities`
 * digest API and a Node-only crypto module would mean two different, mutually
 * unverifiable implementations; instead this is one small implementation with
 * no runtime dependency, built only from typed arrays and arithmetic that both
 * runtimes execute identically. Verified against FIPS 180-4 / RFC 4231 / RFC
 * 7914 test vectors (tests/lib/crypto.test.ts).
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H0 = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const BLOCK_SIZE = 64;
const DIGEST_SIZE = 32;

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function padMessage(message: Uint8Array): Uint8Array {
  const bitLenLow = (message.length * 8) >>> 0;
  const totalLen = message.length + 1 + 8;
  const remainder = totalLen % BLOCK_SIZE;
  const padZeros = remainder === 0 ? 0 : BLOCK_SIZE - remainder;
  const padded = new Uint8Array(message.length + 1 + padZeros + 8);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, 0, false);
  view.setUint32(padded.length - 4, bitLenLow, false);
  return padded;
}

function sha256Compress(h: Uint32Array, padded: Uint8Array): void {
  const w = new Uint32Array(64);
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  for (let offset = 0; offset < padded.length; offset += BLOCK_SIZE) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const wi15 = w[i - 15] as number;
      const wi2 = w[i - 2] as number;
      const s0 = rotr(wi15, 7) ^ rotr(wi15, 18) ^ (wi15 >>> 3);
      const s1 = rotr(wi2, 17) ^ rotr(wi2, 19) ^ (wi2 >>> 10);
      w[i] = ((w[i - 16] as number) + s0 + (w[i - 7] as number) + s1) >>> 0;
    }

    let a = h[0] as number;
    let b = h[1] as number;
    let c = h[2] as number;
    let d = h[3] as number;
    let e = h[4] as number;
    let f = h[5] as number;
    let g = h[6] as number;
    let hh = h[7] as number;

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + (K[i] as number) + (w[i] as number)) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = ((h[0] as number) + a) >>> 0;
    h[1] = ((h[1] as number) + b) >>> 0;
    h[2] = ((h[2] as number) + c) >>> 0;
    h[3] = ((h[3] as number) + d) >>> 0;
    h[4] = ((h[4] as number) + e) >>> 0;
    h[5] = ((h[5] as number) + f) >>> 0;
    h[6] = ((h[6] as number) + g) >>> 0;
    h[7] = ((h[7] as number) + hh) >>> 0;
  }
}

/** SHA-256 digest of a byte array (FIPS 180-4). */
export function sha256(message: Uint8Array): Uint8Array {
  const h = Uint32Array.from(H0);
  sha256Compress(h, padMessage(message));
  const out = new Uint8Array(DIGEST_SIZE);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint32(i * 4, h[i] as number, false);
  }
  return out;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** HMAC-SHA256 (RFC 2104). */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  let keyBlock = key.length > BLOCK_SIZE ? sha256(key) : key;
  if (keyBlock.length < BLOCK_SIZE) {
    const padded = new Uint8Array(BLOCK_SIZE);
    padded.set(keyBlock);
    keyBlock = padded;
  }
  const oKeyPad = new Uint8Array(BLOCK_SIZE);
  const iKeyPad = new Uint8Array(BLOCK_SIZE);
  for (let i = 0; i < BLOCK_SIZE; i++) {
    const kb = keyBlock[i] as number;
    oKeyPad[i] = kb ^ 0x5c;
    iKeyPad[i] = kb ^ 0x36;
  }
  const inner = sha256(concatBytes(iKeyPad, message));
  return sha256(concatBytes(oKeyPad, inner));
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = (a[i] as number) ^ (b[i] as number);
  }
  return out;
}

/** PBKDF2-HMAC-SHA256 (RFC 8018 §5.2). */
export function pbkdf2Sha256(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLenBytes: number,
): Uint8Array {
  const numBlocks = Math.ceil(keyLenBytes / DIGEST_SIZE);
  const out = new Uint8Array(numBlocks * DIGEST_SIZE);
  for (let blockIndex = 1; blockIndex <= numBlocks; blockIndex++) {
    const blockNoBytes = new Uint8Array(4);
    new DataView(blockNoBytes.buffer).setUint32(0, blockIndex, false);
    let u = hmacSha256(password, concatBytes(salt, blockNoBytes));
    let t = u;
    for (let i = 1; i < iterations; i++) {
      u = hmacSha256(password, u);
      t = xorBytes(t, u);
    }
    out.set(t, (blockIndex - 1) * DIGEST_SIZE);
  }
  return out.slice(0, keyLenBytes);
}

/** Manual UTF-8 encoder — avoids relying on `TextEncoder`, which GAS does not provide globally. */
export function utf8ToBytes(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const codePoint = input.codePointAt(i) as number;
    if (codePoint > 0xffff) {
      i++; // consumed the low surrogate as part of this code point
    }
    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Constant-time comparison of two equal-length hex strings (avoids timing side-channels). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
