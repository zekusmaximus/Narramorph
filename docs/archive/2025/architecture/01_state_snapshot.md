# State Model Snapshot — Current vs. Required

**Generated:** 2025-11-12 **Scope:** Read-only analysis of journey state model (Task 1) **Files Analyzed:** `Store.ts`, `Variation.ts`, `Node.ts`, `Unlock.ts`, `storyStore.ts`, `conditionEvaluator.ts`, `nodeUtils.ts`

---

## 1. Observed State Fields & Methods

### A. Core State Shape (`StoryStore` interface)

**File:** `src/types/Store.ts:145-211`

```typescript
interface StoryStore {
  // Story content
  storyData: StoryData | null;
  nodes: Map<string, StoryNode>;
  connections: Map<string, Connection>;

  // User progress
  progress: UserProgress;

  // L3 Assembly
  l3AssemblyCache: Map<string, L3Assembly>;
  currentL3Assembly: L3Assembly | null;

  // Unlock system
  unlockConfigs: Map<string, NodeUnlockConfig>;
  recentlyUnlockedNodes: string[];

  // Stats
  stats: ReadingStats;
  preferences: UserPreferences;
}
```

### B. User Progress Structure (`UserProgress` interface)

**File:** `src/types/Store.ts:53-78`

```typescript
interface UserProgress {
  // Visit tracking
  visitedNodes: Record<string, VisitRecord>; // nodeId → VisitRecord
  readingPath: string[]; // Ordered node IDs

  // Unlock state
  unlockedConnections: string[];
  specialTransformations: UnlockedTransformation[];
  unlockedL2Characters: string[]; // e.g., ['archaeologist', 'algorithm']

  // Temporal awareness
  temporalAwarenessLevel: number; // 0-100 scale
  characterNodesVisited: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };

  // Journey tracking
  journeyTracking?: JourneyTracking;

  // L3 assembly viewing
  l3AssembliesViewed?: L3AssemblyViewRecord[];

  // Session tracking
  currentNode?: string;
  totalTimeSpent: number;
  lastActiveTimestamp: string;
}
```

### C. Visit Record Structure (`VisitRecord` interface)

**File:** `src/types/Store.ts:16-22`

```typescript
interface VisitRecord {
  visitCount: number; // Total visits to this node
  visitTimestamps: string[]; // ISO-8601 timestamps of each visit
  currentState: TransformationState; // 'initial' | 'firstRevisit' | 'metaAware'
  timeSpent: number; // Total seconds on node
  lastVisited: string; // ISO-8601 timestamp
}
```

**Missing from VisitRecord:**

- ❌ `variationId` — Which specific variation was shown
- ❌ `previousNode` — Previous node in reading path

### D. Journey Tracking Structure (`JourneyTracking` interface)

**File:** `src/types/Variation.ts:156-214`

```typescript
interface JourneyTracking {
  // Character exploration
  startingCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';
  characterVisitPercentages: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };
  dominantCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';

  // Journey pattern classification
  currentJourneyPattern: JourneyPattern; // 'started-stayed' | 'started-bounced' | etc.

  // Philosophy tracking (L2 choices)
  l2Choices: {
    accept: number;
    resist: number;
    invest: number; // ⚠️ Called "invest" not "investigate"
  };
  dominantPhilosophy: PathPhilosophy; // 'accept' | 'resist' | 'invest' | 'mixed' | 'unknown'

  // Cross-character connections
  crossCharacterConnections: {
    arch_algo: number; // Archaeologist ↔ Algorithm switches
    arch_hum: number; // Archaeologist ↔ Last Human switches
    algo_hum: number; // Algorithm ↔ Last Human switches
  };

  // Navigation patterns
  navigationPattern: 'linear' | 'exploratory' | 'recursive' | 'undetermined';
  lastCharacterVisited?: 'archaeologist' | 'algorithm' | 'lastHuman';

  // Exploration metrics
  revisitFrequency: number; // Percentage (0-100)
  explorationMetrics: {
    breadth: number; // % of total nodes visited
    depth: number; // Average visits per unique node
  };
}
```

### E. Unlock System (`NodeUnlockConfig` interface)

**File:** `src/types/Unlock.ts:83-91`

```typescript
interface NodeUnlockConfig {
  nodeId: string;
  layer: number;
  defaultLocked: boolean;
  unlockConditions: UnlockCondition[]; // Compound AND/OR/NOT logic
  lockedMessage: string;
  unlockMessage?: string;
  priority?: number;
}
```

**Supported condition types:** `visitCount`, `awareness`, `philosophy`, `character`, `transformation`, `l3Assembly`, `compound`

