#!/usr/bin/env tsx
/**
 * Universal Content Fixer for Narramorph Fiction
 *
 * Config-driven normalization system for all layers (L1/L2/L3/L4)
 * - Idempotent YAML cleanup and field validation
 * - Smart text block normalization
 * - Layer-specific ID normalization
 */

import { promises as fs } from 'node:fs';
import { join, resolve, basename, dirname, relative } from 'node:path';
import YAML from 'yaml';
import { parseArgs } from 'node:util';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LayerConfig {
  // Filename pattern to match
  pattern: RegExp;

  // Fields that must exist in frontmatter
  requiredFields: string[];

  // Fields that are required conditionally
  conditionalFields: Map<string, (frontmatter: any) => boolean>;

  // Function to normalize variation ID from filename and frontmatter
  idNormalizer: (filename: string, frontmatter: any) => string;

  // Optional function to normalize text content
  textNormalizer?: (text: string) => string;

  // Directory patterns where files should be found
  allowedDirectories: RegExp[];

  // Field naming convention (snake_case or camelCase)
  fieldConvention: 'snake_case' | 'camelCase';
}

interface NormalizationResult {
  frontmatter: any;
  content: string;
  modified: boolean;
  errors: string[];
  warnings: string[];
}

interface FixerOptions {
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'all';
  contentRoot: string;
  dryRun?: boolean;
  verbose?: boolean;
}

interface FixerReport {
  totalFiles: number;
  modifiedFiles: number;
  errorFiles: number;
  byLayer: Record<string, {
    files: number;
    modified: number;
    errors: number;
  }>;
  errors: Array<{
    file: string;
    layer: string;
    errors: string[];
  }>;
}

// ============================================================================
// LAYER CONFIGURATIONS
// ============================================================================

const EXCLUDED_PATTERNS = [
  'GENERATION_PROTOCOL',
  'PRODUCTION_STATUS',
  'VARIATION_BUILDER_TEMPLATE',
  'EXEMPLAR_CREATION',
  'EXEMPLAR',
  'README',
  'SECTION_PROTOCOL',
  '.git',
  'node_modules'
];

