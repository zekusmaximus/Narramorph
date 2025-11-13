#!/usr/bin/env node
/**
 * Main conversion CLI: Markdown → JSON
 * Converts L1/L2/L3/L4 markdown files to JSON format
 */

import { existsSync } from 'node:fs';
import { watch } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';

import { parseFrontmatter, countWords } from './lib/frontmatter.js';
import {
  readFileWithLogging,
  writeFileAtomic,
  discoverMarkdownFiles,
  hashContent,
  writeManifest,
  ensureDir,
  processBatchConcurrent,
  createBackup,
  type Manifest,
} from './lib/fs.js';
import { generateAggregatedId, generateL3Id, parseVariationId } from './lib/ids.js';
import { Logger } from './lib/log.js';
import { normalizeText } from './lib/normalize.js';
import { detectSimilarVariations, type VariationText } from './lib/similarity.js';
import {
  validateL1L2Frontmatter,
  validateL3Frontmatter,
  validateL4Frontmatter,
  validateWordCount,
  validateVariationCount,
  checkDuplicateIds,
  validateSchemaVersion,
  type ValidationOptions,
} from './lib/validate.js';

const SCHEMA_VERSION = '1.0.0';
const GENERATOR_VERSION = '1.0.0';

interface CliArgs {
  layer?: string;
  nodes?: string;
  ids?: string;
  'dry-run'?: boolean;
  strict?: boolean;
  parallel?: number;
  watch?: boolean;
  debounce?: number;
  verbose?: boolean;
}

interface L1L2Variation {
  id: string;
  transformationState: string;
  awarenessRange?: [number, number];
  content: string;
  metadata: Record<string, unknown>;
}

interface L1L2Output {
  schemaVersion: string;
  nodeId: string;
  totalVariations: number;
  variations: L1L2Variation[];
}

