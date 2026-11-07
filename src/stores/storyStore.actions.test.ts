import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import type { L3Assembly, SelectionReason, StoryNode } from '@/types';
import { buildL3Assembly } from '@/utils/l3Assembly';
import type * as L3AssemblyModule from '@/utils/l3Assembly';

import { useStoryStore } from './storyStore';

// The real assembler runs by default; individual tests override one call to reach the
// store's null-result and thrown-error branches.
vi.mock('@/utils/l3Assembly', async (importOriginal) => {
  const actual = await importOriginal<typeof L3AssemblyModule>();
  return { ...actual, buildL3Assembly: vi.fn(actual.buildL3Assembly) };
});

const STORY_ID = 'eternal-return';
const L1_NODES = ['arch-L1', 'algo-L1', 'hum-L1'];
const L2_NODES = ['arch', 'algo', 'hum'].flatMap((character) =>
  ['accept', 'resist', 'invest'].map((philosophy) => `${character}-L2-${philosophy}`),
);
const L3_NODES = ['arch-L3', 'algo-L3', 'hum-L3'];
const ENDINGS = ['final-preserve', 'final-transform', 'final-release'];
const L3_SECTIONS = ['arch', 'algo', 'hum', 'conv'] as const;

const passageReason: SelectionReason = {
  contract: 'org.narramorph.selection-reason',
  schemaVersion: '1.0.0',
  selectionKind: 'passage-variation',
  outcome: 'exact',
  templateKey: 'selection.first_visit',
  parameters: {},
  triggers: [],
};

function resetStore(): void {
  useStoryStore.setState({
    storyData: null,
    nodes: new Map(),
    connections: new Map(),
    progress: createInitialProgress(),
    preferences: createInitialPreferences(),
    activeVisit: null,
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
      bounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    },
    selectedNode: null,
    hoveredNode: null,
    storyViewOpen: false,
    lastReaderOpenWasRestore: false,
    isAnimating: false,
    lastSaveFailed: false,
    corruptSaveQuarantined: false,
    lastLoadMigrations: [],
    l3AssemblyCache: new Map(),
    l3AssemblyViewOpen: false,
    isGeneratingL3: false,
    currentL3Assembly: null,
    unlockConfigs: new Map(),
    recentlyUnlockedNodes: [],
    announcedUnlockNodes: [],
  });
}

const store = () => useStoryStore.getState();

/** Opens and closes a passage the way the reader does (close clears the camera gate). */
function read(nodeId: string): void {
  store().openStoryView(nodeId);
  store().closeStoryView();
}

/** Every L1 and L2 passage once: all three perspectives, 12 visits, awareness 100. */
function readAllL1AndL2(): void {
  for (const nodeId of [...L1_NODES, ...L2_NODES]) {
    read(nodeId);
  }
}

/**
 * The shortest real path to the L3 unlock: the full L1/L2 pass, then two passages read a
 * third time so they reach their meta-aware state (the `meta-aware-experience` condition).
 */
function readToConvergence(): void {
  readAllL1AndL2();
  for (const nodeId of ['arch-L1', 'arch-L1', 'algo-L1', 'algo-L1']) {
    read(nodeId);
  }
}

function fixtureNode(overrides: Partial<StoryNode> & Pick<StoryNode, 'id'>): StoryNode {
  return {
    character: 'archaeologist',
    layer: 1,
    title: `Title ${overrides.id}`,
    position: { x: 10, y: 20 },
    content: { initial: 'one', firstRevisit: 'two', metaAware: 'three' },
    connections: [],
    visualState: { defaultColor: '#4A90E2', size: 30 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: false },
    ...overrides,
  };
}

beforeEach(() => {
  resetStore();
  localStorage.clear();
  vi.mocked(buildL3Assembly).mockClear();
  // The store logs every transition in development builds; keep test output readable.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadStory', () => {
  it('installs the story graph, unlock configs, viewport, and initial stats', async () => {
    await store().loadStory(STORY_ID);

    const state = store();
    expect(state.storyData?.metadata.id).toBe(STORY_ID);
    for (const nodeId of [...L1_NODES, ...L2_NODES, ...L3_NODES, ...ENDINGS]) {
      expect(state.nodes.has(nodeId), nodeId).toBe(true);
    }
    expect(state.connections.size).toBeGreaterThan(0);
    expect([...state.unlockConfigs.keys()].sort()).toEqual([...L3_NODES, ...ENDINGS].sort());
    expect(state.viewport.bounds.maxX).toBeGreaterThan(state.viewport.bounds.minX);
    expect(state.viewport.center.x).toBe(
      (state.viewport.bounds.minX + state.viewport.bounds.maxX) / 2,
    );
    expect(state.stats.totalNodes).toBe(state.nodes.size);
    expect(state.stats.totalNodesVisited).toBe(0);
  });

  it('rejects an unknown story and leaves the current state untouched', async () => {
    await expect(store().loadStory('no-such-story')).rejects.toThrow();

    expect(store().storyData).toBeNull();
    expect(store().nodes.size).toBe(0);
  });
});

