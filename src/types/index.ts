// Node types
export type {
  CharacterType,
  TransformationState,
  ConnectionType,
  NodeShape,
  Theme,
  TextSize,
  LineHeight,
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
  EdgeBridgeAlternative,
  EdgeBridge,
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
  ProseBeatAlternative,
  ProseBeat,
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

export {
  VISIT_EVENT_CONTRACT,
  VISIT_EVENT_SCHEMA_VERSION,
  isVisitEvent,
  isResolvedTextHash,
} from './VisitEvent';
export type {
  ReaderChoiceKind,
  ReaderChoice,
  VisitEventSelection,
  ResolvedText,
  VisitEvent,
} from './VisitEvent';

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