interface L3Output {
  schemaVersion: string;
  id: string;
  sectionType: string;
  journeyPattern: string;
  philosophyDominant: string;
  awarenessLevel: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface L4Output {
  schemaVersion: string;
  id: string;
  philosophy: string;
  content: string;
  metadata: Record<string, unknown>;
}

async function main() {
  const { values } = parseArgs({
    options: {
      layer: { type: 'string', short: 'l' },
      nodes: { type: 'string', short: 'n' },
      ids: { type: 'string', short: 'i' },
      'dry-run': { type: 'boolean', short: 'd' },
      strict: { type: 'boolean', short: 's' },
      parallel: { type: 'string', short: 'p' },
      watch: { type: 'boolean', short: 'w' },
      debounce: { type: 'string' },
      verbose: { type: 'boolean', short: 'v' },
    },
  }) as { values: CliArgs };

  const logger = new Logger(values.verbose);
  const options: ValidationOptions = {
    strict: values.strict || false,
  };

  const projectRoot = resolve(process.cwd(), '../..');
  const docsRoot = join(projectRoot, 'docs');
  const outputRoot = join(projectRoot, 'src/data/stories/eternal-return/content');

  // Parse parallelism (default to 4, max 10)
  const parallelValue = values.parallel ? parseInt(values.parallel, 10) : 4;
  const parallel = Math.min(parallelValue, 10);

  logger.info(
    'CONVERSION_START',
    `Starting conversion (strict=${options.strict}, parallel=${parallel})`,
  );

  const layers = values.layer === 'all' ? ['1', '2', '3', '4'] : [values.layer || '1'];

  // Create backup before conversion (unless dry-run)
  if (!values['dry-run']) {
    const backupRoot = join(projectRoot, '.backups');
    logger.info('BACKUP_START', 'Creating backup before conversion...');
    const backupDir = await createBackup(outputRoot, backupRoot, logger);
    if (backupDir) {
      logger.info('BACKUP_CREATED', `Backup created: ${backupDir}`);
    } else {
      logger.warning('BACKUP_FAILED', 'Failed to create backup, continuing anyway...');
    }
  }

  const manifest: Manifest = {
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    convertedAt: new Date().toISOString(),
    sourceRoot: docsRoot,
    files: {},
    counts: {
      l1Variations: 0,
      l2Variations: 0,
      l3Variations: 0,
      l4Variations: 0,
      totalVariations: 0,
    },
  };

  for (const layer of layers) {
    if (layer === '1') {
      await convertL1(docsRoot, outputRoot, manifest, logger, options, values['dry-run'], parallel);
    } else if (layer === '2') {
      await convertL2(docsRoot, outputRoot, manifest, logger, options, values['dry-run'], parallel);
    } else if (layer === '3') {
      await convertL3(docsRoot, outputRoot, manifest, logger, options, values['dry-run'], parallel);
    } else if (layer === '4') {
      await convertL4(docsRoot, outputRoot, manifest, logger, options, values['dry-run'], parallel);
    }
  }

  // Write manifest
  if (!values['dry-run']) {
    const manifestPath = join(outputRoot, 'manifest.json');
    await writeManifest(manifest, manifestPath, logger);
  }

  // Summary
  console.log('\n=== Conversion Summary ===');
  console.log(`Variations converted: ${manifest.counts.totalVariations}`);
  console.log(`  L1: ${manifest.counts.l1Variations}`);
  console.log(`  L2: ${manifest.counts.l2Variations}`);
  console.log(`  L3: ${manifest.counts.l3Variations}`);
  console.log(`  L4: ${manifest.counts.l4Variations}`);
  console.log(`\n${logger.summary()}`);

  if (logger.hasBlockers()) {
    console.error('\n❌ Conversion failed due to blockers');
    process.exit(1);
  }

  if (options.strict && logger.hasErrors()) {
    console.error('\n❌ Conversion failed in strict mode due to errors');
    process.exit(1);
  }

  if (logger.hasWarnings()) {
    console.log('\n⚠️  Conversion completed with warnings');
  } else {
    console.log('\n✅ Conversion completed successfully');
  }

  // Start watch mode if requested
  if (values.watch) {
    const debounceValue = values.debounce ? parseInt(values.debounce, 10) : 500;
    const debounce = debounceValue;
    console.log(`\n👀 Watching ${docsRoot} for changes (debounce=${debounce}ms)...`);
    console.log('Press Ctrl+C to stop\n');

    await startWatchMode(docsRoot, outputRoot, layers, options, debounce, parallel);
  }
}

/**
 * Watch mode: Re-convert files on change
 */
async function startWatchMode(
  docsRoot: string,
  outputRoot: string,
  layers: string[],
  _options: ValidationOptions,
  debounceMs: number,
  parallel: number,
): Promise<void> {
  const pendingChanges = new Set<string>();
  let debounceTimer: NodeJS.Timeout | null = null;

  watch(docsRoot, { recursive: true }, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) {
      return;
    }

    const fullPath = join(docsRoot, filename);
    pendingChanges.add(fullPath);

    // Debounce: reset timer on each change
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      const changedFiles = Array.from(pendingChanges);
      pendingChanges.clear();

      console.log(`\n🔄 Processing ${changedFiles.length} changed file(s)...`);

      for (const file of changedFiles) {
        const relativePath = relative(docsRoot, file);
        console.log(`  ${relativePath}`);

        // Determine which layer this file belongs to
        const layer = detectLayer(relativePath);
        if (!layer || !layers.includes(layer)) {
          console.log(`    Skipped (layer ${layer} not in watch scope)`);
          continue;
        }

        // Re-convert with WARNINGS only (no fail in watch mode)
        const logger = new Logger(true);
        const watchOptions: ValidationOptions = { strict: false };

        const manifest: Manifest = {
          schemaVersion: SCHEMA_VERSION,
          generatorVersion: GENERATOR_VERSION,
          convertedAt: new Date().toISOString(),
          sourceRoot: docsRoot,
          files: {},
          counts: {
            l1Variations: 0,
            l2Variations: 0,
            l3Variations: 0,
            l4Variations: 0,
            totalVariations: 0,
          },
        };

        try {
          if (layer === '1') {
            await convertL1(docsRoot, outputRoot, manifest, logger, watchOptions, false, parallel);
          } else if (layer === '2') {
            await convertL2(docsRoot, outputRoot, manifest, logger, watchOptions, false, parallel);
          } else if (layer === '3') {
            await convertL3(docsRoot, outputRoot, manifest, logger, watchOptions, false, parallel);
          } else if (layer === '4') {
            await convertL4(docsRoot, outputRoot, manifest, logger, watchOptions, false, parallel);
          }

          if (logger.hasWarnings()) {
            console.log(`    ⚠️  Converted with warnings`);
          } else {
            console.log(`    ✅ Converted successfully`);
          }
        } catch (error) {
          console.error(`    ❌ Conversion failed: ${error}`);
        }
      }

      console.log('\n👀 Watching for changes...');
    }, debounceMs);
  });

  // Keep process alive
  await new Promise(() => {});
}

/**
 * Detect which layer a file belongs to based on its path
 */
function detectLayer(relativePath: string): string | null {
  if (relativePath.includes('-L1-production')) {
    return '1';
  }
  if (relativePath.includes('-L2-') && relativePath.includes('-production')) {
    return '2';
  }
  if (relativePath.includes('/L3/')) {
    return '3';
  }
  if (relativePath.includes('/L4/')) {
    return '4';
  }
  return null;
}