describe('reader navigation', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
  });

  it('opens a passage, records one visit, and starts timing it', () => {
    store().openStoryView('arch-L1', { variationId: 'arch-L1-variation-a' });

    const state = store();
    expect(state.storyViewOpen).toBe(true);
    expect(state.selectedNode).toBe('arch-L1');
    expect(state.lastReaderOpenWasRestore).toBe(false);
    expect(state.isAnimating).toBe(true);
    expect(state.activeVisit?.nodeId).toBe('arch-L1');
    expect(state.progress.visitedNodes['arch-L1']).toMatchObject({
      visitCount: 1,
      duration: 0,
      variationId: 'arch-L1-variation-a',
    });
  });

  it('ignores a click while the camera is still animating', () => {
    store().openStoryView('arch-L1');
    store().openStoryView('algo-L1');

    expect(store().selectedNode).toBe('arch-L1');
    expect(store().progress.visitedNodes['algo-L1']).toBeUndefined();
  });

  it('does not re-record a visit for the passage already open', () => {
    store().openStoryView('arch-L1');
    store().setIsAnimating(false);
    store().openStoryView('arch-L1');

    expect(store().progress.visitedNodes['arch-L1']?.visitCount).toBe(1);
    expect(store().progress.readingPath).toEqual(['arch-L1']);
    expect(store().isAnimating).toBe(false);
  });

  it('finalizes the open visit before moving to another passage', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    store().openStoryView('arch-L1');
    store().setIsAnimating(false);

    now.mockReturnValue(1_065_400);
    store().openStoryView('algo-L1');

    const state = store();
    expect(state.progress.visitedNodes['arch-L1']).toMatchObject({ duration: 65, timeSpent: 65 });
    expect(state.progress.totalTimeSpent).toBe(65);
    expect(state.activeVisit).toEqual({ nodeId: 'algo-L1', startTime: 1_065_400 });
  });

  it('accumulates time across visits and saves when a visit is finalized', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    store().openStoryView('arch-L1');
    now.mockReturnValue(30_000);
    store().closeStoryView();
    now.mockReturnValue(40_000);
    store().openStoryView('arch-L1');
    now.mockReturnValue(52_900);
    store().closeStoryView();

    const state = store();
    expect(state.progress.visitedNodes['arch-L1']).toMatchObject({
      visitCount: 2,
      duration: 12,
      timeSpent: 42,
    });
    expect(state.progress.totalTimeSpent).toBe(42);
    expect(state.activeVisit).toBeNull();
    expect(state.isAnimating).toBe(false);

    const saved = JSON.parse(localStorage.getItem('narramorph-saved-state') ?? '{}') as {
      progress?: { totalTimeSpent?: number };
    };
    expect(saved.progress?.totalTimeSpent).toBe(42);
  });

  it('drops an active visit whose record has gone missing without crashing', () => {
    useStoryStore.setState({ activeVisit: { nodeId: 'arch-L1', startTime: 0 } });

    store().finalizeActiveVisit();

    expect(store().activeVisit).toBeNull();
    expect(store().progress.totalTimeSpent).toBe(0);
  });

  it('treats an L4 ending as a normal passage', () => {
    store().openStoryView('final-release');

    expect(store().storyViewOpen).toBe(true);
    expect(store().progress.visitedNodes['final-release']?.visitCount).toBe(1);
  });

  it('routes an L3 node to the assembly view instead of the story view', async () => {
    readAllL1AndL2();

    store().openStoryView('arch-L3');
    expect(store().isAnimating).toBe(false);
    await vi.waitFor(() => expect(store().l3AssemblyViewOpen).toBe(true));

    expect(store().storyViewOpen).toBe(false);
    expect(store().currentL3Assembly).not.toBeNull();
  });
});

