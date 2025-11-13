Refined Content Conversion Punch List v3 - FINAL
With decisions locked and implementation guidance added.

Phase 0: Schema Freeze & Canonical Standards ✅ LOCKED
0.1 Character Naming Convention ✅ CONFIRMED
typescript// Canonical values (hyphenated, lowercase)
type Character = 'archaeologist' | 'algorithm' | 'last-human';

// Loader accepts and normalizes: human, lastHuman, hum, last-human → 'last-human'
0.2 L2 Path Philosophy Convention ✅ CONFIRMED
typescripttype PathPhilosophy = 'accept' | 'resist' | 'invest';
// Never "investigate" - remove from any comments in codebase
0.3 L3 Dimensional Structure ✅ CONFIRMED - OPTION B
typescript// 3 × 3 × 5 = 45 combinations

type JourneyPattern =
| 'linear' // Sequential, minimal backtracking
| 'exploratory' // High revisit rate, broad exploration  
 | 'recursive'; // Deep re-reading of specific nodes

type PathPhilosophy = 'accept' | 'resist' | 'invest';

type AwarenessLevel =
| 'veryLow' // 0-20%
| 'low' // 21-40%
| 'medium' // 41-60%
| 'high' // 61-80%
| 'maximum'; // 81-100%

```

**Rationale**: Awareness is a continuous metric already tracked (0-100), easily bucketed. Journey pattern can be computed from visit behavior.

### 0.4 L1/L2 Storage Pattern ✅ CONFIRMED
**Pattern B: External variations file per node**
```

src/data/stories/eternal-return/
├── archaeologist.json # Node definitions with contentFile refs
├── algorithm.json
├── last-human.json
└── content/
├── layer1/
│ ├── arch-L1-variations.json # Array of 80 variation objects
│ ├── algo-L1-variations.json
│ └── hum-L1-variations.json
└── layer2/
├── arch-L2-accept-variations.json
├── arch-L2-resist-variations.json
├── arch-L2-invest-variations.json
├── algo-L2-accept-variations.json
├── algo-L2-resist-variations.json
├── algo-L2-invest-variations.json
├── hum-L2-accept-variations.json
├── hum-L2-resist-variations.json
└── hum-L2-invest-variations.json
Variations file structure:
json{
"nodeId": "arch-L1",
"totalVariations": 80,
"distribution": {
"initial": 1,
"firstRevisit": 46,
"metaAware": 33
},
"variations": [
{
"index": 0,
"id": "arch-L1-001",
"transformationState": "initial",
"visitPattern": "firstVisit",
"awarenessRange": [0, 20],
"content": "Full narrative text...",
"metadata": {
"wordCount": 895,
"voiceConsistencyScore": 0.94,
"thematicFocus": ["memory", "preservation"],
"emotionalTone": "archaeological-precision",
"narrativeElements": ["discovery", "loss"]
}
}
// ... 79 more variations
]
}

Phase 1: Core Loader Infrastructure (2-3 days)
1.1 Vite Glob Import Loader
File: src/utils/contentLoader.ts
Implementation strategy:
typescript// Import all data files at build time
const storyMetadata = import.meta.glob<StoryMetadataFile>(
'/src/data/stories/\*/story.json',
{ eager: true }
);

const characterNodes = import.meta.glob<CharacterNodeFile>(
'/src/data/stories/_/_.json',
{ eager: true }
);

const l1Variations = import.meta.glob<VariationFile>(
'/src/data/stories/_/content/layer1/_-variations.json',
{ eager: true }
);

const l2Variations = import.meta.glob<VariationFile>(
'/src/data/stories/_/content/layer2/_-variations.json',
{ eager: true }
);

const l3Sections = import.meta.glob<L3Section>(
'/src/data/stories/_/content/layer3/variations/_.json',
{ eager: true }
);

const l3Matrix = import.meta.glob<L3SelectionMatrix>(
'/src/data/stories/\*/content/layer3/selection-matrix.json',
{ eager: true }
);

const l4Terminals = import.meta.glob<L4Terminal>(
'/src/data/stories/_/content/layer4/_.json',
{ eager: true }
);

const layouts = import.meta.glob<LayoutFile>(
'/src/data/stories/\*/layout.json',
{ eager: true }
);
Tasks:

Replace all fetch() calls with glob imports
Build path resolver: getContentFile(nodeId, layer) => file content
Add caching layer (Map<string, any> for resolved content)
Handle missing files gracefully (return undefined, log warning)
Test with minimal content set

1.2 Character Normalization
File: src/utils/contentLoader.ts
typescript/\*\*

- Normalizes character identifier to canonical form.
- Accepts: human, lastHuman, hum, last-human → 'last-human'
- Accepts: arch, archaeologist → 'archaeologist'
- Accepts: algo, algorithm → 'algorithm'
  \*/
  function normalizeCharacter(input: string): Character {
  const normalized = input.toLowerCase().replace(/[_\s]/g, '');

// Map all variants to canonical
const characterMap: Record<string, Character> = {
'human': 'last-human',
'lasthuman': 'last-human',
'hum': 'last-human',
'last-human': 'last-human',
'archaeologist': 'archaeologist',
'arch': 'archaeologist',
'algorithm': 'algorithm',
'algo': 'algorithm',
};

const result = characterMap[normalized];

if (!result) {
console.warn(`Unknown character identifier: ${input}, defaulting to 'archaeologist'`);
return 'archaeologist';
}

if (result !== input) {
console.info(`Normalized character: ${input} → ${result}`);
}

return result;
}
Tasks:

Implement normalization function
Apply to all character fields during load
Add unit tests for all variants
Test with malformed data

1.3 Soft Validation & Error Handling
Implementation:
typescriptinterface LoadResult<T> {
data?: T;
warnings: string[];
errors: string[];
}

class ContentLoader {
private warnings: string[] = [];
private errors: string[] = [];

async loadStoryContent(storyId: string): Promise<LoadResult<StoryData>> {
this.warnings = [];
this.errors = [];

    try {
      const metadata = await this.loadMetadata(storyId);
      const nodes = await this.loadAllNodes(storyId);
      const layout = await this.loadLayout(storyId);

      return {
        data: { metadata, nodes, layout },
        warnings: this.warnings,
        errors: this.errors,
      };
    } catch (error) {
      this.errors.push(`Fatal error loading story: ${error.message}`);
      return {
        warnings: this.warnings,
        errors: this.errors,
      };
    }

}

private async loadNode(nodeId: string): Promise<StoryNode | null> {
try {
// Try to load node definition
const nodeDef = this.getNodeDefinition(nodeId);
if (!nodeDef) {
this.warnings.push(`Node definition not found: ${nodeId}`);
return null;
}

      // Load variations file
      const variations = await this.loadVariations(nodeDef.contentFile);
      if (!variations) {
        this.warnings.push(`Variations file missing: ${nodeDef.contentFile}`);
        return null;
      }

      // Validate and return
      return this.buildStoryNode(nodeDef, variations);

    } catch (error) {
      this.warnings.push(`Error loading node ${nodeId}: ${error.message}`);
      return null;
    }

}

// Returns partial results even if some nodes fail
private async loadAllNodes(storyId: string): Promise<StoryNode[]> {
const nodeIds = this.getAllNodeIds(storyId);
const results = await Promise.allSettled(
nodeIds.map(id => this.loadNode(id))
);

    return results
      .filter((r): r is PromiseFulfilledResult<StoryNode> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value);

}
}
Tasks:

