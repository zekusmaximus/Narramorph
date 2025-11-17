#!/usr/bin/env node
/**
 * Content Diff Tool
 * Compares two manifests or content directories
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { parseArgs } from 'node:util';

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
  files: Record<
    string,
    {
      sourceHash: string;
      outputPath: string;
      convertedAt: string;
    }
  >;
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
    'src/data/stories/eternal-return/content/manifest.json',
  );

  const beforePath = resolve(values.before || defaultManifest);
  const afterPath = resolve(values.after || defaultManifest);

  logger.info('DIFF_START', `Comparing ${beforePath} vs ${afterPath}`);

  // Check if comparing manifests or directories
  const beforeIsManifest = beforePath.endsWith('.json');
  const afterIsManifest = afterPath.endsWith('.json');

  if (beforeIsManifest && afterIsManifest) {
    await diffManifests(beforePath, afterPath, values['summary-only'], logger);
    return;
  }

  // If both are directories, compare directories
  const beforeStats = await stat(beforePath).catch(() => null);
  const afterStats = await stat(afterPath).catch(() => null);

  if (beforeStats?.isDirectory() && afterStats?.isDirectory()) {
    await diffDirectories(beforePath, afterPath, values['summary-only'], logger);
    return;
  }

  logger.error('DIFF_MODE_ERROR', 'Paths must both be manifests (.json) or both be directories', {
    value: `before=${beforePath}, after=${afterPath}`,
    exampleFix: 'Use --before=manifest1.json --after=manifest2.json or two content dirs',
  });
  process.exit(1);
}

async function diffManifests(
  beforePath: string,
  afterPath: string,
  summaryOnly: boolean | undefined,
  logger: Logger,
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
  if (diff === 0) {
    return '0 (unchanged)';
  }
  if (diff > 0) {
    return `+${diff}`;
  }
  return `${diff}`;
}

// === Directory diff with canonicalized JSON and field-level diffs ===

interface DirFieldChange {
  path: string;
  before: unknown;
  after: unknown;
}
interface DirModified {
  file: string;
  changes: DirFieldChange[];
}

async function listJsonFiles(root: string, base?: string): Promise<string[]> {
  const results: string[] = [];
  const dirents = await readdir(root, { withFileTypes: true });
  for (const d of dirents) {
    const full = join(root, d.name);
    const rel = base ? join(base, d.name) : d.name;
    if (d.isDirectory()) {
      const sub = await listJsonFiles(full, rel);
      results.push(...sub);
    } else if (d.isFile() && d.name.endsWith('.json')) {
      results.push(rel);
    }
  }
  return results.sort();
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      out[k] = canonicalize(obj[k]);
    }
    return out;
  }
  return value;
}

function jsonStableString(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function deepDiff(before: unknown, after: unknown, path: string[] = []): DirFieldChange[] {
  const changes: DirFieldChange[] = [];
  const pathStr = (p: string[]) => (p.length ? p.join('.') : '(root)');

  if (before === undefined && after !== undefined) {
    changes.push({ path: pathStr(path), before, after });
    return changes;
  }
  if (after === undefined && before !== undefined) {
    changes.push({ path: pathStr(path), before, after });
    return changes;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLen = Math.max(before.length, after.length);
    for (let i = 0; i < maxLen; i++) {
      changes.push(...deepDiff(before[i], after[i], [...path, String(i)]));
    }
    return changes;
  }

  if (before && typeof before === 'object' && after && typeof after === 'object') {
    const bKeys = Object.keys(before as Record<string, unknown>);
    const aKeys = Object.keys(after as Record<string, unknown>);
    const all = new Set([...bKeys, ...aKeys]);
    for (const k of all) {
      changes.push(...deepDiff((before as any)[k], (after as any)[k], [...path, k]));
    }
    return changes;
  }

  if (jsonStableString(before) !== jsonStableString(after)) {
    changes.push({ path: pathStr(path), before, after });
  }
  return changes;
}

async function diffDirectories(
  beforeDir: string,
  afterDir: string,
  summaryOnly: boolean | undefined,
  logger: Logger,
): Promise<void> {
  const beforeFiles = await listJsonFiles(beforeDir);
  const afterFiles = await listJsonFiles(afterDir);

  const beforeSet = new Set(beforeFiles);
  const afterSet = new Set(afterFiles);

  const added = afterFiles.filter((f) => !beforeSet.has(f));
  const removed = beforeFiles.filter((f) => !afterSet.has(f));
  const common = afterFiles.filter((f) => beforeSet.has(f));

  const modified: DirModified[] = [];
  const unchanged: string[] = [];

  for (const rel of common) {
    const bPath = join(beforeDir, rel);
    const aPath = join(afterDir, rel);
    try {
      const bRaw = await readFile(bPath, 'utf-8');
      const aRaw = await readFile(aPath, 'utf-8');
      const bObj = JSON.parse(bRaw);
      const aObj = JSON.parse(aRaw);
      const bCanon = jsonStableString(bObj);
      const aCanon = jsonStableString(aObj);
      if (bCanon !== aCanon) {
        const changes = deepDiff(canonicalize(bObj), canonicalize(aObj));
        modified.push({ file: rel, changes });
      } else {
        unchanged.push(rel);
      }
    } catch (error) {
      logger.warning('DIFF_READ_ERROR', `Failed to read/parse ${rel}: ${error}`);
    }
  }

  console.log('\n=== Directory Content Diff ===');
  console.log(`Before dir: ${beforeDir}`);
  console.log(`After dir:  ${afterDir}`);
  console.log(`\nFiles added: ${added.length}`);
  console.log(`Files removed: ${removed.length}`);
  console.log(`Files modified: ${modified.length}`);
  console.log(`Files unchanged: ${unchanged.length}`);

  if (!summaryOnly) {
    if (added.length) {
      console.log('\n=== Added ===');
      for (const f of added) {
        console.log(`  + ${f}`);
      }
    }
    if (removed.length) {
      console.log('\n=== Removed ===');
      for (const f of removed) {
        console.log(`  - ${f}`);
      }
    }
    if (modified.length) {
      console.log('\n=== Modified (field-level) ===');
      for (const m of modified) {
        console.log(`  M ${m.file}`);
        for (const c of m.changes) {
          console.log(`    ${c.path}: ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}`);
        }
      }
    }
  }

  console.log('\n�o. Dir diff complete');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
