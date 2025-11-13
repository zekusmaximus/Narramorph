# L3 Assembly System Implementation

## Overview

This document describes the implementation of the L3 Assembly System for Narramorph, including content loading, selection matrix integration, journey tracking, and UI components.

## Implementation Date

November 10, 2025

## Components Implemented

### 1. Type Definitions (`src/types/Variation.ts`)

New type system for the variation and journey tracking features:

- **JourneyPattern**: Tracks reader's character exploration pattern
  - `started-stayed`: Started with one character, stayed dominant (>60%)
  - `started-bounced`: Started with one, explored others significantly
  - `shifted-dominant`: Started with one, shifted to another as dominant
  - `began-lightly`: Started with light exploration before committing
  - `met-later`: Encountered character later in journey
  - `unknown`: Not yet determined

- **PathPhilosophy**: Dominant choice pattern at L2 nodes
  - `accept`: Acceptance/embrace choices
  - `resist`: Resistance/rejection choices
  - `invest`: Investigation/deeper engagement choices
  - `mixed`: No clear dominant philosophy
  - `unknown`: Not yet determined

- **AwarenessLevel**: Categorized awareness levels (`low`, `medium`, `high`)

- **Variation**: Full variation structure with metadata and content

- **L3Assembly**: Complete 4-section convergence assembly
  - Archaeologist section (~900 words)
  - Algorithm section (~900 words)
  - Human section (~900 words)
  - Convergence section (~1800 words)

- **JourneyTracking**: State management for journey patterns and philosophy

### 2. Variation Loader (`src/utils/variationLoader.ts`)

Handles loading and caching of variation JSON files:

- Uses Vite glob imports for file discovery
- Caches loaded variations for performance
- Supports L1, L2, L3, and L4 variation files
- Loads selection matrix (311 navigation entries)
- Functions:
  - `loadVariationFile()`: Load specific variation by node ID
  - `loadL3Variations()`: Load all L3 variation files (arch, algo, hum, conv)
  - `loadSelectionMatrix()`: Load navigation/routing rules
  - `getVariations()`: Get all variations from a file
  - `findVariationById()`: Find specific variation

### 3. Condition Evaluator (`src/utils/conditionEvaluator.ts`)

Evaluates selection matrix conditions against user state:

- **getAwarenessLevel()**: Convert numeric awareness to level category
- **evaluateConditions()**: Check if matrix entry matches context
  - Awareness level matching
  - Visit count range checking
  - Journey pattern matching
  - Path philosophy matching

- **findMatchingVariation()**: Select best variation from multiple candidates
  - Priority: exact journey + exact philosophy > exact journey > exact philosophy > any
  - Awareness range matching

- **calculateJourneyPattern()**: Determine journey pattern from visit statistics
  - Uses starting character and current percentages
  - Implements thresholds (>60% for stayed, >50% for shifted, etc.)

- **calculatePathPhilosophy()**: Determine dominant philosophy from L2 choices
  - > 50% threshold for dominant
  - <20% difference threshold for mixed

### 4. L3 Assembly Builder (`src/utils/l3Assembly.ts`)

Constructs 4-section convergence assemblies:

- **buildL3Assembly()**: Main assembly function
  - Loads all L3 variation files (arch, algo, hum, conv)
  - Selects appropriate variation for each section based on context
  - Calculates synthesis pattern
  - Returns complete L3Assembly object

- **calculateSynthesisPattern()**: Determines synthesis type
  - `single-dominant`: One character >60%
  - `true-triad`: All three characters ~33% (within 15%)
  - `balanced-dual`: Two characters ~40-50% each

- **getL3AssemblyContent()**: Get combined content as single string

- **getL3AssemblySections()**: Get sections array for rendering

- **validateL3Assembly()**: Validate completeness and word counts

### 5. State Management Enhancements (`src/stores/storyStore.ts`)

#### New State Fields

- `progress.journeyTracking`: JourneyTracking object with:
  - Character visit percentages
  - Current journey pattern
  - L2 choice counts (accept/resist/invest)
  - Dominant philosophy
  - Starting character
  - Dominant character

#### New Functions

- **createInitialJourneyTracking()**: Initialize journey tracking state

- **updateJourneyTracking()**: Update journey tracking after each visit
  - Calculate character visit percentages
  - Determine starting character (from first visit)
  - Determine dominant character
  - Calculate journey pattern
  - Calculate dominant philosophy