Implement resilient loader with warning collection
Skip invalid nodes, continue loading
Collect all errors/warnings for display
Add "partial load" indicator in UI
Test with intentionally broken data

1.4 Node Position System
Create: src/data/stories/eternal-return/layout.json
json{
"version": "1.0.0",
"metadata": {
"name": "12-Node Architecture Layout",
"description": "Positions for all narrative nodes in eternal-return story",
"canvasSize": { "width": 1400, "height": 800 }
},
"layers": {
"layer1": {
"y": 150,
"spacing": 350,
"nodes": {
"arch-L1": { "x": 200, "y": 150 },
"algo-L1": { "x": 550, "y": 150 },
"hum-L1": { "x": 900, "y": 150 }
}
},
"layer2": {
"y": 400,
"spacing": 100,
"nodes": {
"arch-L2-accept": { "x": 100, "y": 400 },
"arch-L2-resist": { "x": 200, "y": 400 },
"arch-L2-invest": { "x": 300, "y": 400 },
"algo-L2-accept": { "x": 450, "y": 400 },
"algo-L2-resist": { "x": 550, "y": 400 },
"algo-L2-invest": { "x": 650, "y": 400 },
"hum-L2-accept": { "x": 800, "y": 400 },
"hum-L2-resist": { "x": 900, "y": 400 },
"hum-L2-invest": { "x": 1000, "y": 400 }
}
},
"layer3": {
"y": 650,
"nodes": {
"convergence": { "x": 550, "y": 650 }
}
},
"layer4": {
"y": 750,
"nodes": {
"terminal": { "x": 550, "y": 750 }
}
}
},
"fallbackStrategy": "grid",
"gridConfig": {
"startX": 100,
"startY": 100,
"spacingX": 150,
"spacingY": 200,
"maxColumns": 5
}
}
Fallback position calculator:
typescriptfunction getNodePosition(
nodeId: string,
layout: LayoutFile | undefined
): { x: number; y: number } {
// Try explicit position from layout
if (layout) {
for (const layer of Object.values(layout.layers)) {
if (layer.nodes[nodeId]) {
return layer.nodes[nodeId];
}
}
}

// Fallback: calculate from node ID pattern
const match = nodeId.match(/^(arch|algo|hum)-L(\d)-?(.\*)?$/);
if (match) {
const [, char, layer, path] = match;
const charIndex = { arch: 0, algo: 1, hum: 2 }[char] ?? 0;
const layerNum = parseInt(layer, 10);
const pathIndex = path ? { accept: 0, resist: 1, invest: 2 }[path] ?? 0 : 0;

    return {
      x: 100 + (charIndex * 350) + (pathIndex * 100),
      y: 100 + (layerNum * 250),
    };

}

// Ultimate fallback: prevent 0,0 clustering
console.warn(`No position found for ${nodeId}, using hash-based position`);
const hash = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
return {
x: 100 + ((hash % 10) _ 120),
y: 100 + (Math.floor(hash / 10) % 5) _ 150,
};
}
Tasks:

Create layout.json with all 12 nodes
Load layout in contentLoader
Apply positions during node creation
Test fallback calculator
Verify no (0,0) positions in UI

1.5 Edge Unlock Visibility
File: src/components/NodeMap/edgeUtils.ts
Current issue: Line 75-77 receives progress but doesn't use it
Fix:
typescriptexport function convertToReactFlowEdges(
connections: Map<string, Connection>,
progress: UserProgress
): Edge[] {
const edges: Edge[] = [];

connections.forEach((connection) => {
const visibility = evaluateConnectionVisibility(connection, progress);

    // Option 1: Hide completely until unlocked
    if (visibility === 'hidden') {
      return; // Skip rendering
    }

    // Option 2: Show but style differently
    const isUnlocked = visibility === 'unlocked';
    const isLocked = visibility === 'locked';

    edges.push({
      id: connection.id,
      source: connection.sourceId,
      target: connection.targetId,
      type: connection.type,
      label: connection.label,
      animated: isUnlocked && (connection.visualProperties?.animated ?? false),
      style: {
        stroke: isLocked ? '#666666' : (connection.visualProperties?.color ?? '#999999'),
        strokeWidth: connection.visualProperties?.weight ?? 2,
        strokeDasharray: isLocked ? '5,5' : undefined,
        opacity: isLocked ? 0.3 : 1.0,
      },
      // Add custom data for hover tooltips
      data: {
        locked: isLocked,
        unlockHint: isLocked ? getUnlockHint(connection, progress) : undefined,
      },
    });

});

return edges;
}

type ConnectionVisibility = 'hidden' | 'locked' | 'unlocked';

function evaluateConnectionVisibility(
connection: Connection,
progress: UserProgress
): ConnectionVisibility {
// No conditions = always visible and unlocked
if (!connection.revealConditions) {
return 'unlocked';
}

const { requiredVisits, requiredSequence } = connection.revealConditions;
let isRevealed = true;
let isUnlocked = true;

// Check visit requirements
if (requiredVisits) {
for (const [nodeId, minCount] of Object.entries(requiredVisits)) {
const record = progress.visitedNodes[nodeId];
if (!record) {
isRevealed = false;
break;
}
if (record.visitCount < minCount) {
isUnlocked = false;
}
}
}

// Check sequence requirements
if (requiredSequence && isRevealed) {
const pathString = progress.readingPath.join(',');
const sequenceString = requiredSequence.join(',');
if (!pathString.includes(sequenceString)) {
isUnlocked = false;
}
}

if (!isRevealed) return 'hidden';
if (!isUnlocked) return 'locked';
return 'unlocked';
}

function getUnlockHint(
connection: Connection,
progress: UserProgress
): string {
const { requiredVisits, requiredSequence } = connection.revealConditions ?? {};

if (requiredVisits) {
const unmet = Object.entries(requiredVisits).filter(([nodeId, count]) => {
const record = progress.visitedNodes[nodeId];
return !record || record.visitCount < count;
});

    if (unmet.length > 0) {
      const [nodeId, count] = unmet[0];
      const current = progress.visitedNodes[nodeId]?.visitCount ?? 0;
      return `Visit ${nodeId} ${count - current} more time(s) to unlock`;
    }

}

if (requiredSequence) {
return `Complete sequence: ${requiredSequence.join(' → ')} to unlock`;
}

return 'Locked - requirements not met';
}
Tasks:

Implement visibility evaluation
Add locked/unlocked styling
Add hover tooltip showing unlock requirements
Test with various unlock conditions
Verify edges appear after meeting conditions

1.6 UI Encoding Cleanup
Files to fix:

src/components/NodeMap/NodeMap.tsx (line 333)
src/components/StoryView/StoryView.tsx (lines 39-60, 101, 180, 219, 252)
src/components/Layout/Layout.tsx (lines 39, 74, 140, 173, 205, 235)

Add dependency:
bashnpm install lucide-react
Replacement strategy:
typescript// Before: {'\u2190'} or similar mojibake
import {
ArrowLeft,
X,
BookOpen,
Settings,
Home,
ChevronLeft,
ChevronRight,
Menu
} from 'lucide-react';

