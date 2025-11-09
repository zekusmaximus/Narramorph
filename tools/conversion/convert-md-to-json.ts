#!/usr/bin/env node
/**
 * Main conversion CLI: Markdown → JSON
 * Converts L1/L2/L3/L4 markdown files to JSON format
 */

import { resolve, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { watch } from 'node:fs';
import { Logger } from './lib/log.js';
import { normalizeText } from './lib/normalize.js';
import { parseFrontmatter, countWords } from './lib/frontmatter.js';
import {
  readFileWithLogging,
  writeFileAtomic,
  discoverMarkdownFiles,
  hashContent,
  writeManifest,
  ensureDir,
  type Manifest
} from './lib/fs.js';
import {
  validateL1L2Frontmatter,
  validateL3Frontmatter,
  validateL4Frontmatter,
  validateWordCount,
  validateVariationCount,
  checkDuplicateIds,
  validateSchemaVersion,
  type ValidationOptions
} from './lib/validate.js';
import { generateAggregatedId, generateL3Id, parseVariationId } from './lib/ids.js';
import { detectSimilarVariations, type VariationText } from './lib/similarity.js';

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

  logger.info('CONVERSION_START', `Starting conversion (strict=${options.strict})`);

  const layers = values.layer === 'all' ? ['1', '2', '3', '4'] : [values.layer || '1'];

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
      await convertL1(docsRoot, outputRoot, manifest, logger, options, values['dry-run']);
    } else if (layer === '2') {
      await convertL2(docsRoot, outputRoot, manifest, logger, options, values['dry-run']);
    } else if (layer === '3') {
      await convertL3(docsRoot, outputRoot, manifest, logger, options, values['dry-run']);
    } else if (layer === '4') {
      await convertL4(docsRoot, outputRoot, manifest, logger, options, values['dry-run']);
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
    const debounce = parseInt(values.debounce || '500', 10);
    console.log(`\n👀 Watching ${docsRoot} for changes (debounce=${debounce}ms)...`);
    console.log('Press Ctrl+C to stop\n');

    await startWatchMode(docsRoot, outputRoot, layers, options, debounce);
  }
}

/**
 * Watch mode: Re-convert files on change
 */
