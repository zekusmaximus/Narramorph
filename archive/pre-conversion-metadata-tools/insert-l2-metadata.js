#!/usr/bin/env node
/**
 * L2 Metadata Insertion Script
 *
 * This script:
 * 1. Finds all L2 variation markdown files
 * 2. Analyzes content to extract metadata
 * 3. Prompts user for metadata values via interactive CLI
 * 4. Adds YAML frontmatter to each file
 * 5. Validates metadata completeness
 *
 * Usage: node insert-l2-metadata.js [--dry-run] [--batch] [--file=path]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const yaml = require('js-yaml');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Directories to search for L2 variations
  searchPaths: [
    './docs',
    '/mnt/user-data/outputs',
    '/mnt/user-data/content/layer-2',
    './content/layer-2',
    './outputs',
  ],

  // Pattern to match L2 variation files (project uses "invest")
  filenamePattern: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/,

  // Backup directory
  backupDir: './metadata-backups',

  // Metadata template
  metadataTemplate: {
    variationId: '',
    nodeId: '',
    character: '',
    layer: 2,
    pathPhilosophy: '',
    transformationState: '',
    awarenessRange: [],
    wordCount: 0,
    createdDate: new Date().toISOString().split('T')[0],

    thematicContent: {
      primaryThemes: [],
      secondaryThemes: [],
      consciousnessQuestion: '',
      philosophicalStance: '',
      observerEffect: '',
      crossCharacterReferences: [],
    },

    narrativeElements: {
      worldBuildingFocus: [],
      locationElements: [],
      technicalDetails: [],
      emotionalTone: '',
      observerPosition: '',
      temporalBleedingLevel: '',
      voiceSignature: '',
      narrativeArc: '',
      pacing: '',
    },

    l3SeedContributions: {
      preserve: {
        text: '',
        weight: '',
        keyPhrases: [],
      },
      release: {
        text: '',
        weight: '',
        keyPhrases: [],
      },
      transform: {
        text: '',
        weight: '',
        keyPhrases: [],
      },
    },

    generationHints: {
      keyPhrases: [],
      philosophicalCulmination: '',
      convergenceAlignment: '',
      narrativeProgression: '',
      characterDevelopment: '',
      emotionalJourney: '',
    },

    characterDevelopment: {
      stanceEvolution: '',
      relationshipToArchive: '',
      relationshipToMethod: '',
      awarenessOfOthers: '',
      selfAwareness: '',
      philosophicalEvolution: '',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find all L2 variation files in configured directories
 */
function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function findL2VariationFiles(roots) {
  const found = [];
  const searchRoots = Array.isArray(roots) && roots.length > 0 ? roots : CONFIG.searchPaths;
  for (const root of searchRoots) {
    if (!fs.existsSync(root)) {
      continue;
    }
    const files = walkFiles(root);
    for (const full of files) {
      const base = path.basename(full);
      if (CONFIG.filenamePattern.test(base)) {
        found.push(full);
      }
    }
  }
  return found;
}

/**
 * Parse filename to extract basic metadata
 */
function parseFilename(filename) {
  const match = filename.match(CONFIG.filenamePattern);

  if (!match) {
    return null;
  }

  const [_, character, pathPhilosophy, transformationCode, number] = match;

  return {
    character:
      character === 'arch' ? 'archaeologist' : character === 'algo' ? 'algorithm' : 'lastHuman',
    pathPhilosophy,
    transformationState: transformationCode === 'FR' ? 'firstRevisit' : 'metaAware',
    variationNumber: number,
    variationId: `${character}-L2-${pathPhilosophy}-${transformationCode}-${number}`,
    nodeId: `${character}-L2-${pathPhilosophy}`,
  };
}

/**
 * Extract metadata from file content using AI-assisted analysis
 */
function analyzeContent(content) {
  const analysis = {
    wordCount: content.trim().split(/\s+/).length,
    primaryThemes: extractThemes(content),
    keyPhrases: extractKeyPhrases(content),
    emotionalTone: detectEmotionalTone(content),
    worldBuilding: extractWorldBuilding(content),
  };

  return analysis;
}

