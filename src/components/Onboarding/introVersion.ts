/**
 * Minimal, device-local persistence for the first-run introduction.
 *
 * We store the *version* of the onboarding a reader last completed — not a bare
 * boolean — so that a materially changed intro can be shown again by bumping
 * {@link INTRO_VERSION}. This lives in its own `localStorage` key (mirroring the
 * existing `narramorph-3d-mode` pattern) and is deliberately kept **off** the
 * save schema and **out of** exported journeys: whether this browser has seen
 * the guide is a UI concern, not journey content.
 */

/**
 * The current onboarding version. Bump this (integer, monotonic) whenever the
 * introduction changes enough that returning readers should see it again.
 */
export const INTRO_VERSION = 2;

/** Dedicated, journey-independent storage key. */
export const INTRO_SEEN_STORAGE_KEY = 'narramorph-intro-seen-version';

/**
 * The onboarding version this browser last completed, or `null` if the intro
 * has never been completed (or the stored value is missing/malformed).
 */
export function getIntroSeenVersion(): number | null {
  try {
    const raw = window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
    if (typeof raw !== 'string') {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    // Private-mode / disabled storage: fail open (treat as never seen).
    return null;
  }
}

/**
 * Whether the first-run introduction should auto-open. True when this browser
 * has never completed the intro, or completed an older version than the current
 * one.
 */
export function shouldShowIntro(): boolean {
  const seen = getIntroSeenVersion();
  return seen === null || seen < INTRO_VERSION;
}

/** Record that this browser has completed the current intro version. */
export function markIntroSeen(): void {
  try {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, String(INTRO_VERSION));
  } catch {
    // Storage unavailable: the intro simply re-shows next load. Acceptable.
  }
}

/**
 * Clear the seen marker so the intro auto-opens again on the next load. Not used
 * by the on-demand Help replay (which just re-opens the dialog), but available
 * for a full "start onboarding over" affordance and covered by tests.
 */
export function resetIntroSeen(): void {
  try {
    window.localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
