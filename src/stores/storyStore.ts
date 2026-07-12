import { current, enableMapSet } from 'immer';
import type { WritableDraft } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Enable Immer MapSet plugin for Map/Set support
enableMapSet();

import {
  getNodePhilosophy,
  validateL2PhilosophyMappings,
} from '@/data/stories/eternal-return/nodePhilosophyMapping';
import { generateL3CacheKey } from '@/domain/l3/cacheKey';
import {
  calculateJourneyTrackingSnapshot,
  calculateProgressAfterNodeVisit,
  calculateProgressionAfterNodeVisit,
  calculateTemporalAwarenessLevel,
} from '@/domain/progress/journeyProgress';
import {
  checkSpecialTransformations,
  createInitialPreferences,
  createInitialProgress,
  createInitialStats,
  determineTransformationState,
  findNewlyRevealedConnectionIds,
} from '@/domain/progress/progressModel';
import { buildSavedState, serializeSavedState } from '@/domain/progress/saveState';
import { findNewlyUnlockedNodes, getNodeUnlockProgress } from '@/domain/unlocks/unlockProgress';
import { buildConditionContext } from '@/domain/variation/conditionContext';
import { progressRepository } from '@/repositories/progressRepository';
import type {
  StoryStore,
  UserPreferences,
  MapViewport,
  ReadingStats,
  NodeUIState,
  ConnectionUIState,
  StoryNode,
  ConditionContext,
  L3Assembly,
} from '@/types';
import type { UnlockProgress } from '@/types/Unlock';
import { loadStoryContent, ContentLoadError } from '@/utils/contentLoader';
import { buildL3Assembly, calculateSynthesisPattern } from '@/utils/l3Assembly';
import { isL3Node, isL4Node } from '@/utils/nodeUtils';
import { evaluateNodeUnlock } from '@/utils/unlockEvaluator';
import { loadUnlockConfig } from '@/utils/unlockLoader';
import { validateSavedState } from '@/utils/validation';

const isDevEnv = process.env.NODE_ENV !== 'production';

// Track initialization count for StrictMode detection
let initializationCount = 0;
const devLog = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.warn('[StoryStore]', ...args);
};
const devWarn = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.warn('[StoryStore:warn]', ...args);
};
const devError = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.error('[StoryStore:error]', ...args);
};

type DraftStoryNode = WritableDraft<StoryNode>;

