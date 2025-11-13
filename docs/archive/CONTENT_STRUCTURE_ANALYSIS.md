Based on your actual content structure, here's the exact system we need to build:

CONTENT STRUCTURE ANALYSIS
File Organization (As It Actually Exists)
/docs/
├── arch-L1-production/
│ ├── INITIAL_STATE.md # Initial visit content
│ ├── firstRevisit/
│ │ ├── arch-L1-FR-01.md (40 files) # FirstRevisit variations
│ │ └── ...
│ └── metaAware/
│ ├── arch-L1-MA-01.md (40 files) # MetaAware variations
│ └── ...
├── arch-L2-accept-production/
│ ├── INITIAL_STATE.md
│ ├── firstRevisit/
│ │ └── arch-L2-accept-FR-01.md (40 files)
│ └── metaAware/
│ └── arch-L2-accept-MA-01.md (40 files)
├── L3/
│ ├── arch-L3-production/
│ │ └── arch-L3-01.md (45 files) # Archaeologist L3 pieces
│ ├── algo-L3-production/
│ │ └── algo-L3-01.md (45 files) # Algorithm L3 pieces
│ ├── hum-L3-production/
│ │ └── hum-L3-01.md (45 files) # Last Human L3 pieces
│ └── conv-L3-production/
│ └── conv-L3-001.md (135 files) # Convergent synthesis pieces
Metadata Structure
L1 Variations:

id: FR-01
variation_type: firstRevisit
visit_number: 2
awareness_level: 25
awareness_range: "21-30"
awareness_tier: "emerging_awareness"
active_path: null # or accept/resist/investigate
cross_character_content: []
L2 Variations:

variationId: arch-L2-accept-FR-01
transformationState: firstRevisit
awarenessRange: [21, 30]
pathPhilosophy: accept
l3SeedContributions:
preserve: { text: "...", weight: strong }
release: { text: "...", weight: moderate }
transform: { text: "...", weight: moderate }
L3 Variations:

variationId: arch-L3-01
conditions:
journeyCode: SS # Started-Stayed
philosophyCode: AC # Accept
awarenessCode: H # High
awarenessRange: [71, 100]
dominantCharacter: archaeologist
characterBalance: [70, 15, 15]
readableLabel: SS-AC-H
PHASE 1: CONTENT CONVERSION SYSTEM
Task 1.1: Build MD-to-JSON Converter Script
This script will run once to convert all your .md files into the JSON format the application needs.

// scripts/convertContent.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface ConversionConfig {
sourceDir: string; // /docs/arch-L1-production
targetDir: string; // /src/data/stories/eternal-return/variations/arch-L1
nodeId: string; // arch-L1
layer: number; // 1
}