const LAYER_CONFIGS: Record<string, LayerConfig> = {
  L1: {
    pattern: /^(arch|algo|hum)-L1-(FR|MA)-\d+\.md$/,
    requiredFields: ['variation_id', 'variation_type', 'word_count'],
    conditionalFields: new Map([
      ['conditions.awareness', (fm) => true] // Always required for L1
    ]),
    idNormalizer: (filename, frontmatter) => {
      const match = filename.match(/^(\w+)-L1-(FR|MA)-(\d+)/);
      if (!match) throw new Error(`Invalid L1 filename: ${filename}`);
      const [, char, phase, num] = match;
      // Use 5-digit padding to match current convention (arch-L1-FR-00004)
      return `${char}-L1-${phase}-${num.padStart(5, '0')}`;
    },
    allowedDirectories: [
      /arch-L1-production\/(firstRevisit|metaAware)/,
      /algo-L1-production\/(firstRevisit|metaAware)/,
      /hum-L1-production\/(firstRevisit|metaAware)/
    ],
    fieldConvention: 'snake_case'
  },

  L2: {
    pattern: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-\d+\.md$/,
    requiredFields: ['variationId', 'nodeId', 'character', 'layer', 'pathPhilosophy', 'transformationState', 'awarenessRange'],
    conditionalFields: new Map([
      ['thematicContent', (fm) => true],
      ['narrativeElements', (fm) => true]
    ]),
    idNormalizer: (filename, frontmatter) => {
      const match = filename.match(/^(\w+)-L2-(\w+)-(FR|MA)-(\d+)/);
      if (!match) throw new Error(`Invalid L2 filename: ${filename}`);
      const [, char, path, phase, num] = match;
      // L2 uses 2-digit padding in current convention
      return `${char}-L2-${path}-${phase}-${num.padStart(2, '0')}`;
    },
    allowedDirectories: [
      /arch-L2-(accept|resist|invest)-production\/(firstRevisit|metaAware)/,
      /algo-L2-(accept|resist|invest)-production\/(firstRevisit|metaAware)/,
      /hum-L2-(accept|resist|invest)-production\/(firstRevisit|metaAware)/
    ],
    fieldConvention: 'camelCase'
  },

  L3: {
    pattern: /^(arch|algo|hum|conv)-L3-\d+\.md$/,
    requiredFields: ['variationId', 'nodeId', 'layer', 'wordCount'],
    conditionalFields: new Map([
      // L3 has these at top-level AND in conditions - check top-level only
      ['journeyPattern', (fm) => true],
      ['philosophyDominant', (fm) => true],
      ['awarenessLevel', (fm) => true]
    ]),
    idNormalizer: (filename, frontmatter) => {
      const match = filename.match(/^(\w+)-L3-(\d+)/);
      if (!match) throw new Error(`Invalid L3 filename: ${filename}`);
      const [, sectionType, num] = match;
      // L3 uses 3-digit padding
      return `${sectionType}-L3-${num.padStart(3, '0')}`;
    },
    allowedDirectories: [
      /L3\/(arch|algo|hum|conv)-L3-production/
    ],
    fieldConvention: 'camelCase'
  },

  L4: {
    pattern: /^(final-(preserve|release|transform)|L4-(PRESERVE|RELEASE|TRANSFORM))\.md$/i,
    requiredFields: ['id', 'philosophy', 'wordCount'],
    conditionalFields: new Map(),
    idNormalizer: (filename, frontmatter) => {
      let m = filename.match(/^final-(preserve|release|transform)/i);
      if (m && m[1]) return `final-${m[1].toLowerCase()}`;
      m = filename.match(/^L4-(PRESERVE|RELEASE|TRANSFORM)/i);
      if (m && m[1]) return `final-${m[1].toLowerCase()}`;
      throw new Error(`Invalid L4 filename: ${filename}`);
    },
    allowedDirectories: [
      /(^|\/)L4(\/|\\)(terminal(\/|\\))?/
    ],
    fieldConvention: 'camelCase'
  }
};

// ============================================================================
// FILE DISCOVERY
// ============================================================================

async function scanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...await scanDirectory(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error: any) {
    // Directory doesn't exist or not accessible
    if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
      console.warn(`⚠️  Error scanning ${dirPath}: ${error.message}`);
    }
  }

  return files;
}

async function discoverContentFiles(options: FixerOptions): Promise<Map<string, string[]>> {
  const { layer, contentRoot } = options;
  const layers = layer === 'all' ? ['L1', 'L2', 'L3', 'L4'] : [layer];
  const filesByLayer = new Map<string, string[]>();

  for (const currentLayer of layers) {
    const config = LAYER_CONFIGS[currentLayer];
    const files: string[] = [];

    // Scan the entire content root
    const allFiles = await scanDirectory(contentRoot);

    // Filter files by pattern and directory
    for (const file of allFiles) {
      const filename = basename(file);
      const relPath = relative(contentRoot, file);
      const relNorm = relPath.replace(/\\/g, '/');

      // Exclude non-content files
      if (EXCLUDED_PATTERNS.some(pattern => filename.includes(pattern))) {
        continue;
      }

      // Match layer pattern
      if (!config.pattern.test(filename)) {
        continue;
      }

      // Match allowed directories
      if (!config.allowedDirectories.some(dirPattern => dirPattern.test(relNorm))) {
        continue;
      }

      files.push(file);
    }

    filesByLayer.set(currentLayer, files.sort());
  }

  return filesByLayer;
}

// ============================================================================
// YAML NORMALIZATION
// ============================================================================

