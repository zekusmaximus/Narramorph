# Consolidated Implementation Plan — Architecture Audit Results

**Generated:** 2025-11-12
**Scope:** Actionable plan based on Tasks 0-4 audit findings
**Purpose:** Roadmap for narrative engine completion before 3D UI implementation

---

## Executive Summary

**Audit Coverage:**

- ✅ Task 0: Repository inventory (40+ source files, 292 content files, 6 functional areas)
- ✅ Task 1: State model snapshot (journey tracking, awareness, visit records)
- ✅ Task 2: Variation selection & unlock systems (7 condition types, 4D parameter space)
- ✅ Task 3: L3 assembly & content I/O (loading pipeline, caching, coupling analysis)
- ✅ Task 4: Navigation flow & type safety (19-step visit cascade, type audit)

**Health Assessment:**

- **Strengths:** Comprehensive journey tracking, flexible unlock system, robust L3 parameterization
- **Weaknesses:** Type safety gaps (11 `any` usages), tight coupling (no service layer), missing variation deduplication
- **Critical Gaps:** Visit recording timing, L3 visit tracking, variation history, awareness model mismatch

**Recommendation:** Address critical issues in 4 focused sprints before proceeding with 3D UI.

---

## 1. Critical Issues — Ranked by Severity + Dependency

### 🔴 Severity 1: Data Integrity / Correctness

| #       | Issue                                  | Impact                                                                  | Dependency                | Files Affected                                        | Est. Effort         |
| ------- | -------------------------------------- | ----------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------- | ------------------- |
| **1.1** | **L3 visit recording unclear**         | If L3 visits not tracked, awareness/unlock calculations break           | Blocks all L3 features    | `storyStore.ts:1027-1032`<br>`L3AssemblyView.tsx`     | 2h verify + 4h fix  |
| **1.2** | **visitNode() timing (useEffect)**     | User can close view before visit records; "peeking" without tracking    | Affects all analytics     | `StoryView.tsx:299-303`<br>`storyStore.ts:836`        | 1h fix              |
| **1.3** | **No variation deduplication**         | Same variation shown on revisit; breaks "temporal bleeding" expectation | Affects reader experience | `useVariationSelection.ts`<br>`VisitRecord` interface | 6h implement        |
| **1.4** | **Missing variationId in VisitRecord** | Cannot audit which variations were shown; blocks deduplication          | Prerequisite for 1.3      | `Store.ts:16-22`                                      | 2h add + 2h migrate |

**Total Est:** 17 hours

---

### 🟡 Severity 2: Type Safety / Maintainability

| #       | Issue                              | Impact                                                    | Dependency                | Files Affected                                   | Est. Effort                   |
| ------- | ---------------------------------- | --------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ----------------------------- |
| **2.1** | **`any` in variationLoader.ts:58** | No compile-time validation of variation structure         | Critical path type safety | `variationLoader.ts`                             | 3h fix + 2h test              |
| **2.2** | **Optional journeyTracking**       | 20+ defensive null checks; code complexity                | Code quality              | `Store.ts:74`<br>`storyStore.ts` (20+ locations) | 2h make required + 1h cleanup |
| **2.3** | **React Flow type erasure**        | `as unknown` casts bypass type checking in node rendering | Navigation type safety    | `NodeMap.tsx:207`<br>`CustomStoryNode.tsx:158`   | 4h fix with generics          |
| **2.4** | **VariationMetadata all optional** | Incomplete variation validation; runtime errors possible  | Content validation        | `Variation.ts:42-70`                             | 3h split core/enrichment      |

**Total Est:** 15 hours

---

### 🟢 Severity 3: Performance / Architecture

| #       | Issue                                    | Impact                                                      | Dependency               | Files Affected                                              | Est. Effort               |
| ------- | ---------------------------------------- | ----------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- | ------------------------- |
| **3.1** | **L3 cache clears on every L2 visit**    | Unnecessary rebuilds if philosophy unchanged                | Performance optimization | `storyStore.ts:932`                                         | 2h selective invalidation |
| **3.2** | **No service layer abstraction**         | Direct imports create tight coupling; hard to test          | Architecture improvement | `storyStore.ts` (12+ imports)<br>`useVariationSelection.ts` | 16h refactor (Phase 2)    |
| **3.3** | **No visit count in variation matching** | Cannot create "visit 3+ specific" content                   | Feature gap              | `conditionEvaluator.ts:79-215`                              | 4h add visitCountRange    |
| **3.4** | **Missing unlock predicates**            | No cross-character, navigation pattern, sequence predicates | Feature gap              | `unlockEvaluator.ts`                                        | 8h add 3 new types        |

**Total Est:** 30 hours

---

### Dependency Graph

```
1.4 (Add variationId to VisitRecord)
  └─► 1.3 (Variation deduplication)
       └─► [Reader experience improved]

1.2 (Fix visitNode timing)
  └─► 1.1 (Verify L3 visit recording)
       └─► [Awareness calculations correct]

2.2 (Make journeyTracking required)
  └─► [Enables cleaner code for all features]

2.1 (Fix variationLoader any)
  └─► 2.4 (Split VariationMetadata)
       └─► [Type-safe content pipeline]

3.1 (Selective L3 cache invalidation)
  └─► [Performance improvement, no dependencies]

3.2 (Service layer)
  └─► [Enables 3.3, 3.4 and future features]
```

**Critical Path:** 1.4 → 1.3, 1.2 → 1.1, 2.1 → 2.4

---

## 2. Four-Sprint Implementation Plan

### Sprint 1: State Integrity & Visit Tracking (1-2 weeks)

**Goal:** Fix data recording gaps, ensure visit tracking reliability.

**Tickets:**

#### **1.1-A: Verify L3 Visit Recording**

**Priority:** P0 (Blocker)
**Files to check:**

- `src/components/UI/L3AssemblyView.tsx`

**Verification steps:**

1. Search for `visitNode` call in L3AssemblyView
2. If missing, add `visitNode()` call when L3 assembly opens
3. Test: Visit L3 node → check `progress.visitedNodes['arch-L3']` exists
4. Test: L3 visit increments awareness → unlocks L4 nodes

**Acceptance Criteria:**

- [ ] L3 nodes recorded in visit history
- [ ] Awareness increases after L3 visit
- [ ] L4 unlocks trigger correctly

---

#### **1.1-B: Move visitNode() to openStoryView**

**Priority:** P0 (Blocker)
**Files to modify:**

- `src/stores/storyStore.ts:1024-1051` (openStoryView action)
- `src/components/StoryView/StoryView.tsx:299-303` (remove useEffect)

**Changes:**

