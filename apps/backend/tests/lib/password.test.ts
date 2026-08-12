/**
 * Credential/email hashing tests (docs/04-Architecture/57 BR-1, docs/09-Security/121 §5).
 */

import { describe, expect, it } from 'vitest';

import { hashEmail, hashPassword, verifyPassword } from '../../src/lib/password';

describe('hashPassword / verifyPassword', () => {
  it('verifies the correct password', () => {
    const hash = hashPassword('correct horse battery staple', 10);
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct horse battery staple', 10);
    expect(verifyPassword('wrong password', hash)).toBe(false);
  });

  it('never stores the plaintext password in the hash output', () => {
    const password = 'correct horse battery staple';
    const hash = hashPassword(password, 10);
    expect(hash).not.toContain(password);
  });

  it('salts each hash uniquely, even for the same password', () => {
    const a = hashPassword('same-password', 10);
    const b = hashPassword('same-password', 10);
    expect(a).not.toBe(b);
    expect(verifyPassword('same-password', a)).toBe(true);
    expect(verifyPassword('same-password', b)).toBe(true);
  });

  it('rejects malformed stored hashes safely (no throw)', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
    expect(verifyPassword('anything', '')).toBe(false);
  });
});

describe('hashEmail', () => {
  it('is deterministic for the same email and pepper', () => {
    expect(hashEmail('Jane@Example.com', 'pepper-1')).toBe(
      hashEmail('jane@example.com ', 'pepper-1'),
    );
  });

  it('differs across peppers (keyed hash)', () => {
    expect(hashEmail('jane@example.com', 'pepper-1')).not.toBe(
      hashEmail('jane@example.com', 'pepper-2'),
    );
  });

  it('never contains the plaintext email', () => {
    const hash = hashEmail('jane@example.com', 'pepper-1');
    expect(hash).not.toContain('jane');
    expect(hash).not.toContain('example');
  });
});
