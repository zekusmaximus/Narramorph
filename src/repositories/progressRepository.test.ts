import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/utils/validation');

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import { buildSavedState } from '@/domain/progress/saveState';
import type { UserProgress } from '@/types';
import { STORAGE_KEYS } from '@/utils/storage';

import { createProgressRepository } from './progressRepository';
import type { SavedStateStorage } from './progressRepository';

function createStorage(stored: unknown | null = null, saveResult = true): SavedStateStorage {
  return {
    load: vi.fn(() => stored),
    save: vi.fn(() => saveResult),
  };
}

function createSavedState() {
  return buildSavedState(
    createInitialProgress(),
    createInitialPreferences(),
    '2026-07-12T12:00:00.000Z',
  );
}

describe('progress repository', () => {
  it('saves through the fixed saved-state storage key', () => {
    const storage = createStorage();
    const repository = createProgressRepository(storage);
    const savedState = createSavedState();

    expect(repository.save(savedState)).toBe(true);
    expect(storage.save).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE, savedState);
  });

  it('propagates storage save failures', () => {
    const repository = createProgressRepository(createStorage(null, false));

    expect(repository.save(createSavedState())).toBe(false);
  });

  it('distinguishes an empty storage slot from invalid saved data', () => {
    const emptyStorage = createStorage();
    const invalidStorage = createStorage({ version: '1.0.0' });

    expect(createProgressRepository(emptyStorage).load(new Map())).toEqual({ status: 'empty' });
    expect(createProgressRepository(invalidStorage).load(new Map())).toEqual({
      status: 'invalid',
    });
    expect(emptyStorage.load).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE);
    expect(invalidStorage.load).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE);
  });

  it('returns validated current saved state without migrations', () => {
    const savedState = createSavedState();
    const repository = createProgressRepository(createStorage(savedState));

    expect(repository.load(new Map())).toEqual({
      status: 'loaded',
      savedState,
      migrations: [],
    });
  });

  it('returns migration metadata for legacy saved state', () => {
    const savedState = createSavedState();
    delete (savedState.progress as Partial<UserProgress>).l3ConvergenceTriggered;
    delete (savedState.progress as Partial<UserProgress>).lockedNodes;
    const repository = createProgressRepository(createStorage(savedState));

    const result = repository.load(new Map());

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.migrations).toEqual(['l3-convergence']);
      expect(result.savedState.progress.l3ConvergenceTriggered).toBe(false);
      expect(result.savedState.progress.lockedNodes).toEqual([]);
    }
  });
});
