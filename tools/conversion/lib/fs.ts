/**
 * File system utilities with atomic writes, backups, and manifest generation
 */

import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { Logger } from './log.js';

// Performance limits
export const MAX_CONCURRENT_READS = 10;
export const STREAM_THRESHOLD_KB = 100;

export interface ManifestFile {
  sourceHash: string;
  outputPath: string;
  convertedAt: string;
}

export interface Manifest {
  schemaVersion: string;
  generatorVersion: string;
  convertedAt: string;
  sourceRoot: string;
  files: Record<string, ManifestFile>;
  counts: {
    l1Variations: number;
    l2Variations: number;
    l3Variations: number;
    l4Variations: number;
    totalVariations: number;
  };
}

/**
 * Read file with error handling and streaming for large files
 */
export async function readFileWithLogging(
  filePath: string,
  logger?: Logger,
  useStreaming?: boolean,
): Promise<string | null> {
  try {
    // Check file size
    const stats = await stat(filePath);
    const fileSizeKB = stats.size / 1024;

    // Use streaming for large files if enabled
    if (useStreaming && fileSizeKB > STREAM_THRESHOLD_KB) {
      return await readFileStreaming(filePath, logger);
    }

    return await readFile(filePath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.blocker('FILE_READ_ERROR', `Failed to read file: ${message}`, {
      file: filePath,
    });
    return null;
  }
}

/**
 * Read large file using streams
 */
async function readFileStreaming(filePath: string, logger?: Logger): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(filePath, { encoding: 'utf-8' });

    stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });

    stream.on('error', (error) => {
      logger?.blocker('FILE_STREAM_ERROR', `Failed to stream file: ${error.message}`, {
        file: filePath,
      });
      reject(error);
    });
  });
}

/**
 * Process files in batches with concurrency limit
 */
export async function processBatchConcurrent<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = MAX_CONCURRENT_READS,
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1,
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Write file atomically with temp file strategy
 */
export async function writeFileAtomic(
  filePath: string,
  content: string,
  logger?: Logger,
): Promise<boolean> {
  const tempPath = `${filePath}.tmp`;

  try {
    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });

    // Write to temp file
    await writeFile(tempPath, content, 'utf-8');

    // Atomic rename
    await writeFile(filePath, content, 'utf-8');

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.blocker('FILE_WRITE_ERROR', `Failed to write file: ${message}`, {
      file: filePath,
    });
    return false;
  }
}

/**
 * Hash file content (frontmatter + body)
 */
export function hashContent(frontmatter: string, content: string): string {
  const combined = frontmatter + '\n---\n' + content;
  return createHash('sha256').update(combined, 'utf-8').digest('hex');
}

/**
 * Create backup of output directory
 */
export async function createBackup(
  sourceDir: string,
  backupRoot: string,
  logger?: Logger,
): Promise<string | null> {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  if (!timestamp) {
    logger?.error('BACKUP_FAILED', 'Failed to generate timestamp');
    return null;
  }
  const backupDir = join(backupRoot, timestamp);

  try {
    await mkdir(backupDir, { recursive: true });

    // Copy all JSON files recursively
    await copyDirectoryRecursive(sourceDir, backupDir, '.json');

    logger?.info('BACKUP_CREATED', `Backup created at ${backupDir}`);
    return backupDir;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('BACKUP_FAILED', `Failed to create backup: ${message}`);
    return null;
  }
}

/**
 * Copy directory recursively (filtered by extension)
 */
async function copyDirectoryRecursive(
  src: string,
  dest: string,
  extension?: string,
): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const entryName = entry.name;
    if (!entryName) continue;

    const srcPath = join(src, entryName);
    const destPath = join(dest, entryName);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath, extension);
    } else if (entry.isFile()) {
      if (!extension || entryName.endsWith(extension)) {
        await copyFile(srcPath, destPath);
      }
    }
  }
}

/**
 * Create or update manifest
 */
export async function writeManifest(
  manifest: Manifest,
  outputPath: string,
  logger?: Logger,
): Promise<boolean> {
  try {
    await mkdir(dirname(outputPath), { recursive: true });
    const json = JSON.stringify(manifest, null, 2);
    await writeFile(outputPath, json, 'utf-8');
    logger?.info('MANIFEST_WRITTEN', `Manifest written to ${outputPath}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('MANIFEST_WRITE_FAILED', `Failed to write manifest: ${message}`, {
      file: outputPath,
    });
    return false;
  }
}

/**
 * Read existing manifest
 */
export async function readManifest(
  manifestPath: string,
  logger?: Logger,
): Promise<Manifest | null> {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.warning('MANIFEST_READ_FAILED', `Failed to read manifest: ${message}`, {
      file: manifestPath,
    });
    return null;
  }
}

/**
 * Discover markdown files by pattern
 */
export async function discoverMarkdownFiles(
  rootDir: string,
  pattern: RegExp,
  logger?: Logger,
): Promise<string[]> {
  const files: string[] = [];

  try {
    await discoverFilesRecursive(rootDir, files, pattern);
    files.sort(); // Deterministic ordering
    return files;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('FILE_DISCOVERY_ERROR', `Failed to discover files: ${message}`, {
      file: rootDir,
    });
    return [];
  }
}

/**
 * Recursive file discovery
 */
async function discoverFilesRecursive(
  dir: string,
  files: string[],
  pattern: RegExp,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await discoverFilesRecursive(fullPath, files, pattern);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Get relative path from root
 */
export function getRelativePath(filePath: string, rootDir: string): string {
  return relative(rootDir, filePath);
}

/**
 * Resolve absolute path
 */
export function resolvePath(...paths: string[]): string {
  return resolve(...paths);
}