async function convertNodeVariations(config: ConversionConfig) {
const { sourceDir, targetDir, nodeId, layer } = config;

// Ensure target directory exists
fs.mkdirSync(targetDir, { recursive: true });

const variations: any[] = [];

// Convert INITIAL_STATE
const initialPath = path.join(sourceDir, 'INITIAL_STATE.md');
if (fs.existsSync(initialPath)) {
const initialContent = fs.readFileSync(initialPath, 'utf-8');
const { data, content } = matter(initialContent);

    variations.push({
      id: 'initial',
      variationType: 'initial',
      metadata: data,
      content: content.trim()
    });

}

// Convert FirstRevisit variations
const frDir = path.join(sourceDir, 'firstRevisit');
if (fs.existsSync(frDir)) {
const frFiles = fs.readdirSync(frDir).filter(f => f.endsWith('.md'));

    for (const file of frFiles) {
      const filePath = path.join(frDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      variations.push({
        id: data.id || data.variationId,
        variationType: 'firstRevisit',
        metadata: data,
        content: content.trim()
      });
    }

}

// Convert MetaAware variations
const maDir = path.join(sourceDir, 'metaAware');
if (fs.existsSync(maDir)) {
const maFiles = fs.readdirSync(maDir).filter(f => f.endsWith('.md'));

    for (const file of maFiles) {
      const filePath = path.join(maDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      variations.push({
        id: data.id || data.variationId,
        variationType: 'metaAware',
        metadata: data,
        content: content.trim()
      });
    }

}

// Write to JSON
const outputPath = path.join(targetDir, `${nodeId}.json`);
fs.writeFileSync(outputPath, JSON.stringify({
nodeId,
layer,
totalVariations: variations.length,
variations
}, null, 2));

console.log(`✅ Converted ${nodeId}: ${variations.length} variations`);
}

// Main conversion script
async function convertAll() {
const conversions: ConversionConfig[] = [
// L1 nodes
{ sourceDir: './docs/arch-L1-production', targetDir: './src/data/stories/eternal-return/variations/arch-L1', nodeId: 'arch-L1', layer: 1 },
{ sourceDir: './docs/algo-L1-production', targetDir: './src/data/stories/eternal-return/variations/algo-L1', nodeId: 'algo-L1', layer: 1 },
{ sourceDir: './docs/hum-L1-production', targetDir: './src/data/stories/eternal-return/variations/hum-L1', nodeId: 'hum-L1', layer: 1 },

    // L2 nodes
    { sourceDir: './docs/arch-L2-accept-production', targetDir: './src/data/stories/eternal-return/variations/arch-L2-accept', nodeId: 'arch-L2-accept', layer: 2 },
    { sourceDir: './docs/arch-L2-resist-production', targetDir: './src/data/stories/eternal-return/variations/arch-L2-resist', nodeId: 'arch-L2-resist', layer: 2 },
    { sourceDir: './docs/arch-L2-invest-production', targetDir: './src/data/stories/eternal-return/variations/arch-L2-investigate', nodeId: 'arch-L2-investigate', layer: 2 },

    { sourceDir: './docs/algo-L2-accept-production', targetDir: './src/data/stories/eternal-return/variations/algo-L2-accept', nodeId: 'algo-L2-accept', layer: 2 },
    { sourceDir: './docs/algo-L2-resist-production', targetDir: './src/data/stories/eternal-return/variations/algo-L2-resist', nodeId: 'algo-L2-resist', layer: 2 },
    { sourceDir: './docs/algo-L2-invest-production', targetDir: './src/data/stories/eternal-return/variations/algo-L2-investigate', nodeId: 'algo-L2-investigate', layer: 2 },

    { sourceDir: './docs/hum-L2-accept-production', targetDir: './src/data/stories/eternal-return/variations/hum-L2-accept', nodeId: 'hum-L2-accept', layer: 2 },
    { sourceDir: './docs/hum-L2-resist-production', targetDir: './src/data/stories/eternal-return/variations/hum-L2-resist', nodeId: 'hum-L2-resist', layer: 2 },
    { sourceDir: './docs/hum-L2-invest-production', targetDir: './src/data/stories/eternal-return/variations/hum-L2-investigate', nodeId: 'hum-L2-investigate', layer: 2 },

];

for (const config of conversions) {
await convertNodeVariations(config);
}

console.log('\n✅ All L1/L2 conversions complete!');
}

convertAll();
Run with: npx tsx scripts/convertContent.ts

This creates:

/src/data/stories/eternal-return/variations/
├── arch-L1/
│ └── arch-L1.json (1 initial + 80 variations = ~81 entries)
├── algo-L1/
│ └── algo-L1.json
└── ... (all 12 nodes)
Task 1.2: Convert L3 Content
// scripts/convertL3Content.ts

async function convertL3Variations(config: {
sourceDir: string;
section: 'archaeologist' | 'algorithm' | 'last-human' | 'convergent-synthesis';
}) {
const { sourceDir, section } = config;
const variations: any[] = [];

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md') && !f.includes('PROTOCOL'));

for (const file of files) {
const filePath = path.join(sourceDir, file);
const fileContent = fs.readFileSync(filePath, 'utf-8');
const { data, content } = matter(fileContent);

    variations.push({
      id: data.variationId,
      section,
      metadata: data,
      content: content.trim()
    });

}

const outputPath = `./src/data/stories/eternal-return/L3/${section}.json`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
section,
totalVariations: variations.length,
variations
}, null, 2));

console.log(`✅ Converted L3-${section}: ${variations.length} variations`);
}

