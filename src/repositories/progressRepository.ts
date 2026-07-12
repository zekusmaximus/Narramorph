import { prepareSavedState } from '@/domain/progress/saveState';
import type { PreparedSavedState } from '@/domain/progress/saveState';
import type { SavedState, StoryNode } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';

export interface SavedStateStorage {
  load: (key: string) => unknown | null;
  save: (key: string, savedState: SavedState) => boolean;
}

export type ProgressLoadResult =
  | { status: 'empty' }
  | { status: 'invalid' }
  | ({ status: 'loaded' } & PreparedSavedState);

export interface ProgressRepository {
  load: (nodes: ReadonlyMap<string, StoryNode>) => ProgressLoadResult;
  save: (savedState: SavedState) => boolean;
}

/**
 * Creates the saved-progress boundary around an injected storage implementation.
 * The store coordinates state updates; this repository owns the persistence key,
 * browser-storage access, and conversion of stored data into a prepared save.
 */
export function createProgressRepository(storage: SavedStateStorage): ProgressRepository {
  return {
    load: (nodes) => {
      const stored = storage.load(STORAGE_KEYS.SAVED_STATE);
      if (!stored) {
        return { status: 'empty' };
      }

      const prepared = prepareSavedState(stored, nodes);
      if (!prepared) {
        return { status: 'invalid' };
      }

      return {
        status: 'loaded',
        ...prepared,
      };
    },
    save: (savedState) => storage.save(STORAGE_KEYS.SAVED_STATE, savedState),
  };
}

export const progressRepository = createProgressRepository({
  load: (key) => loadFromStorage<unknown>(key),
  save: (key, savedState) => saveToStorage(key, savedState),
});
