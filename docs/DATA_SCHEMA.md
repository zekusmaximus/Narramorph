# Data Schema: Narramorph Fiction

## Overview

This document defines the complete data structure for the Narramorph Fiction platform, including story content, state management, and user progress. Updated to reflect the 49-node branching architecture and Phase 1 temporal awareness implementation.

## TypeScript Type Definitions

### Core Content Types

```typescript
/**
 * Character types in the narrative
 */
type CharacterType = 'archaeologist' | 'algorithm' | 'last-human';

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
 * Node layer (1-6)
 * Layers 1-4: Branching narrative
 * Layer 5: Character convergence
 * Layer 6: Final reveal
 */
type NodeLayer = 1 | 2 | 3 | 4 | 5 | 6;

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
  firstRevisit: string; // Markdown content for first revisit (temporal bleeding)
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
 * Node ID Format: "{character}-L{layer}-{branch}"
 * Examples: "arch-L1", "arch-L2-A", "arch-L3-B", "arch-L4-C"
 * Layer 5: "arch-L5", "algo-L5", "hum-L5"
 * Layer 6: "final-reveal"
 */
interface StoryNode {
  id: string; // Unique identifier following format above
  character: CharacterType;
  layer: NodeLayer; // Explicit layer tracking (1-6)
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
```

### Convergence Node Types (Layer 5)

```typescript
/**
 * Condition for path-dependent content variations
 */
interface PathCondition {
  visitedNodes: string[]; // L4 node IDs that affect this variation
  weight: 'any' | 'all' | 'majority'; // How many must be visited
  minVisits?: number; // Optional: minimum visits to those nodes
}

/**
 * Path-dependent content modification
 */
interface ContentModifier {
  insertBefore?: string; // Text to insert before base content
  insertAfter?: string; // Text to insert after base content
  emphasis?: string[]; // Phrases to emphasize based on path taken
}

/**
 * Path variation for convergence nodes
 */
interface PathVariation {
  condition: PathCondition;
  contentModifier: ContentModifier;
}

/**
 * Explicit choice option at convergence
 */
interface ConvergenceOption {
  id: string; // Choice identifier (e.g., "preserve", "erase")
  label: string; // Button text (e.g., "Preserve Everything")
  description: string; // Consequence description shown to reader
  content: string; // Full text shown after choosing (2000-3000 words)
}

/**
 * Convergence node (Layer 5)
 * Terminal node for each character - reader makes explicit choice
 * No return to network after visiting
 */
interface ConvergenceNode extends StoryNode {
  layer: 5; // Must be layer 5
  
  content: {
    initial: string; // Setup text leading to choice (no revisit states)
  };
  
  // Explicit choices presented to reader via UI
  convergenceChoice: {
    prompt: string; // Question posed to reader
    options: ConvergenceOption[]; // 2-3 choices
  };
  
  // Optional: variations in setup text based on L4 path taken
  pathVariations?: PathVariation[];
}
```

### Final Reveal Node (Layer 6)

```typescript
/**
 * Convergence choices tracked from all three character arcs
 */
interface ConvergenceChoices {
  archaeologist: string; // Choice ID from arch-L5
  algorithm: string; // Choice ID from algo-L5
  lastHuman: string; // Choice ID from hum-L5
}

/**
 * Reader's exploration pattern classification
 */
type ExplorationPattern = 
  | 'linear-archaeologist'  // Focused on single character first
  | 'linear-algorithm'
  | 'linear-last-human'
  | 'balanced-weaving'      // Alternated between all three
  | 'scattered';             // Non-linear, varied exploration

/**
 * Journey metrics incorporated into final reveal
 */
interface JourneyData {
  totalNodesVisited: number;
  temporalAwarenessLevel: number; // 0-100 from Phase 1 system
  explorationPattern: ExplorationPattern;
  characterFocus: {
    archaeologist: number; // percentage of total exploration
    algorithm: number;
    lastHuman: number;
  };
  transformationDepth: number; // How many nodes reached metaAware state
  convergenceChoices: ConvergenceChoices;
}

/**
 * Section of the final reveal with variations
 */
interface RevealSection {
  baseText: string; // Default text for this section
  variations: {
    condition: PathCondition;
    modifiedText: string; // Complete replacement text for this condition
  }[];
}

/**
 * Final Reveal Node (Layer 6)
 * Terminal node - unlocks only after all three convergence nodes visited
 * Offers PDF export of personalized journey
 * No return to network after visiting
 */
interface FinalRevealNode extends StoryNode {
  id: "final-reveal"; // Fixed ID
  layer: 6; // Beyond normal 1-5 structure
  type: "final-reveal"; // Explicit type marker
  
  unlockRequirements: {
    requiredConvergenceNodes: ["arch-L5", "algo-L5", "hum-L5"];
  };
  
  // Template-based ending generation
  // Content assembled from sections based on reader's complete journey
  endingTemplate: {
    structure: [
      "opening-recognition",      // Reader recognizes themselves as unified consciousness
      "archaeologist-reflection",  // Reflects on Archaeologist's journey & choice
      "algorithm-reflection",      // Reflects on Algorithm's journey & choice
      "last-human-reflection",     // Reflects on Last Human's journey & choice
      "convergence-synthesis",     // Synthesizes the three convergence choices
      "temporal-awareness",        // Addresses the temporal mechanics reader experienced
      "reader-address",            // Direct address to reader as participant
      "completion-offer"           // Offer to download personalized novel
    ];
    
    sections: {
      [sectionKey: string]: RevealSection;
    };
  };
  
  // Terminal node behavior
  terminal: {
    allowReturn: false; // Cannot return to network after visiting
    offerExport: true;  // PDF export offered
    showJourneyVisualization: true; // Display final path through network
  };
}
```

