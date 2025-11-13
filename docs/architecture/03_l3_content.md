# L3 Assembly & Content I/O Analysis

**Generated:** 2025-11-12
**Scope:** Read-only analysis of L3 parameterization, fragment loading, and content pipeline (Task 3)
**Files Analyzed:** `l3Assembly.ts`, `variationLoader.ts`, `contentLoader.ts`, L3 variation data files

---

## 1. L3 Parameterization — Data Flow

### A. Input Sources (4-Dimensional Parameter Space)

```
Reader State (UserProgress + JourneyTracking)
  │
  ├─► Journey Pattern ────────────► 5 values: started-stayed, started-bounced,
  │                                   shifted-dominant, began-lightly, met-later
  │
  ├─► Path Philosophy ───────────► 3 values: accept, resist, invest
  │                                   (calculated from l2Choices counts)
  │
  ├─► Temporal Awareness ────────► 3 levels: low (<35), medium (35-69), high (70+)
  │                                   (derived from 0-100 numeric awareness)
  │
  └─► Character Visit % ─────────► 3 synthesis patterns:
       (arch%, algo%, hum%)          - single-dominant: one char >60%
                                     - dual-balanced: two chars ~40-50%
                                     - triple-balanced: all ~33% (within 15%)
```

**Calculation Pipeline:**

```
storyStore.visitNode(nodeId)
  │
  ├─► updateTemporalAwareness()
  │    └─► diversityBonus + explorationScore → temporalAwarenessLevel (0-100)
  │
  ├─► updateJourneyTracking()
  │    ├─► calculateJourneyPattern(startingChar, percentages) → JourneyPattern
  │    └─► calculatePathPhilosophy(l2Choices) → PathPhilosophy
  │
  └─► getConditionContext(nodeId?) → ConditionContext
       └─► Used by findMatchingVariation() for selection
```

**File:** `src/stores/storyStore.ts:462-555, 576-590`

---

### B. Synthesis Pattern Calculation

**File:** `src/utils/l3Assembly.ts:19-46`

```typescript
function calculateSynthesisPattern(percentages: {
  archaeologist: number;
  algorithm: number;
  lastHuman: number;
}): SynthesisPattern {
  const max = Math.max(archaeologist, algorithm, lastHuman);

  // Single-dominant: One character >60%
  if (max > 60) return 'single-dominant';

  // Triple-balanced: All within 15% of average (33.3%)
  const avg = (archaeologist + algorithm + lastHuman) / 3;
  const maxDiff = Math.max(
    Math.abs(archaeologist - avg),
    Math.abs(algorithm - avg),
    Math.abs(lastHuman - avg),
  );
  if (maxDiff < 15) return 'triple-balanced'; // Note: Code says "true-triad"

  // Dual-balanced: Two characters dominant
  return 'dual-balanced'; // Note: Code says "balanced-dual"
}
```

**Discrepancy:** Type definition uses `'true-triad'` (Variation.ts:37), calculation returns `'triple-balanced'` (data files use this)

---

### C. L3 Assembly Construction

**File:** `src/utils/l3Assembly.ts:91-147`

**Algorithm:**

```
buildL3Assembly(storyId, context)
  │
  ├─► loadL3Variations(storyId)
  │    └─► Returns: { arch, algo, hum, conv } VariationFiles
  │
  ├─► buildSection('arch', variations.arch, context)
  │    └─► findMatchingVariation(variations, context) → Selected variation
  │         ├─► Filter by transformationState (PRIMARY)
  │         ├─► Filter by awarenessRange
  │         ├─► Filter by journeyPattern (if ≠ 'unknown')
  │         └─► Filter by philosophyDominant (if ≠ 'unknown')
  │
  ├─► buildSection('algo', variations.algo, context)
  ├─► buildSection('hum', variations.hum, context)
  │
  ├─► calculateSynthesisPattern(context.characterVisitPercentages)
  └─► buildSection('conv', variations.conv, context)
       └─► Conv variations include synthesisPattern in metadata

  ◄─► Package into L3Assembly with metadata
       └─► totalWordCount = sum of 4 sections
```

**Cache Key Generation (storyStore.ts:635):**

```typescript
`${journeyPattern}_${pathPhilosophy}_${awarenessLevel}_${synthesisPattern}`;
// Example: "started-stayed_accept_high_single-dominant"
```

**Cache Invalidation Trigger (storyStore.ts:932):**

