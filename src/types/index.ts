// Node types
export type {
  CharacterType,
  TransformationState,
  ConnectionType,
  NodeShape,
  Theme,
  TextSize,
  Position,
  NodeVisualState,
  ConnectionVisualProperties,
  NodeContent,
  RevealCondition,
  NodeConnection,
  SpecialTransformation,
  UnlockConditions,
  NodeMetadata,
  StoryNode,
  MapViewport,
  NodeUIState,
  ConnectionUIState,
} from './Node';

// Store types
export type {
  VisitRecord,
  UnlockedTransformation,
  UserProgress,
  UserPreferences,
  SavedState,
  ReadingStats,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StoryStore,
} from './Store';

// Story types
export type {
  Connection,
  StoryMetadata,
  StoryConfiguration,
  StoryData,
  MigrationStrategy,
  StoryManifest,
  StoryDefinition,
} from './Story';

// Variation system types
export type {
  JourneyPattern,
  PathPhilosophy,
  AwarenessLevel,
  SynthesisPattern,
  VariationMetadata,
  Variation,
  VariationFile,
  L3ContentSynthesisPattern,
  L3VariationMetadata,
  L3Variation,
  L3VariationFile,
  L3VariationSet,
  SelectionMatrixEntry,
  L3AssemblySection,
  L3Assembly,
  JourneyTracking,
  ConditionContext,
} from './Variation';