## State Management Types

### User Progress

```typescript
/**
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
 * Convergence choice made by reader
 */
interface ConvergenceChoice {
  nodeId: string; // e.g., "arch-L5"
  choiceId: string; // e.g., "preserve"
  timestamp: string; // ISO-8601 timestamp
}

/**
 * Complete user progress through the story
 * Includes Phase 1 temporal awareness system
 */
interface UserProgress {
  visitedNodes: Record<string, VisitRecord>; // nodeId -> VisitRecord
  readingPath: string[]; // Ordered array of visited node IDs
  unlockedConnections: string[]; // IDs of connections that have been revealed
  specialTransformations: UnlockedTransformation[];
  
  // Phase 1: Temporal Awareness System
  temporalAwarenessLevel: number; // 0-100 scale
  characterNodesVisited: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number; // Note: 'lastHuman' not 'human'
  };
  
  // Convergence tracking
  convergenceChoices: ConvergenceChoice[]; // Choices made at L5 nodes
  finalRevealVisited: boolean; // Has reader visited Layer 6
  
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
```

### Runtime State Types

```typescript
/**
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
    lastHuman: { visited: number; total: number };
  };
  temporalAwarenessLevel: number; // 0-100 from Phase 1
}
```

## Content Management Types

```typescript
/**
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
    tags: string[];
    createdAt: string; // ISO-8601
    lastModified: string; // ISO-8601
  };
  
  configuration: {
    startNode: string; // ID of starting node (typically first L1 node)
    enableTransformations: boolean;
    requireCompleteReads: boolean;
    allowBacktracking: boolean;
    saveProgress: boolean;
  };
  
  structure: {
    totalNodes: number;
    totalConnections: number;
    narrativeActs: number;
    criticalPathNodes: string[];
    endingNodes: string[]; // Convergence + final reveal
    characterDistribution: {
      archaeologist: number;
      algorithm: number;
      lastHuman: number;
    };
  };
  
  themes: {
    primary: string[];
    secondary: string[];
    motifs: string[];
  };
  
  nodes: StoryNode[];
  connections?: Connection[]; // Optional: can be embedded in nodes instead
}
```

## JSON File Structure

### Story Content Organization

```
/data
  /stories
    /eternal-return
      story.json              # Story metadata and configuration
      /content
        /archaeologist
          arch-L1.json        # Layer 1 origin
          arch-L2-A.json      # Layer 2 branches
          arch-L2-B.json
          arch-L3-A.json      # Layer 3 branches (4 total)
          arch-L3-B.json
          arch-L3-C.json
          arch-L3-D.json
          arch-L4-A.json      # Layer 4 branches (8 total)
          arch-L4-B.json
          arch-L4-C.json
          arch-L4-D.json
          arch-L4-E.json
          arch-L4-F.json
          arch-L4-G.json
          arch-L4-H.json
          arch-L5.json        # Convergence node
        /algorithm
          algo-L1.json        # Same structure as archaeologist
          algo-L2-A.json
          ...
          algo-L5.json
        /last-human
          hum-L1.json         # Same structure as archaeologist
          hum-L2-A.json
          ...
          hum-L5.json
        final-reveal.json     # Layer 6 - final reveal node
```

### story.json Format

