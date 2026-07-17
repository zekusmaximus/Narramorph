import { describe, expect, it } from 'vitest';

import {
  ATMOSPHERE,
  CONTRAST_REQUIREMENTS,
  FOCUS,
  MOTION,
  PERSPECTIVE_COLOR,
  PERSPECTIVE_COLOR_LOCKED,
  PERSPECTIVE_INK,
  SURFACE,
} from './designTokens';
import tokensCssRaw from './tokens.css?raw';

/** WCAG 2.1 relative luminance. */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const channel = (pair: string): number => {
    const c = parseInt(pair, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(value.slice(0, 2));
  const g = channel(value.slice(2, 4));
  const b = channel(value.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two colours. */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const tokensCss = tokensCssRaw.toLowerCase();

function cssVar(name: string): string | null {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})`));
  return match?.[1] ?? null;
}

describe('design tokens — WCAG contrast gate', () => {
  it.each(CONTRAST_REQUIREMENTS)(
    '$label meets its minimum contrast',
    ({ foreground, background, minRatio }) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minRatio);
    },
  );

  it('lifts the convergence text ink above the failing base purple', () => {
    // The base fill fails as text on the shell; the ink variant must pass.
    expect(contrastRatio(PERSPECTIVE_COLOR['multi-perspective'], SURFACE.shell)).toBeLessThan(4.5);
    expect(
      contrastRatio(PERSPECTIVE_INK['multi-perspective'], SURFACE.shell),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps a focus ring legible on the light reader surfaces', () => {
    // The default cyan ring is invisible on paper; the light-surface ring must pass.
    expect(contrastRatio(FOCUS.onDark, SURFACE.readerPaper)).toBeLessThan(3);
    expect(contrastRatio(FOCUS.onLight, SURFACE.readerPaper)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(FOCUS.onLight, SURFACE.readerArchive)).toBeGreaterThanOrEqual(3);
  });
});

describe('design tokens — TS/CSS drift guard', () => {
  it('mirrors every perspective colour into tokens.css', () => {
    expect(cssVar('perspective-archaeologist')).toBe(PERSPECTIVE_COLOR.archaeologist.toLowerCase());
    expect(cssVar('perspective-algorithm')).toBe(PERSPECTIVE_COLOR.algorithm.toLowerCase());
    expect(cssVar('perspective-last-human')).toBe(PERSPECTIVE_COLOR['last-human'].toLowerCase());
    expect(cssVar('perspective-convergence')).toBe(
      PERSPECTIVE_COLOR['multi-perspective'].toLowerCase(),
    );
    expect(cssVar('perspective-convergence-ink')).toBe(
      PERSPECTIVE_INK['multi-perspective'].toLowerCase(),
    );
  });

  it('mirrors surfaces and the focus ring into tokens.css', () => {
    expect(cssVar('surface-shell')).toBe(SURFACE.shell.toLowerCase());
    expect(cssVar('surface-raised')).toBe(SURFACE.raised.toLowerCase());
    expect(cssVar('focus-ring')).toBe(FOCUS.onDark.toLowerCase());
    expect(cssVar('focus-ring-on-light')).toBe(FOCUS.onLight.toLowerCase());
  });

  it('mirrors motion durations and atmosphere opacity into tokens.css', () => {
    expect(tokensCss).toContain(`--motion-fast: ${MOTION.fast}`);
    expect(tokensCss).toContain(`--motion-base: ${MOTION.base}`);
    expect(tokensCss).toContain(`--motion-slow: ${MOTION.slow}`);
    expect(tokensCss).toContain(`--atmosphere-opacity: ${ATMOSPHERE.opacity}`);
  });

  it('keeps a locked variant for every perspective', () => {
    for (const key of Object.keys(PERSPECTIVE_COLOR)) {
      expect(PERSPECTIVE_COLOR_LOCKED[key as keyof typeof PERSPECTIVE_COLOR_LOCKED]).toMatch(
        /^#[0-9a-f]{6}$/i,
      );
    }
  });
});
