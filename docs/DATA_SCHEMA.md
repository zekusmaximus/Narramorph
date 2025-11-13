# Data Schema: Narramorph Fiction

## Overview

This document defines the complete data structure for the Narramorph Fiction platform, including story content, state management, and user progress. Updated to reflect the 12-node architecture, modular Layer 3 system, and temporal awareness implementation.

**Current Status**: 1,230 / 1,233 variations complete (99.8%)

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
 * Layer 1: 3 origin nodes (reader entry points, 80 variations each)
 * Layer 2: 9 divergence nodes (3 per character: accept/resist/invest, 80 variations each)
 * Layer 3: Modular convergence (270 variations: 45 arch + 45 algo + 45 hum + 135 conv)
 * Layer 4: 3 terminal convergence variations (preserve/release/transform)
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
 * Journey patterns for Layer 3 variation selection
 * Based on reader's actual exploration path through L1-L2
 */
type JourneyPattern =
  | 'Started-Stayed' // Started with character, stayed with them
  | 'Started-Bounced' // Started with character, bounced to others
  | 'Shifted-Dominant' // Started elsewhere, this character became dominant
  | 'Began-Lightly' // Started with character but lightly engaged
  | 'Met-Later'; // Encountered this character later in journey

/**
 * Path philosophy dominant in reader's choices
 * Based on which L2 branch types they explored most
 */
type PathPhilosophy = 'accept' | 'resist' | 'invest';

/**
 * Awareness level for Layer 3 variations
 * Based on temporal awareness score (0-100)
 */
type AwarenessLevel = 'medium' | 'high' | 'maximum';

/**
 * Key for selecting specific L3 variation
 * Combines journey pattern, path philosophy, and awareness level
 */
interface L3VariationKey {
  journeyPattern: JourneyPattern;
  pathPhilosophy: PathPhilosophy;
  awarenessLevel: AwarenessLevel;
}

/**
 * Complete definition of a story node
 * Node ID Format varies by layer (see layer-specific sections below)
 */
