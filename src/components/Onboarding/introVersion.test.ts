import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INTRO_SEEN_STORAGE_KEY,
  INTRO_VERSION,
  getIntroSeenVersion,
  markIntroSeen,
  resetIntroSeen,
  shouldShowIntro,
} from './introVersion';

describe('introVersion persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('treats a never-seen browser (null) as needing the intro', () => {
    expect(getIntroSeenVersion()).toBeNull();
    expect(shouldShowIntro()).toBe(true);
  });

  it('does not re-show once the current version has been completed', () => {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, String(INTRO_VERSION));
    expect(getIntroSeenVersion()).toBe(INTRO_VERSION);
    expect(shouldShowIntro()).toBe(false);
  });

  it('re-shows when a materially newer intro version ships (stored < current)', () => {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, String(INTRO_VERSION - 1));
    expect(shouldShowIntro()).toBe(true);
  });

  it('does not re-show if the browser somehow completed a future version', () => {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, String(INTRO_VERSION + 1));
    expect(shouldShowIntro()).toBe(false);
  });

  it('is not a bare boolean: a legacy "true" value parses as unseen, not seen', () => {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true');
    expect(getIntroSeenVersion()).toBeNull();
    expect(shouldShowIntro()).toBe(true);
  });

  it('persists the current version as the seen marker', () => {
    markIntroSeen();
    expect(window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)).toBe(String(INTRO_VERSION));
    expect(shouldShowIntro()).toBe(false);
  });

  it('clears the seen marker on reset so the intro can auto-open again', () => {
    markIntroSeen();
    resetIntroSeen();
    expect(window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)).toBeNull();
    expect(shouldShowIntro()).toBe(true);
  });

  it('fails open when storage throws (private mode)', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => getIntroSeenVersion()).not.toThrow();
    expect(getIntroSeenVersion()).toBeNull();
    expect(shouldShowIntro()).toBe(true);
  });

  it('uses a journey-independent key (kept off the save schema)', () => {
    expect(INTRO_SEEN_STORAGE_KEY).toBe('narramorph-intro-seen-version');
    expect(INTRO_SEEN_STORAGE_KEY).not.toContain('saved-state');
  });
});