async function startWatchMode(
  docsRoot: string,
  outputRoot: string,
  layers: string[],
  options: ValidationOptions,
  debounceMs: number
): Promise<void> {
  const pendingChanges = new Set<string>();
  let debounceTimer: NodeJS.Timeout | null = null;

  const watcher = watch(docsRoot, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) return;

    const fullPath = join(docsRoot, filename);
    pendingChanges.add(fullPath);

    // Debounce: reset timer on each change
    if (debounceTimer) clearTimeout(debounceTimer);

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
            await convertL1(docsRoot, outputRoot, manifest, logger, watchOptions);
          } else if (layer === '2') {
            await convertL2(docsRoot, outputRoot, manifest, logger, watchOptions);
          } else if (layer === '3') {
            await convertL3(docsRoot, outputRoot, manifest, logger, watchOptions);
          } else if (layer === '4') {
            await convertL4(docsRoot, outputRoot, manifest, logger, watchOptions);
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
  if (relativePath.includes('-L1-production')) return '1';
  if (relativePath.includes('-L2-') && relativePath.includes('-production')) return '2';
  if (relativePath.includes('/L3/')) return '3';
  if (relativePath.includes('/L4/')) return '4';
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
  dryRun?: boolean
): Promise<void> {
  logger.info('L1_START', 'Converting Layer 1...');

  const characters = ['arch', 'algo', 'hum'];

  for (const char of characters) {
    const nodeId = `${char}-L1`;
    const sourceDir = join(docsRoot, `${char}-L1-production`);

    // Discover all markdown files
    const files = await discoverMarkdownFiles(sourceDir, /\.md$/, logger);
    logger.info('L1_DISCOVERED', `Found ${files.length} files for ${nodeId}`);

    const variations: L1L2Variation[] = [];
    const variationTexts: VariationText[] = [];
    const ids: string[] = [];

    // Process each file
    for (const file of files) {
      const content = await readFileWithLogging(file, logger);
      if (!content) continue;

      // Normalize
      const { text: normalized } = normalizeText(content, logger, file);

      // Parse frontmatter
      const parsed = parseFrontmatter(normalized, logger, file);
      if (!parsed) continue;

      const { frontmatter, content: body } = parsed;

      // Validate frontmatter
      if (!validateL1L2Frontmatter(frontmatter, 1, logger, file)) continue;

      // Extract fields
      const variationId = frontmatter.variation_id as string;
      const variationType = frontmatter.variation_type as string;
      const wordCount = frontmatter.word_count as number;

      // Map variation_type to transformationState
      let transformationState: string;
      if (variationType === 'initial') {
        transformationState = 'initial';
      } else if (variationType === 'firstRevisit') {
        transformationState = 'firstRevisit';
      } else if (variationType === 'metaAware') {
        transformationState = 'metaAware';
      } else {
        transformationState = variationType;
      }

      // Parse awareness range from conditions if present
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

      // Validate word count
      const actualWordCount = countWords(body);
      validateWordCount(actualWordCount, wordCount, 10, 1, logger, file);

      // Create variation object
      const variation: L1L2Variation = {
        id: variationId,
        transformationState,
        awarenessRange,
        content: body,
        metadata: {
          wordCount: actualWordCount,
          ...frontmatter,
        },
      };

      variations.push(variation);
      ids.push(variationId);

      // For similarity detection
      variationTexts.push({
        id: variationId,
        content: body,
        groupKey: `${nodeId}-${transformationState}`,
      });

      // Track in manifest
      const sourceHash = hashContent(parsed.raw, body);
      manifest.files[file] = {
        sourceHash,
        outputPath: `layer1/${nodeId}-variations.json`,
        convertedAt: new Date().toISOString(),
      };
    }

    // Sort variations by ID for deterministic output
    variations.sort((a, b) => a.id.localeCompare(b.id));

    // Re-index with zero-padded IDs
    const reindexedVariations = variations.map((v, index) => ({
      ...v,
      id: generateAggregatedId(char as any, 1, index + 1),
    }));

    // Check for duplicates
    checkDuplicateIds(reindexedVariations.map(v => v.id), logger, nodeId);

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
  logger.info('L1_COMPLETE', `Layer 1 conversion complete: ${manifest.counts.l1Variations} variations`);
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
  dryRun?: boolean
): Promise<void> {
  logger.info('L2_START', 'Converting Layer 2...');

  const characters = ['arch', 'algo', 'hum'];
  const paths: Array<'accept' | 'resist' | 'invest'> = ['accept', 'resist', 'invest'];

  for (const char of characters) {
    for (const path of paths) {
      const nodeId = `${char}-L2-${path}`;
      const sourceDir = join(docsRoot, `${char}-L2-${path}-production`);

      // Discover all markdown files
      const files = await discoverMarkdownFiles(sourceDir, /\.md$/, logger);
      logger.info('L2_DISCOVERED', `Found ${files.length} files for ${nodeId}`);

      const variations: L1L2Variation[] = [];
      const variationTexts: VariationText[] = [];
      const ids: string[] = [];

      // Process each file
      for (const file of files) {
        const content = await readFileWithLogging(file, logger);
        if (!content) continue;

        // Normalize
        const { text: normalized } = normalizeText(content, logger, file);

        // Parse frontmatter
        const parsed = parseFrontmatter(normalized, logger, file);
        if (!parsed) continue;

        const { frontmatter, content: body } = parsed;

        // Validate frontmatter
        if (!validateL1L2Frontmatter(frontmatter, 2, logger, file)) continue;

        // Extract fields
        const variationId = frontmatter.variation_id as string;
        const variationType = frontmatter.variation_type as string;
        const wordCount = frontmatter.word_count as number;

        // Map variation_type to transformationState
        let transformationState: string;
        if (variationType === 'initial') {
          transformationState = 'initial';
        } else if (variationType === 'firstRevisit') {
          transformationState = 'firstRevisit';
        } else if (variationType === 'metaAware') {
          transformationState = 'metaAware';
        } else {
          transformationState = variationType;
        }

        // Parse awareness range from conditions if present
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

        // Validate word count
        const actualWordCount = countWords(body);
        validateWordCount(actualWordCount, wordCount, 10, 2, logger, file);

        // Create variation object
        const variation: L1L2Variation = {
          id: variationId,
          transformationState,
          awarenessRange,
          content: body,
          metadata: {
            wordCount: actualWordCount,
            pathPhilosophy: path,
            ...frontmatter,
          },
        };

        variations.push(variation);
        ids.push(variationId);

        // For similarity detection
        variationTexts.push({
          id: variationId,
          content: body,
          groupKey: `${nodeId}-${transformationState}`,
        });

        // Track in manifest
        const sourceHash = hashContent(parsed.raw, body);
        manifest.files[file] = {
          sourceHash,
          outputPath: `layer2/${nodeId}-variations.json`,
          convertedAt: new Date().toISOString(),
        };
      }

      // Sort variations by ID for deterministic output
      variations.sort((a, b) => a.id.localeCompare(b.id));

      // Re-index with zero-padded IDs
      const reindexedVariations = variations.map((v, index) => ({
        ...v,
        id: generateAggregatedId(char as any, 2, index + 1, path),
      }));

      // Check for duplicates
      checkDuplicateIds(reindexedVariations.map(v => v.id), logger, nodeId);

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
  logger.info('L2_COMPLETE', `Layer 2 conversion complete: ${manifest.counts.l2Variations} variations`);
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
  dryRun?: boolean
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

    // Discover all markdown files
    const files = await discoverMarkdownFiles(sourceDir, /\.md$/, logger);
    logger.info('L3_DISCOVERED', `Found ${files.length} files for ${section.prefix}`);

    for (const file of files) {
      const content = await readFileWithLogging(file, logger);
      if (!content) continue;

      // Normalize
      const { text: normalized } = normalizeText(content, logger, file);

      // Parse frontmatter
      const parsed = parseFrontmatter(normalized, logger, file);
      if (!parsed) continue;

      const { frontmatter, content: body } = parsed;

      // Validate frontmatter
      if (!validateL3Frontmatter(frontmatter, logger, file)) continue;

      // Extract fields
      const rawVariationId = frontmatter.variationId as string;
      const journeyPattern = frontmatter.journeyPattern as string;
      const philosophyDominant = frontmatter.philosophyDominant as string;
      const awarenessLevel = frontmatter.awarenessLevel as string;
      const wordCount = frontmatter.wordCount as number;

      // Parse and normalize variationId (ensure zero-padding)
      const parsed_id = parseVariationId(rawVariationId, 3);
      if (!parsed_id) {
        logger.error('INVALID_VARIATION_ID', `Cannot parse variationId: ${rawVariationId}`, {
          file,
          field: 'variationId',
          value: rawVariationId,
        });
        continue;
      }

      // Generate properly zero-padded ID
      const sectionType = parsed_id.sectionType;
      const number = parsed_id.number;
      const variationId = generateL3Id(sectionType, number);

      // Track all IDs
      allIds.push(variationId);

      // Validate word count
      const actualWordCount = countWords(body);
      validateWordCount(actualWordCount, wordCount, variationId, logger, options);

      // Group by selection key for similarity detection
      const selectionKey = `${journeyPattern}-${philosophyDominant}-${awarenessLevel}`;
      if (!variationsBySelectionKey.has(selectionKey)) {
        variationsBySelectionKey.set(selectionKey, []);
      }
      variationsBySelectionKey.get(selectionKey)!.push({
        id: variationId,
        content: body,
        groupKey: `${sectionType}-${selectionKey}`,
      });

      // Create output
      const output: L3Output = {
        schemaVersion: SCHEMA_VERSION,
        id: variationId,
        sectionType,
        journeyPattern,
        philosophyDominant,
        awarenessLevel,
        content: body,
        metadata: {
          wordCount: actualWordCount,
          ...frontmatter,
        },
      };

      // Validate schema version
      validateSchemaVersion(output as unknown as Record<string, unknown>, logger, variationId);

      // Write output
      if (!dryRun) {
        const outputDir = join(outputRoot, 'layer3');
        await ensureDir(outputDir);
        const outputPath = join(outputDir, `${variationId}.json`);
        const json = JSON.stringify(output, null, 2);
        await writeFileAtomic(outputPath, json, logger);
      }

      // Track in manifest
      const sourceHash = hashContent(parsed.raw, body);
      manifest.files[file] = {
        sourceHash,
        outputPath: `layer3/${variationId}.json`,
        convertedAt: new Date().toISOString(),
      };

      manifest.counts.l3Variations++;
    }
  }

  // Check for duplicate IDs
  checkDuplicateIds(allIds, logger, 'L3');

  // Detect similar variations within same selection key
  for (const [key, variations] of variationsBySelectionKey.entries()) {
    if (variations.length > 1) {
      detectSimilarVariations(variations, logger);
    }
  }

  manifest.counts.totalVariations += manifest.counts.l3Variations;
  logger.info('L3_COMPLETE', `Layer 3 conversion complete: ${manifest.counts.l3Variations} variations`);
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
  dryRun?: boolean
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

    // Parse frontmatter
    const parsed = parseFrontmatter(normalized, logger, filePath);
    if (!parsed) continue;

    const { frontmatter, content: body } = parsed;

    // Normalize field names: variationId -> id if needed
    if ('variationId' in frontmatter && !('id' in frontmatter)) {
      frontmatter.id = frontmatter.variationId;
    }

    // Ensure philosophy field exists
    if (!('philosophy' in frontmatter)) {
      frontmatter.philosophy = philosophy;
    }

    // Validate frontmatter
    if (!validateL4Frontmatter(frontmatter, logger, filePath)) continue;

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
  logger.info('L4_COMPLETE', `Layer 4 conversion complete: ${manifest.counts.l4Variations} variations`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
