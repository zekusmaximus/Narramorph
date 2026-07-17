import { prepareSavedState } from '@/domain/progress/saveState';
import type { PreparedSavedState } from '@/domain/progress/saveState';
import type { SavedState, StoryNode } from '@/types';
import {
  loadRawString,
  removeFromStorage,
  saveRawString,
  saveToStorage,
  STORAGE_KEYS,
} from '@/utils/storage';

export interface SavedStateStorage {
  /** Reads the raw stored string for a key, or null when absent/unreadable. */
  loadRaw: (key: string) => string | null;
  /** Persists a saved-state envelope; returns false on failure (e.g. quota). */
  save: (key: string, savedState: SavedState) => boolean;
  /** Persists a raw string verbatim (used to quarantine a corrupt save). */
  writeRaw: (key: string, value: string) => boolean;
  /** Removes a key. */
  remove: (key: string) => void;
}

export type ProgressLoadResult =
  | { status: 'empty' }
  | { status: 'invalid'; raw: string }
  | ({ status: 'loaded' } & PreparedSavedState);

export interface ProgressRepository {
  load: (nodes: ReadonlyMap<string, StoryNode>) => ProgressLoadResult;
  save: (savedState: SavedState) => boolean;
  /** Moves a corrupt save's raw bytes to the quarantine slot and clears the primary slot. */
  quarantineCorrupt: (raw: string) => void;
  /** Returns the quarantined corrupt save, or null if none. */
  readQuarantine: () => string | null;
  /** Clears the quarantine slot. */
  clearQuarantine: () => void;
}

/**
 * Creates the saved-progress boundary around an injected storage implementation.
 * The store coordinates state updates; this repository owns the persistence keys,
 * browser-storage access, and conversion of stored data into a prepared save.
 *
 * The repository parses the raw stored string itself (rather than trusting the
 * caller to pre-parse) so it can tell an empty slot apart from a corrupt one:
 * a present-but-unparseable or structurally-invalid blob is reported as
 * `invalid` with its raw bytes, so the store can quarantine and recover it
 * (Phase 7.4) instead of silently starting fresh.
 */
export function createProgressRepository(storage: SavedStateStorage): ProgressRepository {
  return {
    load: (nodes) => {
      const raw = storage.loadRaw(STORAGE_KEYS.SAVED_STATE);
      if (raw === null) {
        return { status: 'empty' };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { status: 'invalid', raw };
      }

      const prepared = prepareSavedState(parsed, nodes);
      if (!prepared) {
        return { status: 'invalid', raw };
      }

      return {
        status: 'loaded',
        ...prepared,
      };
    },
    save: (savedState) => storage.save(STORAGE_KEYS.SAVED_STATE, savedState),
    quarantineCorrupt: (raw) => {
      storage.writeRaw(STORAGE_KEYS.SAVED_STATE_CORRUPT, raw);
      storage.remove(STORAGE_KEYS.SAVED_STATE);
    },
    readQuarantine: () => storage.loadRaw(STORAGE_KEYS.SAVED_STATE_CORRUPT),
    clearQuarantine: () => storage.remove(STORAGE_KEYS.SAVED_STATE_CORRUPT),
  };
}

export const progressRepository = createProgressRepository({
  loadRaw: (key) => loadRawString(key),
  save: (key, savedState) => saveToStorage(key, savedState),
  writeRaw: (key, value) => saveRawString(key, value),
  remove: (key) => removeFromStorage(key),
});
