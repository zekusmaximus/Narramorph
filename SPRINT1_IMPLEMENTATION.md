# Sprint 1: State Integrity - Implementation Summary

## Overview
Sprint 1 focuses on fixing state integrity issues in the narrative engine, specifically around visit recording timing, variation tracking, and journey state management.

## Completed Tasks

### S1-A: Move Visit Recording to openStoryView Boundary ✅

**Goal**: Ensure visit recording occurs synchronously at navigation intent, not inside useEffect.

**Changes**:
- **src/types/Store.ts**
  - Added `activeVisit` field to StoryStore for tracking current visit session
  - Added `variationId` and `duration` fields to VisitRecord
  - Updated `openStoryView` signature to accept `opts?: { variationId?: string }`
  - Added `finalizeActiveVisit()` method

- **src/stores/storyStore.ts**
  - Moved visit recording from component useEffect to `openStoryView()` action
  - Implemented idempotency check (prevents double-recording same node)
  - Added `activeVisit` state tracking with startTime for duration calculation
  - Implemented `finalizeActiveVisit()` for duration finalization on unmount
  - Records visit with duration: 0 placeholder, finalized on close

- **src/components/StoryView/StoryView.tsx**
  - Removed visit recording from mount useEffect
  - Added cleanup effect that calls `finalizeActiveVisit()` on unmount
  - Visit now recorded once at navigation, finalized on exit

**Benefits**:
- Reliable visit counting (no cancellation/ordering issues)
- Accurate duration tracking (mount to unmount)
- Idempotent (safe to call multiple times)

---

### S1-B: Ensure L3 Visits Are Recorded ✅

**Goal**: L3 assembly visits should be recorded identically to L1/L2 nodes.

**Changes**:
- **src/stores/storyStore.ts**
  - Updated `openL3AssemblyView()` to accept optional `nodeId` parameter
  - Added visit recording logic identical to L1/L2 (same activeVisit pattern)
  - Modified `closeL3AssemblyView()` to finalize activeVisit before closing
  - L3 visits now added to `readingPath` array

- **src/components/UI/L3AssemblyView.tsx**
  - Added cleanup useEffect that calls `finalizeActiveVisit()` on unmount
  - Ensures duration tracking works for L3 nodes

- **src/types/Store.ts**
  - Updated `openL3AssemblyView` signature: `(nodeId?: string) => void`

**Benefits**:
- L3 nodes tracked in `visitedNodes` map (same as L1/L2)
- Duration calculated from mount to unmount
- Consistent visit recording across all node types

---

### S1-C: Add variationId to VisitRecord and Wire Through ✅

**Goal**: Augment visit records with variationId for analytics and de-duplication.

**Changes**:
- **src/types/Store.ts**
  - Added `variationId?: string | null` to VisitRecord
  - Added `updateActiveVisitVariation(variationId: string)` method to StoryStore

- **src/stores/storyStore.ts**
  - Implemented `updateActiveVisitVariation()` to update both activeVisit and visitRecord
  - Modified visit recording to accept variationId in opts parameter
  - VariationId initially undefined, updated after selection completes

- **src/components/StoryView/StoryView.tsx**
  - Added useEffect that calls `updateActiveVisitVariation()` when variationId determined
  - Wires variationId from useVariationSelection hook to store

**Flow**:
```
1. User clicks node → openStoryView(nodeId)
2. Visit recorded with variationId: undefined
3. StoryView mounts → useVariationSelection runs
4. variationId determined → updateActiveVisitVariation(variationId)
5. VisitRecord updated with actual variationId
6. On close → finalizeActiveVisit() adds duration
```

**Benefits**:
- Full traceability of which variations were shown
- Enables variation-based analytics
- Foundation for de-duplication (S1-D)

---

### S1-D: Variation De-duplication (Sliding Window) ✅

**Goal**: Prevent immediate repeats of same variationId using sliding window (last N visits).

**Changes**:
- **src/types/Store.ts**
  - Added `recentVariationIds?: string[]` to VisitRecord (stores last 5, uses last 3 for filtering)
  - Updated `getConditionContext` signature to include `includeRecentVariations` option

- **src/types/Variation.ts**
  - Added `recentVariationIds?: string[]` to ConditionContext

- **src/utils/conditionEvaluator.ts**
  - Implemented `pickNonRepeatingVariation<T>()` pure function:
    - Filters variations used in recent window (default: 3)
    - Falls back to LRU (Least Recently Used) if all were recently used
    - Deterministic (no randomization)
  - Integrated de-duplication into all matching tiers:
    - Exact matches (journey + philosophy)
    - Journey matches
    - Philosophy matches
    - Any matches

- **src/stores/storyStore.ts**
  - Modified visit recording to maintain `recentVariationIds` array (max 5 entries)
  - Updated `getConditionContext()` to include recentVariationIds when requested
  - `updateActiveVisitVariation()` now appends to sliding window

- **src/hooks/useVariationSelection.ts**
  - Updated to call `getConditionContext()` with `includeRecentVariations: true`

**Algorithm**:
```typescript
pickNonRepeatingVariation(candidates, recentIds, windowSize=3):
  1. If no recent history → return first candidate
  2. Get last N (windowSize) variationIds from recent history
  3. Filter candidates to exclude those in window
  4. If any unused → return first unused
  5. Else (all recently used) → return LRU (earliest in window)
  6. Fallback → first candidate
```

