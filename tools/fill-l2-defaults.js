#!/usr/bin/env node
/**
 * L2 Default Filler (Autoprep for L3)
 *
 * Fills critical metadata fields across L2 files to make them L3-ready with minimal human effort.
 * - Sets convergenceAlignment by path (accept→preserve, resist→release, invest→transform)
 * - Strengthens aligned l3SeedContributions.<aligned>.weight to "strong" (others default to "moderate" if missing)
 * - Populates aligned l3SeedContributions.<aligned>.text with path/character-aware defaults (if REVIEW_REQUIRED/missing)
 * - Populates consciousnessQuestion and philosophicalStance with path defaults (only when REVIEW_REQUIRED/missing)
 * - Ensures generationHints.keyPhrases has at least 5; tops up using analyzer if needed
 *
 * Safe and idempotent: updates only when values are missing or set to REVIEW_REQUIRED.
 *
 * Usage:
 *   node tools/fill-l2-defaults.js --root=docs [--dry-run] [--path=accept|resist|invest] [--character=arch|algo|hum]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Reuse analyzer from insert script
const insertMod = require('./insert-l2-metadata.js');
const analyzeContent = insertMod.analyzeContent;

const CONFIG = {
  root: 'docs',
  filenamePattern: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/,
  characters: { arch: 'archaeologist', algo: 'algorithm', hum: 'lastHuman' }
};

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function hasFrontmatter(text) {
  return /^---\r?\n/.test(text);
}

function extractFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try { return yaml.load(m[1]); } catch (e) { return { __parseError: e.message }; }
}

function replaceFrontmatter(text, metaObj) {
  const fm = yaml.dump(metaObj, { indent: 2, lineWidth: 80, noRefs: true });
  if (/^---\r?\n([\s\S]*?)\r?\n---/.test(text)) {
    return text.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---\n${fm}---`);
  } else {
    return `---\n${fm}---\n\n${text}`;
  }
}

function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[2] : text;
}

function parsePathPhilosophy(meta, filename) {
  if (meta && meta.pathPhilosophy) return meta.pathPhilosophy;
  const base = path.basename(filename);
  const m = base.match(CONFIG.filenamePattern);
  return m ? m[2] : null;
}

function parseCharacter(meta, filename) {
  if (meta && meta.character) return meta.character;
  const base = path.basename(filename);
  const m = base.match(CONFIG.filenamePattern);
  if (!m) return null;
  const short = m[1];
  return short === 'arch' ? 'archaeologist' : short === 'algo' ? 'algorithm' : 'lastHuman';
}

function alignmentByPath(pathPhilosophy) {
  if (pathPhilosophy === 'accept') return 'preserve';
  if (pathPhilosophy === 'resist') return 'release';
  if (pathPhilosophy === 'invest') return 'transform';
  return null;
}

function defaultCQ(pathPhilosophy) {
  if (pathPhilosophy === 'accept') return 'preservation-vs-verification-what-counts-as-continuation';
  if (pathPhilosophy === 'resist') return 'verification-impossible-yet-standards-demand-proof';
  return 'observation-and-inquiry-transform-consciousness-and-proof'; // invest
}

function defaultStance(pathPhilosophy) {
  if (pathPhilosophy === 'accept') return 'honor-suggestion-when-proof-unavailable-witness-over-test';
  if (pathPhilosophy === 'resist') return 'maintain-standards-despite-impossibility-continue-testing';
  return 'pursue-inquiry-despite-instability-embrace-transformation'; // invest
}

function alignedSeedKey(pathPhilosophy) {
  if (pathPhilosophy === 'accept') return 'preserve';
  if (pathPhilosophy === 'resist') return 'release';
  return 'transform';
}

function defaultAlignedSeedText(pathPhilosophy, character) {
  const charFlavor = character === 'archaeologist'
    ? 'witness and authentication logs'
    : character === 'algorithm'
    ? 'stream coordination and processing architecture'
    : 'embodied doubt and physical cost';

  if (pathPhilosophy === 'accept') {
    return `Preservation operates as witness—continuity through standards and presence when proof cannot be guaranteed; grounded in ${charFlavor}.`;
  }
  if (pathPhilosophy === 'resist') {
    return `Verification remains impossible; integrity requires accepting limits and allowing completion over flawed continuation, even amid ${charFlavor}.`;
  }
  return `Inquiry changes both observer and observed—method becomes evolution rather than mere measurement, expressed through ${charFlavor}.`;
}

function ensureArray(arr) { return Array.isArray(arr) ? arr : []; }

function topUpKeyPhrases(meta, bodyText) {
  meta.generationHints = meta.generationHints || {};
  let kp = ensureArray(meta.generationHints.keyPhrases);
  if (kp.length >= 5) return; // good enough
  // Analyze content (without frontmatter) to extract phrases
  const analysis = analyzeContent(bodyText);
  const add = ensureArray(analysis.keyPhrases).slice(0, 10);
  const merged = Array.from(new Set([...kp, ...add])).filter(Boolean).slice(0, 10);
  meta.generationHints.keyPhrases = merged;
}

function fillDefaultsForMeta(meta, filename, bodyText, scopeFilters) {
  const before = JSON.stringify(meta);

  const character = parseCharacter(meta, filename);
  const pathPhilosophy = parsePathPhilosophy(meta, filename);
  if (scopeFilters.path && scopeFilters.path !== pathPhilosophy) return { changed: false, reason: 'filtered' };
  if (scopeFilters.character && scopeFilters.character !== character) return { changed: false, reason: 'filtered' };

  // convergenceAlignment
  const alignment = alignmentByPath(pathPhilosophy);
  meta.generationHints = meta.generationHints || {};
  if (!meta.generationHints.convergenceAlignment || meta.generationHints.convergenceAlignment === 'REVIEW_REQUIRED') {
    if (alignment) meta.generationHints.convergenceAlignment = alignment;
  }

  // consciousnessQuestion / philosophicalStance
  meta.thematicContent = meta.thematicContent || {};
  if (!meta.thematicContent.consciousnessQuestion || meta.thematicContent.consciousnessQuestion === 'REVIEW_REQUIRED') {
    meta.thematicContent.consciousnessQuestion = defaultCQ(pathPhilosophy);
  }
  if (!meta.thematicContent.philosophicalStance || meta.thematicContent.philosophicalStance === 'REVIEW_REQUIRED') {
    meta.thematicContent.philosophicalStance = defaultStance(pathPhilosophy);
  }

  // observerEffect / philosophicalCulmination (soft defaults)
  if (!meta.thematicContent.observerEffect || meta.thematicContent.observerEffect === 'REVIEW_REQUIRED') {
    if (pathPhilosophy === 'accept') {
      meta.thematicContent.observerEffect = 'witnessing-reorients-method-from-proof-to-presence';
    } else if (pathPhilosophy === 'resist') {
      meta.thematicContent.observerEffect = 'examination-participates-in-and-amplifies-the-tested-pattern';
    } else {
      meta.thematicContent.observerEffect = 'method-alters-observer-and-observed';
    }
  }
  if (!meta.generationHints.philosophicalCulmination || meta.generationHints.philosophicalCulmination === 'REVIEW_REQUIRED') {
    if (pathPhilosophy === 'accept') {
      meta.generationHints.philosophicalCulmination = 'verification-shifts-to-witness-continuity-through-presence';
    } else if (pathPhilosophy === 'resist') {
      meta.generationHints.philosophicalCulmination = 'recognition-that-proof-remains-unattainable-integrity-chooses-limits';
    } else {
      meta.generationHints.philosophicalCulmination = 'inquiry-reveals-method-as-agent-of-change';
    }
  }

  // Seeds
  meta.l3SeedContributions = meta.l3SeedContributions || {};
  const alignedKey = alignedSeedKey(pathPhilosophy);
  for (const key of ['preserve', 'release', 'transform']) {
    meta.l3SeedContributions[key] = meta.l3SeedContributions[key] || { text: 'REVIEW_REQUIRED', weight: 'moderate', keyPhrases: [] };
  }
  // aligned seed: strong + text if missing
  const alignedSeed = meta.l3SeedContributions[alignedKey];
  if (!alignedSeed.weight || alignedSeed.weight === 'REVIEW_REQUIRED' || alignedSeed.weight === 'moderate') {
    alignedSeed.weight = 'strong';
  }
  if (!alignedSeed.text || alignedSeed.text === 'REVIEW_REQUIRED') {
    alignedSeed.text = defaultAlignedSeedText(pathPhilosophy, character);
  }

  // Make sure other seeds at least have a moderate weight
  for (const key of ['preserve', 'release', 'transform']) {
    if (key === alignedKey) continue;
    if (!meta.l3SeedContributions[key].weight || meta.l3SeedContributions[key].weight === 'REVIEW_REQUIRED') {
      meta.l3SeedContributions[key].weight = 'moderate';
    }
  }

  // Key phrases top-up
  topUpKeyPhrases(meta, bodyText);

  const after = JSON.stringify(meta);
  return { changed: before !== after };
}

function backup(pathname) {
  const dir = 'metadata-backups';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = path.basename(pathname);
  const dest = path.join(dir, `${name}.${ts}.autofill.bak`);
  fs.copyFileSync(pathname, dest);
  return dest;
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find(a => a.startsWith('--root='));
  const dryRun = args.includes('--dry-run');
  const pathArg = args.find(a => a.startsWith('--path='));
  const charArg = args.find(a => a.startsWith('--character='));

  const root = rootArg ? rootArg.split('=')[1] : CONFIG.root;
  const scope = {
    path: pathArg ? pathArg.split('=')[1] : null,
    character: charArg ? (charArg.split('=')[1] === 'arch' ? 'archaeologist' : charArg.split('=')[1] === 'algo' ? 'algorithm' : charArg.split('=')[1] === 'hum' ? 'lastHuman' : null) : null
  };

  const files = walkFiles(root).filter(f => CONFIG.filenamePattern.test(path.basename(f)));
  let processed = 0, changed = 0, skipped = 0;

  console.log(`Autofilling L2 defaults under: ${root}`);
  if (scope.path) console.log(`  Scope path: ${scope.path}`);
  if (scope.character) console.log(`  Scope character: ${scope.character}`);
  console.log(`Found ${files.length} L2 file(s)\n`);

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf-8');
    if (!hasFrontmatter(text)) { skipped++; continue; }
    const meta = extractFrontmatter(text);
    if (!meta || meta.__parseError) { skipped++; continue; }
    const body = stripFrontmatter(text);

    const res = fillDefaultsForMeta(meta, file, body, scope);
    processed++;
    if (!res.changed) continue;

    if (dryRun) {
      console.log(`DRY: ${file}`);
      changed++;
      continue;
    }
    const b = backup(file);
    const newText = replaceFrontmatter(text, meta);
    fs.writeFileSync(file, newText, 'utf-8');
    console.log(`UPDATED: ${file}  (backup: ${b})`);
    changed++;
  }

  console.log(`\nSummary: processed=${processed} changed=${changed} skipped=${skipped}`);
  if (dryRun) console.log('Note: dry-run only, no files written.');
}

if (require.main === module) {
  main();
}

module.exports = { main };