- On **any** L2 visit (layer 2 node)
- Clears entire `l3AssemblyCache` Map
- Rationale: L2 visits change philosophy, affecting assembly

---

## 2. Fragment Fetch & Concatenation

### A. File Structure (Eternal Return L3)

```
src/data/stories/eternal-return/content/layer3/
├── arch-L3-variations.json         [530KB, 45 variations]
├── algo-L3-variations.json         [538KB, 45 variations]
├── hum-L3-variations.json          [479KB, 45 variations]
├── conv-L3-variations.json         [2.2MB, 135 variations]
└── variations/                     [~200 individual JSON files]
    ├── arch-L3-001.json
    ├── algo-L3-002.json
    ├── conv-L3-103.json
    └── ... (appears to be duplicates or alternative storage)
```

**Variation Count Rationale:**

- **Arch/Algo/Hum:** 5 journey patterns × 3 philosophies × 3 awareness = **45 variations**
- **Conv:** 5 journey × 3 philosophy × 3 awareness × 3 synthesis = **135 variations**

**Note:** `variations/` subdirectory contains individual files but loader only uses aggregated JSON files

---

### B. Variation File Format

**Structure (Array of Variations):**

```json
[
  {
    "variationId": "algo-L3-001",
    "schemaVersion": "1.0.0",
    "id": "algo-L3-001",
    "sectionType": "algo-L3",
    "journeyPattern": "started-stayed",
    "philosophyDominant": "accept",
    "awarenessLevel": "high",
    "content": "... ~900 word narrative fragment ...",
    "metadata": {
      "wordCount": 927,
      "variationId": "algo-L3-001",
      "nodeId": "algo-L3",
      "section": "algorithm",
      "layer": 3,
      "createdDate": "2025-11-04",
      "journeyPattern": "started-stayed",
      "journeyCode": "SS",
      "philosophyDominant": "accept",
      "philosophyCode": "AC",
      "awarenessLevel": "high",
      "awarenessCode": "H",
      "awarenessRange": [71, 100],
      "readableLabel": "SS-AC-H",
      "humanDescription": "Started algorithm, stayed dominant, accept path, high awareness",
      "primaryThemes": ["computational-witness", "temporal-simultaneity"],
      "convergenceAlignment": "preserve"
    }
  },
  ... 44 more variations
]
```

**Convergence Section Adds:**

```json
{
  "metadata": {
    ...
    "synthesisPattern": "single-dominant",  // or "dual-balanced", "triple-balanced"
    "dominantCharacter": "algorithm",
    "characterBalance": [10, 75, 15],       // [arch%, algo%, hum%]
    "multiVoiceIntegration": "...",
    "perspectiveEmphasis": "algorithm-dominant-synthesis"
  }
}
```

---

### C. Loading Mechanism

**File:** `src/utils/variationLoader.ts:20-54, 178-214`

**Vite Glob Imports (Eager):**

```typescript
const l1VariationFiles = import.meta.glob('/src/data/stories/*/content/layer1/*-variations.json', {
  eager: true,
});
const l2VariationFiles = import.meta.glob('/src/data/stories/*/content/layer2/*-variations.json', {
  eager: true,
});
const l3VariationFiles = import.meta.glob('/src/data/stories/*/content/layer3/*-variations.json', {
  eager: true,
});
```

**Special L3 Loader:**

```typescript
function loadL3Variations(storyId: string): {
  arch: VariationFile | null;
  algo: VariationFile | null;
  hum: VariationFile | null;
  conv: VariationFile | null;
} {
  // Iterate l3VariationFiles glob
  // Match by storyId and file name pattern (arch-L3, algo-L3, hum-L3, conv-L3)
  // Return 4-section object
}
```

**Normalization (lines 58-139):**

- Ensures all variations have complete metadata
- Sets defaults for missing fields:
  - `awarenessRange: [0, 100]` if missing
  - `journeyPattern: 'unknown'` if missing
  - `philosophyDominant: 'unknown'` if missing
- Derives `awarenessLevel` from `awarenessRange` midpoint if missing

**Caching:**

- In-memory Map with key `${storyId}:${nodeId}`
- Loaded once per app session (eager import)
- No expiration or size limits

---

### D. Assembly Concatenation

**File:** `src/utils/l3Assembly.ts:152-198`

**Content Assembly Functions:**

1. **Single String (for export/PDF):**

