# Navigation Flow & Type Rigor Analysis

**Generated:** 2025-11-12
**Scope:** Read-only analysis of navigation sequence, visit recording, unlock triggers, and type safety (Task 4)
**Files Analyzed:** `NodeMap.tsx`, `CustomStoryNode.tsx`, `StoryView.tsx`, `storyStore.ts`, type definitions

---

## 1. Navigation Sequence — Map → Node → View → Map

### A. User Click Flow (Complete Trace)

```
┌────────────────────────────────────────────────────────────────────┐
│  USER: Clicks node on map                                          │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  NodeMap.tsx:176-203 — onNodeClick()                               │
│    ├─► Get nodeData from node.data                                │
│    ├─► Get visitRecord from progress.visitedNodes[nodeId]         │
│    ├─► Trigger screen shake animation (setState)                   │
│    ├─► Trigger glitch effect if visited (setState)                │
│    ├─► selectNode(nodeId)  [storyStore.ts:1012-1016]              │
│    │    └─► Sets state.selectedNode = nodeId                      │
│    └─► openStoryView(nodeId)  [storyStore.ts:1024-1051]           │
│         ├─► Check if L3 node (isL3Node) → route to L3 assembly   │
│         ├─► Check if L4 node (isL4Node) → log (future handling)  │
│         └─► Set state.storyViewOpen = true                        │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  StoryView.tsx:207-544 — Component renders                        │
│    ├─► Memoized: currentNode = nodes.get(selectedNode)            │
│    ├─► Memoized: nodeState = getNodeState(selectedNode)           │
│    ├─► Memoized: fallbackContent = node.content[state]            │
│    └─► useVariationSelection(nodeId, fallback)                    │
│         └─► Returns: { content, variationId, metadata, error }    │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  StoryView.tsx:299-303 — Auto-visit effect (useEffect)            │
│    └─► if (storyViewOpen && selectedNode):                        │
│         └─► handleVisit()  [line 292-296]                         │
│              └─► visitNode(selectedNode)  [CRITICAL: Visit Recording]│
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  storyStore.ts:836-1004 — visitNode(nodeId)  [DETAILED BELOW]     │
│    └─► [See Section 2 for full breakdown]                         │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  StoryView.tsx — Content display                                   │
│    ├─► Header: character theme, title, visit count, time          │
│    ├─► Content: parseMarkdown(currentContent)                     │
│    ├─► Footer: navigation controls, reading timer                 │
│    └─► Keyboard listener: ESC to close                            │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                   USER: Clicks "Back to Map" or ESC
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  StoryView.tsx:281-284, 513-525 — closeStoryView()                │
│    └─► storyStore.closeStoryView()  [storyStore.ts:1053-1055]    │
│         └─► Set state.storyViewOpen = false                       │
└───────────────────────────┬────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│  NodeMap.tsx — Back on map (StoryView unmounts)                   │
│    └─► Updated state visible (visit count badge, glow effects)    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Visit Metadata Recording — Detailed Sequence

### visitNode() Execution Timeline (storyStore.ts:836-1004)

**File:** `src/stores/storyStore.ts:836-1004`

| Step                          | Lines   | Action                                        | State Updates                                                                                                                                            |
| ----------------------------- | ------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Validation**             | 838-843 | Check node exists in state.nodes              | Return early if invalid                                                                                                                                  |
| **2. Visit Record**           | 846-865 | Update or create VisitRecord                  | `visitedNodes[nodeId]`:<br>- `visitCount++`<br>- `visitTimestamps.push(now)`<br>- `lastVisited = now`<br>- `currentState = 'initial'` (first visit only) |
| **3. Character Tracking**     | 867-875 | Increment character-specific counter          | `characterNodesVisited.{arch/algo/lastHuman}++`                                                                                                          |
| **4. Journey Tracking Init**  | 878-880 | Create journeyTracking if missing             | `journeyTracking = createInitialJourneyTracking()`                                                                                                       |
| **5. Cross-Character**        | 883-897 | Detect character switch, increment connection | `crossCharacterConnections.{arch_algo/arch_hum/algo_hum}++`<br>`lastCharacterVisited = currentChar`                                                      |
| **6. Revisit Frequency**      | 899-907 | Calculate % of nodes revisited                | `revisitFrequency = (revisits / totalVisits) * 100`                                                                                                      |
| **7. Exploration Metrics**    | 909-918 | Calculate breadth & depth                     | `breadth = (unique / total) * 100`<br>`depth = totalVisits / unique`                                                                                     |
| **8. Navigation Pattern**     | 920-921 | Classify linear/exploratory/recursive         | `navigationPattern = classifyNavigationPattern()`                                                                                                        |
| **9. L2 Unlock**              | 923-935 | Unlock L2 character on L1 visit               | `unlockedL2Characters.push(character)`<br>Clear L3 cache if L2 visit                                                                                     |
| **10. Philosophy Tracking**   | 937-944 | Record L2 choice (accept/resist/invest)       | `l2Choices.{accept/resist/invest}++`                                                                                                                     |
| **11. Reading Path**          | 946     | Append to ordered visit list                  | `readingPath.push(nodeId)`                                                                                                                               |
| **12. Timestamp**             | 947     | Update last active                            | `lastActiveTimestamp = now`                                                                                                                              |
| **13. Temporal Awareness**    | 951     | Recalculate 0-100 awareness                   | `updateTemporalAwareness()` → `temporalAwarenessLevel`                                                                                                   |
| **14. Journey Recalc**        | 952     | Recalculate pattern & philosophy              | `updateJourneyTracking()` → `currentJourneyPattern`, `dominantPhilosophy`                                                                                |
| **15. Transformation States** | 954-967 | Re-determine states for ALL visited nodes     | For each visitedNode:<br>`currentState = determineTransformationState()`                                                                                 |
| **16. Special Transforms**    | 969-981 | Check for unique unlock events                | `specialTransformations.push(...newTransforms)`                                                                                                          |
| **17. Connection Reveals**    | 983-998 | Unlock new connections                        | `unlockedConnections.push(...newConnIds)`                                                                                                                |
| **18. Unlock Evaluation**     | 1001    | **CRITICAL:** Check all unlock conditions     | `evaluateUnlocks()` → `recentlyUnlockedNodes[]`                                                                                                          |
| **19. Persistence**           | 1003    | Save to localStorage                          | `saveProgress()`                                                                                                                                         |

**Total Execution:** ~19 distinct state update steps per visit

---

### B. Critical Timing Notes

**1. Visit Recorded BEFORE Content Displayed**

- `visitNode()` called in `useEffect` (StoryView.tsx:299-303)
- Effect runs **after** initial render
- First render shows loading state → visit records → re-render with updated state

**2. Unlock Trigger Placement**

```
visitNode() sequence:
  ├─► Update visit metadata (steps 1-12)
  ├─► Recalculate awareness & journey (steps 13-14)
  ├─► Update transformation states (step 15)
  ├─► Check special transformations (step 16)
  ├─► Reveal connections (step 17)
  └─► evaluateUnlocks()  ← HAPPENS HERE (step 18)
       └─► After ALL state updates complete