describe('restoreStoryView (Back, Forward, reload, deep link)', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
  });

  it('re-shows a passage without recording a visit and marks the open as a restore', () => {
    read('arch-L1');
    const before = store().progress;

    store().restoreStoryView('arch-L1');

    const state = store();
    expect(state.storyViewOpen).toBe(true);
    expect(state.selectedNode).toBe('arch-L1');
    expect(state.lastReaderOpenWasRestore).toBe(true);
    expect(state.activeVisit).toBeNull();
    expect(state.progress.visitedNodes['arch-L1']?.visitCount).toBe(1);
    expect(state.progress.readingPath).toEqual(before.readingPath);
  });

  it('finalizes a running visit when restoring a different passage', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    store().openStoryView('arch-L1');
    now.mockReturnValue(9_000);

    store().restoreStoryView('algo-L1');

    expect(store().progress.visitedNodes['arch-L1']?.timeSpent).toBe(9);
    expect(store().activeVisit).toBeNull();
    expect(store().selectedNode).toBe('algo-L1');
    expect(store().progress.visitedNodes['algo-L1']).toBeUndefined();
  });

  it('is a no-op for the passage already on screen', () => {
    store().openStoryView('arch-L1');

    store().restoreStoryView('arch-L1');

    expect(store().lastReaderOpenWasRestore).toBe(false);
    expect(store().activeVisit?.nodeId).toBe('arch-L1');
  });

  it('never restores an L3 node or a locked node', () => {
    store().restoreStoryView('arch-L3');
    expect(store().storyViewOpen).toBe(false);

    useStoryStore.setState((state) => {
      state.progress.lockedNodes = ['arch-L1'];
    });
    store().restoreStoryView('arch-L1');
    expect(store().storyViewOpen).toBe(false);
    expect(store().selectedNode).toBeNull();
  });
});

describe('recordActiveVisitSelection', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
  });

  it('snapshots the resolved prose into the visit log and saves', () => {
    store().openStoryView('arch-L1');

    store().recordActiveVisitSelection({
      variationId: 'arch-L1-variation-a',
      passageTitle: 'The Archive',
      content: 'The archive **breathes**.',
      reason: passageReason,
      selectedBeatIds: ['beat-1'],
      bridgeId: 'bridge-7',
      bridgeContent: 'You arrive.',
    });

    const { progress } = store();
    expect(progress.selectionRecords).toHaveLength(1);
    expect(progress.selectionRecords[0]).toMatchObject({
      nodeId: 'arch-L1',
      passageTitle: 'The Archive',
      excerpt: 'The archive breathes.',
      visitNumber: 1,
    });
    expect(progress.visitEvents).toHaveLength(1);
    expect(progress.visitEvents[0]).toMatchObject({
      nodeId: 'arch-L1',
      visitNumber: 1,
      selection: { variationId: 'arch-L1-variation-a', beatIds: ['beat-1'] },
      bridgeId: 'bridge-7',
      bridgeText: { content: 'You arrive.' },
      resolvedText: { content: 'The archive **breathes**.' },
    });
    expect(progress.visitedNodes['arch-L1']?.variationId).toBe('arch-L1-variation-a');

    const saved = JSON.parse(localStorage.getItem('narramorph-saved-state') ?? '{}') as {
      progress?: { selectionRecords?: unknown[] };
    };
    expect(saved.progress?.selectionRecords).toHaveLength(1);
  });

  it('does nothing when no passage is open', () => {
    store().recordActiveVisitSelection({
      variationId: 'x',
      passageTitle: 'Nowhere',
      content: 'Nothing.',
      reason: passageReason,
    });

    expect(store().progress.selectionRecords).toEqual([]);
    expect(store().progress.visitEvents).toEqual([]);
  });

  it('does nothing when the open passage has no visit record', () => {
    useStoryStore.setState({ activeVisit: { nodeId: 'arch-L1', startTime: 0 } });

    store().recordActiveVisitSelection({
      variationId: 'x',
      passageTitle: 'Orphan',
      content: 'Nothing.',
      reason: passageReason,
    });

    expect(store().progress.selectionRecords).toEqual([]);
  });
});