```typescript
getL3AssemblyContent(assembly: L3Assembly): string {
  return [
    `# Archaeologist Perspective\n\n${assembly.arch.content}`,
    `\n\n---\n\n# Algorithm Perspective\n\n${assembly.algo.content}`,
    `\n\n---\n\n# Last Human Perspective\n\n${assembly.hum.content}`,
    `\n\n---\n\n# Convergence\n\n${assembly.conv.content}`,
  ].join('');
}
```

2. **Sectioned Array (for UI rendering):**

```typescript
getL3AssemblySections(assembly: L3Assembly): Array<{
  title: string;
  content: string;
  character: string;
  wordCount: number;
}> {
  return [
    { title: 'Archaeologist Perspective', content: assembly.arch.content, ... },
    { title: 'Algorithm Perspective', content: assembly.algo.content, ... },
    { title: 'Last Human Perspective', content: assembly.hum.content, ... },
    { title: 'Convergence', content: assembly.conv.content, ... },
  ];
}
```

**Expected Word Counts (lines 227-230):**

- Arch/Algo/Hum: 800-1000 words each
- Convergence: 1600-2000 words
- Total: ~4200 words (±500 tolerance)

---

## 3. Content Loader — General Pipeline

### A. Story Loading Architecture

**File:** `src/utils/contentLoader.ts:79-268`

**Data Flow Diagram:**

```
loadStoryContent(storyId)
  │
  ├─► Glob Import: story.json ──────────► StoryMetadataFile
  │                                        ├─ metadata (id, title, author, etc.)
  │                                        ├─ configuration (startNode, etc.)
  │                                        └─ structure (criticalPathNodes, etc.)
  │
  ├─► Glob Import: layout.json ─────────► LayoutFile (node positions)
  │
  ├─► Glob Import: *.json character files ► CharacterNodeFile | CharacterNodeDefinitionFile
  │    │
  │    └─► For each character file:
  │         ├─► Extract node definitions
  │         ├─► Map contentFile paths to variation files
  │         │    └─► L1: content/layer1/{char}-L1-variations.json
  │         │    └─► L2: content/layer2/{char}-L2-{philosophy}-variations.json
  │         │
  │         ├─► Load variation data (L1/L2 only, L3 loaded separately)
  │         ├─► Pick representative content per transformation state
  │         │    └─► initial, firstRevisit, metaAware
  │         │
  │         └─► Build StoryNode objects
  │              ├─ id, character, title, position
  │              ├─ content: { initial, firstRevisit, metaAware }
  │              ├─ connections, visualState, metadata
  │              └─ redirectTo, bridgeMoments
  │
  └─► Return StoryData
       ├─ metadata
       ├─ nodes: StoryNode[]
       ├─ connections: Connection[]
       └─ configuration
```

---

### B. Content Resolution Strategy

**L1/L2 Loading (lines 126-172):**

```typescript
// Determine variation file path from node definition
if (def.layer === 1) {
  actualContentPath = `/src/data/stories/${storyId}/content/layer1/${charPrefix}-L1-variations.json`;
} else if (def.layer === 2) {
  // Try all 3 philosophy paths, use first found
  const paths = [
    `.../${charPrefix}-L2-accept-variations.json`,
    `.../${charPrefix}-L2-resist-variations.json`,
    `.../${charPrefix}-L2-invest-variations.json`,
  ];
  actualContentPath = paths.find((p) => l2VarMap[p]) || null;
}

// Load variation file
const varData = l1VarMap[actualContentPath] || l2VarMap[actualContentPath];

// Pick one variation per transformation state
const pick = (state: 'initial' | 'firstRevisit' | 'metaAware') =>
  varData.variations.find((v) => v.transformationState === state)?.content || '';

