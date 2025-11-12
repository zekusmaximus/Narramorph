# Variation Selection & Unlocks Scan

**Generated:** 2025-11-12
**Scope:** Read-only analysis of variation selection and unlock evaluation (Task 2)
**Files Analyzed:** `useVariationSelection.ts`, `variationLoader.ts`, `unlockLoader.ts`, `unlockEvaluator.ts`, `l3Assembly.ts`, `conditionEvaluator.ts`, `unlock-config.json`

---

## 1. Variation Selection Logic — File References

### A. React Hook (Runtime Selection)
**File:** `src/hooks/useVariationSelection.ts:43-135`

```typescript
// Algorithm:
// 1. Get condition context from store (awareness, journey, visit count, transformation state)
// 2. Load variation file for current node
// 3. Call findMatchingVariation() to select appropriate variation
// 4. Return matched variation content + metadata
// 5. Fall back to static node content if variation system fails
```

**Reactive Dependencies (line 134):**
- `temporalAwareness` (0-100)
- `visitRecord?.visitCount`
- `visitRecord?.currentState` (transformation state)
- `journeyTracking?.currentJourneyPattern`
- `journeyTracking?.dominantPhilosophy`

**Returns:** `{ content, variationId, metadata, isLoading, error, usedFallback }`

**Fallback Strategy:**
1. No variation file → Use `fallbackContent` prop
2. No matching variation → Use first variation in file (line 99)
3. Error during selection → Use `fallbackContent` prop

---

### B. Variation File Loader
**File:** `src/utils/variationLoader.ts:144-173`

**Vite Glob Imports (lines 20-43):**
```javascript
const l1VariationFiles = import.meta.glob('/src/data/stories/*/content/layer1/*-variations.json', { eager: true });
const l2VariationFiles = import.meta.glob('/src/data/stories/*/content/layer2/*-variations.json', { eager: true });
const l3VariationFiles = import.meta.glob('/src/data/stories/*/content/layer3/*-variations.json', { eager: true });
const l4VariationFiles = import.meta.glob('/src/data/stories/*/content/layer4/*-variations.json', { eager: true });
```

**Naming Conventions Detected:**
- **L1:** `{char}-L1-variations.json` (e.g., `arch-L1-variations.json`)
- **L2:** `{char}-L2-{philosophy}-variations.json` (e.g., `hum-L2-resist-variations.json`)
- **L3:** `{char}-L3-variations.json` (special loader at line 178-214)
- **L4:** `final-{alignment}-variations.json` (e.g., `final-preserve.json`)

**Normalization (lines 58-139):**
- Ensures all variations have metadata with required fields
- Sets default `awarenessRange: [0, 100]` if missing
- Sets default `journeyPattern: 'unknown'` if missing
- Sets default `philosophyDominant: 'unknown'` if missing
- Derives `awarenessLevel` from `awarenessRange` midpoint if missing

**Caching:**
- In-memory cache with key `${storyId}:${nodeId}` (line 146)
- Separate cache for selection matrix (unused, line 15)

---

### C. Matching Logic
**File:** `src/utils/conditionEvaluator.ts:79-215`

**Primary Matching Function:** `findMatchingVariation(variations, context)`

**Filter Criteria (in order of precedence):**

1. **Transformation State (CRITICAL, line 116):**
   ```typescript
   if (variation.transformationState !== context.transformationState) return false;
   ```
   Must match exactly: `'initial'` | `'firstRevisit'` | `'metaAware'`

2. **Awareness Range (line 122):**
   ```typescript
   if (!isInRange(context.awareness, meta.awarenessRange)) return false;
   ```
   Context awareness must fall within `[min, max]`

3. **Journey Pattern (line 128):**
   ```typescript
   if (meta.journeyPattern !== 'unknown' && meta.journeyPattern !== context.journeyPattern) return false;
   ```
   Skip if metadata is `'unknown'`, otherwise must match

4. **Philosophy (line 134):**
   ```typescript
   if (meta.philosophyDominant !== 'unknown' && meta.philosophyDominant !== context.pathPhilosophy) return false;
   ```
   Skip if metadata is `'unknown'`, otherwise must match

**Tiebreaker Priority (lines 157-204):**
1. Exact match (journey + philosophy)
2. Journey-only match
3. Philosophy-only match
4. First remaining match

**No Deduplication:** Same variation can be selected on multiple visits if conditions match.

---

### D. L3 Assembly (Special Case)
**File:** `src/utils/l3Assembly.ts:91-147`

