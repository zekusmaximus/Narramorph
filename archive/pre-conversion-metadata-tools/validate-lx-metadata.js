#!/usr/bin/env node
/**
 * L1/L2 Metadata Validator
 *
 * Recursively scans markdown files under a root, extracts YAML frontmatter,
 * and validates required fields for L2 variations. Reports errors and warnings.
 *
 * Usage:
 *   node tools/validate-lx-metadata.js --root=docs [--strict]
 */

import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';

const CONFIG = {
  filenamePatternL2: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/,
  characterSet: new Set(['archaeologist', 'algorithm', 'lastHuman']),
  pathSet: new Set(['accept', 'resist', 'invest']),
  stateSet: new Set(['firstRevisit', 'metaAware']),
};

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

function hasFrontmatter(content) {
  return /^---\r?\n/.test(content);
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    return null;
  }
  try {
    return yaml.load(m[1]);
  } catch (e) {
    return { __parseError: e.message };
  }
}

function error(arr, msg) {
  arr.push(msg);
}
function warn(arr, msg) {
  arr.push(msg);
}

function validateL2(meta, _filename) {
  const errors = [];
  const warnings = [];

  if (!meta || typeof meta !== 'object') {
    error(errors, 'Missing or invalid frontmatter object');
    return { errors, warnings };
  }

  // Required identity
  if (!meta.variationId || typeof meta.variationId !== 'string') {
    error(errors, 'variationId missing');
  }
  if (!meta.nodeId || typeof meta.nodeId !== 'string') {
    error(errors, 'nodeId missing');
  }
  if (!meta.character || !CONFIG.characterSet.has(meta.character)) {
    error(errors, 'character missing/invalid');
  }
  if (meta.layer !== 2) {
    error(errors, 'layer must be 2');
  }
  if (!meta.pathPhilosophy || !CONFIG.pathSet.has(meta.pathPhilosophy)) {
    error(errors, 'pathPhilosophy missing/invalid');
  }
  if (!meta.transformationState || !CONFIG.stateSet.has(meta.transformationState)) {
    error(errors, 'transformationState missing/invalid');
  }

  // Awareness range
  if (!Array.isArray(meta.awarenessRange) || meta.awarenessRange.length !== 2) {
    error(errors, 'awarenessRange must be [min,max]');
  } else {
    const [min, max] = meta.awarenessRange;
    if (typeof min !== 'number' || typeof max !== 'number') {
      error(errors, 'awarenessRange values must be numbers');
    }
    const band = meta.transformationState === 'firstRevisit' ? [21, 60] : [61, 100];
    if (!(min >= band[0] && max <= band[1])) {
      warn(warnings, `awarenessRange ${min}-${max} outside expected band ${band[0]}-${band[1]}`);
    }
  }

  if (typeof meta.wordCount !== 'number' || meta.wordCount <= 0) {
    warn(warnings, 'wordCount missing or non-positive');
  }
  if (!meta.createdDate || typeof meta.createdDate !== 'string') {
    warn(warnings, 'createdDate missing');
  }

  // Thematic + hints minimal set
  const primaryThemes = meta?.thematicContent?.primaryThemes;
  if (!Array.isArray(primaryThemes) || primaryThemes.length === 0) {
    warn(warnings, 'thematicContent.primaryThemes empty');
  }

  const keyPhrases = meta?.generationHints?.keyPhrases;
  if (!Array.isArray(keyPhrases) || keyPhrases.length === 0) {
    warn(warnings, 'generationHints.keyPhrases empty');
  }

  // Flags for batch placeholders
  const hasReviewRequired = JSON.stringify(meta).includes('REVIEW_REQUIRED');
  if (hasReviewRequired) {
    warn(warnings, 'Contains REVIEW_REQUIRED placeholders');
  }

  return { errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((a) => a.startsWith('--root='));
  const strict = args.includes('--strict');
  const root = rootArg ? rootArg.split('=')[1] : 'docs';

  console.log(`Scanning: ${root}`);
  const files = walkFiles(root).filter((f) => f.toLowerCase().endsWith('.md'));

  let total = 0,
    ok = 0,
    invalid = 0,
    warned = 0,
    skipped = 0;
  const report = [];

  for (const file of files) {
    const base = path.basename(file);
    const isL2 = CONFIG.filenamePatternL2.test(base);
    if (!isL2) {
      skipped++;
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    total++;

    if (!hasFrontmatter(content)) {
      report.push({ file, errors: ['Missing frontmatter'], warnings: [] });
      invalid++;
      continue;
    }
    const meta = parseFrontmatter(content);
    if (meta && meta.__parseError) {
      report.push({ file, errors: ['YAML parse error: ' + meta.__parseError], warnings: [] });
      invalid++;
      continue;
    }

    const { errors, warnings } = validateL2(meta, base);
    if (errors.length === 0 && (!strict || warnings.length === 0)) {
      ok++;
    } else if (errors.length === 0) {
      warned++;
    } else {
      invalid++;
    }

    if (errors.length || warnings.length) {
      report.push({ file, errors, warnings });
    }
  }

  console.log(`\nValidation Results (L2 only):`);
  console.log(`  Total L2 files: ${total}`);
  console.log(`  OK:     ${ok}`);
  console.log(`  Warned: ${warned}`);
  console.log(`  Invalid:${invalid}`);
  console.log(`  Skipped (non-L2): ${skipped}`);

  if (report.length) {
    console.log('\nDetails:');
    for (const r of report) {
      console.log(`\n${r.file}`);
      for (const e of r.errors) {
        console.log(`  ERROR: ${e}`);
      }
      for (const w of r.warnings) {
        console.log(`  WARN:  ${w}`);
      }
    }
  }

  if (invalid > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