// Build node content
content = {
  initial: pick('initial') || pick('firstRevisit'), // Fallback chain
  firstRevisit: pick('firstRevisit'),
  metaAware: pick('metaAware'),
};
```

**Problem:** Picks **first** matching variation regardless of journey/philosophy/awareness. Runtime hook selects actual variation.

---

### C. Frontmatter Extraction

**Status:** ❌ **Not Implemented**

**Observations:**

- No frontmatter parsing in `contentLoader.ts`
- Variation metadata stored in separate `metadata` object, not frontmatter
- Content field contains pure narrative text (no YAML/markdown frontmatter)
- All metadata is structured JSON, not embedded in content

**Example Variation Content (no frontmatter):**

```
"content": "Stream-1 initiates processing Fragment 2749-A at timestamp..."
```

**Metadata is separate:**

```json
"metadata": {
  "wordCount": 927,
  "variationId": "algo-L3-001",
  ...
}
```

---

### D. Pattern Fetching & Wildcards

**Vite Glob Patterns Used:**

| Pattern                                                | Purpose              | Eager? |
| ------------------------------------------------------ | -------------------- | ------ |
| `/src/data/stories/*/story.json`                       | Story metadata       | ✅ Yes |
| `/src/data/stories/*/*.json`                           | Character node files | ✅ Yes |
| `/src/data/stories/*/content/layer1/*-variations.json` | L1 variations        | ✅ Yes |
| `/src/data/stories/*/content/layer2/*-variations.json` | L2 variations        | ✅ Yes |
| `/src/data/stories/*/content/layer3/*-variations.json` | L3 variations        | ✅ Yes |
| `/src/data/stories/*/content/layer4/*-variations.json` | L4 variations        | ✅ Yes |
| `/src/data/stories/*/layout.json`                      | Layout data          | ✅ Yes |
| `/src/data/stories/*/unlock-config.json`               | Unlock configs       | ✅ Yes |

**All eager imports** — Files loaded at build time, bundled into app

**Pattern Matching:**

- Glob patterns are **build-time** (Vite feature)
- Runtime filtering by `storyId` via `path.includes(\`/${storyId}/\`)`
- No lazy loading or on-demand fetching
- No wildcard character support beyond glob syntax

---

### E. Variation Listing Per Node

**General Nodes (L1/L2):**

```typescript
function loadVariationFile(storyId: string, nodeId: string): VariationFile | null {
  // Search all variation files for matching nodeId
  // Return first file where nodeId matches
  // File contains array of all variations for that node
}
```

**L3 Nodes:**

```typescript
function loadL3Variations(storyId: string): {
  arch: VariationFile | null;
  algo: VariationFile | null;
  hum: VariationFile | null;
  conv: VariationFile | null;
} {
  // Returns 4 separate variation files
  // Each contains ~45-135 variations
}
```

**Listing Function:**

```typescript
function getVariations(variationFile: VariationFile | null): Variation[] {
  return variationFile?.variations || [];
}
```

**No filtering API** — Must manually filter by metadata after loading

---

### F. Caching Strategy

**Variation Loader Cache (variationLoader.ts:14-16):**

```typescript
const variationCache = new Map<string, VariationFile>();
// Key: `${storyId}:${nodeId}`
// Value: Normalized VariationFile
// Lifetime: Application session (no expiration)
// Size: Unlimited (no eviction)
```

**L3 Assembly Cache (storyStore.ts:161, 659-661):**

```typescript
l3AssemblyCache: Map<string, L3Assembly>;
// Key: `${journeyPattern}_${pathPhilosophy}_${awarenessLevel}_${synthesisPattern}`
// Value: Built L3Assembly (4 sections)
// Lifetime: Until L2 visit (philosophy change)
// Size: Unlimited
```

**Content Loader Cache:**

- ❌ **None** — `loadStoryContent()` runs on every `loadStory()` call
- Relies on Vite eager imports (already in memory)
- No memoization of built `StoryNode[]` arrays

**Cache Behavior Table:**

| Cache             | Scope         | Invalidation           | Size Limit      |
| ----------------- | ------------- | ---------------------- | --------------- |
| Variation Files   | Per node      | Never (session-scoped) | None            |
| L3 Assembly       | Per param set | On L2 visit            | None            |
| Story Nodes       | ❌ None       | N/A                    | N/A             |
| Vite Glob Imports | Global        | Never (bundled)        | Build-time only |

---

## 4. UI/Engine Decoupling

### A. Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React Components)                                 │
├─────────────────────────────────────────────────────────────┤
│  useVariationSelection(nodeId, fallback)                     │
│    ├─ useMemo with reactive dependencies                    │
│    └─ Returns: { content, variationId, metadata, error }    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Store Layer (Zustand)                                       │
├─────────────────────────────────────────────────────────────┤
│  storyStore                                                  │
│    ├─ getConditionContext(nodeId) → ConditionContext       │
│    ├─ getOrBuildL3Assembly() → L3Assembly                  │
│    └─ State: progress, journeyTracking, nodes, connections  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Engine Layer (Pure Functions)                               │
├─────────────────────────────────────────────────────────────┤
│  findMatchingVariation(variations, context) → Variation     │
│  buildL3Assembly(storyId, context) → L3Assembly             │
│  calculateJourneyPattern(start, %) → JourneyPattern         │
│  calculatePathPhilosophy(l2Choices) → PathPhilosophy        │
│  calculateSynthesisPattern(%) → SynthesisPattern            │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Data Layer (Loaders)                                        │
├─────────────────────────────────────────────────────────────┤
│  loadVariationFile(storyId, nodeId) → VariationFile         │
│  loadL3Variations(storyId) → 4-section object               │
│  loadStoryContent(storyId) → StoryData                      │
└─────────────────────────────────────────────────────────────┘
```

**Decoupling Quality:** ⚠️ **Moderate**

**Strengths:**

- ✅ Engine functions are pure (no side effects)
- ✅ Data loaders are separate from business logic
- ✅ React hook isolates UI from engine

**Weaknesses:**

- ⚠️ Store (Zustand) tightly couples state + logic (1428-line file)
- ⚠️ React hook directly calls loaders (bypasses store abstraction)
- ⚠️ No clear service layer between store and engine

---

### B. Coupling Issues

**1. React Hook → Loader Direct Call**

```typescript
// useVariationSelection.ts:74
const variationFile = loadVariationFile(storyId, nodeId);
```

- Hook bypasses store
- Data loading logic in UI layer
- Hard to test hook without file system

**2. Store → Multiple Engine Functions**

```typescript
// storyStore.ts imports:
import { calculateJourneyPattern, calculatePathPhilosophy } from '@/utils/conditionEvaluator';
import { buildL3Assembly, calculateSynthesisPattern } from '@/utils/l3Assembly';
import { loadUnlockConfig } from '@/utils/unlockLoader';
import { evaluateNodeUnlock, getUnlockProgress } from '@/utils/unlockEvaluator';
```

- Store orchestrates multiple subsystems
- Difficult to swap implementations
- Testing requires mocking many imports

**3. Variation Normalization in Loader**

```typescript
// variationLoader.ts:58-139
function normalizeVariation(variation: any, fileNodeId?: string): Variation {
  // 80+ lines of mutation and default-setting
}
```

- Data transformation mixed with loading
- Defaults hardcoded in loader
- Cannot customize normalization per story

**4. Content Loader Path Mapping Logic**

```typescript
// contentLoader.ts:126-141
if (def.layer === 1) {
  actualContentPath = `/src/data/stories/${storyId}/content/layer1/${charPrefix}-L1-variations.json`;
} else if (def.layer === 2) {
  const paths = [
    /* 3 philosophy paths */
  ];
  actualContentPath = paths.find((p) => l2VarMap[p]) || null;
}
```

- File path conventions hardcoded
- Cannot extend to new layer types
- Layer-specific branching instead of config-driven

---

### C. Interface Gaps

**Observed Interfaces:**

```typescript
// Data Layer → Engine
interface VariationFile {
  nodeId?: string;
  totalVariations?: number;
  variations: Variation[];
}

