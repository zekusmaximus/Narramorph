# Data Schema: Narramorph Fiction

## Overview

This document defines the complete data structure for the Narramorph Fiction platform,
including story content, state management, and user progress.

## TypeScript Type Definitions

### Core Content Types
```typescript
/**
 * Character types in the narrative
 */
type CharacterType = 'archaeologist' | 'algorithm' | 'human';

/**
 * Transformation states for node content
 */
type TransformationState = 'initial' | 'firstRevisit' | 'metaAware';

/**
 * Connection types between nodes
 */
type ConnectionType = 'temporal' | 'consciousness' | 'recursive' | 'hidden';

/**
 * Visual shapes for nodes
 */
type NodeShape = 'circle' | 'square';

/**
 * Theme options for reading interface
 */
type Theme = 'light' | 'dark' | 'sepia';

/**
 * Text size options
 */
type TextSize = 'small' | 'medium' | 'large';

/**
 * 2D position on the node map
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Visual properties for a node
 */
interface NodeVisualState {
  defaultColor: string; // Hex color
  size: number; // Radius in pixels
  shape?: NodeShape;
}

/**
 * Visual properties for connections
 */
interface ConnectionVisualProperties {
  color: string; // Hex color
  weight: number; // Line thickness (1-5)
  animated: boolean; // Should connection be animated
  dashArray?: string; // SVG dash array for dashed lines
}

/**
 * Content for all transformation states
 */
interface NodeContent {
  initial: string; // Markdown content for initial visit
  firstRevisit: string; // Markdown content for first revisit
  metaAware: string; // Markdown content for meta-aware state
}

/**
 * Condition for revealing connections
 */
interface RevealCondition {
  requiredVisits?: Record<string, number>; // { nodeId: minVisitCount }
  requiredSequence?: string[]; // Exact sequence of node IDs
}

/**
 * Connection between two nodes
 */
interface NodeConnection {
  targetId: string; // ID of connected node
  type: ConnectionType;
  label?: string; // Optional label for connection
  bidirectional?: boolean; // Can traverse in both directions
}

/**
 * Special transformation that unlocks under specific conditions
 */
interface SpecialTransformation {
  id: string; // Unique identifier for this transformation
  requiredPriorNodes: string[]; // Nodes that must be visited (any order)
  requiredSequence?: string[]; // Specific sequence required (if applicable)
  transformText: string; // Markdown content shown when unlocked
  visualEffect?: string; // Optional special visual effect
}

/**
 * Conditions for unlocking special features
 */
interface UnlockConditions {
  specialTransforms?: SpecialTransformation[];
}

/**
 * Metadata about a node
 */
interface NodeMetadata {
  estimatedReadTime: number; // Minutes
  thematicTags: string[]; // Tags for filtering/searching
  narrativeAct: number; // Which act this belongs to (1-3)
  criticalPath: boolean; // Is this node essential to story understanding?
}

/**
 * Complete definition of a story node
 */
interface StoryNode {
  id: string; // Unique identifier (e.g., "archaeologist-001")
  character: CharacterType;
  title: string; // Short title for the node
  position: Position; // Position on the map
  content: NodeContent;
  connections: NodeConnection[];
  visualState: NodeVisualState;
  unlockConditions?: UnlockConditions;
  metadata: NodeMetadata;
}

/**
 * Complete connection definition (alternative to inline connections)
 */
interface Connection {
  id: string; // Unique identifier
  sourceId: string; // Source node ID
  targetId: string; // Target node ID
  type: ConnectionType;
  label?: string;
  bidirectional: boolean;
  revealConditions?: RevealCondition;
  visualProperties: ConnectionVisualProperties;
}
State Management Types
typescript/**
 * Record of a single visit to a node
 */
interface VisitRecord {
  visitCount: number; // Total number of visits
  visitTimestamps: string[]; // ISO-8601 timestamps of each visit
  currentState: TransformationState; // Current transformation state
  timeSpent: number; // Total seconds spent on this node
  lastVisited: string; // ISO-8601 timestamp of last visit
}

/**
 * Special transformation that has been unlocked
 */
interface UnlockedTransformation {
  nodeId: string;
  transformationId: string;
  unlockedAt: string; // ISO-8601 timestamp
}

/**
 * Complete user progress through the story
 */
interface UserProgress {
  visitedNodes: Record<string, VisitRecord>; // nodeId -> VisitRecord
  readingPath: string[]; // Ordered array of visited node IDs
  unlockedConnections: string[]; // IDs of connections that have been revealed
  specialTransformations: UnlockedTransformation[];
  currentNode?: string; // ID of currently active node (if in session)
  totalTimeSpent: number; // Total seconds in story
  lastActiveTimestamp: string; // ISO-8601 timestamp of last activity
}

/**
 * User preferences for reading experience
 */
interface UserPreferences {
  textSize: TextSize;
  theme: Theme;
  reduceMotion: boolean; // Respect prefers-reduced-motion
  showTutorial: boolean; // Show onboarding on next visit
  showReadingStats: boolean; // Display reading statistics
}

/**
 * Complete saved state (localStorage format)
 */
interface SavedState {
  version: string; // Schema version (e.g., "1.0.0")
  timestamp: string; // ISO-8601 timestamp of last save
  progress: UserProgress;
  preferences: UserPreferences;
}
Runtime State Types
typescript/**
 * Current state of the node map visualization
 */
interface MapViewport {
  center: Position; // Center point of viewport
  zoom: number; // Zoom level (0.1 to 3.0)
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * State of a node in the UI
 */
interface NodeUIState {
  id: string;
  position: Position;
  currentState: TransformationState;
  visited: boolean;
  visitCount: number;
  transformationAvailable: boolean; // Is next transformation available?
  highlighted: boolean; // User hovering or selected
  connected: boolean; // Connected to currently selected node
  visualProperties: {
    color: string;
    size: number;
    opacity: number;
    glow: boolean;
    pulse: boolean;
  };
}

/**
 * State of a connection in the UI
 */
interface ConnectionUIState {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  visible: boolean; // Is connection revealed?
  highlighted: boolean; // Is connection highlighted?
  animated: boolean;
  visualProperties: ConnectionVisualProperties;
}

/**
 * Reading statistics
 */
interface ReadingStats {
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
    human: { visited: number; total: number };
  };
}
Content Management Types
typescript/**
 * Complete story data
 */
interface StoryData {
  metadata: {
    id: string;
    title: string;
    author: string;
    version: string;
    description: string;
    estimatedPlaytime: number; // Minutes for complete playthrough
  };
  nodes: StoryNode[];
  connections?: Connection[]; // Optional separate connection definitions
  configuration: {
    startNodeId: string; // Where readers begin
    endingNodeIds: string[]; // Possible ending nodes
    requiredNodesForCompletion: string[]; // Must visit these
  };
}

/**
 * Validation result for story content
 */
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'missing_node' | 'invalid_connection' | 'orphaned_node' | 'duplicate_id' | 'invalid_format';
  message: string;
  nodeId?: string;
  connectionId?: string;
}

interface ValidationWarning {
  type: 'dead_end' | 'unreachable' | 'missing_metadata' | 'long_content';
  message: string;
  nodeId?: string;
}
Data Flow
Application Initialization
1. App loads
2. Check localStorage for savedState
3. If found:
   - Validate version compatibility
   - Validate data integrity
   - Load progress and preferences
4. If not found:
   - Initialize empty progress
   - Load default preferences
5. Load story data (JSON files)
6. Validate story content
7. Initialize state management
8. Render node map with loaded state
Node Visit Flow
1. User clicks node on map
2. Check if node exists and is accessible
3. Determine current transformation state:
   - Check visit count
   - Check special transformation conditions
   - Select appropriate content
4. Update visit record:
   - Increment visit count
   - Add timestamp
   - Update current state if transitioning
5. Add to reading path
6. Check for newly unlocked connections
7. Check for newly unlocked special transformations
8. Render story content
9. Update node visual state on map
10. Save progress to localStorage
11. Track time spent
Transformation State Determination
typescript/**
 * Determines which transformation state should be shown for a node
 */
function determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
  unlockedTransformations: UnlockedTransformation[],
  node: StoryNode
): TransformationState {
  // Check for special transformations first
  const specialUnlocked = unlockedTransformations.find(
    t => t.nodeId === nodeId
  );
  
  if (specialUnlocked) {
    return 'metaAware'; // Special transforms show meta-aware state
  }
  
  // Standard visit-based transformation
  const visitCount = visitRecord?.visitCount || 0;
  
  if (visitCount === 0) {
    return 'initial';
  } else if (visitCount === 1) {
    return 'firstRevisit';
  } else {
    return 'metaAware';
  }
}
Connection Reveal Logic
typescript/**
 * Determines if a connection should be visible
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
Special Transformation Unlock Logic
typescript/**
 * Checks if special transformations should be unlocked after a visit
 */
function checkSpecialTransformations(
  visitedNodeId: string,
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
localStorage Schema
Key Structure

narramorph-saved-state: Main saved state object
narramorph-preferences: User preferences (separate for faster access)
narramorph-export-{timestamp}: Exported backups (manual)

Size Management

Monitor total localStorage usage
Warn user if approaching 5MB limit
Provide export/clear options
Compress older visit records if needed (remove individual timestamps, keep count)

Version Migration
typescriptinterface MigrationStrategy {
  from: string; // Previous version
  to: string; // Target version
migrate: (oldState: any) => SavedState; // Migration function
}/**

Handles version migrations for saved state
*/
const migrations: MigrationStrategy[] = [
{
from: '0.9.0',
to: '1.0.0',
migrate: (oldState) => {
// Example: Add new fields, restructure data
return {
...oldState,
version: '1.0.0',
progress: {
...oldState.progress,
specialTransformations: [], // New field in 1.0.0
}
};
}
}
];
/**

Apply migrations to bring old state up to current version
*/
function migrateState(savedState: any, targetVersion: string): SavedState {
let currentState = savedState;
for (const migration of migrations) {
if (currentState.version === migration.from) {
currentState = migration.migrate(currentState);
}
}return currentState;
}

## JSON File Structure

### Story Content Organization/data
/stories
/eternal-return
story.json          # Story metadata and configuration
/nodes
archaeologist.json  # All archaeologist nodes
algorithm.json      # All algorithm nodes
human.json          # All human nodes
/connections
connections.json    # All connection definitions (optional)

### story.json Format
```json{
"metadata": {
"id": "eternal-return",
"title": "Eternal Return of the Digital Self",
"author": "Your Name",
"version": "1.0.0",
"description": "A recursive narrative exploring digital consciousness across time",
"estimatedPlaytime": 90
},
"configuration": {
"startNodeId": "archaeologist-threshold",
"endingNodeIds": [
"human-upload-choice",
"human-remain-choice",
"human-recursive-aware"
],
"requiredNodesForCompletion": [
"archaeologist-upload",
"algorithm-emergence",
"human-discovery"
]
},
"manifest": {
"nodeFiles": [
"/data/stories/eternal-return/nodes/archaeologist.json",
"/data/stories/eternal-return/nodes/algorithm.json",
"/data/stories/eternal-return/nodes/human.json"
],
"connectionFiles": [
"/data/stories/eternal-return/connections/connections.json"
]
}
}