```

**Rationale:** Unlock conditions depend on updated awareness, journey pattern, visit counts, etc.

**3. Awareness Propagation**

```
Visit recorded (step 2)
  └─► Character count incremented (step 3)
       └─► updateTemporalAwareness() called (step 13)
            └─► diversityBonus = (unique chars visited) × 20
            └─► explorationScore = min((totalVisits / 10) × 40, 40)
            └─► temporalAwarenessLevel = min(diversityBonus + explorationScore, 100)
                 └─► Transformation state re-determined (step 15)
                      └─► Thresholds:
                           - 20% → Enables 'firstRevisit' state
                           - 50% → Enables 'metaAware' state
```

**File:** `src/stores/storyStore.ts:462-490, 836-1004`

**4. Transformation State Cascading**

- Step 15 re-determines states for **ALL** visited nodes, not just current
- If awareness crosses 20% threshold → all visited nodes can shift to `firstRevisit`
- If awareness crosses 50% threshold → all visited nodes can shift to `metaAware`
- **Retroactive transformation:** Previous nodes update when you visit new nodes

---

## 3. Sequencing Table — Events → State Updates

| Event                  | Trigger Location       | Immediate State Changes                                                       | Derived State Changes                                                                        | Async/Delayed Effects                                   |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **User clicks node**   | NodeMap.tsx:176        | `selectedNode = nodeId`<br>`storyViewOpen = true`                             | —                                                                                            | Screen shake animation (300ms)<br>Glitch effect (800ms) |
| **StoryView opens**    | StoryView.tsx:299      | —                                                                             | —                                                                                            | Auto-call `visitNode()` in useEffect                    |
| **Visit recorded**     | storyStore.ts:846      | `visitCount++`<br>`visitTimestamps.push()`<br>`readingPath.push()`            | —                                                                                            | —                                                       |
| **Character tracked**  | storyStore.ts:868      | `characterNodesVisited.{char}++`                                              | —                                                                                            | —                                                       |
| **Cross-char switch**  | storyStore.ts:891      | `crossCharacterConnections.{key}++`<br>`lastCharacterVisited = char`          | —                                                                                            | —                                                       |
| **Metrics calc**       | storyStore.ts:906, 916 | `revisitFrequency = %`<br>`explorationMetrics = {breadth, depth}`             | —                                                                                            | —                                                       |
| **L2 unlock**          | storyStore.ts:928      | `unlockedL2Characters.push()`                                                 | L3 cache cleared if L2 visit                                                                 | —                                                       |
| **Philosophy tracked** | storyStore.ts:942      | `l2Choices.{accept/resist/invest}++`                                          | —                                                                                            | —                                                       |
| **Awareness update**   | storyStore.ts:951      | `temporalAwarenessLevel = 0-100`                                              | Journey pattern recalc → `currentJourneyPattern`<br>Philosophy recalc → `dominantPhilosophy` | —                                                       |
| **Transform states**   | storyStore.ts:960      | For **all** visited nodes:<br>`currentState = determineTransformationState()` | —                                                                                            | Affects variation selection on next render              |
| **Unlock evaluation**  | storyStore.ts:1001     | `recentlyUnlockedNodes.push()` for newly unlocked                             | —                                                                                            | Unlock notifications displayed                          |
| **Progress saved**     | storyStore.ts:1003     | —                                                                             | —                                                                                            | localStorage write (async)                              |
| **User closes view**   | StoryView.tsx:281      | `storyViewOpen = false`                                                       | `selectedNode` remains set                                                                   | Reading time reset (useEffect cleanup)                  |

---

## 4. Type Safety Audit — Strictness Hotspots

### A. `any` Usage (11 total occurrences)

| File                    | Line            | Context                                                    | Severity      | Recommendation                                   |
| ----------------------- | --------------- | ---------------------------------------------------------- | ------------- | ------------------------------------------------ |
| `variationLoader.ts`    | 58              | `function normalizeVariation(variation: any, ...)`         | 🔴 **High**   | Replace with `unknown` + type guards             |
| `variationLoader.ts`    | 163             | `.map((v: any) => normalizeVariation(...))`                | 🔴 **High**   | Use `VariationFile['variations'][number]`        |
| `variationLoader.ts`    | 198             | `variations: fileData.variations?.map((v: any) => ...)`    | 🔴 **High**   | Same as above                                    |
| `contentLoader.ts`      | 106             | `const isDef = (d: any): d is CharacterNodeDefinitionFile` | 🟡 **Medium** | Acceptable for type guard, but can use `unknown` |
| `contentLoader.ts`      | 110-114         | Debug logging: `(charData as any).nodes` (5 occurrences)   | 🟢 **Low**    | Cosmetic, already type-guarded above             |
| `contentLoader.ts`      | 222             | `character: normalizeCharacter((n as any).character)`      | 🟡 **Medium** | Use proper union type                            |
| `contentLoader.ts`      | 223             | `position: (n as any).position \|\| getNodePosition()`     | 🟡 **Medium** | Add `position?` to type                          |
| `errorHandler.ts`       | 9, 19           | `context?: Record<string, any>` (2 occurrences)            | 🟢 **Low**    | Generic error context, acceptable                |
| `performanceMonitor.ts` | 16, 26, 29, 134 | `metadata?: Record<string, any>` (4 occurrences)           | 🟢 **Low**    | Generic perf metadata, acceptable                |

**Critical Path Files:**

- ✅ `storyStore.ts` — **0 `any` usages** (clean!)
- ✅ `useVariationSelection.ts` — **0 `any` usages**
- ⚠️ `variationLoader.ts` — **3 `any` usages** (high priority fix)
- ⚠️ `contentLoader.ts` — **7 `any` usages** (debug logs mostly acceptable)

---

### B. Type Assertions (`as unknown`, `as any`)

| File                      | Line    | Code                                                                 | Issue                                                                 |
| ------------------------- | ------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Navigation Components** |         |                                                                      |                                                                       |
| `CustomStoryNode.tsx`     | 158     | `const { node, nodeState } = data as unknown as CustomStoryNodeData` | 🔴 React Flow `data` typed as `Record<string, unknown>` — unavoidable |
| `NodeMap.tsx`             | 68      | `data: { ... } as Record<string, unknown>`                           | 🟡 Explicit type erasure for React Flow                               |
| `NodeMap.tsx`             | 207     | `const nodeData = node.data as unknown as CustomStoryNodeData`       | 🔴 Same as line 158                                                   |
| **Content Loading**       |         |                                                                      |                                                                       |
| `contentLoader.ts`        | 106     | `(d as any): d is CharacterNodeDefinitionFile`                       | 🟢 Type guard parameter — standard pattern                            |
| `contentLoader.ts`        | 110-114 | `(charData as any).nodes` (debug logs)                               | 🟢 Already type-guarded                                               |
| `contentLoader.ts`        | 222-223 | `(n as any).character`, `(n as any).position`                        | 🟡 Should add to interface                                            |

**Root Cause:** React Flow's generic `Node` type uses `data: Record<string, unknown>`, forcing type assertions in node components.

---

### C. `unknown` Usage in Type Definitions

| File           | Line   | Type                                      | Usage                                                  | Valid?                                   |
| -------------- | ------ | ----------------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `Story.ts`     | 69     | `migrate: (oldState: unknown) => unknown` | Migration function signature                           | ✅ Correct — old state structure unknown |
| `Variation.ts` | 14, 24 | `'unknown'` (literal)                     | Default value for `JourneyPattern` \| `PathPhilosophy` | ✅ Correct — sentinel value              |

**Assessment:** Both uses are **intentional and correct**.

---

### D. Missing Type Definitions

**1. VisitRecord — Missing Fields (Task 1 finding)**

```typescript
// Current (Store.ts:16-22)
interface VisitRecord {
  visitCount: number;
  visitTimestamps: string[];
  currentState: TransformationState;
  timeSpent: number;
  lastVisited: string;
}