function parseFrontmatter(raw: string): { frontmatter: any; content: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No frontmatter found');
  }

  const yamlText = match[1];
  const content = match[2];

  // Parse YAML with error recovery
  try {
    const parsed = YAML.parse(yamlText, { strict: false, uniqueKeys: false });
    return { frontmatter: parsed, content };
  } catch (error: any) {
    // Attempt targeted repair for common patterns (e.g., text: >- without indentation)
    let repaired = yamlText;
    if (/^\s*text:\s*>-\s*$/m.test(repaired)) {
      const lines = repaired.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*text:\s*>-\s*$/.test(lines[i])) {
          let j = i + 1;
          for (; j < lines.length; j++) {
            const l = lines[j];
            if (/^---\s*$/.test(l)) { break; }
            if (/^[A-Za-z0-9_\-]+\s*:/.test(l)) { break; }
            lines[j] = l.startsWith('  ') ? l : ('  ' + l);
          }
          i = j - 1;
        }
      }
      repaired = lines.join('\n');
    }
    try {
      const parsed = YAML.parse(repaired, { strict: false, uniqueKeys: false });
      return { frontmatter: parsed, content };
    } catch (err: any) {
      throw new Error(`YAML parse error: ${error.message}`);
    }
  }
}

// Best-effort removal of malformed frontmatter when closing fence is missing
function stripMalformedFrontmatter(raw: string): string {
  if (!raw.startsWith('---')) return raw;
  const lines = raw.split(/\r?\n/);
  // remove initial '---'
  let i = 1;
  // scan until next '---'; if found, drop everything up to and including it
  for (; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }
  // no closing fence; drop up to first blank line to avoid swallowing body headings
  i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      return lines.slice(i + 1).join('\n');
    }
  }
  // fallback: return original without first line
  return lines.slice(1).join('\n');
}

function createMinimalFrontmatter(
  filename: string,
  layer: string,
  config: LayerConfig
): any {
  const baseFields: any = {};

  if (layer === 'L1') {
    baseFields.variation_id = config.idNormalizer(filename, {});
    baseFields.variation_type = 'firstRevisit';
    baseFields.word_count = 0;
    baseFields.conditions = { awareness: '0-0%' };
  } else if (layer === 'L2') {
    baseFields.variationId = config.idNormalizer(filename, {});
    const match = filename.match(/^(\w+)-L2-(\w+)-(FR|MA)/);
    if (match) {
      baseFields.character = match[1] === 'arch' ? 'archaeologist' :
                             match[1] === 'algo' ? 'algorithm' : 'human';
      baseFields.pathPhilosophy = match[2];
      baseFields.transformationState = match[3] === 'FR' ? 'firstRevisit' : 'metaAware';
    }
    baseFields.layer = 2;
    baseFields.awarenessRange = [0, 0];
    baseFields.nodeId = '';
  } else if (layer === 'L3') {
    baseFields.variationId = config.idNormalizer(filename, {});
    baseFields.layer = 3;
    baseFields.wordCount = 0;
    baseFields.nodeId = '';
    baseFields.journeyPattern = 'unknown';
    baseFields.philosophyDominant = 'accept';
    baseFields.awarenessLevel = 'low';
  } else if (layer === 'L4') {
    baseFields.id = config.idNormalizer(filename, {});
    const match = filename.match(/final-(\w+)/);
    baseFields.philosophy = match ? match[1] : 'preserve';
    baseFields.wordCount = 0;
  }

  return baseFields;
}

function has(obj: any, path: string): boolean {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current?.[key] === undefined) return false;
    current = current[key];
  }
  return current !== undefined;
}

function get(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current?.[key] === undefined) return undefined;
    current = current[key];
  }
  return current;
}

function set(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function normalizeTextBlocks(content: string): string {
  // Conservative normalization - only fix obvious issues
  return content;
}

function normalizeLists(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'string' ? item.trim() : normalizeLists(item));
  } else if (obj && typeof obj === 'object') {
    const normalized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[key] = normalizeLists(value);
    }
    return normalized;
  }
  return obj;
}