// Engine → UI
interface ConditionContext {
  nodeId: string;
  awareness: number;
  journeyPattern: JourneyPattern;
  pathPhilosophy: PathPhilosophy;
  visitCount: number;
  transformationState: TransformationState;
  characterVisitPercentages: {...};
}

// Engine → Store
interface L3Assembly {
  arch: L3AssemblySection;
  algo: L3AssemblySection;
  hum: L3AssemblySection;
  conv: L3AssemblySection;
  totalWordCount: number;
  metadata: {...};
}
```

**Missing Interfaces:**

1. **Content Provider Interface**

   ```typescript
   // Needed for swapping data sources
   interface IContentProvider {
     loadStory(storyId: string): Promise<StoryData>;
     loadVariations(storyId: string, nodeId: string): Promise<VariationFile>;
     loadL3Variations(storyId: string): Promise<L3VariationSet>;
   }
   ```

   **Gap:** Loaders are standalone functions, not injectable services

2. **Variation Selection Strategy Interface**

   ```typescript
   // Needed for custom selection algorithms
   interface IVariationSelector {
     selectVariation(variations: Variation[], context: ConditionContext): Variation | null;
   }
   ```

   **Gap:** `findMatchingVariation()` is hardcoded in hook/engine

3. **Assembly Builder Interface**

   ```typescript
   // Needed for alternative assembly strategies
   interface IL3AssemblyBuilder {
     buildAssembly(storyId: string, context: ConditionContext): Promise<L3Assembly>;
     calculateSynthesisPattern(percentages: CharacterPercentages): SynthesisPattern;
   }
   ```

   **Gap:** L3 assembly logic directly imported by store

4. **Cache Strategy Interface**
   ```typescript
   // Needed for pluggable caching
   interface ICache<K, V> {
     get(key: K): V | undefined;
     set(key: K, value: V): void;
     clear(): void;
     invalidate(predicate: (key: K, value: V) => boolean): void;
   }
   ```
   **Gap:** Caches are plain Maps with no abstraction

---

## 5. Quick Refactor Notes

### High Priority Decoupling

**1. Extract Content Service**

```typescript
// New: src/services/ContentService.ts
export class ContentService {
  private variationCache = new Map<string, VariationFile>();

