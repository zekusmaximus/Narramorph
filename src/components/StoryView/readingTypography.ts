import type { LineHeight, TextSize } from '@/types';

/**
 * Shared reading-surface typography (Phase 7.2). Font size is driven by the
 * text-size preference; leading is driven independently by the line-height
 * preference, so a long passage can be tuned for comfort without changing the
 * font size. Both the 2D and 3D readers consume these so they never drift.
 */
export const FONT_SIZE_CLASS: Record<TextSize, string> = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
};

export const LINE_HEIGHT_CLASS: Record<LineHeight, string> = {
  cozy: 'leading-[1.7]',
  normal: 'leading-[1.85]',
  relaxed: 'leading-[2.05]',
};

/** Absent line-height (saves written before it existed) reads as 'normal'. */
export const DEFAULT_LINE_HEIGHT: LineHeight = 'normal';

export function resolveLineHeight(lineHeight: LineHeight | undefined): LineHeight {
  return lineHeight ?? DEFAULT_LINE_HEIGHT;
}

/** The combined font-size + leading utility classes for the reading surface. */
export function readingSurfaceClass(
  textSize: TextSize,
  lineHeight: LineHeight | undefined,
): string {
  return `${FONT_SIZE_CLASS[textSize]} ${LINE_HEIGHT_CLASS[resolveLineHeight(lineHeight)]}`;
}