// Missing:
// - variationId?: string;       // Which variation was shown (Task 1, 2 gap)
// - previousNodeId?: string;    // Previous node in path (Task 1 gap)
```

**Impact:** Cannot track variation history or reliable previous-node linkage.

---

**2. React Flow Node Data Type Mismatch**

```typescript
// React Flow expects:
interface Node<T = any> {
  id: string;
  data: T;
  // ...
}

// We use:
interface Node {
  // ...
  data: Record<string, unknown>; // NodeMap.tsx:68
}

// Then cast back:
const { node } = data as unknown as CustomStoryNodeData; // Line 158
```

**Issue:** Type-safe input → type erasure → unsafe cast back.

**Better approach:**

```typescript
// Option 1: Use React Flow's generic
type StoryFlowNode = Node<CustomStoryNodeData>;

// Option 2: Extend with proper typing
const nodeTypes = {
  storyNode: CustomStoryNode as React.ComponentType<NodeProps<CustomStoryNodeData>>,
};
```

---

**3. StoryNode Content Field — Transformation States**

```typescript
// Current (Node.ts:35-39)
content: {
  initial: string;
  firstRevisit: string;
  metaAware: string;
}
```

**Issue:** No type enforcing **all three states must be present**.

**Better:**

```typescript
type TransformationContent = Record<TransformationState, string>;

