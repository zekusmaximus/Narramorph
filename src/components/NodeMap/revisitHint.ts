/**
 * Minimal, device-local persistence for the one-time revisitation hint (Phase 7.1).
 *
 * The archive re-renders passages a reader returns to, but nothing forces a
 * reader to revisit. So the first time a reader is back on the map with at least
 * one passage opened, we show a single, dismissible hint that reopening a passage
 * may change it. Once dismissed it never shows again.
 *
 * Like the intro-seen marker, this lives in its own `localStorage` key (mirroring
 * the `narramorph-intro-seen-version` pattern) and is deliberately kept **off**
 * the save schema and **out of** exported journeys: whether this browser has
 * dismissed a UI hint is not journey content. It fails open (never blocks the UI)
 * when storage is unavailable.
 */

/** Dedicated, journey-independent storage key. */
export const REVISIT_HINT_STORAGE_KEY = 'narramorph-revisit-hint-seen';

/** Whether this browser has already dismissed the revisitation hint. */
export function hasSeenRevisitHint(): boolean {
  try {
    return window.localStorage.getItem(REVISIT_HINT_STORAGE_KEY) === 'true';
  } catch {
    // Private-mode / disabled storage: treat as seen so the hint never gets stuck
    // re-appearing on a browser that cannot remember the dismissal.
    return true;
  }
}

/** Record that this browser has dismissed the revisitation hint. */
export function markRevisitHintSeen(): void {
  try {
    window.localStorage.setItem(REVISIT_HINT_STORAGE_KEY, 'true');
  } catch {
    // Storage unavailable: the hint simply may re-show next load. Acceptable.
  }
}

/** Clear the dismissal so the hint can show again. Used by a full progress reset. */
export function resetRevisitHint(): void {
  try {
    window.localStorage.removeItem(REVISIT_HINT_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
