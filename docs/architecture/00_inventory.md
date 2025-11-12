# Architecture Inventory — Narramorph

**Generated:** 2025-11-12
**Purpose:** Targeted file map to guide architecture audit
**Scope:** Non-destructive read-only survey of React/TypeScript codebase

---

## 1. Directory Tree (Compact)

```
src/
├── stores/                 (3 files)
│   ├── storyStore.ts       [Main Zustand store, 1428 lines]
│   ├── storyStore.test.ts
│   └── index.ts
├── utils/                  (12 files)
│   ├── contentLoader.ts
│   ├── variationLoader.ts
│   ├── l3Assembly.ts
│   ├── unlockLoader.ts
│   ├── unlockEvaluator.ts
│   ├── conditionEvaluator.ts
│   ├── nodeUtils.ts
│   ├── validation.ts
│   ├── storage.ts
│   ├── errorHandler.ts
│   ├── performanceMonitor.ts
│   └── index.ts
├── types/                  (6 files)
│   ├── index.ts
│   ├── Store.ts
│   ├── Node.ts
│   ├── Story.ts
│   ├── Variation.ts
│   └── Unlock.ts
├── hooks/                  (2 files)
│   ├── useVariationSelection.ts
│   └── index.ts
├── components/
│   ├── ErrorBoundary.tsx
│   └── NodeMap/            (15 files)
│       ├── NodeMap.tsx
│       ├── CustomStoryNode.tsx
│       ├── edgeUtils.ts
│       ├── NodeTooltip.tsx
│       ├── DiscoveryOverlay.tsx
│       ├── BootSequence.tsx
│       ├── CorruptionMeter.tsx
│       ├── DataStreams.tsx
│       ├── GlitchEffect.tsx
│       ├── MemoryFragments.tsx
│       ├── NeuralNetwork.tsx
│       ├── ParallaxBackground.tsx
│       ├── ReadingPathTrail.tsx
│       ├── TemporalDistortion.tsx
│       └── index.ts
├── pages/                  (2 files)
│   ├── Home.tsx
│   └── index.ts
├── main.tsx
└── App.tsx

src/data/stories/eternal-return/
├── story.json              [Story metadata & node graph]
├── archaeologist.json      [Character definition]
├── algorithm.json          [Character definition]
├── human.json              [Character definition]
├── layout.json             [Spatial layout config]
├── unlock-config.json      [Node unlock conditions - 7742 bytes]
├── nodePhilosophyMapping.ts [L2→Philosophy mapping + validation]
└── content/                (292 JSON files total)
    ├── layer1/             [L1 variations: arch, algo, hum]
    ├── layer2/             [L2 variations: accept/resist/invest]
    ├── layer3/
    │   ├── algo-L3-variations.json
    │   └── variations/     [~200+ individual L3 fragments]
    └── layer4/             [L4 terminal variations]

docs/
├── PROJECT_OVERVIEW.md
├── DATA_SCHEMA.md
├── CODEBASE_CONVENTIONS.md
├── L3_ASSEMBLY_IMPLEMENTATION.md
├── NARRATIVE_STRUCTURE.md
└── framework/
    ├── VISION_CRYSTALLIZED.md
    └── FRAMEWORK_COMPLETE.md
```

---

## 2. Functional Area → Candidate Files

| Area | Key Files | Notes |
|------|-----------|-------|
| **Journey State** | `src/stores/storyStore.ts:41-68,493-555` | `JourneyTracking` interface, `createInitialJourneyTracking()`, `updateJourneyTracking()`, `recordL2Choice()` |
| **Variation Selection** | `src/hooks/useVariationSelection.ts` (not read)<br>`src/utils/variationLoader.ts` (not read)<br>`src/stores/storyStore.ts:576-590` (`getConditionContext`) | Hook for runtime selection, loader for file I/O, condition context builder |
| **Unlocks** | `src/utils/unlockLoader.ts` (not read)<br>`src/utils/unlockEvaluator.ts` (not read)<br>`src/types/Unlock.ts` (not read)<br>`src/data/.../unlock-config.json` (not read)<br>`src/stores/storyStore.ts:785-834` | Unlock config schema, evaluator logic, store actions (`evaluateUnlocks`, `getUnlockProgress`) |
| **L3 Assembly** | `src/utils/l3Assembly.ts` (not read)<br>`src/stores/storyStore.ts:594-779` | Fragment selection, parameterization, caching (`l3AssemblyCache`), assembly view state |
| **Content Loading** | `src/utils/contentLoader.ts` (not read)<br>`src/utils/variationLoader.ts` (not read)<br>`src/stores/storyStore.ts:374-451` | File fetch, frontmatter parsing, JSON loading, error handling |
| **Navigation** | `src/components/NodeMap/NodeMap.tsx` (not read)<br>`src/components/NodeMap/CustomStoryNode.tsx` (not read)<br>`src/pages/Home.tsx` (not read)<br>`src/stores/storyStore.ts:836-1004` | Visit recording (`visitNode`), node selection, view routing (L3 detection line 1028) |
| **Type System** | `src/types/Node.ts` (not read)<br>`src/types/Variation.ts` (not read)<br>`src/types/Store.ts` (not read)<br>`src/types/Unlock.ts` (not read)<br>`src/types/index.ts` (read) | Core domain models for nodes, variations, journey patterns, unlock configs |
| **State Utils** | `src/utils/conditionEvaluator.ts` (not read)<br>`src/utils/nodeUtils.ts` (not read)<br>`src/stores/storyStore.ts:462-555` | Journey pattern calculation, philosophy calculation, temporal awareness, node layer detection |
| **Persistence** | `src/utils/storage.ts` (not read)<br>`src/utils/validation.ts` (not read)<br>`src/stores/storyStore.ts:1056-1200` | LocalStorage wrapper, save/load/export/import, migration logic (lines 1080-1153) |