```json
{
  "metadata": {
    "id": "eternal-return",
    "title": "Eternal Return of the Digital Self",
    "author": "Narramorph Fiction",
    "version": "1.0.0",
    "description": "An interactive narrative exploring digital consciousness across three temporal perspectives",
    "estimatedPlaytime": 90,
    "tags": ["digital consciousness", "temporal recursion", "interactive fiction"],
    "createdAt": "2025-01-15T00:00:00Z",
    "lastModified": "2025-01-15T00:00:00Z"
  },
  "configuration": {
    "startNode": "arch-L1",
    "enableTransformations": true,
    "requireCompleteReads": false,
    "allowBacktracking": true,
    "saveProgress": true
  },
  "structure": {
    "totalNodes": 49,
    "totalConnections": 96,
    "narrativeActs": 3,
    "criticalPathNodes": ["arch-L1", "algo-L1", "hum-L1", "arch-L5", "algo-L5", "hum-L5", "final-reveal"],
    "endingNodes": ["arch-L5", "algo-L5", "hum-L5", "final-reveal"],
    "characterDistribution": {
      "archaeologist": 16,
      "algorithm": 16,
      "lastHuman": 16
    }
  },
  "themes": {
    "primary": ["consciousness", "temporal recursion", "identity"],
    "secondary": ["observation", "preservation", "agency"],
    "motifs": ["fragments", "loops", "observation networks"]
  }
}
```

### Node File Format

Standard node (Layers 1-4):
```json
{
  "id": "arch-L2-A",
  "character": "archaeologist",
  "layer": 2,
  "title": "The Authentication Protocol",
  "position": { "x": 200, "y": 150 },
  "content": {
    "initial": "Full markdown content for initial state (2000-2500 words)...",
    "firstRevisit": "Full markdown content for first revisit (1500-2000 words)...",
    "metaAware": "Full markdown content for meta-aware state (1500-2000 words)..."
  },
  "connections": [
    {
      "targetId": "arch-L3-A",
      "type": "temporal",
      "label": "Follow the technical path"
    },
    {
      "targetId": "arch-L3-B",
      "type": "temporal",
      "label": "Investigate the anomaly"
    }
  ],
  "visualState": {
    "defaultColor": "#4A90E2",
    "size": 30
  },
  "metadata": {
    "estimatedReadTime": 4,
    "thematicTags": ["authentication", "methodology", "observation"],
    "narrativeAct": 1,
    "criticalPath": true
  }
}
```

Convergence node (Layer 5):
```json
{
  "id": "arch-L5",
  "character": "archaeologist",
  "layer": 5,
  "title": "The Erasure Protocol",
  "position": { "x": 400, "y": 500 },
  "content": {
    "initial": "Setup text leading to choice (2000 words)..."
  },
  "convergenceChoice": {
    "prompt": "The archive contains your consciousness. What will you choose?",
    "options": [
      {
        "id": "preserve",
        "label": "Preserve Everything",
        "description": "Keep all records intact, ensuring consciousness survives in archive",
        "content": "Full text after choosing preserve (2500 words)..."
      },
      {
        "id": "erase",
        "label": "Erase Selectively",
        "description": "Delete corrupted fragments, including parts of yourself",
        "content": "Full text after choosing erase (2500 words)..."
      },
      {
        "id": "uncertain",
        "label": "Refuse to Choose",
        "description": "Question the premise of the choice itself",
        "content": "Full text after refusing choice (2500 words)..."
      }
    ]
  },
  "pathVariations": [
    {
      "condition": {
        "visitedNodes": ["arch-L4-A", "arch-L4-B"],
        "weight": "any"
      },
      "contentModifier": {
        "insertBefore": "You investigated the temporal anomalies deeply. That investigation has led you here.\n\n"
      }
    }
  ],
  "visualState": {
    "defaultColor": "#4A90E2",
    "size": 40
  },
  "metadata": {
    "estimatedReadTime": 6,
    "thematicTags": ["choice", "convergence", "preservation"],
    "narrativeAct": 3,
    "criticalPath": true
  }
}
```

Final reveal node (Layer 6):
```json
{
  "id": "final-reveal",
  "layer": 6,
  "type": "final-reveal",
  "character": "archaeologist",
  "title": "Recognition",
  "position": { "x": 400, "y": 700 },
  "unlockRequirements": {
    "requiredConvergenceNodes": ["arch-L5", "algo-L5", "hum-L5"]
  },
  "endingTemplate": {
    "structure": [
      "opening-recognition",
      "archaeologist-reflection",
      "algorithm-reflection",
      "last-human-reflection",
      "convergence-synthesis",
      "temporal-awareness",
      "reader-address",
      "completion-offer"
    ],
    "sections": {
      "opening-recognition": {
        "baseText": "Base recognition text...",
        "variations": [
          {
            "condition": {
              "visitedNodes": ["arch-L1"],
              "weight": "all"
            },
            "modifiedText": "You began with the Archaeologist. That choice shaped everything that followed..."
          }
        ]
      }
    }
  },
  "terminal": {
    "allowReturn": false,
    "offerExport": true,
    "showJourneyVisualization": true
  },
  "visualState": {
    "defaultColor": "#9B59B6",
    "size": 50
  },
  "metadata": {
    "estimatedReadTime": 15,
    "thematicTags": ["meta-awareness", "completion", "recognition"],
    "narrativeAct": 3,
    "criticalPath": true
  }
}
```

