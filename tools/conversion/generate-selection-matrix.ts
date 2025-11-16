#!/usr/bin/env node
/**
 * Selection Matrix Generator
 * Generates selection-matrix.json from validated L3 files
 * Maps each {journeyPattern, philosophyDominant, awarenessLevel} combo to one file per section type
 */

import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

import { writeFileAtomic } from './lib/fs.js';
import { Logger } from './lib/log.js';

const SCHEMA_VERSION = '1.0.0';

interface CliArgs {
  strict?: boolean;
  report?: string;
  verbose?: boolean;
}

interface L3File {
  id: string;
  sectionType: string;
  journeyPattern: string;
  philosophyDominant: string;
  awarenessLevel: string;
  filePath: string;
}

interface SelectionKey {
  journeyPattern: string;
  philosophyDominant: string;
  awarenessLevel: string;
}

interface MatrixEntry {
  journeyPattern: string;
  philosophyDominant: string;
  awarenessLevel: string;
  archaeologist: string | null;
  algorithm: string | null;
  lastHuman: string | null;
  convergent: string | null;
}

interface SelectionMatrix {
  schemaVersion: string;
  version: string;
  generatedAt: string;
  sortOrder: string;
  totalCombinations: number;
  coverage: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
    convergent: number;
  };
  missing: Array<{
    combo: string;
    missingSections: string[];
  }>;
  selections: MatrixEntry[];
}

