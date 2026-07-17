import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/utils/validation');

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import { buildSavedState, serializeSavedState } from '@/domain/progress/saveState';
import type { SavedState, UserProgress } from '@/types';
import { STORAGE_KEYS } from '@/utils/storage';

import { createProgressRepository } from './progressRepository';
import type { SavedStateStorage } from './progressRepository';

interface FakeStorage extends SavedStateStorage {
  written: Record<string, string>;
  removed: string[];
}

function createStorage(rawByKey: Record<string, string> = {}, saveResult = true): FakeStorage {
  const written: Record<string, string> = {};
  const removed: string[] = [];
  return {
    written,
    removed,
    loadRaw: vi.fn((key: string) => rawByKey[key] ?? written[key] ?? null),
    save: vi.fn(() => saveResult),
    writeRaw: vi.fn((key: string, value: string) => {
      written[key] = value;
      return true;
    }),
    remove: vi.fn((key: string) => {
      removed.push(key);
      delete rawByKey[key];
      delete written[key];
    }),
  };
}

function createSavedState(): SavedState {
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
    const repository = createProgressRepository(createStorage({}, false));

    expect(repository.save(createSavedState())).toBe(false);
  });

  it('reports an empty storage slot', () => {
    const storage = createStorage();
    expect(createProgressRepository(storage).load(new Map())).toEqual({ status: 'empty' });
    expect(storage.loadRaw).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE);
  });

  it('reports structurally invalid saved data as invalid with its raw bytes', () => {
    const raw = JSON.stringify({ version: '1.0.0' });
    const repository = createProgressRepository(createStorage({ [STORAGE_KEYS.SAVED_STATE]: raw }));

    expect(repository.load(new Map())).toEqual({ status: 'invalid', raw });
  });

  it('reports a non-JSON (corrupt) blob as invalid with its raw bytes', () => {
    const raw = '{ this is not json';
    const repository = createProgressRepository(createStorage({ [STORAGE_KEYS.SAVED_STATE]: raw }));

    expect(repository.load(new Map())).toEqual({ status: 'invalid', raw });
  });

  it('returns validated current saved state without migrations', () => {
    const savedState = createSavedState();
    const repository = createProgressRepository(
      createStorage({ [STORAGE_KEYS.SAVED_STATE]: serializeSavedState(savedState) }),
    );

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
    const repository = createProgressRepository(
      createStorage({ [STORAGE_KEYS.SAVED_STATE]: serializeSavedState(savedState) }),
    );

    const result = repository.load(new Map());

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.migrations).toEqual(['l3-convergence']);
      expect(result.savedState.progress.l3ConvergenceTriggered).toBe(false);
      expect(result.savedState.progress.lockedNodes).toEqual([]);
    }
  });

  it('quarantines a corrupt save and clears the primary slot', () => {
    const raw = '{ corrupt';
    const storage = createStorage({ [STORAGE_KEYS.SAVED_STATE]: raw });
    const repository = createProgressRepository(storage);

    repository.quarantineCorrupt(raw);

    expect(storage.writeRaw).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE_CORRUPT, raw);
    expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE);
    expect(repository.readQuarantine()).toBe(raw);
  });

  it('clears the quarantine slot on request', () => {
    const raw = '{ corrupt';
    const storage = createStorage();
    const repository = createProgressRepository(storage);

    repository.quarantineCorrupt(raw);
    repository.clearQuarantine();

    expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.SAVED_STATE_CORRUPT);
    expect(repository.readQuarantine()).toBeNull();
  });
});
