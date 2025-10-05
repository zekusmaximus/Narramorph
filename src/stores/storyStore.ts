import { enableMapSet } from 'immer';

// Enable Immer MapSet plugin for Map/Set support
enableMapSet();

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  StoryStore,
  UserProgress,
  UserPreferences,
  SavedState,
  MapViewport,
  ReadingStats,
  NodeUIState,
  ConnectionUIState,
  TransformationState,
  UnlockedTransformation,
  VisitRecord,
  StoryNode,
  Connection,
} from '@/types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/utils/storage';
import { validateSavedState } from '@/utils/validation';
import { loadStoryContent, ContentLoadError } from '@/utils/contentLoader';

/**
 * Creates initial empty user progress
 */
function createInitialProgress(): UserProgress {
  return {
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
  };
}

/**
 * Creates initial user preferences
 */
function createInitialPreferences(): UserPreferences {
  return {
    textSize: 'medium',
    theme: 'light',
    reduceMotion: false,
    showTutorial: true,
    showReadingStats: true,
  };
}

/**
 * Creates initial reading stats
 */
function createInitialStats(): ReadingStats {
  return {
    totalNodesVisited: 0,
    totalNodes: 0,
    percentageExplored: 0,
    totalTimeSpent: 0,
    averageTimePerNode: 0,
    transformationsAvailable: 0,
    criticalPathNodesVisited: 0,
    criticalPathNodesTotal: 0,
    characterBreakdown: {
      archaeologist: { visited: 0, total: 0 },
      algorithm: { visited: 0, total: 0 },
      lastHuman: { visited: 0, total: 0 },
    },
  };
}

/**
 * Determines transformation state based on visit count AND temporal awareness.
 *
 * For Eternal Return:
 * - initial: First visit, reader hasn't explored other time periods
 * - firstRevisit (temporal bleeding): Revisit after exploring other perspectives
 * - metaAware: Multiple revisits OR high temporal awareness
 *
 * @param nodeId - Node being evaluated
 * @param visitRecord - Visit history for this node
 * @param unlockedTransformations - Special transformations unlocked
 * @param temporalAwarenessLevel - Current temporal awareness (0-100)
 * @returns Appropriate transformation state
 */
function determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
  unlockedTransformations: UnlockedTransformation[],
  temporalAwarenessLevel: number
): TransformationState {
  // Priority 1: Special transformations always show metaAware
  const specialUnlocked = unlockedTransformations.find((t) => t.nodeId === nodeId);
  if (specialUnlocked) {
    return 'metaAware';
  }

  const visitCount = visitRecord?.visitCount || 0;

  // First visit: always initial state
  if (visitCount === 0 || visitCount === 1) {
    return 'initial';
  }

  // Second visit: temporal bleeding if awareness threshold met
  if (visitCount === 2) {
    return temporalAwarenessLevel > 20 ? 'firstRevisit' : 'initial';
  }

  // Third+ visit OR high awareness: full meta-aware
  if (visitCount >= 3 || temporalAwarenessLevel > 50) {
    return 'metaAware';
  }

  // Fallback (shouldn't normally reach here)
  return 'firstRevisit';
}

/**
 * Checks if any special transformations should be unlocked after a visit.
 *
 * @param _visitedNodeId - The node that was just visited (unused but kept for future optimization)
 * @param nodes - Array of all story nodes
 * @param progress - Current user progress
 * @returns Array of newly unlocked transformations
 */
