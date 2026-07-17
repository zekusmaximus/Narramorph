import { describe, expect, it } from 'vitest';

import { parseReaderHash } from './useReaderRoute';

describe('parseReaderHash', () => {
  it('extracts the passage id from a reader hash', () => {
    expect(parseReaderHash('#/passage/arch-L1')).toBe('arch-L1');
    expect(parseReaderHash(`#/passage/${encodeURIComponent('with space')}`)).toBe('with space');
  });

  it('returns null for hashes that are not the flat reader', () => {
    expect(parseReaderHash('')).toBeNull();
    expect(parseReaderHash('#')).toBeNull();
    expect(parseReaderHash('#/passage/')).toBeNull(); // needs at least one id char
    expect(parseReaderHash('#/convergence/conv-L3')).toBeNull();
    expect(parseReaderHash('#something-else')).toBeNull();
  });
});