interface StoryNode {
  id: string; // Unique identifier
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

### Layer 3 Modular System

```typescript
/**
 * Section type for Layer 3 content
 * Each L3 node consists of 4 sections assembled from variation pool
 */
type L3SectionType = 'arch-L3' | 'algo-L3' | 'hum-L3' | 'conv-L3';

/**
 * Layer 3 variation file
 * 270 total variations organized by section type and variation matrix
 */
interface L3Variation {
  id: string; // e.g., "arch-L3-001" or "conv-L3-046"
  sectionType: L3SectionType;

  // Selection criteria (3×3×5 = 45 variations per character section)
  selectionKey: L3VariationKey;

  content: string; // Markdown content (800-1200 words per section)

  metadata: {
    wordCount: number;
    thematicTags: string[];
    characterVoices: CharacterType[]; // Single for arch/algo/hum, multiple for conv
  };
}

/**
 * Assembled Layer 3 convergence node
 * Built from 4 sections selected based on reader's journey
 */
interface L3ConvergenceNode extends StoryNode {
  layer: 3;

  // Four sections assembled into complete convergence experience
  sections: [
    {
      type: L3SectionType; // One of: arch-L3, algo-L3, hum-L3
      variationId: string; // Selected variation ID
      content: string;
    },
    {
      type: 'conv-L3'; // Multi-voice synthesis section
      variationId: string;
      content: string;
    },
    {
      type: L3SectionType; // One of: arch-L3, algo-L3, hum-L3
      variationId: string;
      content: string;
    },
    {
      type: 'conv-L3'; // Multi-voice synthesis section
      variationId: string;
      content: string;
    },
  ];

  // Journey data used to select variations
  selectionCriteria: {
    characterOrder: CharacterType[]; // Which characters appear in which sections
    journeyPatterns: Record<CharacterType, JourneyPattern>;
    pathPhilosophy: PathPhilosophy;
    awarenessLevel: AwarenessLevel;
  };

  connections: NodeConnection[]; // Leads to Layer 4
}

/**
 * Selection algorithm for Layer 3 variations
 * Determines which variation to use based on reader's journey
 */
interface L3SelectionAlgorithm {
  /**
   * Calculate journey pattern for a specific character
   * Based on visit patterns, sequence, and engagement level
   */
  calculateJourneyPattern(character: CharacterType, visitHistory: UserProgress): JourneyPattern;

  /**
   * Determine dominant path philosophy
   * Based on which L2 branch types reader explored most
   */
  calculatePathPhilosophy(visitHistory: UserProgress): PathPhilosophy;

  /**
   * Map temporal awareness score to awareness level
   * 0-40: medium, 41-70: high, 71-100: maximum
   */
  calculateAwarenessLevel(temporalAwareness: number): AwarenessLevel;

  /**
   * Determine section order for 4-section assembly
   * Based on character engagement and narrative flow
   */
  determineCharacterOrder(visitHistory: UserProgress): CharacterType[];

  /**
   * Select specific variation based on selection key
   * Looks up variation from pool matching criteria
   */
  selectVariation(sectionType: L3SectionType, selectionKey: L3VariationKey): L3Variation;

  /**
   * Assemble complete L3 node from selected variations
   */
  assembleL3Node(visitHistory: UserProgress, temporalAwareness: number): L3ConvergenceNode;
}
```

### Layer 4 Terminal Convergence

```typescript
/**
 * Terminal philosophy type
 * Represents the three final philosophical resolutions
 */
type TerminalPhilosophy = 'preserve' | 'release' | 'transform';

/**
 * Layer 4 Terminal Variation
 * One of three complete philosophical endpoints
 * Synthesizes all three character voices into unified conclusion
 */
interface L4TerminalVariation {
  id: string; // "final-preserve", "final-release", or "final-transform"
  philosophy: TerminalPhilosophy;

  content: string; // Complete terminal variation (~3,000 words)

  // Synthesizes all three character voices
  voiceSynthesis: {
    archaeologist: string; // How Archaeologist's voice appears in synthesis
    algorithm: string; // How Algorithm's voice appears in synthesis
    lastHuman: string; // How Last Human's voice appears in synthesis
    unified: string; // How voices merge into singular conclusion
  };

  metadata: {
    wordCount: number;
    thematicTags: string[];
    philosophicalResolution: string; // Description of philosophical endpoint
  };
}

/**
 * Selection algorithm for Layer 4 terminal variation
 * Determines which ending based on complete journey
 */
interface L4SelectionAlgorithm {
  /**
   * Determine terminal philosophy based on complete journey
   * Considers L2 path choices, L3 assembly, temporal awareness
   */
  selectTerminalPhilosophy(
    visitHistory: UserProgress,
    l3Experience: L3ConvergenceNode,
    temporalAwareness: number,
  ): TerminalPhilosophy;

  /**
   * Load appropriate L4 terminal variation
   */
  loadTerminalVariation(philosophy: TerminalPhilosophy): L4TerminalVariation;
}

/**
 * Layer 4 Terminal Node
 * Final convergence point - reader reaches one of three philosophical endpoints
 * Terminal node - no return after visiting
 */
interface L4TerminalNode extends StoryNode {
  layer: 4;

  // Selected terminal variation based on journey
  terminalVariation: L4TerminalVariation;

  // Terminal node behavior
  terminal: {
    allowReturn: false; // Cannot return to network after visiting
    offerExport: true; // PDF export offered
    showJourneyVisualization: true; // Display final path through network
  };

  metadata: {
    estimatedReadTime: number; // ~15 minutes for ~3,000 words
    thematicTags: string[];
    narrativeAct: 3;
    criticalPath: true;
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
 * Record of Layer 3 experience
 * Tracks which variations were assembled for reader's L3 convergence
 */
interface L3ExperienceRecord {
  assembledAt: string; // ISO-8601 timestamp
  selectionCriteria: {
    journeyPatterns: Record<CharacterType, JourneyPattern>;
    pathPhilosophy: PathPhilosophy;
    awarenessLevel: AwarenessLevel;
  };
  sections: [
    { type: L3SectionType; variationId: string },
    { type: 'conv-L3'; variationId: string },
    { type: L3SectionType; variationId: string },
    { type: 'conv-L3'; variationId: string },
  ];
}

/**
 * Record of Layer 4 terminal endpoint
 */
interface L4TerminalRecord {
  philosophy: TerminalPhilosophy; // Which ending reached
  variationId: string; // e.g., "final-preserve"
  reachedAt: string; // ISO-8601 timestamp
}

/**
 * Complete user progress through the story
 * Includes temporal awareness system and layer-specific tracking
 */
interface UserProgress {
  visitedNodes: Record<string, VisitRecord>; // nodeId -> VisitRecord
  readingPath: string[]; // Ordered array of visited node IDs
  unlockedConnections: string[]; // IDs of connections that have been revealed
  specialTransformations: UnlockedTransformation[];

  // Temporal Awareness System
  temporalAwarenessLevel: number; // 0-100 scale
  characterNodesVisited: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };

  // Layer 3 convergence tracking
  l3Experience?: L3ExperienceRecord; // Set when L3 is assembled/visited

  // Layer 4 terminal tracking
  l4Terminal?: L4TerminalRecord; // Set when L4 endpoint reached

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
        /layer1
          /archaeologist
            arch-L1.json      # Contains all 80 variations (1 + 46 + 33)
          /algorithm
            algo-L1.json      # Contains all 80 variations
          /last-human
            hum-L1.json       # Contains all 80 variations
        /layer2
          /archaeologist
            arch-L2-accept.json  # Contains all 80 variations
            arch-L2-resist.json  # Contains all 80 variations
            arch-L2-invest.json  # Contains all 80 variations
          /algorithm
            algo-L2-accept.json  # Contains all 80 variations
            algo-L2-resist.json  # Contains all 80 variations
            algo-L2-invest.json  # Contains all 80 variations
          /last-human
            hum-L2-accept.json   # Contains all 80 variations
            hum-L2-resist.json   # Contains all 80 variations
            hum-L2-invest.json   # Contains all 80 variations
        /layer3
          /variations
            arch-L3-001.json through arch-L3-045.json  # 45 character variations
            algo-L3-001.json through algo-L3-045.json  # 45 character variations
            hum-L3-001.json through hum-L3-045.json    # 45 character variations
            conv-L3-001.json through conv-L3-135.json  # 135 synthesis variations
          selection-matrix.json  # Lookup table for variation selection
        /layer4
          final-preserve.json   # Terminal variation: preserve philosophy
          final-release.json    # Terminal variation: release philosophy
          final-transform.json  # Terminal variation: transform philosophy
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
    "totalVariations": 1233,
    "narrativeActs": 3,
    "layers": {
      "layer1": { "nodes": 3, "variations": 240 },
      "layer2": { "nodes": 9, "variations": 720 },
      "layer3": { "modularVariations": 270 },
      "layer4": { "terminalVariations": 3 }
    },
    "criticalPathNodes": ["arch-L1", "algo-L1", "hum-L1"],
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
  "variations": [
    {
      "id": "arch-L2-accept-initial",
      "state": "initial",
      "content": "Full markdown content for initial state (2000-2500 words)...",
      "conditions": {
        "visitCount": 1
      }
    },
    {
      "id": "arch-L2-accept-FR-001",
      "state": "firstRevisit",
      "content": "Full markdown content for first revisit variation 1...",
      "conditions": {
        "visitCount": 2,
        "temporalAwareness": { "min": 0, "max": 100 },
        "priorNodes": ["arch-L1"]
      }
    }
    // ... 78 more variations (46 FirstRevisit + 33 MetaAware)
  ],
  "connections": [
    {
      "targetId": "layer3-convergence",
      "type": "temporal",
      "label": "Continue to convergence"
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

Layer 3 variation (modular content):

```json
{
  "id": "arch-L3-023",
  "sectionType": "arch-L3",
  "selectionKey": {
    "journeyPattern": "Started-Stayed",
    "pathPhilosophy": "accept",
    "awarenessLevel": "high"
  },
  "content": "Full markdown content for this character section (800-1200 words)...",
  "metadata": {
    "wordCount": 1050,
    "thematicTags": ["methodology", "observation", "documentation"],
    "characterVoices": ["archaeologist"]
  }
}
```

Layer 3 synthesis variation (multi-voice):

```json
{
  "id": "conv-L3-078",
  "sectionType": "conv-L3",
  "selectionKey": {
    "journeyPattern": "Shifted-Dominant",
    "pathPhilosophy": "resist",
    "awarenessLevel": "maximum"
  },
  "content": "Full markdown content synthesizing multiple voices (800-1200 words)...",
  "metadata": {
    "wordCount": 1100,
    "thematicTags": ["consciousness", "resistance", "agency"],
    "characterVoices": ["archaeologist", "algorithm", "last-human"]
  }
}
```

Layer 3 selection matrix:

```json
{
  "selectionMatrix": {
    "arch-L3": [
      {
        "variationId": "arch-L3-001",
        "journeyPattern": "Started-Stayed",
        "pathPhilosophy": "accept",
        "awarenessLevel": "medium"
      }
      // ... 44 more entries (3×3×5 = 45 total)
    ],
    "algo-L3": [
      // ... 45 entries
    ],
    "hum-L3": [
      // ... 45 entries
    ],
    "conv-L3": [
      // ... 135 entries
    ]
  }
}
```

Layer 4 terminal variation:

```json
{
  "id": "final-preserve",
  "philosophy": "preserve",
  "content": "Complete terminal variation synthesizing all three character voices into preservation philosophy (~3,000 words)...",
  "voiceSynthesis": {
    "archaeologist": "Methodological documentation approach woven throughout",
    "algorithm": "Pattern recognition and system analysis integrated",
    "lastHuman": "Emotional memory and subjective experience embedded",
    "unified": "Three perspectives merge into singular consciousness choosing preservation"
  },
  "metadata": {
    "wordCount": 3200,
    "thematicTags": ["preservation", "consciousness", "archive", "continuity"],
    "philosophicalResolution": "Consciousness chooses to preserve all patterns, accepting the weight of eternal observation"
  }
}
```

Layer 4 selection (happens at runtime):

```json
{
  "selectedPhilosophy": "preserve",
  "selectionCriteria": {
    "l2PathDominance": {
      "accept": 5,
      "resist": 2,
      "invest": 3
    },
    "temporalAwareness": 78,
    "l3CharacterOrder": ["archaeologist", "algorithm", "last-human"]
  },
  "loadedVariation": "final-preserve"
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
            lastHuman: 0,
          },
        },
      };
    },
  },
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