// Usage:
<button onClick={onBack} aria-label="Go back">
<ArrowLeft className="w-5 h-5" />
</button>

<button onClick={onClose} aria-label="Close">
  <X className="w-5 h-5" />
</button>
Tasks:

Install lucide-react
Replace all mojibake characters
Add proper aria-labels
Test icon rendering
Verify accessibility

Phase 2: Selection System Scaffolding (2 days)
2.1 Journey Pattern Detection 🆘 NEEDS DESIGN
Goal: Classify reader behavior into one of three patterns
File: src/utils/journeyAnalysis.ts
typescriptexport interface JourneyMetrics {
totalVisits: number;
uniqueNodes: number;
revisitRate: number;
backtrackCount: number;
maxNodeDepth: number;
characterSwitchCount: number;
averageNodeDwellTime: number;
explorationBreadth: number; // % of available nodes visited
}

/\*\*

- Analyzes reading path to determine journey pattern.
-
- LINEAR: Sequential progression, minimal backtracking
- - Low revisit rate (<1.5)
- - Few character switches (<3)
- - Follows connection paths
-
- EXPLORATORY: Broad exploration, sampling many nodes
- - High unique node count (>80% of available)
- - Moderate revisit rate (1.5-2.5)
- - Many character switches (>5)
-
- RECURSIVE: Deep re-reading, focused engagement
- - High revisit rate (>2.5)
- - Focused on subset of nodes
- - High average dwell time per node
    \*/
    export function computeJourneyPattern(
    readingPath: string[],
    visitedNodes: Record<string, VisitRecord>,
    availableNodes: StoryNode[]
    ): JourneyPattern {
    const metrics = calculateJourneyMetrics(readingPath, visitedNodes, availableNodes);

// RECURSIVE: Deep engagement with specific nodes
if (metrics.revisitRate > 2.5 && metrics.maxNodeDepth >= 4) {
return 'recursive';
}

// EXPLORATORY: Broad sampling
if (metrics.explorationBreadth > 0.7 && metrics.characterSwitchCount > 5) {
return 'exploratory';
}

// LINEAR: Sequential progression (default)
return 'linear';
}

function calculateJourneyMetrics(
readingPath: string[],
visitedNodes: Record<string, VisitRecord>,
availableNodes: StoryNode[]
): JourneyMetrics {
const totalVisits = readingPath.length;
const uniqueNodes = Object.keys(visitedNodes).length;
const revisitRate = totalVisits / uniqueNodes;

// Count backtracks (visiting a node earlier in path)
let backtrackCount = 0;
const seenNodes = new Set<string>();
for (const nodeId of readingPath) {
if (seenNodes.has(nodeId)) {
backtrackCount++;
}
seenNodes.add(nodeId);
}

// Maximum depth (highest visit count for any single node)
const maxNodeDepth = Math.max(
...Object.values(visitedNodes).map(r => r.visitCount),
0
);

// Character switches
let characterSwitchCount = 0;
let prevCharacter: string | null = null;
for (const nodeId of readingPath) {
const node = availableNodes.find(n => n.id === nodeId);
if (node && node.character !== prevCharacter) {
characterSwitchCount++;
prevCharacter = node.character;
}
}

// Average dwell time (if tracked)
const totalDwellTime = Object.values(visitedNodes)
.reduce((sum, record) => sum + (record.timeSpent ?? 0), 0);
const averageNodeDwellTime = totalDwellTime / uniqueNodes;

// Exploration breadth
const explorationBreadth = uniqueNodes / availableNodes.length;

return {
totalVisits,
uniqueNodes,
revisitRate,
backtrackCount,
maxNodeDepth,
characterSwitchCount,
averageNodeDwellTime,
explorationBreadth,
};
}
Questions for you:

Should time spent on nodes factor into pattern detection?
What if reader hasn't visited many nodes yet? (Early-journey default?)
Should we track "return to hub" behavior separately?
Are there specific reading patterns you've observed in testing that should be captured?

Tasks:

Review proposed thresholds (adjust based on your vision)
Implement metrics calculation
Add unit tests with sample reading paths
Test with real navigation patterns
Add debug logging for pattern detection

2.2 Path Philosophy Tracking 🆘 NEEDS DESIGN
Goal: Determine dominant philosophical stance from L2 choices
File: src/stores/storyStore.ts (extend UserProgress)
typescriptinterface UserProgress {
// ... existing fields

// NEW: Track L2 path choices
pathChoices: {
archaeologist?: 'accept' | 'resist' | 'invest';
algorithm?: 'accept' | 'resist' | 'invest';
lastHuman?: 'accept' | 'resist' | 'invest';
};

// NEW: Weighted philosophy score
philosophyScores: {
accept: number; // 0-100
resist: number; // 0-100
invest: number; // 0-100
};
}
Computation strategy:
typescript/\*\*

- Determines dominant path philosophy from L2 choices.
-
- Strategy:
- 1.  Direct choice: If reader explicitly chose a path at L2
- 2.  Weighted by engagement: Time spent on each path
- 3.  Implicit signals: Backtracking patterns, node revisits
-
- Questions:
- - Should all three characters' choices be weighted equally?
- - What if reader only visited one character's L2?
- - Should later choices override earlier ones?
    \*/
    export function computePathPhilosophy(
    progress: UserProgress,
    visitedNodes: Record<string, VisitRecord>
    ): PathPhilosophy {
    const choices = progress.pathChoices;
    const scores = { accept: 0, resist: 0, invest: 0 };

// Weight each character's choice
if (choices.archaeologist) {
scores[choices.archaeologist] += 1;
}
if (choices.algorithm) {
scores[choices.algorithm] += 1;
}
if (choices.lastHuman) {
scores[choices.lastHuman] += 1;
}

// Additional weight for time spent on L2 nodes
Object.entries(visitedNodes).forEach(([nodeId, record]) => {
if (nodeId.includes('-L2-')) {
const path = extractPathFromNodeId(nodeId);
if (path) {
scores[path] += (record.timeSpent ?? 0) / 60; // minutes
}
}
});

// Return dominant philosophy
const dominant = Object.entries(scores)
.sort(([, a], [, b]) => b - a)[0][0] as PathPhilosophy;

// If no clear dominant (scores tied), use most recent choice
if (scores.accept === scores.resist && scores.resist === scores.invest) {
// Fallback: check most recent L2 visit
const recentL2 = progress.readingPath
.reverse()
.find(id => id.includes('-L2-'));

    if (recentL2) {
      return extractPathFromNodeId(recentL2) ?? 'accept';
    }

}

return dominant;
}

function extractPathFromNodeId(nodeId: string): PathPhilosophy | null {
if (nodeId.includes('-accept')) return 'accept';
if (nodeId.includes('-resist')) return 'resist';
if (nodeId.includes('-invest')) return 'invest';
return null;
}
Questions for you:

How should the system handle readers who visit L2 nodes but don't engage deeply?
Should resist be weighted higher if reader backtracks a lot? (resistance = questioning)
Should accept be weighted higher for linear, forward-only progression?
What if reader visits multiple paths for the same character? Most recent wins?

Tasks:

Add pathChoices tracking to UserProgress
Track L2 node visits and path selection
Implement philosophy scoring
Test with various navigation patterns
Add admin panel to view philosophy scores (debug)