```typescript
// storyStore.ts:1024
openStoryView: (nodeId: string) => {
  const state = get();

  // L3 routing
  if (isL3Node(nodeId)) {
    state.openL3AssemblyView();
    return;
  }

  // L4 special handling (future)
  if (isL4Node(nodeId)) {
    console.log('[Navigation] L4 node detected');
  }

  // ✅ CHANGE: Visit node BEFORE opening view
  state.visitNode(nodeId);  // ← Move here

  set((draftState) => {
    draftState.storyViewOpen = true;
  });
},
```

```typescript
// StoryView.tsx:299-303 — DELETE this useEffect
// useEffect(() => {
//   if (storyViewOpen && selectedNode) {
//     handleVisit();
//   }
// }, [storyViewOpen, selectedNode, handleVisit]);
```

**Test cases:**

- [ ] Visit node → visitedNodes updated before view renders
- [ ] Close view within 10ms → visit still recorded
- [ ] Rapid clicks → all nodes visited (no race condition)

---

#### **1.2-A: Add variationId to VisitRecord**

**Priority:** P0 (Prerequisite for deduplication)
**Files to modify:**

- `src/types/Store.ts:16-22` (VisitRecord interface)
- `src/stores/storyStore.ts:846-865` (visitNode action)
- `src/stores/storyStore.ts:1080-1153` (migration logic)

**Type changes:**

```typescript
// Store.ts:16-22
interface VisitRecord {
  visitCount: number;
  visitTimestamps: string[];
  currentState: TransformationState;
  timeSpent: number;
  lastVisited: string;
  variationId?: string; // ✅ ADD: Track selected variation
  previousNodeId?: string; // ✅ ADD: Previous node in path (optional)
}
```

**Data flow changes:**

```typescript
// storyStore.ts — New helper action
recordVariationShown: (nodeId: string, variationId: string) => {
  set((draftState) => {
    const record = draftState.progress.visitedNodes[nodeId];
    if (record) {
      record.variationId = variationId;
    }
  });
},
```

```typescript
// useVariationSelection.ts — Call after selection
useEffect(() => {
  if (variationId && nodeId) {
    storyStore.getState().recordVariationShown(nodeId, variationId);
  }
}, [variationId, nodeId]);
```

**Migration:**

```typescript
// storyStore.ts:1080-1153 (loadProgress)
if (!savedProgress.visitedNodes[nodeId].variationId) {
  savedProgress.visitedNodes[nodeId].variationId = undefined; // Backfill
}
```

**Test cases:**

- [ ] Visit node → variationId recorded in VisitRecord
- [ ] Revisit → variationId updated to new selection
- [ ] Old saves migrate without errors

---

#### **1.2-B: Implement Variation Deduplication**

**Priority:** P1 (Depends on 1.2-A)
**Files to modify:**

- `src/utils/conditionEvaluator.ts:79-215` (findMatchingVariation)
- `src/hooks/useVariationSelection.ts:55-134` (add exclusion)

**Function signature change:**

```typescript
// conditionEvaluator.ts:79
export function findMatchingVariation(
  variations: Variation[],
  context: ConditionContext,
  options?: {
    excludeVariationIds?: string[]; // ✅ NEW: Skip previously shown
  },
): Variation | null {
  // Filter out excluded variations
  const candidateVariations = options?.excludeVariationIds
    ? variations.filter((v) => !options.excludeVariationIds!.includes(v.variationId))
    : variations;

  // ... existing matching logic on candidateVariations
}
```

**Hook changes:**

```typescript
// useVariationSelection.ts:55
const visitHistory = useStoryStore((state) => state.progress.visitedNodes[nodeId || '']);

const excludedIds = useMemo(() => {
  if (!visitHistory || !visitHistory.variationId) return [];
  return [visitHistory.variationId]; // Exclude last shown
}, [visitHistory]);

const variation = findMatchingVariation(
  variationFile.variations,
  context,
  { excludeVariationIds: excludedIds }, // ✅ Pass exclusion list
);
```

**Test cases:**

- [ ] First visit: Any matching variation selected
- [ ] Second visit (same conditions): Different variation selected
- [ ] Exhaust all variations → Fallback to first (log warning)
- [ ] Conditions change → Deduplication applies to new candidate pool

**Data structure for future (multi-visit deduplication):**

```typescript
// VisitRecord (future enhancement)
interface VisitRecord {
  // ...
  variationHistory?: string[]; // All shown variations in order
}
```

---

#### **1.3: Make journeyTracking Required**

**Priority:** P1 (Code quality improvement)
**Files to modify:**

- `src/types/Store.ts:74` (UserProgress interface)
- `src/stores/storyStore.ts:41-68` (createInitialProgress)
- `src/stores/storyStore.ts` (remove 20+ null checks)

**Type change:**

```typescript
// Store.ts:74
journeyTracking: JourneyTracking; // ✅ CHANGE: Remove '?'
```

**Initialization:**

```typescript
// storyStore.ts:41-68
function createInitialProgress(): UserProgress {
  return {
    // ... existing fields
    journeyTracking: createInitialJourneyTracking(), // ✅ CHANGE: Always initialize
  };
}
```

**Cleanup (remove checks like):**

```typescript
// BEFORE:
if (!state.progress.journeyTracking) {
  state.progress.journeyTracking = createInitialJourneyTracking();
}

// AFTER:
// Delete check, access directly
state.progress.journeyTracking.l2Choices.accept++;
```

**Files to scan for null checks:**

```bash
grep -rn "progress\.journeyTracking\?" src/stores
grep -rn "!.*journeyTracking" src/stores
```

**Test cases:**

- [ ] New game → journeyTracking exists
- [ ] Old saves migrate → journeyTracking created if missing
- [ ] No runtime null checks remaining (lint pass)

---

**Sprint 1 Deliverables:**

- ✅ L3 visits recorded correctly
- ✅ visitNode() timing reliable (no peeking)
- ✅ variationId tracking enabled
- ✅ Variation deduplication working
- ✅ journeyTracking always initialized

**Dependencies for Sprint 2:** None (all foundational fixes)

---

### Sprint 2: Type Safety & Validation (1 week)

**Goal:** Eliminate `any` usages, strengthen type system, add validation.

**Tickets:**

#### **2.1: Replace `any` in variationLoader**

**Priority:** P1 (Type safety critical path)
**Files to modify:**

- `src/utils/variationLoader.ts:58-139` (normalizeVariation function)

**Type signature change:**