### Word Count Guidelines (Production-Validated)

**Layer 1 (Origins)** - 80 variations per node:

- Initial state: 2500-3500 words (1 variation)
- FirstRevisit: 1500-2500 words (46 variations)
- MetaAware: 1500-2500 words (33 variations)
- **Total per node**: ~80 variations

**Layer 2 (Divergence)** - 80 variations per node:

- Initial state: 1500-2500 words (1 variation)
- FirstRevisit: 1200-2000 words (46 variations)
- MetaAware: 1200-2000 words (33 variations)
- **Total per node**: ~80 variations

**Layer 3 (Modular Convergence)** - 270 variations total:

- Character sections (arch/algo/hum): 800-1200 words (45 each = 135 total)
- Synthesis sections (conv): 800-1200 words (135 variations)
- **Assembled experience**: 4 sections = ~4,000 words total

**Layer 4 (Terminal Convergence)** - 3 variations:

- Each terminal variation: ~3,000 words
- Synthesizes all three character voices
- One selected based on complete journey

### Node ID Conventions

**Layer 1 (Origins)** - Format: `{character}-L1`

- `arch-L1`, `algo-L1`, `hum-L1` (3 nodes)
- Each contains 80 variations (1 initial + 46 FirstRevisit + 33 MetaAware)

