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
      human: { visited: 0, total: 0 },
    },
  };
}

/**
 * Determines the current transformation state for a node based on visit history
 * and unlock conditions.
 *
 * @param nodeId - The unique identifier of the node
 * @param visitRecord - The visit history for this node, if any
 * @param unlockedTransformations - Array of special transformations unlocked
 * @returns The current transformation state
 */
function determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
  unlockedTransformations: UnlockedTransformation[]
): TransformationState {
  // Check for special transformations first
  const specialUnlocked = unlockedTransformations.find((t) => t.nodeId === nodeId);

  if (specialUnlocked) {
    return 'metaAware'; // Special transforms show meta-aware state
  }

  // Standard visit-based transformation
  const visitCount = visitRecord?.visitCount || 0;

  if (visitCount === 1) {
    return 'initial';
  } else if (visitCount === 2) {
    return 'firstRevisit';
  } else if (visitCount >= 3) {
    return 'metaAware';
  } else {
    return 'initial'; // Default for 0 visits
  }
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

    visitNode: (nodeId: string) => {
      // Validate node exists first
      const state = get();
      const node = state.nodes.get(nodeId);
      if (!node) {
        console.error(`Node not found: ${nodeId}`);
        return;
      }

      // Update state using Immer
      set((draftState) => {
        const now = new Date().toISOString();
        const existingRecord = draftState.progress.visitedNodes[nodeId];

        if (existingRecord) {
          // Node has been visited before - update existing record
          existingRecord.visitCount++;
          existingRecord.visitTimestamps.push(now);
          existingRecord.lastVisited = now;
          // Update transformation state based on new visit count
          existingRecord.currentState = determineTransformationState(
            nodeId,
            existingRecord,
            draftState.progress.specialTransformations
          );
        } else {
          // First visit - create new record
          draftState.progress.visitedNodes[nodeId] = {
            visitCount: 1,
            visitTimestamps: [now],
            currentState: 'initial',
            timeSpent: 0,
            lastVisited: now,
          };
        }

        // Add to reading path
        draftState.progress.readingPath.push(nodeId);

        // Update last active timestamp
        draftState.progress.lastActiveTimestamp = now;
      });

      // Post-state side effects using fresh state
      const freshState = get();

      // Check for newly unlocked special transformations
      const newTransforms = checkSpecialTransformations(
        nodeId,
        Array.from(freshState.nodes.values()),
        freshState.progress
      );

      if (newTransforms.length > 0) {
        set((draftState) => {
          draftState.progress.specialTransformations.push(...newTransforms);
        });
      }

      // Check for newly revealed connections
      const connectionsToReveal: string[] = [];
      for (const [connId, conn] of freshState.connections) {
        if (shouldRevealConnection(conn, freshState.progress)) {
          if (!freshState.progress.unlockedConnections.includes(connId)) {
            connectionsToReveal.push(connId);
          }
        }
      }

      if (connectionsToReveal.length > 0) {
        set((draftState) => {
          draftState.progress.unlockedConnections.push(...connectionsToReveal);
        });
      }

      // Save progress to localStorage
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

      // Handle version migration if needed
      const currentVersion = '1.0.0';
      if (saved.version !== currentVersion) {
        console.warn(`Version mismatch: saved ${saved.version}, current ${currentVersion}`);
        // In the future, implement migration logic here
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
        human: { visited: 0, total: 0 },
      };

      let criticalPathNodesTotal = 0;
      let criticalPathNodesVisited = 0;

      for (const [nodeId, node] of state.nodes) {
        characterBreakdown[node.character].total++;
        if (node.metadata.criticalPath) {
          criticalPathNodesTotal++;
        }

        if (visitedNodeIds.includes(nodeId)) {
          characterBreakdown[node.character].visited++;
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