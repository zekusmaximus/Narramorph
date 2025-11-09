#!/usr/bin/env node
/**
 * Main conversion CLI: Markdown → JSON
 * Converts L1/L2/L3/L4 markdown files to JSON format
 */

import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
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
  validateWordCount,
  validateVariationCount,
  checkDuplicateIds,
  validateSchemaVersion,
  type ValidationOptions
} from './lib/validate.js';
import { generateAggregatedId } from './lib/ids.js';
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

// L3 and L4 outputs defined for Week 3/4

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
 * Convert L3 layer (placeholder for Week 3)
 */
async function convertL3(
  _docsRoot: string,
  _outputRoot: string,
  _manifest: Manifest,
  logger: Logger,
  _options: ValidationOptions,
  _dryRun?: boolean
): Promise<void> {
  logger.info('L3_TODO', 'L3 conversion not yet implemented (Week 3)');
}

/**
 * Convert L4 layer (placeholder for Week 4)
 */
async function convertL4(
  _docsRoot: string,
  _outputRoot: string,
  _manifest: Manifest,
  logger: Logger,
  _options: ValidationOptions,
  _dryRun?: boolean
): Promise<void> {
  logger.info('L4_TODO', 'L4 conversion not yet implemented (Week 4)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