```typescript
// variationLoader.ts:58
function normalizeVariation(
  variation: unknown, // ✅ CHANGE: unknown instead of any
  fileNodeId?: string,
): Variation {
  // Add type guards
  if (!isPlainObject(variation)) {
    throw new Error(`Invalid variation: expected object, got ${typeof variation}`);
  }

  const v = variation as Record<string, unknown>;

  // Validate required fields
  if (typeof v.variationId !== 'string') {
    throw new Error('Variation missing required field: variationId');
  }
  if (typeof v.content !== 'string') {
    throw new Error('Variation missing required field: content');
  }
  if (typeof v.transformationState !== 'string') {
    throw new Error('Variation missing required field: transformationState');
  }

  // ... rest of normalization with proper type guards
}
```

**Helper function to add:**

```typescript
// variationLoader.ts (new helper)
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

**Test cases:**

- [ ] Valid variation → normalized successfully
- [ ] Missing variationId → throws error with message
- [ ] Missing content → throws error
- [ ] Wrong type (array, string) → throws error
- [ ] All 292 content files load without errors

---

#### **2.2: Split VariationMetadata into Core + Enrichment**

**Priority:** P2 (Validation improvement)
**Files to modify:**

- `src/types/Variation.ts:42-70` (VariationMetadata interface)

**New type structure:**

```typescript
// Variation.ts:42
/**
 * Core metadata fields (required for all variations)
 */
interface VariationMetadataCore {
  variationId: string; // Unique ID
  nodeId: string; // Parent node
  wordCount: number; // Content length
  layer: number; // L1/L2/L3/L4
  createdDate: string; // ISO-8601 date
  section?: string; // L3: 'archaeologist' | 'algorithm' | 'lastHuman' | 'convergence'
}

/**
 * Enrichment metadata (optional journey/philosophy/awareness context)
 */
interface VariationMetadataEnrichment {
  journeyPattern?: JourneyPattern;
  journeyCode?: string;
  philosophyDominant?: PathPhilosophy;
  philosophyCode?: string;
  awarenessLevel?: AwarenessLevel;
  awarenessCode?: string;
  awarenessRange?: [number, number];
  readableLabel?: string;
  humanDescription?: string;

  // L3-specific
  synthesisPattern?: SynthesisPattern;
  convergenceAlignment?: 'preserve' | 'transform' | 'release';
  primaryThemes?: string[];

  // ... other optional fields
}

/**
 * Complete variation metadata
 */
type VariationMetadata = VariationMetadataCore & VariationMetadataEnrichment;
```

**Validation function:**

```typescript
// Variation.ts (new validator)
export function validateVariationMetadata(metadata: unknown): metadata is VariationMetadata {
  if (!isPlainObject(metadata)) return false;

  const m = metadata as Record<string, unknown>;

  // Check core fields
  if (typeof m.variationId !== 'string') return false;
  if (typeof m.nodeId !== 'string') return false;
  if (typeof m.wordCount !== 'number') return false;
  if (typeof m.layer !== 'number') return false;
  if (typeof m.createdDate !== 'string') return false;

  return true;
}
```

**Test cases:**

- [ ] Complete metadata → validates as VariationMetadata
- [ ] Missing wordCount → fails validation
- [ ] Optional fields absent → still validates
- [ ] All 292 content files have valid metadata

---

#### **2.3: Fix React Flow Type Erasure**

**Priority:** P2 (Navigation type safety)
**Files to modify:**

- `src/components/NodeMap/NodeMap.tsx:49-74` (convertToReactFlowNodes)
- `src/components/NodeMap/CustomStoryNode.tsx:157-158` (data destructuring)

**Type-safe approach:**

```typescript
// NodeMap.tsx:49
import type { Node } from '@xyflow/react';

type StoryFlowNode = Node<CustomStoryNodeData>; // ✅ Use React Flow's generic

function convertToReactFlowNodes(
  storyNodes: Map<string, StoryNode>,
  getNodeState: (id: string) => NodeUIState,
  selectedNode: string | null,
  canVisitNode: (id: string) => boolean,
): StoryFlowNode[] {
  // ✅ Return typed array
  return Array.from(storyNodes.values())
    .filter((node) => canVisitNode(node.id))
    .map((node): StoryFlowNode => {
      // ✅ Explicit return type
      const nodeState = getNodeState(node.id);

      return {
        id: node.id,
        type: 'storyNode',
        position: node.position,
        data: {
          // ✅ No type erasure
          node,
          nodeState,
          isSelected: selectedNode === node.id,
        },
        draggable: false,
        selectable: true,
        focusable: true,
      };
    });
}
```

```typescript
// CustomStoryNode.tsx:157
function CustomStoryNode({ data, selected }: NodeProps<CustomStoryNodeData>) {
  const { node, nodeState, isSelected } = data; // ✅ No cast needed
  // ...
}
```

**Update nodeTypes:**

```typescript
// NodeMap.tsx:108
const nodeTypes = {
  storyNode: CustomStoryNode as React.ComponentType<NodeProps<CustomStoryNodeData>>,
};
```

**Test cases:**

- [ ] TypeScript compiles without `as unknown` casts
- [ ] Node rendering still works
- [ ] Hover tooltips display correct data
- [ ] Locked nodes show unlock progress

---

#### **2.4: Add Content Validation Layer**

**Priority:** P2 (Quality assurance)
**Files to create:**

- `src/utils/contentValidator.ts` (new file)

**Validation functions:**

```typescript
// contentValidator.ts (new file)
import type { StoryData, StoryNode, Variation, VariationFile } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate complete story data structure
 */