  async loadStory(storyId: string): Promise<StoryData> {
    // Move contentLoader.ts logic here
  }

  loadVariations(storyId: string, nodeId: string): VariationFile | null {
    // Move variationLoader.ts logic here
  }

  loadL3Variations(storyId: string): L3VariationSet {
    // Move L3-specific loading here
  }
}

// Usage in store:
const contentService = new ContentService();
loadStory: async (storyId: string) => {
  const storyData = await contentService.loadStory(storyId);
  set({ storyData, nodes: new Map(storyData.nodes.map((n) => [n.id, n])) });
};
```

**Benefit:** Single injection point for testing, swappable implementations

---

**2. Extract Variation Selection Service**

```typescript
// New: src/services/VariationSelectionService.ts
export class VariationSelectionService {
  selectVariation(
    variations: Variation[],
    context: ConditionContext,
    options?: { excludeIds?: string[] },
  ): Variation | null {
    // Move findMatchingVariation logic here
    // Add deduplication support (from Task 2 gap)
  }

  buildL3Assembly(
    storyId: string,
    context: ConditionContext,
    contentService: ContentService,
  ): L3Assembly | null {
    // Move buildL3Assembly logic here
  }
}

// Usage in hook:
const selectionService = useSelectionService();
const variation = selectionService.selectVariation(variations, context);
```

**Benefit:** Testable without React, strategy pattern for custom selectors

---

**3. Abstract Cache Interface**

```typescript
// New: src/utils/cache.ts
export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  clear(): void;
  invalidate(predicate: (key: K, value: V) => boolean): void;
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
  invalidate(predicate: (k: K, v: V) => boolean) {
    for (const [k, v] of this.map) {
      if (predicate(k, v)) this.map.delete(k);
    }
  }
}

// Usage in store:
l3AssemblyCache: InMemoryCache<string, L3Assembly> = new InMemoryCache();

// Invalidate only on philosophy change (not all L2 visits):
clearL3AssemblyCache: () => {
  const oldPhilosophy = get().progress.journeyTracking?.dominantPhilosophy;
  get().updateJourneyTracking();
  const newPhilosophy = get().progress.journeyTracking?.dominantPhilosophy;

  if (oldPhilosophy !== newPhilosophy) {
    get().l3AssemblyCache.clear();
  }
};
```

**Benefit:** Selective invalidation, testable cache strategies, swappable (LRU, TTL, etc.)

---

**4. Config-Driven Path Mapping**

```typescript
// New: src/config/storyConfig.ts
export interface StoryConfig {
  id: string;
  filePatterns: {
    story: string;
    layout: string;
    characters: string;
    variations: {
      layer1: string;
      layer2: (nodeId: string) => string[];  // Try multiple paths
      layer3: string[];  // 4 files
      layer4: string;
    };
  };
}

const eternalReturnConfig: StoryConfig = {
  id: 'eternal-return',
  filePatterns: {
    story: '/src/data/stories/eternal-return/story.json',
    variations: {
      layer1: '/src/data/stories/eternal-return/content/layer1/{char}-L1-variations.json',
      layer2: (nodeId) => [
        `/src/data/stories/eternal-return/content/layer2/{char}-L2-accept-variations.json`,
        `/src/data/stories/eternal-return/content/layer2/{char}-L2-resist-variations.json`,
        `/src/data/stories/eternal-return/content/layer2/{char}-L2-invest-variations.json`
      ],
      // ...
    }
  }
};

