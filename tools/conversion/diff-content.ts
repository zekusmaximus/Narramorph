#!/usr/bin/env node
/**
 * Content Diff Tool
 * Compares two manifests or content directories
 */

import { resolve, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { readFile, readdir, stat } from 'node:fs/promises';
import { Logger } from './lib/log.js';

interface CliArgs {
  before?: string;
  after?: string;
  'summary-only'?: boolean;
  verbose?: boolean;
}

interface Manifest {
  schemaVersion: string;
  generatorVersion: string;
  convertedAt: string;
  sourceRoot: string;
  files: Record<string, {
    sourceHash: string;
    outputPath: string;
    convertedAt: string;
  }>;
  counts: {
    l1Variations: number;
    l2Variations: number;
    l3Variations: number;
    l4Variations: number;
    totalVariations: number;
  };
}

interface DiffResult {
  timestamp: string;
  beforePath: string;
  afterPath: string;
  filesAdded: string[];
  filesRemoved: string[];
  filesModified: string[];
  filesUnchanged: string[];
  countsChanged: boolean;
  countsDiff: {
    l1: number;
    l2: number;
    l3: number;
    l4: number;
    total: number;
  };
  summary: {
    totalFiles: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      before: { type: 'string', short: 'b' },
      after: { type: 'string', short: 'a' },
      'summary-only': { type: 'boolean', short: 's' },
      verbose: { type: 'boolean', short: 'v' },
    },
  }) as { values: CliArgs };

  const logger = new Logger(values.verbose);

  // Default paths
  const projectRoot = resolve(process.cwd(), '../..');
  const defaultManifest = join(
    projectRoot,
    'src/data/stories/eternal-return/content/manifest.json'
  );

  const beforePath = resolve(values.before || defaultManifest);
  const afterPath = resolve(values.after || defaultManifest);

  logger.info('DIFF_START', `Comparing ${beforePath} vs ${afterPath}`);

  // Check if comparing manifests or directories
  const beforeIsManifest = beforePath.endsWith('.json');
  const afterIsManifest = afterPath.endsWith('.json');

  if (beforeIsManifest && afterIsManifest) {
    await diffManifests(beforePath, afterPath, values['summary-only'], logger);
  } else {
    logger.error('DIFF_MODE_ERROR', 'Both paths must be manifests (.json)', {
      value: `before=${beforePath}, after=${afterPath}`,
      exampleFix: 'Use --before=manifest1.json --after=manifest2.json',
    });
    process.exit(1);
  }
}