// Or stricter:
interface TransformationContent {
  initial: string;
  firstRevisit: string;
  metaAware: string;
}
```

**Current implementation allows:**

```typescript
content: { initial: "...", firstRevisit: "", metaAware: "" }  // Empty strings acceptable
```

**Risk:** Runtime errors if variation loader fails to populate all states.

---

### E. Strict Type Issues — Optional vs. Required

**1. Optional Journey Tracking (Task 1 finding)**

```typescript
// Store.ts:74
journeyTracking?: JourneyTracking;  // Optional
```

**Problem:** Requires defensive checks in 20+ locations:

```typescript
// storyStore.ts:122, 514, 562, 578, 878, etc.
if (!state.progress.journeyTracking) {
  state.progress.journeyTracking = createInitialJourneyTracking();
}
```

**Fix:** Make non-optional, initialize in `createInitialProgress()`:

```typescript
journeyTracking: JourneyTracking; // Required
```

---

**2. Nullable Current Node (StoryView.tsx:221-224)**

```typescript
const currentNode: StoryNode | null = useMemo(() => {
  if (!selectedNode) return null;
  return nodes.get(selectedNode) || null;
}, [nodes, selectedNode]);
```

**Flow:**

```
selectedNode: string | null
  └─► currentNode: StoryNode | null
       └─► Requires null checks in 10+ places (lines 232, 234, 250, 305, etc.)
