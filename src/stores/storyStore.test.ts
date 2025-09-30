import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStoryStore } from './storyStore';
import type { StoryNode } from '@/types';

// Mock the storage utilities
vi.mock('@/utils/storage', () => ({
  saveToStorage: vi.fn(() => true),
  loadFromStorage: vi.fn(() => null),
  STORAGE_KEYS: {
    SAVED_STATE: 'narramorph-saved-state',
  },
}));

vi.mock('@/utils/validation', () => ({
  validateSavedState: vi.fn(() => true),
}));

describe('Visit Tracking System', () => {
  beforeEach(() => {
    // Reset store state
    useStoryStore.setState({
      nodes: new Map(),
      connections: new Map(),
      progress: {
        visitedNodes: {},
        readingPath: [],
        unlockedConnections: [],
        specialTransformations: [],
        totalTimeSpent: 0,
        lastActiveTimestamp: new Date().toISOString(),
      },
    });
  });

  it('should create visit record on first node visit', () => {
    const store = useStoryStore.getState();

    // Add a test node
    const testNode: StoryNode = {
      id: 'test-001',
      character: 'archaeologist',
      title: 'Test Node',
      position: { x: 100, y: 200 },
      content: {
        initial: 'Initial content',
        firstRevisit: 'First revisit content',
        metaAware: 'Meta aware content',
      },
      connections: [],
      visualState: {
        defaultColor: '#4A90E2',
        size: 30,
      },
      metadata: {
        estimatedReadTime: 3,
        thematicTags: ['test'],
        narrativeAct: 1,
        criticalPath: false,
      },
    };

    store.nodes.set('test-001', testNode);

    // Visit the node
    store.visitNode('test-001');

    const updatedState = useStoryStore.getState();
    const visitRecord = updatedState.progress.visitedNodes['test-001'];

    expect(visitRecord).toBeDefined();
    expect(visitRecord.visitCount).toBe(1);
    expect(visitRecord.currentState).toBe('initial');
    expect(visitRecord.visitTimestamps).toHaveLength(1);
    expect(updatedState.progress.readingPath).toContain('test-001');
  });

  it('should update transformation state on repeated visits', () => {
    const store = useStoryStore.getState();

    // Add a test node
    const testNode: StoryNode = {
      id: 'test-002',
      character: 'algorithm',
      title: 'Test Node 2',
      position: { x: 150, y: 250 },
      content: {
        initial: 'Initial content',
        firstRevisit: 'First revisit content',
        metaAware: 'Meta aware content',
      },
      connections: [],
      visualState: {
        defaultColor: '#50C878',
        size: 30,
      },
      metadata: {
        estimatedReadTime: 4,
        thematicTags: ['test'],
        narrativeAct: 1,
        criticalPath: true,
      },
    };

    store.nodes.set('test-002', testNode);

    // First visit
    store.visitNode('test-002');
    let state = useStoryStore.getState();
    expect(state.progress.visitedNodes['test-002'].currentState).toBe('initial');

    // Second visit
    store.visitNode('test-002');
    state = useStoryStore.getState();
    expect(state.progress.visitedNodes['test-002'].visitCount).toBe(2);
    expect(state.progress.visitedNodes['test-002'].currentState).toBe('firstRevisit');

    // Third visit
    store.visitNode('test-002');
    state = useStoryStore.getState();
    expect(state.progress.visitedNodes['test-002'].visitCount).toBe(3);
    expect(state.progress.visitedNodes['test-002'].currentState).toBe('metaAware');
  });

  it('should handle non-existent node gracefully', () => {
    const store = useStoryStore.getState();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Try to visit a node that doesn't exist
    store.visitNode('non-existent');

    const state = useStoryStore.getState();
    expect(state.progress.visitedNodes['non-existent']).toBeUndefined();
    expect(state.progress.readingPath).not.toContain('non-existent');
    expect(consoleSpy).toHaveBeenCalledWith('Node not found: non-existent');

    consoleSpy.mockRestore();
  });

  it('should calculate node state correctly', () => {
    const store = useStoryStore.getState();

    // Add a test node
    const testNode: StoryNode = {
      id: 'test-003',
      character: 'human',
      title: 'Test Node 3',
      position: { x: 200, y: 300 },
      content: {
        initial: 'Initial content',
        firstRevisit: 'First revisit content',
        metaAware: 'Meta aware content',
      },
      connections: [],
      visualState: {
        defaultColor: '#E74C3C',
        size: 25,
      },
      metadata: {
        estimatedReadTime: 2,
        thematicTags: ['test'],
        narrativeAct: 2,
        criticalPath: false,
      },
    };

    store.nodes.set('test-003', testNode);

    // Test unvisited node state
    let nodeState = store.getNodeState('test-003');
    expect(nodeState.visited).toBe(false);
    expect(nodeState.visitCount).toBe(0);
    expect(nodeState.currentState).toBe('initial');
    expect(nodeState.transformationAvailable).toBe(false);

    // Visit the node
    store.visitNode('test-003');

    // Test visited node state
    nodeState = store.getNodeState('test-003');
    expect(nodeState.visited).toBe(true);
    expect(nodeState.visitCount).toBe(1);
    expect(nodeState.currentState).toBe('initial');
    expect(nodeState.transformationAvailable).toBe(true);
  });

  it('should calculate reading statistics correctly', () => {
    const store = useStoryStore.getState();

    // Add multiple test nodes
    const archaeologistNode: StoryNode = {
      id: 'arch-001',
      character: 'archaeologist',
      title: 'Archaeologist Node',
      position: { x: 100, y: 100 },
      content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
      connections: [],
      visualState: { defaultColor: '#4A90E2', size: 30 },
      metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: true },
    };

    const algorithmNode: StoryNode = {
      id: 'algo-001',
      character: 'algorithm',
      title: 'Algorithm Node',
      position: { x: 200, y: 200 },
      content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
      connections: [],
      visualState: { defaultColor: '#50C878', size: 30 },
      metadata: { estimatedReadTime: 4, thematicTags: [], narrativeAct: 1, criticalPath: false },
    };

    store.nodes.set('arch-001', archaeologistNode);
    store.nodes.set('algo-001', algorithmNode);

    // Visit one node
    store.visitNode('arch-001');

    const stats = store.getReadingStats();
    expect(stats.totalNodes).toBe(2);
    expect(stats.totalNodesVisited).toBe(1);
    expect(stats.percentageExplored).toBe(50);
    expect(stats.criticalPathNodesTotal).toBe(1);
    expect(stats.criticalPathNodesVisited).toBe(1);
    expect(stats.characterBreakdown.archaeologist.total).toBe(1);
    expect(stats.characterBreakdown.archaeologist.visited).toBe(1);
    expect(stats.characterBreakdown.algorithm.total).toBe(1);
    expect(stats.characterBreakdown.algorithm.visited).toBe(0);
  });
});