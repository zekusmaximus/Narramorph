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
import { calculateJourneyPattern, calculatePathPhilosophy } from '@/utils/conditionEvaluator';
import type {
  JourneyTracking,
  ConditionContext,
  L3Assembly,
  JourneyPattern,
  PathPhilosophy,
  SynthesisPattern,
} from '@/types';
import { buildL3Assembly, calculateSynthesisPattern } from '@/utils/l3Assembly';
import {
  getNodePhilosophy,
  validateL2PhilosophyMappings,
} from '@/data/stories/eternal-return/nodePhilosophyMapping';
import { isL3Node, isL4Node } from '@/utils/nodeUtils';
import { loadUnlockConfig } from '@/utils/unlockLoader';
import {
  evaluateNodeUnlock,
  getUnlockProgress as getUnlockProgressUtil,
} from '@/utils/unlockEvaluator';
import type { UnlockProgress } from '@/types/Unlock';

const isDevEnv = process.env.NODE_ENV !== 'production';
const devLog = (...args: unknown[]): void => {
  if (!isDevEnv) return;
  console.warn('[StoryStore]', ...args);
};
const devWarn = (...args: unknown[]): void => {
  if (!isDevEnv) return;
  console.warn('[StoryStore:warn]', ...args);
};
const devError = (...args: unknown[]): void => {
  if (!isDevEnv) return;
  console.error('[StoryStore:error]', ...args);
};

/**
 * Creates initial journey tracking
 */
function createInitialJourneyTracking(): JourneyTracking {
  return {
    characterVisitPercentages: {
      archaeologist: 0,
      algorithm: 0,
      lastHuman: 0,
    },
    currentJourneyPattern: 'unknown',
    l2Choices: {
      accept: 0,
      resist: 0,
      invest: 0,
    },
    dominantPhilosophy: 'unknown',
    crossCharacterConnections: {
      arch_algo: 0,
      arch_hum: 0,
      algo_hum: 0,
    },
    navigationPattern: 'undetermined',
    lastCharacterVisited: undefined,
    revisitFrequency: 0,
    explorationMetrics: {
      breadth: 0,
      depth: 0,
    },
  };
}

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
    journeyTracking: createInitialJourneyTracking(),
    unlockedL2Characters: [],
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
 * Generate cache key for L3 assembly
 */