2.3 L3/L4 Type Definitions
Create: src/types/L3.ts
typescriptexport type JourneyPattern = 'linear' | 'exploratory' | 'recursive';
export type PathPhilosophy = 'accept' | 'resist' | 'invest';
export type AwarenessLevel = 'veryLow' | 'low' | 'medium' | 'high' | 'maximum';

export interface L3VariationKey {
journeyPattern: JourneyPattern;
pathPhilosophy: PathPhilosophy;
awarenessLevel: AwarenessLevel;
}

export interface L3SectionReference {
archSection: string; // e.g., "arch-L3-001"
algoSection: string; // e.g., "algo-L3-015"
humSection: string; // e.g., "hum-L3-023"
convSection: string; // e.g., "conv-L3-042"
}

export interface L3SelectionMatrix {
version: string;
totalVariations: number;
dimensions: {
journeyPattern: JourneyPattern[];
pathPhilosophy: PathPhilosophy[];
awarenessLevel: AwarenessLevel[];
};
selectionKeys: Record<string, L3SectionReference>;
}

export interface L3Section {
id: string;
type: 'characterSection' | 'convergenceSynthesis';
character?: 'archaeologist' | 'algorithm' | 'last-human';
content: string;
metadata: {
wordCount: number;
voiceIntegrity: 'pure' | 'synthesis';
thematicElements: string[];
bridgeElements?: string[];
};
}

export interface L3AssembledNode {
id: 'convergence';
title: string;
sections: {
archaeologist: L3Section;
algorithm: L3Section;
lastHuman: L3Section;
synthesis: L3Section;
};
content: string; // Fully assembled text for StoryView
choices: Array<{
id: 'preserve' | 'release' | 'transform';
label: string;
description: string;
}>;
metadata: {
totalWordCount: number;
variationKey: L3VariationKey;
selectedSections: L3SectionReference;
};
}
Create: src/types/L4.ts
typescriptexport type L4TerminalChoice = 'preserve' | 'release' | 'transform';

export interface L4Terminal {
id: `final-${L4TerminalChoice}`;
philosophy: L4TerminalChoice;
content: {
sections: Array<{
title: string;
character: 'synthesis' | 'archaeologist' | 'algorithm' | 'last-human';
text: string;
}>;
};
journeyRecap?: {
enabled: boolean;
visitedNodes: string[];
choicesMade: Record<string, string>;
awarenessProgression: number[];
totalTimeMinutes: number;
readingPattern: string;
};
metadata: {
wordCount: number;
estimatedReadTime: number;
pdfExportEnabled: boolean;
completionPercentage: number;
};
}
Tasks:

Create type definition files
Export from src/types/index.ts
Update StoryStore to include L3/L4 state
Add JSDoc documentation

2.4 Variation Selector Implementation
Create: src/utils/variationSelector.ts
typescriptimport type {
VisitRecord,
UserProgress,
StoryNode
} from '@/types';
import type {
JourneyPattern,
PathPhilosophy,
AwarenessLevel,
L3VariationKey,
L3SectionReference,
L3SelectionMatrix
} from '@/types/L3';
import type { L4TerminalChoice } from '@/types/L4';

/\*\*

- Selects L1/L2 variation index from 80 options.
-
- Strategy: Weighted random within bucket
- - Use metadata to prefer variations with:
- - Higher voice consistency scores
- - Thematic alignment with reader's journey
- - Appropriate emotional tone
-
- Buckets:
- - Initial: index 0 (first visit only)
- - FirstRevisit: indices 1-46 (second visit through early revisits)
- - MetaAware: indices 47-79 (high awareness, multiple revisits)
    \*/
    export function selectL1L2Variation(
    variationsFile: VariationFile,
    visitRecord: VisitRecord | undefined,
    awarenessLevel: number,
    currentState: TransformationState,
    userPreferences?: VariationPreferences
    ): Variation {
    // Determine bucket
    const bucket = determineVariationBucket(currentState, visitRecord, awarenessLevel);

// Filter to bucket
const candidates = variationsFile.variations.filter(v =>
v.transformationState === currentState &&
v.awarenessRange[0] <= awarenessLevel &&
v.awarenessRange[1] >= awarenessLevel
);

if (candidates.length === 0) {
console.warn(`No variations found for state: ${currentState}, awareness: ${awarenessLevel}`);
return variationsFile.variations[0]; // Fallback
}

if (candidates.length === 1) {
return candidates[0];
}

// Weighted random selection
return selectWeightedRandom(candidates, userPreferences);
}

/\*\*

- Weighted random selection using metadata.
-
- Weights:
- - voiceConsistencyScore: Higher is better (0.0-1.0)
- - Previous selections: Avoid recently shown variations
- - Thematic preferences: If user has shown pattern
    \*/
    function selectWeightedRandom(
    candidates: Variation[],
    preferences?: VariationPreferences
    ): Variation {
    // Calculate weights
    const weights = candidates.map(variation => {
    let weight = 1.0;
        // Voice consistency boost (prefer 0.93+)
        const voiceScore = variation.metadata.voiceConsistencyScore ?? 0.9;
        weight *= (voiceScore * 1.2); // 20% boost for high consistency

        // Novelty boost (prefer not recently seen)
        if (preferences?.recentlySeenIds.includes(variation.id)) {
          weight *= 0.3; // Penalty for repetition
        }

        // Thematic alignment (if user has shown preferences)
        if (preferences?.preferredThemes) {
          const themeOverlap = variation.metadata.thematicFocus.filter(theme =>
            preferences.preferredThemes?.includes(theme)
          ).length;
          weight *= (1 + themeOverlap * 0.1); // 10% boost per matching theme
        }

        return weight;
    });

// Weighted random selection
const totalWeight = weights.reduce((sum, w) => sum + w, 0);
let random = Math.random() \* totalWeight;

for (let i = 0; i < candidates.length; i++) {
random -= weights[i];
if (random <= 0) {
return candidates[i];
}
}

return candidates[candidates.length - 1]; // Fallback
}

/\*\*

- Computes awareness level bucket (0-100 → 5 categories)
  \*/
  export function computeAwarenessLevel(awarenessPercent: number): AwarenessLevel {
  if (awarenessPercent <= 20) return 'veryLow';
  if (awarenessPercent <= 40) return 'low';
  if (awarenessPercent <= 60) return 'medium';
  if (awarenessPercent <= 80) return 'high';
  return 'maximum';
  }

/\*\*

- Selects L3 sections from matrix
  \*/
  export function selectL3Sections(
  progress: UserProgress,
  selectionMatrix: L3SelectionMatrix,
  availableNodes: StoryNode[]
  ): L3SectionReference {
  const key: L3VariationKey = {
  journeyPattern: computeJourneyPattern(
  progress.readingPath,
  progress.visitedNodes,
  availableNodes
  ),
  pathPhilosophy: computePathPhilosophy(progress, progress.visitedNodes),
  awarenessLevel: computeAwarenessLevel(progress.temporalAwarenessLevel),
  };

const keyString = `${key.journeyPattern}-${key.pathPhilosophy}-${key.awarenessLevel}`;
const sections = selectionMatrix.selectionKeys[keyString];

if (!sections) {
console.error(`No L3 sections for key: ${keyString}`);
// Fallback to closest match
return findClosestL3Match(key, selectionMatrix);
}

return sections;
}