/**
 * Extract primary themes from content
 */
function extractThemes(content) {
  const themes = [];

  // Theme detection patterns
  const themePatterns = {
    preservation: /preserv(e|ation|ing)|maintain|continue|perpetuat/i,
    'witness-methodology': /witness|observ(e|ation)|authenticat(e|ion)|methodolog/i,
    acceptance: /accept|honor|trust|embrace/i,
    verification: /verif(y|ication)|proof|evidence|test/i,
    consciousness: /consciousness|aware(ness)?|self|being/i,
    'observer-effect': /observer|examination|affect|transform/i,
    temporal: /temporal|time|past|future|recursive/i,
    embodiment: /body|physical|embodied|flesh|biological/i,
    simulation: /simulat(e|ion)|real(ity)?|genuine|authentic/i,
    processing: /process(ing)?|comput(e|ation)|stream|algorithm/i,
  };

  for (const [theme, pattern] of Object.entries(themePatterns)) {
    const matches = content.match(new RegExp(pattern, 'gi'));
    if (matches && matches.length >= 3) {
      themes.push(theme);
    }
  }

  return themes.slice(0, 5); // Top 5 themes
}

/**
 * Extract key phrases (memorable quotes)
 */
function extractKeyPhrases(content) {
  const phrases = [];

  // Look for sentences with philosophical weight
  const sentences = content.match(/[A-Z][^.!?]+[.!?]/g) || [];

  for (const sentence of sentences) {
    const cleaned = sentence.trim();

    // Criteria for key phrases:
    // - Between 5 and 20 words
    // - Contains philosophical keywords
    // - No technical jargon overflow

    const wordCount = cleaned.split(/\s+/).length;
    const hasPhilosophical = /consciousness|preserve|witness|authentic|observe|transform/i.test(
      cleaned,
    );

    if (wordCount >= 5 && wordCount <= 20 && hasPhilosophical) {
      phrases.push(cleaned);
    }
  }

  return phrases.slice(0, 10); // Top 10 phrases
}

/**
 * Detect emotional tone
 */
function detectEmotionalTone(content) {
  const tones = {
    contemplative: /consider|reflect|ponderfponder|think/i,
    peaceful: /peace|calm|serenity|quiet|still/i,
    urgent: /urgent|immediate|pressing|critical/i,
    skeptical: /doubt|question|uncertain|skeptic/i,
    reverent: /sacred|holy|reverent|honor/i,
  };

  const scores = {};
  for (const [tone, pattern] of Object.entries(tones)) {
    const matches = content.match(new RegExp(pattern, 'gi'));
    scores[tone] = matches ? matches.length : 0;
  }

  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return dominant[0];
}

/**
 * Extract world-building elements
 */
function extractWorldBuilding(content) {
  const elements = [];

  // Look for proper nouns, technical terms, locations
  const patterns = {
    locations: /chamber[- ]?\w+|station|facility|archive|lab|room/gi,
    technology: /protocol|system|interface|substrate|array|scanner/gi,
    data: /fragment|consciousness|pattern|memory|trace/gi,
  };

  for (const [category, pattern] of Object.entries(patterns)) {
    const matches = [...new Set(content.match(pattern) || [])];
    elements.push(...matches.map((m) => m.toLowerCase()));
  }

  return [...new Set(elements)].slice(0, 10);
}

/**
 * Determine awareness range based on transformation state and content
 */