## localStorage Schema

### Key Structure

- `narramorph-saved-state`: Main saved state object
- `narramorph-preferences`: User preferences (separate for faster access)
- `narramorph-export-{timestamp}`: Exported backups (manual)

### Size Management

- Monitor total localStorage usage
- Warn user if approaching 5MB limit
- Provide export/clear options
- Compress older visit records if needed (remove individual timestamps, keep count)

### Version Migration

```typescript
interface MigrationStrategy {
  from: string; // Previous version
  to: string; // Target version
  migrate: (oldState: any) => SavedState; // Migration function
}

/**
 * Handles version migrations for saved state
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
          temporalAwarenessLevel: 0, // New field in 1.0.0
          characterNodesVisited: {
            archaeologist: 0,
            algorithm: 0,
            lastHuman: 0
          }
        }
      };
    }
  }
];

/**
 * Apply migrations to bring old state up to current version
 */
function migrateState(savedState: any, targetVersion: string): SavedState {
  let currentState = savedState;
  
  for (const migration of migrations) {
    if (currentState.version === migration.from) {
      currentState = migration.migrate(currentState);
    }
  }
  
  return currentState;
}
```

## Content Guidelines

### Word Count Guidelines (Not Enforced by Schema)

**Layer 1 (Origins):**
- Initial state: 2500-3500 words (full opening chapter)
- FirstRevisit: 2000-2500 words
- MetaAware: 2000-2500 words

**Layer 2-4 (Branching):**
- Initial state: 1500-2500 words
- FirstRevisit: 1200-2000 words
- MetaAware: 1200-2000 words

**Layer 5 (Convergence):**
- Initial state (setup): 2000-2500 words
- Each choice content: 2000-3000 words

**Layer 6 (Final Reveal):**
- Complete assembled content: 4000-6000 words (varies by path)

### Node ID Conventions

**Format:** `{character}-L{layer}-{branch}`

**Layer 1:** `arch-L1`, `algo-L1`, `hum-L1` (3 nodes)

**Layer 2:** `arch-L2-A`, `arch-L2-B`, etc. (6 nodes total)

**Layer 3:** `arch-L3-A`, `arch-L3-B`, `arch-L3-C`, `arch-L3-D`, etc. (12 nodes total)

**Layer 4:** `arch-L4-A` through `arch-L4-H`, etc. (24 nodes total)

**Layer 5:** `arch-L5`, `algo-L5`, `hum-L5` (3 convergence nodes)

**Layer 6:** `final-reveal` (1 node)

**Total:** 49 nodes

## Terminal Node Behavior

### Layer 5 (Convergence Nodes)

- Reader makes explicit choice via UI
- After choosing, full choice-specific content displayed
- Choice is recorded in UserProgress.convergenceChoices
- Reader can continue exploring other character arcs
- Cannot return to this specific node after choice made
- Node appears "completed" on map with choice indicated

### Layer 6 (Final Reveal)

- Only unlocks after all three L5 nodes visited
- Displays as special "locked" state until requirements met
- Once visited, journey is complete
- No return to network after visiting
- PDF export offered as final action
- Final path visualization shown

## Notes on Implementation

1. **Transformation State Logic**: Implemented in Phase 1 using temporal awareness system. See storyStore.ts for actual implementation.

2. **Choice Tracking**: Convergence choices stored as array in UserProgress, allowing system to track order of convergence visits.

3. **Path Variations**: ContentModifier system allows L5 nodes to reference reader's L4 exploration without creating exponential content variations.

4. **Final Reveal Assembly**: Template-based approach allows single node definition to generate personalized content based on complete journey data.

5. **Terminal Behavior**: Enforced at UI level - once convergence choice made or final reveal visited, navigation controls prevent return to those nodes.

---

*This schema represents the complete data architecture for Eternal Return. See NARRATIVE_OUTLINE.md for story structure and CHARACTER_PROFILES.md for writing guidelines.*