#!/usr/bin/env tsx
/**
 * Enhanced Selection Matrix Generator
 * Generates navigation matrix with incremental layer validation (L1→L2→L3→L4)
 * Supports coverage analysis and strict/non-strict modes
 */

import { promises as fs } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MatrixGeneratorOptions {
  layers: ('L1' | 'L2' | 'L3' | 'L4')[];
  strictMode: boolean;
  outputPath?: string;
  reportPath?: string;
}

interface MatrixEntry {
  fromNode: string;
  toNode: string;
  conditions: {
    awarenessLevel?: 'Low' | 'Medium' | 'High' | 'VeryHigh';
    awarenessRange?: [number, number];
    visitCount?: number | [number, number];
    isFirstVisit?: boolean;
    pathChosen?: 'accept' | 'resist' | 'invest';
    previousPaths?: ('accept' | 'resist' | 'invest')[];
    charactersSeen?: ('arch' | 'algo' | 'hum')[];
    minCharactersExplored?: number;
    philosophyDominant?: 'accept' | 'resist' | 'invest';
    philosophyBalance?: Record<string, number>;
  };
  metadata: {
    variationId: string;
    variationType: 'Initial' | 'FirstRevisit' | 'MetaAware';
    wordCount: number;
    layer: 'L1' | 'L2' | 'L3' | 'L4';
    character?: 'arch' | 'algo' | 'hum';
    themes?: string[];
    transformationFocus?: string;
  };
  weight?: number;
}

interface L1Variation {
  variation_id?: string;
  id?: string;
  variation_type?: 'Initial' | 'FirstRevisit' | 'MetaAware';
  transformationState?: string;
  word_count?: number;
  conditions?: {
    awareness?: string;
  };
  content: string;
}

interface L2Variation {
  variation_id?: string;
  variationId?: string;
  variation_type?: 'FirstRevisit' | 'MetaAware';
  transformationState?: string;
  word_count?: number;
  wordCount?: number;
  pathPhilosophy?: 'accept' | 'resist' | 'invest';
  conditions?: {
    awareness?: string;
    previous_paths?: string[];
  };
  content: string;
}

interface L3Variation {
  variationId: string;
  journeyPattern?: string;
  philosophyDominant?: string;
  awarenessLevel?: string;
  characterVoices?: string[];
  wordCount?: number;
  word_count?: number;
  content: string;
}

interface L4Variation {
  id: string;
  philosophy: 'preserve' | 'release' | 'transform';
  wordCount?: number;
  word_count?: number;
  content: string;
}

interface LayerData {
  L1?: L1Variation[];
  L2?: L2Variation[];
  L3?: L3Variation[];
  L4?: L4Variation[];
}

interface CoverageReport {
  timestamp: string;
  layersIncluded: string[];
  strictMode: boolean;
  summary: {
    totalEntries: number;
    expectedCombinations: number;
    actualCombinations: number;
    coveragePercentage: number;
  };
  byLayer: Record<string, {
    variations: number;
    entries: number;
    expectedVariations?: number;
    missingVariations?: number;
  }>;
  expectedPatterns?: {
    L3?: {
      soloNodes: string[];
      convergenceNodes: string[];
      missing: string[];
    };
  };
  warnings: string[];
  errors: string[];
}

// ============================================================================
// CLI PARSING
// ============================================================================

