import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadScrollPosition, saveScrollPosition } from './scrollMemory';

describe('scroll memory', () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('round-trips a saved offset per node (rounded, clamped ≥ 0)', () => {
    expect(loadScrollPosition('arch-L1')).toBeNull();
    saveScrollPosition('arch-L1', 1234.6);
    expect(loadScrollPosition('arch-L1')).toBe(1235);
    saveScrollPosition('arch-L1', -20);
    expect(loadScrollPosition('arch-L1')).toBe(0);
  });

  it('keeps each node’s offset independent', () => {
    saveScrollPosition('arch-L1', 500);
    expect(loadScrollPosition('algo-L1')).toBeNull();
    expect(loadScrollPosition('arch-L1')).toBe(500);
  });

  it('fails silently when storage is unavailable (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => saveScrollPosition('k', 10)).not.toThrow();
    expect(loadScrollPosition('k')).toBeNull();
  });
});
