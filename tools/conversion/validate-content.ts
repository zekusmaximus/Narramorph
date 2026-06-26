#!/usr/bin/env node
/**
 * Content validation CLI
 * Validates JSON output files with severity-based reporting
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { writeFileAtomic } from './lib/fs.js';
import { Logger, type LogEntry } from './lib/log.js';

interface CliArgs {
  strict?: boolean;
  report?: string;
  'max-warnings-per-type'?: string;
  verbose?: boolean;
}

interface ValidationReport {
  timestamp: string;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  entries: LogEntry[];
  summary: {
    blockers: number;
    errors: number;
    warnings: number;
    info: number;
  };
  warningsByType: Record<string, number>;
}

async function main() {
  const { values } = parseArgs({
    options: {
      strict: { type: 'boolean', short: 's' },
      report: { type: 'string', short: 'r' },
      'max-warnings-per-type': { type: 'string' },
      verbose: { type: 'boolean', short: 'v' },
    },
  }) as { values: CliArgs };

  const logger = new Logger(values.verbose);
  const maxWarningsPerType = values['max-warnings-per-type']
    ? parseInt(values['max-warnings-per-type'], 10)
    : 50;

  const projectRoot = process.cwd() + '/../..';
  const contentRoot = join(projectRoot, 'src/data/stories/eternal-return/content');

  logger.info('VALIDATION_START', `Validating content in ${contentRoot}`);

  let totalFiles = 0;
  let validFiles = 0;

  // Validate L1 layer
  const l1Dir = join(contentRoot, 'layer1');
  await validateLayer(l1Dir, logger, 'L1', (file, filePath) => {
    totalFiles++;
    const isValid = validateL1L2File(file, filePath, logger);
    if (isValid) {
      validFiles++;
    }
    return isValid;
  });

  // Validate L2 layer
  const l2Dir = join(contentRoot, 'layer2');
  await validateLayer(l2Dir, logger, 'L2', (file, filePath) => {
    totalFiles++;
    const isValid = validateL1L2File(file, filePath, logger);
    if (isValid) {
      validFiles++;
    }
    return isValid;
  });

  // Validate L3 layer
  const l3Dir = join(contentRoot, 'layer3/variations');
  await validateLayer(l3Dir, logger, 'L3', (file, filePath) => {
    totalFiles++;
    const isValid = validateL3File(file, filePath, logger);
    if (isValid) {
      validFiles++;
    }
    return isValid;
  });

  // Validate the runtime selection matrix
  const matrixPath = join(contentRoot, 'selection-matrix.json');
  try {
    const matrixValid = await validateSelectionMatrix(matrixPath, logger);
    totalFiles++;
    if (matrixValid) {
      validFiles++;
    }
  } catch {
    // Matrix file doesn't exist yet
  }

  // Validate L4 layer
  const l4Dir = join(contentRoot, 'layer4');
  await validateLayer(l4Dir, logger, 'L4', (file, filePath) => {
    totalFiles++;
    const isValid = validateL4File(file, filePath, logger);
    if (isValid) {
      validFiles++;
    }
    return isValid;
  });

  // Validate manifest
  const manifestPath = join(contentRoot, 'manifest.json');
  try {
    const manifestValid = await validateManifest(manifestPath, logger);
    totalFiles++;
    if (manifestValid) {
      validFiles++;
    }
  } catch {
    // Manifest doesn't exist yet
  }

  // Generate report
  const entries = logger.getEntries();
  const counts = logger.getCounts();

  // Cap warnings per type
  const warningsByType: Record<string, number> = {};
  const cappedEntries: LogEntry[] = [];
  const warningTypeCounts: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.severity === 'WARNING') {
      const count = (warningTypeCounts[entry.code] || 0) + 1;
      warningTypeCounts[entry.code] = count;

      if (count <= maxWarningsPerType) {
        cappedEntries.push(entry);
      }
    } else {
      cappedEntries.push(entry);
    }
    warningsByType[entry.code] = (warningsByType[entry.code] || 0) + 1;
  }

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalFiles,
    validFiles,
    invalidFiles: totalFiles - validFiles,
    entries: cappedEntries,
    summary: {
      blockers: counts.BLOCKER,
      errors: counts.ERROR,
      warnings: counts.WARNING,
      info: counts.INFO,
    },
    warningsByType,
  };

  // Write report (default to reports/validation.json, override with --report)
  const reportPath = values.report
    ? values.report.endsWith('.json')
      ? values.report
      : join('reports', values.report)
    : join('reports', 'validation.json');

  const json = JSON.stringify(report, null, 2);
  await writeFileAtomic(reportPath, json, logger);
  logger.info('REPORT_WRITTEN', `Validation report written to ${reportPath}`);

  // Print summary
  console.log('\n=== Validation Summary ===');
  console.log(`Files validated: ${totalFiles}`);
  console.log(`Valid files: ${validFiles}`);
  console.log(`Invalid files: ${report.invalidFiles}`);
  console.log(`\n${logger.summary()}`);

  if (Object.keys(warningsByType).length > 0) {
    console.log('\nWarnings by type:');
    for (const [code, count] of Object.entries(warningsByType).sort((a, b) => b[1] - a[1])) {
      const capped = count > maxWarningsPerType ? ` (showing ${maxWarningsPerType})` : '';
      console.log(`  ${code}: ${count}${capped}`);
    }
  }

  // Exit codes
  if (logger.hasBlockers()) {
    console.error('\n❌ Validation failed due to blockers');
    process.exit(1);
  }

  if (values.strict && logger.hasErrors()) {
    console.error('\n❌ Validation failed in strict mode due to errors');
    process.exit(1);
  }

  if (logger.hasWarnings()) {
    console.log('\n⚠️  Validation completed with warnings');
  } else {
    console.log('\n✅ Validation passed');
  }
}

async function validateLayer(
  dirPath: string,
  logger: Logger,
  layerName: string,
  validator: (content: string, filePath: string) => boolean,
): Promise<void> {
  try {
    const files = await readdir(dirPath);
    logger.info(
      `${layerName}_VALIDATE_START`,
      `Validating ${layerName} layer: ${files.length} files`,
    );

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }
      const filePath = join(dirPath, file);
      const content = await readFile(filePath, 'utf-8');
      validator(content, filePath);
    }
  } catch (error) {
    // Directory doesn't exist - not an error if content hasn't been generated yet
    logger.info(`${layerName}_SKIP`, `${layerName} layer not found, skipping`);
  }
}

function validateL1L2File(jsonContent: string, filePath: string, logger: Logger): boolean {
  try {
    const data = JSON.parse(jsonContent);
    let isValid = true;

    if (!data.schemaVersion) {
      logger.blocker('MISSING_SCHEMA_VERSION', `${filePath}: missing schemaVersion field`);
      return false;
    }

    if (!data.nodeId || typeof data.nodeId !== 'string') {
      logger.blocker('MISSING_NODE_ID', `${filePath}: missing or invalid nodeId field`);
      return false;
    }

    if (!Array.isArray(data.variations)) {
      logger.blocker('INVALID_VARIATIONS', `${filePath}: variations field must be an array`);
      return false;
    }

    if (data.totalVariations !== data.variations.length) {
      logger.error(
        'COUNT_MISMATCH',
        `${filePath}: declares ${data.totalVariations} variations but contains ${data.variations.length}`,
      );
      isValid = false;
    }

    for (const variation of data.variations) {
      if (!variation.id || typeof variation.id !== 'string') {
        logger.blocker('MISSING_VARIATION_ID', `${filePath}: variation missing id field`);
        return false;
      }

      if (!variation.transformationState) {
        logger.blocker(
          'MISSING_TRANSFORMATION_STATE',
          `${filePath}: variation ${variation.id} missing transformationState`,
        );
        return false;
      }

      if (!variation.content || typeof variation.content !== 'string') {
        logger.blocker('MISSING_CONTENT', `${filePath}: variation ${variation.id} missing content`);
        return false;
      }
    }

    return isValid;
  } catch (error) {
    logger.blocker('JSON_PARSE_ERROR', `${filePath}: failed to parse JSON: ${error}`);
    return false;
  }
}

function validateL3File(jsonContent: string, filePath: string, logger: Logger): boolean {
  try {
    const data = JSON.parse(jsonContent);

    if (!data.schemaVersion) {
      logger.blocker('MISSING_SCHEMA_VERSION', `${filePath}: L3 file missing schemaVersion`);
      return false;
    }

    if (!data.id) {
      logger.blocker('MISSING_ID', `${filePath}: L3 file missing id field`);
      return false;
    }

    if (!data.sectionType) {
      logger.blocker('MISSING_SECTION_TYPE', `${filePath}: L3 file missing sectionType`);
      return false;
    }

    if (!data.content) {
      logger.blocker('MISSING_CONTENT', `${filePath}: L3 file missing content`);
      return false;
    }

    // Validate conv-L3 has characterVoices
    if (data.sectionType === 'conv-L3') {
      if (!data.metadata?.characterVoices || !Array.isArray(data.metadata.characterVoices)) {
        logger.blocker(
          'MISSING_CHARACTER_VOICES',
          `${filePath}: conv-L3 missing characterVoices array`,
        );
        return false;
      }
      if (data.metadata.characterVoices.length < 2) {
        logger.blocker(
          'INVALID_CHARACTER_VOICES',
          `${filePath}: conv-L3 characterVoices must have ≥2 voices`,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.blocker('JSON_PARSE_ERROR', `${filePath}: failed to parse L3 JSON: ${error}`);
    return false;
  }
}

function validateL4File(jsonContent: string, filePath: string, logger: Logger): boolean {
  try {
    const data = JSON.parse(jsonContent);
    const entries = Array.isArray(data) ? data : [data];
    if (entries.length === 0) {
      logger.blocker('EMPTY_L4_FILE', `${filePath}: L4 file is empty`);
      return false;
    }
    return entries.every((entry, index) => validateL4Entry(entry, `${filePath}[${index}]`, logger));
  } catch (error) {
    logger.blocker('JSON_PARSE_ERROR', `${filePath}: failed to parse L4 JSON: ${error}`);
    return false;
  }
}

function validateL4Entry(data: unknown, source: string, logger: Logger): boolean {
  if (!data || typeof data !== 'object') {
    logger.blocker('INVALID_L4_ENTRY', `${source}: L4 entry must be an object`);
    return false;
  }
  const entry = data as Record<string, unknown>;
  if (!entry.schemaVersion) {
    logger.blocker('MISSING_SCHEMA_VERSION', `${source}: missing schemaVersion`);
    return false;
  }
  if (typeof entry.id !== 'string' || !entry.id.startsWith('final-')) {
    logger.blocker('INVALID_L4_ID', `${source}: id must start with "final-"`);
    return false;
  }
  if (!entry.philosophy) {
    logger.blocker('MISSING_PHILOSOPHY', `${source}: missing philosophy`);
    return false;
  }
  if (!entry.content) {
    logger.blocker('MISSING_CONTENT', `${source}: missing content`);
    return false;
  }
  return true;
}

async function validateSelectionMatrix(matrixPath: string, logger: Logger): Promise<boolean> {
  try {
    const content = await readFile(matrixPath, 'utf-8');
    const matrix = JSON.parse(content);

    if (!Array.isArray(matrix) || matrix.length === 0) {
      logger.blocker('INVALID_SELECTION_MATRIX', `${matrixPath}: expected a non-empty array`);
      return false;
    }

    for (const [index, entry] of matrix.entries()) {
      if (
        !entry ||
        typeof entry.fromNode !== 'string' ||
        typeof entry.toNode !== 'string' ||
        typeof entry.metadata?.variationId !== 'string'
      ) {
        logger.blocker(
          'INVALID_SELECTION_MATRIX_ENTRY',
          `${matrixPath}[${index}]: missing fromNode, toNode, or metadata.variationId`,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('MATRIX_READ_ERROR', `Failed to read matrix: ${error}`);
    return false;
  }
}

async function validateManifest(manifestPath: string, logger: Logger): Promise<boolean> {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    if (!manifest.schemaVersion) {
      logger.blocker('MISSING_SCHEMA_VERSION', 'Manifest missing schemaVersion');
      return false;
    }

    if (!manifest.generatorVersion) {
      logger.warning('MISSING_GENERATOR_VERSION', 'Manifest missing generatorVersion');
    }

    if (!manifest.files || typeof manifest.files !== 'object') {
      logger.blocker('MISSING_FILES', 'Manifest missing files object');
      return false;
    }

    return !logger.hasBlockers();
  } catch (error) {
    logger.error('MANIFEST_READ_ERROR', `Failed to read manifest: ${error}`);
    return false;
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