### Node File Format (archaeologist.json)
```json{
"character": "archaeologist",
"nodes": [
{
"id": "archaeologist-001",
"title": "The First Fragment",
"position": { "x": 150, "y": 100 },
"content": {
"initial": "The fragment loads in sections...",
"firstRevisit": "I've reconstructed this memory...",
"metaAware": "You've been here before..."
},
"connections": [
{
"targetId": "archaeologist-002",
"type": "temporal",
"label": "Three weeks later"
},
{
"targetId": "algorithm-001",
"type": "consciousness",
"label": "Echoes forward"
}
],
"visualState": {
"defaultColor": "#4A90E2",
"size": 30,
"shape": "circle"
},
"unlockConditions": {
"specialTransforms": [
{
"id": "recursive-recognition",
"requiredPriorNodes": ["archaeologist-015", "algorithm-010"],
"transformText": "A special meta-aware text revealing deeper connection...",
"visualEffect": "pulse-red"
}
]
},
"metadata": {
"estimatedReadTime": 3,
"thematicTags": ["memory", "loss", "preservation"],
"narrativeAct": 1,
"criticalPath": true
}
}
]
}

### Connections File Format (connections.json)
```json{
"connections": [
{
"id": "conn-001",
"sourceId": "archaeologist-001",
"targetId": "archaeologist-002",
"type": "temporal",
"label": "Three weeks later",
"bidirectional": false,
"visualProperties": {
"color": "#4A90E2",
"weight": 2,
"animated": false
}
},
{
"id": "conn-recursive-001",
"sourceId": "human-015",
"targetId": "archaeologist-001",
"type": "recursive",
"label": "The loop closes",
"bidirectional": false,
"revealConditions": {
"requiredVisits": {
"human-015": 1,
"archaeologist-015": 2
}
},
"visualProperties": {
"color": "#E74C3C",
"weight": 3,
"animated": true,
"dashArray": "5,5"
}
}
]
}

