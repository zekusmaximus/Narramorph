#!/usr/bin/env node
/**
 * L2 Variation Inventory Script
 *
 * Scans for all L2 variation files and provides:
 * - Count and listing of files found
 * - Automated metadata analysis preview
 * - Files already with metadata vs. needing metadata
 * - Suggested metadata values based on content analysis
 *
 * Run this BEFORE insert-l2-metadata.js to understand scope
 *
 * Usage: node inventory-l2-variations.js [--output=report.json]
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Default roots to search (first is project docs)
  searchPaths: [
    './docs',
    '/mnt/user-data/outputs',
    '/mnt/user-data/content/layer-2',
    './content/layer-2',
    './outputs',
  ],

  // Project uses "invest" not "investigate"
  filenamePattern: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/,
};

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

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
    variationNumber: parseInt(number),
    variationId: `${character}-L2-${pathPhilosophy}-${transformationCode}-${number}`,
    nodeId: `${character}-L2-${pathPhilosophy}`,
  };
}

function hasFrontmatter(content) {
  // Detect YAML frontmatter with Unix or Windows newlines
  return /^---\r?\n/.test(content);
}

function analyzeContent(content) {
  return {
    wordCount: content.trim().split(/\s+/).length,
    characterCount: content.length,
    primaryThemes: extractThemes(content),
    keyPhrases: extractKeyPhrases(content),
    emotionalTone: detectEmotionalTone(content),
    worldBuilding: extractWorldBuilding(content),
    crossCharacterRefs: detectCrossCharacter(content),
    awarenessIndicators: detectAwarenessIndicators(content),
  };
}

function extractThemes(content) {
  const themes = [];

  const themePatterns = {
    preservation: /preserv(e|ation|ing)|maintain|continue/gi,
    witness: /witness|observ(e|ation)|authenticat(e|ion)/gi,
    acceptance: /accept|honor|trust|embrace/gi,
    verification: /verif(y|ication)|proof|evidence/gi,
    consciousness: /consciousness|aware(ness)?|self/gi,
    'observer-effect': /observer|examination|affect|transform/gi,
    temporal: /temporal|time|recursive|revisit/gi,
    embodiment: /body|physical|embodied|biological/gi,
    simulation: /simulat(e|ion)|real(ity)?|genuine/gi,
    processing: /process(ing)?|comput(e|ation)|stream/gi,
  };

  for (const [theme, pattern] of Object.entries(themePatterns)) {
    const matches = content.match(pattern);
    if (matches && matches.length >= 3) {
      themes.push({ theme, frequency: matches.length });
    }
  }

  return themes.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
}

function extractKeyPhrases(content) {
  const sentences = content.match(/[A-Z][^.!?]+[.!?]/g) || [];
  const phrases = [];

  for (const sentence of sentences) {
    const cleaned = sentence.trim();
    const wordCount = cleaned.split(/\s+/).length;
    const hasPhilosophical = /consciousness|preserve|witness|authentic|observe|transform/i.test(
      cleaned,
    );

    if (wordCount >= 5 && wordCount <= 20 && hasPhilosophical) {
      phrases.push(cleaned);
    }
  }

  return phrases.slice(0, 5);
}

function detectEmotionalTone(content) {
  const tones = {
    contemplative: /consider|reflect|ponder|think/gi,
    peaceful: /peace|calm|serenity|quiet|still/gi,
    urgent: /urgent|immediate|pressing|critical/gi,
    skeptical: /doubt|question|uncertain|skeptic/gi,
    reverent: /sacred|holy|reverent|honor/gi,
    anxious: /anxiet|worry|concern|troubl/gi,
  };

  const scores = {};
  for (const [tone, pattern] of Object.entries(tones)) {
    const matches = content.match(pattern);
    scores[tone] = matches ? matches.length : 0;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'neutral';
}

function extractWorldBuilding(content) {
  const elements = new Set();

  const patterns = {
    locations: /chamber[- ]?\w+|station|facility|archive|laboratory?|room|bay/gi,
    technology: /protocol|system|interface|substrate|array|scanner|processor/gi,
    data: /fragment|consciousness|pattern|memory|trace|stream/gi,
    specific: /sigma[- ]?seven|94\.7%|91\.2%|88\.9%|847\.3\s*TB/gi,
  };

  for (const pattern of Object.values(patterns)) {
    const matches = content.match(pattern) || [];
    matches.forEach((m) => elements.add(m.toLowerCase().trim()));
  }

  return Array.from(elements).slice(0, 10);
}

function detectCrossCharacter(content) {
  const refs = [];

  if (/algorithm|computational|processing|seven[- ]?stream/i.test(content)) {
    refs.push('algorithm');
  }

  if (/archaeologist|authentication|fragment|94\.7%/i.test(content)) {
    refs.push('archaeologist');
  }

  if (/human|upload|biological|embodied|last/i.test(content)) {
    refs.push('lastHuman');
  }

  return refs;
}

function detectAwarenessIndicators(content) {
  const indicators = {
    'cross-character-light': /\b(algorithm|archaeologist|human)\b/gi,
    'cross-character-moderate': /(parallel|processing|authentication).*consciousness/gi,
    'temporal-awareness': /return|revisit|again|familiar|pattern.*repeat/gi,
    'meta-reference': /observe.*observ|examine.*examin|question.*question/gi,
    'frame-consciousness': /read(er)?|you|choice|path|navigation/gi,
    'high-integration': /three|all.*three|network|convergence|unified/gi,
  };

  const found = [];
  for (const [indicator, pattern] of Object.entries(indicators)) {
    if (pattern.test(content)) {
      found.push(indicator);
    }
  }

  return found;
}

function estimateAwarenessRange(transformationState, indicators) {
  if (transformationState === 'firstRevisit') {
    const level = indicators.filter(
      (i) => i.startsWith('cross-character') || i === 'temporal-awareness',
    ).length;

    if (level === 0) {
      return [21, 30];
    }
    if (level === 1) {
      return [31, 40];
    }
    if (level === 2) {
      return [41, 50];
    }
    return [51, 60];
  } else {
    const level = indicators.filter(
      (i) => i === 'frame-consciousness' || i === 'high-integration',
    ).length;

    if (level === 0) {
      return [61, 70];
    }
    if (level === 1) {
      return [71, 80];
    }
    if (level === 2) {
      return [81, 90];
    }
    return [91, 100];
  }
}

// ============================================================================
// INVENTORY PROCESS
// ============================================================================

// Recursively walk a directory and yield files
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

function inventoryFiles(roots) {
  const inventory = {
    totalFiles: 0,
    withMetadata: 0,
    withoutMetadata: 0,
    byCharacter: {},
    byPath: {},
    byState: {},
    files: [],
  };

  // Find all files
  const searchRoots = Array.isArray(roots) && roots.length > 0 ? roots : CONFIG.searchPaths;
  for (const root of searchRoots) {
    if (!fs.existsSync(root)) {
      continue;
    }
    const files = walkFiles(root);
    for (const fullPath of files) {
      const base = path.basename(fullPath);
      if (!CONFIG.filenamePattern.test(base)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = parseFilename(base);
      const hasMetadata = hasFrontmatter(content);

      inventory.totalFiles++;

      if (hasMetadata) {
        inventory.withMetadata++;
      } else {
        inventory.withoutMetadata++;
      }

      // Count by character
      if (!inventory.byCharacter[parsed.character]) {
        inventory.byCharacter[parsed.character] = { total: 0, withMetadata: 0, withoutMetadata: 0 };
      }
      inventory.byCharacter[parsed.character].total++;
      if (hasMetadata) {
        inventory.byCharacter[parsed.character].withMetadata++;
      } else {
        inventory.byCharacter[parsed.character].withoutMetadata++;
      }

      // Count by path
      const pathKey = `${parsed.character}-${parsed.pathPhilosophy}`;
      if (!inventory.byPath[pathKey]) {
        inventory.byPath[pathKey] = { total: 0, withMetadata: 0, withoutMetadata: 0 };
      }
      inventory.byPath[pathKey].total++;
      if (hasMetadata) {
        inventory.byPath[pathKey].withMetadata++;
      } else {
        inventory.byPath[pathKey].withoutMetadata++;
      }

      // Count by state
      if (!inventory.byState[parsed.transformationState]) {
        inventory.byState[parsed.transformationState] = {
          total: 0,
          withMetadata: 0,
          withoutMetadata: 0,
        };
      }
      inventory.byState[parsed.transformationState].total++;
      if (hasMetadata) {
        inventory.byState[parsed.transformationState].withMetadata++;
      } else {
        inventory.byState[parsed.transformationState].withoutMetadata++;
      }

      // Analyze content if no metadata
      let analysis = null;
      if (!hasMetadata) {
        analysis = analyzeContent(content);
        analysis.estimatedAwarenessRange = estimateAwarenessRange(
          parsed.transformationState,
          analysis.awarenessIndicators,
        );
      }

      inventory.files.push({
        filename: base,
        path: fullPath,
        ...parsed,
        hasMetadata,
        analysis,
      });
    }
  }

  return inventory;
}

// ============================================================================
// REPORTING
// ============================================================================

function printReport(inventory) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           L2 Variation Inventory Report                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Overall stats
  console.log('OVERALL STATISTICS');
  console.log('─'.repeat(70));
  console.log(`Total L2 variation files found: ${inventory.totalFiles}`);
  console.log(
    `  ✅ With metadata:    ${inventory.withMetadata} (${((inventory.withMetadata / inventory.totalFiles) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  ⚠️  Without metadata: ${inventory.withoutMetadata} (${((inventory.withoutMetadata / inventory.totalFiles) * 100).toFixed(1)}%)`,
  );
  console.log('');

  // By character
  console.log('BY CHARACTER');
  console.log('─'.repeat(70));
  for (const [character, stats] of Object.entries(inventory.byCharacter)) {
    console.log(`${character}:`);
    console.log(
      `  Total: ${stats.total} | With metadata: ${stats.withMetadata} | Without: ${stats.withoutMetadata}`,
    );
  }
  console.log('');

  // By path
  console.log('BY PATH');
  console.log('─'.repeat(70));
  for (const [path, stats] of Object.entries(inventory.byPath)) {
    console.log(`${path}:`);
    console.log(
      `  Total: ${stats.total} | With metadata: ${stats.withMetadata} | Without: ${stats.withoutMetadata}`,
    );
  }
  console.log('');

  // By transformation state
  console.log('BY TRANSFORMATION STATE');
  console.log('─'.repeat(70));
  for (const [state, stats] of Object.entries(inventory.byState)) {
    console.log(`${state}:`);
    console.log(
      `  Total: ${stats.total} | With metadata: ${stats.withMetadata} | Without: ${stats.withoutMetadata}`,
    );
  }
  console.log('');

  // Sample analysis
  const samplesWithoutMetadata = inventory.files.filter((f) => !f.hasMetadata).slice(0, 3);

  if (samplesWithoutMetadata.length > 0) {
    console.log('SAMPLE AUTOMATED ANALYSIS (First 3 files without metadata)');
    console.log('─'.repeat(70));

    for (const file of samplesWithoutMetadata) {
      console.log(`\n📄 ${file.filename}`);
      console.log(`   ID: ${file.variationId}`);
      console.log(`   Character: ${file.character} | Path: ${file.pathPhilosophy}`);
      console.log(`   State: ${file.transformationState}`);
      console.log(`   Word count: ${file.analysis.wordCount}`);
      console.log(
        `   Estimated awareness: ${file.analysis.estimatedAwarenessRange[0]}-${file.analysis.estimatedAwarenessRange[1]}%`,
      );
      console.log(`   Emotional tone: ${file.analysis.emotionalTone}`);
      console.log(
        `   Primary themes: ${file.analysis.primaryThemes.map((t) => t.theme).join(', ')}`,
      );
      console.log(
        `   Cross-character refs: ${file.analysis.crossCharacterRefs.join(', ') || 'none detected'}`,
      );
      console.log(`   Awareness indicators: ${file.analysis.awarenessIndicators.join(', ')}`);
      console.log(`   Sample key phrase: "${file.analysis.keyPhrases[0] || 'N/A'}"`);
    }
    console.log('');
  }

  // Next steps
  console.log('NEXT STEPS');
  console.log('─'.repeat(70));

  if (inventory.withoutMetadata === 0) {
    console.log('✅ All files have metadata! No action needed.');
  } else {
    console.log(`⚠️  ${inventory.withoutMetadata} file(s) need metadata.`);
    console.log('');
    console.log('To add metadata:');
    console.log('  1. Interactive mode:  node insert-l2-metadata.js');
    console.log('  2. Batch mode:        node insert-l2-metadata.js --batch');
    console.log('  3. Dry run first:     node insert-l2-metadata.js --dry-run');
    console.log('  4. Single file:       node insert-l2-metadata.js --file=path/to/file.md');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

function saveReport(inventory, outputPath) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: inventory.totalFiles,
      withMetadata: inventory.withMetadata,
      withoutMetadata: inventory.withoutMetadata,
      percentComplete: ((inventory.withMetadata / inventory.totalFiles) * 100).toFixed(1),
    },
    byCharacter: inventory.byCharacter,
    byPath: inventory.byPath,
    byState: inventory.byState,
    files: inventory.files.map((f) => ({
      filename: f.filename,
      path: f.path,
      variationId: f.variationId,
      character: f.character,
      pathPhilosophy: f.pathPhilosophy,
      transformationState: f.transformationState,
      hasMetadata: f.hasMetadata,
      analysis: f.analysis
        ? {
            wordCount: f.analysis.wordCount,
            estimatedAwarenessRange: f.analysis.estimatedAwarenessRange,
            emotionalTone: f.analysis.emotionalTone,
            primaryThemes: f.analysis.primaryThemes.map((t) => t.theme),
            crossCharacterRefs: f.analysis.crossCharacterRefs,
            awarenessIndicators: f.analysis.awarenessIndicators,
          }
        : null,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 Detailed report saved to: ${outputPath}\n`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const outputArg = args.find((a) => a.startsWith('--output='));
  const rootArg = args.find((a) => a.startsWith('--root='));
  const outputPath = outputArg ? outputArg.split('=')[1] : null;
  const roots = rootArg ? [rootArg.split('=')[1]] : CONFIG.searchPaths;

  console.log('Scanning for L2 variation files...\n');
  console.log('Search paths:', roots.join(', '));
  console.log('');

  const inventory = inventoryFiles(roots);

  printReport(inventory);

  if (outputPath) {
    saveReport(inventory, outputPath);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { inventoryFiles, printReport, saveReport };