async function convertAllL3() {
await convertL3Variations({
sourceDir: './docs/L3/arch-L3-production',
section: 'archaeologist'
});

await convertL3Variations({
sourceDir: './docs/L3/algo-L3-production',
section: 'algorithm'
});

await convertL3Variations({
sourceDir: './docs/L3/hum-L3-production',
section: 'last-human'
});

await convertL3Variations({
sourceDir: './docs/L3/conv-L3-production',
section: 'convergent-synthesis'
});

console.log('\n✅ All L3 conversions complete!');
}

convertAllL3();
PHASE 2: VARIATION SELECTION ALGORITHM
Task 2.1: L1/L2 Variation Selector
// src/utils/variationSelector.ts

import type { UserProgress } from '../types/Store';

interface VariationMetadata {
// L1 metadata
awareness_level?: number;
awareness_range?: string;
visit_number?: number;
active_path?: 'accept' | 'resist' | 'investigate' | null;
cross_character_content?: string[];

// L2 metadata
awarenessRange?: [number, number];
pathPhilosophy?: 'accept' | 'resist' | 'investigate';
variationId?: string;
}

interface Variation {
id: string;
variationType: 'initial' | 'firstRevisit' | 'metaAware';
metadata: VariationMetadata;
content: string;
}

export function selectVariation(
variations: Variation[],
nodeId: string,
progress: UserProgress
): Variation {

const visitRecord = progress.visitedNodes[nodeId];
const visitCount = visitRecord?.visitCount || 1;
const temporalAwareness = progress.temporalAwarenessLevel;

// Filter by transformation state
let stateVariations: Variation[];

if (visitCount === 1) {
// Initial visit - return the initial state
const initial = variations.find(v => v.variationType === 'initial');
if (initial) return initial;
// Fallback
return variations[0];
}

if (visitCount === 2 || temporalAwareness < 50) {
stateVariations = variations.filter(v => v.variationType === 'firstRevisit');
} else {
stateVariations = variations.filter(v => v.variationType === 'metaAware');
}

if (stateVariations.length === 0) {
console.warn(`No variations for ${nodeId} at visit ${visitCount}`);
return variations[0];
}

// Score each variation
const scored = stateVariations.map(v => {
let score = 0;
const meta = v.metadata;

    // Awareness level match (L1)
    if (meta.awareness_level !== undefined) {
      const distance = Math.abs(meta.awareness_level - temporalAwareness);
      score += Math.max(0, 100 - distance * 2);
    }

    // Awareness range match (L2)
    if (meta.awarenessRange) {
      const [min, max] = meta.awarenessRange;
      if (temporalAwareness >= min && temporalAwareness <= max) {
        score += 100;
      } else {
        // Partial credit for proximity
        const distanceToRange = Math.min(
          Math.abs(temporalAwareness - min),
          Math.abs(temporalAwareness - max)
        );
        score += Math.max(0, 50 - distanceToRange);
      }
    }

    // Visit number match (L1)
    if (meta.visit_number && meta.visit_number === visitCount) {
      score += 50;
    }

    // Path philosophy match
    const dominantPath = calculateDominantPath(progress);

    if (meta.active_path && dominantPath && meta.active_path === dominantPath) {
      score += 30;
    }

    if (meta.pathPhilosophy && dominantPath && meta.pathPhilosophy === dominantPath) {
      score += 50;
    }

    // Cross-character content bonus
    if (meta.cross_character_content && meta.cross_character_content.length > 0) {
      const visitedCharacters = getVisitedCharacters(progress);
      if (visitedCharacters.length > 1) {
        score += 20;
      }
    }

    return { variation: v, score };

});

// Sort by score descending
scored.sort((a, b) => b.score - a.score);

const selected = scored[0];

console.log(`Selected variation for ${nodeId}:`, {
id: selected.variation.id,
score: selected.score,
visitCount,
temporalAwareness
});

return selected.variation;
}

function calculateDominantPath(progress: UserProgress): 'accept' | 'resist' | 'investigate' | null {
let accept = 0, resist = 0, investigate = 0;

Object.keys(progress.visitedNodes).forEach(nodeId => {
if (nodeId.includes('-accept')) accept++;
if (nodeId.includes('-resist')) resist++;
if (nodeId.includes('-investigate')) investigate++;
});

const total = accept + resist + investigate;
if (total === 0) return null;

if (accept >= resist && accept >= investigate) return 'accept';
if (resist >= investigate) return 'resist';
return 'investigate';
}