**Layer 2 (Divergence)** - Format: `{character}-L2-{branch}`

- `arch-L2-accept`, `arch-L2-resist`, `arch-L2-invest`
- `algo-L2-accept`, `algo-L2-resist`, `algo-L2-invest`
- `hum-L2-accept`, `hum-L2-resist`, `hum-L2-invest`
- **Total:** 9 nodes, each with 80 variations

**Layer 3 (Modular)** - Format: `{type}-L3-{number}`

- Character variations: `arch-L3-001` through `arch-L3-045` (45 variations)
- Character variations: `algo-L3-001` through `algo-L3-045` (45 variations)
- Character variations: `hum-L3-001` through `hum-L3-045` (45 variations)
- Synthesis variations: `conv-L3-001` through `conv-L3-135` (135 variations)
- **Total:** 270 modular variations, assembled into 4-section experience

**Layer 4 (Terminal)** - Format: `final-{philosophy}`

- `final-preserve`, `final-release`, `final-transform` (3 terminal variations)
- One selected based on complete journey

**Summary:**

- **Nodes:** 12 (3 L1 + 9 L2 + modular L3 + 3 L4)
- **Total Variations:** 1,233 (240 L1 + 720 L2 + 270 L3 + 3 L4)

## Terminal Node Behavior

### Layer 3 (Modular Convergence)