describe('L3 convergence', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
  });

  it('keeps L3 locked after one pass, until two passages reach meta-awareness', () => {
    readAllL1AndL2();

    expect(store().progress.temporalAwarenessLevel).toBe(100);
    expect(store().canVisitNode('arch-L3')).toBe(false);
    expect(store().getUnlockProgress('arch-L3')).toMatchObject({
      locked: true,
      conditionsNotMet: ['meta-aware-experience'],
    });
    expect(store().recentlyUnlockedNodes).toEqual([]);

    for (const nodeId of ['arch-L1', 'arch-L1', 'algo-L1', 'algo-L1']) {
      read(nodeId);
    }

    expect(store().recentlyUnlockedNodes).toEqual(L3_NODES);
    expect(store().canVisitNode('arch-L3')).toBe(true);
    expect(store().getUnlockProgress('arch-L3')?.locked).toBe(false);
    expect(store().canVisitNode('final-preserve')).toBe(false);

    store().clearUnlockNotifications();
    expect(store().recentlyUnlockedNodes).toEqual([]);
  });

  it('crystallizes the journey on the first L3 view: every L1 and L2 node locks', async () => {
    readAllL1AndL2();

    await store().openL3AssemblyView('arch-L3');

    const state = store();
    expect(state.progress.l3ConvergenceTriggered).toBe(true);
    expect([...(state.progress.lockedNodes ?? [])].sort()).toEqual(
      [...L1_NODES, ...L2_NODES].sort(),
    );
    expect(state.l3AssemblyViewOpen).toBe(true);
    expect(state.storyViewOpen).toBe(false);
    expect(state.activeVisit?.nodeId).toBe('arch-L3');
    expect(state.progress.visitedNodes['arch-L3']).toMatchObject({
      visitCount: 1,
      variationId: null,
    });
    expect(state.progress.l3AssembliesViewed).toHaveLength(1);
    expect(state.progress.l3AssembliesViewed?.[0]?.sectionsRead).toEqual({
      arch: false,
      algo: false,
      hum: false,
      conv: false,
    });

    // The gate is one-way: locked passages can no longer be visited, opened, or restored.
    expect(state.canVisitNode('arch-L1')).toBe(false);
    store().closeL3AssemblyView();
    store().openStoryView('arch-L1');
    expect(store().storyViewOpen).toBe(false);
    store().restoreStoryView('arch-L1');
    expect(store().storyViewOpen).toBe(false);
    expect(store().isAnimating).toBe(false);
    expect(store().progress.visitedNodes['arch-L1']?.visitCount).toBe(1);
  });

  it('reuses the cached assembly and does not lock or log the same view twice', async () => {
    readAllL1AndL2();
    await store().openL3AssemblyView('arch-L3');
    const firstAssembly = store().currentL3Assembly;
    const lockedCount = store().progress.lockedNodes?.length;
    store().closeL3AssemblyView();

    await store().openL3AssemblyView();

    expect(buildL3Assembly).toHaveBeenCalledTimes(1);
    expect(store().currentL3Assembly).toBe(firstAssembly);
    expect(store().progress.lockedNodes).toHaveLength(lockedCount ?? -1);
    expect(store().progress.l3AssembliesViewed).toHaveLength(1);
  });

  it('keeps timing the visit when the open L3 node is opened again', async () => {
    readAllL1AndL2();
    const now = vi.spyOn(Date, 'now').mockReturnValue(100_000);
    await store().openL3AssemblyView('arch-L3');

    now.mockReturnValue(130_000);
    await store().openL3AssemblyView('arch-L3');
    now.mockReturnValue(160_000);
    store().closeL3AssemblyView();

    const visit = store().progress.visitedNodes['arch-L3'];
    expect(visit?.visitCount).toBe(1);
    expect(visit?.timeSpent).toBe(60);
    expect(store().activeVisit).toBeNull();
  });

  it('closing keeps the assembly for reference and finalizes the visit', async () => {
    readAllL1AndL2();
    await store().openL3AssemblyView('arch-L3');

    store().closeL3AssemblyView();

    expect(store().l3AssemblyViewOpen).toBe(false);
    expect(store().currentL3Assembly).not.toBeNull();
    expect(store().activeVisit).toBeNull();
  });

  it('unlocks the three endings once all four sections are read', async () => {
    readToConvergence();
    await store().openL3AssemblyView('arch-L3');
    expect(store().getUnlockProgress('final-preserve')).toMatchObject({
      locked: true,
      conditionsNotMet: ['l3-completion'],
    });

    for (const section of L3_SECTIONS) {
      store().markL3SectionRead(section);
    }

    // The endings join the L3 unlocks already queued; nothing is announced twice.
    expect(store().recentlyUnlockedNodes).toEqual([...L3_NODES, ...ENDINGS]);
    expect(store().progress.l3AssembliesViewed?.[0]?.sectionsRead).toEqual({
      arch: true,
      algo: true,
      hum: true,
      conv: true,
    });
    expect(store().getUnlockProgress('final-preserve')?.locked).toBe(false);
    expect(store().canVisitNode('final-transform')).toBe(true);
  });

  it('announces each unlock once, even after the notice is dismissed', async () => {
    readToConvergence();
    expect(store().recentlyUnlockedNodes).toEqual(L3_NODES);

    store().clearUnlockNotifications(); // the notice closed, or dismissed itself after 8 s
    read('hum-L1');
    read('hum-L2-accept');
    expect(store().recentlyUnlockedNodes).toEqual([]);

    await store().openL3AssemblyView('arch-L3');
    for (const section of L3_SECTIONS) {
      store().markL3SectionRead(section);
    }
    expect(store().recentlyUnlockedNodes).toEqual(ENDINGS);
  });

  it('does not re-announce unlocks after a reload, but still announces new ones', async () => {
    readToConvergence(); // every visit saves to localStorage

    // Reload: in-memory state is gone, the save remains, and Home runs loadStory then loadProgress.
    resetStore();
    await store().loadStory(STORY_ID);
    store().loadProgress();

    expect(store().progress.readingPath).toHaveLength(16);
    expect(store().canVisitNode('arch-L3')).toBe(true);
    expect(store().recentlyUnlockedNodes).toEqual([]);

    read('hum-L1');
    expect(store().recentlyUnlockedNodes).toEqual([]);

    await store().openL3AssemblyView('arch-L3');
    for (const section of L3_SECTIONS) {
      store().markL3SectionRead(section);
    }
    expect(store().recentlyUnlockedNodes).toEqual(ENDINGS);
  });

  it('does not announce the unlocks an imported save already has', () => {
    readToConvergence();
    const save = store().exportProgress();
    store().clearProgress();
    expect(store().canVisitNode('arch-L3')).toBe(false);

    expect(store().importProgress(save)).toMatchObject({ ok: true });
    read('hum-L1');

    expect(store().canVisitNode('arch-L3')).toBe(true);
    expect(store().recentlyUnlockedNodes).toEqual([]);
  });

  it('announces the unlocks again on a new journey', () => {
    readToConvergence();
    store().clearUnlockNotifications();

    store().clearProgress();
    expect(store().recentlyUnlockedNodes).toEqual([]);
    readToConvergence();

    expect(store().recentlyUnlockedNodes).toEqual(L3_NODES);
  });

  it('ignores re-reading a section and reading before any assembly was viewed', async () => {
    store().markL3SectionRead('arch');
    expect(store().progress.l3AssembliesViewed ?? []).toEqual([]);

    readAllL1AndL2();
    await store().openL3AssemblyView('arch-L3');
    store().markL3SectionRead('arch');
    const savedAfterFirst = localStorage.getItem('narramorph-saved-state');

    store().markL3SectionRead('arch');

    expect(localStorage.getItem('narramorph-saved-state')).toBe(savedAfterFirst);
  });

  it('leaves the map open and unlocked when no assembly can be built', async () => {
    readAllL1AndL2();
    vi.mocked(buildL3Assembly).mockResolvedValueOnce(null);

    await store().openL3AssemblyView('arch-L3');

    const state = store();
    expect(state.l3AssemblyViewOpen).toBe(false);
    expect(state.isGeneratingL3).toBe(false);
    expect(state.progress.l3ConvergenceTriggered ?? false).toBe(false);
    expect(state.progress.lockedNodes ?? []).toEqual([]);
    expect(state.l3AssemblyCache.size).toBe(0);
  });

  it('recovers from an assembler error without caching a result', async () => {
    readAllL1AndL2();
    vi.mocked(buildL3Assembly).mockRejectedValueOnce(new Error('variation file missing'));

    await expect(store().getOrBuildL3Assembly()).resolves.toBeNull();

    expect(store().isGeneratingL3).toBe(false);
    expect(store().l3AssemblyCache.size).toBe(0);
  });

  it('rebuilds after the cache is cleared', async () => {
    readAllL1AndL2();
    await store().getOrBuildL3Assembly();
    store().clearL3AssemblyCache();

    await store().getOrBuildL3Assembly();

    expect(buildL3Assembly).toHaveBeenCalledTimes(2);
    expect(store().l3AssemblyCache.size).toBe(1);
  });

  it('caches one assembly per awareness band, using the assembler’s own banding', async () => {
    read('arch-L1'); // one perspective, one visit: awareness 24
    const low = await store().getOrBuildL3Assembly();
    read('algo-L1'); // two perspectives, two visits: awareness 48
    const medium = await store().getOrBuildL3Assembly();

    expect(store().progress.temporalAwarenessLevel).toBe(48);
    expect(low?.metadata.awarenessLevel).toBe('low');
    expect(medium?.metadata.awarenessLevel).toBe('medium');
    expect(buildL3Assembly).toHaveBeenCalledTimes(2);
    expect(store().l3AssemblyCache.size).toBe(2);
  });

  it('builds an uncached assembly directly for the current journey', async () => {
    readAllL1AndL2();

    const assembly = await store().buildL3Assembly();

    expect(assembly?.metadata.awarenessLevel).toBe('high');
    expect(store().l3AssemblyCache.size).toBe(0);
  });
});

