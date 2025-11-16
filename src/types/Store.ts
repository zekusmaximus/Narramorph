import type {
  StoryNode,
  TransformationState,
  Theme,
  TextSize,
  MapViewport,
  NodeUIState,
  ConnectionUIState,
} from './Node';
import type { Connection, StoryData } from './Story';
import type { JourneyTracking, ConditionContext, L3Assembly } from './Variation';

/**
 * Record of a single visit to a node
 */
export interface VisitRecord {
  visitCount: number; // Total number of visits
  visitTimestamps: string[]; // ISO-8601 timestamps of each visit
  currentState: TransformationState; // Current transformation state
  timeSpent: number; // Total seconds spent on this node
  lastVisited: string; // ISO-8601 timestamp of last visit
  variationId?: string | null; // ID of the variation shown (null for L3 nodes)
  duration?: number; // Duration of current/last visit in seconds (0 until finalized)
  recentVariationIds?: string[]; // ALL variation IDs ever shown for this node (absolute deduplication - never repeat)
}

/**
 * Special transformation that has been unlocked
 */
export interface UnlockedTransformation {
  nodeId: string;
  transformationId: string;
  unlockedAt: string; // ISO-8601 timestamp
}

/**
 * L3 Assembly View Record
 */
export interface L3AssemblyViewRecord {
  viewedAt: string; // ISO timestamp
  journeyPattern: string;
  pathPhilosophy: string;
  synthesisPattern: string;
  awarenessLevel: 'low' | 'medium' | 'high';
  sectionsRead: {
    arch: boolean;
    algo: boolean;
    hum: boolean;
    conv: boolean;
  };
}

/**
 * Complete user progress through the story
 */
export interface UserProgress {
  visitedNodes: Record<string, VisitRecord>; // nodeId -> VisitRecord
  readingPath: string[]; // Ordered array of visited node IDs
  unlockedConnections: string[]; // IDs of connections that have been revealed
  specialTransformations: UnlockedTransformation[];
  currentNode?: string; // ID of currently active node (if in session)
  totalTimeSpent: number; // Total seconds in story
  lastActiveTimestamp: string; // ISO-8601 timestamp of last activity

  // Temporal awareness tracking for Eternal Return
  temporalAwarenessLevel: number; // 0-100, tracks cross-temporal exploration
  characterNodesVisited: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };

  // Journey and philosophy tracking for variation selection
  journeyTracking: JourneyTracking;

  // L2 node unlocking - tracks which characters have had their L1 initial_state read
  unlockedL2Characters: string[]; // character IDs like 'archaeologist', 'algorithm', 'last-human'

  // L3 assembly viewing history
  l3AssembliesViewed?: L3AssemblyViewRecord[];

  // L3 convergence gate - once L3 is opened, L1/L2 nodes lock (one-way gate)
  l3ConvergenceTriggered?: boolean; // true after first L3 node visit

  // Locked nodes (cannot be accessed) - used after L3 convergence
  lockedNodes?: string[]; // nodeIds that are locked
}

/**
 * User preferences for reading experience
 */
export interface UserPreferences {
  textSize: TextSize;
  theme: Theme;
  reduceMotion: boolean; // Respect prefers-reduced-motion
  showTutorial: boolean; // Show onboarding on next visit
  showReadingStats: boolean; // Display reading statistics
}

/**
 * Complete saved state (localStorage format)
 */
export interface SavedState {
  version: string; // Schema version (e.g., "1.0.0")
  timestamp: string; // ISO-8601 timestamp of last save
  progress: UserProgress;
  preferences: UserPreferences;
}

/**
 * Reading statistics
 */
export interface ReadingStats {
  totalNodesVisited: number;
  totalNodes: number;
  percentageExplored: number;
  totalTimeSpent: number; // Seconds
  averageTimePerNode: number; // Seconds
  transformationsAvailable: number;
  criticalPathNodesVisited: number;
  criticalPathNodesTotal: number;
  characterBreakdown: {
    archaeologist: { visited: number; total: number };
    algorithm: { visited: number; total: number };
    lastHuman: { visited: number; total: number };
  };
}

/**
 * Validation result for story content
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'missing_node' | 'invalid_connection' | 'orphaned_node' | 'duplicate_id' | 'invalid_format';
  message: string;
  nodeId?: string;
  connectionId?: string;
}

export interface ValidationWarning {
  type: 'dead_end' | 'unreachable' | 'missing_metadata' | 'long_content';
  message: string;
  nodeId?: string;
}

/**
 * Main Zustand store interface for the application
 */
export interface StoryStore {
  // Story content (loaded from JSON)
  storyData: StoryData | null;
  nodes: Map<string, StoryNode>;
  connections: Map<string, Connection>;

  // User progress
  progress: UserProgress;

  // Active visit tracking (for duration calculation)
  activeVisit: {
    nodeId: string;
    startTime: number; // milliseconds since epoch
  } | null;

  // UI state
  viewport: MapViewport;
  selectedNode: string | null;
  hoveredNode: string | null;
  storyViewOpen: boolean;
  isAnimating: boolean; // Camera animation in progress

  // L3 Assembly State
  l3AssemblyCache: Map<string, L3Assembly>;
  l3AssemblyViewOpen: boolean;
  currentL3Assembly: L3Assembly | null;

  // Unlock System State
  unlockConfigs: Map<string, import('./Unlock').NodeUnlockConfig>;
  recentlyUnlockedNodes: string[];

  // Reading statistics (computed)
  stats: ReadingStats;

  // Actions
  loadStory: (storyId: string) => Promise<void>;
  visitNode: (nodeId: string) => void;
  updateTemporalAwareness: () => void;
  updateJourneyTracking: () => void;
  recordL2Choice: (choice: 'accept' | 'resist' | 'invest') => void;
  getConditionContext: (
    nodeId?: string,
    opts?: { includeRecentVariations?: boolean },
  ) => ConditionContext;
  updateActiveVisitVariation: (variationId: string) => void;
  finalizeActiveVisit: () => void;
  buildL3Assembly: () => L3Assembly | null;
  getOrBuildL3Assembly: () => L3Assembly | null;
  clearL3AssemblyCache: () => void;
  openL3AssemblyView: (nodeId?: string) => void;
  closeL3AssemblyView: () => void;
  trackL3AssemblyView: (assembly: L3Assembly) => void;
  markL3SectionRead: (section: 'arch' | 'algo' | 'hum' | 'conv') => void;
  evaluateUnlocks: () => void;
  getUnlockProgress: (nodeId: string) => import('./Unlock').UnlockProgress | null;
  clearUnlockNotifications: () => void;
  updateViewport: (viewport: Partial<MapViewport>) => void;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setIsAnimating: (value: boolean) => void;
  openStoryView: (nodeId: string, opts?: { variationId?: string }) => void;
  closeStoryView: () => void;
  saveProgress: () => void;
  loadProgress: () => void;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
  clearProgress: () => void;

  // Preferences
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // Computed selectors
  getNodeState: (nodeId: string) => NodeUIState;
  getConnectionState: (connectionId: string) => ConnectionUIState;
  getAvailableTransformations: () => string[];
  getReadingStats: () => ReadingStats;
  updateStats: () => void;
  canVisitNode: (nodeId: string) => boolean;
}
