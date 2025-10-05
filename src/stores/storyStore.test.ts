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
        temporalAwarenessLevel: 0,
        characterNodesVisited: {
          archaeologist: 0,
          algorithm: 0,
          lastHuman: 0,
        },
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

  it('should update transformation state on repeated visits with temporal awareness', () => {
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
    expect(state.progress.characterNodesVisited.algorithm).toBe(1);

    // Second visit - should still be initial (low awareness, single character)
    store.visitNode('test-002');
    state = useStoryStore.getState();
    expect(state.progress.visitedNodes['test-002'].visitCount).toBe(2);
    expect(state.progress.visitedNodes['test-002'].currentState).toBe('initial');

    // Third visit - now metaAware
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
      character: 'last-human',
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

describe('Temporal Awareness System', () => {
  beforeEach(() => {
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
        temporalAwarenessLevel: 0,
        characterNodesVisited: {
          archaeologist: 0,
          algorithm: 0,
          lastHuman: 0,
        },
      },
    });
  });

  describe('updateTemporalAwareness', () => {
    it('should calculate 0% for no visits', () => {
      const store = useStoryStore.getState();
      store.updateTemporalAwareness();
      const state = useStoryStore.getState();
      expect(state.progress.temporalAwarenessLevel).toBe(0);
    });

    it('should calculate 40% for single character (5 nodes)', () => {
      const store = useStoryStore.getState();
      useStoryStore.setState({
        progress: {
          ...store.progress,
          characterNodesVisited: {
            archaeologist: 5,
            algorithm: 0,
            lastHuman: 0,
          },
        },
      });
      store.updateTemporalAwareness();
      const state = useStoryStore.getState();
      // 1 perspective * 20 = 20 diversity
      // 5 / 10 * 40 = 20 exploration
      // Total: 40%
      expect(state.progress.temporalAwarenessLevel).toBe(40);
    });

    it('should calculate 80% for balanced two-character exploration', () => {
      const store = useStoryStore.getState();
      useStoryStore.setState({
        progress: {
          ...store.progress,
          characterNodesVisited: {
            archaeologist: 5,
            algorithm: 5,
            lastHuman: 0,
          },
        },
      });
      store.updateTemporalAwareness();
      const state = useStoryStore.getState();
      // 2 perspectives * 20 = 40 diversity
      // 10 / 10 * 40 = 40 exploration (capped)
      // Total: 80%
      expect(state.progress.temporalAwarenessLevel).toBe(80);
    });

    it('should cap at 100% for full three-character exploration', () => {
      const store = useStoryStore.getState();
      useStoryStore.setState({
        progress: {
          ...store.progress,
          characterNodesVisited: {
            archaeologist: 10,
            algorithm: 10,
            lastHuman: 10,
          },
        },
      });
      store.updateTemporalAwareness();
      const state = useStoryStore.getState();
      // 3 perspectives * 20 = 60 diversity
      // 30 / 10 * 40 = 120, capped at 40
      // Total: 100%
      expect(state.progress.temporalAwarenessLevel).toBe(100);
    });

    it('should handle diverse exploration with minimal nodes', () => {
      const store = useStoryStore.getState();
      useStoryStore.setState({
        progress: {
          ...store.progress,
          characterNodesVisited: {
            archaeologist: 1,
            algorithm: 1,
            lastHuman: 1,
          },
        },
      });
      store.updateTemporalAwareness();
      const state = useStoryStore.getState();
      // 3 perspectives * 20 = 60 diversity
      // 3 / 10 * 40 = 12 exploration
      // Total: 72%
      expect(state.progress.temporalAwarenessLevel).toBe(72);
    });
  });

  describe('determineTransformationState with temporal awareness', () => {
    it('should return initial for first visit regardless of awareness', () => {
      const store = useStoryStore.getState();
      const testNode: StoryNode = {
        id: 'test-ta-001',
        character: 'archaeologist',
        title: 'Test Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-001', testNode);

      // Set high temporal awareness manually
      useStoryStore.setState({
        progress: {
          ...store.progress,
          temporalAwarenessLevel: 100,
        },
      });

      store.visitNode('test-ta-001');
      const state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-001'].currentState).toBe('initial');
      expect(state.progress.visitedNodes['test-ta-001'].visitCount).toBe(1);
    });

    it('should return initial for second visit with low awareness', () => {
      const store = useStoryStore.getState();
      const testNode: StoryNode = {
        id: 'test-ta-002',
        character: 'algorithm',
        title: 'Test Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-002', testNode);

      // First visit
      store.visitNode('test-ta-002');
      let state = useStoryStore.getState();
      expect(state.progress.temporalAwarenessLevel).toBeLessThanOrEqual(20);

      // Second visit
      store.visitNode('test-ta-002');
      state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-002'].visitCount).toBe(2);
      expect(state.progress.visitedNodes['test-ta-002'].currentState).toBe('initial');
    });

    it('should return firstRevisit for second visit with awareness > 20%', () => {
      const store = useStoryStore.getState();
      const archNode: StoryNode = {
        id: 'test-ta-arch',
        character: 'archaeologist',
        title: 'Arch Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      const algoNode: StoryNode = {
        id: 'test-ta-algo',
        character: 'algorithm',
        title: 'Algo Node',
        position: { x: 200, y: 200 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-arch', archNode);
      store.nodes.set('test-ta-algo', algoNode);

      // Visit arch node
      store.visitNode('test-ta-arch');

      // Visit algo node (increases awareness via diversity)
      store.visitNode('test-ta-algo');

      let state = useStoryStore.getState();
      expect(state.progress.temporalAwarenessLevel).toBeGreaterThan(20);

      // Revisit arch node - should now be firstRevisit
      store.visitNode('test-ta-arch');
      state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-arch'].visitCount).toBe(2);
      expect(state.progress.visitedNodes['test-ta-arch'].currentState).toBe('firstRevisit');
    });

    it('should return metaAware for third visit', () => {
      const store = useStoryStore.getState();
      const testNode: StoryNode = {
        id: 'test-ta-003',
        character: 'last-human',
        title: 'Test Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#E74C3C', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-003', testNode);

      // Three visits
      store.visitNode('test-ta-003');
      store.visitNode('test-ta-003');
      store.visitNode('test-ta-003');

      const state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-003'].visitCount).toBe(3);
      expect(state.progress.visitedNodes['test-ta-003'].currentState).toBe('metaAware');
    });

    it('should return metaAware for high awareness regardless of visit count', () => {
      const store = useStoryStore.getState();
      const testNode: StoryNode = {
        id: 'test-ta-004',
        character: 'archaeologist',
        title: 'Test Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-004', testNode);

      // Set high temporal awareness manually
      useStoryStore.setState({
        progress: {
          ...store.progress,
          temporalAwarenessLevel: 60,
          characterNodesVisited: {
            archaeologist: 10,
            algorithm: 10,
            lastHuman: 0,
          },
        },
      });

      // First visit
      store.visitNode('test-ta-004');

      // Second visit - should be metaAware due to high awareness
      store.visitNode('test-ta-004');
      const state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-004'].visitCount).toBe(2);
      expect(state.progress.visitedNodes['test-ta-004'].currentState).toBe('metaAware');
    });

    it('should prioritize special transformations', () => {
      const store = useStoryStore.getState();
      const testNode: StoryNode = {
        id: 'test-ta-005',
        character: 'algorithm',
        title: 'Test Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('test-ta-005', testNode);

      // Add special transformation manually
      useStoryStore.setState({
        progress: {
          ...store.progress,
          specialTransformations: [{
            nodeId: 'test-ta-005',
            transformationId: 'special',
            unlockedAt: new Date().toISOString(),
          }],
        },
      });

      // First visit should be metaAware due to special transformation
      store.visitNode('test-ta-005');
      const state = useStoryStore.getState();
      expect(state.progress.visitedNodes['test-ta-005'].currentState).toBe('metaAware');
    });
  });

  describe('visitNode with character tracking', () => {
    it('should increment archaeologist counter for archaeologist nodes', () => {
      const store = useStoryStore.getState();
      const archNode: StoryNode = {
        id: 'arch-001',
        character: 'archaeologist',
        title: 'Arch Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('arch-001', archNode);
      store.visitNode('arch-001');

      const state = useStoryStore.getState();
      expect(state.progress.characterNodesVisited.archaeologist).toBe(1);
      expect(state.progress.temporalAwarenessLevel).toBeGreaterThan(0);
    });

    it('should increment algorithm counter for algorithm nodes', () => {
      const store = useStoryStore.getState();
      const algoNode: StoryNode = {
        id: 'algo-001',
        character: 'algorithm',
        title: 'Algo Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('algo-001', algoNode);
      store.visitNode('algo-001');

      const state = useStoryStore.getState();
      expect(state.progress.characterNodesVisited.algorithm).toBe(1);
    });

    it('should increment lastHuman counter for last-human nodes', () => {
      const store = useStoryStore.getState();
      const humanNode: StoryNode = {
        id: 'human-001',
        character: 'last-human',
        title: 'Human Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#E74C3C', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('human-001', humanNode);
      store.visitNode('human-001');

      const state = useStoryStore.getState();
      expect(state.progress.characterNodesVisited.lastHuman).toBe(1);
    });

    it('should not increment counters for multi-perspective nodes', () => {
      const store = useStoryStore.getState();
      const multiNode: StoryNode = {
        id: 'multi-001',
        character: 'multi-perspective',
        title: 'Multi Node',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#9B59B6', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('multi-001', multiNode);
      store.visitNode('multi-001');

      const state = useStoryStore.getState();
      expect(state.progress.characterNodesVisited.archaeologist).toBe(0);
      expect(state.progress.characterNodesVisited.algorithm).toBe(0);
      expect(state.progress.characterNodesVisited.lastHuman).toBe(0);
      expect(state.progress.temporalAwarenessLevel).toBe(0);
    });

    it('should update temporal awareness after each visit', () => {
      const store = useStoryStore.getState();

      const archNode: StoryNode = {
        id: 'arch-test',
        character: 'archaeologist',
        title: 'Arch',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      const algoNode: StoryNode = {
        id: 'algo-test',
        character: 'algorithm',
        title: 'Algo',
        position: { x: 200, y: 200 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('arch-test', archNode);
      store.nodes.set('algo-test', algoNode);

      store.visitNode('arch-test');
      const awarenessAfterOne = useStoryStore.getState().progress.temporalAwarenessLevel;

      store.visitNode('algo-test');
      const awarenessAfterTwo = useStoryStore.getState().progress.temporalAwarenessLevel;

      expect(awarenessAfterTwo).toBeGreaterThan(awarenessAfterOne);
    });

    it('should re-determine all transformation states after awareness update', () => {
      const store = useStoryStore.getState();

      const archNode: StoryNode = {
        id: 'arch-transform',
        character: 'archaeologist',
        title: 'Arch',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      const algoNode: StoryNode = {
        id: 'algo-transform',
        character: 'algorithm',
        title: 'Algo',
        position: { x: 200, y: 200 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('arch-transform', archNode);
      store.nodes.set('algo-transform', algoNode);

      // Visit arch twice (should be initial both times - low awareness)
      store.visitNode('arch-transform');
      store.visitNode('arch-transform');
      let state = useStoryStore.getState();
      expect(state.progress.visitedNodes['arch-transform'].currentState).toBe('initial');

      // Visit algo (increases awareness via diversity)
      store.visitNode('algo-transform');
      state = useStoryStore.getState();
      expect(state.progress.temporalAwarenessLevel).toBeGreaterThan(20);

      // Visit arch again - should now trigger firstRevisit due to awareness
      store.visitNode('arch-transform');
      state = useStoryStore.getState();
      expect(state.progress.visitedNodes['arch-transform'].currentState).toBe('metaAware');
    });
  });

  describe('Migration logic', () => {
    it('should migrate old save without temporal awareness fields', async () => {
      const store = useStoryStore.getState();

      // Create test nodes
      const archNode: StoryNode = {
        id: 'arch-migrate',
        character: 'archaeologist',
        title: 'Arch',
        position: { x: 100, y: 100 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#4A90E2', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      const algoNode: StoryNode = {
        id: 'algo-migrate',
        character: 'algorithm',
        title: 'Algo',
        position: { x: 200, y: 200 },
        content: { initial: 'test', firstRevisit: 'test', metaAware: 'test' },
        connections: [],
        visualState: { defaultColor: '#50C878', size: 30 },
        metadata: { estimatedReadTime: 3, thematicTags: [], narrativeAct: 1, criticalPath: false },
      };

      store.nodes.set('arch-migrate', archNode);
      store.nodes.set('algo-migrate', algoNode);

      // Create old save format (without temporal awareness)
      const oldSave = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        progress: {
          visitedNodes: {
            'arch-migrate': {
              visitCount: 2,
              currentState: 'initial' as const,
              visitTimestamps: [new Date().toISOString()],
              timeSpent: 0,
              lastVisited: new Date().toISOString(),
            },
            'algo-migrate': {
              visitCount: 1,
              currentState: 'initial' as const,
              visitTimestamps: [new Date().toISOString()],
              timeSpent: 0,
              lastVisited: new Date().toISOString(),
            },
          },
          readingPath: ['arch-migrate', 'arch-migrate', 'algo-migrate'],
          unlockedConnections: [],
          specialTransformations: [],
          totalTimeSpent: 0,
          lastActiveTimestamp: new Date().toISOString(),
        },
        preferences: {
          textSize: 'medium' as const,
          theme: 'light' as const,
          reduceMotion: false,
          showTutorial: true,
          showReadingStats: true,
        },
      };

      // Mock localStorage with old save
      const { loadFromStorage } = await import('@/utils/storage');
      vi.mocked(loadFromStorage).mockReturnValue(oldSave);

      // Load progress (should trigger migration)
      store.loadProgress();

      const state = useStoryStore.getState();
      expect(state.progress.temporalAwarenessLevel).toBeDefined();
      expect(state.progress.characterNodesVisited).toBeDefined();
      expect(state.progress.characterNodesVisited.archaeologist).toBe(1);
      expect(state.progress.characterNodesVisited.algorithm).toBe(1);
      expect(state.progress.temporalAwarenessLevel).toBeGreaterThan(0);
    });
  });
});