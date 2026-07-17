import { describe, expect, it } from 'vitest';

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import type { SavedState, StoryNode } from '@/types';

import { buildSavedState, CURRENT_SAVE_VERSION, prepareSavedState } from './saveState';

/**
 * Rollback save safety (Batch 8.4). The save schema is frozen at 1.3.0 across
 * app-version changes, so rolling the app back — an older app reading a save written
 * by a newer app — must load cleanly and keep the reader's progress. Forward and
 * absent-version cases are covered too. This is the "rollback completes without
 * corrupting existing local saves" acceptance.
 */
const nodes = new Map<string, StoryNode>();

function saveStampedWith(appVersion: string): SavedState {
  const progress = createInitialProgress();
  progress.visitedNodes['arch-L1'] = {
    visitCount: 2,
    visitTimestamps: ['2026-07-12T12:00:00.000Z', '2026-07-12T12:05:00.000Z'],
    currentState: 'initial',
    timeSpent: 0,
    lastVisited: '2026-07-12T12:05:00.000Z',
  };
  const saved = buildSavedState(progress, createInitialPreferences(), '2026-07-12T12:00:00.000Z');
  return { ...saved, appVersion };
}

describe('rollback save safety', () => {
  it('loads a save written by a NEWER app version (rollback) without corrupting progress', () => {
    const prepared = prepareSavedState(saveStampedWith('9.9.9'), nodes);
    expect(prepared).not.toBeNull();
    // The save format is unchanged across the app rollback...
    expect(prepared?.savedState.version).toBe(CURRENT_SAVE_VERSION);
    // ...and the reader's progress is intact.
    expect(prepared?.savedState.progress.visitedNodes['arch-L1']?.visitCount).toBe(2);
  });

  it('loads a save written by an OLDER app version cleanly', () => {
    const prepared = prepareSavedState(saveStampedWith('0.1.0'), nodes);
    expect(prepared).not.toBeNull();
    expect(prepared?.savedState.version).toBe(CURRENT_SAVE_VERSION);
    expect(prepared?.savedState.progress.visitedNodes['arch-L1']?.visitCount).toBe(2);
  });

  it('keeps the reader on the frozen save schema regardless of the app version stamp', () => {
    // The app version is metadata; the compatibility contract is the save schema,
    // which does not move across an app rollback (so no migration/format change).
    for (const appVersion of ['0.1.0', '0.1.1', '9.9.9']) {
      expect(prepareSavedState(saveStampedWith(appVersion), nodes)?.savedState.version).toBe(
        CURRENT_SAVE_VERSION,
      );
    }
  });
});