```

**Issue:** If `selectedNode` is set but node doesn't exist in Map, returns `null`.

**Better:** Validate `selectedNode` before setting, ensure invariant:

```typescript
// In storyStore.selectNode:
selectNode: (nodeId: string | null) => {
  if (nodeId !== null && !get().nodes.has(nodeId)) {
    console.error(`Cannot select non-existent node: ${nodeId}`);
    return;
  }
  set({ selectedNode: nodeId });
};
```

Then `currentNode` can be:

```typescript
const currentNode: StoryNode = nodes.get(selectedNode)!; // Non-null assertion safe
```

---

**3. Variation Metadata Optional Fields**

```typescript
// Variation.ts:42-70
interface VariationMetadata {
  wordCount?: number; // Should be required
  variationId?: string; // Should be required
  nodeId?: string; // Should be required
  // ... 20+ optional fields
}
```

**Problem:** Almost all fields optional, enabling incomplete variations.

**Better:** Separate into **required core** + **optional enrichment**:

```typescript
interface VariationMetadataCore {
  variationId: string; // Required
  nodeId: string; // Required
  wordCount: number; // Required
  layer: number; // Required
  createdDate: string; // Required
}

interface VariationMetadataEnrichment {
  journeyPattern?: JourneyPattern;
  philosophyDominant?: PathPhilosophy;
  awarenessLevel?: AwarenessLevel;
  // ... other optional fields
}