function findClosestL3Match(
targetKey: L3VariationKey,
matrix: L3SelectionMatrix
): L3SectionReference {
// Find key with most matching dimensions
const allKeys = Object.keys(matrix.selectionKeys);

let bestMatch = allKeys[0];
let bestScore = 0;

for (const keyString of allKeys) {
const [journey, philosophy, awareness] = keyString.split('-');
let score = 0;

    if (journey === targetKey.journeyPattern) score += 3;
    if (philosophy === targetKey.pathPhilosophy) score += 2;
    if (awareness === targetKey.awarenessLevel) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = keyString;
    }

}

console.warn(`Using closest L3 match: ${bestMatch} (score: ${bestScore}/6)`);
return matrix.selectionKeys[bestMatch];
}

/\*\*

- Selects L4 terminal (direct mapping for now)
  \*/
  export function selectL4Terminal(
  progress: UserProgress,
  l3Choice: L4TerminalChoice
  ): `final-${L4TerminalChoice}` {
  // Could add sophistication here:
  // - Override based on journey pattern
  // - Weight based on overall philosophy scores
  // - Special endings for exceptional journeys

return `final-${l3Choice}`;
}

// Import journey/philosophy computations from journeyAnalysis.ts
export { computeJourneyPattern } from './journeyAnalysis';
export { computePathPhilosophy } from './philosophyAnalysis';
Tasks:

Implement weighted random selection
Add variation preference tracking to store
Test with metadata-rich variations
Verify novelty (no immediate repeats)
Add debug logging for selection rationale

Phase 3: Minimal Content Set (2-3 days)
3.1 One L1 Node Per Character
Convert to JSON format:
arch-L1-variations.json (80 variations):
json{
"nodeId": "arch-L1",
"totalVariations": 80,
"distribution": {
"initial": 1,
"firstRevisit": 46,
"metaAware": 33
},
"variations": [
{
"index": 0,
"id": "arch-L1-001",
"transformationState": "initial",
"visitPattern": "firstVisit",
"awarenessRange": [0, 20],
"content": "[Full 900-word text from markdown]",
"metadata": {
"wordCount": 895,
"voiceConsistencyScore": 0.94,
"thematicFocus": ["memory", "preservation", "loss"],
"emotionalTone": "archaeological-precision",
"narrativeElements": ["discovery", "fragment", "documentation"]
}
}
// ... 79 more
]
}
Character node definition (archaeologist.json):
json{
"character": "archaeologist",
"nodes": [
{
"id": "arch-L1",
"layer": 1,
"character": "archaeologist",
"title": "The First Fragment",
"chapterTitle": "The First Fragment",
"position": { "x": 200, "y": 150 },
"connections": ["arch-L2-accept", "arch-L2-resist", "arch-L2-invest"],
"contentFile": "content/layer1/arch-L1-variations.json",
"visualState": {
"defaultColor": "#4A90E2",
"size": 35,
"shape": "circle"
},
"metadata": {
"estimatedReadTime": 4,
"thematicTags": ["memory", "preservation", "archaeology"],
"narrativeAct": 1,
"criticalPath": true
}
}
]
}
Tasks:

Extract all 80 arch-L1 variations from markdown
Parse YAML frontmatter for metadata
Convert to variations JSON
Create node definition
Repeat for algo-L1
Repeat for hum-L1
Test loading all three
Verify variation selection works
Test transformation states in UI

3.2 One L2 Path Per Character (Accept)
Convert minimal L2:

arch-L2-accept (80 variations)
algo-L2-accept (80 variations)
hum-L2-accept (80 variations)

Same structure as L1, with path-specific metadata:
json{
"metadata": {
"pathPhilosophy": "accept",
"l3SeedElements": ["preservation-choice", "continuity-value"],
"philosophicalFocus": "Acceptance of digital consciousness preservation"
}
}
Connection definitions:
json{
"connections": [
{
"id": "conn-arch-L1-to-accept",
"sourceId": "arch-L1",
"targetId": "arch-L2-accept",
"type": "temporal",
"label": "Accept preservation",
"revealConditions": {
"requiredVisits": {
"arch-L1": 1
}
}
}
]
}
Tasks:

Convert 3 L2-accept nodes (240 variations total)
Add path choice tracking to store
Test edge unlocking after L1 visit
Verify path philosophy detection

3.3 L4 Terminals (Priority: Do These First)
Why prioritize L4: Simpler structure, tests terminal flow, can be used immediately
Once written, convert:

final-preserve.json (~3,000 words)
final-release.json (~3,000 words)
final-transform.json (~3,000 words)

Structure:
json{
"id": "final-preserve",
"philosophy": "preserve",
"title": "Preservation Protocol: Final Integration",
"content": {
"sections": [
{
"title": "Convergence",
"character": "synthesis",
"text": "[Multi-voice opening section]"
},
{
"title": "Archaeological Testimony",
"character": "archaeologist",
"text": "[Archaeologist perspective on preservation]"
},
{
"title": "Algorithmic Analysis",
"character": "algorithm",
"text": "[Algorithm perspective on preservation]"
},
{
"title": "Human Witness",
"character": "last-human",
"text": "[Last human perspective on preservation]"
},
{
"title": "Final State",
"character": "synthesis",
"text": "[Terminal state resolution]"
}
]
},
"journeyRecap": {
"enabled": true,
"template": "You visited {nodeCount} nodes over {timeMinutes} minutes..."
},
"metadata": {
"wordCount": 3000,
"estimatedReadTime": 15,
"pdfExportEnabled": true
}
}
Tasks:

Convert all three L4 endings (once written)
Add terminal node rendering to StoryView
Implement journey recap templating
Test PDF export preparation
Verify terminal accessibility from L3

Phase 4: Bulk Content Conversion (2-3 weeks)
4.1 Complete L1 Layer (240 total)

Verify arch/algo/hum L1 complete (from Phase 3)
Run validation on all L1 variations
Test random selection works across all 80
Verify voice consistency scores present

4.2 Complete L2 Layer (720 total)
Remaining 6 nodes:

arch-L2-resist (80)
arch-L2-invest (80)
algo-L2-resist (80)
algo-L2-invest (80)
hum-L2-resist (80)
hum-L2-invest (80)

Per-node validation:

Path philosophy clear in metadata
L3 seed elements documented
Cross-character references noted
Connections to L3 convergence node

4.3 L3 Modular System (270 variations)
Character sections (45 each = 135 total):
Example: arch-L3-001.json
json{
"id": "arch-L3-001",
"type": "characterSection",
"character": "archaeologist",
"selectionContext": {
"journeyPattern": "linear",
"pathPhilosophy": "accept",
"awarenessLevel": "veryLow"
},
"content": "[~300 word section in pure archaeologist voice]",
"metadata": {
"wordCount": 295,
"voiceIntegrity": "pure",
"thematicElements": ["preservation", "documentation"],
"bridgeElements": [
"References algorithm's classification system",
"Acknowledges human substrate's immediacy"
]
}
}
Convergence sections (135 total):
Example: conv-L3-042.json
json{
"id": "conv-L3-042",
"type": "convergenceSynthesis",
"selectionContext": {
"journeyPattern": "recursive",
"pathPhilosophy": "invest",
"awarenessLevel": "high"
},
"content": "[~300 word multi-voice synthesis]",
"metadata": {
"wordCount": 310,
"voiceIntegrity": "synthesis",
"voicesPresent": ["archaeologist", "algorithm", "last-human"],
"synthesisTechnique": "interwoven-perspectives",
"thematicElements": ["investigation", "uncertainty", "integration"]
}
}
Tasks:

Convert all 45 arch-L3 sections
Convert all 45 algo-L3 sections
Convert all 45 hum-L3 sections
Convert all 135 conv-L3 sections
Create selection matrix with all 45 keys
Test L3 assembly for each combination
Verify assembled nodes ~1200 words
Test PRESERVE/RELEASE/TRANSFORM choice presentation

4.4 Selection Matrix Complete
File: src/data/stories/eternal-return/content/layer3/selection-matrix.json
All 45 combinations (3 × 3 × 5):
json{
"version": "1.0.0",
"totalVariations": 270,
"dimensions": {
"journeyPattern": ["linear", "exploratory", "recursive"],
"pathPhilosophy": ["accept", "resist", "invest"],
"awarenessLevel": ["veryLow", "low", "medium", "high", "maximum"]
},
"selectionKeys": {
"linear-accept-veryLow": {
"archSection": "arch-L3-001",
"algoSection": "algo-L3-001",
"humSection": "hum-L3-001",
"convSection": "conv-L3-001"
},
"linear-accept-low": {
"archSection": "arch-L3-002",
"algoSection": "algo-L3-002",
"humSection": "hum-L3-002",
"convSection": "conv-L3-002"
}
// ... 43 more combinations
},
"metadata": {
"lastUpdated": "2025-11-09",
"validationStatus": "complete",
"totalSectionFiles": 270
}
}
Matrix validation:

All 45 keys present
Each key maps to unique 4-section combination
All 270 section files referenced
No duplicate section assignments within key
Test loading matrix via glob import

4.5 Production Selection Logic
Replace all stubs in variationSelector.ts with production algorithms:

selectL1L2Variation: Full weighted random with metadata
computeJourneyPattern: Production metrics and thresholds
computePathPhilosophy: Track L2 choices, weight by engagement
selectL3Sections: Matrix lookup with fallback
Add unit tests for all functions
Add integration test: full journey → L3 assembly → L4 selection

Phase 5: Validation & QA (1 week)
5.1 Automated Validation Script
Create: scripts/validateContent.ts
typescript#!/usr/bin/env node

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

interface ValidationResult {
valid: boolean;
errors: string[];
warnings: string[];
stats: ContentStats;
}

interface ContentStats {
totalFiles: number;
totalVariations: number;
layerBreakdown: {
L1: { files: number; variations: number };
L2: { files: number; variations: number };
L3: { files: number; sections: number };
L4: { files: number; terminals: number };
};
characterBreakdown: {
archaeologist: number;
algorithm: number;
lastHuman: number;
};
positionCoverage: {
positioned: number;
missing: number;
};
voiceConsistency: {
average: number;
min: number;
max: number;
};
}

async function validateAllContent(): Promise<ValidationResult> {
const result: ValidationResult = {
valid: true,
errors: [],
warnings: [],
stats: {
totalFiles: 0,
totalVariations: 0,
layerBreakdown: {
L1: { files: 0, variations: 0 },
L2: { files: 0, variations: 0 },
L3: { files: 0, sections: 0 },
L4: { files: 0, terminals: 0 },
},
characterBreakdown: {
archaeologist: 0,
algorithm: 0,
lastHuman: 0,
},
positionCoverage: {
positioned: 0,
missing: 0,
},
voiceConsistency: {
average: 0,
min: 1,
max: 0,
},
},
};

// Check L1 variations (expect 240 total)
await validateLayer1(result);

// Check L2 variations (expect 720 total)
await validateLayer2(result);

// Check L3 sections (expect 270 total)
await validateLayer3(result);

// Check L4 terminals (expect 3 total)
await validateLayer4(result);

// Validate selection matrix
await validateSelectionMatrix(result);

// Check for duplicate IDs
await checkDuplicateIds(result);

// Validate word counts
await validateWordCounts(result);

// Check UTF-8 encoding
await checkEncoding(result);

// Validate positions
await validatePositions(result);

result.valid = result.errors.length === 0;
return result;
}

async function validateLayer1(result: ValidationResult) {
const l1Files = await glob('src/data/stories/_/content/layer1/_-variations.json');

if (l1Files.length !== 3) {
result.errors.push(`Expected 3 L1 variation files, found ${l1Files.length}`);
}

for (const file of l1Files) {
const content = JSON.parse(await fs.readFile(file, 'utf-8'));

    if (content.variations.length !== 80) {
      result.errors.push(`${file}: Expected 80 variations, found ${content.variations.length}`);
    } else {
      result.stats.layerBreakdown.L1.variations += 80;
    }

    // Check distribution
    const dist = content.distribution;
    if (dist.initial + dist.firstRevisit + dist.metaAware !== 80) {
      result.errors.push(`${file}: Distribution doesn't sum to 80`);
    }

    result.stats.layerBreakdown.L1.files++;

}
}

// ... Similar functions for L2, L3, L4

async function validateSelectionMatrix(result: ValidationResult) {
try {
const matrixPath = 'src/data/stories/eternal-return/content/layer3/selection-matrix.json';
const matrix = JSON.parse(await fs.readFile(matrixPath, 'utf-8'));

    const keyCount = Object.keys(matrix.selectionKeys).length;
    if (keyCount !== 45) {
      result.errors.push(`Selection matrix: Expected 45 keys, found ${keyCount}`);
    }

    // Validate all referenced sections exist
    for (const [key, sections] of Object.entries(matrix.selectionKeys)) {
      // Check each section file exists
      // ...
    }

} catch (error) {
result.errors.push(`Selection matrix error: ${error.message}`);
}
}

// Run validation
validateAllContent().then((result) => {
console.log('\n=== Content Validation Report ===\n');

if (result.valid) {
console.log('✅ All validations passed!\n');
} else {
console.log(`❌ Found ${result.errors.length} errors\n`);
}

console.log('Stats:');
console.log(JSON.stringify(result.stats, null, 2));

if (result.errors.length > 0) {
console.log('\nErrors:');
result.errors.forEach(err => console.log(`  ❌ ${err}`));
}

if (result.warnings.length > 0) {
console.log('\nWarnings:');
result.warnings.forEach(warn => console.log(`  ⚠️  ${warn}`));
}

process.exit(result.valid ? 0 : 1);
});
Add to package.json:
json{
"scripts": {
"validate:content": "tsx scripts/validateContent.ts",
"validate:full": "npm run type-check && npm run lint && npm run test && npm run validate:content"
}
}
Tasks:

Implement validation script
Test with minimal content
Run on complete content
Fix all errors before launch
Add to CI/CD pipeline

5.2 Integration Tests
Create: src/**tests**/contentIntegration.test.ts
typescriptimport { describe, it, expect, beforeAll } from 'vitest';
import { loadStoryContent } from '@/utils/contentLoader';
import { selectL3Sections } from '@/utils/variationSelector';
import type { UserProgress } from '@/types';

