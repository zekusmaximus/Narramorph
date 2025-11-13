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

import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';

// Reuse analyzer from insert script
import { analyzeContent } from './insert-l2-metadata.js';

const CONFIG = {
  root: 'docs',
  filenamePattern: /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/,
  characters: { arch: 'archaeologist', algo: 'algorithm', hum: 'lastHuman' },
};

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function hasFrontmatter(text) {
  return /^---\r?\n/.test(text);
}

function extractFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    return null;
  }
  try {
    return yaml.load(m[1]);
  } catch (e) {
    return { __parseError: e.message };
  }
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
  if (meta && meta.pathPhilosophy) {
    return meta.pathPhilosophy;
  }
  const base = path.basename(filename);
  const m = base.match(CONFIG.filenamePattern);
  return m ? m[2] : null;
}

function parseCharacter(meta, filename) {
  if (meta && meta.character) {
    return meta.character;
  }
  const base = path.basename(filename);
  const m = base.match(CONFIG.filenamePattern);
  if (!m) {
    return null;
  }
  const short = m[1];
  return short === 'arch' ? 'archaeologist' : short === 'algo' ? 'algorithm' : 'lastHuman';
}

function alignmentByPath(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return 'preserve';
  }
  if (pathPhilosophy === 'resist') {
    return 'release';
  }
  if (pathPhilosophy === 'invest') {
    return 'transform';
  }
  return null;
}

function defaultCQ(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return 'preservation-vs-verification-what-counts-as-continuation';
  }
  if (pathPhilosophy === 'resist') {
    return 'verification-impossible-yet-standards-demand-proof';
  }
  return 'observation-and-inquiry-transform-consciousness-and-proof'; // invest
}

function defaultStance(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return 'honor-suggestion-when-proof-unavailable-witness-over-test';
  }
  if (pathPhilosophy === 'resist') {
    return 'maintain-standards-despite-impossibility-continue-testing';
  }
  return 'pursue-inquiry-despite-instability-embrace-transformation'; // invest
}

function alignedSeedKey(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return 'preserve';
  }
  if (pathPhilosophy === 'resist') {
    return 'release';
  }
  return 'transform';
}