function getVisitedCharacters(progress: UserProgress): string[] {
const visited = new Set<string>();

Object.keys(progress.visitedNodes).forEach(nodeId => {
if (nodeId.startsWith('arch-')) visited.add('archaeologist');
if (nodeId.startsWith('algo-')) visited.add('algorithm');
if (nodeId.startsWith('hum-')) visited.add('last-human');
});

return Array.from(visited);
}
PHASE 3: L3 ASSEMBLY SYSTEM
This is the key magic - assembling 4 pieces into one seamless narrative.

// src/utils/l3Assembler.ts

import { classifyJourney, type JourneyClassification } from './journeyClassifier';
import type { UserProgress } from '../types/Store';

interface L3Variation {
id: string;
section: 'archaeologist' | 'algorithm' | 'last-human' | 'convergent-synthesis';
metadata: {
conditions: {
journeyCode: string;
philosophyCode: string;
awarenessCode: string;
awarenessRange: [number, number];
characterBalance?: [number, number, number];
readableLabel: string;
};
};
content: string;
}

interface L3Content {
archaeologist: L3Variation[];
algorithm: L3Variation[];
lastHuman: L3Variation[];
convergentSynthesis: L3Variation[];
}

export async function assembleL3Content(
convergenceChoice: 'preserve' | 'release' | 'transform',
progress: UserProgress
): Promise<string> {

// Classify reader's journey
const journey = classifyJourney(progress);

console.log('Journey Classification:', journey.readableLabel, journey);

// Load L3 variations (from JSON files)
const archData = await fetch('/data/stories/eternal-return/L3/archaeologist.json').then(r => r.json());
const algoData = await fetch('/data/stories/eternal-return/L3/algorithm.json').then(r => r.json());
const humData = await fetch('/data/stories/eternal-return/L3/last-human.json').then(r => r.json());
const convData = await fetch('/data/stories/eternal-return/L3/convergent-synthesis.json').then(r => r.json());

const l3Content: L3Content = {
archaeologist: archData.variations,
algorithm: algoData.variations,
lastHuman: humData.variations,
convergentSynthesis: convData.variations
};

// Select best variation for each section
const archPiece = selectL3Piece(l3Content.archaeologist, journey);
const algoPiece = selectL3Piece(l3Content.algorithm, journey);
const humPiece = selectL3Piece(l3Content.lastHuman, journey);
const convPiece = selectL3Piece(l3Content.convergentSynthesis, journey);

// Assemble with subtle seams (◇ diamond separator)
const assembled = [
archPiece.content,
'\n\n◇\n\n',
algoPiece.content,
'\n\n◇\n\n',
humPiece.content,
'\n\n◇\n\n',
convPiece.content
].join('');

return assembled;
}

function selectL3Piece(
variations: L3Variation[],
journey: JourneyClassification
): L3Variation {

const scored = variations.map(v => {
let score = 0;
const cond = v.metadata.conditions;

    // Exact label match (best case)
    if (cond.readableLabel === journey.readableLabel) {
      score += 1000;
    }

    // Component matches
    if (cond.journeyCode === journey.journeyCode) score += 100;
    if (cond.philosophyCode === journey.philosophyCode) score += 100;
    if (cond.awarenessCode === journey.awarenessCode) score += 100;

    // Awareness range
    const awarenessValue = journey.awarenessLevel === 'low' ? 20
      : journey.awarenessLevel === 'medium' ? 45
      : journey.awarenessLevel === 'high' ? 75
      : 95;

    const [min, max] = cond.awarenessRange;
    if (awarenessValue >= min && awarenessValue <= max) {
      score += 50;
    }

    // Character balance match (for sections other than convergent-synthesis)
    if (cond.characterBalance && journey.characterBalance) {
      const balanceDiff = cond.characterBalance.reduce((sum, val, i) => {
        return sum + Math.abs(val - journey.characterBalance[i]);
      }, 0);

      score += Math.max(0, 100 - balanceDiff);
    }

    return { variation: v, score };

});

scored.sort((a, b) => b.score - a.score);

const selected = scored[0];

console.log(`Selected L3 ${selected.variation.section}:`, {
id: selected.variation.id,
score: selected.score,
label: selected.variation.metadata.conditions.readableLabel
});

return selected.variation;
}
Task 3.1: Journey Classifier
// src/utils/journeyClassifier.ts