---

## 2. Key Actions & Selectors

### State Mutation Actions

**File:** `src/stores/storyStore.ts`

| Action | Line | Description |
| --- | --- | --- |
| `loadStory(storyId)` | 374-451 | Load story content, initialize nodes/connections |
| `visitNode(nodeId)` | 836-1004 | Record visit, update tracking, evaluate unlocks |
| `updateTemporalAwareness()` | 462-490 | Calculate awareness from character exploration |
| `updateJourneyTracking()` | 493-555 | Update journey pattern, philosophy, navigation pattern |
| `recordL2Choice(choice)` | 560-568 | Manually record L2 philosophy choice |
| `evaluateUnlocks()` | 785-812 | Check unlock conditions, populate `recentlyUnlockedNodes` |
| `saveProgress()` | 1056-1069 | Persist state to localStorage |
| `loadProgress()` | 1071-1159 | Restore state from localStorage (includes migrations) |

### Computed Selectors

| Selector                           | Line      | Returns                                    |
| ---------------------------------- | --------- | ------------------------------------------ |
| `getConditionContext(nodeId?)`     | 576-590   | `ConditionContext` for variation selection |
| `getNodeState(nodeId)`             | 1210-1257 | `NodeUIState` with visual properties       |
| `getConnectionState(connectionId)` | 1259-1293 | `ConnectionUIState` visibility & animation |
| `getReadingStats()`                | 1333-1392 | `ReadingStats` computed from progress      |
| `canVisitNode(nodeId)`             | 1401-1426 | Boolean: unlock check                      |
| `getUnlockProgress(nodeId)`        | 817-824   | `UnlockProgress` object or null            |

### Journey Calculation Functions

**File:** `src/utils/conditionEvaluator.ts`

| Function | Line | Logic |
| --- | --- | --- |
| `calculateJourneyPattern()` | 256-303 | Returns `JourneyPattern` based on starting character + percentages<br>- `started-stayed`: dominant >60% same as starting<br>- `shifted-dominant`: dominant switched, >50%<br>- `started-bounced`: starting 40-60%<br>- `began-lightly`: starting <40%, later >50%<br>- `met-later`: fallback |
| `calculatePathPhilosophy()` | 308-340 | Returns `PathPhilosophy` from L2 choice counts<br>- Dominant if >50%<br>- `mixed` if all within 20% of each other |
| `getAwarenessLevel()` | 18-22 | Maps 0-100 numeric to `'low'` (<35), `'medium'` (<70), `'high'` |

### Temporal Awareness Algorithm

**File:** `src/stores/storyStore.ts:462-490`

```
diversityBonus = (unique characters visited) × 20
explorationScore = min((total visits / 10) × 40, 40)
temporalAwarenessLevel = min(diversityBonus + explorationScore, 100)
```

**Thresholds:**

- 20% → Enables `firstRevisit` transformation state (line 174)
- 50% → Enables `metaAware` transformation state (line 180)

---

## 3. Required Capabilities — Gap Analysis

| Capability | Status | Details |
| --- | --- | --- |
| **Visit history (nodeId, timestamp, duration)** | ✅ **Present** | `visitedNodes` record with `VisitRecord` containing `visitCount`, `visitTimestamps[]`, `timeSpent`, `lastVisited` |
| **Visit history (variationId)** | ⚠️ **Missing** | `VisitRecord` does not track which specific variation was shown. Currently no way to audit "reader saw variation X on visit 2" |
| **Visit history (previousNode)** | ⚠️ **Partial** | Not in `VisitRecord`, but can infer from `readingPath[]` array. Risk: `readingPath` can contain duplicates (revisits), so previousNode lookup requires index math |
| **Awareness per character (0-3)** | ⚠️ **Different scale** | Uses single `temporalAwarenessLevel: 0-100` based on cross-character exploration, not per-character 0-3 scale. May conflict with requirements. |
| **Cross-character connections** | ✅ **Present** | `crossCharacterConnections: {arch_algo, arch_hum, algo_hum}` tracks perspective switches. Updated in `visitNode()` (line 877-894) |
| **Philosophical profile (accept/resist/investigate)** | ⚠️ **Naming mismatch** | Uses `invest` instead of `investigate`. Tracked in `l2Choices: {accept, resist, invest}`. Philosophy auto-detected from nodeId via `getNodePhilosophy()` mapping |
| **Unlock progression** | ✅ **Present** | Full unlock system with `unlockConfigs`, compound conditions (AND/OR/NOT), progress tracking via `getUnlockProgress()` |
| **Visit counts** | ✅ **Present** | Per-node `visitCount`, per-character `characterNodesVisited`, total derivable from `visitedNodes` record size |
| **Path sequences** | ✅ **Present** | `readingPath: string[]` ordered array of all visited nodes (includes revisits) |