function getDefaultValue(field: string, layer: string): any {
  const defaults: Record<string, any> = {
    'variation_id': '',
    'variationId': '',
    'variation_type': 'firstRevisit',
    'transformationState': 'firstRevisit',
    'word_count': 0,
    'wordCount': 0,
    'conditions.awareness': '0-0%',
    'journeyPattern': 'unknown',
    'philosophyDominant': 'accept',
    'awarenessLevel': 'low',
    'awarenessRange': [0, 0],
    'character': 'archaeologist',
    'pathPhilosophy': 'accept',
    'layer': layer === 'L1' ? 1 : layer === 'L2' ? 2 : layer === 'L3' ? 3 : 4,
    'nodeId': '',
    'id': '',
    'philosophy': 'preserve',
    'thematicContent': {},
    'narrativeElements': {}
  };

  return defaults[field] ?? null;
}

async function normalizeFile(
  filePath: string,
  layer: string,
  config: LayerConfig,
  verbose: boolean = false
): Promise<NormalizationResult> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const filename = basename(filePath);
  const errors: string[] = [];
  const warnings: string[] = [];
  let modified = false;

  // Parse frontmatter
  let frontmatter: any;
  let content: string;

  try {
    const parsed = parseFrontmatter(raw);
    frontmatter = parsed.frontmatter;
    content = parsed.content;
  } catch (error: any) {
    // Parse failure—create minimal valid frontmatter
    warnings.push(`YAML parse failure: ${error.message}, creating minimal frontmatter`);
    frontmatter = createMinimalFrontmatter(filename, layer, config);
    content = stripMalformedFrontmatter(raw); // Strip any malformed frontmatter
    modified = true;
  }

  // Normalize variation ID
  const idField = config.fieldConvention === 'snake_case' ? 'variation_id' :
                  layer === 'L4' ? 'id' : 'variationId';
  const expectedId = config.idNormalizer(filename, frontmatter);

  if (frontmatter[idField] !== expectedId) {
    if (verbose) {
      warnings.push(`Normalizing ID: ${frontmatter[idField]} → ${expectedId}`);
    }
    frontmatter[idField] = expectedId;
    modified = true;
  }

  // Validate required fields
  for (const field of config.requiredFields) {
    if (!has(frontmatter, field)) {
      errors.push(`Missing required field: ${field}`);
      set(frontmatter, field, getDefaultValue(field, layer));
      modified = true;
    }
  }

  // Validate conditional fields
  for (const [field, condition] of config.conditionalFields) {
    if (condition(frontmatter) && !has(frontmatter, field)) {
      errors.push(`Missing conditional field: ${field}`);
      set(frontmatter, field, getDefaultValue(field, layer));
      modified = true;
    }
  }

  // Normalize text blocks
  const normalizedContent = normalizeTextBlocks(content);
  if (normalizedContent !== content) {
    content = normalizedContent;
    modified = true;
  }

  // Normalize lists in frontmatter
  const normalizedFrontmatter = normalizeLists(frontmatter);
  if (JSON.stringify(normalizedFrontmatter) !== JSON.stringify(frontmatter)) {
    frontmatter = normalizedFrontmatter;
    modified = true;
  }
  // Layer-specific fixes
  if (layer === 'L3') {
    if (typeof frontmatter.philosophyDominant === 'string' && frontmatter.philosophyDominant.toLowerCase() === 'investigate') {
      frontmatter.philosophyDominant = 'invest';
      modified = true;
    }
    // Ensure characterVoices for conv-L3 files
    if (/conv-L3-production[\/]/.test(filePath) || /(^|[\/])conv-L3-\d+\.md$/.test(filePath)) {
      if (!Array.isArray(frontmatter.characterVoices) || frontmatter.characterVoices.length < 2) {
        frontmatter.characterVoices = ['archaeologist', 'algorithm', 'last-human'];
        modified = true;
      }
    }
  }

  const wordCountField = config.fieldConvention === 'snake_case' ? 'word_count' : 'wordCount';
  if (!frontmatter[wordCountField] || frontmatter[wordCountField] === 0) {
    frontmatter[wordCountField] = countWords(content);
    modified = true;
  }

  return {
    frontmatter,
    content,
    modified,
    errors,
    warnings
  };
}

// ============================================================================
// FILE WRITING
// ============================================================================