// Usage in ContentService:
loadVariations(storyId: string, nodeId: string): VariationFile | null {
  const config = getStoryConfig(storyId);
  const layer = getNodeLayer(nodeId);
  const pattern = config.filePatterns.variations[`layer${layer}`];
  // ...
}
```

**Benefit:** Extensible to new stories, no hardcoded paths, declarative

---

### Medium Priority Decoupling

**5. Extract Journey Tracking Calculator**

```typescript
// New: src/services/JourneyTrackingService.ts
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

**Benefit:** Pure business logic, unit testable, reusable across stores

---

**6. Separate Variation Normalization**

```typescript
// New: src/utils/variationNormalizer.ts
export interface NormalizationOptions {
  defaultAwarenessRange?: [number, number];
  defaultJourneyPattern?: JourneyPattern;
  defaultPhilosophy?: PathPhilosophy;
}

export function normalizeVariation(variation: any, options?: NormalizationOptions): Variation {
  // Move from variationLoader.ts:58-139
  // Use options instead of hardcoded defaults
}

// Usage:
const normalized = normalizeVariation(rawVariation, {
  defaultAwarenessRange: [0, 100],
  defaultJourneyPattern: 'unknown',
});
```

**Benefit:** Configurable defaults, separated from loading, testable

---

**7. Add Validation Layer**

```typescript
// New: src/utils/l3Validator.ts
export interface L3ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateL3Assembly(assembly: L3Assembly): L3ValidationResult {
  // Move from l3Assembly.ts:203-244
  // Add more validations:
  // - Check synthesis pattern matches character percentages
  // - Validate convergenceAlignment consistency across sections
  // - Check metadata completeness
}

export function validateL3VariationFile(file: VariationFile): L3ValidationResult {
  // New: Validate coverage of parameter space
  // - Check all 45/135 combinations present
  // - Warn on duplicate variationIds
  // - Validate awarenessRange coverage
}
```

**Benefit:** Comprehensive validation, separate from assembly logic

---

## 6. Data Flow Summary Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                    READER INTERACTION                              │
│                    (Node Visit)                                    │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STORE: visitNode(nodeId)                                        │
│    ├─► Update visit records (count, timestamps)                 │
│    ├─► Update character visit counts                            │
│    ├─► updateTemporalAwareness() → 0-100 awareness             │
│    ├─► updateJourneyTracking()                                  │
│    │    ├─► calculateJourneyPattern() → JourneyPattern          │
│    │    └─► calculatePathPhilosophy() → PathPhilosophy         │
│    ├─► Clear L3 cache if L2 visit                              │
│    └─► saveProgress()                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI: useVariationSelection(nodeId)                               │
│    ├─► getConditionContext(nodeId) → ConditionContext          │
│    │    └─► { awareness, journeyPattern, pathPhilosophy,       │
│    │         visitCount, transformationState, char% }           │
│    │                                                             │
│    ├─► loadVariationFile(storyId, nodeId) → VariationFile      │
│    │    └─► [Variation, Variation, ...] (45 for L1/L2)         │
│    │                                                             │
│    └─► findMatchingVariation(variations, context)              │
│         ├─ Filter: transformationState (MUST match)             │
│         ├─ Filter: awarenessRange (must contain awareness)      │
│         ├─ Filter: journeyPattern (if not 'unknown')            │
│         ├─ Filter: philosophyDominant (if not 'unknown')        │
│         └─► Selected Variation (or first as fallback)          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RENDER: Display variation.content                               │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║              L3 ASSEMBLY PATH (Separate Flow)                  ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: openL3AssemblyView() or getOrBuildL3Assembly()        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STORE: Check cache                                              │
│    ├─► Generate cache key:                                      │
│    │    `${journeyPattern}_${pathPhil}_${awareness}_${synth}`  │
│    │                                                             │
│    ├─► If cached: return L3Assembly                            │
│    │                                                             │
│    └─► If not cached:                                           │
│         └─► buildL3Assembly(storyId, context)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: buildL3Assembly()                                       │
│    ├─► loadL3Variations(storyId)                               │
│    │    └─► { arch, algo, hum, conv } VariationFiles           │
│    │                                                             │
│    ├─► For each section (arch, algo, hum):                     │
│    │    └─► findMatchingVariation(variations, context)         │
│    │         └─► Filter by state, awareness, journey, phil     │
│    │                                                             │
│    ├─► calculateSynthesisPattern(char%)                        │
│    │    └─► single-dominant | dual-balanced | triple-balanced  │
│    │                                                             │
│    ├─► buildSection('conv', variations.conv, context)          │
│    │    └─► Uses synthesisPattern in metadata                  │
│    │                                                             │
│    └─► Package into L3Assembly                                 │
│         ├─ 4 sections (arch, algo, hum, conv)                  │
│         ├─ totalWordCount (~4200)                              │
│         └─ metadata (journey, phil, awareness, synthesis)      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CACHE & RETURN                                                  │
│    ├─► Store in l3AssemblyCache                                │
│    ├─► Set currentL3Assembly                                   │
│    └─► Open l3AssemblyViewOpen = true                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI: Render 4 sections                                           │
│    ├─► Archaeologist Perspective (800-1000 words)              │
│    ├─► Algorithm Perspective (800-1000 words)                  │
│    ├─► Last Human Perspective (800-1000 words)                 │
│    └─► Convergence (1600-2000 words)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Critical Observations