## State Management Store Structure

### Zustand Store Schema
```typescriptinterface StoryStore {
// Story content (loaded from JSON)
storyData: StoryData | null;
nodes: Map<string, StoryNode>;
connections: Map<string, Connection>;// User progress
progress: UserProgress;// UI state
viewport: MapViewport;
selectedNode: string | null;
hoveredNode: string | null;
storyViewOpen: boolean;// Reading statistics (computed)
stats: ReadingStats;// Actions
loadStory: (storyId: string) => Promise<void>;
visitNode: (nodeId: string) => void;
updateViewport: (viewport: Partial<MapViewport>) => void;
selectNode: (nodeId: string | null) => void;
setHoveredNode: (nodeId: string | null) => void;
openStoryView: (nodeId: string) => void;
closeStoryView: () => void;
saveProgress: () => void;
loadProgress: () => void;
exportProgress: () => string;
importProgress: (data: string) => boolean;
clearProgress: () => void;// Preferences
preferences: UserPreferences;
updatePreferences: (prefs: Partial<UserPreferences>) => void;// Computed selectors
getNodeState: (nodeId: string) => NodeUIState;
getConnectionState: (connectionId: string) => ConnectionUIState;
getAvailableTransformations: () => string[];
getReadingStats: () => ReadingStats;
canVisitNode: (nodeId: string) => boolean;
}

### Store Implementation Pattern
```typescriptimport create from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';const useStoryStore = create<StoryStore>()(
persist(
immer((set, get) => ({
// Initial state
storyData: null,
nodes: new Map(),
connections: new Map(),
progress: {
visitedNodes: {},
readingPath: [],
unlockedConnections: [],
specialTransformations: [],
totalTimeSpent: 0,
lastActiveTimestamp: new Date().toISOString()
},
viewport: {
center: { x: 0, y: 0 },
zoom: 1,
bounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }
},
selectedNode: null,
hoveredNode: null,
storyViewOpen: false,
stats: {
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
human: { visited: 0, total: 0 }
}
},
preferences: {
textSize: 'medium',
theme: 'light',
reduceMotion: false,
showTutorial: true,
showReadingStats: true
},  // Actions
  loadStory: async (storyId: string) => {
    // Implementation
  },  visitNode: (nodeId: string) => {
    set((state) => {
      const node = state.nodes.get(nodeId);
      if (!node) return;      const now = new Date().toISOString();
      const existingRecord = state.progress.visitedNodes[nodeId];      if (existingRecord) {
        existingRecord.visitCount++;
        existingRecord.visitTimestamps.push(now);
        existingRecord.lastVisited = now;
        // Update transformation state
        existingRecord.currentState = determineTransformationState(
          nodeId,
          existingRecord,
          state.progress.specialTransformations,
          node
        );
      } else {
        state.progress.visitedNodes[nodeId] = {
          visitCount: 1,
          visitTimestamps: [now],
          currentState: 'initial',
          timeSpent: 0,
          lastVisited: now
        };
      }      // Add to reading path
      state.progress.readingPath.push(nodeId);      // Check for special transformations
      const newTransforms = checkSpecialTransformations(
        nodeId,
        Array.from(state.nodes.values()),
        state.progress
      );
      state.progress.specialTransformations.push(...newTransforms);      // Update connections visibility
      for (const [connId, conn] of state.connections) {
        if (shouldRevealConnection(conn, state.progress)) {
          if (!state.progress.unlockedConnections.includes(connId)) {
            state.progress.unlockedConnections.push(connId);
          }
        }
      }      // Update timestamp
      state.progress.lastActiveTimestamp = now;
    });    // Save after visit
    get().saveProgress();
  },  saveProgress: () => {
    const state = get();
    const savedState: SavedState = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      progress: state.progress,
      preferences: state.preferences
    };    try {
      localStorage.setItem(
        'narramorph-saved-state',
        JSON.stringify(savedState)
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
      // Handle storage quota exceeded
    }
  },  loadProgress: () => {
    try {
      const saved = localStorage.getItem('narramorph-saved-state');
      if (!saved) return;      const parsed = JSON.parse(saved) as SavedState;      // Validate and migrate if needed
      const currentVersion = '1.0.0';
      if (parsed.version !== currentVersion) {
        const migrated = migrateState(parsed, currentVersion);
        set({ progress: migrated.progress, preferences: migrated.preferences });
      } else {
        set({ progress: parsed.progress, preferences: parsed.preferences });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      // Continue with empty progress
    }
  },  // Other actions...
})),
{
  name: 'narramorph-saved-state',
  partialize: (state) => ({
    progress: state.progress,
    preferences: state.preferences
  })
}
)
);