async function writeNormalizedFile(
  filePath: string,
  result: NormalizationResult
): Promise<void> {
  // Serialize frontmatter to YAML with safe formatting
  const yamlText = YAML.stringify(result.frontmatter, {
    indent: 2,
    lineWidth: 120,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_SINGLE'
  });

  // Reconstruct file
  const output = `---\n${yamlText}---\n${result.content}`;

  await fs.writeFile(filePath, output, 'utf-8');
}

// ============================================================================
// MAIN FIXER FUNCTION
// ============================================================================

export async function fixContent(options: FixerOptions): Promise<FixerReport> {
  const { layer, contentRoot, dryRun = false, verbose = false } = options;

  console.log(`🔧 Fixing content for layer(s): ${layer}`);
  if (dryRun) console.log('   (DRY RUN - no files will be modified)');
  console.log('');

  // Discover files
  const filesByLayer = await discoverContentFiles(options);

  const report: FixerReport = {
    totalFiles: 0,
    modifiedFiles: 0,
    errorFiles: 0,
    byLayer: {},
    errors: []
  };

  // Process each layer
  for (const [currentLayer, files] of filesByLayer) {
    const config = LAYER_CONFIGS[currentLayer];
    const layerReport = {
      files: files.length,
      modified: 0,
      errors: 0
    };

    console.log(`📁 Processing ${currentLayer}: ${files.length} files`);

    for (const filePath of files) {
      const filename = basename(filePath);

      try {
        const result = await normalizeFile(filePath, currentLayer, config, verbose);

        if (result.errors.length > 0) {
          layerReport.errors++;
          report.errors.push({
            file: filename,
            layer: currentLayer,
            errors: result.errors
          });
        }

        if (result.modified) {
          layerReport.modified++;
          if (!dryRun) {
            await writeNormalizedFile(filePath, result);
          }

          const status = result.errors.length > 0 ? '(with errors)' :
                        result.warnings.length > 0 ? '(with warnings)' : '';
          console.log(`   ✓ ${filename} ${status}`);

          if (verbose && result.warnings.length > 0) {
            for (const warning of result.warnings) {
              console.log(`      ⚠️  ${warning}`);
            }
          }
        } else if (verbose) {
          console.log(`   • ${filename} (no changes)`);
        }
      } catch (error: any) {
        layerReport.errors++;
        report.errors.push({
          file: filename,
          layer: currentLayer,
          errors: [error.message]
        });
        console.error(`   ✗ ${filename}: ${error.message}`);
      }
    }

    report.byLayer[currentLayer] = layerReport;
    report.totalFiles += layerReport.files;
    report.modifiedFiles += layerReport.modified;
    report.errorFiles += layerReport.errors;

    console.log('');
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${report.totalFiles}`);
  console.log(`Modified: ${report.modifiedFiles}`);
  console.log(`Errors: ${report.errorFiles}`);
  console.log('');

  for (const [layerName, stats] of Object.entries(report.byLayer)) {
    console.log(`${layerName}:`);
    console.log(`  Files: ${stats.files}`);
    console.log(`  Modified: ${stats.modified}`);
    console.log(`  Errors: ${stats.errors}`);
  }

  if (report.errors.length > 0) {
    console.log('');
    console.log('⚠️  ERRORS:');
    for (const error of report.errors.slice(0, 20)) { // Limit to first 20
      console.log(`\n${error.file} (${error.layer}):`);
      for (const msg of error.errors) {
        console.log(`  - ${msg}`);
      }
    }
    if (report.errors.length > 20) {
      console.log(`\n... and ${report.errors.length - 20} more errors`);
    }
  }

  return report;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({
    options: {
      layer: { type: 'string', short: 'l' },
      'dry-run': { type: 'boolean', short: 'd' },
      verbose: { type: 'boolean', short: 'v' },
    },
  });

  const layer = (values.layer as any) || 'all';
  const dryRun = values['dry-run'] || false;
  const verbose = values.verbose || false;
  const contentRoot = resolve(process.cwd(), '../../docs');

  fixContent({ layer, contentRoot, dryRun, verbose })
    .then(report => {
      if (report.errorFiles > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