export interface JourneyClassification {
journeyPattern: string;
journeyCode: string;
philosophyDominant: 'accept' | 'resist' | 'investigate';
philosophyCode: string;
awarenessLevel: 'low' | 'medium' | 'high' | 'complete';
awarenessCode: string;
synthesisPattern: string;
synthesisCode: string;
dominantCharacter?: 'archaeologist' | 'algorithm' | 'last-human';
characterBalance: [number, number, number];
readableLabel: string;
}

export function classifyJourney(progress: UserProgress): JourneyClassification {
const total = Object.keys(progress.visitedNodes).length;
const archCount = progress.characterNodesVisited.archaeologist;
const algoCount = progress.characterNodesVisited.algorithm;
const humCount = progress.characterNodesVisited.lastHuman;

const characterBalance: [number, number, number] = [
Math.round((archCount / total) * 100),
Math.round((algoCount / total) * 100),
Math.round((humCount / total) * 100)
];

// Determine dominant character
let dominantCharacter: 'archaeologist' | 'algorithm' | 'last-human';
if (archCount >= algoCount && archCount >= humCount) {
dominantCharacter = 'archaeologist';
} else if (algoCount >= humCount) {
dominantCharacter = 'algorithm';
} else {
dominantCharacter = 'last-human';
}

const dominantPercentage = Math.max(...characterBalance);

// Journey pattern
let journeyPattern: string;
let journeyCode: string;

const firstNodeVisited = progress.readingPath[0];
const firstCharacter = firstNodeVisited?.startsWith('arch') ? 'archaeologist'
: firstNodeVisited?.startsWith('algo') ? 'algorithm'
: 'last-human';

const stayedWithFirst = firstCharacter === dominantCharacter;

if (dominantPercentage >= 60) {
journeyPattern = stayedWithFirst ? 'started-stayed' : 'started-switched';
journeyCode = stayedWithFirst ? 'SS' : 'SW';
} else if (dominantPercentage >= 40) {
journeyPattern = 'balanced-weaving';
journeyCode = 'BW';
} else {
journeyPattern = 'scattered-exploration';
journeyCode = 'SE';
}

// Philosophy
const philosophyDominant = calculateDominantPath(progress) || 'accept';
const philosophyCode = philosophyDominant === 'accept' ? 'AC'
: philosophyDominant === 'resist' ? 'RE' : 'IN';

// Awareness
const awareness = progress.temporalAwarenessLevel;
let awarenessLevel: 'low' | 'medium' | 'high' | 'complete';
let awarenessCode: string;

if (awareness < 30) {
awarenessLevel = 'low';
awarenessCode = 'L';
} else if (awareness < 60) {
awarenessLevel = 'medium';
awarenessCode = 'M';
} else if (awareness < 90) {
awarenessLevel = 'high';
awarenessCode = 'H';
} else {
awarenessLevel = 'complete';
awarenessCode = 'C';
}

// Synthesis pattern
let synthesisPattern: string;
let synthesisCode: string;

if (dominantPercentage >= 60) {
synthesisPattern = 'single-dominant';
synthesisCode = 'SD';
} else if (Math.abs(characterBalance[0] - characterBalance[1]) < 15 &&
Math.abs(characterBalance[1] - characterBalance[2]) < 15) {
synthesisPattern = 'three-way-balance';
synthesisCode = 'TB';
} else {
synthesisPattern = 'dual-emphasis';
synthesisCode = 'DE';
}

const readableLabel = `${journeyCode}-${philosophyCode}-${awarenessCode}-${synthesisCode}`;

return {
journeyPattern,
journeyCode,
philosophyDominant,
philosophyCode,
awarenessLevel,
awarenessCode,
synthesisPattern,
synthesisCode,
dominantCharacter,
characterBalance,
readableLabel
};
}