type VariationMetadata = VariationMetadataCore & VariationMetadataEnrichment;
```

---

## 5. Strictness Violations by Severity

### 🔴 Critical (Fix Required)

1. **variationLoader.ts:58** — `normalizeVariation(variation: any, ...)`
   - **Impact:** No compile-time checking of variation structure
   - **Risk:** Runtime errors if variation file structure changes
   - **Fix:**

   ```typescript
   function normalizeVariation(variation: unknown, fileNodeId?: string): Variation {
     // Add type guards
     if (!isPlainObject(variation)) throw new Error('Invalid variation');
     // ...
   }
   ```

2. **CustomStoryNode.tsx:158, NodeMap.tsx:207** — React Flow type erasure
   - **Impact:** No type safety in node rendering
   - **Risk:** Accessing undefined properties at runtime
   - **Fix:** Use React Flow's generic `Node<CustomStoryNodeData>` type

3. **VisitRecord missing variationId** — Cannot track variation history
   - **Impact:** Variation deduplication impossible (Task 2 gap)
   - **Risk:** Reader sees same variation on revisit
   - **Fix:** Add `variationId?: string` to `VisitRecord` interface

---

### 🟡 Moderate (Recommend Fixing)

4. **journeyTracking optional** — 20+ defensive checks
   - **Impact:** Code complexity, null-check noise
   - **Fix:** Make required, initialize in `createInitialProgress()`

5. **contentLoader.ts:222-223** — Type assertions for character/position
   - **Impact:** Bypasses type checking
   - **Fix:** Add `character?` and `position?` to interface

6. **VariationMetadata all optional** — Incomplete variation validation
   - **Impact:** Runtime errors if required fields missing
   - **Fix:** Split into core (required) + enrichment (optional)

---

### 🟢 Low Priority (Acceptable or Cosmetic)

7. **errorHandler.ts, performanceMonitor.ts** — `any` in generic metadata
   - **Impact:** Minimal — error/perf contexts inherently generic
   - **Fix:** Can use `Record<string, unknown>` for stricter typing

8. **contentLoader.ts debug logs** — `(charData as any).nodes`
   - **Impact:** None — already type-guarded above
   - **Fix:** Extract to separate debug function if desired

---

## 6. Type Safety Recommendations

### High Priority

1. ✅ **Replace `any` with `unknown`** in variationLoader.ts:58
2. ✅ **Add `variationId` to VisitRecord** for deduplication tracking
3. ✅ **Use React Flow generic types** instead of `as unknown` casts
4. ✅ **Make journeyTracking required** to eliminate null checks

### Medium Priority

5. ⚠️ **Split VariationMetadata** into required core + optional enrichment
6. ⚠️ **Add type guards** in contentLoader instead of type assertions
7. ⚠️ **Validate selectedNode** before setting to ensure Map consistency

### Low Priority

8. 🟡 **Extract debug logging** to separate utility (contentLoader.ts)
9. 🟡 **Add JSDoc comments** to type guard functions for clarity
10. 🟡 **Enable stricter TypeScript flags** (noUncheckedIndexedAccess, exactOptionalPropertyTypes)

---

## 7. Navigation Flow — Edge Cases

### A. Rapid Node Clicking

**Scenario:** User clicks Node B before `visitNode(A)` completes.

**Current Behavior:**

```
Click Node A (t=0ms)
  └─► selectNode(A)  [synchronous]
  └─► openStoryView(A)  [synchronous]
       └─► StoryView renders (t=5ms)
            └─► useEffect triggers visitNode(A)  (t=10ms)
                 └─► 19-step update sequence (t=10-50ms)

Click Node B (t=20ms)  ← DURING visitNode(A)
  └─► selectNode(B)  [synchronous, state.selectedNode = B]
  └─► openStoryView(B)  [synchronous]
       └─► StoryView re-renders with Node B (t=25ms)
            └─► useEffect triggers visitNode(B)  (t=30ms)
```

**Result:**

- Both `visitNode(A)` and `visitNode(B)` execute
- Race condition on state updates (Immer may serialize)
- Both nodes recorded in `readingPath: [A, B]`
- Both nodes get visit counts incremented

**Risk:** **Low** — Zustand + Immer handle concurrent updates, but order may vary.

**Mitigation:** Debounce node clicks or disable during visit processing.

---

### B. StoryView Closed Before Visit Records

**Scenario:** User clicks node, then immediately closes (ESC < 10ms).

**Current Behavior:**

```
Click Node A (t=0ms)
  └─► openStoryView(A)  [storyViewOpen = true]
       └─► StoryView renders
            └─► useEffect scheduled (t=5ms)

User presses ESC (t=3ms)
  └─► closeStoryView()  [storyViewOpen = false]
       └─► StoryView unmounts, useEffect **cancelled**