**Algorithm:**
1. Load all 4 L3 variation files (arch, algo, hum, conv)
2. Calculate synthesis pattern from character visit percentages (line 106)
   - `single-dominant`: One character >60%
   - `true-triad`: All within 15% of each other (~33% each)
   - `balanced-dual`: Two characters dominant
3. Build each section using `findMatchingVariation()` with shared context
4. Package into `L3Assembly` with metadata

**Special Handling:**
- Convergence section uses synthesisPattern (line 107)
- Falls back to first variation if no match (line 66)
- Validates expected word counts (800-1000 per char, 1600-2000 conv, ~4200 total)

**Cache Key (storyStore.ts:635):**
```
${journeyPattern}_${pathPhilosophy}_${awarenessLevel}_${synthesisPattern}
```

**Invalidation:** L3 cache cleared on L2 node visit (philosophy changes, storyStore.ts:932)

---

## 2. Unlock System — File References

### A. Configuration Loader
**File:** `src/utils/unlockLoader.ts:23-41`

**Glob Import (line 12):**
```javascript
const unlockConfigFiles = import.meta.glob('/src/data/stories/*/unlock-config.json', { eager: true, import: 'default' });
```

**Returns:** `Map<string, NodeUnlockConfig>` keyed by `nodeId`

**Example Config File:** `src/data/stories/eternal-return/unlock-config.json`
- 6 unlock configurations (3 L3 nodes, 3 L4 nodes)
- Version: `"1.0.0"`

---

### B. Unlock Evaluator
**File:** `src/utils/unlockEvaluator.ts:24-305`

**Entry Point:** `evaluateNodeUnlock(config, progress)` (line 294)

**Logic:**
- If `defaultLocked: false` → Always unlocked
- Otherwise: **All** unlock conditions must be met (implicit AND, line 302)

**Condition Types Supported:**

| Type | Evaluator | Lines |
|------|-----------|-------|
| `visitCount` | `evaluateVisitCountCondition()` | 52-93 |
| `awareness` | `evaluateAwarenessCondition()` | 98-113 |
| `philosophy` | `evaluatePhilosophyCondition()` | 118-156 |
| `character` | `evaluateCharacterCondition()` | 161-198 |
| `transformation` | `evaluateTransformationCondition()` | 203-230 |
| `l3Assembly` | `evaluateL3AssemblyCondition()` | 235-255 |
| `compound` | `evaluateCompoundCondition()` | 260-285 |

---

### C. Unlock Config Example (Eternal Return)
**File:** `src/data/stories/eternal-return/unlock-config.json`

**L3 Node Unlock (arch-L3, lines 4-40):**
```json
{
  "nodeId": "arch-L3",
  "defaultLocked": true,
  "unlockConditions": [
    {
      "id": "l2-exploration",
      "type": "visitCount",
      "params": { "layerVisits": { "2": 2 } },
      "description": "Visit at least 2 Layer 2 nodes"
    },
    {
      "id": "cross-character-exploration",
      "type": "character",
      "params": { "minCharacterCount": 2 },
      "description": "Explore at least 2 different character perspectives"
    },
    {
      "id": "medium-awareness",
      "type": "awareness",
      "params": { "minAwareness": 35 },
      "description": "Reach Medium temporal awareness (35%)"
    }
  ]
}
```
**Requirements:** 2+ L2 visits AND 2+ characters AND 35%+ awareness

**L4 Node Unlock (final-preserve, lines 114-150):**
```json
{
  "nodeId": "final-preserve",
  "defaultLocked": true,
  "unlockConditions": [
    {
      "id": "l3-completion",
      "type": "l3Assembly",
      "params": {
        "minL3Assemblies": 1,
        "requiredL3Completion": true
      }
    },
    {
      "id": "high-awareness",
      "type": "awareness",
      "params": { "minAwareness": 70 }
    },
    {
      "id": "all-characters",
      "type": "character",
      "params": {
        "requiredCharacters": ["archaeologist", "algorithm", "lastHuman"]
      }
    }
  ]
}
```
**Requirements:** Complete L3 assembly (all 4 sections) AND 70%+ awareness AND all 3 characters

---

## 3. Supported Signals — Input Matrix

### Variation Selection Signals