function generateL3CacheKey(
  journeyPattern: JourneyPattern,
  pathPhilosophy: PathPhilosophy,
  awarenessLevel: 'low' | 'medium' | 'high',
  synthesisPattern: SynthesisPattern,
): string {
  return `${journeyPattern}_${pathPhilosophy}_${awarenessLevel}_${synthesisPattern}`;
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
  temporalAwarenessLevel: number,
): TransformationState {
  // Priority 1: Special transformations always show metaAware
  const specialUnlocked = unlockedTransformations.find((t) => t.nodeId === nodeId);
  if (specialUnlocked) {
    return 'metaAware';
  }

  const visitCount = visitRecord?.visitCount || 0;

  // First visit: always initial state
  if (visitCount === 0 || visitCount === 1) {
    devLog(`[TransformState] ${nodeId}: visitCount=${visitCount} → initial`);
    return 'initial';
  }

  // Second visit: temporal bleeding if awareness threshold met
  if (visitCount === 2) {
    const state = temporalAwarenessLevel > 20 ? 'firstRevisit' : 'initial';
    devLog(
      `[TransformState] ${nodeId}: visitCount=2, awareness=${temporalAwarenessLevel} → ${state}`,
    );
    return state;
  }

  // Third+ visit OR high awareness: full meta-aware
  if (visitCount >= 3 || temporalAwarenessLevel > 50) {
    devLog(
      `[TransformState] ${nodeId}: visitCount=${visitCount}, awareness=${temporalAwarenessLevel} → metaAware`,
    );
    return 'metaAware';
  }

  // Fallback (shouldn't normally reach here)
  devLog(`[TransformState] ${nodeId}: fallback → firstRevisit`);
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
  progress: UserProgress,
): UnlockedTransformation[] {
  const newlyUnlocked: UnlockedTransformation[] = [];

  for (const node of nodes) {
    if (!node.unlockConditions?.specialTransforms) continue;

    for (const transform of node.unlockConditions.specialTransforms) {
      // Check if already unlocked
      const alreadyUnlocked = progress.specialTransformations.some(
        (t) => t.nodeId === node.id && t.transformationId === transform.id,
      );

      if (alreadyUnlocked) continue;

      // Check required prior nodes (any order)
      const hasRequiredNodes = transform.requiredPriorNodes.every(
        (nodeId) => progress.visitedNodes[nodeId],
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
        unlockedAt: new Date().toISOString(),
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
function shouldRevealConnection(connection: Connection, progress: UserProgress): boolean {
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
 * Normalize character name to standard format
 */
function normalizeCharacter(character: string): 'archaeologist' | 'algorithm' | 'lastHuman' {
  const charLower = character.toLowerCase();
  if (charLower.includes('arch')) return 'archaeologist';
  if (charLower.includes('algo')) return 'algorithm';
  if (charLower.includes('hum') || charLower.includes('last')) return 'lastHuman';
  return 'archaeologist'; // fallback
}

/**
 * Get connection key for cross-character tracking
 */
function getConnectionKey(
  from: 'archaeologist' | 'algorithm' | 'lastHuman',
  to: 'archaeologist' | 'algorithm' | 'lastHuman',
): keyof JourneyTracking['crossCharacterConnections'] | null {
  if (from === to) return null;

  // Sort to ensure bidirectional tracking (arch→algo same as algo→arch)
  const [first, second] = [from, to].sort();

  if (first === 'algorithm' && second === 'archaeologist') return 'arch_algo';
  if (first === 'archaeologist' && second === 'lastHuman') return 'arch_hum';
  if (first === 'algorithm' && second === 'lastHuman') return 'algo_hum';

  return null;
}

/**
 * Classify navigation pattern based on journey tracking metrics
 */
function classifyNavigationPattern(
  tracking: JourneyTracking,
): 'linear' | 'exploratory' | 'recursive' | 'undetermined' {
  const { revisitFrequency, explorationMetrics } = tracking;
  const { breadth, depth } = explorationMetrics;

  // Not enough data yet
  if (breadth < 10) return 'undetermined';

  // Recursive: High revisit rate + high depth
  if (revisitFrequency > 40 && depth > 2) {
    return 'recursive';
  }

  // Exploratory: High breadth + low depth + many cross-character connections
  const totalConnections = Object.values(tracking.crossCharacterConnections).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (breadth > 50 && depth < 2 && totalConnections > 5) {
    return 'exploratory';
  }

  // Linear: Low revisit rate + sequential pattern
  if (revisitFrequency < 20 && depth < 1.5) {
    return 'linear';
  }

  return 'undetermined';
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

    // L3 Assembly State
    l3AssemblyCache: new Map(),
    l3AssemblyViewOpen: false,
    currentL3Assembly: null,

    // Unlock System State
    unlockConfigs: new Map(),
    recentlyUnlockedNodes: [],

    // Actions
    loadStory: async (storyId: string) => {
      try {
        // TODO: Add loading indicator
        // devLog(`Loading story: ${storyId}`);

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
            const positions = storyData.nodes.map((node) => node.position);
            const minX = Math.min(...positions.map((p) => p.x)) - 100;
            const maxX = Math.max(...positions.map((p) => p.x)) + 100;
            const minY = Math.min(...positions.map((p) => p.y)) - 100;
            const maxY = Math.max(...positions.map((p) => p.y)) + 100;

            state.viewport.bounds = { minX, maxX, minY, maxY };
            state.viewport.center = {
              x: (minX + maxX) / 2,
              y: (minY + maxY) / 2,
            };
          }
        });

        // Load unlock configurations
        const unlockConfigs = loadUnlockConfig(storyId);
        set((state) => {
          state.unlockConfigs = unlockConfigs;
        });

        // Update reading statistics
        get().updateStats();

        // Validate L2 philosophy mappings
        const nodeIds = Array.from(get().nodes.keys());
        const validation = validateL2PhilosophyMappings(nodeIds);

        if (!validation.valid) {
          devWarn('[Journey] L2 nodes missing philosophy mappings:', validation.missing);
        } else {
          devLog('[Journey] All L2 nodes have valid philosophy mappings');
        }

        // TODO: Add success notification
        // devLog(`Successfully loaded story: ${storyData.metadata.title}`);
      } catch (error) {
        devError('Failed to load story:', error);

        if (error instanceof ContentLoadError) {
          // Handle content loading errors with user-friendly messages
          throw new Error(`Story loading failed: ${error.message}`);
        } else {
          // Handle unexpected errors
          throw new Error(
            `Unexpected error loading story: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
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
        const { archaeologist, algorithm, lastHuman } = draftState.progress.characterNodesVisited;

        const total = archaeologist + algorithm + lastHuman;

        if (total === 0) {
          draftState.progress.temporalAwarenessLevel = 0;
          return;
        }

        // Calculate diversity of exploration
        const perspectivesVisited = [archaeologist > 0, algorithm > 0, lastHuman > 0].filter(
          Boolean,
        ).length;

        // Temporal awareness formula
        const diversityBonus = perspectivesVisited * 20; // 0, 20, 40, or 60
        const explorationScore = Math.min((total / 10) * 40, 40); // Cap at 40

        draftState.progress.temporalAwarenessLevel = Math.min(
          diversityBonus + explorationScore,
          100,
        );
      });
    },

    /**
     * Updates journey tracking based on current visit patterns
     */
    updateJourneyTracking: () => {
      set((draftState) => {
        const { archaeologist, algorithm, lastHuman } = draftState.progress.characterNodesVisited;

        const total = archaeologist + algorithm + lastHuman;

        if (total === 0) {
          return; // No visits yet
        }

        // Calculate percentages
        const percentages = {
          archaeologist: (archaeologist / total) * 100,
          algorithm: (algorithm / total) * 100,
          lastHuman: (lastHuman / total) * 100,
        };

        // Determine starting character if not set
        if (!draftState.progress.journeyTracking) {
          draftState.progress.journeyTracking = createInitialJourneyTracking();
        }

        const tracking = draftState.progress.journeyTracking;
        tracking.characterVisitPercentages = percentages;

        // Set starting character based on first visit in reading path
        if (!tracking.startingCharacter && draftState.progress.readingPath.length > 0) {
          const firstNodeId = draftState.progress.readingPath[0];
          const firstNode = draftState.nodes.get(firstNodeId);
          if (firstNode) {
            if (firstNode.character === 'archaeologist') {
              tracking.startingCharacter = 'archaeologist';
            } else if (firstNode.character === 'algorithm') {
              tracking.startingCharacter = 'algorithm';
            } else if (firstNode.character === 'last-human') {
              tracking.startingCharacter = 'lastHuman';
            }
          }
        }

        // Determine dominant character
        const maxPercentage = Math.max(
          percentages.archaeologist,
          percentages.algorithm,
          percentages.lastHuman,
        );
        if (percentages.archaeologist === maxPercentage) {
          tracking.dominantCharacter = 'archaeologist';
        } else if (percentages.algorithm === maxPercentage) {
          tracking.dominantCharacter = 'algorithm';
        } else {
          tracking.dominantCharacter = 'lastHuman';
        }

        // Calculate journey pattern
        tracking.currentJourneyPattern = calculateJourneyPattern(
          tracking.startingCharacter,
          percentages,
        );

        // Calculate dominant philosophy
        tracking.dominantPhilosophy = calculatePathPhilosophy(tracking.l2Choices);
      });
    },

    /**
     * Records an L2 philosophy choice (accept/resist/invest)
     */
    recordL2Choice: (choice: 'accept' | 'resist' | 'invest') => {
      set((draftState) => {
        if (!draftState.progress.journeyTracking) {
          draftState.progress.journeyTracking = createInitialJourneyTracking();
        }
        draftState.progress.journeyTracking.l2Choices[choice]++;
      });
      get().updateJourneyTracking();
    },

    /**
     * Gets the current condition context for variation selection
     *
     * @param nodeId - Optional node ID to get condition context for. If provided, includes node-specific visit count.
     * @returns Condition context including node-specific visit count (if nodeId provided)
     */
    getConditionContext: (nodeId?: string): ConditionContext => {
      const state = get();
      const tracking = state.progress.journeyTracking || createInitialJourneyTracking();
      const visitRecord = nodeId ? state.progress.visitedNodes[nodeId] : undefined;

      return {
        nodeId: nodeId || '',
        awareness: state.progress.temporalAwarenessLevel,
        journeyPattern: tracking.currentJourneyPattern,
        pathPhilosophy: tracking.dominantPhilosophy,
        visitCount: visitRecord?.visitCount || 0,
        transformationState: visitRecord?.currentState || 'initial',
        characterVisitPercentages: tracking.characterVisitPercentages,
      };
    },

    /**
     * Builds an L3 assembly for the current user state
     */
    buildL3Assembly: (): L3Assembly | null => {
      const state = get();
      if (!state.storyData) {
        devError('Story not loaded');
        return null;
      }

      const context = state.getConditionContext();
      return buildL3Assembly(state.storyData.metadata.id, context);
    },

    /**
     * Get or build L3 assembly with caching
     */
    getOrBuildL3Assembly: (): L3Assembly | null => {
      const state = get();
      if (!state.storyData) {
        devError('[L3Assembly] Story not loaded');
        return null;
      }

      const tracking = state.progress.journeyTracking;
      if (!tracking) {
        devError('[L3Assembly] Journey tracking not initialized');
        return null;
      }

      const context = state.getConditionContext();

      // Calculate synthesis pattern
      const synthesisPattern = calculateSynthesisPattern(tracking.characterVisitPercentages);

      // Determine awareness level
      const awarenessLevel =
        context.awareness < 35 ? 'low' : context.awareness < 70 ? 'medium' : 'high';

      // Generate cache key
      const cacheKey = generateL3CacheKey(
        context.journeyPattern,
        context.pathPhilosophy,
        awarenessLevel,
        synthesisPattern,
      );

      // Check cache first
      const cached = state.l3AssemblyCache.get(cacheKey);
      if (cached) {
        devLog('[L3Assembly] Using cached assembly:', cacheKey);
        return cached;
      }

      // Build new assembly
      devLog('[L3Assembly] Building new assembly:', cacheKey);
      const assembly = buildL3Assembly(state.storyData.metadata.id, context);

      if (!assembly) {
        devError('[L3Assembly] Failed to build assembly');
        return null;
      }

      // Cache the assembly
      set((state) => {
        state.l3AssemblyCache.set(cacheKey, assembly);
      });

      return assembly;
    },

    /**
     * Clear L3 assembly cache
     */
    clearL3AssemblyCache: () => {
      set((state) => {
        devLog('[L3Assembly] Clearing assembly cache');
        state.l3AssemblyCache.clear();
      });
    },

    /**
     * Open L3 assembly view
     */
    openL3AssemblyView: () => {
      const state = get();

      // Build or get cached assembly
      const assembly = state.getOrBuildL3Assembly();

      if (!assembly) {
        devError('[L3Assembly] Cannot open view - no assembly available');
        return;
      }

      set((state) => {
        state.currentL3Assembly = assembly;
        state.l3AssemblyViewOpen = true;
      });

      // Track L3 assembly view in progress
      state.trackL3AssemblyView(assembly);

      devLog('[L3Assembly] Opened assembly view:', {
        journeyPattern: assembly.metadata.journeyPattern,
        philosophy: assembly.metadata.pathPhilosophy,
        synthesis: assembly.metadata.synthesisPattern,
      });
    },

    /**
     * Close L3 assembly view
     */
    closeL3AssemblyView: () => {
      set((state) => {
        state.l3AssemblyViewOpen = false;
        // Keep currentL3Assembly for reference, don't clear
      });

      devLog('[L3Assembly] Closed assembly view');
    },

    /**
     * Track when reader views an L3 assembly
     */
    trackL3AssemblyView: (assembly: L3Assembly) => {
      set((state) => {
        if (!state.progress.l3AssembliesViewed) {
          state.progress.l3AssembliesViewed = [];
        }

        // Check if this exact assembly was already viewed
        const existing = state.progress.l3AssembliesViewed.find(
          (view) =>
            view.journeyPattern === assembly.metadata.journeyPattern &&
            view.pathPhilosophy === assembly.metadata.pathPhilosophy &&
            view.synthesisPattern === assembly.metadata.synthesisPattern,
        );

        if (existing) {
          // Update timestamp
          existing.viewedAt = new Date().toISOString();
          devLog('[L3Assembly] Updated existing view timestamp');
        } else {
          // Add new view record
          state.progress.l3AssembliesViewed.push({
            viewedAt: new Date().toISOString(),
            journeyPattern: assembly.metadata.journeyPattern,
            pathPhilosophy: assembly.metadata.pathPhilosophy,
            synthesisPattern: assembly.metadata.synthesisPattern,
            awarenessLevel: assembly.metadata.awarenessLevel,
            sectionsRead: {
              arch: false,
              algo: false,
              hum: false,
              conv: false,
            },
          });
          devLog('[L3Assembly] Added new view record');
        }
      });

      get().saveProgress();
    },

    /**
     * Mark a section as read when user views it
     */
    markL3SectionRead: (section: 'arch' | 'algo' | 'hum' | 'conv') => {
      set((state) => {
        if (!state.progress.l3AssembliesViewed?.length) return;

        // Mark in most recent view
        const latest =
          state.progress.l3AssembliesViewed[state.progress.l3AssembliesViewed.length - 1];

        if (latest.sectionsRead[section] === false) {
          latest.sectionsRead[section] = true;
          devLog(`[L3Assembly] Marked section ${section} as read`);
        }
      });

      get().saveProgress();
    },

    /**
     * Evaluate all unlock conditions
     * Called after each node visit to check for newly unlocked nodes
     */
    evaluateUnlocks: () => {
      const state = get();
      const newlyUnlocked: string[] = [];

      // Check each configured node
      for (const [nodeId, config] of state.unlockConfigs) {
        // Skip if already in recently unlocked list
        if (state.recentlyUnlockedNodes.includes(nodeId)) continue;

        // Check if node is now unlocked
        const wasLocked = config.defaultLocked;
        const isUnlocked = evaluateNodeUnlock(config, state.progress);

        if (wasLocked && isUnlocked) {
          newlyUnlocked.push(nodeId);
          devLog(`[Unlock] Node unlocked: ${nodeId}`);
        }
      }

      if (newlyUnlocked.length > 0) {
        set((state) => {
          state.recentlyUnlockedNodes = [...state.recentlyUnlockedNodes, ...newlyUnlocked];
        });
      }
    },

    /**
     * Get unlock progress for a specific node
     */
    getUnlockProgress: (nodeId: string): UnlockProgress | null => {
      const state = get();
      const config = state.unlockConfigs.get(nodeId);

      if (!config) return null;

      return getUnlockProgressUtil(config, state.progress);
    },

    /**
     * Clear unlock notification queue
     * Called after showing notifications to user
     */
    clearUnlockNotifications: () => {
      set((state) => {
        state.recentlyUnlockedNodes = [];
      });
    },

    visitNode: (nodeId: string) => {
      // Validate node exists first
      const state = get();
      const node = state.nodes.get(nodeId);
      if (!node) {
        devError(`Node not found: ${nodeId}`);
        return;
      }

      // Update visit record
      set((draftState) => {
        const now = new Date().toISOString();
        const existingRecord = draftState.progress.visitedNodes[nodeId];

        if (existingRecord) {
          const previousCount = existingRecord.visitCount;
          existingRecord.visitCount++;
          existingRecord.visitTimestamps.push(now);
          existingRecord.lastVisited = now;
          devLog(`[Visit] ${nodeId}: visit #${existingRecord.visitCount} (was ${previousCount})`);
        } else {
          draftState.progress.visitedNodes[nodeId] = {
            visitCount: 1,
            visitTimestamps: [now],
            currentState: 'initial',
            timeSpent: 0,
            lastVisited: now,
          };
          devLog(`[Visit] ${nodeId}: first visit recorded`);
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

        // === Cross-Character Connection Tracking ===
        if (!draftState.progress.journeyTracking) {
          draftState.progress.journeyTracking = createInitialJourneyTracking();
        }

        const tracking = draftState.progress.journeyTracking;
        const currentChar = normalizeCharacter(node.character);
        const lastChar = tracking.lastCharacterVisited;

        // Detect character switch
        if (lastChar && lastChar !== currentChar) {
          const connectionKey = getConnectionKey(lastChar, currentChar);

          if (connectionKey) {
            tracking.crossCharacterConnections[connectionKey]++;
            devLog(`[Journey] Character switch detected: ${lastChar} → ${currentChar}`);
          }
        }

        // Update last character
        tracking.lastCharacterVisited = currentChar;

        // === Revisit Tracking ===
        // isRevisit currently unused but kept for future analytics
        // @ts-expect-error - Unused but kept for future analytics
        const isRevisit = existingRecord && existingRecord.visitCount > 0;
        const totalVisits = Object.keys(draftState.progress.visitedNodes).length;
        const revisits = Object.values(draftState.progress.visitedNodes).filter(
          (record) => record.visitCount > 1,
        ).length;

        if (totalVisits > 0) {
          tracking.revisitFrequency = (revisits / totalVisits) * 100;
        }

        // === Exploration Metrics ===
        const totalNodes = get().nodes.size;
        const uniqueVisited = Object.keys(draftState.progress.visitedNodes).length;
        const totalVisitCount = Object.values(draftState.progress.visitedNodes).reduce(
          (sum, record) => sum + record.visitCount,
          0,
        );

        tracking.explorationMetrics = {
          breadth: totalNodes > 0 ? (uniqueVisited / totalNodes) * 100 : 0,
          depth: uniqueVisited > 0 ? totalVisitCount / uniqueVisited : 0,
        };

        // === Navigation Pattern Classification ===
        tracking.navigationPattern = classifyNavigationPattern(tracking);

        // Unlock L2 nodes when visiting L1 nodes
        const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
        if (layerMatch) {
          const layer = parseInt(layerMatch[2] || '1', 10);
          if (layer === 1 && !draftState.progress.unlockedL2Characters.includes(node.character)) {
            draftState.progress.unlockedL2Characters.push(node.character);
          }
          // Clear L3 cache if visiting L2 node (philosophy changes)
          if (layer === 2) {
            draftState.l3AssemblyCache.clear();
            devLog('[L3Assembly] Cache cleared due to L2 visit');
          }
        }

        // Track L2 philosophy choice
        const nodePhilosophy = getNodePhilosophy(nodeId);
        if (nodePhilosophy && draftState.progress.journeyTracking) {
          // Only track if it's one of the three core philosophies
          if (
            nodePhilosophy === 'accept' ||
            nodePhilosophy === 'resist' ||
            nodePhilosophy === 'invest'
          ) {
            draftState.progress.journeyTracking.l2Choices[nodePhilosophy]++;
          }
        }

        draftState.progress.readingPath.push(nodeId);
        draftState.progress.lastActiveTimestamp = now;
      });

      // Update temporal awareness and journey tracking after visit
      get().updateTemporalAwareness();
      get().updateJourneyTracking();

      // Re-determine transformation states for ALL visited nodes with new awareness
      const freshState = get();
      set((draftState) => {
        for (const [visitedNodeId, visitRec] of Object.entries(draftState.progress.visitedNodes)) {
          visitRec.currentState = determineTransformationState(
            visitedNodeId,
            visitRec,
            freshState.progress.specialTransformations,
            freshState.progress.temporalAwarenessLevel,
          );
        }
      });

      // Check for special transformations
      const freshStateAgain = get();
      const newTransforms = checkSpecialTransformations(
        nodeId,
        Array.from(freshStateAgain.nodes.values()),
        freshStateAgain.progress,
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

      // Evaluate unlock conditions after visit
      get().evaluateUnlocks();

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
      const state = get();

      // Check if this is an L3 node
      if (isL3Node(nodeId)) {
        devLog('[Navigation] L3 node detected, opening assembly view');
        state.openL3AssemblyView();
        return;
      }

      // Check if this is an L4 node (future: special handling)
      if (isL4Node(nodeId)) {
        devLog('[Navigation] L4 node detected');
        // Future: Route to terminal view
        // For now, proceed with normal StoryView
      }

      // Normal node: open StoryView
      set((state) => {
        state.selectedNode = nodeId;
        state.storyViewOpen = true;
      });

      devLog('[Navigation] Opened story view:', nodeId);
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
        devError('Failed to save progress to localStorage');
      }
    },

    loadProgress: () => {
      const saved = loadFromStorage<SavedState>(STORAGE_KEYS.SAVED_STATE);
      if (!saved) return;

      if (!validateSavedState(saved)) {
        devError('Invalid saved state format');
        return;
      }

      // Migration for old saves without temporal awareness
      if (saved.progress.temporalAwarenessLevel === undefined) {
        devLog('Migrating old save to temporal awareness system...');

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
        const { archaeologist, algorithm, lastHuman } = saved.progress.characterNodesVisited;
        const total = archaeologist + algorithm + lastHuman;

        if (total > 0) {
          const perspectivesVisited = [archaeologist > 0, algorithm > 0, lastHuman > 0].filter(
            Boolean,
          ).length;

          const diversityBonus = perspectivesVisited * 20;
          const explorationScore = Math.min((total / 10) * 40, 40);
          saved.progress.temporalAwarenessLevel = Math.min(diversityBonus + explorationScore, 100);
        }

        devLog(`Migration complete. Temporal awareness: ${saved.progress.temporalAwarenessLevel}%`);
      }

      // Migration for old saves without L2 unlocking system
      if (!saved.progress.unlockedL2Characters) {
        devLog('Migrating old save to L2 unlocking system...');

        // Initialize the field
        saved.progress.unlockedL2Characters = [];

        // Unlock L2 characters based on visited L1 nodes
        const state = get();
        for (const nodeId of Object.keys(saved.progress.visitedNodes)) {
          const node = state.nodes.get(nodeId);
          if (!node) continue;

          const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
          if (layerMatch) {
            const layer = parseInt(layerMatch[2] || '1', 10);
            if (layer === 1 && !saved.progress.unlockedL2Characters.includes(node.character)) {
              saved.progress.unlockedL2Characters.push(node.character);
            }
          }
        }

        devLog(
          `Migration complete. Unlocked L2 characters: ${saved.progress.unlockedL2Characters.join(', ')}`,
        );
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
        devError('Failed to import progress:', error);
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
              (t) => t.nodeId === nodeId && t.transformationId === transform.id,
            );

            if (!alreadyUnlocked) {
              // Check if requirements are close to being met
              const hasRequiredNodes = transform.requiredPriorNodes.every(
                (id) => state.progress.visitedNodes[id],
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

      // Check if node has unlock configuration
      const config = state.unlockConfigs.get(nodeId);

      if (config) {
        // Use unlock evaluator
        return evaluateNodeUnlock(config, state.progress);
      }

      // Legacy L2 unlocking logic for nodes without configs
      const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
      if (layerMatch) {
        const layer = parseInt(layerMatch[2] || '1', 10);
        if (layer === 2) {
          // L2 nodes require their parent L1 character to be unlocked
          return state.progress.unlockedL2Characters.includes(node.character);
        }
      }

      return true; // Default: unlocked
    },
  })),
);