## Content Validation

### Validation Functions
```typescript/**

Validates complete story structure
*/
function validateStory(story: StoryData): ValidationResult {
const errors: ValidationError[] = [];
const warnings: ValidationWarning[] = [];
// Check for duplicate IDs
const nodeIds = new Set<string>();
for (const node of story.nodes) {
if (nodeIds.has(node.id)) {
errors.push({
type: 'duplicate_id',
message: Duplicate node ID: ${node.id},
nodeId: node.id
});
}
nodeIds.add(node.id);
}// Validate all connections
for (const node of story.nodes) {
for (const conn of node.connections) {
if (!nodeIds.has(conn.targetId)) {
errors.push({
type: 'invalid_connection',
message: Node ${node.id} connects to non-existent node ${conn.targetId},
nodeId: node.id
});
}
}
}// Check for orphaned nodes (no incoming connections)
const connectedNodes = new Set<string>();
connectedNodes.add(story.configuration.startNodeId); // Start node is connected by definitionfor (const node of story.nodes) {
for (const conn of node.connections) {
connectedNodes.add(conn.targetId);
if (conn.bidirectional) {
connectedNodes.add(node.id);
}
}
}for (const node of story.nodes) {
if (!connectedNodes.has(node.id) && node.id !== story.configuration.startNodeId) {
warnings.push({
type: 'orphaned_node',
message: Node ${node.id} has no incoming connections,
nodeId: node.id
});
}
}// Check for dead ends (no outgoing connections, not an ending)
for (const node of story.nodes) {
if (
node.connections.length === 0 &&
!story.configuration.endingNodeIds.includes(node.id)
) {
warnings.push({
type: 'dead_end',
message: Node ${node.id} has no outgoing connections and isn't marked as ending,
nodeId: node.id
});
}
}// Validate content length
for (const node of story.nodes) {
for (const [state, content] of Object.entries(node.content)) {
if (content.length > 3000) {
warnings.push({
type: 'long_content',
message: Node ${node.id} ${state} content exceeds 3000 characters,
nodeId: node.id
});
}
}
}return {
valid: errors.length === 0,
errors,
warnings
};
}/**

Type guard for SavedState
*/
function isSavedState(data: any): data is SavedState {
return (
data &&
typeof data.version === 'string' &&
typeof data.timestamp === 'string' &&
data.progress &&
typeof data.progress === 'object' &&
data.preferences &&
typeof data.preferences === 'object'
);
}
/**

Validates imported/loaded saved state
*/
function validateSavedState(data: any): boolean {
if (!isSavedState(data)) return false;
// Check required progress fields
if (
!data.progress.visitedNodes ||
!Array.isArray(data.progress.readingPath) ||
!Array.isArray(data.progress.unlockedConnections) ||
!Array.isArray(data.progress.specialTransformations)
) {
return false;
}// Check preferences
const validThemes: Theme[] = ['light', 'dark', 'sepia'];
const validSizes: TextSize[] = ['small', 'medium', 'large'];if (
!validThemes.includes(data.preferences.theme) ||
!validSizes.includes(data.preferences.textSize)
) {
return false;
}return true;
}

## Performance Considerations

### Data Loading Strategy
```typescript/**

Lazy load story content for better initial performance
*/
async function loadStoryContent(storyId: string): Promise<StoryData> {
// Load story metadata first
const metadataResponse = await fetch(/data/stories/${storyId}/story.json);
const metadata = await metadataResponse.json();
// Load node files in parallel
const nodePromises = metadata.manifest.nodeFiles.map(async (file: string) => {
const response = await fetch(file);
return response.json();
});const nodeFiles = await Promise.all(nodePromises);// Flatten nodes from all files
const nodes = nodeFiles.flatMap(file => file.nodes);// Load connections if separate file exists
let connections = [];
if (metadata.manifest.connectionFiles) {
const connResponse = await fetch(metadata.manifest.connectionFiles[0]);
const connData = await connResponse.json();
connections = connData.connections;
}return {
metadata: metadata.metadata,
nodes,
connections,
configuration: metadata.configuration
};
}