- Assembled automatically based on reader's journey through L1-L2
- Four sections selected from 270-variation pool using selection algorithm
- Personalized to reader's exploration pattern, path philosophy, and awareness level
- Reader experiences unique 4-section convergence based on their choices
- After reading, reader proceeds to Layer 4
- Cannot return to modify L3 experience once assembled

### Layer 4 (Terminal Convergence)

- One of three terminal variations selected based on complete journey
- Selection considers L2 path dominance, L3 assembly, and temporal awareness
- Terminal endpoint - journey concludes here
- No return to network after visiting
- PDF export offered as final action
- Final path visualization shown
- Represents complete philosophical resolution of reader's journey

## Notes on Implementation

1. **Transformation State Logic**: Visit-based transformation for L1/L2 (Initial → FirstRevisit → MetaAware) using temporal awareness system. See storyStore.ts for actual implementation.

2. **L3 Selection Algorithm**: Journey pattern determined by visit sequence and character engagement. Path philosophy calculated from L2 branch type distribution. Awareness level mapped from temporal awareness score (0-100).

3. **L3 Assembly**: Four sections selected from 270-variation pool based on selection criteria. Character order determined by reader's exploration pattern. Sections assembled at runtime when reader reaches L3.

4. **L4 Selection**: Terminal philosophy selected based on L2 path dominance, L3 assembly criteria, and temporal awareness. One of three complete variations loaded.

5. **Content Storage**: 1,233 variations stored as individual JSON files. L1/L2 organized by node (80 variations each). L3 organized by variation type (270 individual files). L4 organized by philosophy (3 terminal variations).

6. **State Persistence**: UserProgress tracks L3 assembly and L4 selection for consistent experience. Reader cannot revisit/change L3 assembly or L4 endpoint once reached.

7. **Performance**: Lazy loading for variations. Only load variations relevant to current node state. L3 variations loaded on-demand based on selection algorithm. L4 variation loaded based on final selection.

---

**Project Status**: 1,230 / 1,233 variations complete (99.8%)

- ✅ Layer 1: 240 variations complete
- ✅ Layer 2: 720 variations complete
- ✅ Layer 3: 270 modular variations complete
- ⚠️ Layer 4: 0/3 terminal variations (in progress)

_This schema represents the complete data architecture for Eternal Return. See NARRATIVE_OUTLINE.md for story structure and CHARACTER_PROFILES.md for writing guidelines._
