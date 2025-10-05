/**
 * Character types in the narrative
 */
export type CharacterType = 'archaeologist' | 'algorithm' | 'last-human' | 'multi-perspective';

/**
 * Transformation states for node content
 */
export type TransformationState = 'initial' | 'firstRevisit' | 'metaAware';

/**
 * Connection types between nodes
 */
export type ConnectionType = 'temporal' | 'consciousness' | 'recursive' | 'hidden';

/**
 * Visual shapes for nodes
 */
export type NodeShape = 'circle' | 'square';

/**
 * Theme options for reading interface
 */
export type Theme = 'light' | 'dark' | 'sepia';

/**
 * Text size options
 */
export type TextSize = 'small' | 'medium' | 'large';

/**
 * 2D position on the node map
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Visual properties for a node
 */
export interface NodeVisualState {
  defaultColor: string; // Hex color
  size: number; // Radius in pixels
  shape?: NodeShape;
}

/**
 * Visual properties for connections
 */
export interface ConnectionVisualProperties {
  color: string; // Hex color
  weight: number; // Line thickness (1-5)
  animated: boolean; // Should connection be animated
  dashArray?: string; // SVG dash array for dashed lines
}

/**
 * Content for all transformation states
 */
export interface NodeContent {
  initial: string; // Markdown content for initial visit
  firstRevisit: string; // Markdown content for first revisit
  metaAware: string; // Markdown content for meta-aware state
}

/**
 * Condition for revealing connections
 */
export interface RevealCondition {
  requiredVisits?: Record<string, number>; // { nodeId: minVisitCount }
  requiredSequence?: string[]; // Exact sequence of node IDs
}

/**
 * Connection between two nodes
 */
export interface NodeConnection {
  targetId: string; // ID of connected node
  type: ConnectionType;
  label?: string; // Optional label for connection
  bidirectional?: boolean; // Can traverse in both directions
}

/**
 * Special transformation that unlocks under specific conditions
 */
export interface SpecialTransformation {
  id: string; // Unique identifier for this transformation
  requiredPriorNodes: string[]; // Nodes that must be visited (any order)
  requiredSequence?: string[]; // Specific sequence required (if applicable)
  transformText: string; // Markdown content shown when unlocked
  visualEffect?: string; // Optional special visual effect
}

/**
 * Conditions for unlocking special features
 */
export interface UnlockConditions {
  specialTransforms?: SpecialTransformation[];
}

/**
 * Metadata about a node
 */
export interface NodeMetadata {
  estimatedReadTime: number; // Minutes
  thematicTags: string[]; // Tags for filtering/searching
  narrativeAct: number; // Which act this belongs to (1-3)
  criticalPath: boolean; // Is this node essential to story understanding?
}

/**
 * Complete definition of a story node
 */
export interface StoryNode {
  id: string; // Unique identifier (e.g., "archaeologist-001")
  character: CharacterType;
  title: string; // Short title for the node
  position: Position; // Position on the map
  content: NodeContent;
  connections: NodeConnection[];
  visualState: NodeVisualState;
  unlockConditions?: UnlockConditions;
  metadata: NodeMetadata;
  redirectTo?: string; // Optional redirect to another node ID
  bridgeMoments?: string[]; // References to nodes in other character arcs
}

/**
 * Current state of the node map visualization
 */
export interface MapViewport {
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
export interface NodeUIState {
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
export interface ConnectionUIState {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  visible: boolean; // Is connection revealed?
  highlighted: boolean; // Is connection highlighted?
  animated: boolean;
  visualProperties: ConnectionVisualProperties;
}