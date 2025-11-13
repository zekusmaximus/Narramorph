# Narramorph Fiction - Narrative Engine Architecture Assessment

**Date:** 2025-11-11
**Scope:** Comprehensive analysis of state management, variation selection, unlock systems, and L3 assembly
**Purpose:** Validate and complete architectural foundation before 3D constellation UI development

---

## Executive Summary

The Narramorph codebase has **solid foundational infrastructure** but suffers from a **critical integration gap** between the narrative engine components and the reading experience. While state management, variation loading, and L3 assembly utilities exist, they are **not connected to the StoryView component**, meaning readers currently see static content instead of state-dependent narrative variations.

**Critical Finding:** The variation selection system exists but is completely unused. StoryView displays `node.content[transformationState]` directly from static node definitions, bypassing the entire 960+ variation library and sophisticated journey tracking.

**Severity:** HIGH - This blocks all state-dependent storytelling features and renders the core narrative engine non-functional.

---

## 1. Current Architecture Assessment

### ✅ What Exists and Works Correctly

#### **State Management (storyStore.ts) - 85% Complete**

- **JourneyTracking system**: Tracks character visit percentages, starting character, dominant character, L2 philosophy choices
- **Temporal awareness**: Calculates 0-100 awareness based on cross-character exploration (diversity bonus + exploration score)
- **Visit recording**: Full metadata tracking with timestamps, visit counts, transformation states
- **Character-specific counters**: Proper tracking of visits per character (archaeologist/algorithm/lastHuman)
- **L2 choice tracking**: Records accept/resist/invest philosophy choices
- **Journey pattern calculation**: `calculateJourneyPattern()` determines started-stayed, started-bounced, shifted-dominant, etc.
- **Philosophy calculation**: `calculatePathPhilosophy()` determines dominant philosophy from L2 choices
- **Condition context generation**: `getConditionContext()` properly assembles ConditionContext for variation selection
- **Special transformations**: Checks unlock conditions, tracks unlocked transformations
- **Connection reveal system**: Evaluates reveal conditions, manages unlocked connections
- **L2 unlocking**: Unlocks L2 nodes when visiting L1 nodes (basic implementation working)

**Strengths:**

- Comprehensive TypeScript types for JourneyTracking, ConditionContext, VisitRecord
- Proper separation between raw data and computed state
- Reactive updates trigger awareness and journey recalculation on each visit
- Immer middleware for clean immutable updates
- LocalStorage persistence with migration support

**Limitations:**

- No advanced unlock conditions beyond L2 basic unlocking
- No unlock evaluator for L3/L4 nodes based on complex conditions
- Visit count per node tracked but not exposed in ConditionContext (set to 0)
- No caching of computed journey patterns for performance

#### **Variation Loading (variationLoader.ts) - 100% Complete**

- **Vite glob imports**: Eagerly loads all variation JSON files from layer1-4
- **Caching system**: Maintains Map-based cache to prevent repeated loads
- **L3-specific loader**: `loadL3Variations()` loads arch/algo/hum/conv sections
- **Selection matrix loader**: Loads selection-matrix.json for navigation
- **Variation lookup**: `findVariationById()` and `getVariations()` helpers

**Strengths:**

- Clean abstraction over file system
- Efficient caching
- Type-safe with VariationFile interface

**Status:** Feature-complete, no changes needed.

#### **Condition Evaluation (conditionEvaluator.ts) - 90% Complete**

- **Awareness level mapping**: Converts 0-100 numeric to low/medium/high
- **Variation matching**: `findMatchingVariation()` filters variations by awareness range, journey pattern, philosophy
- **Priority system**: Exact matches preferred over broader matches
- **Journey pattern calculation**: Logic exists and works correctly
- **Philosophy calculation**: Properly aggregates L2 choices

**Strengths:**

- Sophisticated matching algorithm with fallback hierarchy
- Proper range checking for awareness
- Handles unknown/mixed values gracefully

**Limitations:**

- No visit count consideration in variation matching (context.visitCount always 0)
- No cross-character connection patterns in matching logic
- No way to specify compound conditions (AND/OR logic)

#### **L3 Assembly (l3Assembly.ts) - 95% Complete**

- **Section building**: Constructs arch/algo/hum/conv sections using variation matching
- **Synthesis pattern calculation**: Determines single-dominant/balanced-dual/true-triad
- **Fallback handling**: Uses first variation if no match found
- **Content extraction**: Provides both combined and section-based output
- **Validation**: Checks word counts and completeness

**Strengths:**

- Clean separation of concerns
- Proper fallback chain
- Ready for integration

**Limitations:**

- No caching of assembled L3 variations per journey profile
- Synthesis pattern calculated but not used in convergence section selection
- No personalization based on reader's primary character emphasis

#### **Content Loading (contentLoader.ts) - 70% Complete**

- **Multi-format support**: Handles both inline and definition-based node files
- **Variation integration**: Loads from layer1-4 variation JSON files
- **Layout system**: Positions nodes based on layout.json
- **Character normalization**: Handles variant character names
- **Validation**: Checks node/connection integrity

**Strengths:**

- Flexible architecture supporting multiple content formats
- Good error handling with ContentLoadError
- Soft validation (warns instead of throwing)

**Limitations:**

- L2 content loading has hardcoded path guessing (tries accept/resist/invest)
- No support for per-node variation selection based on state
- Returns static content objects instead of variation references
- Fills node.content with single representative per transformation state

### ⚠️ What Exists But Is Incomplete/Incorrect

#### **StoryView Component - Critical Gap**

**Location:** `src/components/StoryView/StoryView.tsx:220-223`

```typescript
const currentContent = useMemo(() => {
  if (!currentNode || !nodeState) return '';
  return currentNode.content[nodeState.currentState]; // ❌ WRONG
}, [currentNode, nodeState]);
```

**Problem:** StoryView displays static content from node definitions instead of dynamically selected variations based on reader state.

**What should happen:**

