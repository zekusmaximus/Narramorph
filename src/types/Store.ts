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
  journeyTracking?: JourneyTracking;

  // L2 node unlocking - tracks which characters have had their L1 initial_state read
  unlockedL2Characters: string[]; // character IDs like 'archaeologist', 'algorithm', 'last-human'

  // L3 assembly viewing history
  l3AssembliesViewed?: L3AssemblyViewRecord[];
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

  // UI state
  viewport: MapViewport;
  selectedNode: string | null;
  hoveredNode: string | null;
  storyViewOpen: boolean;

  // L3 Assembly State
  l3AssemblyCache: Map<string, L3Assembly>;
  l3AssemblyViewOpen: boolean;
  currentL3Assembly: L3Assembly | null;

  // Reading statistics (computed)
  stats: ReadingStats;

  // Actions
  loadStory: (storyId: string) => Promise<void>;
  visitNode: (nodeId: string) => void;
  updateTemporalAwareness: () => void;
  updateJourneyTracking: () => void;
  recordL2Choice: (choice: 'accept' | 'resist' | 'invest') => void;
  getConditionContext: (nodeId?: string) => ConditionContext;
  buildL3Assembly: () => L3Assembly | null;
  getOrBuildL3Assembly: () => L3Assembly | null;
  clearL3AssemblyCache: () => void;
  openL3AssemblyView: () => void;
  closeL3AssemblyView: () => void;
  trackL3AssemblyView: (assembly: L3Assembly) => void;
  markL3SectionRead: (section: 'arch' | 'algo' | 'hum' | 'conv') => void;
  updateViewport: (viewport: Partial<MapViewport>) => void;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  openStoryView: (nodeId: string) => void;
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