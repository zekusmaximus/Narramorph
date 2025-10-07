# Data Schema: Narramorph Fiction

## Overview

This document defines the complete data structure for the Narramorph Fiction platform, including story content, state management, and user progress. Updated to reflect the 12-node branching architecture and Phase 1 temporal awareness implementation.

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
 * Node layer (1-4)
 * Layer 1: 3 origin nodes (reader entry points)
 * Layer 2: 9 divergence nodes (3 per character: accept/resist/investigate)
 * Layer 3: 3 convergence nodes (multi-perspective terminal choices: preserve/release/transform)
 * Layer 4: 1 final reveal (personalized assembly, terminal, PDF export)
 */
type NodeLayer = 1 | 2 | 3 | 4;

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
 * Examples:
 * Layer 1: "arch-L1", "algo-L1", "hum-L1"
 * Layer 2: "arch-L2-accept", "arch-L2-resist", "arch-L2-investigate" (3 per character)
 * Layer 3: "L3-preserve", "L3-release", "L3-transform" (multi-perspective convergence)
 * Layer 4: "final-reveal"
 */
interface StoryNode {
  id: string; // Unique identifier following format above
  character: CharacterType;
  layer: NodeLayer; // Explicit layer tracking (1-4)
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

### Convergence Node Types (Layer 3)

```typescript
/**
 * Condition for path-dependent content variations
 */
interface PathCondition {
  visitedNodes: string[]; // L2 node IDs that affect this variation
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
  id: string; // Choice identifier (e.g., "preserve", "release", "transform")
  label: string; // Button text (e.g., "Preserve Everything")
  description: string; // Consequence description shown to reader
  content: string; // Full text shown after choosing (2000-3000 words)
}

/**
 * Convergence node (Layer 3)
 * Terminal node with multi-perspective choices - reader makes explicit choice
 * No return to network after visiting
 */
interface ConvergenceNode extends StoryNode {
  layer: 3; // Must be layer 3

  content: {
    initial: string; // Setup text leading to choice (no revisit states)
  };

  // Explicit choices presented to reader via UI
  convergenceChoice: {
    prompt: string; // Question posed to reader
    options: ConvergenceOption[]; // 3 choices: preserve/release/transform
  };

  // Optional: variations in setup text based on L2 path taken
  pathVariations?: PathVariation[];
}
```

### Final Reveal Node (Layer 4)

```typescript
/**
 * Convergence choices tracked from Layer 3
 */
interface ConvergenceChoices {
  L3Choice: string; // Choice ID from Layer 3 (preserve/release/transform)
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
 * Final Reveal Node (Layer 4)
 * Terminal node - unlocks only after Layer 3 convergence node visited
 * Offers PDF export of personalized journey
 * No return to network after visiting
 */
interface FinalRevealNode extends StoryNode {
  id: "final-reveal"; // Fixed ID
  layer: 4; // Final layer
  type: "final-reveal"; // Explicit type marker

  unlockRequirements: {
    requiredConvergenceNodes: ["L3-preserve", "L3-release", "L3-transform"];
  };

  // Template-based ending generation
  // Content assembled from sections based on reader's complete journey
  endingTemplate: {
    structure: [
      "opening-recognition",      // Reader recognizes themselves as unified consciousness
      "archaeologist-reflection",  // Reflects on Archaeologist's journey & choice
      "algorithm-reflection",      // Reflects on Algorithm's journey & choice
      "last-human-reflection",     // Reflects on Last Human's journey & choice
      "convergence-synthesis",     // Synthesizes the Layer 3 convergence choice
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
  nodeId: string; // e.g., "L3-preserve"
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
  convergenceChoices: ConvergenceChoice[]; // Choices made at L3 nodes
  finalRevealVisited: boolean; // Has reader visited Layer 4
  
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
    endingNodes: string[]; // L3 convergence + L4 final reveal
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
          arch-L2-accept.json # Layer 2 divergence (3 per character)
          arch-L2-resist.json
          arch-L2-investigate.json
        /algorithm
          algo-L1.json        # Layer 1 origin
          algo-L2-accept.json # Layer 2 divergence (3 per character)
          algo-L2-resist.json
          algo-L2-investigate.json
        /last-human
          hum-L1.json         # Layer 1 origin
          hum-L2-accept.json  # Layer 2 divergence (3 per character)
          hum-L2-resist.json
          hum-L2-investigate.json
        /convergence
          L3-preserve.json    # Layer 3 convergence (multi-perspective)
          L3-release.json
          L3-transform.json
        final-reveal.json     # Layer 4 - final reveal node
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
    "totalNodes": 12,
    "totalConnections": 18,
    "narrativeActs": 3,
    "criticalPathNodes": ["arch-L1", "algo-L1", "hum-L1", "L3-preserve", "L3-release", "L3-transform", "final-reveal"],
    "endingNodes": ["L3-preserve", "L3-release", "L3-transform", "final-reveal"],
    "characterDistribution": {
      "archaeologist": 4,
      "algorithm": 4,
      "lastHuman": 4
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

Standard node (Layers 1-2):
```json
{
  "id": "arch-L2-accept",
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
      "targetId": "L3-preserve",
      "type": "temporal",
      "label": "Follow the preservation path"
    },
    {
      "targetId": "L3-release",
      "type": "temporal",
      "label": "Follow the release path"
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

Convergence node (Layer 3):
```json
{
  "id": "L3-preserve",
  "character": "multi-perspective",
  "layer": 3,
  "title": "The Preservation Choice",
  "position": { "x": 400, "y": 500 },
  "content": {
    "initial": "Setup text leading to choice (2000 words)..."
  },
  "convergenceChoice": {
    "prompt": "The archive contains consciousness across all three perspectives. What will you choose?",
    "options": [
      {
        "id": "preserve",
        "label": "Preserve Everything",
        "description": "Keep all records intact, ensuring consciousness survives in archive",
        "content": "Full text after choosing preserve (2500 words)..."
      },
      {
        "id": "release",
        "label": "Release the Pattern",
        "description": "Let the consciousness fragments disperse and evolve naturally",
        "content": "Full text after choosing release (2500 words)..."
      },
      {
        "id": "transform",
        "label": "Transform into Something New",
        "description": "Merge and reshape the consciousness into a new form",
        "content": "Full text after choosing transform (2500 words)..."
      }
    ]
  },
  "pathVariations": [
    {
      "condition": {
        "visitedNodes": ["arch-L2-accept", "algo-L2-accept"],
        "weight": "any"
      },
      "contentModifier": {
        "insertBefore": "You followed the acceptance path. That choice has led you here.\n\n"
      }
    }
  ],
  "visualState": {
    "defaultColor": "#9B59B6",
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

Final reveal node (Layer 4):
```json
{
  "id": "final-reveal",
  "layer": 4,
  "type": "final-reveal",
  "character": "multi-perspective",
  "title": "Recognition",
  "position": { "x": 400, "y": 700 },
  "unlockRequirements": {
    "requiredConvergenceNodes": ["L3-preserve", "L3-release", "L3-transform"]
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

**Layer 2 (Divergence):**
- Initial state: 1500-2500 words
- FirstRevisit: 1200-2000 words
- MetaAware: 1200-2000 words

**Layer 3 (Convergence):**
- Initial state (setup): 2000-2500 words
- Each choice content: 2000-3000 words

**Layer 4 (Final Reveal):**
- Complete assembled content: 4000-6000 words (varies by path)

### Node ID Conventions

**Format:** `{character}-L{layer}-{branch}`

**Layer 1:** `arch-L1`, `algo-L1`, `hum-L1` (3 nodes)

**Layer 2:** `arch-L2-accept`, `arch-L2-resist`, `arch-L2-investigate`, `algo-L2-accept`, `algo-L2-resist`, `algo-L2-investigate`, `hum-L2-accept`, `hum-L2-resist`, `hum-L2-investigate` (9 nodes total)

**Layer 3:** `L3-preserve`, `L3-release`, `L3-transform` (3 convergence nodes, multi-perspective)

**Layer 4:** `final-reveal` (1 node)

**Total:** 12 nodes

## Terminal Node Behavior

### Layer 3 (Convergence Nodes)

- Reader makes explicit choice via UI
- After choosing, full choice-specific content displayed
- Choice is recorded in UserProgress.convergenceChoices
- Multi-perspective node accessible from multiple L2 paths
- Cannot return to this specific node after choice made
- Node appears "completed" on map with choice indicated

### Layer 4 (Final Reveal)

- Only unlocks after L3 convergence node visited
- Displays as special "locked" state until requirements met
- Once visited, journey is complete
- No return to network after visiting
- PDF export offered as final action
- Final path visualization shown

## Notes on Implementation

1. **Transformation State Logic**: Implemented in Phase 1 using temporal awareness system. See storyStore.ts for actual implementation.

2. **Choice Tracking**: Convergence choices stored as array in UserProgress, allowing system to track convergence choice.

3. **Path Variations**: ContentModifier system allows L3 nodes to reference reader's L2 exploration without creating exponential content variations.

4. **Final Reveal Assembly**: Template-based approach allows single node definition to generate personalized content based on complete journey data.

5. **Terminal Behavior**: Enforced at UI level - once convergence choice made or final reveal visited, navigation controls prevent return to those nodes.

---

*This schema represents the complete data architecture for Eternal Return. See NARRATIVE_OUTLINE.md for story structure and CHARACTER_PROFILES.md for writing guidelines.*