/**
 * Convert L1 layer (3 nodes × 80 variations = 240 total)
 */
async function convertL1(
  docsRoot: string,
  outputRoot: string,
  manifest: Manifest,
  logger: Logger,
  options: ValidationOptions,
  dryRun?: boolean,
  parallel?: number,
): Promise<void> {
  logger.info('L1_START', 'Converting Layer 1...');

  const characters = ['arch', 'algo', 'hum'];

  for (const char of characters) {
    const nodeId = `${char}-L1`;
    const sourceDir = join(docsRoot, `${char}-L1-production`);

    // Discover all markdown files (sorted for determinism)
    let files = (await discoverMarkdownFiles(sourceDir, /\.md$/, logger)).sort();
    // Only process canonical variation files from firstRevisit/metaAware directories + INITIAL_STATE to avoid docs/templates
    const prefix = `${char}-L1`;
    const frPattern = new RegExp(`${prefix}-FR-\\d{2,3}\\.md$`);
    const maPattern = new RegExp(`${prefix}-MA-\\d{2,3}\\.md$`);
    const initialPattern = new RegExp(`${prefix}-INITIAL_STATE\\.md$`);
    files = files.filter(
      (f) =>
        (frPattern.test(f) && /[\\\/]firstRevisit[\\\/]/.test(f)) ||
        (maPattern.test(f) && /[\\\/]metaAware[\\\/]/.test(f)) ||
        initialPattern.test(f),
    );
    logger.info('L1_DISCOVERED', `Found ${files.length} files for ${nodeId}`);

    const variations: L1L2Variation[] = [];
    const variationTexts: VariationText[] = [];
    const ids: string[] = [];

    type L1ProcessResult = {
      variation: L1L2Variation | null;
      variationText: VariationText | null;
      manifestEntry?: { file: string; sourceHash: string };
    };

    const results = await processBatchConcurrent<string, L1ProcessResult>(
      files,
      async (file) => {
        const content = await readFileWithLogging(file, logger);
        if (!content) {
          return { variation: null, variationText: null };
        }

        const { text: normalized } = normalizeText(content, logger, file);
        const isInitialState = /INITIAL_STATE\.md$/.test(file);

        let parsed: { frontmatter: any; content: string; raw: string } | null;
        let frontmatter: any;
        let body: string;

        // Handle INITIAL_STATE files specially (no YAML frontmatter)
        if (isInitialState) {
          const lines = normalized.split(/\r?\n/);
          let contentStartIndex = 0;
          let wordCount = 0;

          // Parse markdown header format:
          // # arch-L1: "The Authentication"
          // **Initial State - Visit 1**
          // **Word Count: 6,142**
          // **Character: The Archaeologist (2047)**
          // ---
          // [content starts here]

          for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i];
            const wcMatch = line.match(/\*\*Word Count:\s*([\d,]+)\*\*/);
            if (wcMatch) {
              wordCount = parseInt(wcMatch[1].replace(/,/g, ''), 10);
            }
            if (line.trim() === '---' && i > 0) {
              contentStartIndex = i + 1;
              break;
            }
          }

          body = lines.slice(contentStartIndex).join('\n').trim();

          // Generate frontmatter for initial state
          const charPrefix = file.includes('arch-')
            ? 'arch'
            : file.includes('algo-')
              ? 'algo'
              : 'hum';
          frontmatter = {
            variation_id: `${charPrefix}-L1-INITIAL-001`,
            variation_type: 'initial',
            word_count: wordCount || countWords(body),
            // Note: initial state should NOT have awareness conditions
          };

          parsed = { frontmatter, content: body, raw: normalized };
        } else {
          parsed = parseFrontmatter(normalized, logger, file);
          if (!parsed) {
            return { variation: null, variationText: null };
          }
          frontmatter = parsed.frontmatter;
          body = parsed.content;

          // Normalize missing variation_id from legacy 'id' and filename context
          if (!('variation_id' in frontmatter)) {
            const base = frontmatter.id as string | undefined;
            let num: string | undefined;
            if (base) {
              const m = base.match(/^(FR|MA)[-_]?(\d{1,3})$/i);
              if (m && m[2]) {
                num = m[2];
              }
            }
            // Fallback to filename extraction
            if (!num) {
              const fname = file.split(/[/\\]/).pop() || '';
              const m2 = fname.match(/-(FR|MA)-(\d{1,3})\.md$/i);
              if (m2 && m2[2]) {
                num = m2[2];
              }
            }
            const dirIsFR = /firstRevisit/.test(file);
            const phase = dirIsFR ? 'FR' : 'MA';
            if (num) {
              const padded = num.padStart(3, '0');
              frontmatter.variation_id = `arch-L1-${phase}-${padded}`;
            }
          }

          // Normalize awareness into conditions.awareness if present as awareness_range
          if (!('conditions' in frontmatter) && 'awareness_range' in frontmatter) {
            const ar = frontmatter.awareness_range as string;
            frontmatter.conditions = { awareness: ar.endsWith('%') ? ar : `${ar}%` };
          }
        }

        if (!validateL1L2Frontmatter(frontmatter, 1, logger, file)) {
          return { variation: null, variationText: null };
        }

        const variationId = frontmatter.variation_id as string;
        const variationType = frontmatter.variation_type as string;
        const wordCount = frontmatter.word_count as number;

        let transformationState: string = variationType;
        if (variationType === 'initial') {
          transformationState = 'initial';
        } else if (variationType === 'firstRevisit') {
          transformationState = 'firstRevisit';
        } else if (variationType === 'metaAware') {
          transformationState = 'metaAware';
        }

        let awarenessRange: [number, number] | undefined;
        if ('conditions' in frontmatter && frontmatter.conditions) {
          const conditions = frontmatter.conditions as Record<string, unknown>;
          if ('awareness' in conditions && typeof conditions.awareness === 'string') {
            const match = conditions.awareness.match(/(\d+)-(\d+)%/);
            if (match && match[1] && match[2]) {
              awarenessRange = [parseInt(match[1], 10), parseInt(match[2], 10)];
            }
          }
        }

        const actualWordCount = countWords(body);
        validateWordCount(actualWordCount, wordCount, 10, 1, logger, file);

        const variation: L1L2Variation = {
          id: variationId,
          transformationState,
          awarenessRange,
          content: body,
          metadata: { wordCount: actualWordCount, ...frontmatter },
        };

        const variationText: VariationText = {
          id: variationId,
          content: body,
          groupKey: `${nodeId}-${transformationState}`,
        };

        const sourceHash = hashContent(parsed.raw, body);
        return { variation, variationText, manifestEntry: { file, sourceHash } };
      },
      parallel ?? 4,
    );

    for (const r of results) {
      if (!r.variation || !r.variationText) {
        continue;
      }
      variations.push(r.variation);
      ids.push(r.variation.id);
      variationTexts.push(r.variationText);
      if (r.manifestEntry) {
        manifest.files[r.manifestEntry.file] = {
          sourceHash: r.manifestEntry.sourceHash,
          outputPath: `layer1/${nodeId}-variations.json`,
          convertedAt: new Date().toISOString(),
        };
      }
    }

    // Sort variations by ID for deterministic output
    variations.sort((a, b) => a.id.localeCompare(b.id));

    // Re-index with zero-padded IDs
    const reindexedVariations = variations.map((v, index) => ({
      ...v,
      id: generateAggregatedId(char as any, 1, index + 1),
    }));

    // Check for duplicates
    checkDuplicateIds(
      reindexedVariations.map((v) => v.id),
      logger,
      nodeId,
    );

    // Validate count
    validateVariationCount(reindexedVariations.length, 80, nodeId, logger, options);

    // Detect similar variations
    detectSimilarVariations(variationTexts, logger);

    // Create output
    const output: L1L2Output = {
      schemaVersion: SCHEMA_VERSION,
      nodeId,
      totalVariations: reindexedVariations.length,
      variations: reindexedVariations,
    };

    // Validate schema version
    validateSchemaVersion(output as unknown as Record<string, unknown>, logger, nodeId);

    // Write output
    if (!dryRun) {
      const outputDir = join(outputRoot, 'layer1');
      await ensureDir(outputDir);
      const outputPath = join(outputDir, `${nodeId}-variations.json`);
      const json = JSON.stringify(output, null, 2);
      await writeFileAtomic(outputPath, json, logger);
      logger.info('L1_WRITTEN', `Wrote ${outputPath}`);
    }

    manifest.counts.l1Variations += reindexedVariations.length;
  }

  manifest.counts.totalVariations += manifest.counts.l1Variations;
  logger.info(
    'L1_COMPLETE',
    `Layer 1 conversion complete: ${manifest.counts.l1Variations} variations`,
  );
}