**Benefits**:
- No immediate repeats of same variation
- LRU strategy ensures fair rotation when variations exhausted
- Configurable window size (default: 3)
- Works correctly with small variation sets (N < windowSize)

---

### S1-E: Make journeyTracking Required with Safe Defaults ✅

**Goal**: Remove optional/null patterns and eliminate 20+ null checks.

**Changes**:
- **src/types/Variation.ts**
  - Changed `startingCharacter?: ...` to `startingCharacter: ... | null`
  - Changed `dominantCharacter?: ...` to `dominantCharacter: ... | null`
  - Changed `lastCharacterVisited?: ...` to `lastCharacterVisited: ... | null`
  - All JourneyTracking fields now required with explicit null defaults

- **src/types/Store.ts**
  - Changed `journeyTracking?: JourneyTracking` to `journeyTracking: JourneyTracking`
  - No longer optional - always present with safe defaults

- **src/stores/storyStore.ts**
  - Updated `createInitialJourneyTracking()` to initialize all fields explicitly
  - Removed 3 null checks: `if (!journeyTracking) { ... }`
  - Changed checks from `if (!tracking)` to `if (tracking.startingCharacter === null)`
  - Removed lazy initialization guards

- **src/utils/unlockEvaluator.ts**
  - Removed 2 null checks: `if (!tracking) return false;`
  - Can now safely access tracking fields

- **src/components/UI/JourneyTracker.tsx**
  - Removed 3 early return null checks
  - Simplified component logic

- **src/utils/conditionEvaluator.ts**
  - Updated `calculateJourneyPattern()` signature to accept explicit null

**Benefits**:
- Eliminated ~10 defensive null checks
- Clearer intent: `startingCharacter: null` vs `startingCharacter?: undefined`
- Type safety: TypeScript enforces presence of journeyTracking
- No lazy initialization - always present from store creation
- Simpler conditional logic throughout codebase

---

## Testing Recommendations

### S1-A Testing
- [x] Navigate to node - verify visit recorded immediately in console
- [x] Close node - verify duration finalized in console
- [x] Open same node twice - verify "Already viewing" log
- [x] Check localStorage - verify duration and timeSpent accumulate

### S1-B Testing
- [x] Navigate to L3 node (e.g., conv-L3-001)
- [x] Verify console log: "L3 node detected, opening assembly view"
- [x] Verify visit recorded: "[Visit] L3 conv-L3-001: first visit recorded"
- [x] Close L3 view - verify duration finalized
- [x] Check localStorage - L3 node in visitedNodes with timeSpent

### S1-C Testing
- [x] Click any L1/L2 node
- [x] Check console for: "[VariationSelection] Selected <variationId>"
- [x] Check console for: "[Visit] Updated <nodeId> with variationId: <variationId>"
- [x] Inspect localStorage - variationId should match selected variation
- [x] Test L3 nodes - variationId should be null

### S1-D Testing
- [x] Visit same node multiple times (e.g., arch-L1, 4+ times)
- [x] Check console logs for: "[Dedupe] Found N unused variations"
- [x] Verify different variations selected each time
- [x] After exhausting variations, verify LRU rotation
- [x] Check localStorage - recentVariationIds array grows to max 5

### S1-E Testing
- [x] Fresh session (clear localStorage)
- [x] No "Journey tracking not initialized" errors
- [x] Journey tracker UI renders with defaults
- [x] Visit first node - startingCharacter set correctly
- [x] Check localStorage - journeyTracking always present
- [x] Test unlock conditions depending on philosophy/journey
- [x] Verify L3 assembly builds without errors

---

## Files Modified

### Type Definitions
- `src/types/Store.ts` - VisitRecord, StoryStore interface updates
- `src/types/Variation.ts` - JourneyTracking, ConditionContext updates

### Core Store
- `src/stores/storyStore.ts` - Visit recording, active visit tracking, de-duplication

### Components
- `src/components/StoryView/StoryView.tsx` - Visit finalization, variationId wiring
- `src/components/UI/L3AssemblyView.tsx` - L3 visit finalization
- `src/components/UI/JourneyTracker.tsx` - Removed null checks

### Hooks & Utils
- `src/hooks/useVariationSelection.ts` - Include recentVariationIds in context
- `src/utils/conditionEvaluator.ts` - De-duplication logic, type updates
- `src/utils/unlockEvaluator.ts` - Removed null checks

---

## Breaking Changes

None. All changes are backward compatible with existing saves (migration logic handles old format).

## Performance Impact

Minimal. De-duplication adds O(N×M) comparison where N = candidates, M = window size (typically 3-5), which is negligible for typical variation counts (< 50).

---

## Known Limitations

1. **Variation window size** is hardcoded to 3 (configurable in future sprint)
2. **L3 variationIds** are null (L3 uses assembly metadata instead)
3. **Migration** for old saves without new fields is handled gracefully

---

## Next Steps (Future Sprints)

- Sprint 2: Variation selection logic refinements
- Sprint 3: L3 content assembly optimization
- Sprint 4: UI/UX improvements for variation feedback

---

**Implementation Date**: 2025-01-12
**Status**: ✅ Complete and Ready for Review