- **recordL2Choice()**: Record L2 philosophy choice
  - Increments accept/resist/invest counters
  - Updates journey tracking

- **getConditionContext()**: Get current condition context for variation selection
  - Returns awareness, journey pattern, path philosophy, percentages

- **buildL3Assembly()**: Build L3 assembly for current user state
  - Gets condition context
  - Calls L3 assembly builder
  - Returns complete assembly

#### Integration

- `visitNode()` now calls `updateJourneyTracking()` after each visit
- Journey tracking automatically calculates patterns and philosophy
- L3 assembly can be generated on-demand based on current state

### 6. UI Components

#### Journey Tracker (`src/components/UI/JourneyTracker.tsx`)

Displays current journey status:

- Journey pattern (human-readable label)
- Path philosophy (human-readable label)
- L2 choice counts (accept/resist/invest breakdown)
- Character distribution (visual progress bars)
  - Archaeologist (blue)
  - Algorithm (green)
  - Human (red)
- Temporal awareness (progress bar)
- Styled with cyberpunk/terminal aesthetic
- Real-time updates as user explores

#### L3 Assembly View (`src/components/UI/L3AssemblyView.tsx`)

Full-screen modal for viewing L3 convergence:

- 4 sections with navigation tabs
- Character-themed styling per section
- Markdown rendering for content
- Keyboard navigation:
  - Arrow keys: navigate between sections
  - ESC: close view
- Section navigation with visual indicators
- Word count display
- Metadata display (journey, philosophy, awareness, synthesis)
- Smooth transitions between sections
- Character color coding:
  - Archaeologist: blue
  - Algorithm: green
  - Human: red
  - Convergence: purple

### 7. Home Page Integration (`src/pages/Home.tsx`)

#### New Features

- Journey Tracker widget (bottom right corner)
  - Animated entrance
  - Fixed positioning
  - Always visible during exploration

- L3 Assembly Button (top right corner)
  - Appears when user has sufficient progress:
    - Temporal awareness >= 50%, OR
    - At least 10 nodes visited
  - Purple-themed to match convergence
  - Icon + "View Layer 3 Convergence" label

- L3 Assembly View modal
  - Triggered by button click
  - Full-screen overlay
  - Closeable via button or ESC key
  - AnimatePresence for smooth transitions

## Data Flow

```
User visits node
  ↓
visitNode() called
  ↓
Update character visit counts
  ↓
updateTemporalAwareness()
  ↓
updateJourneyTracking()
  ↓
Calculate percentages, pattern, philosophy
  ↓
Journey Tracker updates UI

User clicks "View Layer 3 Convergence"
  ↓
buildL3Assembly() called
  ↓
getConditionContext()
  ↓
Load L3 variations (arch, algo, hum, conv)
  ↓
For each section: findMatchingVariation()
  ↓
Assemble 4 sections into L3Assembly
  ↓
L3AssemblyView renders content
```

## Selection Matrix Integration

The selection matrix (`selection-matrix.json`) contains 311 navigation entries mapping:

- `fromNode` → `toNode`
- Conditions:
  - `awarenessLevel`: Low/Medium/High
  - `visitCount`: [min, max] range
  - `journeyPattern`: Journey pattern match
  - `pathPhilosophy`: Philosophy match

The condition evaluator checks these rules and selects the best matching variation or navigation target based on user state.

## L3 Assembly Structure

Each L3 assembly consists of:

1. **Archaeologist Section** (~900 words)
   - Selected based on journey pattern + philosophy + awareness
   - Character perspective: archaeological/documentary approach

2. **Algorithm Section** (~900 words)
   - Selected based on journey pattern + philosophy + awareness
   - Character perspective: computational/analytical approach

3. **Human Section** (~900 words)
   - Selected based on journey pattern + philosophy + awareness
   - Character perspective: embodied/experiential approach

4. **Convergence Section** (~1800 words)
   - Synthesizes all three perspectives
   - Multi-voice integration
   - Selected based on synthesis pattern (single-dominant, balanced-dual, true-triad)
   - Includes convergence alignment (preserve/transform/release)

Total: ~4500 words per L3 assembly

## Key Algorithms

### Journey Pattern Calculation