/**
 * Convert L2 layer (9 nodes × 80 variations = 720 total)
 */
async function convertL2(
  docsRoot: string,
  outputRoot: string,
  manifest: Manifest,
  logger: Logger,
  options: ValidationOptions,
  dryRun?: boolean,
  parallel?: number,
): Promise<void> {
  logger.info('L2_START', 'Converting Layer 2...');

  const characters = ['arch', 'algo', 'hum'];
  const paths: Array<'accept' | 'resist' | 'invest'> = ['accept', 'resist', 'invest'];

  for (const char of characters) {
    for (const path of paths) {
      const nodeId = `${char}-L2-${path}`;
      const sourceDir = join(docsRoot, `${char}-L2-${path}-production`);

      // Discover only variation markdown files inside expected subfolders + INITIAL_STATE
      const candidateDirs = [join(sourceDir, 'firstRevisit'), join(sourceDir, 'metaAware')];

      let files: string[] = [];
      for (const dir of candidateDirs) {
        if (existsSync(dir)) {
          const found = await discoverMarkdownFiles(dir, /\.md$/, logger);
          files.push(...found);
        }
      }

      // Check for INITIAL_STATE file at root of sourceDir
      const initialStateFile = join(sourceDir, `${char}-L2-${path}-INITIAL_STATE.md`);
      if (existsSync(initialStateFile)) {
        files.push(initialStateFile);
      }

      // Fallback: if subfolders not found, still filter filenames in sourceDir
      if (files.length === 0 && existsSync(sourceDir)) {
        const all = await discoverMarkdownFiles(sourceDir, /\.md$/, logger);
        files = all.filter((f) => /-(FR|MA)-\d+\.md$/i.test(f) || /-INITIAL_STATE\.md$/i.test(f));
      }

      files.sort();
      logger.info('L2_DISCOVERED', `Found ${files.length} files for ${nodeId}`);

      const variations: L1L2Variation[] = [];
      const variationTexts: VariationText[] = [];
      const ids: string[] = [];

      type L2ProcessResult = {
        variation: L1L2Variation | null;
        variationText: VariationText | null;
        manifestEntry?: { file: string; sourceHash: string };
      };

      const results = await processBatchConcurrent<string, L2ProcessResult>(
        files,
        async (file) => {
          const content = await readFileWithLogging(file, logger);
          if (!content) {
            return { variation: null, variationText: null };
          }

          const { text: normalized } = normalizeText(content, logger, file);
          const isInitialState = /INITIAL_STATE\.md$/.test(file);

          let parsed: { frontmatter: any; content: string; raw: string } | null;
          let frontmatter: any;
          let body: string;

          // Handle INITIAL_STATE files specially (no YAML frontmatter, just raw content)
          if (isInitialState) {
            body = normalized.trim();

            // Extract character and path from filename
            const m = basename(file).match(
              /^(arch|algo|hum)-L2-(accept|resist|invest)-INITIAL_STATE\.md$/,
            );
            if (!m) {
              return { variation: null, variationText: null };
            }
            const [, sChar, sPath] = m;

            // Generate frontmatter for initial state
            frontmatter = {
              variation_id: `${sChar}-L2-${sPath}-INITIAL-001`,
              variation_type: 'initial',
              word_count: countWords(body),
              // Note: initial state should NOT have awareness conditions
            };

            parsed = { frontmatter, content: body, raw: normalized };
          } else {
            parsed = parseFrontmatter(normalized, logger, file);
            if (!parsed) {
              // Salvage minimal L2 frontmatter from filename
              const m = basename(file).match(
                /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)/,
              );
              if (!m) {
                return { variation: null, variationText: null };
              }
              const [, sChar, sPath, sPhase, sNum] = m;
              const varId = `${sChar}-L2-${sPath}-${sPhase}-${sNum.padStart(3, '0')}`;
              frontmatter = {
                variation_id: varId,
                variation_type: sPhase === 'FR' ? 'firstRevisit' : 'metaAware',
                word_count: 0,
                conditions: { awareness: '0-100%' },
              };
              // strip any leading frontmatter chunk
              if (/^---/.test(normalized)) {
                const lines = normalized.split(/\r?\n/);
                let i = 1;
                for (; i < lines.length; i++) {
                  if (lines[i].trim() === '') {
                    i++;
                    break;
                  }
                }
                body = lines.slice(i).join('\n');
              } else {
                body = normalized;
              }
            } else {
              frontmatter = parsed.frontmatter;
              body = parsed.content;
            }
          }

          if (!validateL1L2Frontmatter(frontmatter, 2, logger, file)) {
            return { variation: null, variationText: null };
          }

          const variationId = frontmatter.variation_id as string;
          const variationType = frontmatter.variation_type as string;
          const wordCount = frontmatter.word_count as number;

          let transformationState: string = variationType;
          if (variationType === 'initial') {
            transformationState = 'initial';
          } else if (variationType === 'firstRevisit') {
            transformationState = 'firstRevisit';
          } else if (variationType === 'metaAware') {
            transformationState = 'metaAware';
          }

          let awarenessRange: [number, number] | undefined;
          if ('conditions' in frontmatter && frontmatter.conditions) {
            const conditions = frontmatter.conditions as Record<string, unknown>;
            if ('awareness' in conditions && typeof conditions.awareness === 'string') {
              const match = conditions.awareness.match(/(\d+)-(\d+)%/);
              if (match && match[1] && match[2]) {
                awarenessRange = [parseInt(match[1], 10), parseInt(match[2], 10)];
              }
            }
          }

          const actualWordCount = countWords(body);
          validateWordCount(actualWordCount, wordCount, 10, 2, logger, file);

          const variation: L1L2Variation = {
            id: variationId,
            transformationState,
            awarenessRange,
            content: body,
            metadata: { wordCount: actualWordCount, pathPhilosophy: path, ...frontmatter },
          };

          const variationText: VariationText = {
            id: variationId,
            content: body,
            groupKey: `${nodeId}-${transformationState}`,
          };

          const sourceHash = hashContent(parsed ? parsed.raw : JSON.stringify(frontmatter), body);
          return { variation, variationText, manifestEntry: { file, sourceHash } };
        },
        parallel ?? 4,
      );

      for (const r of results) {
        if (!r.variation || !r.variationText) {
          continue;
        }
        variations.push(r.variation);
        ids.push(r.variation.id);
        variationTexts.push(r.variationText);
        if (r.manifestEntry) {
          manifest.files[r.manifestEntry.file] = {
            sourceHash: r.manifestEntry.sourceHash,
            outputPath: `layer2/${nodeId}-variations.json`,
            convertedAt: new Date().toISOString(),
          };
        }
      }

      // Sort variations by ID for deterministic output
      variations.sort((a, b) => a.id.localeCompare(b.id));

      // Re-index with zero-padded IDs
      const reindexedVariations = variations.map((v, index) => ({
        ...v,
        id: generateAggregatedId(char as any, 2, index + 1, path),
      }));

      // Check for duplicates
      checkDuplicateIds(
        reindexedVariations.map((v) => v.id),
        logger,
        nodeId,
      );

      // Validate count
      validateVariationCount(reindexedVariations.length, 80, nodeId, logger, options);

      // Detect similar variations
      detectSimilarVariations(variationTexts, logger);

      // Create output
      const output: L1L2Output = {
        schemaVersion: SCHEMA_VERSION,
        nodeId,
        totalVariations: reindexedVariations.length,
        variations: reindexedVariations,
      };

      // Validate schema version
      validateSchemaVersion(output as unknown as Record<string, unknown>, logger, nodeId);

      // Write output
      if (!dryRun) {
        const outputDir = join(outputRoot, 'layer2');
        await ensureDir(outputDir);
        const outputPath = join(outputDir, `${nodeId}-variations.json`);
        const json = JSON.stringify(output, null, 2);
        await writeFileAtomic(outputPath, json, logger);
        logger.info('L2_WRITTEN', `Wrote ${outputPath}`);
      }

      manifest.counts.l2Variations += reindexedVariations.length;
    }
  }

  manifest.counts.totalVariations += manifest.counts.l2Variations;
  logger.info(
    'L2_COMPLETE',
    `Layer 2 conversion complete: ${manifest.counts.l2Variations} variations`,
  );
}