---

## 4. Critical Findings

### 🔴 Critical Gaps

1. **No variation ID tracking in visit records**
   - **Issue:** Cannot determine which specific variation was shown to reader
   - **Impact:** Impossible to audit "was variation arch-L1-001-JA-low shown?" or track A/B testing
   - **Location:** `src/types/Store.ts:16-22` (VisitRecord interface)

2. **Awareness scale mismatch**
   - **Required:** Per-character awareness 0-3
   - **Actual:** Single temporal awareness 0-100 based on cross-character exploration
   - **Impact:** If requirements expect character-specific awareness levels, current model cannot support
   - **Location:** `src/types/Store.ts:63-68` (temporalAwarenessLevel field)

3. **Philosophy naming inconsistency**
   - **Required:** "investigate"
   - **Actual:** "invest"
   - **Impact:** Minor — aliasing possible, but creates confusion in docs/UI
   - **Location:** `src/types/Variation.ts:22` (PathPhilosophy type), `src/stores/storyStore.ts:942` (L2 choice tracking)

### ⚠️ Design Concerns

4. **Previous node inference is fragile**
   - **Issue:** `readingPath[]` includes duplicates (revisits), so determining "previous node" requires filtering or index math
   - **Risk:** Off-by-one errors, especially with character switches
   - **Recommendation:** Add `previousNodeId?: string` to `VisitRecord`

5. **Transformation state thresholds are hardcoded**
   - **Values:** 20% awareness for `firstRevisit`, 50% for `metaAware`
   - **Location:** `src/stores/storyStore.ts:174,180`
   - **Risk:** Cannot adjust thresholds without code changes; no per-node override

6. **Journey tracking is optional**
   - **Type:** `journeyTracking?: JourneyTracking` (optional field)
   - **Risk:** Defensive checks required throughout codebase (line 514, 562, 878, etc.)
   - **Recommendation:** Initialize to non-null default in `createInitialProgress()`

### ✅ Strengths

7. **Unlock system is highly flexible**
   - Supports compound conditions (AND/OR/NOT)
   - Visit-based, awareness-based, philosophy-based, transformation-based
   - Progress tracking with `conditionsMet` / `conditionsNotMet` arrays

8. **L3 assembly caching is robust**
   - Cache key includes `journeyPattern_pathPhilosophy_awarenessLevel_synthesisPattern`
   - Invalidated on L2 visits (philosophy changes, line 932)
   - Stores viewing history with section completion tracking

9. **State persistence includes migrations**
   - Handles old saves without `temporalAwarenessLevel` (line 1081-1128)
   - Handles old saves without `unlockedL2Characters` (line 1131-1153)
   - Schema version tracking (`version: "1.0.0"`)

---

## 5. Proposed Minimal JourneyState Interface

**Purpose:** Consolidate journey-specific state into single type (no source edits, documentation only)

```typescript
/**
 * Minimal consolidated journey state
 * Combines UserProgress + JourneyTracking into single conceptual model
 */
interface JourneyState {
  // === Visit History ===
  visitedNodes: Record<string, VisitRecord>;
  readingPath: string[]; // Ordered history with duplicates

  // VisitRecord should include:
  // - visitCount: number
  // - visitTimestamps: string[]
  // - currentState: TransformationState
  // - timeSpent: number
  // - lastVisited: string
  // - variationId?: string  ⚠️ MISSING - should add
  // - previousNodeId?: string  ⚠️ MISSING - should add

  // === Awareness Tracking ===
  temporalAwarenessLevel: number; // 0-100 scale
  characterNodesVisited: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };

  // ⚠️ If per-character awareness (0-3) is required, add:
  // characterAwarenessLevels?: {
  //   archaeologist: 0 | 1 | 2 | 3
  //   algorithm: 0 | 1 | 2 | 3
  //   lastHuman: 0 | 1 | 2 | 3
  // }

  // === Character Journey ===
  startingCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';
  characterVisitPercentages: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };
  dominantCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';
  currentJourneyPattern: JourneyPattern;

  // === Philosophy Profile ===
  l2Choices: {
    accept: number;
    resist: number;
    invest: number; // ⚠️ Rename to "investigate" if required
  };
  dominantPhilosophy: PathPhilosophy;

  // === Cross-Character Connections ===
  crossCharacterConnections: {
    arch_algo: number;
    arch_hum: number;
    algo_hum: number;
  };
  lastCharacterVisited?: 'archaeologist' | 'algorithm' | 'lastHuman';

  // === Navigation Patterns ===
  navigationPattern: 'linear' | 'exploratory' | 'recursive' | 'undetermined';
  revisitFrequency: number; // Percentage
  explorationMetrics: {
    breadth: number; // % of nodes visited
    depth: number; // Avg visits per unique node
  };

  // === Unlock State ===
  unlockedConnections: string[];
  unlockedL2Characters: string[];
  specialTransformations: UnlockedTransformation[];

  // === L3 Assembly ===
  l3AssembliesViewed?: L3AssemblyViewRecord[];

  // === Session Meta ===
  currentNode?: string;
  totalTimeSpent: number;
  lastActiveTimestamp: string;
}
```