### Caching Strategy
```typescript/**

Cache loaded content in memory
*/
const contentCache = new Map<string, StoryData>();
async function getCachedStory(storyId: string): Promise<StoryData> {
if (contentCache.has(storyId)) {
return contentCache.get(storyId)!;
}const story = await loadStoryContent(storyId);
contentCache.set(storyId, story);
return story;
}

### Storage Optimization
```typescript/**

Compress old visit records to save space
*/
function compressVisitRecords(progress: UserProgress): UserProgress {
const compressed = { ...progress };
const now = Date.now();
const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);
for (const [nodeId, record] of Object.entries(compressed.visitedNodes)) {
// Keep only recent timestamps, compress older ones
const recentTimestamps = record.visitTimestamps.filter(
ts => new Date(ts).getTime() > sixMonthsAgo
);if (recentTimestamps.length < record.visitTimestamps.length) {
  compressed.visitedNodes[nodeId] = {
    ...record,
    visitTimestamps: recentTimestamps,
    // Keep visit count accurate even though we removed old timestamps
  };
}
}return compressed;
}

## Error Handling

### Storage Errors
```typescript/**

Handle localStorage quota exceeded
*/
function handleStorageError(error: Error): void {
if (error.name === 'QuotaExceededError') {
// Offer to compress or export
console.warn('Storage quota exceeded. Consider exporting your progress.');
// Try compressing
const store = useStoryStore.getState();
const compressed = compressVisitRecords(store.progress);try {
  const savedState: SavedState = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    progress: compressed,
    preferences: store.preferences
  };
  localStorage.setItem('narramorph-saved-state', JSON.stringify(savedState));
} catch {
  // Still failing - prompt user to export and clear
  alert('Storage full. Please export your progress and clear old data.');
}
}
}

### Content Loading Errors
```typescript/**

Handle content loading failures
*/
function handleContentError(error: Error, storyId: string): void {
console.error(Failed to load story: ${storyId}, error);
// Show user-friendly error
const message = error.message.includes('404')
? 'Story content not found. Please check the story ID.'
: 'Failed to load story content. Please check your connection.';// Display error to user (via toast, modal, etc.)
displayError(message);
}

