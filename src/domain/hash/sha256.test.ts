import { describe, expect, it } from 'vitest';

import { sha256Hex } from './sha256';

describe('sha256Hex', () => {
  // Published NIST/FIPS 180-4 test vectors.
  it('matches the empty-string vector', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches the "abc" vector', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the 56-character multi-block vector', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('hashes UTF-8 multibyte content deterministically', () => {
    const first = sha256Hex('The archive remembers — café ☕');
    const second = sha256Hex('The archive remembers — café ☕');
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    // A one-character change must change the digest.
    expect(sha256Hex('The archive remembers — cafe ☕')).not.toBe(first);
  });
});