export function validateStoryData(storyData: StoryData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check metadata
  if (!storyData.metadata?.id) errors.push('Missing story ID');
  if (!storyData.metadata?.title) errors.push('Missing story title');

  // Check nodes
  if (!storyData.nodes || storyData.nodes.length === 0) {
    errors.push('Story has no nodes');
  }

  // Check start node exists
  const startNode = storyData.nodes.find((n) => n.id === storyData.configuration.startNodeId);
  if (!startNode) errors.push(`Start node ${storyData.configuration.startNodeId} not found`);

  // Check all connections reference valid nodes
  const nodeIds = new Set(storyData.nodes.map((n) => n.id));
  for (const conn of storyData.connections || []) {
    if (!nodeIds.has(conn.sourceId))
      errors.push(`Connection ${conn.id} references invalid source: ${conn.sourceId}`);
    if (!nodeIds.has(conn.targetId))
      errors.push(`Connection ${conn.id} references invalid target: ${conn.targetId}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate variation file completeness
 */
export function validateVariationFile(file: VariationFile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check has variations
  if (!file.variations || file.variations.length === 0) {
    errors.push('Variation file has no variations');
  }

  // Check for duplicate IDs
  const ids = new Set<string>();
  for (const v of file.variations || []) {
    if (ids.has(v.variationId)) {
      errors.push(`Duplicate variation ID: ${v.variationId}`);
    }
    ids.add(v.variationId);
  }

  // Check transformation state coverage
  const states = new Set(file.variations.map((v) => v.transformationState));
  if (!states.has('initial')) warnings.push('No "initial" transformation state variations');
  if (!states.has('firstRevisit'))
    warnings.push('No "firstRevisit" transformation state variations');
  if (!states.has('metaAware')) warnings.push('No "metaAware" transformation state variations');

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate L3 variation coverage (all parameter combinations present)
 */
export function validateL3Coverage(variations: Variation[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Expected: 5 journey × 3 philosophy × 3 awareness = 45 for char sections
  // Expected: 5 × 3 × 3 × 3 synthesis = 135 for conv section
  const journeyPatterns = [
    'started-stayed',
    'started-bounced',
    'shifted-dominant',
    'began-lightly',
    'met-later',
  ];
  const philosophies = ['accept', 'resist', 'invest'];
  const awarenessLevels = ['low', 'medium', 'high'];

  // Check all combinations covered
  for (const journey of journeyPatterns) {
    for (const phil of philosophies) {
      for (const awareness of awarenessLevels) {
        const found = variations.find(
          (v) =>
            v.journeyPattern === journey &&
            v.philosophyDominant === phil &&
            v.awarenessLevel === awareness,
        );
        if (!found) {
          warnings.push(`Missing L3 variation: ${journey}-${phil}-${awareness}`);
        }
      }
    }
  }

  // Expected count warning
  const expectedCount = variations[0]?.metadata?.section === 'convergence' ? 135 : 45;
  if (variations.length < expectedCount) {
    warnings.push(`Expected ${expectedCount} L3 variations, found ${variations.length}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

**Integration:**

```typescript
// contentLoader.ts:261
const validationResult = validateStoryData(storyData);
if (!validationResult.valid) {
  console.error('[ContentLoader] Validation errors:', validationResult.errors);
} else if (validationResult.warnings.length > 0) {
  console.warn('[ContentLoader] Validation warnings:', validationResult.warnings);
}
```

**Test cases:**

- [ ] Valid story data → passes validation
- [ ] Missing start node → error reported
- [ ] Invalid connection → error reported
- [ ] Duplicate variation IDs → error reported
- [ ] Missing transformation state → warning reported
- [ ] L3 coverage gaps → warnings listed

---

**Sprint 2 Deliverables:**

- ✅ All `any` usages replaced with `unknown` + type guards
- ✅ VariationMetadata split into core (required) + enrichment (optional)
- ✅ React Flow nodes use generic types (no unsafe casts)
- ✅ Content validation layer validates all 292 files on load

**Dependencies for Sprint 3:** Sprint 1 complete (state integrity)

---

### Sprint 3: Unlock System Enhancements (1 week)

**Goal:** Add missing predicates, improve unlock UX, selective cache invalidation.

**Tickets:**

#### **3.1: Add Cross-Character Connection Predicates**

**Priority:** P2 (Feature gap)
**Files to modify:**

- `src/types/Unlock.ts:10-81` (UnlockConditionParams interface)
- `src/utils/unlockEvaluator.ts:24-46` (add case), 161-198 (evaluateCharacterCondition)

**Type changes:**

```typescript
// Unlock.ts:10 (add to UnlockConditionParams)
interface UnlockConditionParams {
  // ... existing fields

  // Cross-character connection requirements
  minCrossCharacterSwitches?: number; // Total switches across all pairs
  requiredConnectionPairs?: Array<'arch_algo' | 'arch_hum' | 'algo_hum'>; // Specific pairs
  minConnectionPairSwitches?: {
    // Min switches per pair
    arch_algo?: number;
    arch_hum?: number;
    algo_hum?: number;
  };
}
```

**Evaluator changes:**

```typescript
// unlockEvaluator.ts:161 (extend evaluateCharacterCondition)
function evaluateCharacterCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const tracking = progress.journeyTracking;
  if (!tracking) return false;

  // ... existing character checks

  // ✅ NEW: Cross-character connection checks
  if (params.minCrossCharacterSwitches !== undefined) {
    const totalSwitches = Object.values(tracking.crossCharacterConnections).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalSwitches < params.minCrossCharacterSwitches) return false;
  }

  if (params.requiredConnectionPairs) {
    for (const pair of params.requiredConnectionPairs) {
      if ((tracking.crossCharacterConnections[pair] || 0) === 0) {
        return false;
      }
    }
  }

  if (params.minConnectionPairSwitches) {
    for (const [pair, minCount] of Object.entries(params.minConnectionPairSwitches)) {
      const actualCount =
        tracking.crossCharacterConnections[
          pair as keyof typeof tracking.crossCharacterConnections
        ] || 0;
      if (actualCount < minCount) return false;
    }
  }

  return true;
}
```

**Example unlock config:**

```json
{
  "nodeId": "special-convergence-node",
  "unlockConditions": [
    {
      "id": "cross-perspective-exploration",
      "type": "character",
      "params": {
        "minCrossCharacterSwitches": 10,
        "requiredConnectionPairs": ["arch_algo", "arch_hum", "algo_hum"]
      },
      "description": "Experience all three perspective transitions",
      "hint": "Switch between different character viewpoints"
    }
  ]
}
```

**Test cases:**

- [ ] 10 total switches → unlocks
- [ ] All 3 pairs visited → unlocks
- [ ] Missing one pair → remains locked
- [ ] Hint displays correctly in locked node tooltip

---

#### **3.2: Add Navigation Pattern Predicates**

**Priority:** P2 (Feature gap)
**Files to modify:**

- `src/types/Unlock.ts:10-81` (UnlockConditionParams)
- `src/utils/unlockEvaluator.ts` (add new condition type)

**Type changes:**

```typescript
// Unlock.ts:7 (add new condition type)
type UnlockConditionType =
  | 'visitCount'
  | 'awareness'
  | 'philosophy'
  | 'character'
  | 'transformation'
  | 'l3Assembly'
  | 'compound'
  | 'navigationPattern'; // ✅ NEW

// Unlock.ts:10 (add to params)
interface UnlockConditionParams {
  // ... existing fields

  // Navigation pattern requirements
  requiredNavigationPattern?: 'linear' | 'exploratory' | 'recursive';
  minRevisitFrequency?: number; // Percentage (0-100)
  minExplorationBreadth?: number; // Percentage of nodes visited
  minExplorationDepth?: number; // Average visits per node
}
```

**Evaluator:**

```typescript
// unlockEvaluator.ts:24 (add case)
switch (condition.type) {
  // ... existing cases
  case 'navigationPattern':
    return evaluateNavigationPatternCondition(condition.params, progress);
}

// unlockEvaluator.ts (new function)
function evaluateNavigationPatternCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const tracking = progress.journeyTracking;
  if (!tracking) return false;

  // Required navigation pattern
  if (params.requiredNavigationPattern) {
    if (tracking.navigationPattern !== params.requiredNavigationPattern) {
      return false;
    }
  }

  // Minimum revisit frequency
  if (params.minRevisitFrequency !== undefined) {
    if (tracking.revisitFrequency < params.minRevisitFrequency) {
      return false;
    }
  }

  // Minimum exploration breadth
  if (params.minExplorationBreadth !== undefined) {
    if (tracking.explorationMetrics.breadth < params.minExplorationBreadth) {
      return false;
    }
  }

  // Minimum exploration depth
  if (params.minExplorationDepth !== undefined) {
    if (tracking.explorationMetrics.depth < params.minExplorationDepth) {
      return false;
    }
  }

  return true;
}
```

**Example unlock config:**

```json
{
  "nodeId": "recursive-aware-node",
  "unlockConditions": [
    {
      "id": "recursive-reader",
      "type": "navigationPattern",
      "params": {
        "requiredNavigationPattern": "recursive",
        "minRevisitFrequency": 40
      },
      "description": "Unlock for recursive reading patterns",
      "hint": "Revisit previously read nodes to unlock"
    }
  ]
}
```

**Test cases:**

- [ ] Recursive reader (40%+ revisits) → unlocks recursive-only content
- [ ] Exploratory reader (breadth >70%) → unlocks breadth-gated content
- [ ] Linear reader → both remain locked

---

#### **3.3: Selective L3 Cache Invalidation**

**Priority:** P2 (Performance)
**Files to modify:**

- `src/stores/storyStore.ts:930-934` (L3 cache clear logic)

**Current behavior:**

```typescript
// L2 visit → clear entire cache
if (layer === 2) {
  draftState.l3AssemblyCache.clear();
}
```

**Improved behavior:**

```typescript
// storyStore.ts:930-934 (replace)
if (layer === 2) {
  // Get philosophy BEFORE visit updates
  const oldPhilosophy = draftState.progress.journeyTracking.dominantPhilosophy;

  // ... visit recording happens ...

  // Get philosophy AFTER journey tracking updates
  const newPhilosophy = get().progress.journeyTracking.dominantPhilosophy;

  // Only clear cache if philosophy actually changed
  if (oldPhilosophy !== newPhilosophy) {
    draftState.l3AssemblyCache.clear();
    console.log(
      `[L3Assembly] Cache cleared: philosophy changed from ${oldPhilosophy} to ${newPhilosophy}`,
    );
  } else {
    console.log(`[L3Assembly] Cache retained: philosophy unchanged (${oldPhilosophy})`);
  }
}
```

**Alternate approach (if timing is issue):**

```typescript
// Add new action specifically for cache invalidation
clearL3CacheIfNeeded: () => {
  const state = get();
  const tracking = state.progress.journeyTracking;

  // Check if any cached assembly's philosophy no longer matches
  let anythingInvalidated = false;

  for (const [cacheKey, assembly] of state.l3AssemblyCache) {
    // Cache key format: `${journey}_${philosophy}_${awareness}_${synthesis}`
    const [, cachedPhil] = cacheKey.split('_');

    if (cachedPhil !== tracking.dominantPhilosophy) {
      state.l3AssemblyCache.delete(cacheKey);
      anythingInvalidated = true;
    }
  }

  if (anythingInvalidated) {
    console.log('[L3Assembly] Selective cache invalidation completed');
  }
},
```

**Test cases:**

- [ ] Visit L2-accept, then L2-accept again → cache retained
- [ ] Visit L2-accept, then L2-resist → cache cleared (philosophy changed)
- [ ] Visit L2 with 2 accept, 1 resist (dominant = accept) → cache retained
- [ ] Philosophy shifts from accept to resist → cache cleared

---

#### **3.4: Add visitCountRange to Variation Matching**

**Priority:** P3 (Feature gap)
**Files to modify:**

- `src/types/Variation.ts:42-70` (VariationMetadata)
- `src/utils/conditionEvaluator.ts:79-215` (findMatchingVariation)

**Type change:**

```typescript
// Variation.ts:42 (add to VariationMetadataEnrichment)
interface VariationMetadataEnrichment {
  // ... existing fields
  visitCountRange?: [number, number]; // ✅ NEW: [min, max] visit count
}
```

**Matching logic:**

```typescript
// conditionEvaluator.ts:79
export function findMatchingVariation(
  variations: Variation[],
  context: ConditionContext,
  options?: { excludeVariationIds?: string[] },
): Variation | null {
  // ... existing filters

  // ✅ NEW: Filter by visit count range
  const filteredByVisitCount = candidateVariations.filter((variation) => {
    const meta = variation.metadata;
    if (!meta?.visitCountRange) return true; // No range = matches all

    const [min, max] = meta.visitCountRange;
    return context.visitCount >= min && context.visitCount <= max;
  });

  if (filteredByVisitCount.length === 0) {
    console.warn('[VariationSelection] No variations match visit count, using unfiltered pool');
    return selectBestMatch(candidateVariations, context); // Fallback
  }

  return selectBestMatch(filteredByVisitCount, context);
}
```

**Example variation:**

```json
{
  "variationId": "arch-L1-003",
  "transformationState": "initial",
  "content": "This content only shows on visit 3 or higher...",
  "metadata": {
    "visitCountRange": [3, 999],
    "awarenessLevel": "high"
  }
}
```

**Test cases:**

- [ ] Visit 1: variations with range [1,2] match
- [ ] Visit 3: variations with range [3,999] match
- [ ] Visit 10: both [1,2] and [3,999] variations available → deduplication chooses unseen
- [ ] No variations match visit count → fallback to awareness/journey/philosophy filtering

---

**Sprint 3 Deliverables:**

- ✅ Cross-character connection predicates (minSwitches, requiredPairs)
- ✅ Navigation pattern predicates (linear/exploratory/recursive)
- ✅ Selective L3 cache invalidation (only on philosophy change)
- ✅ Visit count range filtering in variation matching

**Dependencies for Sprint 4:** Sprint 2 complete (type safety)

---

### Sprint 4: Service Layer & Architecture (2-3 weeks, optional)

**Goal:** Decouple components, extract services, enable testing.

**Note:** This sprint is **optional** and can be deferred if time-constrained. The engine is functional after Sprint 3.

**Tickets:**

#### **4.1: Extract ContentService**

**Priority:** P3 (Architecture improvement)
**Files to create:**

- `src/services/ContentService.ts` (new file)

**Service interface:**

```typescript
// ContentService.ts
import type { StoryData, VariationFile } from '@/types';

export interface IContentProvider {
  loadStory(storyId: string): Promise<StoryData>;
  loadVariations(storyId: string, nodeId: string): VariationFile | null;
  loadL3Variations(storyId: string): {
    arch: VariationFile | null;
    algo: VariationFile | null;
    hum: VariationFile | null;
    conv: VariationFile | null;
  };
}

export class ContentService implements IContentProvider {
  private variationCache = new Map<string, VariationFile>();

  async loadStory(storyId: string): Promise<StoryData> {
    // Move logic from contentLoader.ts
  }

  loadVariations(storyId: string, nodeId: string): VariationFile | null {
    // Move logic from variationLoader.ts
    const cacheKey = `${storyId}:${nodeId}`;
    if (this.variationCache.has(cacheKey)) {
      return this.variationCache.get(cacheKey)!;
    }
    // ... load and cache
  }

  loadL3Variations(storyId: string) {
    // Move L3-specific loading
  }
}
```

**Integration:**

```typescript
// storyStore.ts
const contentService = new ContentService();

loadStory: async (storyId: string) => {
  const storyData = await contentService.loadStory(storyId);
  // ... rest of logic
};
```

---

#### **4.2: Extract VariationSelectionService**

**Priority:** P3 (Architecture improvement)
**Files to create:**

- `src/services/VariationSelectionService.ts`

**Service:**

```typescript
export class VariationSelectionService {
  selectVariation(
    variations: Variation[],
    context: ConditionContext,
    options?: { excludeVariationIds?: string[] },
  ): Variation | null {
    // Move findMatchingVariation logic
  }

  buildL3Assembly(
    storyId: string,
    context: ConditionContext,
    contentService: IContentProvider,
  ): L3Assembly | null {
    // Move buildL3Assembly logic
  }

  calculateSynthesisPattern(percentages: CharacterPercentages): SynthesisPattern {
    // Move from l3Assembly.ts
  }
}
```

---

#### **4.3: Extract JourneyTrackingService**

**Priority:** P3
**Files to create:**

- `src/services/JourneyTrackingService.ts`

**Service:**

```typescript
export class JourneyTrackingService {
  calculateJourneyPattern(
    startingCharacter: Character,
    percentages: CharacterPercentages,
  ): JourneyPattern {
    // Move from conditionEvaluator.ts
  }

  calculatePathPhilosophy(l2Choices: L2Choices): PathPhilosophy {
    // Move from conditionEvaluator.ts
  }

  updateJourneyTracking(tracking: JourneyTracking, progress: UserProgress): JourneyTracking {
    // Move from storyStore.ts:493-555
  }
}
```

---

#### **4.4: Abstract Cache Interface**

**Priority:** P3
**Files to create:**

- `src/utils/cache.ts`

**Interface:**

```typescript
export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  clear(): void;
  delete(key: K): boolean;
  invalidate(predicate: (key: K, value: V) => boolean): number;
}

export class InMemoryCache<K, V> implements ICache<K, V> {
  private map = new Map<K, V>();

  get(key: K) {
    return this.map.get(key);
  }
  set(key: K, value: V) {
    this.map.set(key, value);
  }
  clear() {
    this.map.clear();
  }
  delete(key: K) {
    return this.map.delete(key);
  }

  invalidate(predicate: (k: K, v: V) => boolean): number {
    let count = 0;
    for (const [k, v] of this.map) {
      if (predicate(k, v)) {
        this.map.delete(k);
        count++;
      }
    }
    return count;
  }
}
```

---

**Sprint 4 Deliverables:**

- ✅ ContentService extracts loading logic
- ✅ VariationSelectionService extracts matching logic
- ✅ JourneyTrackingService extracts calculations
- ✅ ICache interface for pluggable caching strategies

**Total Effort:** Sprints 1-3 = ~5-6 weeks, Sprint 4 (optional) = +2-3 weeks

---

## 3. Quick Wins (≤1 hour each)

### Quick Win 1: Add Console Logging for Visit Recording

**Effort:** 15 minutes
**Impact:** Immediate debugging visibility
**Files:** `src/stores/storyStore.ts:846-1004`

**Changes:**

```typescript
// storyStore.ts:846
visitNode: (nodeId: string) => {
  console.group(`[Visit] ${nodeId}`);

  // ... existing logic

  console.log('Visit count:', existingRecord ? existingRecord.visitCount : 1);
  console.log('Character visits:', state.progress.characterNodesVisited);
  console.log('Temporal awareness:', state.progress.temporalAwarenessLevel);
  console.log('Journey pattern:', state.progress.journeyTracking?.currentJourneyPattern);
  console.log('Philosophy:', state.progress.journeyTracking?.dominantPhilosophy);

  console.groupEnd();
};
```

**Value:** See real-time state updates during development.

---

### Quick Win 2: Add Variation Selection Logging

**Effort:** 20 minutes
**Impact:** Debug variation matching
**Files:** `src/utils/conditionEvaluator.ts:79-215`

**Changes:**

```typescript
// conditionEvaluator.ts:79
export function findMatchingVariation(...) {
  console.group(`[VariationSelection] Matching for node ${context.nodeId}`);
  console.log('Context:', {
    transformationState: context.transformationState,
    awareness: context.awareness,
    journeyPattern: context.journeyPattern,
    pathPhilosophy: context.pathPhilosophy,
    visitCount: context.visitCount,
  });
  console.log('Total variations:', variations.length);
  console.log('After transformation filter:', filteredByState.length);
  console.log('After awareness filter:', filteredByAwareness.length);
  console.log('After journey filter:', filteredByJourney.length);
  console.log('After philosophy filter:', filteredByPhilosophy.length);
  console.log('Selected:', selected?.variationId);
  console.groupEnd();

  return selected;
}
```

**Value:** See why specific variations were selected/rejected.

---

### Quick Win 3: Add Unlock Progress to Node Tooltip

**Effort:** 30 minutes
**Impact:** Better unlock UX
**Files:** `src/components/NodeMap/NodeTooltip.tsx`

**Enhancement:** Display unlock progress bar and next condition hint in tooltip (already implemented in `CustomStoryNode.tsx:671-744`, verify it's working).

**Test:** Hover over locked node → see progress % and hint.

---

### Quick Win 4: Add Type Validation to Story Loading

**Effort:** 45 minutes
**Impact:** Early error detection
**Files:** `src/utils/contentLoader.ts:261`

**Changes:**

```typescript
// contentLoader.ts:261 (already has soft validation, make it strict)
try {
  validateStoryData(storyData); // ✅ Change: throw on errors
} catch (err) {
  throw new ContentLoadError(
    `Story validation failed for ${storyId}: ${(err as Error).message}`,
    err as Error,
  );
}
```

**Value:** Fail fast on malformed content files instead of runtime errors.

---

### Quick Win 5: Add Performance Timing to visitNode

**Effort:** 30 minutes
**Impact:** Identify slow operations
**Files:** `src/stores/storyStore.ts:836`

**Changes:**

```typescript
// storyStore.ts:836
visitNode: (nodeId: string) => {
  const startTime = performance.now();

  // ... existing 19-step logic

  const endTime = performance.now();
  console.log(`[Visit] ${nodeId} completed in ${(endTime - startTime).toFixed(2)}ms`);

  get().saveProgress();
};
```

**Value:** Measure if visit recording causes performance issues.

---

### Quick Win 6: Add Variation Coverage Report

**Effort:** 45 minutes
**Impact:** Content quality assurance
**Files:** Create `scripts/analyze-variations.ts`

**Script:**

```typescript
// scripts/analyze-variations.ts (new file)
import { loadL3Variations } from '../src/utils/variationLoader';

const storyId = 'eternal-return';
const variations = loadL3Variations(storyId);

console.log('=== L3 Variation Coverage ===');
console.log('Arch:', variations.arch?.variations.length || 0, '/ 45 expected');
console.log('Algo:', variations.algo?.variations.length || 0, '/ 45 expected');
console.log('Hum:', variations.hum?.variations.length || 0, '/ 45 expected');
console.log('Conv:', variations.conv?.variations.length || 0, '/ 135 expected');

// Check for gaps in parameter space
const journeys = new Set(variations.arch?.variations.map((v) => v.journeyPattern));
const philosophies = new Set(variations.arch?.variations.map((v) => v.philosophyDominant));
const awarenessLevels = new Set(variations.arch?.variations.map((v) => v.awarenessLevel));

console.log('\nParameter coverage:');
console.log('Journey patterns:', Array.from(journeys).sort());
console.log('Philosophies:', Array.from(philosophies).sort());
console.log('Awareness levels:', Array.from(awarenessLevels).sort());
```

**Run:** `npm run analyze-variations`

**Value:** Ensure all parameter combinations have content.

---

### Quick Win 7: Add ESC Key Handler Test

**Effort:** 15 minutes
**Impact:** Verify visit recording timing
**Files:** Manual test

**Test steps:**

1. Click node
2. Immediately press ESC (within 10ms)
3. Check `progress.visitedNodes` in Redux DevTools
4. Expected: Visit **should** be recorded (after Sprint 1.1-B fix)
5. Currently: Visit may **not** be recorded (useEffect cancelled)

**Value:** Confirms Sprint 1.1-B fix resolves the timing issue.

---

### Quick Win 8: Add Git Pre-commit Hook for Type Check

**Effort:** 20 minutes
**Impact:** Prevent type errors in commits
**Files:** `.husky/pre-commit` or `package.json`

**Setup:**

```bash
# Install husky
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run type-check"
```

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

**Value:** Catch type errors before they reach main branch.

---

**Total Quick Wins:** 8 items, ~4-5 hours total, immediate value.

---

## 4. Testing Strategy

### Unit Tests (Add during Sprints)

**Sprint 1 Tests:**

- [ ] `visitNode()` records visit before view opens
- [ ] `visitNode()` updates awareness correctly
- [ ] Journey pattern calculation (all 5 patterns)
- [ ] Philosophy calculation (dominant/mixed logic)
- [ ] Transformation state thresholds (20%, 50%)
- [ ] Variation deduplication (excludes previously shown)

**Sprint 2 Tests:**

- [ ] `normalizeVariation()` with valid input → success
- [ ] `normalizeVariation()` with missing fields → throws
- [ ] `validateVariationMetadata()` core fields required
- [ ] `validateStoryData()` catches invalid connections
- [ ] React Flow node types preserve data integrity

**Sprint 3 Tests:**

- [ ] Cross-character unlock: 10 switches → unlocks
- [ ] Navigation pattern unlock: recursive → unlocks recursive content
- [ ] L3 cache selective invalidation: same phil → cache retained
- [ ] Visit count range: visit 3 → range [3,999] matches

**Sprint 4 Tests:**

- [ ] ContentService mock → isolates store tests
- [ ] VariationSelectionService deterministic output
- [ ] JourneyTrackingService pure functions
- [ ] ICache interface → swap implementations

---

### Integration Tests

**Critical Paths:**

1. **Visit Flow:** Click node → visitNode → awareness update → unlock evaluation → save
2. **Variation Selection:** Load variations → filter by context → dedup → select → display
3. **L3 Assembly:** Trigger → cache check → build 4 sections → cache → display
4. **Unlock Trigger:** Visit reaches threshold → evaluateUnlocks → notification → node visible

**Test Scenarios:**

- [ ] New reader journey: L1 → L2 → L3 → L4 (complete path)
- [ ] Recursive reader: Visit same L1 node 5 times → see all 3 transformation states
- [ ] Cross-character exploration: Visit all 3 chars → awareness >50% → metaAware unlocks
- [ ] Philosophy shift: 2 accept, 3 resist → dominant philosophy changes → L3 cache clears

---

### Regression Tests

**After Each Sprint:**

- [ ] All 292 content files load without errors
- [ ] No TypeScript compilation errors
- [ ] No console errors during normal gameplay
- [ ] Save/load preserves all progress
- [ ] Unlock conditions still evaluate correctly
- [ ] L3 assembly still builds 4 sections

---

## 5. Risk Assessment

| Risk                                                  | Probability | Impact | Mitigation                                          |
| ----------------------------------------------------- | ----------- | ------ | --------------------------------------------------- |
| **Sprint 1.1 (L3 visit recording) reveals major gap** | Medium      | High   | Allocate 2-day buffer for rework                    |
| **Variation deduplication exhausts pool**             | Low         | Medium | Fallback to first variation + log warning           |
| **Migration breaks old saves**                        | Low         | High   | Test with multiple save versions, add rollback      |
| **Type changes cause widespread breakage**            | Low         | Medium | Make changes in feature branches, incremental merge |
| **Service layer refactor (Sprint 4) takes longer**    | High        | Low    | Sprint 4 is optional, defer if needed               |
| **L3 cache invalidation misses edge case**            | Medium      | Low    | Extensive logging, monitor in production            |

---

## 6. Success Metrics

**Sprint 1 Complete:**

- ✅ 0 visit recording timing issues (ESC key test passes)
- ✅ L3 visits increase awareness as expected
- ✅ Variation deduplication working (no repeated variations on revisit)
- ✅ 0 `progress.journeyTracking` null checks remaining

**Sprint 2 Complete:**

- ✅ 0 `any` usages in critical path (variationLoader, contentLoader)
- ✅ All 292 content files pass validation
- ✅ TypeScript strict mode enabled (no type errors)
- ✅ Variation metadata 100% core fields populated

**Sprint 3 Complete:**

- ✅ 3 new unlock predicates available (cross-char, nav pattern, visit count range)
- ✅ L3 cache invalidation only on philosophy change (measured via logs)
- ✅ Unlock tooltips display progress + hints
- ✅ Navigation pattern classification working (linear/exploratory/recursive)

**Sprint 4 Complete (Optional):**

- ✅ 3 service classes extracted (Content, VariationSelection, JourneyTracking)
- ✅ Store file reduced from 1428 lines to <800 lines
- ✅ Unit test coverage >80% for services
- ✅ ICache interface with 2 implementations (InMemory, LRU)

---

## 7. Deployment Plan

### Pre-Deployment Checklist

- [ ] All Sprint 1-3 tests passing
- [ ] No TypeScript errors
- [ ] No console errors during gameplay
- [ ] Save migration tested with old saves
- [ ] Performance benchmarks acceptable (<50ms visitNode)
- [ ] 292 content files validated
- [ ] Unlock configs tested for all nodes
- [ ] L3 assembly coverage verified (45 × 3 + 135)

### Rollout Strategy

1. **Week 1:** Deploy Sprint 1 (state integrity) to staging
2. **Week 2:** Deploy Sprint 2 (type safety) to staging
3. **Week 3:** Deploy Sprint 3 (unlock enhancements) to staging
4. **Week 4:** Full regression testing on staging
5. **Week 5:** Production deployment with rollback plan
6. **(Optional) Week 6-8:** Sprint 4 (service layer) to staging

### Rollback Plan

- Keep feature flags for new unlock predicates (disable if issues)
- Preserve old variation selection logic in comments (revert if needed)
- Save migration includes version detection (skip if unsupported)

---

## Appendix A: File Modification Summary

### Sprint 1

- **Create:** None
- **Modify:**
  - `src/types/Store.ts` (add variationId, previousNodeId to VisitRecord)
  - `src/stores/storyStore.ts` (move visitNode call, add recordVariationShown, make journeyTracking required)
  - `src/components/StoryView/StoryView.tsx` (remove useEffect visit trigger)
  - `src/utils/conditionEvaluator.ts` (add excludeVariationIds param)
  - `src/hooks/useVariationSelection.ts` (call recordVariationShown, pass exclusion)
  - `src/components/UI/L3AssemblyView.tsx` (verify visitNode call)

### Sprint 2

- **Create:**
  - `src/utils/contentValidator.ts` (validation functions)
- **Modify:**
  - `src/utils/variationLoader.ts` (replace `any` with `unknown`)
  - `src/types/Variation.ts` (split VariationMetadata)
  - `src/components/NodeMap/NodeMap.tsx` (use React Flow generics)
  - `src/components/NodeMap/CustomStoryNode.tsx` (remove type casts)
  - `src/utils/contentLoader.ts` (integrate validation)

### Sprint 3

- **Create:** None
- **Modify:**
  - `src/types/Unlock.ts` (add cross-char, nav pattern params)
  - `src/utils/unlockEvaluator.ts` (add evaluators for new types)
  - `src/stores/storyStore.ts` (selective L3 cache invalidation)
  - `src/utils/conditionEvaluator.ts` (add visitCountRange filtering)
  - `src/types/Variation.ts` (add visitCountRange to metadata)

### Sprint 4 (Optional)

- **Create:**
  - `src/services/ContentService.ts`
  - `src/services/VariationSelectionService.ts`
  - `src/services/JourneyTrackingService.ts`
  - `src/utils/cache.ts`
- **Modify:**
  - `src/stores/storyStore.ts` (inject services)
  - `src/hooks/useVariationSelection.ts` (use service)

**Total Files Modified:** 15 core files, 4 new files (Sprint 4 optional)

---

## Appendix B: Data Structure Changes

### VisitRecord (Sprint 1)

```typescript
// BEFORE
interface VisitRecord {
  visitCount: number;
  visitTimestamps: string[];
  currentState: TransformationState;
  timeSpent: number;
  lastVisited: string;
}

// AFTER
interface VisitRecord {
  visitCount: number;
  visitTimestamps: string[];
  currentState: TransformationState;
  timeSpent: number;
  lastVisited: string;
  variationId?: string; // ✅ NEW
  previousNodeId?: string; // ✅ NEW
}
```

### UserProgress (Sprint 1)

```typescript
// BEFORE
journeyTracking?: JourneyTracking;  // Optional

// AFTER
journeyTracking: JourneyTracking;   // ✅ Required
```

### VariationMetadata (Sprint 2)

```typescript
// BEFORE
interface VariationMetadata {
  wordCount?: number; // All optional
  variationId?: string;
  nodeId?: string;
  // ... 20+ optional fields
}

// AFTER
interface VariationMetadataCore {
  variationId: string; // ✅ Required
  nodeId: string; // ✅ Required
  wordCount: number; // ✅ Required
  layer: number; // ✅ Required
  createdDate: string; // ✅ Required
}

interface VariationMetadataEnrichment {
  journeyPattern?: JourneyPattern; // Optional
  philosophyDominant?: PathPhilosophy; // Optional
  awarenessLevel?: AwarenessLevel; // Optional
  visitCountRange?: [number, number]; // ✅ NEW (Sprint 3)
  // ... other optional fields
}

type VariationMetadata = VariationMetadataCore & VariationMetadataEnrichment;
```

### UnlockConditionParams (Sprint 3)

```typescript
// ADD to existing interface
interface UnlockConditionParams {
  // ... existing fields

  // Cross-character (Sprint 3.1)
  minCrossCharacterSwitches?: number;
  requiredConnectionPairs?: Array<'arch_algo' | 'arch_hum' | 'algo_hum'>;
  minConnectionPairSwitches?: {
    arch_algo?: number;
    arch_hum?: number;
    algo_hum?: number;
  };

  // Navigation pattern (Sprint 3.2)
  requiredNavigationPattern?: 'linear' | 'exploratory' | 'recursive';
  minRevisitFrequency?: number;
  minExplorationBreadth?: number;
  minExplorationDepth?: number;
}
```

---

**End of Plan**

**Next Steps:**

1. Review plan with team
2. Prioritize Sprint 1-3 (critical) vs Sprint 4 (optional)
3. Create tickets in project management system
4. Assign developers to sprints
5. Begin Sprint 1 implementation

**Estimated Total Effort:**

- Sprint 1: 1-2 weeks (17 hours + testing)
- Sprint 2: 1 week (15 hours + testing)
- Sprint 3: 1 week (30 hours + testing)
- Sprint 4 (Optional): 2-3 weeks (refactoring + testing)

**Critical Path:** Sprints 1-3 = ~5-6 weeks to production-ready narrative engine.