| Signal | Source | Used In Matching? | Notes |
|--------|--------|-------------------|-------|
| **Transformation State** | `context.transformationState` | ✅ **PRIMARY** | `'initial'` \| `'firstRevisit'` \| `'metaAware'` — Must match exactly |
| **Awareness (numeric)** | `context.awareness` (0-100) | ✅ **Range** | Must fall within variation's `awarenessRange: [min, max]` |
| **Journey Pattern** | `context.journeyPattern` | ✅ **Conditional** | Matched if variation metadata ≠ `'unknown'` |
| **Path Philosophy** | `context.pathPhilosophy` | ✅ **Conditional** | Matched if variation metadata ≠ `'unknown'` |
| **Visit Count** | `context.visitCount` | ❌ **No** | Included in context but not used in `findMatchingVariation()` |
| **Character Visit %** | `context.characterVisitPercentages` | ⚠️ **L3 only** | Used to calculate `synthesisPattern` for L3 conv section |
| **Node ID** | `context.nodeId` | ❌ **No** | Used for logging, not matching |

**Key Insight:** Transformation state acts as the primary filter, with awareness/journey/philosophy as secondary refinements.

---

### Unlock Evaluation Signals

| Predicate Type | Supported Parameters | Examples |
|----------------|---------------------|----------|
| **visitCount** | `totalVisits`, `nodeVisits: {nodeId: count}`, `characterVisits: {char: count}`, `layerVisits: {layer: count}` | "Visit 2+ L2 nodes", "Visit arch-L1 3 times" |
| **awareness** | `minAwareness`, `maxAwareness` (0-100) | "Reach 35% awareness", "Stay below 50%" |
| **philosophy** | `requiredPhilosophy`, `minPhilosophyCount`, `philosophyDistribution: {accept, resist, invest}` | "Dominant philosophy = resist", "Make 3+ L2 choices" |
| **character** | `requiredCharacters`, `minCharacterCount`, `minCharacterPercentage: {char: %}` | "Visit all 3 characters", "Archaeologist >40%" |
| **transformation** | `requiredTransformations`, `minMetaAwareNodes` | "See metaAware state", "3+ nodes in metaAware" |
| **l3Assembly** | `minL3Assemblies`, `requiredL3Completion` | "View L3 assembly", "Complete all 4 sections" |
| **compound** | `operator: 'AND' \| 'OR' \| 'NOT'`, `conditions: []` | "(Visit L1 AND awareness >20) OR L3 complete" |

**Compound Logic (lines 260-285):**
- `AND`: All nested conditions true
- `OR`: Any nested condition true
- `NOT`: All nested conditions false (inverted AND)

---

## 4. Trigger Timing

### Variation Selection: **Reactive (useMemo)**
**File:** `src/hooks/useVariationSelection.ts:55-134`

**React Dependencies:**
```typescript
[
  nodeId,
  storyData?.metadata?.id,
  getConditionContext,
  fallbackContent,
  temporalAwareness,              // Triggers re-selection on awareness change
  visitRecord?.visitCount,        // Triggers on visit count change (enables state transitions)
  visitRecord?.currentState,      // Triggers on transformation state change
  journeyTracking?.currentJourneyPattern,  // Triggers on journey pattern shift
  journeyTracking?.dominantPhilosophy      // Triggers on philosophy shift
]
```

**Re-computation Triggers:**
1. Node changes (navigation)
2. Temporal awareness updates (after `updateTemporalAwareness()`)
3. Visit count increments (after `visitNode()`)
4. Transformation state changes (after state re-determination in `visitNode()`)
5. Journey pattern recalculation (after `updateJourneyTracking()`)
6. Philosophy shifts (after L2 visit)

**Performance:** useMemo prevents re-running expensive file loading/matching unless dependencies change

---

### Unlock Evaluation: **On Node Visit (Eager)**
**File:** `src/stores/storyStore.ts:1001`

**Call Chain:**
```
visitNode(nodeId)
  └─> ... update visit records, journey tracking, awareness ...
  └─> evaluateUnlocks()  // Line 1001
       └─> For each unlockConfig:
            └─> evaluateNodeUnlock(config, progress)
                 └─> Check all conditions
                 └─> If unlocked: add to recentlyUnlockedNodes[]
```

**Timing:**
- Triggered **after** all state updates in `visitNode()`
- Runs synchronously before `saveProgress()`
- Evaluates **all** configured nodes, not just current

**Notification Queue:**
- Newly unlocked nodes stored in `recentlyUnlockedNodes: string[]`
- Cleared via `clearUnlockNotifications()` after UI displays them
- No automatic display — UI must poll or subscribe to this array

---

### Journey Tracking Updates: **On Node Visit (Eager)**
**File:** `src/stores/storyStore.ts:951-952`

**Call Chain:**
```
visitNode(nodeId)
  └─> ... record visit, update character counts ...
  └─> updateTemporalAwareness()  // Line 951
  └─> updateJourneyTracking()    // Line 952
       └─> Recalculate journey pattern (calculateJourneyPattern)
       └─> Recalculate dominant philosophy (calculatePathPhilosophy)
```