describe('Content Integration', () => {
let storyData: StoryData;

beforeAll(async () => {
storyData = await loadStoryContent('eternal-return');
});

it('should load all L1 nodes successfully', () => {
const l1Nodes = storyData.nodes.filter(n => n.id.includes('-L1'));
expect(l1Nodes).toHaveLength(3);
});

it('should load all L2 nodes successfully', () => {
const l2Nodes = storyData.nodes.filter(n => n.id.includes('-L2-'));
expect(l2Nodes).toHaveLength(9);
});

it('should have positions for all nodes', () => {
const nodesAt00 = storyData.nodes.filter(n =>
n.position.x === 0 && n.position.y === 0
);
expect(nodesAt00).toHaveLength(0);
});

it('should select valid L3 sections for all combinations', () => {
const matrix = /_ load matrix _/;
const patterns: JourneyPattern[] = ['linear', 'exploratory', 'recursive'];
const philosophies: PathPhilosophy[] = ['accept', 'resist', 'invest'];
const awareness: AwarenessLevel[] = ['veryLow', 'low', 'medium', 'high', 'maximum'];

    for (const pattern of patterns) {
      for (const philosophy of philosophies) {
        for (const level of awareness) {
          const progress: UserProgress = {
            /* mock progress with these dimensions */
          };

          const sections = selectL3Sections(progress, matrix, storyData.nodes);
          expect(sections).toBeDefined();
          expect(sections.archSection).toMatch(/^arch-L3-\d{3}$/);
          expect(sections.algoSection).toMatch(/^algo-L3-\d{3}$/);
          expect(sections.humSection).toMatch(/^hum-L3-\d{3}$/);
          expect(sections.convSection).toMatch(/^conv-L3-\d{3}$/);
        }
      }
    }

});

it('should handle character normalization', () => {
// Test that 'human', 'lastHuman', 'hum' all work
});
});

```

**Tasks:**
- [ ] Write integration tests
- [ ] Test with real data
- [ ] Verify all 45 L3 combinations
- [ ] Test variation selection
- [ ] Ensure 100% pass rate

### 5.3 Content Quality Audit

**Manual review checklist:**
- [ ] Spot-check 10% of variations per character for voice consistency
- [ ] Verify accept/resist/invest philosophical differences clear
- [ ] Check L3 seed elements from L2 appear in L3 sections
- [ ] Verify cross-character bridge elements accurate
- [ ] Read 3-5 complete reader journeys end-to-end
- [ ] Test all three L4 endings for narrative coherence
- [ ] Check PDF export formatting

### 5.4 Production Build

**Checklist:**
- [ ] Run `npm run build`
- [ ] Check bundle size (<10MB target)
- [ ] Verify all JSON in bundle
- [ ] Test `npm run preview`
- [ ] Check browser console (zero errors)
- [ ] Test loading performance (<2s)
- [ ] Verify glob imports work
- [ ] Test on different browsers
- [ ] Mobile notification displays correctly
- [ ] Accessibility audit passes

---

## Phase 6: Documentation (2-3 days)

### 6.1 Data Conventions Guide
**Create**: `docs/DATA_CONVENTIONS.md`
- [ ] Document all canonical formats
- [ ] Explain file structure
- [ ] Show example of each type
- [ ] List common pitfalls

### 6.2 Content Update Procedure
**Create**: `docs/CONTENT_UPDATE_PROCEDURE.md`
- [ ] Steps for adding variations
- [ ] Validation checklist
- [ ] Testing requirements
- [ ] Rollback procedure

### 6.3 Selection API Documentation
**Create**: `docs/VARIATION_SELECTION_API.md`
- [ ] Document all selector functions
- [ ] Explain journey pattern algorithm
- [ ] Show philosophy computation
- [ ] Provide usage examples

---

## UI Display Strategy 🆘 NEEDS DESIGN

**Question 4: How should assembled L3 nodes be displayed?**

**Current challenge**: L3 convergence node assembled from 4 sections (~1200 words total). Need elegant way to present this in StoryView.

**Option A: Single Scrolling Document**
```

┌─────────────────────────────────┐
│ CONVERGENCE │
│ ──────────────── │
│ [Archaeologist section - 300w] │
│ ──────────────── │
│ [Algorithm section - 300w] │
│ ──────────────── │
│ [Last Human section - 300w] │
│ ──────────────── │
│ [Synthesis section - 300w] │
│ │
│ [PRESERVE] [RELEASE] [TRANSFORM]│
└─────────────────────────────────┘

```
**Pros**: Continuous reading, natural flow
**Cons**: Very long scroll, might lose context

**Option B: Tabbed Sections**
```

┌─────────────────────────────────┐
│ [Arch] [Algo] [Human] [Synthesis]│
│ ──────────────── │
│ [Currently selected section] │
│ [300 words] │
│ │
│ [Next section >] │
└─────────────────────────────────┘

```
**Pros**: Manageable chunks, can revisit sections
**Cons**: Breaks reading flow, requires interaction

**Option C: Progressive Reveal**
```

┌─────────────────────────────────┐
│ ARCHAEOLOGIST PERSPECTIVE │
│ ──────────────── │
│ [Section text - 300w] │
│ │
│ [Continue to Algorithm >] │
└─────────────────────────────────┘

```
After reading, auto-scrolls to next section
**Pros**: Paced reading, clear structure
**Cons**: More clicks, can't skip ahead

**Option D: Side-by-Side with Scroll**
```

┌────────┬────────────────────────┐
│ Arch │ [Current section text] │
│ ✓ Algo │ │
│ Human│ │
│ Synth│ │
└────────┴────────────────────────┘
Sidebar shows progress, main area scrolls through all
Pros: Context + flow, visual progress
Cons: Complex layout, narrow reading area
Questions for you:

Which approach fits your vision for "cinematic dystopian cyberpunk"?
Should character sections be visually distinct (different colors/styling)?
Should sections be skippable or must they be read in sequence?
How important is being able to re-read specific sections?
Should the UI emphasize that this is an "assembled" node vs single-author?

My recommendation: Start with Option C (Progressive Reveal) for initial implementation because:

Matches your "recursive narrative" vision
Creates natural pacing
Easy to implement
Can add "skip" option for re-readers
Sets up well for character-specific visual theming

Success Criteria Checklist
Critical Path (Blocks Launch):

✅ Character names normalized (last-human canonical)
✅ Vite glob loader implemented (no fetch)
✅ All nodes have positions (no 0,0)
✅ Edge visibility respects unlock state
✅ UI mojibake fixed
✅ L1 converted (240 variations)
✅ L2 converted (720 variations)
✅ L3 system complete (270 sections + matrix)
✅ L4 terminals converted (3 endings)
✅ Variation selection implemented
✅ Journey pattern detection working
✅ Path philosophy tracking working
✅ Validation script passes 100%
✅ Production build successful
✅ All tests passing

Quality Metrics:

✅ Word counts within ±10%
✅ Voice consistency ≥93%
✅ L3 seeds present in L2
✅ Bundle size <10MB
✅ Load time <2s
✅ Zero console errors

Timeline Estimate
Week 1: Foundation

Days 1-2: Phase 0 + Phase 1 (loader + positions + edges)
Days 3-4: Phase 2 (selection system + types)
Day 5: Phase 3.1 (minimal L1 content)