---

## 6. Recommendations for Alignment

### Immediate (No Breaking Changes)

1. **Add variation ID tracking**

   ```typescript
   // In VisitRecord interface (Store.ts:16-22)
   interface VisitRecord {
     // ... existing fields
     variationId?: string; // ADD: Track which variation was shown
   }
   ```

   **Rationale:** Essential for audit trail and A/B testing

2. **Add previous node to visit record**

   ```typescript
   interface VisitRecord {
     // ... existing fields
     previousNodeId?: string; // ADD: More reliable than readingPath inference
   }
   ```

   **Rationale:** Simplifies "where did reader come from" queries

3. **Make journeyTracking non-optional**
   ```typescript
   interface UserProgress {
     journeyTracking: JourneyTracking; // CHANGE: Remove '?'
   }
   ```
   **Rationale:** Eliminates 20+ defensive checks across codebase

### Medium (Requires Migration)

4. **Clarify awareness model**
   - If per-character awareness (0-3) is required, add new fields
   - Document relationship between `temporalAwarenessLevel` (0-100) and character-specific levels
   - Consider: Is temporal awareness a **derived** metric or **primary** input?

5. **Standardize philosophy terminology**
   - Decide: "invest" vs. "investigate"
   - Update types, UI labels, docs to match canonical term
   - Add migration for old saves if changing stored values

### Long-term (Architecture)

6. **Extract transformation thresholds to config**

   ```typescript
   interface TransformationConfig {
     firstRevisitAwarenessThreshold: number; // Default 20
     metaAwareAwarenessThreshold: number; // Default 50
     perNodeOverrides?: Record<string, { firstRevisit: number; metaAware: number }>;
   }
   ```

   **Rationale:** Enables experimentation, per-node customization

7. **Consider splitting UserProgress**
   - `VisitHistory` (visitedNodes, readingPath)
   - `JourneyProfile` (journeyTracking, temporalAwareness)
   - `UnlockState` (unlocks, L2 characters)
   - `SessionState` (currentNode, totalTimeSpent)

   **Rationale:** Each has different persistence/caching needs

---

## 7. File Reference Summary

| File | Purpose | Key Types |
| --- | --- | --- |
| `src/types/Store.ts` | Core state interfaces | `StoryStore`, `UserProgress`, `VisitRecord`, `ReadingStats` |
| `src/types/Variation.ts` | Journey tracking & L3 | `JourneyTracking`, `ConditionContext`, `L3Assembly`, `JourneyPattern`, `PathPhilosophy` |
| `src/types/Node.ts` | Node definitions | `StoryNode`, `TransformationState`, `NodeContent` |
| `src/types/Unlock.ts` | Unlock system | `NodeUnlockConfig`, `UnlockCondition`, `UnlockProgress` |
| `src/stores/storyStore.ts` | Zustand store implementation | All actions, selectors, calculation logic |
| `src/utils/conditionEvaluator.ts` | Journey calculations | `calculateJourneyPattern()`, `calculatePathPhilosophy()`, `getAwarenessLevel()` |
| `src/utils/nodeUtils.ts` | Layer detection | `isL3Node()`, `getNodeLayer()`, `getNodeCharacter()` |

---

## 8. Conclusion

**Current state model:**

- ✅ Comprehensive journey tracking (character exploration, philosophy, connections)
- ✅ Robust unlock system with compound conditions
- ✅ Persistent state with migrations
- ⚠️ Missing variation ID in visit history (critical for audit)
- ⚠️ Awareness scale mismatch (0-100 vs. required 0-3 per character)
- ⚠️ Philosophy terminology inconsistency (invest vs. investigate)

**Next steps:**

- Confirm requirements for per-character awareness (0-3) vs. current temporal awareness (0-100)
- Decide on variation ID tracking priority
- Validate philosophy naming convention across team

**End of Snapshot**