function determineAwarenessRange(transformationState, content) {
  if (transformationState === 'firstRevisit') {
    // FirstRevisit: 21-60%
    // Analyze content for awareness indicators
    const hasLightCrossChar = /algorithm|archaeologist|human/.test(content);
    const hasModerateMetaRef = /observe.*observ|examine.*examin/i.test(content);
    const hasTemporalAwareness = /return|revisit|again|familiar/i.test(content);

    const indicators = [hasLightCrossChar, hasModerateMetaRef, hasTemporalAwareness].filter(
      Boolean,
    ).length;

    if (indicators === 0) {
      return [21, 30];
    }
    if (indicators === 1) {
      return [31, 40];
    }
    if (indicators === 2) {
      return [41, 50];
    }
    return [51, 60];
  } else {
    // MetaAware: 61-100%
    const hasFrameConsciousness = /read(er)?|you|choice|path/i.test(content);
    const hasHighMetaRef = /consciousness.*consciousness|pattern.*pattern/i.test(content);
    const hasMaxIntegration = /three|all|network|convergence/i.test(content);

    const indicators = [hasFrameConsciousness, hasHighMetaRef, hasMaxIntegration].filter(
      Boolean,
    ).length;

    if (indicators === 0) {
      return [61, 70];
    }
    if (indicators === 1) {
      return [71, 80];
    }
    if (indicators === 2) {
      return [81, 90];
    }
    return [91, 100];
  }
}

/**
 * Check if file already has frontmatter
 */
function hasFrontmatter(content) {
  // Detect YAML frontmatter with Unix or Windows newlines
  return /^---\r?\n/.test(content);
}

/**
 * Extract existing frontmatter
 */
function extractFrontmatter(content) {
  if (!hasFrontmatter(content)) {
    return null;
  }
  // Support CRLF or LF line endings
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }

  try {
    return yaml.load(match[1]);
  } catch (e) {
    console.error('Error parsing existing frontmatter:', e.message);
    return null;
  }
}

/**
 * Create backup of file
 */
function backupFile(filepath) {
  const filename = path.basename(filepath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.backupDir, `${filename}.${timestamp}.bak`);

  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }

  fs.copyFileSync(filepath, backupPath);
  return backupPath;
}

// ============================================================================
// INTERACTIVE METADATA COLLECTION
// ============================================================================

