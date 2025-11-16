# Narramorph Fiction: Implementation Conventions

**Last Updated**: 2025-11-08 **Phase**: Implementation (Narrative 99.8% Complete)

This document defines conventions for implementing the Narramorph platform now that narrative content is nearly complete. Focus areas: data formatting, selection algorithms, variation management, and UI implementation.

---

## Table of Contents

1. [Project Status & Next Steps](#project-status--next-steps)
2. [JSON Data Format Conventions](#json-data-format-conventions)
3. [File Organization](#file-organization)
4. [Selection Algorithm Patterns](#selection-algorithm-patterns)
5. [TypeScript Implementation](#typescript-implementation)
6. [Helpful Scripts](#helpful-scripts)
7. [Data Integrity & Validation](#data-integrity--validation)
8. [Performance Patterns](#performance-patterns)
9. [UI/UX Conventions](#uiux-conventions)

---

## Project Status & Next Steps

**Current Status**: 1,230 / 1,233 variations complete (99.8%)

- ✅ Layer 1: 240 variations complete (3 nodes × 80 variations each)
- ✅ Layer 2: 720 variations complete (9 nodes × 80 variations each)
- ✅ Layer 3: 270 modular variations complete (45 arch + 45 algo + 45 hum + 135 conv)
- ⚠️ Layer 4: 0/3 terminal variations (in progress)

**Next Steps**:

1. Complete 3 Layer 4 terminal variations (~3,000 words each)
2. Implement L3 selection algorithm (Journey Pattern × Path Philosophy × Awareness)
3. Implement L4 selection algorithm (based on complete journey)
4. Build variation loading system (lazy load from 1,233 variations)
5. Create selection matrix lookup tables
6. Implement UI for node map, story view, and progression tracking

---

## JSON Data Format Conventions

### Layer 1 & Layer 2 Node Files

Each L1/L2 node contains 80 variations in a single JSON file.

**Structure**:

```json
{
  "id": "arch-L2-accept",
  "character": "archaeologist",
  "layer": 2,
  "title": "The Authentication Protocol",
  "position": { "x": 200, "y": 150 },
  "variations": [
    {
      "id": "arch-L2-accept-initial",
      "state": "initial",
      "content": "# Markdown content here...",
      "conditions": {
        "visitCount": 1
      }
    },
    {
      "id": "arch-L2-accept-FR-001",
      "state": "firstRevisit",
      "content": "# Markdown content...",
      "conditions": {
        "visitCount": 2,
        "temporalAwareness": { "min": 0, "max": 20 },
        "priorNodes": ["arch-L1"]
      }
    }
    // ... 78 more variations
  ],
  "connections": [
    {
      "targetId": "layer3-convergence",
      "type": "temporal",
      "label": "Continue to convergence"
    }
  ],
  "visualState": {
    "defaultColor": "#4A90E2",
    "size": 30
  },
  "metadata": {
    "estimatedReadTime": 4,
    "thematicTags": ["authentication", "methodology"],
    "narrativeAct": 1,
    "criticalPath": true
  }
}
```

**Variation Breakdown**:

- **1 Initial**: `visitCount: 1`
- **46 FirstRevisit**: `visitCount: 2`, varying temporal awareness and prior nodes
- **33 MetaAware**: `visitCount: 3+`, high temporal awareness

**File Locations**:

```
/data/stories/eternal-return/content/
  layer1/
    archaeologist/arch-L1.json  (80 variations)
    algorithm/algo-L1.json       (80 variations)
    last-human/hum-L1.json       (80 variations)
  layer2/
    archaeologist/
      arch-L2-accept.json  (80 variations)
      arch-L2-resist.json  (80 variations)
      arch-L2-invest.json  (80 variations)
    algorithm/
      algo-L2-accept.json  (80 variations)
      algo-L2-resist.json  (80 variations)
      algo-L2-invest.json  (80 variations)
    last-human/
      hum-L2-accept.json   (80 variations)
      hum-L2-resist.json   (80 variations)
      hum-L2-invest.json   (80 variations)
```

### Layer 3 Modular Variations

Each L3 variation is a separate JSON file (270 total files).

**Character Section Format** (arch-L3-001.json through arch-L3-045.json):

```json
{
  "id": "arch-L3-023",
  "sectionType": "arch-L3",
  "selectionKey": {
    "journeyPattern": "Started-Stayed",
    "pathPhilosophy": "accept",
    "awarenessLevel": "high"
  },
  "content": "# Markdown content (800-1200 words)...",
  "metadata": {
    "wordCount": 1050,
    "thematicTags": ["methodology", "observation", "documentation"],
    "characterVoices": ["archaeologist"]
  }
}
```

**Synthesis Section Format** (conv-L3-001.json through conv-L3-135.json):

```json
{
  "id": "conv-L3-078",
  "sectionType": "conv-L3",
  "selectionKey": {
    "journeyPattern": "Shifted-Dominant",
    "pathPhilosophy": "resist",
    "awarenessLevel": "maximum"
  },
  "content": "# Markdown synthesizing multiple voices...",
  "metadata": {
    "wordCount": 1100,
    "thematicTags": ["consciousness", "resistance", "agency"],
    "characterVoices": ["archaeologist", "algorithm", "last-human"]
  }
}
```

**Selection Matrix** (selection-matrix.json):

```json
{
  "version": "1.0.0",
  "selectionMatrix": {
    "arch-L3": [
      {
        "variationId": "arch-L3-001",
        "journeyPattern": "Started-Stayed",
        "pathPhilosophy": "accept",
        "awarenessLevel": "medium"
      },
      {
        "variationId": "arch-L3-002",
        "journeyPattern": "Started-Stayed",
        "pathPhilosophy": "accept",
        "awarenessLevel": "high"
      }
      // ... 43 more entries (3×3×5 = 45 total per character)
    ],
    "algo-L3": [
      // ... 45 entries
    ],
    "hum-L3": [
      // ... 45 entries
    ],
    "conv-L3": [
      // ... 135 entries (3×3×5×3 for multi-voice synthesis)
    ]
  }
}
```

**File Locations**:

```
/data/stories/eternal-return/content/
  layer3/
    variations/
      arch-L3-001.json through arch-L3-045.json  (45 files)
      algo-L3-001.json through algo-L3-045.json  (45 files)
      hum-L3-001.json through hum-L3-045.json    (45 files)
      conv-L3-001.json through conv-L3-135.json  (135 files)
    selection-matrix.json  (lookup table)
```

### Layer 4 Terminal Variations

Each L4 variation is a complete philosophical endpoint (3 total files).

**Terminal Variation Format** (final-preserve.json):

```json
{
  "id": "final-preserve",
  "philosophy": "preserve",
  "content": "# Complete terminal variation (~3,000 words)...",
  "voiceSynthesis": {
    "archaeologist": "Methodological documentation woven throughout",
    "algorithm": "Pattern recognition integrated",
    "lastHuman": "Emotional memory embedded",
    "unified": "Three perspectives merge into preservation philosophy"
  },
  "metadata": {
    "wordCount": 3200,
    "thematicTags": ["preservation", "consciousness", "archive", "continuity"],
    "philosophicalResolution": "Consciousness preserves all patterns, accepting eternal observation"
  }
}
```

**File Locations**:

```
/data/stories/eternal-return/content/
  layer4/
    final-preserve.json   (preserve philosophy)
    final-release.json    (release philosophy)
    final-transform.json  (transform philosophy)
```

---

## File Organization

```
narramorph-fiction/
├── data/
│   └── stories/
│       └── eternal-return/
│           ├── story.json                    # Metadata & configuration
│           └── content/
│               ├── layer1/                   # 3 nodes × 80 = 240 variations
│               ├── layer2/                   # 9 nodes × 80 = 720 variations
│               ├── layer3/                   # 270 modular variations
│               │   ├── variations/           # Individual variation files
│               │   └── selection-matrix.json # Lookup table
│               └── layer4/                   # 3 terminal variations
├── src/
│   ├── algorithms/
│   │   ├── l3-selection.ts           # L3 variation selection algorithm
│   │   ├── l4-selection.ts           # L4 terminal selection algorithm
│   │   └── variation-loader.ts       # Lazy loading & caching
│   ├── types/
│   │   ├── Node.ts                   # StoryNode, L3Variation, L4Terminal
│   │   ├── Selection.ts              # JourneyPattern, PathPhilosophy, etc.
│   │   └── UserProgress.ts           # Progress tracking types
│   ├── stores/
│   │   ├── storyStore.ts             # Main state management
│   │   └── progressStore.ts          # User progress tracking
│   ├── components/
│   │   ├── NodeMap/                  # Interactive node visualization
│   │   ├── StoryView/                # Story reading interface
│   │   └── ProgressTracker/          # Journey visualization
│   └── utils/
│       ├── validation.ts             # Data validation
│       └── storage.ts                # localStorage management
├── scripts/
│   ├── validate-variations.ts        # Validate all 1,233 variations
│   ├── generate-selection-matrix.ts  # Generate L3 lookup table
│   ├── check-word-counts.ts          # Verify word count ranges
│   └── migrate-data.ts               # Data migration utilities
└── tests/
    ├── algorithms/
    │   ├── l3-selection.test.ts
    │   └── l4-selection.test.ts
    └── data/
        └── validation.test.ts
```

---

## Selection Algorithm Patterns

### Layer 3 Selection Algorithm

**Purpose**: Select 4 sections from 270-variation pool based on reader's journey.

**Algorithm Steps**:

1. **Calculate Journey Pattern** (per character):

```typescript
function calculateJourneyPattern(character: CharacterType, visitHistory: UserProgress): JourneyPattern {
  const charNodes = getCharacterNodes(character, visitHistory);
  const firstVisit = visitHistory.readingPath[0];
  const totalVisits = charNodes.reduce((sum, node) => sum + (visitHistory.visitedNodes[node]?.visitCount || 0), 0);

  // Started-Stayed: Started with this character, stayed focused
  if (firstVisit.startsWith(character) && totalVisits >= 8) {
    return 'Started-Stayed';
  }

  // Started-Bounced: Started with this character, bounced to others
  if (firstVisit.startsWith(character) && totalVisits < 8) {
    return 'Started-Bounced';
  }

  // Shifted-Dominant: Started elsewhere, this became dominant
  if (!firstVisit.startsWith(character) && totalVisits >= 8) {
    return 'Shifted-Dominant';
  }

  // Began-Lightly: Started with character but light engagement
  if (firstVisit.startsWith(character) && totalVisits >= 4 && totalVisits < 8) {
    return 'Began-Lightly';
  }

  // Met-Later: Encountered this character later
  return 'Met-Later';
}
```

2. **Calculate Path Philosophy**:

```typescript
function calculatePathPhilosophy(visitHistory: UserProgress): PathPhilosophy {
  const pathCounts = {
    accept: 0,
    resist: 0,
    invest: 0,
  };

  // Count L2 branch types visited
  for (const nodeId in visitHistory.visitedNodes) {
    if (nodeId.includes('-L2-')) {
      const branch = nodeId.split('-')[2] as PathPhilosophy;
      pathCounts[branch]++;
    }
  }

  // Return dominant philosophy
  return Object.keys(pathCounts).reduce((a, b) => (pathCounts[a] > pathCounts[b] ? a : b)) as PathPhilosophy;
}
```

3. **Calculate Awareness Level**:

```typescript
function calculateAwarenessLevel(temporalAwareness: number): AwarenessLevel {
  if (temporalAwareness >= 71) return 'maximum';
  if (temporalAwareness >= 41) return 'high';
  return 'medium';
}
```

4. **Determine Character Order**:

```typescript
function determineCharacterOrder(visitHistory: UserProgress): CharacterType[] {
  const engagement = {
    archaeologist: 0,
    algorithm: 0,
    'last-human': 0,
  };

  // Calculate engagement score per character
  for (const [nodeId, record] of Object.entries(visitHistory.visitedNodes)) {
    if (nodeId.startsWith('arch-')) engagement.archaeologist += record.visitCount;
    if (nodeId.startsWith('algo-')) engagement.algorithm += record.visitCount;
    if (nodeId.startsWith('hum-')) engagement['last-human'] += record.visitCount;
  }

  // Sort by engagement, return top 2 for sections 1 and 3
  return Object.keys(engagement).sort((a, b) => engagement[b] - engagement[a]) as CharacterType[];
}
```

5. **Assemble L3 Node**:

```typescript
function assembleL3Node(visitHistory: UserProgress, temporalAwareness: number, selectionMatrix: SelectionMatrix): L3ConvergenceNode {
  const pathPhilosophy = calculatePathPhilosophy(visitHistory);
  const awarenessLevel = calculateAwarenessLevel(temporalAwareness);
  const characterOrder = determineCharacterOrder(visitHistory);

  const journeyPatterns = {
    archaeologist: calculateJourneyPattern('archaeologist', visitHistory),
    algorithm: calculateJourneyPattern('algorithm', visitHistory),
    'last-human': calculateJourneyPattern('last-human', visitHistory),
  };

  // Select variations
  const section1Key = {
    journeyPattern: journeyPatterns[characterOrder[0]],
    pathPhilosophy,
    awarenessLevel,
  };
  const section3Key = {
    journeyPattern: journeyPatterns[characterOrder[1]],
    pathPhilosophy,
    awarenessLevel,
  };

  // Lookup from selection matrix
  const section1 = selectVariation(`${characterOrder[0]}-L3`, section1Key, selectionMatrix);
  const section2 = selectVariation('conv-L3', section1Key, selectionMatrix);
  const section3 = selectVariation(`${characterOrder[1]}-L3`, section3Key, selectionMatrix);
  const section4 = selectVariation('conv-L3', section3Key, selectionMatrix);

  return {
    id: 'L3-convergence',
    layer: 3,
    sections: [section1, section2, section3, section4],
    selectionCriteria: {
      characterOrder,
      journeyPatterns,
      pathPhilosophy,
      awarenessLevel,
    },
  };
}
```

### Layer 4 Selection Algorithm

**Purpose**: Select one of three terminal variations based on complete journey.

```typescript
function selectTerminalPhilosophy(
  visitHistory: UserProgress,
  l3Experience: L3ConvergenceNode,
  temporalAwareness: number,
): TerminalPhilosophy {
  // Calculate L2 path dominance
  const pathCounts = {
    accept: 0,
    resist: 0,
    invest: 0,
  };

  for (const nodeId in visitHistory.visitedNodes) {
    if (nodeId.includes('-L2-')) {
      const branch = nodeId.split('-')[2] as PathPhilosophy;
      pathCounts[branch] += visitHistory.visitedNodes[nodeId].visitCount;
    }
  }

  // Weight factors
  const acceptWeight = pathCounts.accept;
  const resistWeight = pathCounts.resist;
  const investWeight = pathCounts.invest;
  const awarenessWeight = temporalAwareness / 100;

  // Selection logic
  const preserveScore = acceptWeight * 2 + awarenessWeight * 10;
  const releaseScore = resistWeight * 2 + (1 - awarenessWeight) * 10;
  const transformScore = investWeight * 2 + Math.abs(awarenessWeight - 0.5) * 20;

  const scores = {
    preserve: preserveScore,
    release: releaseScore,
    transform: transformScore,
  };

  return Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b)) as TerminalPhilosophy;
}
```

---

## TypeScript Implementation

### Core Types (from DATA_SCHEMA.md)

```typescript
// Journey Pattern (5 options)
type JourneyPattern = 'Started-Stayed' | 'Started-Bounced' | 'Shifted-Dominant' | 'Began-Lightly' | 'Met-Later';

// Path Philosophy (3 options)
type PathPhilosophy = 'accept' | 'resist' | 'invest';

// Awareness Level (3 options)
type AwarenessLevel = 'medium' | 'high' | 'maximum';

// L3 Variation Key (3×3×5 = 45 combinations)
interface L3VariationKey {
  journeyPattern: JourneyPattern;
  pathPhilosophy: PathPhilosophy;
  awarenessLevel: AwarenessLevel;
}

// L3 Variation
interface L3Variation {
  id: string;
  sectionType: 'arch-L3' | 'algo-L3' | 'hum-L3' | 'conv-L3';
  selectionKey: L3VariationKey;
  content: string;
  metadata: {
    wordCount: number;
    thematicTags: string[];
    characterVoices: CharacterType[];
  };
}

// L4 Terminal Variation
interface L4TerminalVariation {
  id: string;
  philosophy: 'preserve' | 'release' | 'transform';
  content: string;
  voiceSynthesis: {
    archaeologist: string;
    algorithm: string;
    lastHuman: string;
    unified: string;
  };
  metadata: {
    wordCount: number;
    thematicTags: string[];
    philosophicalResolution: string;
  };
}
```

### Selection Matrix Type

```typescript
interface SelectionMatrix {
  version: string;
  selectionMatrix: {
    'arch-L3': Array<{
      variationId: string;
      journeyPattern: JourneyPattern;
      pathPhilosophy: PathPhilosophy;
      awarenessLevel: AwarenessLevel;
    }>;
    'algo-L3': Array<{...}>;
    'hum-L3': Array<{...}>;
    'conv-L3': Array<{...}>;
  };
}
```

---

## Helpful Scripts

### 1. Validate All Variations

**Purpose**: Ensure all 1,233 variations meet format requirements.

```bash
npm run validate-variations
```

**Implementation** (scripts/validate-variations.ts):

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateL1L2Node(filePath: string): ValidationResult {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const errors: string[] = [];

  // Check required fields
  if (!data.id) errors.push('Missing id');
  if (!data.variations || !Array.isArray(data.variations)) {
    errors.push('Missing or invalid variations array');
  }

  // Check variation count
  if (data.variations.length !== 80) {
    errors.push(`Expected 80 variations, found ${data.variations.length}`);
  }

  // Validate each variation
  data.variations.forEach((v, i) => {
    if (!v.id) errors.push(`Variation ${i}: missing id`);
    if (!v.content) errors.push(`Variation ${i}: missing content`);
    if (!v.state) errors.push(`Variation ${i}: missing state`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateL3Variation(filePath: string): ValidationResult {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const errors: string[] = [];

  if (!data.id) errors.push('Missing id');
  if (!data.sectionType) errors.push('Missing sectionType');
  if (!data.selectionKey) errors.push('Missing selectionKey');
  if (!data.content) errors.push('Missing content');

  // Validate selection key
  if (data.selectionKey) {
    if (
      !['Started-Stayed', 'Started-Bounced', 'Shifted-Dominant', 'Began-Lightly', 'Met-Later'].includes(data.selectionKey.journeyPattern)
    ) {
      errors.push('Invalid journeyPattern');
    }
    if (!['accept', 'resist', 'invest'].includes(data.selectionKey.pathPhilosophy)) {
      errors.push('Invalid pathPhilosophy');
    }
    if (!['medium', 'high', 'maximum'].includes(data.selectionKey.awarenessLevel)) {
      errors.push('Invalid awarenessLevel');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Run validation on all files
console.log('Validating all variations...');
// ... implementation
```

### 2. Generate Selection Matrix

**Purpose**: Generate selection-matrix.json from L3 variation files.

```bash
npm run generate-selection-matrix
```

**Implementation** (scripts/generate-selection-matrix.ts):

```typescript
import * as fs from 'fs';
import * as path from 'path';

function generateSelectionMatrix() {
  const matrix = {
    version: '1.0.0',
    selectionMatrix: {
      'arch-L3': [],
      'algo-L3': [],
      'hum-L3': [],
      'conv-L3': [],
    },
  };

  const l3Dir = path.join(__dirname, '../data/stories/eternal-return/content/layer3/variations');
  const files = fs.readdirSync(l3Dir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const data = JSON.parse(fs.readFileSync(path.join(l3Dir, file), 'utf8'));
    const sectionType = data.sectionType;

    matrix.selectionMatrix[sectionType].push({
      variationId: data.id,
      journeyPattern: data.selectionKey.journeyPattern,
      pathPhilosophy: data.selectionKey.pathPhilosophy,
      awarenessLevel: data.selectionKey.awarenessLevel,
    });
  }

  // Write to file
  fs.writeFileSync(path.join(l3Dir, '../selection-matrix.json'), JSON.stringify(matrix, null, 2));

  console.log('Selection matrix generated successfully');
}

generateSelectionMatrix();
```

### 3. Check Word Counts

**Purpose**: Verify all variations meet word count guidelines.

```bash
npm run check-word-counts
```

**Implementation** (scripts/check-word-counts.ts):

```typescript
function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter((word) => word.length > 0).length;
}

function checkWordCounts() {
  const results = {
    l1: { min: Infinity, max: 0, avg: 0 },
    l2: { min: Infinity, max: 0, avg: 0 },
    l3: { min: Infinity, max: 0, avg: 0 },
    l4: { min: Infinity, max: 0, avg: 0 },
  };

  // Check each layer...
  // Report violations of word count guidelines
}
```

### 4. Data Migration Utility

**Purpose**: Migrate data between schema versions.

```bash
npm run migrate-data -- --from 0.9.0 --to 1.0.0
```

---

## Data Integrity & Validation

### Validation Checklist

Before deploying:

- [ ] All 1,233 variations present (240 L1 + 720 L2 + 270 L3 + 3 L4)
- [ ] All L3 variations have valid selection keys (3×3×5 combinations)
- [ ] Selection matrix contains all 270 L3 variations
- [ ] All markdown content is valid (no syntax errors)
- [ ] Word counts within guidelines
- [ ] All node IDs follow conventions
- [ ] All connections reference valid target nodes
- [ ] No duplicate variation IDs
- [ ] All metadata fields populated

### Test Coverage Requirements

**Unit Tests**:

- Selection algorithm functions (L3 & L4)
- Variation loading & caching
- UserProgress calculations
- Data validation functions

**Integration Tests**:

- Complete L3 assembly from user journey
- L4 selection from complete journey
- Variation loading performance (1,233 files)
- localStorage persistence

**Data Tests**:

- JSON schema validation
- Selection matrix completeness
- Word count compliance
- Cross-reference integrity

---

## Performance Patterns

### Lazy Loading Strategy

**Problem**: Loading all 1,233 variations upfront is inefficient.

**Solution**: Load variations on-demand based on current node and state.

```typescript
class VariationLoader {
  private cache: Map<string, any> = new Map();

  async loadNodeVariations(nodeId: string): Promise<NodeVariation[]> {
    if (this.cache.has(nodeId)) {
      return this.cache.get(nodeId);
    }

    const response = await fetch(`/data/content/${nodeId}.json`);
    const data = await response.json();

    this.cache.set(nodeId, data.variations);
    return data.variations;
  }

  async loadL3Variation(variationId: string): Promise<L3Variation> {
    if (this.cache.has(variationId)) {
      return this.cache.get(variationId);
    }

    const response = await fetch(`/data/content/layer3/variations/${variationId}.json`);
    const data = await response.json();

    this.cache.set(variationId, data);
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### Caching Strategy

**What to Cache**:

- Selection matrix (loaded once at startup)
- Currently displayed variation
- Previously visited nodes (last 5)
- User progress data

**What NOT to Cache**:

- All 1,233 variations
- Unvisited node variations

### Performance Targets

- Initial load: < 2 seconds
- Node variation switch: < 200ms
- L3 assembly: < 500ms
- L4 selection: < 300ms
- User progress save: < 100ms

---

## UI/UX Conventions

### Component Structure

```
components/
├── NodeMap/
│   ├── NodeMap.tsx              # Main map component
│   ├── Node.tsx                 # Individual node visual
│   ├── Connection.tsx           # Node connections
│   └── NodeControls.tsx         # Zoom, pan controls
├── StoryView/
│   ├── StoryView.tsx            # Story reading interface
│   ├── VariationDisplay.tsx    # Displays selected variation
│   └── NavigationControls.tsx  # Next/previous, return to map
├── ProgressTracker/
│   ├── ProgressTracker.tsx      # Journey visualization
│   ├── TemporalAwareness.tsx   # Awareness level display
│   └── PathVisualization.tsx   # Visited nodes path
└── UI/
    ├── Button.tsx               # Reusable button
    ├── Modal.tsx                # Modal dialogs
    └── LoadingSpinner.tsx       # Loading states
```

### State Management

**Use Zustand for global state**:

```typescript
interface StoryStore {
  // Loaded data
  nodes: Map<string, StoryNode>;
  selectionMatrix: SelectionMatrix;

  // User progress
  progress: UserProgress;

  // Current state
  currentNode: string | null;
  currentVariation: string | null;

  // L3/L4 assembly
  l3Experience: L3ConvergenceNode | null;
  l4Terminal: L4TerminalVariation | null;

  // Actions
  visitNode: (nodeId: string) => void;
  selectVariation: (variationId: string) => void;
  assembleL3: () => Promise<void>;
  selectL4: () => Promise<void>;
  saveProgress: () => void;
}
```

### Responsive Design

**Breakpoints**:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-first approach**:

```tsx
<div
  className="
  text-sm md:text-base lg:text-lg
  p-4 md:p-6 lg:p-8
"
>
  Content adapts to screen size
</div>
```

### Accessibility

**Requirements**:

- Keyboard navigation for all interactions
- ARIA labels for screen readers
- Focus management for modal dialogs
- Semantic HTML (nav, main, article, etc.)
- Color contrast ratio ≥ 4.5:1

**Example**:

```tsx
<button aria-label="Visit Archaeologist origin node" onClick={handleVisitNode} onKeyDown={(e) => e.key === 'Enter' && handleVisitNode()}>
  <NodeIcon />
</button>
```

---

## Living Document

This document evolves with implementation progress. Update as new patterns emerge.

**Next Review**: After L4 variations complete and selection algorithms implemented.