```typescript
if (dominantCharacter === startingCharacter && startingPercentage > 60):
  return "started-stayed"
else if (dominantCharacter !== startingCharacter && maxPercentage > 50):
  return "shifted-dominant"
else if (startingPercentage < 60 && startingPercentage > 40):
  return "started-bounced"
else if (startingPercentage < 40 && maxPercentage > 50):
  return "began-lightly"
else:
  return "met-later"
```

### Path Philosophy Calculation

```typescript
total = accept + resist + invest
acceptPercent = (accept / total) * 100

if (acceptPercent > 50): return "accept"
else if (resistPercent > 50): return "resist"
else if (investPercent > 50): return "invest"
else if (max - min < 20): return "mixed"
else: return highest
```

### Variation Selection Priority

1. Exact journey pattern + exact philosophy match
2. Exact journey pattern match
3. Exact philosophy match
4. Any match within awareness range
5. Fallback to first variation

## File Structure

```
src/
├── types/
│   └── Variation.ts                    # New variation types
├── utils/
│   ├── variationLoader.ts              # Variation file loading
│   ├── conditionEvaluator.ts           # Condition matching logic
│   └── l3Assembly.ts                   # L3 assembly builder
├── stores/
│   └── storyStore.ts                   # Enhanced with journey tracking
├── components/
│   └── UI/
│       ├── JourneyTracker.tsx          # Journey tracking widget
│       └── L3AssemblyView.tsx          # L3 assembly modal
└── pages/
    └── Home.tsx                        # Integrated UI components
```

## Configuration

### Required Data Files

- `/src/data/stories/eternal-return/content/layer3/arch-L3-variations.json`
- `/src/data/stories/eternal-return/content/layer3/algo-L3-variations.json`
- `/src/data/stories/eternal-return/content/layer3/hum-L3-variations.json`
- `/src/data/stories/eternal-return/content/layer3/conv-L3-variations.json`
- `/src/data/stories/eternal-return/content/selection-matrix.json`

### Glob Patterns

The variation loader uses Vite glob imports:

```typescript
/src/aadt / stories;
/*/content/layer1/*-variations.json
/src/data/stories/*/ content / layer2;
/*-variations.json
/src/data/stories/*/ content / layer3;
/*-variations.json
/src/data/stories/*/ content / layer4;
/*-variations.json
/src/data/stories/*/ content / selection - matrix.json;
```

## Testing Recommendations

1. **Journey Pattern Tracking**
   - Visit nodes from single character → verify "started-stayed"
   - Visit nodes from multiple characters → verify pattern changes
   - Check character percentage bars update correctly

2. **L3 Assembly Generation**
   - Reach 50%+ awareness → verify L3 button appears
   - Click button → verify assembly generated
   - Check all 4 sections load correctly
   - Verify word counts (~900, ~900, ~900, ~1800)

3. **Variation Selection**
   - Test different journey patterns → verify different variations selected
   - Test different philosophies → verify philosophy-specific content
   - Test awareness ranges → verify low/medium/high content

4. **UI/UX**
   - Journey tracker displays correctly
   - L3 button appears at right threshold
   - Modal keyboard navigation works
   - Section transitions are smooth
   - Close button and ESC key work

## Future Enhancements

1. **L4 Terminal Variations**
   - Similar system for L4 final variations
   - Terminal behavior integration
   - Final choice tracking

2. **Advanced Caching**
   - LRU cache for variations
   - Preload likely next variations
   - IndexedDB for offline support

3. **Analytics**
   - Track journey pattern distribution
   - Philosophy choice patterns
   - L3 assembly view rates
   - Section reading times

4. **Enhanced Selection**
   - Machine learning for variation selection
   - Personalized recommendations
   - Reading style analysis

## Notes

- The implementation uses TypeScript for type safety
- Zustand + Immer for state management
- Framer Motion for UI animations
- React Flow for node map visualization
- All variation content is bundled at build time (no runtime fetching)
- Journey tracking is persisted in localStorage
- L3 assemblies are generated on-demand, not pre-generated

## Known Issues

1. Build configuration requires vitest types but vitest may not be installed
   - Temporary fix: Comment out vitest types in tsconfig.json for builds

2. Selection matrix conditions are evaluated client-side
   - Could be optimized with server-side pre-filtering for large datasets

## Credits

Implementation by: Claude (Anthropic AI)
Project: Narramorph - Eternal Return of the Digital Self
Session: claude/l3-assembly-system-011CUzjFb54XYA2yVGvk5tDa