class MetadataCollector {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async ask(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;

      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  async askMultiple(question, suggestions = []) {
    console.log(`\n${question}`);
    if (suggestions.length > 0) {
      console.log('Suggestions:', suggestions.join(', '));
    }
    console.log('Enter values one per line. Empty line when done.');

    const values = [];
    while (true) {
      const value = await this.ask('  -');
      if (!value) {
        break;
      }
      values.push(value);
    }

    return values;
  }

  async collectMetadata(filepath, basicMeta, autoAnalysis) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Collecting metadata for: ${path.basename(filepath)}`);
    console.log(`${'='.repeat(70)}\n`);

    const metadata = {
      variationId: basicMeta.variationId,
      nodeId: basicMeta.nodeId,
      character: basicMeta.character,
      layer: 2,
      pathPhilosophy: basicMeta.pathPhilosophy,
      transformationState: basicMeta.transformationState,
      awarenessRange: autoAnalysis.awarenessRange,
      wordCount: autoAnalysis.wordCount,
      createdDate: new Date().toISOString().split('T')[0],

      thematicContent: {},
      narrativeElements: {},
      l3SeedContributions: {},
      generationHints: {},
      characterDevelopment: {},
    };

    // Thematic Content
    console.log('\n--- THEMATIC CONTENT ---\n');

    metadata.thematicContent.primaryThemes = await this.askMultiple(
      'Primary themes (3-5):',
      autoAnalysis.primaryThemes,
    );

    metadata.thematicContent.secondaryThemes = await this.askMultiple('Secondary themes (2-4):');

    metadata.thematicContent.consciousnessQuestion = await this.ask(
      'Consciousness question (format: subject-relationship-tension)',
    );

    metadata.thematicContent.philosophicalStance = await this.ask(
      'Philosophical stance (format: action-object-qualification)',
    );

    metadata.thematicContent.observerEffect = await this.ask(
      'Observer effect (how observation affects observed)',
    );

    // Narrative Elements
    console.log('\n--- NARRATIVE ELEMENTS ---\n');

    metadata.narrativeElements.emotionalTone = await this.ask(
      'Emotional tone',
      autoAnalysis.emotionalTone,
    );

    metadata.narrativeElements.worldBuildingFocus = await this.askMultiple(
      'World-building elements:',
      autoAnalysis.worldBuilding,
    );

    metadata.narrativeElements.observerPosition = await this.ask(
      'Observer position (e.g., meta-archaeological)',
    );

    // L3 Seeds
    console.log('\n--- L3 SEED CONTRIBUTIONS ---\n');

    for (const seed of ['preserve', 'release', 'transform']) {
      console.log(`\n${seed.toUpperCase()}:`);

      metadata.l3SeedContributions[seed] = {
        text: await this.ask('  Seed text (1-2 sentences)'),
        weight: await this.ask('  Weight (strong/moderate/light)'),
        keyPhrases: await this.askMultiple('  Key phrases supporting this seed:'),
      };
    }

    // Generation Hints
    console.log('\n--- GENERATION HINTS ---\n');

    metadata.generationHints.keyPhrases = await this.askMultiple(
      'Key phrases (5-10 memorable quotes):',
      autoAnalysis.keyPhrases.slice(0, 5),
    );

    metadata.generationHints.philosophicalCulmination = await this.ask(
      'Philosophical culmination (what shift occurred)',
    );

    metadata.generationHints.convergenceAlignment = await this.ask(
      'Convergence alignment (preserve/release/transform)',
    );

    return metadata;
  }

  close() {
    this.rl.close();
  }
}

// ============================================================================
// BATCH MODE (NON-INTERACTIVE)
// ============================================================================

/**
 * Generate metadata in batch mode using only automated analysis
 */
function generateBatchMetadata(filepath, basicMeta, autoAnalysis) {
  return {
    variationId: basicMeta.variationId,
    nodeId: basicMeta.nodeId,
    character: basicMeta.character,
    layer: 2,
    pathPhilosophy: basicMeta.pathPhilosophy,
    transformationState: basicMeta.transformationState,
    awarenessRange: autoAnalysis.awarenessRange,
    wordCount: autoAnalysis.wordCount,
    createdDate: new Date().toISOString().split('T')[0],

    thematicContent: {
      primaryThemes: autoAnalysis.primaryThemes,
      secondaryThemes: [],
      consciousnessQuestion: 'REVIEW_REQUIRED',
      philosophicalStance: 'REVIEW_REQUIRED',
      observerEffect: 'REVIEW_REQUIRED',
      crossCharacterReferences: [],
    },

    narrativeElements: {
      worldBuildingFocus: autoAnalysis.worldBuilding,
      locationElements: [],
      technicalDetails: [],
      emotionalTone: autoAnalysis.emotionalTone,
      observerPosition: 'REVIEW_REQUIRED',
      temporalBleedingLevel: 'REVIEW_REQUIRED',
      voiceSignature: 'REVIEW_REQUIRED',
      narrativeArc: 'REVIEW_REQUIRED',
      pacing: 'REVIEW_REQUIRED',
    },

    l3SeedContributions: {
      preserve: {
        text: 'REVIEW_REQUIRED',
        weight: 'moderate',
        keyPhrases: [],
      },
      release: {
        text: 'REVIEW_REQUIRED',
        weight: 'moderate',
        keyPhrases: [],
      },
      transform: {
        text: 'REVIEW_REQUIRED',
        weight: 'moderate',
        keyPhrases: [],
      },
    },

    generationHints: {
      keyPhrases: autoAnalysis.keyPhrases,
      philosophicalCulmination: 'REVIEW_REQUIRED',
      convergenceAlignment: 'REVIEW_REQUIRED',
      narrativeProgression: 'REVIEW_REQUIRED',
      characterDevelopment: 'REVIEW_REQUIRED',
      emotionalJourney: 'REVIEW_REQUIRED',
    },

    characterDevelopment: {
      stanceEvolution: 'REVIEW_REQUIRED',
      relationshipToArchive: 'REVIEW_REQUIRED',
      relationshipToMethod: 'REVIEW_REQUIRED',
      awarenessOfOthers: 'REVIEW_REQUIRED',
      selfAwareness: 'REVIEW_REQUIRED',
      philosophicalEvolution: 'REVIEW_REQUIRED',
    },

    _batchGenerated: true,
    _requiresManualReview: true,
  };
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

/**
 * Process a single file
 */
async function processFile(filepath, options = {}) {
  const { dryRun = false, batch = false, collector = null } = options;

  console.log(`\nProcessing: ${filepath}`);

  // Read file
  const content = fs.readFileSync(filepath, 'utf-8');

  // Check if already has metadata
  if (hasFrontmatter(content)) {
    console.log('  ⚠️  File already has frontmatter. Skipping.');
    return { status: 'skipped', reason: 'has-frontmatter' };
  }

  // Parse filename
  const basicMeta = parseFilename(path.basename(filepath));
  if (!basicMeta) {
    console.log('  ❌ Invalid filename format. Skipping.');
    return { status: 'skipped', reason: 'invalid-filename' };
  }

  // Analyze content
  const autoAnalysis = analyzeContent(content);
  autoAnalysis.awarenessRange = determineAwarenessRange(basicMeta.transformationState, content);

  // Collect or generate metadata
  let metadata;

  if (batch) {
    metadata = generateBatchMetadata(filepath, basicMeta, autoAnalysis);
    console.log('  📝 Generated batch metadata (requires manual review)');
  } else {
    metadata = await collector.collectMetadata(filepath, basicMeta, autoAnalysis);
    console.log('  ✅ Metadata collected interactively');
  }

  // Generate frontmatter YAML
  const frontmatter = yaml.dump(metadata, {
    indent: 2,
    lineWidth: 80,
    noRefs: true,
  });

  // Create new file content
  const newContent = `---\n${frontmatter}---\n\n${content}`;

  if (dryRun) {
    console.log('  🔍 DRY RUN - Would add:');
    console.log('  ' + frontmatter.split('\n').join('\n  '));
    return { status: 'dry-run', metadata };
  }

  // Backup original
  const backupPath = backupFile(filepath);
  console.log(`  💾 Backup created: ${backupPath}`);

  // Write new content
  fs.writeFileSync(filepath, newContent, 'utf-8');
  console.log('  ✅ Metadata added successfully');

  return { status: 'success', metadata, backup: backupPath };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    batch: args.includes('--batch'),
    file: args.find((a) => a.startsWith('--file='))?.split('=')[1],
    roots: (() => {
      const r = args.find((a) => a.startsWith('--root='));
      return r ? [r.split('=')[1]] : CONFIG.searchPaths;
    })(),
  };

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         L2 Metadata Insertion Script                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  if (options.batch) {
    console.log('⚡ BATCH MODE - Automated metadata generation\n');
  }

  // Find files
  let files;
  if (options.file) {
    files = [options.file];
  } else {
    files = findL2VariationFiles(options.roots);
  }

  if (files.length === 0) {
    console.log('❌ No L2 variation files found.');
    console.log('Searched in:', CONFIG.searchPaths.join(', '));
    return;
  }

  console.log(`Found ${files.length} L2 variation file(s)\n`);

  // Process files
  const collector = options.batch ? null : new MetadataCollector();
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    dryRun: 0,
  };

  for (const filepath of files) {
    try {
      const result = await processFile(filepath, { ...options, collector });

      if (result.status === 'success') {
        results.success++;
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else if (result.status === 'dry-run') {
        results.dryRun++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${filepath}:`, error.message);
      results.failed++;
    }
  }

  if (collector) {
    collector.close();
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total files: ${files.length}`);
  console.log(`✅ Successfully processed: ${results.success}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  if (options.dryRun) {
    console.log(`🔍 Dry run analyzed: ${results.dryRun}`);
  }
  console.log('='.repeat(70) + '\n');

  if (results.success > 0 && !options.dryRun) {
    console.log(`Backups saved to: ${CONFIG.backupDir}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findL2VariationFiles,
  parseFilename,
  analyzeContent,
  processFile,
};
