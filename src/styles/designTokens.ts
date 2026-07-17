/**
 * Narramorph design tokens — the canonical source of truth (TypeScript).
 *
 * These values are mirrored into CSS custom properties in `tokens.css` for
 * styling and Tailwind, and consumed directly by the TS/canvas code that needs
 * a concrete hex (node appearance, 3D scene, content loader). `designTokens.test.ts`
 * verifies the two stay in sync and that every meaningful pairing meets its WCAG
 * contrast target, so "contrast passes" is provable and cannot silently regress.
 *
 * Contrast obligations (WCAG 2.1): text ≥ 4.5:1; large text / non-text UI and
 * graph state ≥ 3:1. Measured against N's real surfaces.
 */

export type PerspectiveKey = 'archaeologist' | 'algorithm' | 'last-human' | 'multi-perspective';

/** Perspective identity colours, used as graph/node fills (non-text; ≥ 3:1 on the dark shell). */
export const PERSPECTIVE_COLOR: Record<PerspectiveKey, string> = {
  archaeologist: '#4A90E2',
  algorithm: '#50C878',
  'last-human': '#E74C3C',
  'multi-perspective': '#9B59B6',
};

/**
 * Dimmer perspective fills for locked / unavailable nodes. These are intentionally
 * recessive: a locked node is non-interactive and further dimmed at render (opacity
 * 0.3, reduced scale), and "unavailable" is conveyed by that de-emphasis rather than
 * by hue. They are therefore excluded from the contrast gate below (they are not
 * text, controls, focus, or a colour the reader must discriminate to understand the
 * map); the available / visited / active fills that DO carry meaning stay in the gate.
 */
export const PERSPECTIVE_COLOR_LOCKED: Record<PerspectiveKey, string> = {
  archaeologist: '#1e40af',
  algorithm: '#166534',
  'last-human': '#991b1b',
  'multi-perspective': '#6b21a8',
};

/**
 * Readable text variants (≥ 4.5:1 on the dark shell). Only the convergence purple
 * needed lifting (#9B59B6 is 4.18:1 as text); the other three already pass as text
 * and are kept identical so the mapping is complete for any future text use.
 */
export const PERSPECTIVE_INK: Record<PerspectiveKey, string> = {
  archaeologist: '#4A90E2',
  algorithm: '#50C878',
  'last-human': '#E74C3C',
  'multi-perspective': '#b07cc9',
};

/** Surfaces the reader and chrome sit on. */
export const SURFACE = {
  shell: '#080d10',
  raised: '#0b1015',
  readerNight: '#111827',
  readerPaper: '#ffffff',
  readerArchive: '#fffbeb',
} as const;

/** Reader prose ink per surface luminance. */
export const READER_INK = {
  onLight: '#1f2937',
  onNight: '#e5e7eb',
} as const;

/**
 * Focus-ring colours per surface luminance. The default cyan is invisible on the
 * light "Paper"/sepia reader panels (~1.2:1), so those surfaces flip to a dark ring.
 * Both meet the ≥ 3:1 non-text-contrast target for focus indicators on their surface.
 */
export const FOCUS = {
  onDark: '#a5f3fc',
  onLight: '#0e7490',
} as const;

/** Motion durations (also mirrored as CSS vars). */
export const MOTION = {
  fast: '150ms',
  base: '200ms',
  slow: '600ms',
  atmosphereDrift: '150s',
} as const;

/** Decorative cosmic-atmosphere knobs (documented as decorative; AT ignores the layer). */
export const ATMOSPHERE = {
  opacity: 0.5,
} as const;

export interface ContrastRequirement {
  label: string;
  foreground: string;
  background: string;
  minRatio: number;
}

/**
 * The pairings that must pass, as data, so the validator (and reviewers) can see
 * exactly what "contrast passes for text, controls, focus, and graph state" means.
 */
export const CONTRAST_REQUIREMENTS: readonly ContrastRequirement[] = [
  // Meaningful graph state: available/visited/active perspective fills on the dark
  // shell (non-text, ≥ 3:1). Locked fills are intentionally recessive and excluded
  // (see PERSPECTIVE_COLOR_LOCKED).
  ...(Object.keys(PERSPECTIVE_COLOR) as PerspectiveKey[]).flatMap((key) => [
    {
      label: `perspective fill ${key} on shell`,
      foreground: PERSPECTIVE_COLOR[key],
      background: SURFACE.shell,
      minRatio: 3,
    },
    {
      label: `perspective ink ${key} as text on shell`,
      foreground: PERSPECTIVE_INK[key],
      background: SURFACE.shell,
      minRatio: 4.5,
    },
  ]),
  // Focus indicators (non-text, ≥ 3:1) on every surface they appear on.
  {
    label: 'focus ring on shell',
    foreground: FOCUS.onDark,
    background: SURFACE.shell,
    minRatio: 3,
  },
  {
    label: 'focus ring on raised panel',
    foreground: FOCUS.onDark,
    background: SURFACE.raised,
    minRatio: 3,
  },
  {
    label: 'focus ring on paper reader',
    foreground: FOCUS.onLight,
    background: SURFACE.readerPaper,
    minRatio: 3,
  },
  {
    label: 'focus ring on archive reader',
    foreground: FOCUS.onLight,
    background: SURFACE.readerArchive,
    minRatio: 3,
  },
  // Reader prose (text, ≥ 4.5:1) on each reader surface.
  {
    label: 'reader ink on paper',
    foreground: READER_INK.onLight,
    background: SURFACE.readerPaper,
    minRatio: 4.5,
  },
  {
    label: 'reader ink on archive',
    foreground: READER_INK.onLight,
    background: SURFACE.readerArchive,
    minRatio: 4.5,
  },
  {
    label: 'reader ink on night',
    foreground: READER_INK.onNight,
    background: SURFACE.readerNight,
    minRatio: 4.5,
  },
];