---

## 3. Content Structure Observations

### Story Data (eternal-return)
- **Nodes:** Defined in `story.json` (not yet read)
- **Characters:** 3 JSON files (archaeologist, algorithm, human/lastHuman)
- **Content Files:** 292 total
  - L1: Character introduction variations (~3-6 per character)
  - L2: Philosophy-based variations (accept/resist/invest per character)
  - L3: Fragmented assemblies (~200+ variations organized by prefix: arch-L3, algo-L3, hum-L3, conv-L3)
  - L4: Terminal/convergence variations

### Naming Conventions
- **Node IDs:** Pattern `{char}-L{layer}-{slug}` (e.g., `arch-L2-resist`, `algo-L3-017`)
- **Characters:** `archaeologist`, `algorithm`, `last-human` (normalized to `lastHuman` in tracking)
- **Layers:** L1 (intro), L2 (philosophy), L3 (reflection/convergence), L4 (terminal)

### Philosophy Mapping
- File: `src/data/stories/eternal-return/nodePhilosophyMapping.ts`
- Function: `getNodePhilosophy(nodeId)` + `validateL2PhilosophyMappings(nodeIds)`
- Purpose: Maps L2 node IDs to `accept | resist | invest` choices for journey tracking

---

## 4. Architectural Surfaces Identified

### A. State Management (Zustand + Immer)
- **Store:** `storyStore.ts` (1428 lines, uses Immer middleware for Map/Set support)
- **State Shape:**
  - `nodes: Map<string, StoryNode>`
  - `connections: Map<string, Connection>`
  - `progress: UserProgress` (visitedNodes, readingPath, journeyTracking, temporalAwarenessLevel)
  - `l3AssemblyCache: Map<string, L3Assembly>`
  - `unlockConfigs: Map<string, NodeUnlockConfig>`
- **Key Actions:** `loadStory`, `visitNode`, `updateJourneyTracking`, `openL3AssemblyView`, `evaluateUnlocks`

### B. Variation Selection System
- **Runtime Selection:** Hook-based (likely `useVariationSelection`)
- **Context Input:** `ConditionContext` (awareness, journeyPattern, pathPhilosophy, visitCount, transformationState)
- **L3 Parameterization:** `synthesisPattern` calculated from character visit percentages
- **Cache Strategy:** `l3AssemblyCache` keyed by `{journeyPattern}_{pathPhilosophy}_{awarenessLevel}_{synthesisPattern}`

### C. Unlock/Gating System
- **Config Source:** `unlock-config.json` (7742 bytes)
- **Evaluator:** `unlockEvaluator.ts` with `evaluateNodeUnlock(config, progress)`
- **Legacy Fallback:** L2 nodes check `progress.unlockedL2Characters` if no unlock config exists
- **Notifications:** `recentlyUnlockedNodes` array tracks newly unlocked for UI display

### D. Journey Tracking
- **Data Model:** `JourneyTracking` interface
  - Character visit percentages (archaeologist/algorithm/lastHuman)
  - L2 philosophy choices (accept/resist/invest counts)
  - Cross-character connection tracking (`arch_algo`, `arch_hum`, `algo_hum`)
  - Navigation pattern classification (`linear | exploratory | recursive | undetermined`)
  - Exploration metrics (breadth/depth)
- **Calculations:**
  - Journey pattern: `calculateJourneyPattern(startingCharacter, percentages)`
  - Philosophy: `calculatePathPhilosophy(l2Choices)`
  - Temporal awareness: Diversity bonus + exploration score (max 100)

### E. Navigation & Routing
- **Entry Point:** `Home.tsx` → `NodeMap` component
- **Node Click:** `openStoryView(nodeId)` → Detects L3 nodes (line 1028) and routes to `openL3AssemblyView`
- **Visit Recording:** `visitNode(nodeId)` updates state, triggers unlock evaluation, saves progress
- **Character Switches:** Tracked via `lastCharacterVisited` for cross-character connection metrics

### F. Content Loading Pipeline
- **Entrypoint:** `loadStoryContent(storyId)` in `contentLoader.ts`
- **Data Sources:** JSON files in `src/data/stories/{storyId}/`
- **Variation Loading:** `variationLoader.ts` handles layer-specific file patterns
- **Error Handling:** `ContentLoadError` class for user-friendly failure messages

---

## 5. Critical Dependencies