async function diffManifests(
  beforePath: string,
  afterPath: string,
  summaryOnly: boolean | undefined,
  logger: Logger
): Promise<void> {
  // Read manifests
  let before: Manifest;
  let after: Manifest;

  try {
    const beforeContent = await readFile(beforePath, 'utf-8');
    before = JSON.parse(beforeContent);
  } catch (error) {
    logger.blocker('DIFF_READ_ERROR', `Failed to read before manifest: ${error}`, {
      file: beforePath,
    });
    console.error('\n❌ Diff failed');
    process.exit(1);
  }

  try {
    const afterContent = await readFile(afterPath, 'utf-8');
    after = JSON.parse(afterContent);
  } catch (error) {
    logger.blocker('DIFF_READ_ERROR', `Failed to read after manifest: ${error}`, {
      file: afterPath,
    });
    console.error('\n❌ Diff failed');
    process.exit(1);
  }

  // Compare files
  const beforeFiles = new Set(Object.keys(before.files));
  const afterFiles = new Set(Object.keys(after.files));

  const filesAdded: string[] = [];
  const filesRemoved: string[] = [];
  const filesModified: string[] = [];
  const filesUnchanged: string[] = [];

  // Find added files
  for (const file of afterFiles) {
    if (!beforeFiles.has(file)) {
      filesAdded.push(file);
    }
  }

  // Find removed files
  for (const file of beforeFiles) {
    if (!afterFiles.has(file)) {
      filesRemoved.push(file);
    }
  }

  // Find modified/unchanged files
  for (const file of afterFiles) {
    if (beforeFiles.has(file)) {
      const beforeHash = before.files[file].sourceHash;
      const afterHash = after.files[file].sourceHash;

      if (beforeHash !== afterHash) {
        filesModified.push(file);
      } else {
        filesUnchanged.push(file);
      }
    }
  }

  // Compare counts
  const countsDiff = {
    l1: after.counts.l1Variations - before.counts.l1Variations,
    l2: after.counts.l2Variations - before.counts.l2Variations,
    l3: after.counts.l3Variations - before.counts.l3Variations,
    l4: after.counts.l4Variations - before.counts.l4Variations,
    total: after.counts.totalVariations - before.counts.totalVariations,
  };

  const countsChanged = countsDiff.total !== 0;

  // Create diff result
  const result: DiffResult = {
    timestamp: new Date().toISOString(),
    beforePath,
    afterPath,
    filesAdded,
    filesRemoved,
    filesModified,
    filesUnchanged,
    countsChanged,
    countsDiff,
    summary: {
      totalFiles: afterFiles.size,
      added: filesAdded.length,
      removed: filesRemoved.length,
      modified: filesModified.length,
      unchanged: filesUnchanged.length,
    },
  };

  // Display results
  console.log('\n=== Content Diff ===');
  console.log(`Before: ${beforePath}`);
  console.log(`  Generated: ${before.convertedAt}`);
  console.log(`  Version: ${before.generatorVersion}`);
  console.log(`After: ${afterPath}`);
  console.log(`  Generated: ${after.convertedAt}`);
  console.log(`  Version: ${after.generatorVersion}`);

  console.log('\n=== Changes ===');
  console.log(`Files added: ${filesAdded.length}`);
  console.log(`Files removed: ${filesRemoved.length}`);
  console.log(`Files modified: ${filesModified.length}`);
  console.log(`Files unchanged: ${filesUnchanged.length}`);

  if (countsChanged) {
    console.log('\n=== Variation Counts ===');
    console.log(`L1: ${formatDiff(countsDiff.l1)}`);
    console.log(`L2: ${formatDiff(countsDiff.l2)}`);
    console.log(`L3: ${formatDiff(countsDiff.l3)}`);
    console.log(`L4: ${formatDiff(countsDiff.l4)}`);
    console.log(`Total: ${formatDiff(countsDiff.total)}`);
  } else {
    console.log('\nVariation counts unchanged');
  }

  if (!summaryOnly) {
    if (filesAdded.length > 0) {
      console.log('\n=== Files Added ===');
      for (const file of filesAdded.sort()) {
        console.log(`  + ${file}`);
      }
    }

    if (filesRemoved.length > 0) {
      console.log('\n=== Files Removed ===');
      for (const file of filesRemoved.sort()) {
        console.log(`  - ${file}`);
      }
    }

    if (filesModified.length > 0) {
      console.log('\n=== Files Modified ===');
      for (const file of filesModified.sort()) {
        console.log(`  M ${file}`);
      }
    }
  }

  // Write JSON report
  const reportPath = join(process.cwd(), 'reports', 'diff.json');
  const reportJson = JSON.stringify(result, null, 2);

  try {
    const { writeFileAtomic, ensureDir } = await import('./lib/fs.js');
    await ensureDir(join(process.cwd(), 'reports'));
    await writeFileAtomic(reportPath, reportJson, logger);
    console.log(`\n📄 Detailed report: ${reportPath}`);
  } catch (error) {
    logger.warning('DIFF_REPORT_ERROR', `Failed to write report: ${error}`);
  }

  console.log('\n✅ Diff complete');
}

function formatDiff(diff: number): string {
  if (diff === 0) return '0 (unchanged)';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
