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
  SelectionRecord,
  UserProgress,
  UserPreferences,
  StoryPackageIdentity,
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
  JourneyCharacter,
  NumericComparison,
  JourneyConditionExpression,
  ConditionEvidence,
  ConditionEvaluation,
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
  L3VariationMatchTier,
  L3AssemblySection,
  L3Assembly,
  JourneyTracking,
  ConditionContext,
} from './Variation';

export { SELECTION_REASON_CONTRACT, SELECTION_REASON_SCHEMA_VERSION } from './SelectionReason';
export type {
  SelectionKind,
  SelectionOutcome,
  SelectionReasonTemplateKey,
  SelectionTriggerKind,
  SelectionTriggerValue,
  SelectionTrigger,
  SelectionReason,
  VariationMatchTier,
} from './SelectionReason';