describe('L3 assembly without a loaded story', () => {
  it('returns null from both builders', async () => {
    await expect(store().buildL3Assembly()).resolves.toBeNull();
    await expect(store().getOrBuildL3Assembly()).resolves.toBeNull();
    expect(buildL3Assembly).not.toHaveBeenCalled();
  });
});

describe('trackL3AssemblyView', () => {
  const assembly = {
    metadata: {
      journeyPattern: 'started-stayed',
      pathPhilosophy: 'accept',
      awarenessLevel: 'medium',
      synthesisPattern: 'single-dominant',
    },
  } as unknown as L3Assembly;

  it('logs a new view, then refreshes the timestamp of the same view', () => {
    const now = vi.spyOn(Date.prototype, 'toISOString');
    now.mockReturnValue('2026-11-07T10:00:00.000Z');
    store().trackL3AssemblyView(assembly);
    now.mockReturnValue('2026-11-07T11:00:00.000Z');
    store().trackL3AssemblyView(assembly);

    expect(store().progress.l3AssembliesViewed).toEqual([
      expect.objectContaining({
        viewedAt: '2026-11-07T11:00:00.000Z',
        journeyPattern: 'started-stayed',
        awarenessLevel: 'medium',
      }),
    ]);
  });

  it('logs a different assembly as a separate view', () => {
    store().trackL3AssemblyView(assembly);
    store().trackL3AssemblyView({
      ...assembly,
      metadata: { ...assembly.metadata, pathPhilosophy: 'resist' },
    });

    expect(store().progress.l3AssembliesViewed).toHaveLength(2);
  });
});

