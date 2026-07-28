import { describe, expect, it } from 'vitest';

import { resolveNodeStateCue } from './nodeStateCues';

describe('resolveNodeStateCue', () => {
  it('assigns mutually exclusive structural cues without depending on colour', () => {
    expect(resolveNodeStateCue({ available: true, selected: false, visited: false })).toBe(
      'available',
    );
    expect(resolveNodeStateCue({ available: true, selected: false, visited: true })).toBe('opened');
    expect(resolveNodeStateCue({ available: true, selected: true, visited: true })).toBe(
      'selected',
    );
    expect(resolveNodeStateCue({ available: false, selected: true, visited: true })).toBe('locked');
  });
});
