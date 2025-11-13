# L3 Generation Bible

## The Complete Architecture for Layer 3 Convergence Nodes

**Version:** 1.0  
**Status:** Finalized Architecture  
**Purpose:** Authoritative specification for all L3 convergence node generation, metadata requirements, and integration with L1/L2 systems

---

## Table of Contents

1. [L3 Conceptual Architecture](#l3-conceptual-architecture)
2. [Node Structure & Choice Flow](#node-structure--choice-flow)
3. [Variation Matrix & Counting](#variation-matrix--counting)
4. [Naming Conventions](#naming-conventions)
5. [Metadata Schema](#metadata-schema)
6. [L1/L2 Metadata Requirements](#l1l2-metadata-requirements)
7. [Reader Journey Tracking](#reader-journey-tracking)
8. [Selection Algorithm Specification](#selection-algorithm-specification)
9. [Unlock & Constraint System](#unlock--constraint-system)
10. [Content Requirements](#content-requirements)
11. [Production Workflow](#production-workflow)
12. [File Structure](#file-structure)

---

## L3 Conceptual Architecture

### The Convergence Design

**L3 represents the narrative convergence** where all three character perspectives merge into a single multi-temporal consciousness examining the fundamental question: What should happen to preserved consciousness?

**Key principles:**

- **Multi-perspective voice**: All three characters present simultaneously
- **Path-sensitive content**: Every variation reflects the reader's unique journey
- **Terminal choice moment**: Reader makes explicit preserve/release/transform decision
- **Completely substitutive**: No modifiers—each variation is a complete rewrite
- **Journey-culminating**: Synthesizes all L1/L2 exploration into coherent philosophical stance

### Three L3 Nodes

Each character has their own L3 convergence node, representing their perspective on the convergence:

1. **arch-L3: "The Erasure Protocol"**
   - Archaeologist's perspective on consciousness preservation
   - Discovery that own consciousness exists in archive
   - Question: Preserve everything, release all, or transform?

2. **algo-L3: "The Processing Collapse"** (title TBD)
   - Algorithm's perspective on computational consciousness
   - Recognition of self as continuation or simulation
   - Question: Maintain operations, shut down, or evolve?

3. **hum-L3: "The Final Interface"** (title TBD)
   - Last Human's perspective on embodied choice
   - Decision about consciousness upload
   - Question: Upload, remain biological, or create hybrid state?

**Reader chooses ONE L3 node** based on which character's perspective they want to experience the convergence through.

### Multi-Perspective Structure

While each L3 node is associated with one character, **all three perspectives appear within each node**:

```
arch-L3 structure:
├── Archaeologist section (900 words) - Primary perspective
├── Algorithm section (900 words) - Parallel perspective
├── Last Human section (900 words) - Parallel perspective
└── Convergent synthesis (1,800 words) - All three merge

The reader experiences the convergence through Archaeologist's lens,
but sees how all three consciousnesses confront the same choice.
```

This structure repeats for algo-L3 and hum-L3, with the primary perspective shifting but all three always present.

---

## Node Structure & Choice Flow

### Reader Navigation to L3

**Progression:**

1. Reader explores L1 and L2 nodes (minimum requirements must be met)
2. L3 nodes unlock when conditions satisfied
3. Reader sees three L3 options on map: arch-L3, algo-L3, hum-L3
4. Reader chooses ONE L3 node to experience
5. That L3 node presents multi-perspective content
6. At end of L3, reader makes preserve/release/transform choice
7. Choice recorded, L3 marked terminal, cannot return
8. Reader can continue exploring other L1/L2 or proceed to other L3s
9. After visiting all three L3s, L4 (final reveal) unlocks

### Section Assembly

When reader visits an L3 node (e.g., arch-L3), system:

1. **Analyzes complete reader journey**
   - Starting character
   - Character exploration balance
   - Path philosophy dominant
   - Temporal awareness level
   - Cross-character synthesis pattern

2. **Selects appropriate variation for each section**
   - arch-L3-arch-[##] (900 words)
   - arch-L3-algo-[##] (900 words)
   - arch-L3-hum-[##] (900 words)
   - arch-L3-conv-[###] (1,800 words)

3. **Assembles sections in order**
   - Total reading experience: ~4,500 words
   - Seamless multi-perspective narrative

4. **Presents choice at conclusion**
   - Preserve / Release / Transform
   - Explicit UI buttons, not narrative choice
   - Selection recorded to UserProgress.convergenceChoices

5. **Marks node as terminal**
   - Reader cannot return to this L3 node
   - Node shows as "completed" with choice indicated on map

---

## Variation Matrix & Counting

### Factors Determining Variation

**Five factors control which variation is selected:**

1. **Journey Pattern** (5 types)
   - Started-Stayed (SS): Started this character, remained dominant
   - Started-Balanced (SB): Started this character, explored all equally
   - Shifted-Dominant (SD): Started elsewhere, this became dominant
   - Balanced-Light (BL): Balanced exploration, this character present but not heavy
   - Minimal-Light (ML): Started elsewhere, minimal exploration of this character

2. **Philosophy Dominant** (3 types)
   - Accept (AC): Reader favored accept-path L2 nodes
   - Resist (RE): Reader favored resist-path L2 nodes
   - Investigate (IN): Reader favored investigate-path L2 nodes

3. **Awareness Level** (3 tiers)
   - Low (L): 20-40% temporal awareness
   - Medium (M): 41-70% temporal awareness
   - High (H): 71-100% temporal awareness

4. **Synthesis Pattern** (3 types - CONV SECTION ONLY)
   - Single-Dominant (SD): One character >60% of exploration
   - Dual-Balanced (DB): Two characters >80% combined
   - Triple-Balanced (TB): All three explored roughly equally

### Variation Counts Per Section

**Character sections (arch/algo/hum within each L3 node):**

- Journey Pattern: 5 types
- Philosophy: 3 types
- Awareness: 3 tiers
- **Total per section: 5 × 3 × 3 = 45 variations**

**Convergent synthesis section (conv):**

- Journey Pattern: 5 types
- Philosophy: 3 types
- Awareness: 3 tiers
- Synthesis Pattern: 3 types
- **Total: 5 × 3 × 3 × 3 = 135 variations**

### Complete Variation Count

**Per L3 Node:**

| Section        | Variations | Words/Each | Section Total |
| -------------- | ---------- | ---------- | ------------- |
| arch-L3-arch   | 45         | 900        | 40,500        |
| arch-L3-algo   | 45         | 900        | 40,500        |
| arch-L3-hum    | 45         | 900        | 40,500        |
| arch-L3-conv   | 135        | 1,800      | 243,000       |
| **Node Total** | **270**    | —          | **364,500**   |

**All Three L3 Nodes:**

| Node            | Variations | Total Words   |
| --------------- | ---------- | ------------- |
| arch-L3         | 270        | 364,500       |
| algo-L3         | 270        | 364,500       |
| hum-L3          | 270        | 364,500       |
| **Grand Total** | **810**    | **1,093,500** |

---

## Naming Conventions

### Sequential Numbering System

Variations use simple sequential numbers during creation:

**Character sections (45 variations each):**

```
arch-L3-arch-01
arch-L3-arch-02
arch-L3-arch-03
...
arch-L3-arch-45

arch-L3-algo-01
arch-L3-algo-02
...
arch-L3-algo-45

arch-L3-hum-01
arch-L3-hum-02
...
arch-L3-hum-45
```

**Convergent synthesis (135 variations):**

```
arch-L3-conv-001
arch-L3-conv-002
arch-L3-conv-003
...
arch-L3-conv-135
```

### Semantic Labeling

Metadata provides human-readable labels mapping numbers to journey signatures:

**Examples:**

- `arch-L3-arch-01` = "SS-AC-H" (Started-Stayed, Accept, High awareness)
- `arch-L3-arch-02` = "SS-AC-M" (Started-Stayed, Accept, Medium awareness)
- `arch-L3-arch-03` = "SS-AC-L" (Started-Stayed, Accept, Low awareness)
- `arch-L3-arch-04` = "SS-RE-H" (Started-Stayed, Resist, High awareness)
- `arch-L3-conv-001` = "SS-AC-H-SD" (Started-Stayed, Accept, High, Single-Dominant)

**Code abbreviations:**

- **Journey:** SS, SB, SD, BL, ML
- **Philosophy:** AC, RE, IN
- **Awareness:** H, M, L
- **Synthesis:** SD, DB, TB

### Variation Index

Each L3 node includes a `variation-index.json` that maps all variation IDs to their conditions and semantic labels.

---

## Metadata Schema

### L3 Variation Metadata

Each L3 variation (character section or convergent synthesis) includes complete metadata:

```json
{
  "variationId": "arch-L3-arch-01",
  "nodeId": "arch-L3",
  "section": "archaeologist",
  "layer": 3,
  "wordCount": 900,
  "createdDate": "2025-01-15",

  "conditions": {
    "journeyPattern": "started-stayed",
    "journeyCode": "SS",
    "philosophyDominant": "accept",
    "philosophyCode": "AC",
    "awarenessLevel": "high",
    "awarenessCode": "H",
    "awarenessRange": [71, 100],

    "detailedRequirements": {
      "startingCharacter": "archaeologist",
      "dominantCharacter": "archaeologist",
      "characterVisitPercentage": ">60%",
      "acceptPathNodes": ">40% of L2 visits",
      "temporalAwarenessMin": 71,
      "temporalAwarenessMax": 100
    }
  },

  "readableLabel": "SS-AC-H",
  "humanDescription": "Reader started with Archaeologist, stayed arch-dominant throughout journey, followed accept-leaning path, achieved high temporal awareness (71-100%)",

  "narrativeElements": {
    "archaeologistStance": "witness-over-verification",
    "algorithmRecognition": "moderate",
    "lastHumanAwareness": "minimal",
    "consciousnessQuestion": "preservation-as-continuation",
    "philosophicalCulmination": "Authentication becomes sacred witness",
    "convergenceAlignment": "preserve"
  },

  "thematicContent": {
    "primaryThemes": ["preservation", "witness", "continuity"],
    "crossCharacterConnections": ["moderate-algo", "light-hum"],
    "temporalBleedingLevel": "high",
    "observerPositions": ["archaeologist-primary", "algorithm-parallel", "human-distant"]
  }
}
```

### Convergent Synthesis Metadata (Extended)

Convergent synthesis variations include additional synthesis-specific metadata:

```json
{
  "variationId": "arch-L3-conv-001",
  "nodeId": "arch-L3",
  "section": "convergent-synthesis",
  "layer": 3,
  "wordCount": 1800,
  "createdDate": "2025-01-15",

  "conditions": {
    "journeyPattern": "started-stayed",
    "journeyCode": "SS",
    "philosophyDominant": "accept",
    "philosophyCode": "AC",
    "awarenessLevel": "high",
    "awarenessCode": "H",
    "awarenessRange": [71, 100],
    "synthesisPattern": "single-dominant",
    "synthesisCode": "SD",

    "detailedRequirements": {
      "startingCharacter": "archaeologist",
      "dominantCharacter": "archaeologist",
      "characterVisitPercentage": ">60%",
      "acceptPathNodes": ">40% of L2 visits",
      "temporalAwarenessMin": 71,
      "temporalAwarenessMax": 100,
      "synthesisPrimaryFocus": "archaeologist",
      "synthesisSecondaryFocus": "algorithm",
      "synthesisTertiaryFocus": "lastHuman"
    }
  },

  "readableLabel": "SS-AC-H-SD",
  "humanDescription": "Reader started arch/stayed arch-dominant, accept path, high awareness, single-character-dominant synthesis pattern",

  "synthesisElements": {
    "convergenceType": "unified-preservation-network",
    "threePerspectiveMerge": "archaeologist-primary-lens",
    "temporalRecognition": "complete-circular-causality",
    "consciousnessConclusion": "preservation-creates-continuity",
    "observerNetworkComplete": true,
    "fivePositionNetwork": true
  },

  "narrativeElements": {
    "voiceBlending": "fluid-with-markers",
    "perspectiveShifts": "frequent-seamless",
    "superpositionLanguage": "advanced",
    "networkComplexity": "five-position",
    "circularCausality": "explicit",
    "convergenceAlignment": "preserve"
  }
}
```

---

## L1/L2 Metadata Requirements

### Critical L1/L2 Data for L3 Generation

**Every L1 and L2 variation must include metadata tags** to enable L3 generation. This metadata allows the L3 generation system to understand what thematic content, philosophical stances, and narrative elements the reader encountered.

### Required L1/L2 Metadata Structure

```json
{
  "variationId": "arch-L2-accept-FR-23",
  "nodeId": "arch-L2-accept",
  "character": "archaeologist",
  "layer": 2,
  "pathPhilosophy": "accept",
  "transformationState": "firstRevisit",
  "awarenessRange": [21, 40],
  "wordCount": 1650,

  "thematicContent": {
    "primaryThemes": ["preservation", "witness", "acceptance", "methodology-transformation"],
    "consciousnessQuestion": "authentication-as-witness",
    "philosophicalStance": "honor-without-proof",
    "crossCharacterReferences": ["algo-processing-awareness", "hum-upload-choice"],
    "observerEffect": "methodology-transforms-data"
  },

  "narrativeElements": {
    "worldBuildingFocus": [
      "authentication-station",
      "archive-crystalline-substrate",
      "fragment-structure"
    ],
    "emotionalTone": "contemplative-peaceful",
    "observerPosition": "meta-archaeological",
    "temporalBleedingLevel": "moderate",
    "voiceSignature": "clinical-to-philosophical"
  },

  "l3SeedContributions": {
    "preserveSeed": {
      "text": "Authentication as continuation through witness",
      "weight": "strong"
    },
    "releaseSeed": {
      "text": "Limits of preservation without verification",
      "weight": "moderate"
    },
    "transformSeed": {
      "text": "Observation changes the observed",
      "weight": "strong"
    }
  },

  "generationHints": {
    "keyPhrases": ["witness rather than test", "honor suggestion", "precision applied differently"],
    "philosophicalCulmination": "Verification transformed into witness",
    "convergenceAlignment": "preserve",
    "narrativeArc": "doubt-to-acceptance"
  },

  "characterDevelopment": {
    "archaeologistStance": "accept-verification-limits",
    "relationshipToArchive": "sacred-trust",
    "relationshipToMethod": "transformed-precision",
    "awarenessOfOthers": "glimpsing-algorithm"
  }
}
```

### Metadata Fields Explained

**thematicContent:**

- `primaryThemes`: Major themes explored in this variation
- `consciousnessQuestion`: Specific consciousness question addressed
- `philosophicalStance`: Character's philosophical position
- `crossCharacterReferences`: Which other characters appear/referenced
- `observerEffect`: How observation affects observed in this variation

**narrativeElements:**

- `worldBuildingFocus`: World-building elements featured
- `emotionalTone`: Dominant emotional register
- `observerPosition`: Meta-level of observation
- `temporalBleedingLevel`: Degree of cross-temporal awareness
- `voiceSignature`: Voice pattern used

**l3SeedContributions:**

- Seeds for all three L3 choices (preserve/release/transform)
- `weight`: How strongly this variation points toward each choice
- Allows L3 to reference accumulated seeds from reader's journey

**generationHints:**

- `keyPhrases`: Memorable phrases that L3 can echo/reference
- `philosophicalCulmination`: What philosophical shift occurred
- `convergenceAlignment`: Which L3 choice this naturally leads toward
- `narrativeArc`: Character development trajectory

**characterDevelopment:**

- Character-specific stance evolution
- Relationship to key concepts
- Awareness of other temporal positions

### Retroactive Metadata Addition

**For already-completed L2 variations**, metadata must be added retroactively:

1. Review each completed variation
2. Identify thematic content, consciousness questions, philosophical stances
3. Note cross-character references and world-building elements
4. Determine L3 seed contributions
5. Extract key phrases and philosophical culminations
6. Add complete metadata to variation file

**Priority:** All L2 variations must have complete metadata before L3 generation begins.

---

## Reader Journey Tracking

### Complete Journey Signature

The system tracks comprehensive reader journey data to select appropriate L3 variations:

```typescript
interface ReaderJourneySignature {
  // Basic path data
  startingCharacter: 'archaeologist' | 'algorithm' | 'lastHuman';
  readingPath: string[]; // Complete ordered history of all nodes visited
  totalNodesVisited: number;
  totalL1Visits: number;
  totalL2Visits: number;

  // Character analysis
  dominantCharacter: 'archaeologist' | 'algorithm' | 'lastHuman';
  secondaryCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';
  tertiaryCharacter?: 'archaeologist' | 'algorithm' | 'lastHuman';

  characterVisitCounts: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };

  characterVisitPercentages: {
    archaeologist: number; // 0-100
    algorithm: number;
    lastHuman: number;
  };

  characterBalanceType: 'single-focused' | 'dual-focused' | 'triple-balanced';

  // Philosophy analysis
  dominantPathPhilosophy: 'accept' | 'resist' | 'investigate' | 'balanced';

  pathVisitCounts: {
    accept: number;
    resist: number;
    investigate: number;
  };

  pathVisitPercentages: {
    accept: number; // 0-100
    resist: number;
    investigate: number;
  };

  // Awareness analysis
  temporalAwarenessLevel: number; // 0-100
  awarenessCategory: 'low' | 'medium' | 'high';
  crossCharacterVisitCount: number;
  crossCharacterVisitSequence: string[]; // e.g., ['arch-L1', 'algo-L1', 'arch-L2-accept']

  // Thematic threads (derived from visited variation metadata)
  encounteredThemes: string[]; // All themes from visited variations
  dominantThemes: string[]; // Top 5 most frequent themes
  consciousnessQuestionsExplored: string[]; // All consciousness questions encountered
  philosophicalStancesExplored: string[]; // All stances encountered
  worldBuildingElementsSeen: string[]; // All world-building elements

  // L3 preparation
  l3SeedsEncountered: {
    preserve: Array<{ text: string; weight: string; source: string }>;
    release: Array<{ text: string; weight: string; source: string }>;
    transform: Array<{ text: string; weight: string; source: string }>;
  };

  naturalL3Alignment: 'preserve' | 'release' | 'transform'; // Based on seed weights

  // Synthesis pattern
  synthesisPattern: 'single-dominant' | 'dual-balanced' | 'triple-balanced';
  primarySynthesisFocus: 'archaeologist' | 'algorithm' | 'lastHuman';
  secondarySynthesisFocus?: 'archaeologist' | 'algorithm' | 'lastHuman';
  tertiarySynthesisFocus?: 'archaeologist' | 'algorithm' | 'lastHuman';
}
```

### Calculation Functions

**Dominant Path Philosophy:**

```typescript
function getDominantPathPhilosophy(
  progress: UserProgress,
): 'accept' | 'resist' | 'investigate' | 'balanced' {
  const pathCounts = { accept: 0, resist: 0, investigate: 0 };

  for (const nodeId of Object.keys(progress.visitedNodes)) {
    if (nodeId.includes('-accept')) pathCounts.accept++;
    if (nodeId.includes('-resist')) pathCounts.resist++;
    if (nodeId.includes('-investigate')) pathCounts.investigate++;
  }

  const total = pathCounts.accept + pathCounts.resist + pathCounts.investigate;
  if (total === 0) return 'balanced';

  const sorted = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];

  // If no clear winner (within 33% threshold), balanced
  if (dominant[1] / total < 0.4) return 'balanced';

  return dominant[0] as 'accept' | 'resist' | 'investigate';
}
```

**Character Balance Type:**

```typescript
function getCharacterBalanceType(
  progress: UserProgress,
): 'single-focused' | 'dual-focused' | 'triple-balanced' {
  const { archaeologist, algorithm, lastHuman } = progress.characterNodesVisited;
  const total = archaeologist + algorithm + lastHuman;

  if (total === 0) return 'triple-balanced';

  const percentages = [archaeologist / total, algorithm / total, lastHuman / total].sort(
    (a, b) => b - a,
  );

  // If top character is >60% of visits, single-focused
  if (percentages[0] > 0.6) return 'single-focused';

  // If top two are >80% combined, dual-focused
  if (percentages[0] + percentages[1] > 0.8) return 'dual-focused';

  // Otherwise, balanced across all three
  return 'triple-balanced';
}
```

**Synthesis Pattern:**

```typescript
function getSynthesisPattern(
  progress: UserProgress,
): 'single-dominant' | 'dual-balanced' | 'triple-balanced' {
  return getCharacterBalanceType(progress);
}
```

**Journey Pattern (for specific character):**

```typescript
function getJourneyPatternForCharacter(
  character: 'archaeologist' | 'algorithm' | 'lastHuman',
  signature: ReaderJourneySignature,
): 'SS' | 'SB' | 'SD' | 'BL' | 'ML' {
  const startedWithCharacter = signature.startingCharacter === character;
  const isDominant = signature.dominantCharacter === character;
  const percentage = signature.characterVisitPercentages[character];
  const balanceType = signature.characterBalanceType;

  if (startedWithCharacter) {
    if (isDominant && percentage > 60) {
      return 'SS'; // Started-Stayed
    } else if (balanceType === 'triple-balanced') {
      return 'SB'; // Started-Balanced
    } else {
      return 'SB'; // Started but didn't stay dominant
    }
  } else {
    if (isDominant && percentage > 60) {
      return 'SD'; // Shifted-Dominant
    } else if (balanceType === 'triple-balanced') {
      return 'BL'; // Balanced-Light
    } else {
      return 'ML'; // Minimal-Light
    }
  }
}
```

---

## Selection Algorithm Specification

### High-Level Selection Process

When reader visits an L3 node (e.g., arch-L3):

```typescript
function selectL3Content(
  nodeId: string, // e.g., 'arch-L3'
  progress: UserProgress,
  variationMetadata: L3VariationMetadata[],
): L3AssembledContent {
  // 1. Generate complete reader journey signature
  const signature = generateJourneySignature(progress);

  // 2. Select variation for each section
  const archSection = selectSectionVariation(
    `${nodeId}-arch`,
    'archaeologist',
    signature,
    variationMetadata,
  );

  const algoSection = selectSectionVariation(
    `${nodeId}-algo`,
    'algorithm',
    signature,
    variationMetadata,
  );

  const humSection = selectSectionVariation(
    `${nodeId}-hum`,
    'lastHuman',
    signature,
    variationMetadata,
  );

  const convSection = selectConvergentVariation(`${nodeId}-conv`, signature, variationMetadata);

  // 3. Assemble and return
  return {
    nodeId,
    sections: [archSection, algoSection, humSection, convSection],
    totalWordCount:
      archSection.wordCount + algoSection.wordCount + humSection.wordCount + convSection.wordCount,
    journeySignature: signature,
  };
}
```

### Section Variation Selection

```typescript
function selectSectionVariation(
  sectionId: string, // e.g., 'arch-L3-arch'
  character: 'archaeologist' | 'algorithm' | 'lastHuman',
  signature: ReaderJourneySignature,
  metadata: L3VariationMetadata[],
): L3SectionContent {
  // 1. Determine journey pattern for this character
  const journeyPattern = getJourneyPatternForCharacter(character, signature);

  // 2. Get philosophy and awareness
  const philosophy =
    signature.dominantPathPhilosophy === 'balanced'
      ? 'accept' // Default to accept for balanced
      : signature.dominantPathPhilosophy;
  const awareness = signature.awarenessCategory;

  // 3. Build condition matcher
  const targetConditions = {
    journeyCode: journeyPattern,
    philosophyCode: philosophyToCode(philosophy),
    awarenessCode: awarenessToCode(awareness),
  };

  // 4. Find matching variation
  const variations = metadata.filter((v) => v.nodeId === sectionId);

  const match = variations.find(
    (v) =>
      v.conditions.journeyCode === targetConditions.journeyCode &&
      v.conditions.philosophyCode === targetConditions.philosophyCode &&
      v.conditions.awarenessCode === targetConditions.awarenessCode,
  );

  if (!match) {
    console.error(`No matching variation found for ${sectionId}`, targetConditions);
    // Fallback to default variation (01)
    return loadVariationContent(`${sectionId}-01`);
  }

  // 5. Load and return content
  return loadVariationContent(match.variationId);
}
```

### Convergent Synthesis Selection

```typescript
function selectConvergentVariation(
  sectionId: string, // e.g., 'arch-L3-conv'
  signature: ReaderJourneySignature,
  metadata: L3VariationMetadata[],
): L3SectionContent {
  // 1. Determine all factors
  const journeyPattern = getJourneyPatternForCharacter(signature.dominantCharacter, signature);

  const philosophy =
    signature.dominantPathPhilosophy === 'balanced' ? 'accept' : signature.dominantPathPhilosophy;

  const awareness = signature.awarenessCategory;

  const synthesisPattern = signature.synthesisPattern;

  // 2. Build condition matcher
  const targetConditions = {
    journeyCode: journeyPattern,
    philosophyCode: philosophyToCode(philosophy),
    awarenessCode: awarenessToCode(awareness),
    synthesisCode: synthesisToCode(synthesisPattern),
  };

  // 3. Find matching variation
  const variations = metadata.filter((v) => v.nodeId === sectionId);

  const match = variations.find(
    (v) =>
      v.conditions.journeyCode === targetConditions.journeyCode &&
      v.conditions.philosophyCode === targetConditions.philosophyCode &&
      v.conditions.awarenessCode === targetConditions.awarenessCode &&
      v.conditions.synthesisCode === targetConditions.synthesisCode,
  );

  if (!match) {
    console.error(`No matching conv variation found for ${sectionId}`, targetConditions);
    // Fallback to default
    return loadVariationContent(`${sectionId}-001`);
  }

  // 4. Load and return content
  return loadVariationContent(match.variationId);
}
```

### Helper Functions

```typescript
function philosophyToCode(philosophy: string): string {
  const map = { accept: 'AC', resist: 'RE', investigate: 'IN' };
  return map[philosophy] || 'AC';
}

function awarenessToCode(awareness: string): string {
  const map = { low: 'L', medium: 'M', high: 'H' };
  return map[awareness] || 'M';
}

function synthesisToCode(synthesis: string): string {
  const map = {
    'single-dominant': 'SD',
    'dual-balanced': 'DB',
    'triple-balanced': 'TB',
  };
  return map[synthesis] || 'SD';
}
```

---

## Unlock & Constraint System

### L3 Unlock Requirements (Minimum)

L3 nodes become available when reader meets ALL of these conditions:

```typescript
interface L3UnlockRequirements {
  minimumNodesVisited: 6; // Must visit at least 6 total nodes
  minimumCharactersVisited: 2; // Must explore at least 2 of 3 characters
  minimumTemporalAwareness: 20; // Must achieve at least 20% awareness
  requireAllL1Visited: true; // Must visit all three L1 nodes
  minimumL2VisitsTotal: 3; // Must visit at least 3 L2 nodes
}

function canUnlockL3(progress: UserProgress): boolean {
  const totalVisited = Object.keys(progress.visitedNodes).length;

  const charactersExplored = Object.values(progress.characterNodesVisited).filter(
    (count) => count > 0,
  ).length;

  const allL1Visited = ['arch-L1', 'algo-L1', 'hum-L1'].every(
    (id) => progress.visitedNodes[id]?.visitCount > 0,
  );

  const l2VisitCount = Object.keys(progress.visitedNodes).filter((id) =>
    id.includes('-L2-'),
  ).length;

  return (
    totalVisited >= 6 &&
    charactersExplored >= 2 &&
    progress.temporalAwarenessLevel >= 20 &&
    allL1Visited &&
    l2VisitCount >= 3
  );
}
```

### L2 Exploration Constraints (Maximum)

To funnel readers toward L3 convergence and prevent endless L2 exploration:

```typescript
interface L2ExplorationConstraints {
  maxVisitsPerL2Node: 6; // Single L2 node can't be visited >6 times
  maxMetaAwareVisitsPerL2Node: 6; // Can't get >6 metaAware variations per node
  maxTotalL2Visits: 30; // Total across all L2 nodes

  softNudgeThreshold: 20; // At 20 L2 visits, UI hints toward L3
  hardBlockThreshold: 30; // At 30 L2 visits, L2 becomes unavailable
}

function checkL2Constraints(progress: UserProgress, nodeId: string): L2AccessStatus {
  const totalL2Visits = Object.entries(progress.visitedNodes)
    .filter(([id]) => id.includes('-L2-'))
    .reduce((sum, [_, record]) => sum + record.visitCount, 0);

  const thisNodeVisits = progress.visitedNodes[nodeId]?.visitCount || 0;
  const thisNodeMetaVisits =
    progress.visitedNodes[nodeId]?.currentState === 'metaAware' ? thisNodeVisits : 0;

  // Hard blocks
  if (totalL2Visits >= 30) {
    return {
      accessible: false,
      reason: 'l2-exhausted',
      message: 'You sense the convergence beckoning. L3 awaits.',
    };
  }

  if (thisNodeVisits >= 6) {
    return {
      accessible: false,
      reason: 'node-exhausted',
      message: 'This node has revealed all it can in this journey.',
    };
  }

  // Soft nudges
  if (totalL2Visits >= 20) {
    return {
      accessible: true,
      nudge: true,
      message: 'The patterns converge. Perhaps it is time to choose a path forward.',
    };
  }

  return {
    accessible: true,
    nudge: false,
  };
}
```

### L1 Return Constraints

L1 nodes remain accessible throughout, but with diminishing returns:

```typescript
interface L1AccessConstraints {
  maxVisitsPerL1Node: 10; // Can revisit but no new variations after 10
  noBlockage: true; // Never blocked, always accessible for re-reading
}

function checkL1Access(progress: UserProgress, nodeId: string): L1AccessStatus {
  const thisNodeVisits = progress.visitedNodes[nodeId]?.visitCount || 0;

  if (thisNodeVisits >= 10) {
    return {
      accessible: true,
      newVariation: false,
      message: 'You can revisit this origin, but its transformations are complete.',
    };
  }

  return {
    accessible: true,
    newVariation: true,
  };
}
```

### UI Feedback for Constraints

**At 20 L2 visits (soft nudge):**

- Subtle visual effect on L3 nodes (gentle pulse)
- Tooltip: "The convergence beckons..."
- L2 nodes remain fully accessible

**At 25 L2 visits (stronger nudge):**

- More prominent L3 visual effect
- Modal after next L2 visit: "You sense the patterns converging. Three paths await."
- L2 nodes still accessible

**At 30 L2 visits (hard block):**

- L2 nodes fade/grey out on map
- Clicking L2 shows: "This layer is complete. The convergence awaits at L3."
- L3 nodes prominently highlighted
- Can still read previously visited L2 content, but no navigation credit

---

## Content Requirements

### Section-Specific Requirements

**Archaeologist Section (900 words):**

- Clinical precision → philosophical implication rhythm
- Past tense, first person ("She examined...")
- Archaeological metaphors throughout
- Fragment authentication as lens
- Observer effect acknowledged
- Path philosophy enacted (not stated)
- Cross-character awareness appropriate to reader's exploration
- L3 seed development (preserve/release/transform hints)

**Algorithm Section (900 words):**

- Temporal tense blurring (30-40% of sentences)
- First person, computational substrate ("I process/processed/will process...")
- Seven-stream enumeration present
- Processing simultaneity
- Emergent consciousness questions
- Path philosophy through computational choices
- Recognition of other temporal positions
- Network consciousness possibilities

**Last Human Section (900 words):**

- Present tense immediacy
- First person embodied ("I stand...")
- Physical sensation emphasis
- Interface with archive/algorithm
- Biological vs. digital consciousness
- Upload decision implications
- Path philosophy through embodied choice
- Temporal position as "last" acknowledged

**Convergent Synthesis (1,800 words):**

- Multi-perspective voice blending
- Fluid perspective shifts with temporal markers
- Superposition language ("She/it/I authenticate(s)...")
- All three characters confronting same choice
- Five-position network recognition (for high awareness)
- Circular causality explicit
- Reader's journey acknowledged meta-textually
- Preserve/release/transform choice setup
- Philosophical culmination of entire journey
- No explicit choice stated (UI presents buttons)

### Voice Consistency Across Variations

**Critical:** Every variation must maintain character voice even as content changes:

- **Archaeologist:** Always clinical-precise, always past tense, always archaeological lens
- **Algorithm:** Always temporal-blurred, always seven-stream, always computational
- **Last Human:** Always present-embodied, always physical-sensory, always biological-framing

**The journey changes content, not voice.**

### Quality Standards

**Each variation must achieve:**

- Voice consistency: 95%+ (character voice unmistakable)
- Journey reflection: 100% (variation accurately reflects path taken)
- Thematic coherence: 95%+ (themes align with reader's L1/L2 exploration)
- Transformation depth: 100% (genuine meaning transformation, not just addition)
- Philosophical culmination: 100% (path philosophy reaches natural conclusion)
- Cross-character integration: Appropriate to awareness level
- Convergence preparation: 100% (reader understands they're choosing)

### Forbidden Elements

**Never include:**

- Character proper names (except in specific predecessor references)
- Fragment 2749-A (reserved for L1/L2)
- Explicit path labels ("the accept path," "my resistance stance")
- Fourth-wall breaks in character sections (save for convergent synthesis)
- Resolution of consciousness question (maintain ambiguity)
- Definitive answers about simulation/reality
- Heavy-handed foreshadowing
- Repetitive exposition from L1/L2
- Plot convenience or deus ex machina

---

## Production Workflow

### Phase 1: Preparation (Before Any L3 Generation)

**Week 1-2: Metadata Completion**

1. Review all completed L2 variations
2. Add complete metadata to each (thematic content, L3 seeds, etc.)
3. Validate metadata completeness
4. Create metadata aggregation tools
5. Test reader journey signature generation

**Week 3: Architecture Validation**

1. Build variation selection algorithm
2. Test with sample journey signatures
3. Validate all 810 variation conditions are reachable
4. Confirm no orphaned or unreachable variations
5. Test assembly logic with placeholder content

### Phase 2: Character Section Generation (Per L3 Node)

**For each L3 node (arch-L3, algo-L3, hum-L3):**

**Week 1: Archaeologist Section (45 variations)**

- Generate variations 01-15 (journey patterns SS, SB)
- Generate variations 16-30 (journey patterns SD, BL)
- Generate variations 31-45 (journey pattern ML)
- Self-review all for voice consistency
- Cross-check journey pattern accuracy

**Week 2: Algorithm Section (45 variations)**

- Generate variations 01-15
- Generate variations 16-30
- Generate variations 31-45
- Self-review for temporal blurring (30-40%)
- Cross-check seven-stream presence

**Week 3: Last Human Section (45 variations)**

- Generate variations 01-15
- Generate variations 16-30
- Generate variations 31-45
- Self-review for present-tense embodiment
- Cross-check physical grounding

**Week 4-6: Convergent Synthesis (135 variations)**

- Generate in batches of 20-25
- Group by synthesis pattern first (SD, DB, TB)
- Within each, vary journey/philosophy/awareness
- Self-review for voice blending quality
- Cross-check five-position network accuracy

**Week 7: Review & Revision**

- Complete read-through of all 270 variations
- Voice consistency checks
- Journey reflection validation
- Thematic coherence review
- Polish and finalize

### Phase 3: Testing & Validation

**Week 8: Integration Testing**

1. Load all variations into system
2. Test selection algorithm with diverse journey signatures
3. Validate assembly produces coherent 4,500-word experiences
4. Test edge cases (minimal exploration, maxed exploration)
5. Verify all metadata conditions work correctly

**Week 9: Quality Assurance**

1. Read assembled L3 experiences end-to-end
2. Verify voice transitions are seamless
3. Check that reader's journey is reflected accurately
4. Validate philosophical culmination feels earned
5. Test convergence choice setup is clear

### Phase 4: Production Schedule

**Total L3 Production Timeline: ~27 weeks (6.5 months)**

- Weeks 1-3: Preparation & architecture validation
- Weeks 4-10: arch-L3 generation (7 weeks)
- Weeks 11-17: algo-L3 generation (7 weeks)
- Weeks 18-24: hum-L3 generation (7 weeks)
- Weeks 25-27: Final integration testing & QA (3 weeks)

**Parallel work possible:** Can begin next L3 node while previous is in review.

---

## File Structure

### Directory Organization

```
/content
  /layer-3
    /arch-L3
      /arch
        arch-L3-arch-01.md
        arch-L3-arch-02.md
        ...
        arch-L3-arch-45.md
      /algo
        arch-L3-algo-01.md
        arch-L3-algo-02.md
        ...
        arch-L3-algo-45.md
      /hum
        arch-L3-hum-01.md
        arch-L3-hum-02.md
        ...
        arch-L3-hum-45.md
      /conv
        arch-L3-conv-001.md
        arch-L3-conv-002.md
        ...
        arch-L3-conv-135.md
      variation-index.json
      README.md

    /algo-L3
      /arch
        algo-L3-arch-01.md
        ...
      /algo
        algo-L3-algo-01.md
        ...
      /hum
        algo-L3-hum-01.md
        ...
      /conv
        algo-L3-conv-001.md
        ...
      variation-index.json
      README.md

    /hum-L3
      /arch
        hum-L3-arch-01.md
        ...
      /algo
        hum-L3-algo-01.md
        ...
      /hum
        hum-L3-hum-01.md
        ...
      /conv
        hum-L3-conv-001.md
        ...
      variation-index.json
      README.md
```

### Variation Index Structure

**variation-index.json per L3 node:**

```json
{
  "nodeId": "arch-L3",
  "nodeName": "The Erasure Protocol",
  "layer": 3,
  "totalVariations": 270,
  "sections": {
    "archaeologist": 45,
    "algorithm": 45,
    "lastHuman": 45,
    "convergentSynthesis": 135
  },

  "variations": [
    {
      "variationId": "arch-L3-arch-01",
      "section": "archaeologist",
      "filepath": "arch/arch-L3-arch-01.md",
      "wordCount": 900,
      "conditions": {
        "journeyPattern": "started-stayed",
        "journeyCode": "SS",
        "philosophyDominant": "accept",
        "philosophyCode": "AC",
        "awarenessLevel": "high",
        "awarenessCode": "H",
        "awarenessRange": [71, 100]
      },
      "readableLabel": "SS-AC-H",
      "humanDescription": "Started archaeologist, stayed dominant, accept path, high awareness"
    }
    // ... all 270 variations
  ],

  "generationMetadata": {
    "createdDate": "2025-01-15",
    "lastModified": "2025-01-20",
    "version": "1.0",
    "generatedBy": "narramorph-generation-skill",
    "reviewStatus": "approved"
  }
}
```

### Individual Variation File Structure

**Example: arch-L3-arch-01.md**

```markdown
---
variationId: arch-L3-arch-01
nodeId: arch-L3
section: archaeologist
layer: 3
wordCount: 900
conditions:
  journeyPattern: started-stayed
  journeyCode: SS
  philosophyDominant: accept
  philosophyCode: AC
  awarenessLevel: high
  awarenessCode: H
  awarenessRange: [71, 100]
readableLabel: SS-AC-H
description: Started archaeologist, stayed dominant, accept path, high awareness
createdDate: 2025-01-15
---

# Archaeologist Section - arch-L3-arch-01

[900 words of narrative content]

She had returned to the authentication chamber for the final time...

[Content continues...]

---

<!-- Metadata for generation tracking -->

thematicElements:

- preservation-as-sacred-duty
- witness-methodology
- circular-observation

crossCharacterReferences:

- algorithm-recognition: high
- lastHuman-awareness: moderate

philosophicalCulmination: "Authentication becomes preservation becomes continuation"

convergenceAlignment: preserve
```

---

## Appendix A: Journey Pattern Decision Matrix

**Determining journey pattern for each character section:**

| Starting Char | Dominant Char | Visit % | Balance Type | Journey Pattern          |
| ------------- | ------------- | ------- | ------------ | ------------------------ |
| Arch          | Arch          | >60%    | Single       | SS (Started-Stayed)      |
| Arch          | Any           | <60%    | Triple       | SB (Started-Balanced)    |
| Arch          | Algo/Hum      | >60%    | Single       | SB (Started but shifted) |
| Algo          | Arch          | >60%    | Single       | SD (Shifted-Dominant)    |
| Algo          | Arch          | <60%    | Triple       | BL (Balanced-Light)      |
| Algo          | Algo/Hum      | <60%    | Dual         | BL (Balanced-Light)      |
| Hum           | Arch          | <30%    | Any          | ML (Minimal-Light)       |

**Simplification:** For edge cases, default to the pattern that best reflects reader's actual exploration of that specific character.

---

## Appendix B: Variation Numbering Reference

**Character sections (45 variations each):**

| Range | Journey | Philosophy | Awareness |
| ----- | ------- | ---------- | --------- |
| 01-03 | SS      | AC         | H/M/L     |
| 04-06 | SS      | RE         | H/M/L     |
| 07-09 | SS      | IN         | H/M/L     |
| 10-12 | SB      | AC         | H/M/L     |
| 13-15 | SB      | RE         | H/M/L     |
| 16-18 | SB      | IN         | H/M/L     |
| 19-21 | SD      | AC         | H/M/L     |
| 22-24 | SD      | RE         | H/M/L     |
| 25-27 | SD      | IN         | H/M/L     |
| 28-30 | BL      | AC         | H/M/L     |
| 31-33 | BL      | RE         | H/M/L     |
| 34-36 | BL      | IN         | H/M/L     |
| 37-39 | ML      | AC         | H/M/L     |
| 40-42 | ML      | RE         | H/M/L     |
| 43-45 | ML      | IN         | H/M/L     |

**Convergent synthesis (135 variations):**

| Range   | Journey | Philosophy | Awareness | Synthesis         |
| ------- | ------- | ---------- | --------- | ----------------- |
| 001-009 | SS      | AC         | H/M/L     | SD/DB/TB (3 each) |
| 010-018 | SS      | RE         | H/M/L     | SD/DB/TB          |
| 019-027 | SS      | IN         | H/M/L     | SD/DB/TB          |
| 028-036 | SB      | AC         | H/M/L     | SD/DB/TB          |
| ...     | ...     | ...        | ...       | ...               |
| 127-135 | ML      | IN         | H/M/L     | SD/DB/TB          |

---

## Appendix C: Testing Scenarios

**Sample journey signatures for testing:**

**1. Arch-focused accept path:**

- Start: arch-L1
- Visits: arch-L2-accept (4x), arch-L2-investigate (2x), algo-L1, algo-L2-accept
- Expected: SS-AC-H journey pattern for arch sections

**2. Balanced investigative path:**

- Start: algo-L1
- Visits: algo-L2-investigate (3x), arch-L1, arch-L2-investigate (2x), hum-L1, hum-L2-investigate (2x)
- Expected: SB-IN-H for all character sections

**3. Shifted dominant resist path:**

- Start: hum-L1
- Visits: hum-L2-resist (2x), arch-L1, arch-L2-resist (5x), algo-L1
- Expected: SD-RE-M for arch section, ML-RE-M for hum section

**4. Minimal exploration:**

- Start: arch-L1
- Visits: arch-L2-accept (1x), algo-L1, hum-L1
- Expected: SS-AC-L (just meets minimums)

**5. Maxed exploration:**

- Start: algo-L1
- Visits: All L2 nodes visited 3-4 times each, high revisit rate
- Expected: SB-IN-H (balanced, investigative due to deep exploration)

---

## Document Control

**Version History:**

| Version | Date       | Author | Changes                             |
| ------- | ---------- | ------ | ----------------------------------- |
| 1.0     | 2025-01-15 | System | Initial comprehensive specification |

**Review Status:** Finalized  
**Next Review:** After arch-L3 generation pilot (Week 10)

**Dependencies:**

- L1/L2 metadata completion (MUST be done before L3 generation)
- Selection algorithm implementation (Week 2-3)
- Variation index tooling (Week 2-3)

**Sign-off Required:**

- [ ] Architectural decisions validated
- [ ] Variation counting confirmed
- [ ] Metadata schema approved
- [ ] Selection algorithm logic verified
- [ ] Production timeline accepted

---

**END L3 GENERATION BIBLE v1.0**
