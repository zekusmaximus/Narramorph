/**
 * Single source of truth for the first-run introduction copy.
 *
 * This is instructional interface chrome — the same register as
 * `OpeningExperience`'s framing — not story/manuscript prose, and it quotes no
 * canon passage verbatim (ADR 0002). The same content backs both the auto-open
 * first-run modal and the on-demand Help view, so the guidance a reader replays
 * is exactly the guidance they first saw.
 */

export interface IntroStep {
  /** Stable id, used for keys and as a test hook. */
  id: string;
  /** Short heading for the concept. */
  heading: string;
  /** One-line, plain-language explanation. */
  body: string;
  /** When true, the semantic animated-node demonstration renders under this step. */
  withDemo?: boolean;
}

export const INTRO_EYEBROW = 'Recovered archive · orientation';

export const INTRO_TITLE = 'How to read Narramorph';

/** The "what is this" framing, shown above the how-to steps. */
export const INTRO_PREMISE =
  'Three witnesses survived in the signal — an archaeologist, an algorithm, and the last human — each recording the same recovered fragments across their own era. You read the archive they left behind, and the archive remembers differently each time.';

/** The four required concepts: begin → interaction → path sensitivity → revisit. */
export const INTRO_STEPS: readonly IntroStep[] = [
  {
    id: 'begin',
    heading: 'Choose a perspective to begin',
    body: 'Start by selecting one of the three perspectives. Each opens the story in its own era; you can return and enter through another later.',
  },
  {
    id: 'interact',
    heading: 'Open a passage to read it',
    body: 'Select a passage on the map to read it. Passages you can open are highlighted; connected passages appear as you go.',
    withDemo: true,
  },
  {
    id: 'path',
    heading: 'Your path shapes the story',
    body: 'Which passages you read, and the order you read them in, changes what the archive reveals — passages surface, and connect, in ways a different path would not.',
  },
  {
    id: 'revisit',
    heading: 'Return and revisit',
    body: 'Passages are not fixed. Come back to one you have already read and it can render differently, carrying the memory of the journey that brought you back.',
  },
];

/**
 * The always-present text alternative for the animated-node demonstration. This
 * carries the meaning; the animation itself is decorative and `aria-hidden`, so
 * a reduced-motion or screen-reader user loses nothing.
 */
export const INTRO_DEMO_CAPTION =
  'A passage sits on the map, waiting. Selecting it opens it to read.';

/** Closing line that points readers at where to reopen this guide (checklist item: find Help). */
export const INTRO_HELP_HINT = 'You can reopen this guide any time from the “?” in the top bar.';

/** Primary action label per origin. */
export const INTRO_BEGIN_LABEL = 'Begin reading';
export const INTRO_HELP_CLOSE_LABEL = 'Back to the archive';
export const INTRO_SKIP_LABEL = 'Skip introduction';