function parseMatrixArgs(): MatrixGeneratorOptions {
  const { values } = parseArgs({
    options: {
      layers: { type: 'string' },
      strict: { type: 'boolean' },
      'non-strict': { type: 'boolean' },
      output: { type: 'string' },
      report: { type: 'string' },
    },
  });

  // Parse --layers=L1,L2,L3,L4
  const layersArg = values.layers;
  const layers = layersArg
    ? layersArg.split(',').map(l => l.trim()) as ('L1' | 'L2' | 'L3' | 'L4')[]
    : ['L1', 'L2', 'L3', 'L4'];

  // Parse strict mode
  const strictMode = values.strict === true || values['non-strict'] === false;

  return {
    layers,
    strictMode,
    outputPath: values.output,
    reportPath: values.report
  };
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadLayerData(layers: ('L1' | 'L2' | 'L3' | 'L4')[]): Promise<LayerData> {
  const data: LayerData = {};
  const contentRoot = resolve(process.cwd(), '../../src/data/stories/eternal-return/content');

  // Load L1 data
  if (layers.includes('L1')) {
    const l1Variations: L1Variation[] = [];

    for (const char of ['arch', 'algo', 'hum']) {
      const filePath = join(contentRoot, 'layer1', `${char}-L1-variations.json`);
      if (existsSync(filePath)) {
        const fileData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        // Handle both array and object formats
        const variations = Array.isArray(fileData) ? fileData : fileData.variations || [];
        l1Variations.push(...variations);
      } else {
        console.warn(`⚠️  Missing L1 file: ${filePath}`);
      }
    }

    data.L1 = l1Variations;
    console.log(`✓ Loaded L1: ${l1Variations.length} variations`);
  }

  // Load L2 data
  if (layers.includes('L2')) {
    const l2Variations: L2Variation[] = [];

    for (const char of ['arch', 'algo', 'hum']) {
      for (const pathType of ['accept', 'resist', 'invest']) {
        const filePath = join(contentRoot, 'layer2', `${char}-L2-${pathType}-variations.json`);
        if (existsSync(filePath)) {
          const fileData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          const variations = Array.isArray(fileData) ? fileData : fileData.variations || [];
          // Add path field to each variation
          const withPath = variations.map((v: any) => ({
            ...v,
            pathPhilosophy: pathType
          }));
          l2Variations.push(...withPath);
        } else {
          console.warn(`⚠️  Missing L2 file: ${filePath}`);
        }
      }
    }

    data.L2 = l2Variations;
    console.log(`✓ Loaded L2: ${l2Variations.length} variations`);
  }

  // Load L3 data
  if (layers.includes('L3')) {
    const l3Variations: L3Variation[] = [];

    for (const sectionType of ['arch', 'algo', 'hum', 'conv']) {
      const filePath = join(contentRoot, 'layer3', `${sectionType}-L3-variations.json`);
      if (existsSync(filePath)) {
        const fileData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        const variations = Array.isArray(fileData) ? fileData : fileData.variations || [];
        l3Variations.push(...variations);
      } else {
        console.warn(`⚠️  Missing L3 file: ${filePath}`);
      }
    }

    data.L3 = l3Variations;
    console.log(`✓ Loaded L3: ${l3Variations.length} variations`);
  }

  // Load L4 data
  if (layers.includes('L4')) {
    const filePath = join(contentRoot, 'layer4', 'terminal-variations.json');
    if (existsSync(filePath)) {
      const fileData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      const variations = Array.isArray(fileData) ? fileData : fileData.variations || [];
      data.L4 = variations;
      console.log(`✓ Loaded L4: ${fileData.length} variations`);
    } else {
      console.warn(`⚠️  Missing L4 file: ${filePath}`);
      data.L4 = [];
    }
  }

  return data;
}

// ============================================================================
// MATRIX ENTRY GENERATION
// ============================================================================

function generateMatrixEntries(layerData: LayerData): MatrixEntry[] {
  const entries: MatrixEntry[] = [];

  // Generate L1 entries
  if (layerData.L1) {
    entries.push(...generateL1Entries(layerData.L1));
  }

  // Generate L2 entries (requires L1 for navigation)
  if (layerData.L2 && layerData.L1) {
    entries.push(...generateL2Entries(layerData.L2, layerData.L1));
  }

  // Generate L3 entries (requires L1 and L2 for convergence logic)
  if (layerData.L3 && layerData.L1 && layerData.L2) {
    entries.push(...generateL3Entries(layerData.L3, layerData.L1, layerData.L2));
  }

  // Generate L4 entries (requires L3 for terminal selection)
  if (layerData.L4 && layerData.L3) {
    entries.push(...generateL4Entries(layerData.L4, layerData.L3));
  }

  return entries;
}

function generateL1Entries(variations: L1Variation[]): MatrixEntry[] {
  const entries: MatrixEntry[] = [];

  // Group by character
  const byCharacter = groupBy(variations, v => {
    const id = v.variation_id || v.id || '';
    return id.split('-')[0];
  });

  for (const [char, charVariations] of Object.entries(byCharacter)) {
    // Initial variations (first visit)
    const initial = charVariations.filter(v =>
      (v.variation_type || v.transformationState) === 'Initial'
    );
    for (const variation of initial) {
      const varId = variation.variation_id || variation.id || '';
      entries.push({
        fromNode: 'start',
        toNode: varId,
        conditions: {
          awarenessLevel: 'Low',
          isFirstVisit: true
        },
        metadata: {
          variationId: varId,
          variationType: 'Initial',
          wordCount: variation.word_count || 0,
          layer: 'L1',
          character: char as 'arch' | 'algo' | 'hum'
        }
      });
    }

    // FirstRevisit variations (visit 2-3)
    const firstRevisit = charVariations.filter(v =>
      (v.variation_type || v.transformationState) === 'FirstRevisit' ||
      (v.variation_type || v.transformationState) === 'firstRevisit'
    );
    for (const variation of firstRevisit) {
      const varId = variation.variation_id || variation.id || '';
      entries.push({
        fromNode: `${char}-L1`,
        toNode: varId,
        conditions: {
          awarenessLevel: mapAwarenessLevel(variation.conditions?.awareness),
          visitCount: [2, 3]
        },
        metadata: {
          variationId: varId,
          variationType: 'FirstRevisit',
          wordCount: variation.word_count || 0,
          layer: 'L1',
          character: char as 'arch' | 'algo' | 'hum'
        }
      });
    }

    // MetaAware variations (visit 4+)
    const metaAware = charVariations.filter(v =>
      (v.variation_type || v.transformationState) === 'MetaAware' ||
      (v.variation_type || v.transformationState) === 'metaAware'
    );
    for (const variation of metaAware) {
      const varId = variation.variation_id || variation.id || '';
      entries.push({
        fromNode: `${char}-L1`,
        toNode: varId,
        conditions: {
          awarenessLevel: mapAwarenessLevel(variation.conditions?.awareness),
          visitCount: [4, 100]
        },
        metadata: {
          variationId: varId,
          variationType: 'MetaAware',
          wordCount: variation.word_count || 0,
          layer: 'L1',
          character: char as 'arch' | 'algo' | 'hum'
        }
      });
    }
  }

  return entries;
}

function generateL2Entries(l2Variations: L2Variation[], l1Variations: L1Variation[]): MatrixEntry[] {
  const entries: MatrixEntry[] = [];

  // Group by character and path
  const byCharAndPath = groupBy(l2Variations, v => {
    const id = v.variation_id || v.variationId || '';
    const parts = id.split('-');
    return `${parts[0]}-${parts[2]}`; // e.g., "arch-accept"
  });

  for (const [key, variations] of Object.entries(byCharAndPath)) {
    const [char, pathType] = key.split('-');

    // FirstRevisit variations
    const firstRevisit = variations.filter(v =>
      (v.variation_type || v.transformationState) === 'FirstRevisit' ||
      (v.variation_type || v.transformationState) === 'firstRevisit'
    );
    for (const variation of firstRevisit) {
      const varId = variation.variation_id || variation.variationId || '';
      entries.push({
        fromNode: `${char}-L1`,
        toNode: varId,
        conditions: {
          pathChosen: pathType as 'accept' | 'resist' | 'invest',
          awarenessLevel: mapAwarenessLevel(variation.conditions?.awareness),
          visitCount: [1, 3]
        },
        metadata: {
          variationId: varId,
          variationType: 'FirstRevisit',
          wordCount: variation.word_count || variation.wordCount || 0,
          layer: 'L2',
          character: char as 'arch' | 'algo' | 'hum'
        }
      });
    }

    // MetaAware variations
    const metaAware = variations.filter(v =>
      (v.variation_type || v.transformationState) === 'MetaAware' ||
      (v.variation_type || v.transformationState) === 'metaAware'
    );
    for (const variation of metaAware) {
      const varId = variation.variation_id || variation.variationId || '';
      entries.push({
        fromNode: `${char}-L2-${pathType}`,
        toNode: varId,
        conditions: {
          pathChosen: pathType as 'accept' | 'resist' | 'invest',
          awarenessLevel: mapAwarenessLevel(variation.conditions?.awareness),
          visitCount: [4, 100],
          previousPaths: variation.conditions?.previous_paths as any
        },
        metadata: {
          variationId: varId,
          variationType: 'MetaAware',
          wordCount: variation.word_count || variation.wordCount || 0,
          layer: 'L2',
          character: char as 'arch' | 'algo' | 'hum'
        }
      });
    }
  }

  return entries;
}

function generateL3Entries(
  l3Variations: L3Variation[],
  l1Variations: L1Variation[],
  l2Variations: L2Variation[]
): MatrixEntry[] {
  const entries: MatrixEntry[] = [];

  // Solo character convergence (arch-L3, algo-L3, hum-L3)
  const soloVariations = l3Variations.filter(v =>
    v.variationId.startsWith('arch-L3') ||
    v.variationId.startsWith('algo-L3') ||
    v.variationId.startsWith('hum-L3')
  );

  for (const variation of soloVariations) {
    const char = variation.variationId.split('-')[0];

    entries.push({
      fromNode: `${char}-L2`,
      toNode: variation.variationId,
      conditions: {
        awarenessLevel: mapAwarenessLevel(variation.awarenessLevel),
        minCharactersExplored: 1,
        philosophyDominant: variation.philosophyDominant as any
      },
      metadata: {
        variationId: variation.variationId,
        variationType: 'FirstRevisit',
        wordCount: variation.wordCount || variation.word_count || 0,
        layer: 'L3',
        character: char as 'arch' | 'algo' | 'hum'
      }
    });
  }

  // Cross-character convergence (conv-L3)
  const convVariations = l3Variations.filter(v => v.variationId.startsWith('conv-L3'));

  for (const variation of convVariations) {
    const characterVoices = variation.characterVoices || [];
    const minChars = characterVoices.length || 2;

    entries.push({
      fromNode: 'L2-complete',
      toNode: variation.variationId,
      conditions: {
        awarenessLevel: mapAwarenessLevel(variation.awarenessLevel),
        charactersSeen: characterVoices as any,
        minCharactersExplored: minChars,
        philosophyDominant: variation.philosophyDominant as any
      },
      metadata: {
        variationId: variation.variationId,
        variationType: 'MetaAware',
        wordCount: variation.wordCount || variation.word_count || 0,
        layer: 'L3'
      }
    });
  }

  return entries;
}

function generateL4Entries(l4Variations: L4Variation[], l3Variations: L3Variation[]): MatrixEntry[] {
  const entries: MatrixEntry[] = [];

  for (const variation of l4Variations) {
    entries.push({
      fromNode: 'L3-complete',
      toNode: variation.id,
      conditions: {
        awarenessLevel: 'VeryHigh',
        philosophyDominant: variation.philosophy as any,
        charactersSeen: ['arch', 'algo', 'hum']
      },
      metadata: {
        variationId: variation.id,
        variationType: 'MetaAware',
        wordCount: variation.wordCount || variation.word_count || 0,
        layer: 'L4'
      }
    });
  }

  return entries;
}

// ============================================================================
// COVERAGE ANALYSIS
// ============================================================================

function analyzeCoverage(
  layerData: LayerData,
  matrixEntries: MatrixEntry[],
  options: MatrixGeneratorOptions
): CoverageReport {
  const report: CoverageReport = {
    timestamp: new Date().toISOString(),
    layersIncluded: options.layers,
    strictMode: options.strictMode,
    summary: {
      totalEntries: matrixEntries.length,
      expectedCombinations: 0,
      actualCombinations: 0,
      coveragePercentage: 0
    },
    byLayer: {},
    warnings: [],
    errors: []
  };

  // Analyze L1 coverage
  if (layerData.L1) {
    const l1Entries = matrixEntries.filter(e => e.metadata.layer === 'L1');
    const l1ByCharacter = groupBy(layerData.L1, v => {
      const id = v.variation_id || v.id || '';
      return id.split('-')[0];
    });

    let missingL1 = 0;
    for (const [char, variations] of Object.entries(l1ByCharacter)) {
      const expected = 240; // 80 Initial + 80 FR + 80 MA per character
      const actual = variations.length;

      if (actual < expected) {
        const message = `${char}-L1: ${actual}/${expected} variations (${((actual/expected)*100).toFixed(1)}%)`;
        if (options.strictMode) {
          report.errors.push(message);
        } else {
          report.warnings.push(message);
        }
        missingL1 += (expected - actual);
      }
    }

    report.byLayer.L1 = {
      variations: layerData.L1.length,
      entries: l1Entries.length,
      expectedVariations: 240 * 3,
      missingVariations: missingL1
    };
  }

  // Analyze L2 coverage
  if (layerData.L2) {
    const l2Entries = matrixEntries.filter(e => e.metadata.layer === 'L2');
    const l2ByCharAndPath = groupBy(layerData.L2, v => {
      const id = v.variation_id || v.variationId || '';
      const parts = id.split('-');
      return `${parts[0]}-${parts[2]}`;
    });

    let missingL2 = 0;
    for (const [key, variations] of Object.entries(l2ByCharAndPath)) {
      const expected = 160; // 80 FR + 80 MA per path per character
      const actual = variations.length;

      if (actual < expected) {
        const message = `${key}: ${actual}/${expected} variations (${((actual/expected)*100).toFixed(1)}%)`;
        if (options.strictMode) {
          report.errors.push(message);
        } else {
          report.warnings.push(message);
        }
        missingL2 += (expected - actual);
      }
    }

    report.byLayer.L2 = {
      variations: layerData.L2.length,
      entries: l2Entries.length,
      expectedVariations: 160 * 9,
      missingVariations: missingL2
    };
  }

  // Analyze L3 coverage
  if (layerData.L3 && layerData.L1 && layerData.L2) {
    const l3Entries = matrixEntries.filter(e => e.metadata.layer === 'L3');

    const expectedPatterns = computeExpectedL3Patterns(layerData.L1, layerData.L2);
    const actualPatterns = extractActualL3Patterns(layerData.L3);

    const missingPatterns = expectedPatterns.all.filter(p => !actualPatterns.includes(p));

    if (missingPatterns.length > 0) {
      const message = `Missing ${missingPatterns.length} L3 patterns: ${missingPatterns.slice(0, 5).join(', ')}${missingPatterns.length > 5 ? '...' : ''}`;
      if (options.strictMode) {
        report.errors.push(message);
      } else {
        report.warnings.push(message);
      }
    }

    report.expectedPatterns = {
      L3: {
        soloNodes: expectedPatterns.solo,
        convergenceNodes: expectedPatterns.convergence,
        missing: missingPatterns
      }
    };

    report.byLayer.L3 = {
      variations: layerData.L3.length,
      entries: l3Entries.length,
      expectedVariations: 270,
      missingVariations: Math.max(0, 270 - layerData.L3.length)
    };

    report.summary.expectedCombinations += expectedPatterns.all.length;
    report.summary.actualCombinations += actualPatterns.length;
  }

  // Analyze L4 coverage
  if (layerData.L4) {
    const l4Entries = matrixEntries.filter(e => e.metadata.layer === 'L4');
    const expected = 3;

    if (layerData.L4.length < expected) {
      const message = `L4: ${layerData.L4.length}/${expected} terminal variations`;
      if (options.strictMode) {
        report.errors.push(message);
      } else {
        report.warnings.push(message);
      }
    }

    report.byLayer.L4 = {
      variations: layerData.L4.length,
      entries: l4Entries.length,
      expectedVariations: 3,
      missingVariations: Math.max(0, 3 - layerData.L4.length)
    };
  }

  // Compute overall coverage
  if (report.summary.expectedCombinations > 0) {
    report.summary.coveragePercentage =
      (report.summary.actualCombinations / report.summary.expectedCombinations) * 100;
  }

  return report;
}

function computeExpectedL3Patterns(l1: L1Variation[], l2: L2Variation[]): {
  solo: string[];
  convergence: string[];
  all: string[];
} {
  const solo: string[] = [];
  const convergence: string[] = [];

  const chars = ['arch', 'algo', 'hum'];
  for (const char of chars) {
    const charL1 = l1.filter(v => {
      const id = v.variation_id || v.id || '';
      return id.startsWith(char);
    });
    const charL2 = l2.filter(v => {
      const id = v.variation_id || v.variationId || '';
      return id.startsWith(char);
    });

    if (charL1.length > 0 && charL2.length > 0) {
      solo.push(`${char}-L3`);
    }
  }

  // Two-character convergence patterns
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      const char1L1 = l1.filter(v => {
        const id = v.variation_id || v.id || '';
        return id.startsWith(chars[i]);
      });
      const char1L2 = l2.filter(v => {
        const id = v.variation_id || v.variationId || '';
        return id.startsWith(chars[i]);
      });
      const char2L1 = l1.filter(v => {
        const id = v.variation_id || v.id || '';
        return id.startsWith(chars[j]);
      });
      const char2L2 = l2.filter(v => {
        const id = v.variation_id || v.variationId || '';
        return id.startsWith(chars[j]);
      });

      if (char1L1.length > 0 && char1L2.length > 0 &&
          char2L1.length > 0 && char2L2.length > 0) {
        const pattern = `conv-L3-${chars[i]}-${chars[j]}`;
        convergence.push(pattern);
      }
    }
  }

  // Three-character convergence
  const allCharsPresent = chars.every(char => {
    const charL1 = l1.filter(v => {
      const id = v.variation_id || v.id || '';
      return id.startsWith(char);
    });
    const charL2 = l2.filter(v => {
      const id = v.variation_id || v.variationId || '';
      return id.startsWith(char);
    });
    return charL1.length > 0 && charL2.length > 0;
  });

  if (allCharsPresent) {
    convergence.push('conv-L3-all');
  }

  return {
    solo,
    convergence,
    all: [...solo, ...convergence]
  };
}

