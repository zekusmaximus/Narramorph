import { describe, expect, it } from 'vitest';

import { resolveReducedMotionPreference } from './useReducedMotionPreference';

describe('resolveReducedMotionPreference', () => {
  it('honors either the application preference or operating-system preference', () => {
    expect(resolveReducedMotionPreference(false, false)).toBe(false);
    expect(resolveReducedMotionPreference(true, false)).toBe(true);
    expect(resolveReducedMotionPreference(false, true)).toBe(true);
    expect(resolveReducedMotionPreference(false, null)).toBe(false);
  });
});