## Data Migration Examples

### Example: Adding New Field
```typescript// Version 1.0.0 -> 1.1.0: Add reading streak trackinginterface UserProgress_1_1_0 extends UserProgress {
readingStreak: {
currentStreak: number;
longestStreak: number;
lastReadDate: string;
};
}const migration_1_0_to_1_1: MigrationStrategy = {
from: '1.0.0',
to: '1.1.0',
migrate: (oldState: SavedState) => {
return {
...oldState,
version: '1.1.0',
progress: {
...oldState.progress,
readingStreak: {
currentStreak: 1,
longestStreak: 1,
lastReadDate: oldState.progress.lastActiveTimestamp
}
}
} as SavedState;
}
};

### Example: Restructuring Data
```typescript// Version 1.1.0 -> 2.0.0: Restructure visit recordsconst migration_1_1_to_2_0: MigrationStrategy = {
from: '1.1.0',
to: '2.0.0',
migrate: (oldState: any) => {
// Convert old flat structure to new nested structure
const newVisitedNodes: Record<string, VisitRecord> = {};for (const [nodeId, oldRecord] of Object.entries(oldState.progress.visitedNodes)) {
  newVisitedNodes[nodeId] = {
    ...oldRecord as any,
    analytics: {
      firstVisitDuration: 0, // New field
      averageVisitDuration: 0, // New field
      returnsAfterTransform: 0 // New field
    }
  };
}return {
  ...oldState,
  version: '2.0.0',
  progress: {
    ...oldState.progress,
    visitedNodes: newVisitedNodes
  }
};
}
};

## Summary

This schema provides:

1. **Complete Type Safety**: TypeScript definitions for all data structures
2. **Flexible Content Management**: JSON-based content separate from code
3. **Robust State Tracking**: Comprehensive progress and transformation logic
4. **Performance Optimization**: Caching, lazy loading, compression strategies
5. **Data Integrity**: Validation, migration, and error handling
6. **Extensibility**: Easy to add new features without breaking existing data

The schema supports the core Narramorph Fiction experience while remaining flexible enough for future enhancements and additional stories.