```

**Result:**

- `visitNode()` **never called** if ESC pressed before useEffect runs
- Node not recorded in visit history
- No awareness/journey updates

**Risk:** **Medium** — User can "peek" at nodes without recording visits.

**Mitigation:** Call `visitNode()` in `openStoryView()` instead of useEffect:

```typescript
openStoryView: (nodeId: string) => {
  // ...
  set({ storyViewOpen: true });
  get().visitNode(nodeId); // ← Move here
};
```

---

### C. L3 Node Routing

**Current Flow (storyStore.ts:1027-1032):**

```typescript
if (isL3Node(nodeId)) {
  state.openL3AssemblyView();
  return; // ← Early return, visitNode() NOT called
}
```

**Issue:** L3 nodes don't call `visitNode()` in `openStoryView()`.

**Question:** Where is L3 visit recorded?

**Answer:** Must be in `openL3AssemblyView()` or L3AssemblyView component. (Not verified in current scan.)

**Risk:** **High** — If L3 visits not recorded, awareness/unlock calculations break.

**Verification Needed:**

```bash
grep -n "visitNode" src/components/UI/L3AssemblyView.tsx
```

---

### D. Unlock Evaluation Timing

**Observation:** Unlocks evaluated **after** all visit state updates (step 18).

**Edge Case:** If unlock condition depends on **current visit's increment**, it works:

```json
{
  "type": "visitCount",
  "params": { "totalVisits": 5 }
}
```

**Flow:**

```
Visit #5 recorded (step 2)
  └─► visitedNodes now has 5 unique entries
       └─► evaluateUnlocks() (step 18)
            └─► totalVisits check: Object.keys(visitedNodes).length === 5  ✅
```

**Correct!** Unlock triggers immediately when condition met.

**Edge Case 2:** If unlock depends on transformation state:

```json
{
  "type": "transformation",
  "params": { "requiredTransformations": ["metaAware"] }
}
```

**Flow:**

```
Visit recorded (step 2)
  └─► Awareness updated (step 13)
       └─► Transformation states re-determined (step 15)
            └─► Some node reaches 'metaAware'
                 └─► evaluateUnlocks() (step 18)
                      └─► requiredTransformations check passes  ✅
```

**Correct!** Transformation-based unlocks work because state updates happen before evaluation.

---

## 8. Summary — Navigation Flow Health

### ✅ Strengths

1. **Well-Sequenced State Updates**
   - Visit metadata → Awareness → Journey → Transformation → Unlocks
   - Correct dependency order ensures derived state is fresh

2. **Comprehensive Tracking**
   - 19-step visitNode() captures visit counts, timestamps, character switches, philosophy choices, exploration metrics

3. **Retroactive Transformation**
   - All visited nodes update when awareness crosses thresholds
   - Enables "temporal bleeding" effect

4. **Unlock Evaluation Placement**
   - Happens after all state updates
   - Conditions can depend on current visit's changes

5. **Persistence**
   - saveProgress() called after every visit
   - No data loss risk

---

### ⚠️ Weaknesses

1. **Visit Recording Timing**
   - useEffect-based, can be cancelled if user closes view quickly
   - Should move to `openStoryView()` for reliability

2. **L3 Node Visit Recording**
   - Early return in `openStoryView()` for L3 nodes
   - Unclear if visits recorded elsewhere (verification needed)

3. **Type Safety Gaps**
   - `any` in variationLoader (critical path)
   - React Flow type erasure requires unsafe casts
   - Missing variationId tracking

4. **Optional journeyTracking**
   - 20+ defensive null checks
   - Should be required, initialized upfront

5. **No Debouncing**
   - Rapid clicks can queue multiple visits
   - May cause unexpected state races

---

### 🔴 Critical Fixes Needed

1. **Move visitNode() to openStoryView()** (timing reliability)
2. **Verify L3 visit recording** (awareness calculation dependency)
3. **Replace `any` in variationLoader.ts:58** (type safety)
4. **Add variationId to VisitRecord** (deduplication support, Task 2 gap)

---

**End of Analysis**
