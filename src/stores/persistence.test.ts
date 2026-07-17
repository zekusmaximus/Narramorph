import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import { buildSavedState, serializeSavedState } from '@/domain/progress/saveState';
import { STORAGE_KEYS } from '@/utils/storage';

import { useStoryStore } from './storyStore';

/** A minimal legacy (v1.0.0) save: no appVersion/storyPackage, no post-1.0 progress fields. */
function legacySaveJson(): string {
  return JSON.stringify({
    version: '1.0.0',
    timestamp: '2026-07-12T00:00:00.000Z',
    progress: {
      visitedNodes: {},
      readingPath: [],
      unlockedConnections: [],
      specialTransformations: [],
      totalTimeSpent: 0,
      lastActiveTimestamp: '2026-07-12T00:00:00.000Z',
    },
    preferences: {
      theme: 'dark',
      textSize: 'medium',
      reduceMotion: false,
      showTutorial: true,
      showReadingStats: true,
    },
  });
}

function resetStore(): void {
  useStoryStore.setState({
    nodes: new Map(),
    progress: createInitialProgress(),
    preferences: createInitialPreferences(),
    lastSaveFailed: false,
    corruptSaveQuarantined: false,
    lastLoadMigrations: [],
    selectedNode: null,
    hoveredNode: null,
    storyViewOpen: false,
  });
}

describe('Phase 7.4 persistence, recovery, and control', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('importProgress (migration-aware)', () => {
    it('imports a current save and reports no migrations', () => {
      const progress = createInitialProgress();
      progress.readingPath = ['arch-L1'];
      const json = serializeSavedState(
        buildSavedState(progress, createInitialPreferences(), '2026-07-12T00:00:00.000Z'),
      );

      const result = useStoryStore.getState().importProgress(json);

      expect(result).toEqual({ ok: true, migrations: [] });
      expect(useStoryStore.getState().progress.readingPath).toEqual(['arch-L1']);
    });

    it('migrates an older-schema save on import (unlike the pre-7.4 bypass)', () => {
      const result = useStoryStore.getState().importProgress(legacySaveJson());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.migrations).toContain('visit-events');
        expect(result.migrations).toContain('selection-records');
      }
      // Reconstructed fields the legacy save lacked:
      expect(useStoryStore.getState().progress.visitEvents).toEqual([]);
      expect(useStoryStore.getState().progress.selectionRecords).toEqual([]);
      expect(useStoryStore.getState().progress.l3ConvergenceTriggered).toBe(false);
    });

    it('rejects unparseable data without touching the current journey', () => {
      useStoryStore.setState({
        progress: { ...createInitialProgress(), readingPath: ['keep-me'] },
      });

      const result = useStoryStore.getState().importProgress('{ not json');

      expect(result).toEqual({ ok: false, reason: 'parse' });
      expect(useStoryStore.getState().progress.readingPath).toEqual(['keep-me']);
    });

    it('rejects structurally invalid data as invalid', () => {
      useStoryStore.setState({
        progress: { ...createInitialProgress(), readingPath: ['keep-me'] },
      });

      const result = useStoryStore.getState().importProgress(JSON.stringify({ hello: 'world' }));

      expect(result).toEqual({ ok: false, reason: 'invalid' });
      expect(useStoryStore.getState().progress.readingPath).toEqual(['keep-me']);
    });
  });

  describe('corrupt-save recovery (loadProgress)', () => {
    it('quarantines an unreadable save, starts clean, and keeps the raw bytes retrievable', () => {
      localStorage.setItem(STORAGE_KEYS.SAVED_STATE, '{ corrupt');

      useStoryStore.getState().loadProgress();

      const state = useStoryStore.getState();
      expect(state.corruptSaveQuarantined).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.SAVED_STATE)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SAVED_STATE_CORRUPT)).toBe('{ corrupt');
      expect(state.readQuarantinedSave()).toBe('{ corrupt');
    });

    it('dismissing the corrupt notice clears the quarantine slot', () => {
      localStorage.setItem(STORAGE_KEYS.SAVED_STATE, '{ corrupt');
      useStoryStore.getState().loadProgress();

      useStoryStore.getState().dismissCorruptSaveNotice();

      expect(useStoryStore.getState().corruptSaveQuarantined).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.SAVED_STATE_CORRUPT)).toBeNull();
    });

    it('records migrations applied on a real load and lets the reader dismiss the notice', () => {
      localStorage.setItem(STORAGE_KEYS.SAVED_STATE, legacySaveJson());

      useStoryStore.getState().loadProgress();

      expect(useStoryStore.getState().lastLoadMigrations.length).toBeGreaterThan(0);
      useStoryStore.getState().dismissMigrationNotice();
      expect(useStoryStore.getState().lastLoadMigrations).toEqual([]);
    });
  });

  describe('storage-quota signal (saveProgress)', () => {
    it('flags a failed save and clears the flag on the next successful save', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new Error('storage is full');
        error.name = 'QuotaExceededError';
        throw error;
      });

      useStoryStore.getState().saveProgress();
      expect(useStoryStore.getState().lastSaveFailed).toBe(true);

      spy.mockRestore();
      useStoryStore.getState().saveProgress();
      expect(useStoryStore.getState().lastSaveFailed).toBe(false);
    });

    it('dismissSaveFailureNotice clears the flag', () => {
      useStoryStore.setState({ lastSaveFailed: true });
      useStoryStore.getState().dismissSaveFailureNotice();
      expect(useStoryStore.getState().lastSaveFailed).toBe(false);
    });
  });

  describe('new journey (clearProgress) keeps reading preferences', () => {
    it('resets progress but preserves preferences', () => {
      useStoryStore.setState({
        progress: { ...createInitialProgress(), readingPath: ['arch-L1', 'algo-L1'] },
        preferences: { ...createInitialPreferences(), theme: 'sepia', lineHeight: 'relaxed' },
      });

      useStoryStore.getState().clearProgress();

      const state = useStoryStore.getState();
      expect(state.progress.readingPath).toEqual([]);
      expect(state.preferences.theme).toBe('sepia');
      expect(state.preferences.lineHeight).toBe('relaxed');
    });
  });
});