1. Get current ConditionContext from store
2. Load variation file for current node
3. Call `findMatchingVariation()` with context
4. Display matched variation content
5. Fall back to node.content only if variation system fails

**Impact:** The entire 960+ variation library is unused. Readers see the same content regardless of their journey pattern, awareness level, or philosophy choices. This breaks the core narrative premise.

#### **Visit Count in ConditionContext**

**Location:** `src/stores/storyStore.ts:458`

```typescript
getConditionContext: (): ConditionContext => {
  const state = get();
  const tracking = state.progress.journeyTracking || createInitialJourneyTracking();

  return {
    awareness: state.progress.temporalAwarenessLevel,
    journeyPattern: tracking.currentJourneyPattern,
    pathPhilosophy: tracking.dominantPhilosophy,
    visitCount: 0, // ❌ Hardcoded to 0
    characterVisitPercentages: tracking.characterVisitPercentages,
  };
},
```

**Problem:** Context generation doesn't accept a nodeId parameter, so it can't include node-specific visit count.

**What should happen:**

- `getConditionContext(nodeId: string)` should accept nodeId
- Look up visit record for that specific node
- Include visitCount in context
- Variation selection can then factor in revisit counts

#### **L3 Assembly Not Integrated into Navigation**

**Status:** L3 assembly builder exists but is never triggered in normal reading flow.

**What's missing:**

- No UI trigger to assemble and view L3 convergence
- `buildL3Assembly()` is called from store but result isn't displayed
- No special L3 node in the story graph that opens L3AssemblyView
- L3AssemblyView component exists but isn't connected to NodeMap/StoryView

**Required integration:**

- L3 nodes should trigger L3 assembly on click
- Assembly should be displayed in dedicated view (not standard StoryView)
- Reader should see all 4 sections with metadata
- Progress should track L3 assemblies viewed

#### **Unlock System Incomplete**