**Side Effects:**
- Temporal awareness recalculated from character diversity + exploration score
- Journey pattern recalculated from starting character + current percentages
- Dominant philosophy recalculated from L2 choice counts

---

## 5. Missing Predicates / Timing Gaps

### 🔴 Critical Missing Features

1. **No Deduplication in Variation Selection**
   - **Issue:** Same variation can be shown on multiple visits if conditions match
   - **Impact:** Reader may see identical text on revisit (breaks "temporal bleeding" expectation)
   - **Location:** `conditionEvaluator.ts:79-215` — No check for "previously shown" variations
   - **Needed:** `excludeVariations?: string[]` parameter in `findMatchingVariation()`

2. **No Visit Count Filtering in Variation Matching**
   - **Issue:** `context.visitCount` is included but never evaluated in `findMatchingVariation()`
   - **Impact:** Cannot create variations specific to "visit 3+" without using transformation state as proxy
   - **Location:** `conditionEvaluator.ts` — Missing `visitCount` range check
   - **Gap:** Variation metadata has no `visitCountRange` field

3. **No Cross-Character Connection Predicates in Unlocks**
   - **Issue:** Cannot unlock based on `crossCharacterConnections` (arch_algo, arch_hum, algo_hum)
   - **Example Use Case:** "Unlock after 5+ character switches"
   - **Location:** `unlockEvaluator.ts` — No `crossCharacter` condition type
   - **Workaround:** Use `minCharacterCount` as rough proxy

4. **No Navigation Pattern Predicates in Unlocks**
   - **Issue:** Cannot unlock based on `navigationPattern` (`linear` | `exploratory` | `recursive`)
   - **Example Use Case:** "Unlock special node for recursive readers"
   - **Location:** `unlockEvaluator.ts` — No `navigationPattern` condition type
   - **Data Available:** `progress.journeyTracking.navigationPattern` exists but unused

---

### ⚠️ Timing & Reactivity Concerns

5. **Unlock Notifications Require Manual Polling**
   - **Issue:** `recentlyUnlockedNodes[]` is populated but not automatically displayed
   - **Risk:** UI must poll or subscribe; no event emitted
   - **Location:** No built-in notification system
   - **Recommendation:** Add callback/listener in store for unlock events

6. **L3 Cache Invalidation on Any L2 Visit**
   - **Issue:** Cache cleared on **every** L2 visit, even if philosophy doesn't change
   - **Inefficiency:** Rebuilds assembly even if `dominantPhilosophy` unchanged
   - **Location:** `storyStore.ts:932` — Broad invalidation
   - **Optimization:** Only clear if `dominantPhilosophy` actually shifts

7. **Variation Selection Re-runs on Every Awareness Tick**
   - **Issue:** useMemo dependency on `temporalAwareness` means re-selection on every awareness update
   - **Risk:** If awareness updates frequently, variation may flicker
   - **Mitigation:** Awareness updates are discrete (on visit only), so low risk
   - **Recommendation:** Consider debouncing if awareness becomes continuous

8. **No "Variation Locked Until" Mechanic**
   - **Issue:** All variations in a file are candidates if conditions match
   - **Gap:** Cannot mark variations as "unlock after L3 completion" or similar
   - **Use Case:** Progressive revelation of content within same node
   - **Workaround:** Split into separate nodes with unlock configs

---

### 🟡 Missing Convenience Predicates

9. **No Reading Path Sequence Predicates**
   - **Issue:** Cannot unlock based on specific node visitation sequences
   - **Example:** "Unlock if visited arch-L1 → algo-L2-resist → hum-L3 in order"
   - **Available:** `progress.readingPath[]` exists but no evaluator
   - **Related:** `RevealCondition.requiredSequence` exists for connections (Node.ts:81) but not for unlocks

10. **No Revisit Frequency Predicates**
    - **Issue:** Cannot unlock based on `journeyTracking.revisitFrequency`
    - **Example:** "Unlock if revisitFrequency >50% (recursive reader)"
    - **Data Available:** `progress.journeyTracking.revisitFrequency`

11. **No Exploration Metrics Predicates**
    - **Issue:** Cannot unlock based on breadth/depth
    - **Example:** "Unlock if breadth >70% (completionist)" or "depth >3 (deep diver)"
    - **Data Available:** `progress.journeyTracking.explorationMetrics.{breadth, depth}`

12. **No Time-Based Predicates**
    - **Issue:** Cannot unlock based on session duration or time between visits
    - **Example:** "Unlock if totalTimeSpent >30 minutes"
    - **Data Available:** `progress.totalTimeSpent`, `visitRecord.timeSpent`
    - **Gap:** No `timeSpent` condition type