/**
 * Convert L3 layer (per-file conversion)
 * 270 total variations: arch-L3 (90), algo-L3 (90), hum-L3 (90), conv-L3 (45)
 */
async function convertL3(
  docsRoot: string,
  outputRoot: string,
  manifest: Manifest,
  logger: Logger,
  options: ValidationOptions,
  dryRun?: boolean,
  parallel?: number,
): Promise<void> {
  logger.info('L3_START', 'Converting Layer 3...');

  const sectionTypes = [
    { dir: 'arch-L3-production', prefix: 'arch-L3', name: 'archaeologist' },
    { dir: 'algo-L3-production', prefix: 'algo-L3', name: 'algorithm' },
    { dir: 'hum-L3-production', prefix: 'hum-L3', name: 'last-human' },
    { dir: 'conv-L3-production', prefix: 'conv-L3', name: 'convergent-synthesis' },
  ];

  const allIds: string[] = [];
  const variationsBySelectionKey = new Map<string, VariationText[]>();

  for (const section of sectionTypes) {
    const sourceDir = join(docsRoot, 'L3', section.dir);

    // Discover all markdown files (sorted for determinism)
    // Only include variation files (exclude protocol/notes)
    const namePattern =
      section.prefix === 'conv-L3' ? /^conv-L3-\d+\.md$/ : /^(arch|algo|hum)-L3-\d+\.md$/;
    const files = (await discoverMarkdownFiles(sourceDir, /\.md$/, logger))
      .filter((p) => namePattern.test(p.split(/[/\\]/).pop() || ''))
      .sort();
    logger.info('L3_DISCOVERED', `Found ${files.length} files for ${section.prefix}`);
    type L3ProcessResult = {
      id?: string;
      selectionKey?: string;
      outputJson?: string;
      body?: string;
      file?: string;
      sourceHash?: string;
      sectionType?: string;
    };

    const results = await processBatchConcurrent<string, L3ProcessResult>(
      files,
      async (file) => {
        const content = await readFileWithLogging(file, logger);
        if (!content) {
          return {};
        }
        const { text: normalized } = normalizeText(content, logger, file);
        const parsed = parseFrontmatter(normalized, logger, file);
        if (!parsed) {
          return {};
        }

        const { frontmatter, content: body } = parsed;

        // Normalize common issues before validation
        if ('id' in frontmatter && !('variationId' in frontmatter)) {
          frontmatter.variationId = frontmatter.id;
        }

        if (typeof frontmatter.variationId === 'string') {
          // Ensure 3-digit padding
          frontmatter.variationId = frontmatter.variationId.replace(
            /^(arch|algo|hum|conv)-L3-(\d{1,2})$/,
            (_m, p1, p2) => `${p1}-L3-${p2.padStart(3, '0')}`,
          );
        }

        if (
          typeof frontmatter.philosophyDominant === 'string' &&
          frontmatter.philosophyDominant.toLowerCase() === 'investigate'
        ) {
          frontmatter.philosophyDominant = 'invest';
        }

        // Ensure conv-L3 has characterVoices
        if (
          typeof frontmatter.variationId === 'string' &&
          /^conv-L3-/.test(frontmatter.variationId)
        ) {
          if (
            !Array.isArray((frontmatter as any).characterVoices) ||
            (frontmatter as any).characterVoices.length < 2
          ) {
            (frontmatter as any).characterVoices = ['archaeologist', 'algorithm', 'last-human'];
          }
        }

        if (!validateL3Frontmatter(frontmatter, logger, file)) {
          return {};
        }

        const rawVariationId = frontmatter.variationId as string;
        const journeyPattern = frontmatter.journeyPattern as string;
        const philosophyDominant = frontmatter.philosophyDominant as string;
        const awarenessLevel = frontmatter.awarenessLevel as string;
        const wordCount = frontmatter.wordCount as number;

        const parsed_id = parseVariationId(rawVariationId, 3);
        if (!parsed_id || !('sectionType' in parsed_id)) {
          logger.error('INVALID_VARIATION_ID', `Cannot parse variationId: ${rawVariationId}`, {
            file,
            field: 'variationId',
            value: rawVariationId,
          });
          return {};
        }

        const sectionType = parsed_id.sectionType;
        const number = parsed_id.number;
        const variationId = generateL3Id(sectionType, number);

        const actualWordCount = countWords(body);
        validateWordCount(actualWordCount, wordCount, variationId, logger, options);

        const selectionKey = `${journeyPattern}-${philosophyDominant}-${awarenessLevel}`;
        const output: L3Output = {
          schemaVersion: SCHEMA_VERSION,
          id: variationId,
          sectionType,
          journeyPattern,
          philosophyDominant,
          awarenessLevel,
          content: body,
          metadata: { wordCount: actualWordCount, ...frontmatter },
        };

        validateSchemaVersion(output as unknown as Record<string, unknown>, logger, variationId);

        const json = JSON.stringify(output, null, 2);
        const sourceHash = hashContent(parsed.raw, body);
        return {
          id: variationId,
          selectionKey,
          outputJson: json,
          body,
          file,
          sourceHash,
          sectionType,
        };
      },
      parallel ?? 4,
    );

    for (const r of results) {
      if (!r.id || !r.outputJson || !r.file || !r.selectionKey || !r.sectionType || !r.sourceHash) {
        continue;
      }
      const variationId = r.id;
      const selectionKey = r.selectionKey;
      allIds.push(variationId);
      if (!variationsBySelectionKey.has(selectionKey)) {
        variationsBySelectionKey.set(selectionKey, []);
      }
      variationsBySelectionKey.get(selectionKey)!.push({
        id: variationId,
        content: r.body ?? r.outputJson,
        groupKey: `${r.sectionType}-${selectionKey}`,
      });

      if (!dryRun) {
        const outputDir = join(outputRoot, 'layer3', 'variations');
        await ensureDir(outputDir);
        const outputPath = join(outputDir, `${variationId}.json`);
        await writeFileAtomic(outputPath, r.outputJson, logger);
      }

      manifest.files[r.file] = {
        sourceHash: r.sourceHash,
        outputPath: `layer3/variations/${variationId}.json`,
        convertedAt: new Date().toISOString(),
      };
      manifest.counts.l3Variations++;
    }
  }

  // Check for duplicate IDs
  checkDuplicateIds(allIds, logger, 'L3');

  // Detect similar variations within same selection key
  for (const [_key, variations] of variationsBySelectionKey.entries()) {
    if (variations.length > 1) {
      detectSimilarVariations(variations, logger);
    }
  }

  manifest.counts.totalVariations += manifest.counts.l3Variations;
  logger.info(
    'L3_COMPLETE',
    `Layer 3 conversion complete: ${manifest.counts.l3Variations} variations`,
  );
}

