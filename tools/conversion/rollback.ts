#!/usr/bin/env node
/**
 * Rollback Tool
 * Restores content from backup snapshots
 */

import { resolve, join, relative, basename } from 'node:path';
import { parseArgs } from 'node:util';
import { readdir, readFile, copyFile, stat } from 'node:fs/promises';
import { Logger } from './lib/log.js';
import { ensureDir } from './lib/fs.js';

interface CliArgs {
  to?: string;
  layer?: string;
  nodes?: string;
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

async function main() {
  const { values } = parseArgs({
    options: {
      to: { type: 'string', short: 't' },
      layer: { type: 'string', short: 'l' },
      nodes: { type: 'string', short: 'n' },
      verbose: { type: 'boolean', short: 'v' },
    },
  }) as { values: CliArgs };

  const logger = new Logger(values.verbose);

  const projectRoot = resolve(process.cwd(), '../..');
  const backupRoot = join(projectRoot, '.backups');
  const contentRoot = join(projectRoot, 'src/data/stories/eternal-return/content');

  if (!values.to) {
    logger.blocker('ROLLBACK_MISSING_TO', 'Must specify --to timestamp', {
      exampleFix: 'Use --to=YYYY-MM-DDTHH-mm-ss',
    });
    console.error('\n❌ Rollback failed');
    process.exit(1);
  }

  const timestamp = values.to;
  const backupDir = join(backupRoot, timestamp);

  logger.info('ROLLBACK_START', `Rolling back to ${timestamp}`);

  // Check if backup exists
  try {
    await stat(backupDir);
  } catch (error) {
    logger.blocker('ROLLBACK_NOT_FOUND', `Backup not found: ${timestamp}`, {
      file: backupDir,
      exampleFix: 'List available backups with: ls .backups/',
    });
    console.error('\n❌ Rollback failed');
    process.exit(1);
  }

  // Read backup manifest
  const manifestPath = join(backupDir, 'manifest.json');
  let manifest: Manifest;

  try {
    const content = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (error) {
    logger.blocker('ROLLBACK_MANIFEST_ERROR', `Failed to read backup manifest: ${error}`, {
      file: manifestPath,
    });
    console.error('\n❌ Rollback failed');
    process.exit(1);
  }

  logger.info('ROLLBACK_MANIFEST', `Backup created: ${manifest.convertedAt}`);
  logger.info('ROLLBACK_COUNTS', `Total variations: ${manifest.counts.totalVariations}`);

  // Filter files by layer/nodes if specified
  let filesToRestore = Object.values(manifest.files).map(f => f.outputPath);

  if (values.layer) {
    const layer = values.layer;
    filesToRestore = filesToRestore.filter(path => path.startsWith(`layer${layer}/`));
    logger.info('ROLLBACK_FILTER', `Filtering to layer ${layer}: ${filesToRestore.length} files`);
  }

  if (values.nodes) {
    const nodes = values.nodes.split(',').map(n => n.trim());
    filesToRestore = filesToRestore.filter(path => {
      const fileName = basename(path, '.json');
      return nodes.some(node => fileName.startsWith(node) || fileName === node);
    });
    logger.info('ROLLBACK_FILTER', `Filtering to nodes ${nodes.join(',')}: ${filesToRestore.length} files`);
  }

  // Restore files
  console.log(`\n📦 Restoring ${filesToRestore.length} files...`);

  let restoredCount = 0;
  let errorCount = 0;

  for (const outputPath of filesToRestore) {
    const sourcePath = join(backupDir, outputPath);
    const destPath = join(contentRoot, outputPath);

    try {
      // Ensure destination directory exists
      await ensureDir(join(destPath, '..'));

      // Copy file
      await copyFile(sourcePath, destPath);
      restoredCount++;

      if (values.verbose) {
        console.log(`  ✓ ${outputPath}`);
      }
    } catch (error) {
      logger.error('ROLLBACK_FILE_ERROR', `Failed to restore ${outputPath}: ${error}`, {
        file: sourcePath,
      });
      errorCount++;
    }
  }

  // Restore manifest
  try {
    const destManifestPath = join(contentRoot, 'manifest.json');
    await copyFile(manifestPath, destManifestPath);
    logger.info('ROLLBACK_MANIFEST_RESTORED', 'Restored manifest.json');
  } catch (error) {
    logger.error('ROLLBACK_MANIFEST_ERROR', `Failed to restore manifest: ${error}`);
  }

  // Summary
  console.log('\n=== Rollback Summary ===');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Files restored: ${restoredCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\n${logger.summary()}`);

  if (errorCount > 0) {
    console.error('\n⚠️  Rollback completed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ Rollback completed successfully');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