describe('canVisitNode', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
  });

  it('opens a character’s L2 passages only after its L1 passage is read', () => {
    expect(store().canVisitNode('arch-L1')).toBe(true);
    expect(store().canVisitNode('arch-L2-accept')).toBe(false);

    read('arch-L1');

    expect(store().canVisitNode('arch-L2-accept')).toBe(true);
    expect(store().canVisitNode('algo-L2-accept')).toBe(false);
  });

  it('refuses unknown nodes', () => {
    expect(store().canVisitNode('arch-L9-ghost')).toBe(false);
  });

  it('allows a known node outside the perspective naming scheme', () => {
    useStoryStore.setState((state) => {
      state.nodes.set(
        'interlude',
        fixtureNode({ id: 'interlude', character: 'multi-perspective' }),
      );
    });

    expect(store().canVisitNode('interlude')).toBe(true);
  });

  it('returns null unlock progress for a node without an unlock config', () => {
    expect(store().getUnlockProgress('arch-L1')).toBeNull();
  });
});

describe('selectors and small actions', () => {
  it('reports node highlight state from selection and hover', () => {
    const node = fixtureNode({ id: 'arch-fixture', position: { x: 4, y: 5 } });
    useStoryStore.setState({ nodes: new Map([[node.id, node]]) });

    store().selectNode('arch-fixture');
    expect(store().getNodeState('arch-fixture')).toMatchObject({
      position: { x: 4, y: 5 },
      highlighted: true,
      visualProperties: { glow: true, pulse: false, color: '#cccccc', opacity: 0.6 },
    });

    store().selectNode(null);
    store().setHoveredNode('arch-fixture');
    expect(store().getNodeState('arch-fixture')).toMatchObject({
      highlighted: true,
      visualProperties: { glow: false, pulse: true },
    });
    expect(store().hoveredNode).toBe('arch-fixture');
  });

  it('returns a neutral state for an unknown node', () => {
    expect(store().getNodeState('missing')).toMatchObject({
      id: 'missing',
      visited: false,
      visitCount: 0,
      visualProperties: { color: '#cccccc', opacity: 0.5 },
    });
  });

  it('shows a connection only after it is unlocked, and animates only visible ones', async () => {
    await store().loadStory(STORY_ID);
    const [connectionId, connection] = [...store().connections.entries()][0]!;

    expect(store().getConnectionState(connectionId)).toMatchObject({
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      visible: false,
      animated: false,
    });

    useStoryStore.setState((state) => {
      state.progress.unlockedConnections.push(connectionId);
    });
    expect(store().getConnectionState(connectionId)).toMatchObject({
      visible: true,
      animated: connection.visualProperties.animated,
    });
  });

  it('returns a hidden placeholder for an unknown connection', () => {
    expect(store().getConnectionState('missing')).toMatchObject({
      id: 'missing',
      visible: false,
      sourceId: '',
      targetId: '',
    });
  });

  it('lists transformations ready to unlock and nodes that can still deepen', () => {
    const anchor = fixtureNode({ id: 'arch-anchor' });
    const echo = fixtureNode({
      id: 'algo-echo',
      character: 'algorithm',
      unlockConditions: {
        specialTransforms: [
          { id: 'resonance', requiredPriorNodes: ['arch-anchor'], transformText: 'Echo.' },
          { id: 'distant', requiredPriorNodes: ['hum-unvisited'], transformText: 'Later.' },
          { id: 'claimed', requiredPriorNodes: [], transformText: 'Already seen.' },
        ],
      },
    });
    const settled = fixtureNode({ id: 'hum-settled', character: 'last-human' });
    useStoryStore.setState((state) => {
      state.nodes = new Map([
        [anchor.id, anchor],
        [echo.id, echo],
        [settled.id, settled],
      ]);
      const visit = (currentState: 'initial' | 'metaAware') => ({
        visitCount: 1,
        visitTimestamps: [],
        currentState,
        timeSpent: 0,
        lastVisited: '2026-11-07T00:00:00.000Z',
      });
      state.progress.visitedNodes = {
        'arch-anchor': visit('initial'),
        'algo-echo': visit('initial'),
        'hum-settled': visit('metaAware'),
        'orphan-record': visit('initial'),
      };
      state.progress.specialTransformations = [
        {
          nodeId: 'algo-echo',
          transformationId: 'claimed',
          unlockedAt: '2026-11-07T00:00:00.000Z',
        },
      ];
    });

    expect(store().getAvailableTransformations().sort()).toEqual(
      ['algo-echo', 'algo-echo:resonance', 'arch-anchor'].sort(),
    );
  });

  it('unlocks a special transformation once, after its prior passages are read', () => {
    const anchor = fixtureNode({ id: 'arch-anchor' });
    const echo = fixtureNode({
      id: 'algo-echo',
      character: 'algorithm',
      unlockConditions: {
        specialTransforms: [
          { id: 'resonance', requiredPriorNodes: ['arch-anchor'], transformText: 'Echo.' },
        ],
      },
    });
    useStoryStore.setState({
      nodes: new Map([
        [anchor.id, anchor],
        [echo.id, echo],
      ]),
    });

    store().visitNode('algo-echo');
    expect(store().progress.specialTransformations).toEqual([]);

    store().visitNode('arch-anchor');
    expect(store().progress.specialTransformations).toEqual([
      expect.objectContaining({ nodeId: 'algo-echo', transformationId: 'resonance' }),
    ]);

    // Node states are recomputed before new transformations are recorded, so the echo
    // passage shows its transformed state from the following visit onward.
    store().visitNode('arch-anchor');
    expect(store().progress.specialTransformations).toHaveLength(1);
    expect(store().progress.visitedNodes['algo-echo']?.currentState).toBe('metaAware');
  });

  it('leaves a fresh journey untouched when there is no save', () => {
    const before = store().progress;

    store().loadProgress();

    expect(store().progress).toBe(before);
    expect(store().corruptSaveQuarantined).toBe(false);
    expect(store().lastLoadMigrations).toEqual([]);
  });

  it('counts each perspective and the critical path in reading stats', () => {
    const nodes = [
      fixtureNode({
        id: 'arch-a',
        metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: true },
      }),
      fixtureNode({ id: 'algo-a', character: 'algorithm' }),
      fixtureNode({ id: 'hum-a', character: 'last-human' }),
      fixtureNode({ id: 'hum-b', character: 'last-human' }),
      fixtureNode({ id: 'conv-a', character: 'multi-perspective', layer: 3 }),
    ];
    useStoryStore.setState({ nodes: new Map(nodes.map((node) => [node.id, node])) });
    for (const nodeId of ['arch-a', 'algo-a', 'hum-a', 'conv-a']) {
      store().visitNode(nodeId);
    }
    useStoryStore.setState((state) => {
      state.progress.totalTimeSpent = 120;
    });

    store().updateStats();

    expect(store().stats).toMatchObject({
      totalNodes: 5,
      totalNodesVisited: 4,
      percentageExplored: 80,
      averageTimePerNode: 30,
      criticalPathNodesTotal: 1,
      criticalPathNodesVisited: 1,
      characterBreakdown: {
        archaeologist: { visited: 1, total: 1 },
        algorithm: { visited: 1, total: 1 },
        lastHuman: { visited: 1, total: 2 },
      },
    });
  });

  it('reports zeroed stats for an empty story', () => {
    store().updateStats();

    expect(store().stats).toMatchObject({ percentageExplored: 0, averageTimePerNode: 0 });
  });

  it('counts L2 philosophy choices in journey tracking', () => {
    store().recordL2Choice('resist');
    store().recordL2Choice('resist');
    store().recordL2Choice('invest');

    expect(store().progress.journeyTracking.l2Choices).toEqual({ accept: 0, resist: 2, invest: 1 });
  });

  it('merges a partial viewport update', () => {
    store().updateViewport({ zoom: 2.5 });

    expect(store().viewport.zoom).toBe(2.5);
    expect(store().viewport.center).toEqual({ x: 0, y: 0 });
  });

  it('saves preference changes immediately', () => {
    store().updatePreferences({ textSize: 'large' });

    expect(store().preferences.textSize).toBe('large');
    const saved = JSON.parse(localStorage.getItem('narramorph-saved-state') ?? '{}') as {
      preferences?: { textSize?: string };
    };
    expect(saved.preferences?.textSize).toBe('large');
  });

  it('includes the visit count in the condition context for a node', async () => {
    await store().loadStory(STORY_ID);
    read('arch-L1');
    read('arch-L1');

    const context = store().getConditionContext('arch-L1');
    expect(context.nodeId).toBe('arch-L1');
    expect(context.visitCount).toBe(2);
  });
});