async function main() {
  const { values } = parseArgs({
    options: {
      strict: { type: 'boolean', short: 's' },
      report: { type: 'string', short: 'r' },
      verbose: { type: 'boolean', short: 'v' },
    },
  }) as { values: CliArgs };

  const logger = new Logger(values.verbose);
  const projectRoot = resolve(process.cwd(), '../..');
  const contentRoot = join(projectRoot, 'src/data/stories/eternal-return/content');
  const layer3VariationsDir = join(contentRoot, 'layer3', 'variations');

  logger.info('MATRIX_START', 'Generating selection matrix...');

  // Read all L3 JSON files from variations directory
  const l3Files: L3File[] = [];
  try {
    const files = await readdir(layer3VariationsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = join(layer3VariationsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Validate required fields
      if (!data.id || !data.sectionType || !data.journeyPattern || !data.philosophyDominant || !data.awarenessLevel) {
        logger.warning('INVALID_L3_FILE', `Skipping file with missing fields: ${file}`, {
          file: filePath,
        });
        continue;
      }

      l3Files.push({
        id: data.id,
        sectionType: data.sectionType,
        journeyPattern: data.journeyPattern,
        philosophyDominant: data.philosophyDominant,
        awarenessLevel: data.awarenessLevel,
        filePath,
      });
    }
  } catch (error) {
    logger.blocker('MATRIX_READ_ERROR', `Failed to read layer3/variations directory: ${error}`, {
      value: layer3VariationsDir,
    });
    console.error('\n❌ Matrix generation failed');
    process.exit(1);
  }

  logger.info('MATRIX_FILES_READ', `Read ${l3Files.length} L3 files`);

  // Group by selection key
  const bySelectionKey = new Map<string, Map<string, L3File[]>>();

  for (const file of l3Files) {
    const key = `${file.journeyPattern}|${file.philosophyDominant}|${file.awarenessLevel}`;

    if (!bySelectionKey.has(key)) {
      bySelectionKey.set(key, new Map());
    }

    const bySection = bySelectionKey.get(key)!;
    if (!bySection.has(file.sectionType)) {
      bySection.set(file.sectionType, []);
    }

    bySection.get(file.sectionType)!.push(file);
  }

  // Generate matrix entries
  const selections: MatrixEntry[] = [];
  const missing: Array<{ combo: string; missingSections: string[] }> = [];
  const coverage = {
    archaeologist: 0,
    algorithm: 0,
    lastHuman: 0,
    convergent: 0,
  };

  // Sort selection keys for deterministic output
  const sortedKeys = Array.from(bySelectionKey.keys()).sort();

  for (const key of sortedKeys) {
    const parts = key.split('|');
    if (parts.length !== 3) {
      continue;
    } // Skip invalid keys
    const journeyPattern = parts[0];
    const philosophyDominant = parts[1];
    const awarenessLevel = parts[2];
    const bySection = bySelectionKey.get(key)!;

    // Select one file per section type (deterministic: first after numeric-lex sort)
    const arch = selectFirst(bySection.get('arch-L3') || []);
    const algo = selectFirst(bySection.get('algo-L3') || []);
    const hum = selectFirst(bySection.get('hum-L3') || []);
    const conv = selectFirst(bySection.get('conv-L3') || []);

    // Track coverage
    if (arch) {
      coverage.archaeologist++;
    }
    if (algo) {
      coverage.algorithm++;
    }
    if (hum) {
      coverage.lastHuman++;
    }
    if (conv) {
      coverage.convergent++;
    }

    // Check for missing sections
    const missingSections: string[] = [];
    if (!arch) {
      missingSections.push('archaeologist');
    }
    if (!algo) {
      missingSections.push('algorithm');
    }
    if (!hum) {
      missingSections.push('lastHuman');
    }
    if (!conv) {
      missingSections.push('convergent');
    }

    if (missingSections.length > 0) {
      const comboLabel = `${journeyPattern}-${philosophyDominant}-${awarenessLevel}`;
      missing.push({ combo: comboLabel, missingSections });
      logger.error('MATRIX_MISSING_COMBO', `Incomplete coverage for ${comboLabel}`, {
        value: missingSections,
        exampleFix: `Add L3 files for missing sections: ${missingSections.join(', ')}`,
      });
    }

    selections.push({
      journeyPattern,
      philosophyDominant,
      awarenessLevel,
      archaeologist: arch?.id || null,
      algorithm: algo?.id || null,
      lastHuman: hum?.id || null,
      convergent: conv?.id || null,
    });
  }

  // Create matrix output
  const matrix: SelectionMatrix = {
    schemaVersion: SCHEMA_VERSION,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sortOrder: 'numericThenLex',
    totalCombinations: selections.length,
    coverage,
    missing,
    selections,
  };

  // Write matrix
  const outputPath = join(contentRoot, 'layer3', 'selection-matrix.json');
  const json = JSON.stringify(matrix, null, 2);
  await writeFileAtomic(outputPath, json, logger);
  logger.info('MATRIX_WRITTEN', `Wrote ${outputPath}`);

  // Write report if requested
  if (values.report) {
    const reportPath = resolve(values.report);
    const report = {
      timestamp: new Date().toISOString(),
      totalCombinations: selections.length,
      coverage,
      missingCount: missing.length,
      missing,
      logs: logger.getEntries(),
    };
    await writeFileAtomic(reportPath, JSON.stringify(report, null, 2), logger);
    logger.info('REPORT_WRITTEN', `Wrote report to ${reportPath}`);
  }

  // Summary
  console.log('\n=== Selection Matrix Summary ===');
  console.log(`Total combinations: ${selections.length}`);
  console.log(`Coverage:`);
  console.log(`  Archaeologist: ${coverage.archaeologist}`);
  console.log(`  Algorithm: ${coverage.algorithm}`);
  console.log(`  Last Human: ${coverage.lastHuman}`);
  console.log(`  Convergent: ${coverage.convergent}`);
  console.log(`Missing: ${missing.length} incomplete combinations`);
  console.log(`\n${logger.summary()}`);

  if (logger.hasBlockers()) {
    console.error('\n❌ Matrix generation failed due to blockers');
    process.exit(1);
  }

  if (values.strict && logger.hasErrors()) {
    console.error('\n❌ Matrix generation failed in strict mode due to errors');
    process.exit(1);
  }

  if (logger.hasWarnings() || missing.length > 0) {
    console.log('\n⚠️  Matrix generated with warnings');
  } else {
    console.log('\n✅ Matrix generated successfully');
  }
}

/**
 * Select first file after numeric-then-lexicographic sort
 */
function selectFirst(files: L3File[]): L3File | null {
  if (files.length === 0) {
    return null;
  }

  // Sort by ID: numeric-then-lex
  const sorted = [...files].sort((a, b) => {
    // Extract numeric suffix
    const aMatch = a.id.match(/-(\d+)$/);
    const bMatch = b.id.match(/-(\d+)$/);

    if (aMatch && aMatch[1] && bMatch && bMatch[1]) {
      const aNum = parseInt(aMatch[1], 10);
      const bNum = parseInt(bMatch[1], 10);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    }

    // Fallback to lexicographic
    return a.id.localeCompare(b.id);
  });

  return sorted[0] || null;
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