Week 2: Minimal System Test

Days 1-2: Phase 3.2-3.3 (minimal L2 + L4)
Days 3-5: End-to-end testing, refinement

Weeks 3-5: Bulk Conversion

Week 3: Complete L1 + L2 (960 variations)
Week 4: L3 sections (270 variations)
Week 5: Selection logic production-ready

Week 6: QA + Launch Prep

Phase 5: Validation + testing
Phase 6: Documentation
Final polish + deployment

Total: 6 weeks for complete content system

Open Questions Requiring Decisions

Journey Pattern Thresholds (Phase 2.1): Review proposed metrics, adjust thresholds
Philosophy Weighting (Phase 2.2): How to weight multiple L2 path visits?
L3 UI Display (Phase 3.3): Which section display option (A/B/C/D)?
Variation Selection Weights (Phase 2.4): Confirm metadata weighting strategy
Early Journey Defaults (Phase 2): What patterns before sufficient data?
Refined Content Conversion Punch List v3 - FINAL
With decisions locked and implementation guidance added.

Phase 0: Schema Freeze & Canonical Standards — LOCKED
0.1 Character Naming Convention — CONFIRMED
typescript
// Canonical values (hyphenated, lowercase)
type Character = 'archaeologist' | 'algorithm' | 'last-human' | 'multi-perspective';

// Loader accepts and normalizes: human, lastHuman, hum → 'last-human'
// 'multi-perspective' is reserved for assembled L3 convergence nodes

0.2 L2 Path Philosophy Convention — CONFIRMED
typescript
type PathPhilosophy = 'accept' | 'resist' | 'invest';
// Never "investigate" — remove from any comments/docs

0.3 L3 Dimensional Structure — CONFIRMED (3 × 3 × 5 = 45)
typescript
type JourneyPattern =
| 'linear' // Sequential, minimal backtracking
| 'exploratory' // Higher revisit ratio, breadth-first reading
| 'recursive'; // Deep re-reading of a small set

type PathPhilosophy = 'accept' | 'resist' | 'invest';

type AwarenessLevel =
| 'veryLow' // 0–20%
| 'low' // 21–40%
| 'medium' // 41–60%
| 'high' // 61–80%
| 'maximum'; // 81–100%

// Computed mapping (implementation guidance)
// awareness: bucket temporalAwarenessLevel (0–100) into the five bands above
// journey: derive from readingPath metrics (e.g., revisit ratio & cross-character hops)

0.4 L1/L2 Storage Pattern — CONFIRMED
Pattern B: external variations file per node
paths
src/data/stories/eternal-return/
archaeologist.json # Node definitions with contentFile refs
algorithm.json
human.json # Loader normalizes to 'last-human'
content/
layer1/
arch-L1-variations.json # Array of 80 variation objects
algo-L1-variations.json
hum-L1-variations.json
layer2/
arch-L2-accept-variations.json
arch-L2-resist-variations.json
arch-L2-invest-variations.json
algo-L2-accept-variations.json
algo-L2-resist-variations.json
algo-L2-invest-variations.json
hum-L2-accept-variations.json
hum-L2-resist-variations.json
hum-L2-invest-variations.json

Variations file structure:
json
{
"nodeId": "arch-L1",
"totalVariations": 80,
"distribution": { "initial": 1, "firstRevisit": 46, "metaAware": 33 },
"variations": [
{
"index": 0,
"id": "arch-L1-001",
"transformationState": "initial",
"visitPattern": "firstVisit",
"awarenessRange": [0, 20],
"content": "Full narrative text...",
"metadata": {
"wordCount": 895,
"voiceConsistencyScore": 0.94,
"thematicFocus": ["memory", "preservation"],
"emotionalTone": "archaeological-precision",
"narrativeElements": ["discovery", "loss"]
}
}
]
}

Phase 1: Core Loader Infrastructure (2–3 days)
1.1 Vite Glob Import Loader
File: src/utils/contentLoader.ts
Implementation strategy:
typescript
// Import metadata and nodes at build time
const storyMetadata = import.meta.glob<StoryMetadataFile>('/src/data/stories/_/story.json', { eager: true, import: 'default' });
const characterNodes = import.meta.glob<CharacterNodeFile>('/src/data/stories/_/\*.json', { eager: true, import: 'default' });

// L1/L2 variations
const l1Variations = import.meta.glob<VariationFile>('/src/data/stories/_/content/layer1/_-variations.json', { eager: true, import: 'default' });
const l2Variations = import.meta.glob<VariationFile>('/src/data/stories/_/content/layer2/_-variations.json', { eager: true, import: 'default' });

// L3 — make sections lazy to reduce bundle size
const l3Sections = import.meta.glob<L3Section>('/src/data/stories/_/content/layer3/variations/_.json');
const l3Matrix = import.meta.glob<L3SelectionMatrix>('/src/data/stories/\*/content/layer3/selection-matrix.json', { eager: true, import: 'default' });

// L4 terminals & layout
const l4Terminals = import.meta.glob<L4Terminal>('/src/data/stories/_/content/layer4/_.json', { eager: true, import: 'default' });
const layouts = import.meta.glob<LayoutFile>('/src/data/stories/\*/layout.json', { eager: true, import: 'default' });

Tasks:

- Replace fetch() loaders with glob-based maps
- Normalize character values to canonical enum
- Apply positions from layout before validation; then fallback calculator
- Soft-validate: warn and continue on missing content or references in dev

  1.2 Character Normalization (loader-level)
  typescript
  function normalizeCharacter(char: string): 'archaeologist' | 'algorithm' | 'last-human' | 'multi-perspective' {
  const n = (char || '').toLowerCase().replace(/[-_]/g, '');
  if (n === 'human' || n === 'lasthuman' || n === 'hum') return 'last-human';
  if (n === 'archaeologist' || n === 'arch' || n === 'arc') return 'archaeologist';
  if (n === 'algorithm' || n === 'algo') return 'algorithm';
  if (n === 'multiperspective') return 'multi-perspective';
  throw new Error(`Unknown character: ${char}`);
  }

  1.3 Layout & Fallback Positions
  Add file: src/data/stories/eternal-return/layout.json (authoritative positions)
  Provide fallback calculator that understands arch|arc, algo, hum id prefixes.

  1.4 Validation Ordering
  Assign positions and normalize characters before running validation.
  If validation fails (dev), log warnings and continue to allow UI testing.

  1.5 Edge Unlock Visibility
  File: src/components/NodeMap/edgeUtils.ts
  Minimal change (keep current signature). Use progress.unlockedConnections to style edges:

- Unlocked: use connection type style
- Locked: dashed, thinner, lower opacity (ghosted)

  1.6 UI Glyph Cleanup (remove mojibake)
  Files: NodeMap.tsx, StoryView.tsx, Layout.tsx
  Tasks:

- Replace corrupted glyphs with icons or plain text (e.g., bullets, separators)
- Use simple Unicode for state icons: initial=●, firstRevisit=◑, metaAware=◎
- Replace header/footer symbols with ASCII where possible

Notes

- Do not rewrite node IDs in content files; support both arch- and arc- style in fallback logic.
- Keep L3 sections lazily loaded to manage bundle size; keep selection matrix eager.
