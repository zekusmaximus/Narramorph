import { describe, expect, it } from 'vitest';

import { readingSurfaceClass, resolveLineHeight } from './readingTypography';

describe('reading typography', () => {
  it('decouples font size (text size) from leading (line height)', () => {
    expect(readingSurfaceClass('small', 'cozy')).toBe('text-base leading-[1.7]');
    expect(readingSurfaceClass('medium', 'normal')).toBe('text-lg leading-[1.85]');
    expect(readingSurfaceClass('large', 'relaxed')).toBe('text-xl leading-[2.05]');
  });

  it('reads an absent line height (older saves) as normal', () => {
    expect(resolveLineHeight(undefined)).toBe('normal');
    expect(readingSurfaceClass('medium', undefined)).toBe('text-lg leading-[1.85]');
  });

  it('keeps text sizes ordered small < medium < large', () => {
    const sizes = (['small', 'medium', 'large'] as const).map(
      (s) => readingSurfaceClass(s, 'normal').split(' ')[0],
    );
    expect(sizes).toEqual(['text-base', 'text-lg', 'text-xl']);
  });
});