describe('journey exports', () => {
  beforeEach(async () => {
    await store().loadStory(STORY_ID);
    store().openStoryView('arch-L1');
    store().recordActiveVisitSelection({
      variationId: 'arch-L1-variation-a',
      passageTitle: 'The Archive',
      content: 'The archive breathes.',
      reason: passageReason,
    });
  });

  it('titles the Markdown export from the loaded story and includes adaptation notes', () => {
    const markdown = store().exportJourneyMarkdown('2026-11-07T12:00:00.000Z');

    expect(markdown.startsWith(`# ${store().storyData?.metadata.title} — your journey`)).toBe(true);
    expect(markdown).toContain('The archive breathes.');
    expect(markdown).toContain('> ');
  });

  it('omits adaptation notes when the reader turned them off', () => {
    store().updatePreferences({ includeAdaptationNotesInExport: false });

    const markdown = store().exportJourneyMarkdown('2026-11-07T12:00:00.000Z');

    expect(markdown).toContain('The archive breathes.');
    expect(markdown).not.toMatch(/^> /m);
  });

  it('builds a printable HTML export of the same journey', () => {
    const html = store().exportJourneyPrintHtml('2026-11-07T12:00:00.000Z');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('The archive breathes.');
  });

  it('falls back to the product name when no story is loaded', () => {
    useStoryStore.setState({ storyData: null });

    expect(store().exportJourneyMarkdown('2026-11-07T12:00:00.000Z')).toMatch(
      /^# Narramorph — your journey/,
    );
  });
});