**Current:** Only L2 basic unlocking (visit any L1 node → unlock that character's L2 nodes)

**Missing:**

- L3 unlock conditions (e.g., must visit 2+ L2 nodes across 2+ characters)
- L4 unlock conditions (e.g., must complete L3 assembly)
- Complex unlock logic (visit count thresholds, awareness requirements, philosophy requirements)
- Unlock configuration per node (currently hardcoded in canVisitNode)
- Reactive unlock evaluation (currently only checks L2 in canVisitNode)

**Location:** `src/stores/storyStore.ts:957-975`

```typescript
canVisitNode: (nodeId: string) => {
  const state = get();
  const node = state.nodes.get(nodeId);

  if (!node) return false;

  // Only checks L2 unlocking, nothing else
  const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
  if (layerMatch) {
    const layer = parseInt(layerMatch[2] || '1', 10);
    if (layer === 2) {
      return state.progress.unlockedL2Characters.includes(node.character);
    }
  }

  return true; // L1, L3, L4 always visitable
},
```

### ❌ What's Completely Missing

#### **1. Variation Selection Integration in Reading Flow**

**Priority:** CRITICAL

**Missing pieces:**

- `useVariationSelection` hook or utility to wrap variation selection logic
- Integration point in StoryView to call variation system
- Fallback chain: variation → transformation state → default content
- Error handling for missing variations
- Loading states during variation lookup

**Required files:**

- `src/hooks/useVariationSelection.ts` - Hook to select variation based on nodeId + state
- Modify `StoryView.tsx` to use hook instead of static content
- Add variation selection to store or keep in hook (design decision needed)

#### **2. Unlock Configuration System**

**Priority:** HIGH

**Missing pieces:**

- `UnlockConfiguration` type defining per-node unlock conditions
- `evaluateUnlockConditions()` function to check if conditions are met
- Storage of unlock configs (in node metadata? separate config file?)
- Reactive unlock evaluation (recalculate on every visit)
- UI feedback for locked vs unlocked nodes

**Required types:**

```typescript
interface UnlockCondition {
  type: 'visitCount' | 'awareness' | 'philosophy' | 'character' | 'compound';
  params: {
    // For visitCount
    totalVisits?: number;
    nodeVisits?: Record<string, number>;
    characterVisits?: Record<string, number>;

    // For awareness
    minAwareness?: number;
    maxAwareness?: number;

    // For philosophy
    requiredPhilosophy?: PathPhilosophy[];

    // For character
    requiredCharacters?: string[];

    // For compound
    operator?: 'AND' | 'OR';
    conditions?: UnlockCondition[];
  };
}

interface NodeUnlockConfig {
  nodeId: string;
  layer: number;
  unlockConditions: UnlockCondition[];
  lockedMessage: string; // Message to display when locked
}
```

**Required functions:**

- `evaluateUnlockCondition(condition, progress)` - Check single condition
- `evaluateNodeUnlock(nodeId, progress)` - Check all conditions for node
- `getUnlockProgress(nodeId, progress)` - Get % progress toward unlock
- `getLockedNodeMessage(nodeId)` - Get user-facing message

#### **3. L3 Assembly UI Integration**

**Priority:** HIGH

**Missing pieces:**

- L3 node type detection in NodeMap
- Special handling for L3 nodes (different visual treatment)
- L3AssemblyView already exists at `src/components/UI/L3AssemblyView.tsx` but needs connection
- Navigation flow: L3 node click → build assembly → show L3AssemblyView
- Progress tracking for L3 assemblies viewed
- Export/download functionality for L3 content

**Required integration points:**

- Modify `openStoryView()` to detect L3 nodes and route differently
- Add `openL3AssemblyView()` action to store
- Connect L3AssemblyView to store state
- Add L3 assembly caching (don't rebuild on every view)

#### **4. L2 Choice Recording Integration**

**Priority:** MEDIUM

**Missing pieces:**

- L2 nodes have philosophy paths (accept/resist/invest) but no way to record choice
- `recordL2Choice()` exists in store but is never called
- Need to determine L2 choice from navigation (which L2 node was visited)
- Need to map node IDs to philosophy choices

**Required:**

- Add philosophy metadata to L2 node definitions
- Call `recordL2Choice()` when visiting L2 nodes
- Validate that node ID contains philosophy indicator (e.g., arch-L2-accept)

#### **5. Cross-Character Connection Tracking**

**Priority:** MEDIUM

**Missing pieces:**

- JourneyTracking tracks character percentages but not cross-character connections
- No tracking of which characters reader has "linked" through navigation
- Variation metadata includes `crossCharacterConnections` but no matching logic

**Required additions to JourneyTracking:**

```typescript
interface JourneyTracking {
  // ... existing fields
  crossCharacterConnections: {
    arch_algo: number; // Times switched between arch and algo
    arch_hum: number;
    algo_hum: number;
  };
  navigationPattern: 'linear' | 'exploratory' | 'recursive'; // How reader navigates
}
```

#### **6. Node-Specific Unlock Indicators in UI**

**Priority:** MEDIUM

**Missing pieces:**

- Visual indication of locked nodes in NodeMap
- Hover tooltip showing unlock requirements
- Progress bars for partially met unlock conditions
- Animated unlocking effect when conditions are met

**UI components needed:**

- LockedNodeOverlay component
- UnlockProgressIndicator component
- UnlockNotification component (toast when node unlocks)

#### **7. Performance Optimizations**

**Priority:** LOW (but important for scale)

**Missing pieces:**

- No memoization of variation selection results
- No caching of L3 assemblies (rebuilds every time)
- No lazy loading of variation content
- No worker thread for heavy computations

**Potential optimizations:**

- Cache variation selection results by (nodeId, contextHash)
- Cache L3 assemblies by journeyPatternHash
- Lazy load variation files (currently eager loaded)
- Move L3 assembly to worker thread for large assemblies

---

## 2. Critical Issues Blocking Progress

### 🔴 **Issue 1: Variation Selection Not Connected to Reading Flow**

**Severity:** CRITICAL
**Blocks:** All state-dependent storytelling, core narrative engine
**Impact:** Readers see static content; 960+ variations unused

**Why critical:**

- Without this, the entire journey tracking system is pointless
- Readers can't experience personalized narratives
- L2 choices don't affect L3 content
- Awareness level doesn't affect content
- The platform is effectively a static story viewer

**Dependencies:** None (can be fixed immediately)

**Estimated effort:** 1-2 days

---

### 🔴 **Issue 2: Visit Count Not Passed to Variation Selection**

**Severity:** HIGH
**Blocks:** Revisit variations, progressive transformation
**Impact:** Can't select different variations on repeat visits

**Why critical:**

- `firstRevisit` and `metaAware` variations can't be properly selected
- Node-specific visit count is critical for variation selection
- Current hardcoded `visitCount: 0` makes all revisits look like first visits

**Dependencies:** Must be fixed before Issue 1 is fully testable

**Estimated effort:** 2-4 hours

---

### 🔴 **Issue 3: L3 Assembly Not Integrated**

**Severity:** HIGH
**Blocks:** Convergence layer, culmination of reader journey
**Impact:** No way to experience L3 multi-perspective assemblies

**Why critical:**

- L3 is the philosophical culmination of the narrative
- All journey tracking leads to L3 personalization
- Without L3, the narrative arc is incomplete

**Dependencies:** Requires Issue 1 and Issue 2 to be fixed first

**Estimated effort:** 1-2 days

---

### 🟡 **Issue 4: Unlock System Too Basic**

**Severity:** MEDIUM
**Blocks:** Progressive unlocking, gated content, narrative pacing
**Impact:** All nodes except L2 are always accessible

**Why important:**

- Can't gate L3 behind meaningful achievements
- Can't create sense of progression and discovery
- Can't enforce intended narrative pacing

**Dependencies:** None (can be developed in parallel)

**Estimated effort:** 3-4 days

---

### 🟡 **Issue 5: L2 Choice Recording Not Automated**

**Severity:** MEDIUM
**Blocks:** Philosophy-based variation selection
**Impact:** Philosophy choices don't affect content

**Why important:**

- Philosophy is a core dimension of personalization
- L3 variations depend on philosophy alignment
- Without tracking, philosophy becomes meaningless

**Dependencies:** Requires node metadata to indicate philosophy

**Estimated effort:** 1 day

---

### 🟡 **Issue 6: No UI Feedback for Locked Nodes**

**Severity:** MEDIUM
**Blocks:** User understanding, progression clarity
**Impact:** Readers don't know why some nodes are inaccessible

**Why important:**

- User experience suffers without clear feedback
- Creates confusion and frustration
- Reduces engagement with gated content

**Dependencies:** Requires Issue 4 (unlock system) first

**Estimated effort:** 2-3 days

---

## 3. Recommended Implementation Plan

### **Sprint 1: Core Variation Selection (Week 1)**

**Goal:** Connect variation selection system to reading flow

#### **Tasks:**

**1.1 Fix Visit Count in ConditionContext** (4 hours)

- Modify `getConditionContext()` to accept `nodeId: string` parameter
- Look up visit record for nodeId
- Include actual visit count in returned context
- Update all call sites

**File:** `src/stores/storyStore.ts`

**Function signature:**

```typescript
getConditionContext: (nodeId: string): ConditionContext => {
  const state = get();
  const tracking = state.progress.journeyTracking || createInitialJourneyTracking();
  const visitRecord = state.progress.visitedNodes[nodeId];

  return {
    awareness: state.progress.temporalAwarenessLevel,
    journeyPattern: tracking.currentJourneyPattern,
    pathPhilosophy: tracking.dominantPhilosophy,
    visitCount: visitRecord?.visitCount || 0,
    characterVisitPercentages: tracking.characterVisitPercentages,
  };
};
```

**Test cases:**

- First visit returns visitCount: 0
- Second visit returns visitCount: 1
- Visit count increases correctly across multiple visits

---

**1.2 Create Variation Selection Hook** (8 hours)

- Create `src/hooks/useVariationSelection.ts`
- Accept nodeId as parameter
- Load variation file for node
- Get condition context from store
- Call `findMatchingVariation()`
- Return selected variation content + metadata
- Handle errors and missing variations

**File:** `src/hooks/useVariationSelection.ts`

**Function signature:**

```typescript
interface UseVariationSelectionResult {
  content: string;
  variationId: string | null;
  metadata: VariationMetadata | null;
  isLoading: boolean;
  error: Error | null;
  usedFallback: boolean;
}

export function useVariationSelection(
  nodeId: string | null,
  fallbackContent?: string,
): UseVariationSelectionResult {
  // Implementation
}
```

**Algorithm:**

1. If no nodeId, return empty
2. Get condition context from store (with nodeId)
3. Load variation file using `loadVariationFile(storyId, nodeId)`
4. Extract variations array
5. Call `findMatchingVariation(variations, context)`
6. If match found, return variation content + metadata
7. If no match, try fallback to transformation state content
8. If no fallback, return error

**Test cases:**

- Returns correct variation for low awareness
- Returns correct variation for medium awareness
- Returns correct variation for high awareness
- Falls back gracefully when no variation exists
- Handles missing variation files
- Reacts to state changes (awareness, visit count)

---

**1.3 Integrate Hook into StoryView** (4 hours)

- Modify `StoryView.tsx` to use `useVariationSelection`
- Remove direct access to `currentNode.content[state]`
- Add loading state handling
- Add error state handling
- Display variation metadata (variationId, journey pattern, philosophy)

**File:** `src/components/StoryView/StoryView.tsx`

**Changes:**

```typescript
// Replace:
const currentContent = useMemo(() => {
  if (!currentNode || !nodeState) return '';
  return currentNode.content[nodeState.currentState];
}, [currentNode, nodeState]);

// With:
const {
  content: currentContent,
  variationId,
  metadata,
  isLoading,
  error,
  usedFallback,
} = useVariationSelection(selectedNode, currentNode?.content[nodeState?.currentState || 'initial']);
```

**Test cases:**

- Content changes based on awareness level
- Content changes on revisits
- Loading state displays while fetching
- Error state shows fallback content
- Variation metadata displays in dev mode

---

**1.4 Add Variation Debugging Panel** (4 hours)

- Create debug panel showing active variation info
- Display: variationId, journey pattern, philosophy, awareness level, visit count
- Toggle visibility with keyboard shortcut (Shift+D)
- Add to StoryView in development mode

**File:** `src/components/StoryView/VariationDebugPanel.tsx`

**Features:**

- Shows current ConditionContext values
- Shows selected variation ID and metadata
- Shows fallback status
- Color-coded indicators for journey pattern, philosophy, awareness
- Copy button for sharing variation config

---

**Sprint 1 Deliverables:**

- ✅ Variation selection fully integrated into reading flow
- ✅ Visit count properly tracked and used
- ✅ Debug tools for testing variations
- ✅ Test suite validating variation selection logic

**Sprint 1 Success Criteria:**

- Reader's first visit shows "initial" variation
- Reader's second visit shows "firstRevisit" variation (if awareness > 20)
- Different awareness levels show different variations
- No console errors during variation selection
- Fallback works when variations missing

---

### **Sprint 2: L3 Assembly Integration (Week 2)**

**Goal:** Enable L3 convergence assemblies in reading flow

#### **Tasks:**

**2.1 Add L3 Assembly Caching** (4 hours)

- Add assembly cache to storyStore
- Cache key: hash of (journeyPattern, philosophy, awareness, synthesisPattern)
- Cache assemblies to avoid rebuilding
- Invalidate cache on significant state changes

**File:** `src/stores/storyStore.ts`

**State additions:**

```typescript
interface StoryStore {
  // ... existing fields
  l3AssemblyCache: Map<string, L3Assembly>;

  // Actions
  getOrBuildL3Assembly: () => L3Assembly | null;
  clearL3AssemblyCache: () => void;
}
```

**Cache key generation:**

```typescript
function generateL3CacheKey(context: ConditionContext, synthesis: SynthesisPattern): string {
  return `${context.journeyPattern}_${context.pathPhilosophy}_${getAwarenessLevel(context.awareness)}_${synthesis}`;
}
```

**Test cases:**

- Same state returns cached assembly
- State change invalidates cache
- Cache size limited (LRU eviction)

---

**2.2 Integrate L3AssemblyView Component** (6 hours)

- Review existing L3AssemblyView component
- Connect to store state
- Add navigation: L3 node click → build assembly → show view
- Add close/back navigation
- Track L3 assembly views in progress

**File:** `src/components/UI/L3AssemblyView.tsx` (already exists, needs integration)

**Store changes:**

```typescript
interface StoryStore {
  l3AssemblyViewOpen: boolean;
  currentL3Assembly: L3Assembly | null;

  openL3AssemblyView: (nodeId: string) => void;
  closeL3AssemblyView: () => void;
}
```

**Integration flow:**

1. User clicks L3 node in NodeMap
2. `openStoryView()` detects L3 layer
3. Calls `getOrBuildL3Assembly()` instead
4. Sets `l3AssemblyViewOpen = true`
5. L3AssemblyView renders with assembly data
6. User reads all 4 sections
7. User closes view, returns to map

**Test cases:**

- L3 nodes trigger assembly view (not regular StoryView)
- Assembly builds correctly based on journey state
- All 4 sections display properly
- Word counts accurate
- Metadata shows journey pattern, philosophy, synthesis

---

**2.3 Add L3 Section Navigation** (4 hours)

- Add section tabs/navigation within L3AssemblyView
- Allow jumping between arch/algo/hum/conv sections
- Highlight current section
- Track which sections have been read

**Features:**

- Tabs for each section with character colors
- Progress indicators (read/unread)
- Smooth scrolling between sections
- Keyboard shortcuts (1-4 for sections, arrows to navigate)

---

**2.4 Add L3 Assembly to Progress Tracking** (4 hours)

- Track which L3 assemblies reader has viewed
- Store assembly metadata (journey pattern, synthesis, timestamp)
- Display L3 view history in JourneyTracker
- Use for achievement/completion metrics

**Store additions:**

```typescript
interface UserProgress {
  // ... existing fields
  l3AssembliesViewed: Array<{
    viewedAt: string;
    journeyPattern: JourneyPattern;
    pathPhilosophy: PathPhilosophy;
    synthesisPattern: SynthesisPattern;
    awarenessLevel: AwarenessLevel;
  }>;
}
```

---

**Sprint 2 Deliverables:**

- ✅ L3 assemblies build and display correctly
- ✅ L3 nodes in map trigger assembly view
- ✅ Reader can navigate between 4 sections
- ✅ L3 views tracked in progress
- ✅ Assembly caching improves performance

**Sprint 2 Success Criteria:**

- Clicking L3 node shows personalized 4-section assembly
- Assembly reflects reader's journey pattern and philosophy
- Different journey patterns produce different assemblies
- Navigation between sections works smoothly
- L3 view history persisted in localStorage

---

### **Sprint 3: Advanced Unlock System (Week 3)**

**Goal:** Implement configurable node unlock conditions

#### **Tasks:**

**3.1 Define Unlock Configuration Types** (4 hours)

- Create comprehensive unlock condition types
- Support visit count, awareness, philosophy, character, compound conditions
- Create unlock configuration file format (JSON)

**File:** `src/types/Unlock.ts`

**Types:**

```typescript
export type UnlockConditionType =
  | 'visitCount'
  | 'awareness'
  | 'philosophy'
  | 'character'
  | 'transformation'
  | 'compound';

export interface UnlockConditionParams {
  // Visit count conditions
  totalVisits?: number;
  nodeVisits?: Record<string, number>;
  characterVisits?: Record<string, number>;
  layerVisits?: Record<number, number>;

  // Awareness conditions
  minAwareness?: number;
  maxAwareness?: number;

  // Philosophy conditions
  requiredPhilosophy?: PathPhilosophy | PathPhilosophy[];
  minPhilosophyCount?: number;

  // Character conditions
  requiredCharacters?: string[];
  minCharacterPercentage?: Record<string, number>;

  // Transformation conditions
  requiredTransformations?: string[];
  minMetaAwareNodes?: number;

  // Compound conditions
  operator?: 'AND' | 'OR' | 'NOT';
  conditions?: UnlockCondition[];
}

export interface UnlockCondition {
  id: string;
  type: UnlockConditionType;
  params: UnlockConditionParams;
  description: string; // Human-readable description
}

export interface NodeUnlockConfig {
  nodeId: string;
  layer: number;
  defaultLocked: boolean;
  unlockConditions: UnlockCondition[];
  lockedMessage: string;
  unlockMessage?: string; // Notification when unlocked
}

export interface UnlockProgress {
  nodeId: string;
  locked: boolean;
  progress: number; // 0-100% toward unlock
  conditionsMet: string[]; // IDs of met conditions
  conditionsNotMet: string[]; // IDs of unmet conditions
  nextConditionHint: string; // What to do next
}
```

---

**3.2 Create Unlock Evaluator** (8 hours)

- Implement condition evaluation logic
- Support all condition types
- Calculate unlock progress percentage
- Generate helpful hints for locked nodes

**File:** `src/utils/unlockEvaluator.ts`

**Functions:**

```typescript
export function evaluateUnlockCondition(
  condition: UnlockCondition,
  progress: UserProgress,
): boolean {
  switch (condition.type) {
    case 'visitCount':
      return evaluateVisitCountCondition(condition.params, progress);
    case 'awareness':
      return evaluateAwarenessCondition(condition.params, progress);
    case 'philosophy':
      return evaluatePhilosophyCondition(condition.params, progress);
    case 'character':
      return evaluateCharacterCondition(condition.params, progress);
    case 'transformation':
      return evaluateTransformationCondition(condition.params, progress);
    case 'compound':
      return evaluateCompoundCondition(condition.params, progress);
    default:
      return false;
  }
}

export function evaluateNodeUnlock(config: NodeUnlockConfig, progress: UserProgress): boolean {
  if (!config.defaultLocked) return true;

  // All conditions must be met (implicit AND)
  return config.unlockConditions.every((condition) => evaluateUnlockCondition(condition, progress));
}

export function getUnlockProgress(
  config: NodeUnlockConfig,
  progress: UserProgress,
): UnlockProgress {
  const conditionResults = config.unlockConditions.map((condition) => ({
    id: condition.id,
    met: evaluateUnlockCondition(condition, progress),
    description: condition.description,
  }));

  const metCount = conditionResults.filter((r) => r.met).length;
  const totalCount = conditionResults.length;

  return {
    nodeId: config.nodeId,
    locked: !evaluateNodeUnlock(config, progress),
    progress: (metCount / totalCount) * 100,
    conditionsMet: conditionResults.filter((r) => r.met).map((r) => r.id),
    conditionsNotMet: conditionResults.filter((r) => !r.met).map((r) => r.id),
    nextConditionHint: generateNextConditionHint(conditionResults, progress),
  };
}

function generateNextConditionHint(
  results: Array<{ met: boolean; description: string }>,
  progress: UserProgress,
): string {
  const unmet = results.find((r) => !r.met);
  return unmet ? unmet.description : '';
}
```

**Test cases:**

- Visit count conditions evaluate correctly
- Awareness conditions with ranges work
- Philosophy conditions check dominant philosophy
- Compound AND/OR conditions work
- Progress percentage accurate
- Hints generated correctly

---

**3.3 Create Unlock Configuration Files** (6 hours)

- Create unlock configs for all L2, L3, L4 nodes
- Define meaningful unlock conditions for each layer
- Write clear locked/unlocked messages

**File:** `src/data/stories/eternal-return/unlock-config.json`

**Sample config:**

```json
{
  "nodes": [
    {
      "nodeId": "arch-L3",
      "layer": 3,
      "defaultLocked": true,
      "unlockConditions": [
        {
          "id": "l2-exploration",
          "type": "visitCount",
          "params": {
            "layerVisits": { "2": 2 }
          },
          "description": "Visit at least 2 Layer 2 nodes"
        },
        {
          "id": "cross-character",
          "type": "character",
          "params": {
            "requiredCharacters": ["archaeologist", "algorithm"]
          },
          "description": "Explore both Archaeologist and Algorithm perspectives"
        },
        {
          "id": "medium-awareness",
          "type": "awareness",
          "params": {
            "minAwareness": 35
          },
          "description": "Reach Medium temporal awareness (35%)"
        }
      ],
      "lockedMessage": "Layer 3 convergence requires deeper exploration across multiple perspectives.",
      "unlockMessage": "Layer 3 convergence unlocked! Your journey has achieved cross-temporal synthesis."
    }
  ]
}
```

**Recommended conditions:**

- **L2 nodes:** Unlock after visiting corresponding L1 node (already working)
- **L3 nodes:** Require 2+ L2 visits, 2+ characters explored, awareness ≥35%
- **L4 nodes:** Require L3 completion, awareness ≥70%, all 3 characters visited

---

**3.4 Integrate Unlock System into Store** (6 hours)

- Load unlock configs on story load
- Evaluate unlocks reactively after each visit
- Update `canVisitNode()` to use unlock evaluator
- Track newly unlocked nodes
- Dispatch unlock notifications

**Store changes:**

```typescript
interface StoryStore {
  unlockConfigs: Map<string, NodeUnlockConfig>;
  recentlyUnlockedNodes: string[]; // For notifications

  loadUnlockConfigs: (storyId: string) => void;
  evaluateUnlocks: () => void; // Called after visitNode
  getUnlockProgress: (nodeId: string) => UnlockProgress;
}
```

**Integration flow:**

1. Load unlock configs with story data
2. After each `visitNode()`, call `evaluateUnlocks()`
3. Check all locked nodes to see if conditions now met
4. Add newly unlocked nodes to `recentlyUnlockedNodes`
5. Trigger notification animation in UI
6. Update `canVisitNode()` to use unlock evaluator

**Test cases:**

- Configs load correctly
- Unlocks evaluate after visits
- New unlocks detected
- Progress tracking accurate
- Performance acceptable (< 50ms for full evaluation)

---

**Sprint 3 Deliverables:**

- ✅ Comprehensive unlock condition system
- ✅ L3/L4 nodes properly gated
- ✅ Unlock progress tracking
- ✅ Configuration-driven unlock logic

**Sprint 3 Success Criteria:**

- L3 nodes locked until conditions met
- Visiting L2 nodes progresses toward L3 unlock
- Unlock notifications appear when nodes unlock
- Reader understands what's needed to unlock nodes
- No performance degradation from unlock evaluation

---

### **Sprint 4: L2 Choice Recording & Polish (Week 4)**

**Goal:** Complete philosophical path tracking and polish rough edges

#### **Tasks:**

**4.1 Add Philosophy Metadata to L2 Nodes** (4 hours)

- Add philosophy field to L2 node definitions
- Map node IDs to philosophy choices (accept/resist/invest)
- Validate all L2 nodes have philosophy assigned

**File:** `src/data/stories/eternal-return/archaeologist.json`, `algorithm.json`, etc.

**Changes:**

```json
{
  "id": "arch-L2-accept",
  "layer": 2,
  "chapterTitle": "Accepting the Recursion",
  "philosophy": "accept",
  ...
}
```

**OR** (if not adding to node definitions):

**File:** `src/data/stories/eternal-return/philosophy-mapping.json`

```json
{
  "arch-L2-accept": "accept",
  "arch-L2-resist": "resist",
  "arch-L2-invest": "invest",
  "algo-L2-accept": "accept",
  ...
}
```

---

**4.2 Automatically Record L2 Choices** (4 hours)

- Detect L2 node visits in `visitNode()`
- Extract philosophy from node metadata
- Call `recordL2Choice()` automatically
- Update journey tracking

**Store changes:**

```typescript
visitNode: (nodeId: string) => {
  // ... existing visit logic

  // Detect and record L2 choices
  const node = state.nodes.get(nodeId);
  if (node && node.layer === 2 && node.philosophy) {
    get().recordL2Choice(node.philosophy);
  }

  // ... rest of visit logic
};
```

**Test cases:**

- Visiting L2-accept increments accept counter
- Visiting L2-resist increments resist counter
- Visiting L2-invest increments invest counter
- Philosophy calculation updates correctly
- L3 variations reflect philosophy choices

---

**4.3 Add Cross-Character Connection Tracking** (6 hours)

- Track navigation patterns between characters
- Count character switches (arch→algo, algo→hum, etc.)
- Add to JourneyTracking state
- Use in variation selection

**Store additions:**

```typescript
interface JourneyTracking {
  // ... existing fields
  crossCharacterConnections: {
    arch_algo: number;
    arch_hum: number;
    algo_hum: number;
  };
  navigationPattern: 'linear' | 'exploratory' | 'recursive';
  lastCharacterVisited?: 'archaeologist' | 'algorithm' | 'lastHuman';
}

// In visitNode:
const lastChar = state.progress.journeyTracking?.lastCharacterVisited;
const currentChar = node.character;

if (lastChar && lastChar !== currentChar) {
  // Increment appropriate connection counter
  const key = `${charToPrefix(lastChar)}_${charToPrefix(currentChar)}`;
  if (tracking.crossCharacterConnections[key] !== undefined) {
    tracking.crossCharacterConnections[key]++;
  }
}

tracking.lastCharacterVisited = currentChar;
```

---

**4.4 Add Locked Node Indicators to NodeMap** (6 hours)

- Visual indicator for locked nodes (dimmed, overlaid lock icon)
- Hover tooltip showing unlock requirements
- Progress indicator for partially unlocked nodes

**File:** `src/components/NodeMap/CustomStoryNode.tsx`

**Features:**

- Lock icon overlay for locked nodes
- Dimmed appearance
- Tooltip on hover showing:
  - "Locked: [message]"
  - Progress: X/Y conditions met
  - Next action: [hint]
- Animated unlock effect when conditions met

---

**4.5 Add Unlock Notification System** (4 hours)

- Toast notification when node unlocks
- Animation highlighting newly unlocked node
- Sound effect (optional, preference-based)

**File:** `src/components/UI/UnlockNotification.tsx`

**Features:**

- Toast appears in corner: "New node unlocked: [title]"
- Click to navigate to unlocked node
- Auto-dismiss after 5 seconds
- Queue multiple notifications if needed

---

**4.6 Add Journey Tracker Enhancements** (4 hours)

- Display current journey pattern prominently
- Show dominant philosophy
- Show cross-character connection heatmap
- Show unlock progress for locked nodes

**File:** `src/components/UI/JourneyTracker.tsx`

**Enhancements:**

- Journey pattern badge with icon
- Philosophy breakdown chart
- Character visit percentages
- Temporal awareness meter
- Next unlock preview

---

**Sprint 4 Deliverables:**

- ✅ L2 philosophy choices automatically recorded
- ✅ Cross-character connections tracked
- ✅ Locked nodes visually indicated
- ✅ Unlock notifications working
- ✅ Journey tracker enhanced

**Sprint 4 Success Criteria:**

- L2 choices affect L3 variations
- Cross-character navigation tracked
- Locked nodes clearly communicated
- Unlock notifications provide positive feedback
- Journey tracker shows comprehensive state

---

## 4. Architectural Recommendations

### **1. Separation of Concerns: Engine vs. UI**

**Current state:** Good separation exists but not consistently enforced.

**Recommendations:**

**Create dedicated engine layer:**

```
src/
  engine/
    variationEngine.ts      # Variation selection orchestrator
    unlockEngine.ts         # Unlock evaluation orchestrator
    journeyEngine.ts        # Journey state calculator
    l3AssemblyEngine.ts     # L3 assembly orchestrator
```

**Benefits:**

- Pure functions, easily testable
- No React dependencies in engine
- Can be used in worker threads
- Clear API surface

**Pattern:**

```typescript
// Engine provides pure functions
export function selectVariation(
  nodeId: string,
  context: ConditionContext,
  variations: Variation[]
): Variation | null { ... }

// Hook wraps engine function with React state
export function useVariationSelection(nodeId: string) {
  const context = useStoryStore(state => state.getConditionContext(nodeId));
  const variations = loadVariationFile(storyId, nodeId)?.variations || [];
  return useMemo(
    () => selectVariation(nodeId, context, variations),
    [nodeId, context, variations]
  );
}
```

---

### **2. State Management: Event System for Decoupling**

**Current state:** Store methods call each other directly, creating tight coupling.

**Recommendation:** Introduce event system for cross-cutting concerns.

**Pattern:**

```typescript
// Event types
type StoryEvent =
  | { type: 'NODE_VISITED'; nodeId: string; timestamp: string }
  | { type: 'NODE_UNLOCKED'; nodeId: string }
  | { type: 'AWARENESS_CHANGED'; oldLevel: number; newLevel: number }
  | { type: 'L3_ASSEMBLED'; assembly: L3Assembly }
  | { type: 'PHILOSOPHY_RECORDED'; choice: PathPhilosophy };

// Event bus in store
interface StoryStore {
  eventBus: Array<StoryEvent>;
  emit: (event: StoryEvent) => void;
  subscribe: (handler: (event: StoryEvent) => void) => () => void;
}

// Example: Unlock evaluation subscribes to NODE_VISITED events
store.subscribe((event) => {
  if (event.type === 'NODE_VISITED') {
    evaluateUnlocks();
  }
});
```

**Benefits:**

- Loose coupling between subsystems
- Easy to add new reactions to events
- Clear audit trail of state changes
- Easier debugging

---

### **3. Content Loading: Abstract Variation Resolution**

**Current state:** contentLoader fills node.content with static transformations.

**Recommendation:** Node definitions should reference variation files, not contain content.

**Proposed node structure:**

```typescript
interface StoryNode {
  id: string;
  character: CharacterType;
  title: string;
  position: Position;

  // Replace static content with variation reference
  variationFile: string; // e.g., "layer1/arch-L1-variations.json"

  // Fallback for nodes without variations
  fallbackContent?: NodeContent;

  connections: NodeConnection[];
  visualState: NodeVisualState;
  metadata: NodeMetadata;
}
```

**Benefits:**

- Nodes are lightweight references
- Content loaded on-demand
- No duplication between node definitions and variation files
- Easier to add new variations without touching nodes

---

### **4. Performance: Caching Strategy**

**Recommendations:**

**Variation selection cache:**

```typescript
interface VariationCache {
  [key: string]: {
    // key = hash(nodeId, contextHash)
    variationId: string;
    content: string;
    metadata: VariationMetadata;
    cachedAt: number;
    ttl: number;
  };
}
```

**L3 assembly cache:**

```typescript
interface L3AssemblyCache {
  [key: string]: {
    // key = hash(journey, philosophy, awareness, synthesis)
    assembly: L3Assembly;
    cachedAt: number;
    journeySnapshot: JourneyTracking; // For cache invalidation
  };
}
```

**Unlock evaluation cache:**

```typescript
interface UnlockCache {
  [nodeId: string]: {
    locked: boolean;
    progress: UnlockProgress;
    evaluatedAt: number;
    progressHash: string; // Hash of UserProgress for invalidation
  };
}
```

**Cache invalidation strategy:**

- Variation cache: Invalidate on visit count change for that node
- L3 assembly cache: Invalidate on journey pattern or philosophy change
- Unlock cache: Invalidate on any UserProgress change

---

### **5. Testing: Testability Improvements**

**Recommendations:**

**Separate testable engine from React:**

```typescript
// ✅ Good: Pure function, easily tested
export function calculateAwarenessLevel(characterVisits: Record<string, number>): number {
  const total = Object.values(characterVisits).reduce((a, b) => a + b, 0);
  const unique = Object.values(characterVisits).filter((v) => v > 0).length;
  return Math.min(unique * 20 + Math.min((total / 10) * 40, 40), 100);
}

// ❌ Hard to test: Coupled to Zustand store
const updateTemporalAwareness = () => {
  set((state) => {
    const { archaeologist, algorithm, lastHuman } = state.progress.characterNodesVisited;
    state.progress.temporalAwarenessLevel = calculateAwarenessLevel({
      archaeologist,
      algorithm,
      lastHuman,
    });
  });
};
```

**Test structure:**

```
src/
  engine/
    __tests__/
      variationEngine.test.ts
      journeyEngine.test.ts
      unlockEngine.test.ts
      l3AssemblyEngine.test.ts
```

**Test coverage goals:**

- 100% coverage of engine functions
- 80% coverage of store actions
- 60% coverage of UI components (focused on logic, not rendering)

---

### **6. Developer Experience: Debug Tools**

**Recommendations:**

**Variation debug panel** (Already planned in Sprint 1)

**Journey state inspector:**

- Shows full JourneyTracking state
- Shows condition context
- Shows which variations would be selected for each node
- Time-travel debugging (replay visit history)

**Unlock simulator:**

- Simulate unlocking nodes
- Preview what content unlocks when
- Test unlock conditions without manual clicking

**Content manifest validator:**

- Validate all variation files load correctly
- Check for missing variations
- Verify metadata completeness
- Detect duplicate variation IDs

---

## 5. Quick Wins

These can be implemented immediately to unblock testing:

### **Quick Win 1: Fix visitCount Parameter (2 hours)**

**Impact:** HIGH
**Effort:** LOW

Modify `getConditionContext()` to accept nodeId and return actual visit count.

**File:** `src/stores/storyStore.ts:450-461`

---

### **Quick Win 2: Add Philosophy to L2 Node Metadata (1 hour)**

**Impact:** MEDIUM
**Effort:** LOW

Add philosophy field to L2 node definitions or create mapping file.

**File:** `src/data/stories/eternal-return/[character].json`

---

### **Quick Win 3: Console Logging for Variation Selection (1 hour)**

**Impact:** MEDIUM (debugging)
**Effort:** LOW

Add console.log statements showing which variations are being considered and selected.

**File:** `src/utils/conditionEvaluator.ts:74-132`

```typescript
export function findMatchingVariation(
  variations: Variation[],
  context: ConditionContext,
): Variation | null {
  console.log('[VariationSelection] Finding match for:', {
    nodeId: context.nodeId,
    awareness: context.awareness,
    journeyPattern: context.journeyPattern,
    pathPhilosophy: context.pathPhilosophy,
    visitCount: context.visitCount,
  });

  const matches = variations.filter((variation) => {
    console.log(
      '[VariationSelection] Checking variation:',
      variation.variationId,
      variation.metadata,
    );
    // ... existing logic
  });

  console.log('[VariationSelection] Matches found:', matches.length);
  return matches[0] || null;
}
```

---

### **Quick Win 4: Locked Node Styling (2 hours)**

**Impact:** MEDIUM (UX)
**Effort:** LOW

Add basic styling to indicate locked L2 nodes in NodeMap.

**File:** `src/components/NodeMap/CustomStoryNode.tsx`

```typescript
const canVisit = useStoryStore(state => state.canVisitNode(node.id));

return (
  <div
    className={`node ${!canVisit ? 'node-locked' : ''}`}
    style={{ opacity: canVisit ? 1 : 0.5 }}
  >
    {!canVisit && <LockIcon />}
    {/* ... rest of node */}
  </div>
);
```

---

### **Quick Win 5: L3 Node Detection (1 hour)**

**Impact:** HIGH (unblocks Sprint 2)
**Effort:** LOW

Add helper function to detect L3 nodes by ID pattern.

**File:** `src/utils/nodeUtils.ts` (new file)

```typescript
export function getNodeLayer(nodeId: string): number {
  const match = nodeId.match(/-L(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

export function isL3Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 3;
}

export function isL4Node(nodeId: string): boolean {
  return getNodeLayer(nodeId) === 4;
}
```

---

## Summary

### **Critical Path to Functional Narrative Engine:**

1. **Week 1:** Fix variation selection integration (Issues #1, #2)
2. **Week 2:** Integrate L3 assembly (Issue #3)
3. **Week 3:** Implement unlock system (Issue #4)
4. **Week 4:** Polish and L2 choice tracking (Issues #5, #6)

### **Immediate Actions (Today):**

1. Fix `getConditionContext()` to accept nodeId parameter ✓
2. Add console logging to variation selection ✓
3. Add philosophy metadata to L2 nodes ✓
4. Create useVariationSelection hook ✓
5. Integrate hook into StoryView ✓

### **Success Metrics:**

- **Variation selection:** Content changes based on awareness, journey, philosophy
- **L3 assembly:** Personalized 4-section convergence builds correctly
- **Unlock system:** L3/L4 nodes locked until meaningful conditions met
- **Philosophy tracking:** L2 choices affect L3 content
- **Performance:** No degradation with 960+ variations
- **UX:** Clear feedback on locked nodes, unlocking, and journey progress

---

## Conclusion

The Narramorph codebase has **excellent infrastructure** that is **not yet connected**. The narrative engine components exist independently but don't form a cohesive system. The 4-sprint plan prioritizes **integration over new features**, completing the architecture before adding complexity.

**Key insight:** You don't need to build new systems—you need to connect existing systems. The variation library, journey tracking, and L3 assembly are all ready. They just need to be wired into the reading flow.

**Next step:** Begin Sprint 1, Task 1.1 (Fix Visit Count in ConditionContext). This 4-hour task unblocks all downstream work.