### 🔴 Tight Coupling Points

1. **useVariationSelection Hook → variationLoader Direct Import**
   - Bypasses store abstraction
   - Hard to mock for testing
   - Cannot swap loader implementation

2. **storyStore → Multiple Engine Imports**
   - 12+ imports from utils/ (conditionEvaluator, l3Assembly, unlockLoader, etc.)
   - Orchestration logic mixed with state management
   - Difficult to extract business logic for reuse

3. **variationLoader Normalization Side Effects**
   - Mutates variation objects during load
   - Hardcoded defaults (awarenessRange: [0, 100])
   - Cannot customize per-story or per-layer

4. **contentLoader Path Logic Hardcoded**
   - Layer-specific if/else branching (lines 126-141)
   - File naming conventions embedded in code
   - Cannot extend to new layer types without code changes

---

### ⚠️ Missing Abstractions

5. **No Content Provider Interface**
   - Functions instead of injectable services
   - Cannot swap data sources (API, database, etc.)
   - Hard to test with fixtures

6. **No Cache Strategy Abstraction**
   - Plain `Map<>` instances
   - No TTL, LRU, or size limits
   - Invalidation logic scattered (storyStore.ts:932, variationLoader.ts:263)

7. **No Variation Selection Strategy**
   - `findMatchingVariation()` hardcoded
   - Cannot plug in A/B testing logic
   - No deduplication support (Task 2 gap)

8. **No Validation Pipeline**
   - Validation mixed with loading (contentLoader.ts:270-288)
   - L3 validation separate (l3Assembly.ts:203-244)
   - No comprehensive pre-load checks

---

### 🟢 Strengths

9. **Pure Engine Functions**
   - `calculateJourneyPattern()`, `calculatePathPhilosophy()` have no side effects
   - Easy to unit test
   - Composable

10. **Eager Loading via Vite Glob**
    - All content bundled at build time
    - No runtime network requests
    - Fast lookups (in-memory)

11. **Layered Parameterization**
    - 4-dimensional parameter space well-defined
    - Journey, philosophy, awareness, synthesis cleanly separated
    - Extensible to new dimensions

12. **L3 Assembly Validation**
    - Word count checks (l3Assembly.ts:227-230)
    - Section presence validation
    - Expected ranges documented

---

## 8. Recommended Refactoring Sequence

### Phase 1: Service Extraction (1-2 weeks)

1. ✅ Extract `ContentService` class (move contentLoader.ts + variationLoader.ts)
2. ✅ Extract `VariationSelectionService` class (move findMatchingVariation + buildL3Assembly)
3. ✅ Extract `JourneyTrackingService` class (move calculation functions)
4. ✅ Inject services into store via constructor/provider pattern

### Phase 2: Abstraction Layers (1 week)

5. ✅ Create `ICache<K, V>` interface + `InMemoryCache` implementation
6. ✅ Create `IContentProvider` interface with multiple implementations
7. ✅ Create config-driven path mapping (`StoryConfig` interface)
8. ✅ Separate normalization into standalone utility with options

### Phase 3: Testing & Validation (1 week)

9. ✅ Add comprehensive L3 validation (coverage, duplicates, metadata)
10. ✅ Unit test services with mock providers
11. ✅ Integration tests for full selection pipeline
12. ✅ Add performance benchmarks for cache effectiveness

### Phase 4: Optimization (optional)

13. ⚠️ Selective L3 cache invalidation (only on philosophy change)
14. ⚠️ Add variation deduplication tracking (Task 2 gap)
15. ⚠️ Implement LRU cache with size limits for production
16. ⚠️ Add lazy loading for L4 variations (currently eager)

---

**End of Analysis**