/**
 * Convert L4 layer (3 terminal files)
 */
async function convertL4(
  docsRoot: string,
  outputRoot: string,
  manifest: Manifest,
  logger: Logger,
  options: ValidationOptions,
  dryRun?: boolean,
  _parallel?: number, // Reserved for future use (L4 has only 3 files)
): Promise<void> {
  logger.info('L4_START', 'Converting Layer 4...');

  const philosophies = ['preserve', 'release', 'transform'];
  const l4Dir = join(docsRoot, 'L4');

  for (const philosophy of philosophies) {
    const fileName = `L4-${philosophy.toUpperCase()}.md`;
    const filePath = join(l4Dir, fileName);

    // Read file
    const content = await readFileWithLogging(filePath, logger);
    if (!content) {
      logger.error('L4_FILE_NOT_FOUND', `L4 file not found: ${fileName}`, {
        file: filePath,
        exampleFix: `Create ${fileName} in docs/L4/`,
      });
      continue;
    }

    // Normalize
    const { text: normalized } = normalizeText(content, logger, filePath);

    // Parse frontmatter (tolerant). If unavailable, salvage from filename and strip malformed header.
    const parsed = parseFrontmatter(normalized, logger, filePath);
    let frontmatter: any;
    let body: string;
    if (!parsed) {
      const m = fileName.match(/^L4-(PRESERVE|RELEASE|TRANSFORM)\.md$/i);
      const philosophy = m ? m[1].toLowerCase() : philosophy;
      frontmatter = { id: `final-${philosophy}`, philosophy, wordCount: 0 };
      // Strip malformed frontmatter if file starts with '---'
      if (/^---/.test(normalized)) {
        const lines = normalized.split(/\r?\n/);
        // remove from start until first blank line after the leading fence block
        let i = 1;
        for (; i < lines.length; i++) {
          if (lines[i].trim() === '') {
            i++;
            break;
          }
        }
        body = lines.slice(i).join('\n');
      } else {
        body = normalized;
      }
    } else {
      frontmatter = parsed.frontmatter;
      body = parsed.content;
    }

    // Normalize field names: variationId -> id if needed
    if ('variationId' in frontmatter && !('id' in frontmatter)) {
      frontmatter.id = frontmatter.variationId;
    }

    // Ensure philosophy field exists
    if (!('philosophy' in frontmatter)) {
      frontmatter.philosophy = philosophy;
    }

    // Validate frontmatter
    if (!validateL4Frontmatter(frontmatter, logger, filePath)) {
      continue;
    }

    // Extract fields
    const id = frontmatter.id as string;
    const wordCount = frontmatter.wordCount as number | undefined;

    // Validate word count if provided
    if (wordCount) {
      const actualWordCount = countWords(body);
      validateWordCount(actualWordCount, wordCount, id, logger, options);
    }

    // Create output
    const output: L4Output = {
      schemaVersion: SCHEMA_VERSION,
      id,
      philosophy,
      content: body,
      metadata: {
        wordCount: countWords(body),
        ...frontmatter,
      },
    };

    // Validate schema version
    validateSchemaVersion(output as unknown as Record<string, unknown>, logger, id);

    // Write output
    if (!dryRun) {
      const outputDir = join(outputRoot, 'layer4');
      await ensureDir(outputDir);
      const outputPath = join(outputDir, `${id}.json`);
      const json = JSON.stringify(output, null, 2);
      await writeFileAtomic(outputPath, json, logger);
      logger.info('L4_WRITTEN', `Wrote ${outputPath}`);
    }

    // Track in manifest
    const sourceHash = hashContent(parsed.raw, body);
    manifest.files[filePath] = {
      sourceHash,
      outputPath: `layer4/${id}.json`,
      convertedAt: new Date().toISOString(),
    };

    manifest.counts.l4Variations++;
  }

  manifest.counts.totalVariations += manifest.counts.l4Variations;
  logger.info(
    'L4_COMPLETE',
    `Layer 4 conversion complete: ${manifest.counts.l4Variations} variations`,
  );
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