function isLayeredStoryNode(
  node: DraftStoryNode | StoryNode | undefined,
): node is DraftStoryNode & Pick<StoryNode, 'layer'> {
  return typeof node === 'object' && node !== null && 'layer' in node;
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
    activeVisit: null,
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
      bounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    },
    selectedNode: null,
    hoveredNode: null,
    storyViewOpen: false,
    isAnimating: false,
    stats: createInitialStats(),
    preferences: createInitialPreferences(),

    // L3 Assembly State
    l3AssemblyCache: new Map(),
    l3AssemblyViewOpen: false,
    isGeneratingL3: false,
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

        // Track initialization for StrictMode detection
        initializationCount++;

        // Validate L2 philosophy mappings
        const nodeIds = Array.from(get().nodes.keys());
        const validation = validateL2PhilosophyMappings(nodeIds);

        if (!validation.valid) {
          devWarn(
            `[Journey] 🏗️  INIT #${initializationCount}: L2 nodes missing philosophy mappings:`,
            validation.missing,
          );
        } else {
          devLog(
            `[Journey] ✓ INIT #${initializationCount}: All L2 nodes have valid philosophy mappings`,
          );
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
     * Also updates transformation states for all visited nodes immediately.
     *
     * Algorithm:
     * - Diversity bonus: 20 points per unique character perspective
     * - Exploration score: (total_visits / 10) * 40, capped at 40
     * - Total: min(diversity + exploration, 100)
     */
    updateTemporalAwareness: () => {
      set((draftState) => {
        const newLevel = calculateTemporalAwarenessLevel(draftState.progress.characterNodesVisited);

        draftState.progress.temporalAwarenessLevel = newLevel;

        // Immediately update transformation states for ALL visited nodes
        // This ensures nodes transform visually even if the user hasn't moved
        for (const [visitedNodeId, visitRec] of Object.entries(draftState.progress.visitedNodes)) {
          visitRec.currentState = determineTransformationState(
            visitedNodeId,
            visitRec,
            draftState.progress.specialTransformations,
            newLevel,
          );
        }
      });
    },

    /**
     * Updates journey tracking based on current visit patterns
     */
    updateJourneyTracking: () => {
      set((draftState) => {
        draftState.progress.journeyTracking = calculateJourneyTrackingSnapshot({
          currentTracking: draftState.progress.journeyTracking,
          characterNodesVisited: draftState.progress.characterNodesVisited,
          readingPath: draftState.progress.readingPath,
          nodes: draftState.nodes,
        });
      });
    },

    /**
     * Records an L2 philosophy choice (accept/resist/invest)
     */
    recordL2Choice: (choice: 'accept' | 'resist' | 'invest') => {
      set((draftState) => {
        draftState.progress.journeyTracking.l2Choices[choice]++;
      });
      get().updateJourneyTracking();
    },

    /**
     * Gets the current condition context for variation selection
     *
     * @param nodeId - Optional node ID to get condition context for. If provided, includes node-specific visit count.
     * @param opts - Optional configuration for context building
     * @returns Condition context including node-specific visit count (if nodeId provided)
     */
    getConditionContext: (
      nodeId?: string,
      opts?: { includeRecentVariations?: boolean },
    ): ConditionContext => buildConditionContext(get().progress, nodeId, opts),

    /**
     * Check if a node is locked (after L3 convergence)
     *
     * @param nodeId - Node ID to check
     * @returns true if node is locked and cannot be accessed
     */
    isNodeLocked: (nodeId: string): boolean => {
      const state = get();
      return state.progress.lockedNodes?.includes(nodeId) || false;
    },

    /**
     * Update the active visit with a variationId after it's been determined
     */
    updateActiveVisitVariation: (variationId: string) => {
      set((state) => {
        const { activeVisit } = state;
        if (!activeVisit) {
          devWarn('[Visit] updateActiveVisitVariation called with no active visit');
          return;
        }

        const visitRecord = state.progress.visitedNodes[activeVisit.nodeId];
        if (!visitRecord) {
          devWarn('[Visit] No visit record found for active visit:', activeVisit.nodeId);
          return;
        }

        // Update the visit record with the variationId
        visitRecord.variationId = variationId;

        // Track ALL variations ever shown for this node (absolute deduplication)
        if (!visitRecord.recentVariationIds) {
          visitRecord.recentVariationIds = [];
        }
        // Only add if not already in the list (prevent duplicates in the array itself)
        if (!visitRecord.recentVariationIds.includes(variationId)) {
          visitRecord.recentVariationIds.push(variationId);
        }

        devLog(`[Visit] Updated ${activeVisit.nodeId} with variationId: ${variationId}`);
      });

      get().saveProgress();
    },

    /**
     * Finalize the active visit by calculating and recording duration
     * Called when the reader closes/leaves a node
     */
    finalizeActiveVisit: () => {
      set((state) => {
        const { activeVisit } = state;
        if (!activeVisit) {
          return; // No active visit to finalize
        }

        const visitRecord = state.progress.visitedNodes[activeVisit.nodeId];
        if (!visitRecord) {
          devWarn('[Visit] No visit record found for active visit:', activeVisit.nodeId);
          state.activeVisit = null;
          return;
        }

        // Calculate duration in seconds
        const durationMs = Date.now() - activeVisit.startTime;
        const durationSeconds = Math.floor(durationMs / 1000);

        // Update visit record
        visitRecord.duration = durationSeconds;
        visitRecord.timeSpent += durationSeconds;

        // Update total time spent
        state.progress.totalTimeSpent += durationSeconds;

        devLog(
          `[Visit] Finalized ${activeVisit.nodeId}: ${durationSeconds}s (total: ${visitRecord.timeSpent}s)`,
        );

        // Clear active visit
        state.activeVisit = null;
      });

      get().saveProgress();
    },

    /**
     * Builds an L3 assembly for the current user state
     */
    buildL3Assembly: async (): Promise<L3Assembly | null> => {
      const state = get();
      if (!state.storyData) {
        devError('Story not loaded');
        return null;
      }

      const context = state.getConditionContext();
      return await buildL3Assembly(state.storyData.metadata.id, context);
    },

    /**
     * Get or build L3 assembly with caching
     */
    getOrBuildL3Assembly: async (): Promise<L3Assembly | null> => {
      const state = get();
      if (!state.storyData) {
        devError('[L3Assembly] Story not loaded');
        return null;
      }

      const tracking = state.progress.journeyTracking;
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
      set({ isGeneratingL3: true });
      devLog('[L3Assembly] Building new assembly:', cacheKey);

      try {
        const assembly = await buildL3Assembly(state.storyData.metadata.id, context);

        if (!assembly) {
          devError('[L3Assembly] Failed to build assembly');
          return null;
        }

        // Cache the assembly
        set((state) => {
          state.l3AssemblyCache.set(cacheKey, assembly);
          state.isGeneratingL3 = false;
        });

        return assembly;
      } catch (error) {
        devError('[L3Assembly] Error building assembly', error);
        set({ isGeneratingL3: false });
        return null;
      }
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
    openL3AssemblyView: async (nodeId?: string) => {
      const state = get();

      // Finalize any existing active visit before starting a new one
      if (state.activeVisit) {
        state.finalizeActiveVisit();
      }

      // If nodeId provided, record visit for L3 node
      if (nodeId) {
        // Idempotency check
        if (state.activeVisit && state.activeVisit.nodeId === nodeId) {
          devLog('[L3Assembly] Already viewing', nodeId, '- skipping visit recording');
        } else {
          // Record visit for L3 node
          state.visitNode(nodeId);

          // Set active visit for duration tracking
          set((state) => {
            state.activeVisit = {
              nodeId,
              startTime: Date.now(),
            };

            // Initialize duration to 0, variationId to null for L3 nodes
            const visitRecord = state.progress.visitedNodes[nodeId];
            if (visitRecord) {
              visitRecord.duration = 0;
              visitRecord.variationId = null; // L3 nodes don't have variations
            }
          });

          devLog('[L3Assembly] L3 node visit recorded:', nodeId);
        }
      }

      // Build or get cached assembly (async now)
      const assembly = await state.getOrBuildL3Assembly();

      if (!assembly) {
        devError('[L3Assembly] Cannot open view - no assembly available');
        return;
      }

      // ONE-WAY GATE: Lock L1/L2 nodes after first L3 view (convergence moment)
      const currentState = get(); // Re-get state after async call
      if (!currentState.progress.l3ConvergenceTriggered) {
        devLog('[L3Assembly] ⚠️  CONVERGENCE TRIGGERED - Locking L1/L2 nodes (one-way gate)');

        set((draftState) => {
          // Mark convergence as triggered
          draftState.progress.l3ConvergenceTriggered = true;

          // Initialize lockedNodes if needed
          if (!draftState.progress.lockedNodes) {
            draftState.progress.lockedNodes = [];
          }

          // Lock all L1 and L2 nodes
          for (const [nId, node] of draftState.nodes) {
            if (!isLayeredStoryNode(node)) {
              continue;
            }

            if (node.layer === 1 || node.layer === 2) {
              if (!draftState.progress.lockedNodes.includes(nId)) {
                draftState.progress.lockedNodes.push(nId);
              }
            }
          }

          devLog(
            `[L3Assembly] Locked ${draftState.progress.lockedNodes.length} L1/L2 nodes. Your journey has crystallized.`,
          );
        });
      }

      set((state) => {
        state.currentL3Assembly = assembly;
        state.l3AssemblyViewOpen = true;
      });

      // Track L3 assembly view in progress
      get().trackL3AssemblyView(assembly);

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
      // Finalize active visit before closing
      const state = get();
      if (state.activeVisit) {
        state.finalizeActiveVisit();
      }

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
        if (!state.progress.l3AssembliesViewed?.length) {
          return;
        }

        // Mark in most recent view
        const latest =
          state.progress.l3AssembliesViewed[state.progress.l3AssembliesViewed.length - 1];

        if (latest && latest.sectionsRead[section] === false) {
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
      const { newlyUnlockedNodeIds } = findNewlyUnlockedNodes(
        state.unlockConfigs,
        state.progress,
        state.recentlyUnlockedNodes,
      );

      for (const nodeId of newlyUnlockedNodeIds) {
        devLog(`[Unlock] Node unlocked: ${nodeId}`);
      }

      if (newlyUnlockedNodeIds.length > 0) {
        set((state) => {
          state.recentlyUnlockedNodes = [...state.recentlyUnlockedNodes, ...newlyUnlockedNodeIds];
        });
      }
    },

    /**
     * Get unlock progress for a specific node
     */
    getUnlockProgress: (nodeId: string): UnlockProgress | null => {
      const state = get();

      return getNodeUnlockProgress(state.unlockConfigs, state.progress, nodeId);
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
        const visitProgress = calculateProgressAfterNodeVisit({
          progress: current(draftState.progress),
          node,
          nodeId,
          totalNodes: get().nodes.size,
          now,
        });

        draftState.progress = visitProgress.progress;

        if (visitProgress.previousVisitCount === null) {
          devLog(`[Visit] ${nodeId}: first visit recorded`);
        } else {
          devLog(
            `[Visit] ${nodeId}: visit #${visitProgress.visitCount} (was ${visitProgress.previousVisitCount})`,
          );
        }

        if (visitProgress.characterSwitch) {
          devLog(
            `[Journey] Character switch detected: ${visitProgress.characterSwitch.from} → ${visitProgress.characterSwitch.to}`,
          );
        }

        const progression = calculateProgressionAfterNodeVisit({
          progress: visitProgress.progress,
          node,
          nodeId,
          nodePhilosophy: getNodePhilosophy(nodeId),
        });

        draftState.progress = progression.progress;

        if (progression.shouldClearL3AssemblyCache) {
          draftState.l3AssemblyCache.clear();
          devLog('[L3Assembly] Cache cleared due to L2 visit');
        }
      });

      // Update temporal awareness and journey tracking after visit
      // Note: updateTemporalAwareness now also handles updating transformation states
      get().updateTemporalAwareness();
      get().updateJourneyTracking();

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
      const connectionsToAdd = findNewlyRevealedConnectionIds(
        finalState.connections,
        finalState.progress,
      );

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

    setIsAnimating: (value: boolean) => {
      set((state) => {
        state.isAnimating = value;
      });
    },

    openStoryView: (nodeId: string, opts?: { variationId?: string }) => {
      const state = get();

      // GATE: Prevent navigation during camera animation
      if (state.isAnimating) {
        devLog('[Navigation] Animation in progress, ignoring click');
        return;
      }

      // Set animation flag
      get().setIsAnimating(true);

      // GATE: Prevent access to locked nodes (L1/L2 after L3 convergence)
      if (state.progress.lockedNodes?.includes(nodeId)) {
        devWarn(
          `[Navigation] Cannot open locked node: ${nodeId}. Journey has crystallized at L3 convergence.`,
        );
        get().setIsAnimating(false);
        return;
      }

      // Check if this is an L3 node
      if (isL3Node(nodeId)) {
        devLog('[Navigation] L3 node detected, opening assembly view');
        void state.openL3AssemblyView(nodeId);
        // Clear animation flag after delay
        get().setIsAnimating(false);
        return;
      }

      // Check if this is an L4 node (future: special handling)
      if (isL4Node(nodeId)) {
        devLog('[Navigation] L4 node detected');
        // Future: Route to terminal view
        // For now, proceed with normal StoryView
      }

      // Idempotency check: if already viewing this node, don't re-record
      if (state.activeVisit && state.activeVisit.nodeId === nodeId) {
        devLog('[Navigation] Already viewing', nodeId, '- skipping visit recording');
        // Clear animation flag
        get().setIsAnimating(false);
        return;
      }

      // Finalize any existing active visit before starting a new one
      if (state.activeVisit) {
        state.finalizeActiveVisit();
      }

      // Record visit at navigation boundary
      state.visitNode(nodeId);

      // Set active visit for duration tracking
      set((state) => {
        state.activeVisit = {
          nodeId,
          startTime: Date.now(),
        };

        // Initialize duration to 0 (will be finalized on close)
        const visitRecord = state.progress.visitedNodes[nodeId];
        if (visitRecord) {
          visitRecord.duration = 0;
          if (opts?.variationId) {
            visitRecord.variationId = opts.variationId;
          }
        }
      });

      // Normal node: open StoryView
      set((state) => {
        state.selectedNode = nodeId;
        state.storyViewOpen = true;
      });

      devLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      devLog(`[Navigation] 🎯 USER CLICKED: ${nodeId}`);
      devLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // CameraController will clear the animation flag when the spring settles
    },

    closeStoryView: () => {
      set((state) => {
        state.storyViewOpen = false;
      });
      // Clear animation flag to restore map interaction
      get().setIsAnimating(false);
    },

    saveProgress: () => {
      const state = get();
      const savedState = buildSavedState(
        state.progress,
        state.preferences,
        new Date().toISOString(),
      );

      const success = progressRepository.save(savedState);
      if (!success) {
        devError('Failed to save progress to localStorage');
      }
    },

    loadProgress: () => {
      const result = progressRepository.load(get().nodes);
      if (result.status === 'empty') {
        return;
      }

      if (result.status === 'invalid') {
        devError('Invalid saved state format');
        return;
      }

      for (const migration of result.migrations) {
        devLog(`Applied saved-state migration: ${migration}`);
      }

      set((state) => {
        state.progress = result.savedState.progress;
        state.preferences = result.savedState.preferences;
      });
    },

    exportProgress: () => {
      const state = get();
      const exportData = buildSavedState(
        state.progress,
        state.preferences,
        new Date().toISOString(),
      );
      return serializeSavedState(exportData);
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
        if (!node) {
          continue;
        }

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

      if (!node) {
        return false;
      }

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