function checkSpecialTransformations(
  _visitedNodeId: string,
  nodes: StoryNode[],
  progress: UserProgress
): UnlockedTransformation[] {
  const newlyUnlocked: UnlockedTransformation[] = [];

  for (const node of nodes) {
    if (!node.unlockConditions?.specialTransforms) continue;

    for (const transform of node.unlockConditions.specialTransforms) {
      // Check if already unlocked
      const alreadyUnlocked = progress.specialTransformations.some(
        t => t.nodeId === node.id && t.transformationId === transform.id
      );

      if (alreadyUnlocked) continue;

      // Check required prior nodes (any order)
      const hasRequiredNodes = transform.requiredPriorNodes.every(
        nodeId => progress.visitedNodes[nodeId]
      );

      if (!hasRequiredNodes) continue;

      // Check required sequence (if specified)
      if (transform.requiredSequence) {
        const pathString = progress.readingPath.join(',');
        const sequenceString = transform.requiredSequence.join(',');
        if (!pathString.includes(sequenceString)) continue;
      }

      // All conditions met - unlock!
      newlyUnlocked.push({
        nodeId: node.id,
        transformationId: transform.id,
        unlockedAt: new Date().toISOString()
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Determines if a connection should be visible based on reveal conditions.
 *
 * @param connection - The connection to check
 * @param progress - Current user progress
 * @returns true if the connection should be visible
 */
function shouldRevealConnection(
  connection: Connection,
  progress: UserProgress
): boolean {
  // If no reveal conditions, always visible
  if (!connection.revealConditions) {
    return true;
  }

  const { requiredVisits, requiredSequence } = connection.revealConditions;

  // Check required visits
  if (requiredVisits) {
    for (const [nodeId, minCount] of Object.entries(requiredVisits)) {
      const visitRecord = progress.visitedNodes[nodeId];
      if (!visitRecord || visitRecord.visitCount < minCount) {
        return false;
      }
    }
  }

  // Check required sequence
  if (requiredSequence) {
    const pathString = progress.readingPath.join(',');
    const sequenceString = requiredSequence.join(',');
    if (!pathString.includes(sequenceString)) {
      return false;
    }
  }

  return true;
}

/**
 * Creates the main Zustand store for the application
 */
export const useStoryStore = create<StoryStore>()(
  immer((set, get) => ({
    // Initial state
    storyData: null,
    nodes: new Map(),
    connections: new Map(),
    progress: createInitialProgress(),
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
      bounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    },
    selectedNode: null,
    hoveredNode: null,
    storyViewOpen: false,
    stats: createInitialStats(),
    preferences: createInitialPreferences(),

    // Actions
    loadStory: async (storyId: string) => {
      try {
        // TODO: Add loading indicator
        // console.log(`Loading story: ${storyId}`);

        // Load story content from files
        const storyData = await loadStoryContent(storyId);

        set((state) => {
          // Clear existing state
          state.nodes.clear();
          state.connections.clear();
          state.progress = createInitialProgress();

          // Set story data
          state.storyData = storyData;

          // Populate nodes map
          storyData.nodes.forEach((node) => {
            state.nodes.set(node.id, node);
          });

          // Populate connections map
          if (storyData.connections) {
            storyData.connections.forEach((connection) => {
              state.connections.set(connection.id, connection);
            });
          }

          // Update viewport bounds based on node positions
          if (storyData.nodes.length > 0) {
            const positions = storyData.nodes.map(node => node.position);
            const minX = Math.min(...positions.map(p => p.x)) - 100;
            const maxX = Math.max(...positions.map(p => p.x)) + 100;
            const minY = Math.min(...positions.map(p => p.y)) - 100;
            const maxY = Math.max(...positions.map(p => p.y)) + 100;

            state.viewport.bounds = { minX, maxX, minY, maxY };
            state.viewport.center = {
              x: (minX + maxX) / 2,
              y: (minY + maxY) / 2,
            };
          }
        });

        // Update reading statistics
        get().updateStats();

        // TODO: Add success notification
        // console.log(`Successfully loaded story: ${storyData.metadata.title}`);

      } catch (error) {
        console.error('Failed to load story:', error);

        if (error instanceof ContentLoadError) {
          // Handle content loading errors with user-friendly messages
          throw new Error(`Story loading failed: ${error.message}`);
        } else {
          // Handle unexpected errors
          throw new Error(`Unexpected error loading story: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    },

    /**
     * Calculates temporal awareness based on cross-temporal exploration.
     *
     * Algorithm:
     * - Diversity bonus: 20 points per unique character perspective
     * - Exploration score: (total_visits / 10) * 40, capped at 40
     * - Total: min(diversity + exploration, 100)
     */
    updateTemporalAwareness: () => {
      set((draftState) => {
        const { archaeologist, algorithm, lastHuman } =
          draftState.progress.characterNodesVisited;

        const total = archaeologist + algorithm + lastHuman;

        if (total === 0) {
          draftState.progress.temporalAwarenessLevel = 0;
          return;
        }

        // Calculate diversity of exploration
        const perspectivesVisited = [
          archaeologist > 0,
          algorithm > 0,
          lastHuman > 0,
        ].filter(Boolean).length;

        // Temporal awareness formula
        const diversityBonus = perspectivesVisited * 20; // 0, 20, 40, or 60
        const explorationScore = Math.min((total / 10) * 40, 40); // Cap at 40

        draftState.progress.temporalAwarenessLevel = Math.min(
          diversityBonus + explorationScore,
          100
        );
      });
    },

    visitNode: (nodeId: string) => {
      // Validate node exists first
      const state = get();
      const node = state.nodes.get(nodeId);
      if (!node) {
        console.error(`Node not found: ${nodeId}`);
        return;
      }

      // Update visit record
      set((draftState) => {
        const now = new Date().toISOString();
        const existingRecord = draftState.progress.visitedNodes[nodeId];

        if (existingRecord) {
          existingRecord.visitCount++;
          existingRecord.visitTimestamps.push(now);
          existingRecord.lastVisited = now;
        } else {
          draftState.progress.visitedNodes[nodeId] = {
            visitCount: 1,
            visitTimestamps: [now],
            currentState: 'initial',
            timeSpent: 0,
            lastVisited: now,
          };
        }

        // Track character-specific visits
        if (node.character === 'archaeologist') {
          draftState.progress.characterNodesVisited.archaeologist++;
        } else if (node.character === 'algorithm') {
          draftState.progress.characterNodesVisited.algorithm++;
        } else if (node.character === 'last-human') {
          draftState.progress.characterNodesVisited.lastHuman++;
        }
        // multi-perspective nodes don't increment character counters

        draftState.progress.readingPath.push(nodeId);
        draftState.progress.lastActiveTimestamp = now;
      });

      // Update temporal awareness after visit
      get().updateTemporalAwareness();

      // Re-determine transformation states for ALL visited nodes with new awareness
      const freshState = get();
      set((draftState) => {
        for (const [visitedNodeId, visitRec] of Object.entries(
          draftState.progress.visitedNodes
        )) {
          visitRec.currentState = determineTransformationState(
            visitedNodeId,
            visitRec,
            freshState.progress.specialTransformations,
            freshState.progress.temporalAwarenessLevel
          );
        }
      });

      // Check for special transformations
      const freshStateAgain = get();
      const newTransforms = checkSpecialTransformations(
        nodeId,
        Array.from(freshStateAgain.nodes.values()),
        freshStateAgain.progress
      );

      if (newTransforms.length > 0) {
        set((draftState) => {
          draftState.progress.specialTransformations.push(...newTransforms);
        });
      }

      // Update connection visibility
      const finalState = get();
      const connectionsToAdd: string[] = [];
      for (const [connId, conn] of finalState.connections) {
        if (shouldRevealConnection(conn, finalState.progress)) {
          if (!finalState.progress.unlockedConnections.includes(connId)) {
            connectionsToAdd.push(connId);
          }
        }
      }

      if (connectionsToAdd.length > 0) {
        set((draftState) => {
          draftState.progress.unlockedConnections.push(...connectionsToAdd);
        });
      }

      get().saveProgress();
    },

    updateViewport: (viewport: Partial<MapViewport>) => {
      set((state) => {
        Object.assign(state.viewport, viewport);
      });
    },

    selectNode: (nodeId: string | null) => {
      set((state) => {
        state.selectedNode = nodeId;
      });
    },

    setHoveredNode: (nodeId: string | null) => {
      set((state) => {
        state.hoveredNode = nodeId;
      });
    },

    openStoryView: (nodeId: string) => {
      set((state) => {
        state.selectedNode = nodeId;
        state.storyViewOpen = true;
      });
    },

    closeStoryView: () => {
      set((state) => {
        state.storyViewOpen = false;
      });
    },

    saveProgress: () => {
      const state = get();
      const savedState: SavedState = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        progress: state.progress,
        preferences: state.preferences,
      };

      const success = saveToStorage(STORAGE_KEYS.SAVED_STATE, savedState);
      if (!success) {
        console.error('Failed to save progress to localStorage');
      }
    },

    loadProgress: () => {
      const saved = loadFromStorage<SavedState>(STORAGE_KEYS.SAVED_STATE);
      if (!saved) return;

      if (!validateSavedState(saved)) {
        console.error('Invalid saved state format');
        return;
      }

      // Migration for old saves without temporal awareness
      if (saved.progress.temporalAwarenessLevel === undefined) {
        console.log('Migrating old save to temporal awareness system...');

        // Initialize new fields
        saved.progress.temporalAwarenessLevel = 0;
        saved.progress.characterNodesVisited = {
          archaeologist: 0,
          algorithm: 0,
          lastHuman: 0,
        };

        // Reconstruct character visit counts from existing data
        const state = get();
        for (const nodeId of Object.keys(saved.progress.visitedNodes)) {
          const node = state.nodes.get(nodeId);
          if (!node) continue;

          if (node.character === 'archaeologist') {
            saved.progress.characterNodesVisited.archaeologist++;
          } else if (node.character === 'algorithm') {
            saved.progress.characterNodesVisited.algorithm++;
          } else if (node.character === 'last-human') {
            saved.progress.characterNodesVisited.lastHuman++;
          }
        }

        // Calculate temporal awareness from migrated data
        const { archaeologist, algorithm, lastHuman } =
          saved.progress.characterNodesVisited;
        const total = archaeologist + algorithm + lastHuman;

        if (total > 0) {
          const perspectivesVisited = [
            archaeologist > 0,
            algorithm > 0,
            lastHuman > 0,
          ].filter(Boolean).length;

          const diversityBonus = perspectivesVisited * 20;
          const explorationScore = Math.min((total / 10) * 40, 40);
          saved.progress.temporalAwarenessLevel = Math.min(
            diversityBonus + explorationScore,
            100
          );
        }

        console.log(`Migration complete. Temporal awareness: ${saved.progress.temporalAwarenessLevel}%`);
      }

      set((state) => {
        state.progress = saved.progress;
        state.preferences = saved.preferences;
      });
    },

    exportProgress: () => {
      const state = get();
      const exportData: SavedState = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        progress: state.progress,
        preferences: state.preferences,
      };
      return JSON.stringify(exportData, null, 2);
    },

    importProgress: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (!validateSavedState(parsed)) {
          return false;
        }

        set((state) => {
          state.progress = parsed.progress;
          state.preferences = parsed.preferences;
        });

        get().saveProgress();
        return true;
      } catch (error) {
        console.error('Failed to import progress:', error);
        return false;
      }
    },

    clearProgress: () => {
      set((state) => {
        state.progress = createInitialProgress();
        state.selectedNode = null;
        state.hoveredNode = null;
        state.storyViewOpen = false;
      });
      get().saveProgress();
    },

    updatePreferences: (prefs: Partial<UserPreferences>) => {
      set((state) => {
        Object.assign(state.preferences, prefs);
      });
      get().saveProgress();
    },

    // Computed selectors
    getNodeState: (nodeId: string): NodeUIState => {
      const state = get();
      const node = state.nodes.get(nodeId);
      const visitRecord = state.progress.visitedNodes[nodeId];

      if (!node) {
        // Return default state for missing node
        return {
          id: nodeId,
          position: { x: 0, y: 0 },
          currentState: 'initial',
          visited: false,
          visitCount: 0,
          transformationAvailable: false,
          highlighted: false,
          connected: false,
          visualProperties: {
            color: '#cccccc',
            size: 20,
            opacity: 0.5,
            glow: false,
            pulse: false,
          },
        };
      }

      const visited = !!visitRecord;
      const visitCount = visitRecord?.visitCount || 0;
      const currentState = visitRecord?.currentState || 'initial';

      return {
        id: nodeId,
        position: node.position,
        currentState,
        visited,
        visitCount,
        transformationAvailable: visitCount > 0,
        highlighted: state.hoveredNode === nodeId || state.selectedNode === nodeId,
        connected: false, // TODO: Calculate based on selected node
        visualProperties: {
          color: visited ? node.visualState.defaultColor : '#cccccc',
          size: node.visualState.size,
          opacity: visited ? 1 : 0.6,
          glow: state.selectedNode === nodeId,
          pulse: state.hoveredNode === nodeId,
        },
      };
    },

    getConnectionState: (connectionId: string): ConnectionUIState => {
      const state = get();
      const connection = state.connections.get(connectionId);

      if (!connection) {
        // Return default state for missing connection
        return {
          id: connectionId,
          sourceId: '',
          targetId: '',
          type: 'temporal',
          visible: false,
          highlighted: false,
          animated: false,
          visualProperties: {
            color: '#cccccc',
            weight: 1,
            animated: false,
          },
        };
      }

      const visible = state.progress.unlockedConnections.includes(connectionId);

      return {
        id: connectionId,
        sourceId: connection.sourceId,
        targetId: connection.targetId,
        type: connection.type,
        visible,
        highlighted: false, // TODO: Calculate based on hovered nodes
        animated: visible && connection.visualProperties.animated,
        visualProperties: connection.visualProperties,
      };
    },

    getAvailableTransformations: () => {
      const state = get();
      const availableTransformations: string[] = [];

      // Find nodes that have transformations available based on visit count
      for (const [nodeId, visitRecord] of Object.entries(state.progress.visitedNodes)) {
        const node = state.nodes.get(nodeId);
        if (!node) continue;

        // Check if node has special transformations that could be unlocked
        if (node.unlockConditions?.specialTransforms) {
          for (const transform of node.unlockConditions.specialTransforms) {
            const alreadyUnlocked = state.progress.specialTransformations.some(
              t => t.nodeId === nodeId && t.transformationId === transform.id
            );

            if (!alreadyUnlocked) {
              // Check if requirements are close to being met
              const hasRequiredNodes = transform.requiredPriorNodes.every(
                id => state.progress.visitedNodes[id]
              );

              if (hasRequiredNodes) {
                availableTransformations.push(`${nodeId}:${transform.id}`);
              }
            }
          }
        }

        // Standard transformation availability
        if (visitRecord.visitCount > 0 && visitRecord.currentState !== 'metaAware') {
          availableTransformations.push(nodeId);
        }
      }

      return availableTransformations;
    },

    getReadingStats: (): ReadingStats => {
      const state = get();
      const visitedNodeIds = Object.keys(state.progress.visitedNodes);
      const totalNodes = state.nodes.size;
      const totalVisited = visitedNodeIds.length;

      // Calculate character breakdown
      const characterBreakdown = {
        archaeologist: { visited: 0, total: 0 },
        algorithm: { visited: 0, total: 0 },
        lastHuman: { visited: 0, total: 0 },
      };

      let criticalPathNodesTotal = 0;
      let criticalPathNodesVisited = 0;

      for (const [nodeId, node] of state.nodes) {
        // Map character types to breakdown categories
        if (node.character === 'archaeologist') {
          characterBreakdown.archaeologist.total++;
        } else if (node.character === 'algorithm') {
          characterBreakdown.algorithm.total++;
        } else if (node.character === 'last-human') {
          characterBreakdown.lastHuman.total++;
        }
        // multi-perspective nodes don't count in character breakdown

        if (node.metadata.criticalPath) {
          criticalPathNodesTotal++;
        }

        if (visitedNodeIds.includes(nodeId)) {
          if (node.character === 'archaeologist') {
            characterBreakdown.archaeologist.visited++;
          } else if (node.character === 'algorithm') {
            characterBreakdown.algorithm.visited++;
          } else if (node.character === 'last-human') {
            characterBreakdown.lastHuman.visited++;
          }

          if (node.metadata.criticalPath) {
            criticalPathNodesVisited++;
          }
        }
      }

      const availableTransformations = get().getAvailableTransformations();

      return {
        totalNodesVisited: totalVisited,
        totalNodes,
        percentageExplored: totalNodes > 0 ? (totalVisited / totalNodes) * 100 : 0,
        totalTimeSpent: state.progress.totalTimeSpent,
        averageTimePerNode: totalVisited > 0 ? state.progress.totalTimeSpent / totalVisited : 0,
        transformationsAvailable: availableTransformations.length,
        criticalPathNodesVisited,
        criticalPathNodesTotal,
        characterBreakdown,
      };
    },

    updateStats: () => {
      const stats = get().getReadingStats();
      set((state) => {
        state.stats = stats;
      });
    },

    canVisitNode: (nodeId: string) => {
      const state = get();
      const node = state.nodes.get(nodeId);

      if (!node) return false;

      // For now, all existing nodes are visitable
      // In the future, implement logic based on:
      // - Connection accessibility
      // - Unlock conditions
      // - Story progression requirements
      return true;
    },
  }))
);