---

### 🟢 Edge Cases & Robustness

13. **L3 Assembly Fallback Always Uses First Variation**
    - **Issue:** If no matching variation, always picks `variations[0]` (l3Assembly.ts:66)
    - **Risk:** May not align with reader's journey
    - **Recommendation:** Prefer variations with `journeyPattern: 'unknown'` + `philosophyDominant: 'unknown'`

14. **Normalization Sets Default `awarenessRange: [0, 100]`**
    - **Issue:** Variations missing `awarenessRange` match all awareness levels
    - **Risk:** Author intent unclear — is it a catch-all or an oversight?
    - **Location:** `variationLoader.ts:79-81`
    - **Recommendation:** Warn in console if `awarenessRange` missing in variation metadata

15. **No Validation for Compound Condition Depth**
    - **Issue:** Compound conditions can nest infinitely (compound → compound → ...)
    - **Risk:** Stack overflow or performance issues
    - **Location:** `unlockEvaluator.ts:260-285` — Recursive without depth limit
    - **Recommendation:** Add max depth check (e.g., 5 levels)

---

## 6. Summary Table — Signal Coverage

| Signal | Variation Selection | Unlock Predicates | Gap? |
|--------|---------------------|-------------------|------|
| Transformation State | ✅ Primary filter | ✅ `transformation` type | — |
| Awareness (0-100) | ✅ Range check | ✅ `awareness` type | — |
| Journey Pattern | ✅ Conditional match | ❌ No predicate | ⚠️ Missing |
| Path Philosophy | ✅ Conditional match | ✅ `philosophy` type | — |
| Visit Count | ❌ Not used | ✅ `visitCount` type | ⚠️ Asymmetric |
| Character Visit % | ⚠️ L3 synthesis only | ✅ `character` type | — |
| Cross-Character Connections | ❌ Not used | ❌ No predicate | 🔴 Missing |
| Navigation Pattern | ❌ Not used | ❌ No predicate | 🔴 Missing |
| Revisit Frequency | ❌ Not used | ❌ No predicate | 🟡 Missing |
| Exploration Metrics | ❌ Not used | ❌ No predicate | 🟡 Missing |
| Reading Path Sequence | ❌ Not used | ❌ No predicate | 🟡 Missing |
| Time Spent | ❌ Not used | ❌ No predicate | 🟡 Missing |
| L3 Assembly Completion | ❌ Not used | ✅ `l3Assembly` type | — |
| Previously Shown Variations | ❌ No dedup | ❌ No predicate | 🔴 Missing |

---

## 7. File Naming Convention Summary

| Layer | Pattern | Example |
|-------|---------|---------|
| L1 | `{char}-L1-variations.json` | `arch-L1-variations.json` |
| L2 | `{char}-L2-{philosophy}-variations.json` | `hum-L2-resist-variations.json` |
| L3 | `{char}-L3-variations.json` | `algo-L3-variations.json` |
| L4 | `final-{alignment}-variations.json` | `final-preserve.json` |
| Unlock | `unlock-config.json` | `eternal-return/unlock-config.json` |
| Selection Matrix | `selection-matrix.json` | *(Loader exists but unused)* |

**Character Prefixes:**
- `arch` = Archaeologist
- `algo` = Algorithm
- `hum` = Last Human
- `conv` = Convergence (L3 only)

**Philosophy Suffixes (L2):**
- `accept`, `resist`, `invest` (note: "invest" not "investigate")

**Alignment Suffixes (L4):**
- `preserve`, `transform`, `release`

---

## 8. Recommendations

### High Priority
1. ✅ **Add variation deduplication** — Track shown variations in `VisitRecord.variationId` (from Task 1)
2. ✅ **Add cross-character connection predicates** — Essential for unlock design
3. ⚠️ **Add visit count range to variation matching** — Enable "visit 3+ specific content"

### Medium Priority
4. ⚠️ **Add navigation pattern predicates** — Unlock special content for linear/exploratory/recursive readers
5. ⚠️ **Optimize L3 cache invalidation** — Only clear if philosophy actually changes
6. ⚠️ **Add unlock notification events** — Emit event when node unlocked (not just queue)

### Low Priority
7. 🟡 **Add reading path sequence predicates** — Unlock based on visitation order
8. 🟡 **Add time-based predicates** — Unlock after X minutes or Y sessions
9. 🟡 **Improve L3 fallback selection** — Prefer catch-all variations over first match
10. 🟡 **Add validation warnings** — Warn if variation missing `awarenessRange`, compound depth >5, etc.

---

**End of Scan**