function defaultAlignedSeedText(pathPhilosophy, character) {
  const charFlavor =
    character === 'archaeologist'
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

function ensureArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function topUpKeyPhrases(meta, bodyText, pathPhilosophy, _character) {
  meta.generationHints = meta.generationHints || {};
  let kp = ensureArray(meta.generationHints.keyPhrases);
  if (kp.length >= 5) {
    return;
  } // good enough
  // Analyze content (without frontmatter) to extract phrases
  const analysis = analyzeContent(bodyText);
  const add = ensureArray(analysis.keyPhrases).slice(0, 10);
  let merged = Array.from(new Set([...kp, ...add])).filter(Boolean);
  // Fallback stock phrases by path if still short
  if (merged.length < 5) {
    const stock =
      pathPhilosophy === 'accept'
        ? [
            'witness rather than test',
            'authentication without certainty',
            'precision to presence',
            'continuity through care',
            'verification shifts to witness',
          ]
        : pathPhilosophy === 'resist'
          ? [
              'verification impossible',
              'maintain standards',
              'accept limits over recursion',
              'rigor over resolution',
              'end the loop',
            ]
          : [
              'method becomes evolution',
              'observer and observed co‑shape',
              'inquiry transforms proof',
              'analysis to transformation',
              'streams recognize pattern',
            ];
    merged = Array.from(new Set([...merged, ...stock])).slice(0, 10);
  }
  meta.generationHints.keyPhrases = merged;
}

function fillDefaultsForMeta(meta, filename, bodyText, scopeFilters) {
  const before = JSON.stringify(meta);

  const character = parseCharacter(meta, filename);
  const pathPhilosophy = parsePathPhilosophy(meta, filename);
  if (scopeFilters.path && scopeFilters.path !== pathPhilosophy) {
    return { changed: false, reason: 'filtered' };
  }
  if (scopeFilters.character && scopeFilters.character !== character) {
    return { changed: false, reason: 'filtered' };
  }

  // convergenceAlignment
  const alignment = alignmentByPath(pathPhilosophy);
  meta.generationHints = meta.generationHints || {};
  if (
    !meta.generationHints.convergenceAlignment ||
    meta.generationHints.convergenceAlignment === 'REVIEW_REQUIRED'
  ) {
    if (alignment) {
      meta.generationHints.convergenceAlignment = alignment;
    }
  }

  // consciousnessQuestion / philosophicalStance
  meta.thematicContent = meta.thematicContent || {};
  if (
    !meta.thematicContent.consciousnessQuestion ||
    meta.thematicContent.consciousnessQuestion === 'REVIEW_REQUIRED'
  ) {
    meta.thematicContent.consciousnessQuestion = defaultCQ(pathPhilosophy);
  }
  if (
    !meta.thematicContent.philosophicalStance ||
    meta.thematicContent.philosophicalStance === 'REVIEW_REQUIRED'
  ) {
    meta.thematicContent.philosophicalStance = defaultStance(pathPhilosophy);
  }

  // observerEffect / philosophicalCulmination (soft defaults)
  if (
    !meta.thematicContent.observerEffect ||
    meta.thematicContent.observerEffect === 'REVIEW_REQUIRED'
  ) {
    if (pathPhilosophy === 'accept') {
      meta.thematicContent.observerEffect = 'witnessing-reorients-method-from-proof-to-presence';
    } else if (pathPhilosophy === 'resist') {
      meta.thematicContent.observerEffect =
        'examination-participates-in-and-amplifies-the-tested-pattern';
    } else {
      meta.thematicContent.observerEffect = 'method-alters-observer-and-observed';
    }
  }
  if (
    !meta.generationHints.philosophicalCulmination ||
    meta.generationHints.philosophicalCulmination === 'REVIEW_REQUIRED'
  ) {
    if (pathPhilosophy === 'accept') {
      meta.generationHints.philosophicalCulmination =
        'verification-shifts-to-witness-continuity-through-presence';
    } else if (pathPhilosophy === 'resist') {
      meta.generationHints.philosophicalCulmination =
        'recognition-that-proof-remains-unattainable-integrity-chooses-limits';
    } else {
      meta.generationHints.philosophicalCulmination = 'inquiry-reveals-method-as-agent-of-change';
    }
  }

  // Seeds
  meta.l3SeedContributions = meta.l3SeedContributions || {};
  const alignedKey = alignedSeedKey(pathPhilosophy);
  for (const key of ['preserve', 'release', 'transform']) {
    meta.l3SeedContributions[key] = meta.l3SeedContributions[key] || {
      text: 'REVIEW_REQUIRED',
      weight: 'moderate',
      keyPhrases: [],
    };
  }
  // aligned seed: strong + text if missing
  const alignedSeed = meta.l3SeedContributions[alignedKey];
  if (
    !alignedSeed.weight ||
    alignedSeed.weight === 'REVIEW_REQUIRED' ||
    alignedSeed.weight === 'moderate'
  ) {
    alignedSeed.weight = 'strong';
  }
  if (!alignedSeed.text || alignedSeed.text === 'REVIEW_REQUIRED') {
    alignedSeed.text = defaultAlignedSeedText(pathPhilosophy, character);
  }

  // Make sure other seeds at least have a moderate weight
  for (const key of ['preserve', 'release', 'transform']) {
    if (key === alignedKey) {
      continue;
    }
    if (
      !meta.l3SeedContributions[key].weight ||
      meta.l3SeedContributions[key].weight === 'REVIEW_REQUIRED'
    ) {
      meta.l3SeedContributions[key].weight = 'moderate';
    }
    if (
      !meta.l3SeedContributions[key].text ||
      meta.l3SeedContributions[key].text === 'REVIEW_REQUIRED'
    ) {
      // Short neutral text for non-aligned seeds
      if (key === 'preserve') {
        meta.l3SeedContributions[key].text =
          'Continuation can honor method and memory even without certainty.';
      } else if (key === 'release') {
        meta.l3SeedContributions[key].text =
          'Acceptance of limits can be an act of integrity when proof is unavailable.';
      } else {
        meta.l3SeedContributions[key].text =
          'Inquiry itself can reshape both observer and observed toward a new form.';
      }
    }
  }

  // Analyze once for multiple features
  const analysis = analyzeContent(bodyText);

  // Key phrases top-up
  topUpKeyPhrases(meta, bodyText, pathPhilosophy, character);

  // Primary themes top-up (take top 3-5 theme names from analyzer)
  meta.thematicContent = meta.thematicContent || {};
  if (
    !Array.isArray(meta.thematicContent.primaryThemes) ||
    meta.thematicContent.primaryThemes.length === 0
  ) {
    const themes = (analysis.primaryThemes || [])
      .map((t) => (typeof t === 'string' ? t : t.theme))
      .filter(Boolean)
      .slice(0, 5);
    if (themes.length > 0) {
      meta.thematicContent.primaryThemes = themes;
    }
  }

  // Fill createdDate/wordCount if missing or zero
  if (!meta.createdDate) {
    meta.createdDate = new Date().toISOString().split('T')[0];
  }
  if (typeof meta.wordCount !== 'number' || meta.wordCount <= 0) {
    // approximate by counting tokens in body
    const wc = bodyText.trim().split(/\s+/).filter(Boolean).length;
    meta.wordCount = wc;
  }

  // Additional defaults to remove remaining REVIEW_REQUIRED conservatively
  function isMissing(v) {
    return v === undefined || v === null || v === '' || v === 'REVIEW_REQUIRED';
  }
  function awarenessBand() {
    const rng = Array.isArray(meta.awarenessRange) ? meta.awarenessRange : [];
    const max = rng[1] || 0;
    if (max >= 71) {
      return 'high';
    }
    if (max >= 41) {
      return 'moderate';
    }
    return 'low';
  }
  const band = awarenessBand();

  // narrativeElements
  meta.narrativeElements = meta.narrativeElements || {};
  if (isMissing(meta.narrativeElements.observerPosition)) {
    if (character === 'archaeologist') {
      meta.narrativeElements.observerPosition = 'meta-archaeological-self-aware';
    } else if (character === 'algorithm') {
      meta.narrativeElements.observerPosition = 'multi-stream-analytic-observer';
    } else {
      meta.narrativeElements.observerPosition = 'embodied-empirical-skeptic';
    }
  }
  if (isMissing(meta.narrativeElements.temporalBleedingLevel)) {
    meta.narrativeElements.temporalBleedingLevel = band;
  }
  if (isMissing(meta.narrativeElements.voiceSignature)) {
    if (character === 'archaeologist') {
      meta.narrativeElements.voiceSignature = 'clinical-to-philosophical-rhythm';
    } else if (character === 'algorithm') {
      meta.narrativeElements.voiceSignature = 'analytical-iterative-cadence';
    } else {
      meta.narrativeElements.voiceSignature = 'embodied-skeptical-register';
    }
  }
  if (isMissing(meta.narrativeElements.narrativeArc)) {
    if (pathPhilosophy === 'accept') {
      meta.narrativeElements.narrativeArc = 'doubt-to-witness';
    } else if (pathPhilosophy === 'resist') {
      meta.narrativeElements.narrativeArc = 'proof-seeking-to-integrity';
    } else {
      meta.narrativeElements.narrativeArc = 'analysis-to-evolution';
    }
  }
  if (isMissing(meta.narrativeElements.pacing)) {
    if (pathPhilosophy === 'accept') {
      meta.narrativeElements.pacing = 'deliberate-meditative';
    } else if (pathPhilosophy === 'resist') {
      meta.narrativeElements.pacing = 'measured-insistent';
    } else {
      meta.narrativeElements.pacing = 'accelerating-inquisitive';
    }
  }

  // characterDevelopment
  meta.characterDevelopment = meta.characterDevelopment || {};
  if (isMissing(meta.characterDevelopment.stanceEvolution)) {
    if (pathPhilosophy === 'accept') {
      meta.characterDevelopment.stanceEvolution = 'from-scientist-to-witness';
    } else if (pathPhilosophy === 'resist') {
      meta.characterDevelopment.stanceEvolution = 'from-seeking-proof-to-sustaining-standards';
    } else {
      meta.characterDevelopment.stanceEvolution =
        'from-methodical-analysis-to-transformative-inquiry';
    }
  }
  if (isMissing(meta.characterDevelopment.relationshipToArchive)) {
    if (character === 'archaeologist') {
      meta.characterDevelopment.relationshipToArchive = 'sacred-trust-protective';
    } else if (character === 'algorithm') {
      meta.characterDevelopment.relationshipToArchive = 'data-integrity-priority';
    } else {
      meta.characterDevelopment.relationshipToArchive = 'contested-resource-skeptical';
    }
  }
  if (isMissing(meta.characterDevelopment.relationshipToMethod)) {
    if (pathPhilosophy === 'accept') {
      meta.characterDevelopment.relationshipToMethod = 'witness-over-test';
    } else if (pathPhilosophy === 'resist') {
      meta.characterDevelopment.relationshipToMethod = 'rigor-over-resolution';
    } else {
      meta.characterDevelopment.relationshipToMethod = 'inquiry-as-transformation';
    }
  }
  if (isMissing(meta.characterDevelopment.awarenessOfOthers)) {
    // heuristic: use band to scale
    meta.characterDevelopment.awarenessOfOthers =
      band === 'high' ? 'strong' : band === 'moderate' ? 'moderate' : 'light';
  }
  if (isMissing(meta.characterDevelopment.selfAwareness)) {
    meta.characterDevelopment.selfAwareness =
      band === 'high' ? 'high' : band === 'moderate' ? 'emerging' : 'nascent';
  }
  if (isMissing(meta.characterDevelopment.philosophicalEvolution)) {
    if (pathPhilosophy === 'accept') {
      meta.characterDevelopment.philosophicalEvolution = 'verification-to-witnessing-presence';
    } else if (pathPhilosophy === 'resist') {
      meta.characterDevelopment.philosophicalEvolution = 'testing-to-integrity-through-limits';
    } else {
      meta.characterDevelopment.philosophicalEvolution = 'method-to-evolutionary-inquiry';
    }
  }

  // generationHints additional fields
  if (isMissing(meta.generationHints.narrativeProgression)) {
    if (pathPhilosophy === 'accept') {
      meta.generationHints.narrativeProgression = 'external-verification-to-internal-witness';
    } else if (pathPhilosophy === 'resist') {
      meta.generationHints.narrativeProgression = 'proof-seeking-to-integrity-through-limits';
    } else {
      meta.generationHints.narrativeProgression = 'analysis-to-transformation';
    }
  }
  if (isMissing(meta.generationHints.characterDevelopment)) {
    if (pathPhilosophy === 'accept') {
      meta.generationHints.characterDevelopment = 'witness-over-proof';
    } else if (pathPhilosophy === 'resist') {
      meta.generationHints.characterDevelopment = 'rigor-over-resolution';
    } else {
      meta.generationHints.characterDevelopment = 'inquiry-becomes-change';
    }
  }
  if (isMissing(meta.generationHints.emotionalJourney)) {
    if (pathPhilosophy === 'accept') {
      meta.generationHints.emotionalJourney = 'anxiety-to-peace';
    } else if (pathPhilosophy === 'resist') {
      meta.generationHints.emotionalJourney = 'tension-to-integrity';
    } else {
      meta.generationHints.emotionalJourney = 'curiosity-to-revelation';
    }
  }

  const after = JSON.stringify(meta);
  return { changed: before !== after };
}

function backup(pathname) {
  const dir = 'metadata-backups';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = path.basename(pathname);
  const dest = path.join(dir, `${name}.${ts}.autofill.bak`);
  fs.copyFileSync(pathname, dest);
  return dest;
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((a) => a.startsWith('--root='));
  const dryRun = args.includes('--dry-run');
  const pathArg = args.find((a) => a.startsWith('--path='));
  const charArg = args.find((a) => a.startsWith('--character='));

  const root = rootArg ? rootArg.split('=')[1] : CONFIG.root;
  const scope = {
    path: pathArg ? pathArg.split('=')[1] : null,
    character: charArg
      ? charArg.split('=')[1] === 'arch'
        ? 'archaeologist'
        : charArg.split('=')[1] === 'algo'
          ? 'algorithm'
          : charArg.split('=')[1] === 'hum'
            ? 'lastHuman'
            : null
      : null,
  };

  const files = walkFiles(root).filter((f) => CONFIG.filenamePattern.test(path.basename(f)));
  let processed = 0,
    changed = 0,
    skipped = 0;

  // eslint-disable-next-line no-console
  console.log(`Autofilling L2 defaults under: ${root}`);
  if (scope.path) {
    // eslint-disable-next-line no-console
    console.log(`  Scope path: ${scope.path}`);
  }
  if (scope.character) {
    // eslint-disable-next-line no-console
    console.log(`  Scope character: ${scope.character}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Found ${files.length} L2 file(s)\n`);

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf-8');
    if (!hasFrontmatter(text)) {
      skipped++;
      continue;
    }
    const meta = extractFrontmatter(text);
    if (!meta || meta.__parseError) {
      skipped++;
      continue;
    }
    const body = stripFrontmatter(text);

    const res = fillDefaultsForMeta(meta, file, body, scope);
    processed++;
    if (!res.changed) {
      continue;
    }

    if (dryRun) {
      // eslint-disable-next-line no-console
      console.log(`DRY: ${file}`);
      changed++;
      continue;
    }
    const b = backup(file);
    const newText = replaceFrontmatter(text, meta);
    fs.writeFileSync(file, newText, 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`UPDATED: ${file}  (backup: ${b})`);
    changed++;
  }

  // eslint-disable-next-line no-console
  console.log(`\nSummary: processed=${processed} changed=${changed} skipped=${skipped}`);
  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('Note: dry-run only, no files written.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
