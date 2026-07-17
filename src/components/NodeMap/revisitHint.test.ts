import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  REVISIT_HINT_STORAGE_KEY,
  hasSeenRevisitHint,
  markRevisitHintSeen,
  resetRevisitHint,
} from './revisitHint';

describe('revisitHint persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('has not been seen on a fresh browser', () => {
    expect(hasSeenRevisitHint()).toBe(false);
  });

  it('records the dismissal so it never shows again', () => {
    markRevisitHintSeen();
    expect(window.localStorage.getItem(REVISIT_HINT_STORAGE_KEY)).toBe('true');
    expect(hasSeenRevisitHint()).toBe(true);
  });

  it('clears the dismissal on reset so a fresh journey can see it again', () => {
    markRevisitHintSeen();
    resetRevisitHint();
    expect(window.localStorage.getItem(REVISIT_HINT_STORAGE_KEY)).toBeNull();
    expect(hasSeenRevisitHint()).toBe(false);
  });

  it('fails closed (treats as seen) when storage throws, so it never gets stuck', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => hasSeenRevisitHint()).not.toThrow();
    expect(hasSeenRevisitHint()).toBe(true);
    spy.mockRestore();
  });

  it('uses a journey-independent key (kept off the save schema)', () => {
    expect(REVISIT_HINT_STORAGE_KEY).toBe('narramorph-revisit-hint-seen');
    expect(REVISIT_HINT_STORAGE_KEY).not.toContain('saved-state');
  });
});