function extractActualL3Patterns(l3: L3Variation[]): string[] {
  const patterns = new Set<string>();

  for (const variation of l3) {
    const match = variation.variationId.match(/^([a-z]+-L3(-[A-Z]+)?)/);
    if (match) {
      patterns.add(match[1]);
    }
  }

  return Array.from(patterns);
}

// ============================================================================
// REPORT PRINTING
// ============================================================================

function printCoverageReport(report: CoverageReport): void {
  console.log('='.repeat(70));
  console.log('COVERAGE SUMMARY');
  console.log('='.repeat(70));

  console.log(`\nTotal Matrix Entries: ${report.summary.totalEntries}`);

  if (report.summary.expectedCombinations > 0) {
    console.log(`Coverage: ${report.summary.coveragePercentage.toFixed(1)}%`);
    console.log(`Expected: ${report.summary.expectedCombinations}`);
    console.log(`Actual: ${report.summary.actualCombinations}`);
  }

  console.log('\nBy Layer:');
  for (const [layer, stats] of Object.entries(report.byLayer)) {
    console.log(`\n  ${layer}:`);
    console.log(`    Variations: ${stats.variations}`);
    console.log(`    Matrix Entries: ${stats.entries}`);
    if (stats.expectedVariations !== undefined) {
      console.log(`    Expected: ${stats.expectedVariations}`);
      console.log(`    Missing: ${stats.missingVariations || 0}`);
    }
  }

  if (report.expectedPatterns?.L3) {
    console.log('\nL3 Pattern Analysis:');
    console.log(`  Solo Nodes: ${report.expectedPatterns.L3.soloNodes.join(', ')}`);
    console.log(`  Convergence Nodes: ${report.expectedPatterns.L3.convergenceNodes.length} patterns`);
    if (report.expectedPatterns.L3.missing.length > 0) {
      console.log(`  Missing: ${report.expectedPatterns.L3.missing.join(', ')}`);
    }
  }

  if (report.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    for (const warning of report.warnings) {
      console.log(`   - ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    for (const error of report.errors) {
      console.log(`   - ${error}`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export async function generateMatrix(options: MatrixGeneratorOptions): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('MATRIX GENERATION');
  console.log('='.repeat(70));
  console.log(`Layers: ${options.layers.join(', ')}`);
  console.log(`Mode: ${options.strictMode ? 'STRICT' : 'NON-STRICT'}`);
  console.log('='.repeat(70) + '\n');

  // Load data
  console.log('📂 Loading layer data...\n');
  const layerData = await loadLayerData(options.layers);

  // Generate matrix entries
  console.log('\n🔗 Generating matrix entries...\n');
  const matrixEntries = generateMatrixEntries(layerData);

  // Analyze coverage
  console.log('\n📊 Analyzing coverage...\n');
  const coverage = analyzeCoverage(layerData, matrixEntries, options);

  // Print report
  printCoverageReport(coverage);

  // Check for errors in strict mode
  if (options.strictMode && coverage.errors.length > 0) {
    console.error('\n❌ STRICT MODE FAILURES:');
    for (const error of coverage.errors) {
      console.error(`   - ${error}`);
    }
    throw new Error(`Matrix generation failed: ${coverage.errors.length} errors in strict mode`);
  }

  // Write matrix
  const outputPath = options.outputPath ||
    resolve(process.cwd(), '../../src/data/stories/eternal-return/content/selection-matrix.json');

  await fs.mkdir(dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(matrixEntries, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Matrix written to: ${outputPath}`);
  console.log(`   Total entries: ${matrixEntries.length}`);

  // Write coverage report
  const reportPath = options.reportPath ||
    resolve(process.cwd(), 'reports/matrix-coverage-report.json');

  await fs.mkdir(dirname(reportPath), { recursive: true });
  await fs.writeFile(
    reportPath,
    JSON.stringify(coverage, null, 2),
    'utf-8'
  );

  console.log(`📝 Coverage report written to: ${reportPath}\n`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function mapAwarenessLevel(level?: string): 'Low' | 'Medium' | 'High' | 'VeryHigh' {
  if (!level) return 'Low';

  const normalized = level.toLowerCase();
  if (normalized.includes('very') || normalized.includes('veryhigh')) return 'VeryHigh';
  if (normalized.includes('high')) return 'High';
  if (normalized.includes('medium')) return 'Medium';
  return 'Low';
}

function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseMatrixArgs();

  generateMatrix(options)
    .then(() => {
      console.log('✅ Matrix generation complete\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Matrix generation failed:', error.message);
      process.exit(1);
    });
}