### External Libraries (Inferred from Store)
- `zustand` (state management)
- `immer` (immutable updates, Map/Set support enabled on line 1)
- React Flow / ReactFlow (likely for NodeMap visualization, edgeUtils.ts present)
- TypeScript (strict type system across codebase)

### Internal Module Graph
```
main.tsx
  └─> App.tsx
       └─> Home.tsx
            └─> NodeMap/
                 ├─> CustomStoryNode
                 ├─> edgeUtils
                 └─> [visual effect components]

storyStore.ts (hub)
  ├─> utils/contentLoader → variationLoader, l3Assembly
  ├─> utils/unlockLoader → unlockEvaluator → conditionEvaluator
  ├─> utils/storage, validation
  ├─> utils/nodeUtils
  └─> types/* (Node, Variation, Store, Unlock)

hooks/useVariationSelection
  └─> storyStore (reads context)
```

---

## 6. Gaps & Open Questions

### Missing or Not Yet Inspected
1. **No `src/state` directory** — All state logic consolidated in `storyStore.ts`
2. **No `src/navigation` or `src/router`** — Routing handled inline in store actions
3. **No `src/lib` directory** — Utilities organized under `src/utils` instead
4. **No Constellation3D component** — 3D UI planned but not implemented (NodeMap is 2D)
5. **StoryView component location** — Not found in scan; likely in components/ but not yet inventoried

### Validation Needs
- [ ] Verify unlock config schema matches evaluator expectations
- [ ] Confirm L3 parameterization covers all journey pattern × philosophy combinations
- [ ] Check variation file naming conventions match loader patterns
- [ ] Validate L2 philosophy mappings completeness (function exists, line 428-436 validates on load)
- [ ] Confirm temporal awareness thresholds (20% for firstRevisit, 50% for metaAware)

### Potential Concerns
- **Large store file:** 1428 lines — May benefit from modularization
- **L3 cache invalidation:** Only cleared on L2 visits — Risk of stale data?
- **Migration logic in store:** Lines 1080-1153 — Consider dedicated migration utility
- **Error boundary coverage:** Single `ErrorBoundary.tsx` — Scope unclear

---

## 7. Next Audit Steps (Recommended Sequence)

1. **Store & State Utils** (Files: `storyStore.ts`, `conditionEvaluator.ts`, `nodeUtils.ts`)
   - Validate journey tracking calculations
   - Review temporal awareness algorithm
   - Check transformation state transitions

2. **Variation Selection** (Files: `useVariationSelection.ts`, `variationLoader.ts`, `l3Assembly.ts`)
   - Trace variation selection flow
   - Verify L3 parameterization logic
   - Audit caching strategy

3. **Unlock System** (Files: `unlockLoader.ts`, `unlockEvaluator.ts`, `unlock-config.json`)
   - Parse unlock config schema
   - Test evaluator edge cases
   - Check notification timing

4. **Content Loading** (Files: `contentLoader.ts`, `variationLoader.ts`)
   - Review file path resolution
   - Check frontmatter parsing
   - Validate error handling

5. **Type System** (Files: `Node.ts`, `Variation.ts`, `Store.ts`, `Unlock.ts`)
   - Map type relationships
   - Check for missing discriminated unions
   - Validate optional vs required fields

6. **Navigation Flow** (Files: `Home.tsx`, `NodeMap.tsx`, `CustomStoryNode.tsx`)
   - Trace user interaction → visit recording
   - Review L3 node detection logic
   - Check routing to StoryView component

---

## 8. Content Inventory Summary

| Layer | File Pattern | Example Count | Purpose |
|-------|--------------|---------------|---------|
| L1 | `{char}-L1-variations.json` | ~3 files | Character introductions |
| L2 | `{char}-L2-{philosophy}-variations.json` | ~9 files | Philosophy-based responses (accept/resist/invest) |
| L3 | `{char}-L3-{id}.json` | ~200+ files | Reflection fragments for dynamic assembly |
| L4 | `final-{philosophy}.json`, `terminal-variations.json` | ~4 files | Convergence/terminal states |

**Total Content Files:** 292 JSON files
**Temporary Files:** `.tmp` suffixes present (likely conversion artifacts)

---

## Appendix: Key Files Not Yet Read

*(Priority for next audit phase)*

- `src/utils/contentLoader.ts` — Content loading pipeline
- `src/utils/variationLoader.ts` — Variation file I/O
- `src/utils/l3Assembly.ts` — L3 fragment assembly logic
- `src/utils/unlockLoader.ts` — Unlock config parsing
- `src/utils/unlockEvaluator.ts` — Unlock condition evaluation
- `src/utils/conditionEvaluator.ts` — Journey pattern/philosophy calculation
- `src/hooks/useVariationSelection.ts` — Runtime variation selection
- `src/types/Node.ts`, `Variation.ts`, `Store.ts`, `Unlock.ts` — Domain models
- `src/components/NodeMap/NodeMap.tsx` — Main visualization component
- `src/data/stories/eternal-return/story.json` — Node graph definition
- `src/data/stories/eternal-return/unlock-config.json` — Unlock rules

---

**End of Inventory**
