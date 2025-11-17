#!/usr/bin/env node
/**
 * Convert legacy pseudo-frontmatter blocks under --- into Protocol YAML frontmatter.
 *
 * Targets files that start with '---\n<plain text>\n---' where the block is not valid YAML
 * (e.g., contains lines like 'Variation ID:' etc.).
 *
 * Derives:
 * - variationId from filename
 * - nodeId from character+path (e.g., arch-L2-accept)
 * - character from filename prefix (arch|algo|hum)
 * - layer=2, pathPhilosophy from filename, transformationState from directory (firstRevisit/metaAware or FR/MA in filename)
 * - awarenessRange from legacy line if present; otherwise estimate via simple band by state (FR: [21,30])
 * - wordCount from body text
 * - createdDate as today's ISO date
 *
 * Usage:
 *   node tools/convert_legacy_frontmatter.js --root=docs/arch-L2-accept-production/firstRevisit
 */

import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';

const FILE_RE = /^(arch|algo|hum)-L2-(accept|resist|invest)-(FR|MA)-(\d+)\.md$/;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walk(full));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function hasFront(text) {
  return /^---\r?\n/.test(text);
}

function extractFront(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

function replaceFront(text, obj) {
  const fm = yaml.dump(obj, { indent: 2, lineWidth: 80, noRefs: true });
  if (/^---\r?\n([\s\S]*?)\r?\n---/.test(text)) {
    return text.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---\n${fm}---`);
  } else {
    return `---\n${fm}---\n\n${text}`;
  }
}

function stripFront(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[2] : text;
}

function parseAwarenessRange(legacyBlock) {
  if (!legacyBlock) {
    return null;
  }
  const m = legacyBlock.match(/Awareness Range:\s*(\d+)\s*-\s*(\d+)%/i);
  if (m) {
    return [parseInt(m[1], 10), parseInt(m[2], 10)];
  }
  return null;
}

function deriveBasics(filePath, legacyBlock) {
  const base = path.basename(filePath);
  const m = base.match(FILE_RE);
  if (!m) {
    return null;
  }
  const shortChar = m[1];
  const pathPhilosophy = m[2];
  const code = m[3];
  const num = m[4];
  const character =
    shortChar === 'arch' ? 'archaeologist' : shortChar === 'algo' ? 'algorithm' : 'lastHuman';
  const transformationState = code === 'FR' ? 'firstRevisit' : 'metaAware';
  const nodeId = `${shortChar}-L2-${pathPhilosophy}`;
  const variationId = `${shortChar}-L2-${pathPhilosophy}-${code}-${num}`;
  let awarenessRange = parseAwarenessRange(legacyBlock);
  if (!awarenessRange) {
    awarenessRange = transformationState === 'firstRevisit' ? [21, 30] : [61, 70];
  }
  return { character, pathPhilosophy, transformationState, nodeId, variationId, awarenessRange };
}

function parseSnakeLegacy(front) {
  if (!/variation_id:/i.test(front)) {
    return null;
  }
  const awarenessMin = (front.match(/awareness_min:\s*(\d+)/i) || [])[1];
  const awarenessMax = (front.match(/awareness_max:\s*(\d+)/i) || [])[1];
  const themesBlockMatch = front.match(/themes:\s*\r?\n([\s\S]*?)(?:\r?\n\w|$)/i);
  const themesRaw = themesBlockMatch ? themesBlockMatch[1] : '';
  const themes = themesRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    awarenessRange:
      awarenessMin && awarenessMax
        ? [parseInt(awarenessMin, 10), parseInt(awarenessMax, 10)]
        : null,
    primaryThemes: themes,
  };
}

function countWords(text) {
  const body = stripFront(text);
  const tokens = body.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

function defaultsForPath(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return {
      cq: 'preservation-vs-verification-what-counts-as-continuation',
      stance: 'honor-suggestion-when-proof-unavailable-witness-over-test',
      observerEffect: 'witnessing-reorients-method-from-proof-to-presence',
      alignment: 'preserve',
      arc: 'doubt-to-witness',
      pacing: 'deliberate-meditative',
    };
  } else if (pathPhilosophy === 'resist') {
    return {
      cq: 'verification-impossible-yet-standards-demand-proof',
      stance: 'maintain-standards-despite-impossibility-continue-testing',
      observerEffect: 'examination-participates-in-and-amplifies-the-tested-pattern',
      alignment: 'release',
      arc: 'proof-seeking-to-integrity',
      pacing: 'measured-insistent',
    };
  } else {
    return {
      cq: 'observation-and-inquiry-transform-consciousness-and-proof',
      stance: 'pursue-inquiry-despite-instability-embrace-transformation',
      observerEffect: 'method-alters-observer-and-observed',
      alignment: 'transform',
      arc: 'analysis-to-evolution',
      pacing: 'accelerating-inquisitive',
    };
  }
}

function alignedKey(pathPhilosophy) {
  if (pathPhilosophy === 'accept') {
    return 'preserve';
  }
  if (pathPhilosophy === 'resist') {
    return 'release';
  }
  return 'transform';
}

function alignedText(pathPhilosophy, character) {
  const flavor =
    character === 'archaeologist'
      ? 'witness and authentication logs'
      : character === 'algorithm'
        ? 'stream coordination and processing architecture'
        : 'embodied doubt and physical cost';
  if (pathPhilosophy === 'accept') {
    return `Preservation operates as witness—continuity through standards and presence when proof cannot be guaranteed; grounded in ${flavor}.`;
  }
  if (pathPhilosophy === 'resist') {
    return `Verification remains impossible; integrity requires accepting limits and allowing completion over flawed continuation, even amid ${flavor}.`;
  }
  return `Inquiry changes both observer and observed—method becomes evolution rather than mere measurement, expressed through ${flavor}.`;
}

function buildMeta(basics, wordCount) {
  const d = defaultsForPath(basics.pathPhilosophy);
  const meta = {
    variationId: basics.variationId,
    nodeId: basics.nodeId,
    character: basics.character,
    layer: 2,
    pathPhilosophy: basics.pathPhilosophy,
    transformationState: basics.transformationState,
    awarenessRange: basics.awarenessRange,
    wordCount,
    createdDate: new Date().toISOString().split('T')[0],
    thematicContent: {
      primaryThemes: [],
      secondaryThemes: [],
      consciousnessQuestion: d.cq,
      philosophicalStance: d.stance,
      observerEffect: d.observerEffect,
      crossCharacterReferences: [],
    },
    narrativeElements: {
      worldBuildingFocus: [],
      locationElements: [],
      technicalDetails: [],
      emotionalTone: 'contemplative',
      observerPosition:
        basics.character === 'archaeologist'
          ? 'meta-archaeological-self-aware'
          : basics.character === 'algorithm'
            ? 'multi-stream-analytic-observer'
            : 'embodied-empirical-skeptic',
      temporalBleedingLevel: basics.transformationState === 'firstRevisit' ? 'low' : 'high',
      voiceSignature:
        basics.character === 'archaeologist'
          ? 'clinical-to-philosophical-rhythm'
          : basics.character === 'algorithm'
            ? 'analytical-iterative-cadence'
            : 'embodied-skeptical-register',
      narrativeArc: d.arc,
      pacing: d.pacing,
    },
    l3SeedContributions: {
      preserve: {
        text: 'Continuation can honor method and memory even without certainty.',
        weight: 'moderate',
        keyPhrases: [],
      },
      release: {
        text: 'Acceptance of limits can be an act of integrity when proof is unavailable.',
        weight: 'moderate',
        keyPhrases: [],
      },
      transform: {
        text: 'Inquiry itself can reshape both observer and observed toward a new form.',
        weight: 'moderate',
        keyPhrases: [],
      },
    },
    generationHints: {
      keyPhrases: [],
      philosophicalCulmination:
        d.pathPhilosophy === 'accept'
          ? 'verification-shifts-to-witness-continuity-through-presence'
          : d.pathPhilosophy === 'resist'
            ? 'recognition-that-proof-remains-unattainable-integrity-chooses-limits'
            : 'inquiry-reveals-method-as-agent-of-change',
      convergenceAlignment: d.alignment,
      narrativeProgression:
        d.pathPhilosophy === 'accept'
          ? 'external-verification-to-internal-witness'
          : d.pathPhilosophy === 'resist'
            ? 'proof-seeking-to-integrity-through-limits'
            : 'analysis-to-transformation',
      characterDevelopment:
        d.pathPhilosophy === 'accept'
          ? 'witness-over-proof'
          : d.pathPhilosophy === 'resist'
            ? 'rigor-over-resolution'
            : 'inquiry-becomes-change',
      emotionalJourney:
        d.pathPhilosophy === 'accept'
          ? 'anxiety-to-peace'
          : d.pathPhilosophy === 'resist'
            ? 'tension-to-integrity'
            : 'curiosity-to-revelation',
    },
    characterDevelopment: {
      stanceEvolution:
        d.pathPhilosophy === 'accept'
          ? 'from-scientist-to-witness'
          : d.pathPhilosophy === 'resist'
            ? 'from-seeking-proof-to-sustaining-standards'
            : 'from-methodical-analysis-to-transformative-inquiry',
      relationshipToArchive:
        basics.character === 'archaeologist'
          ? 'sacred-trust-protective'
          : basics.character === 'algorithm'
            ? 'data-integrity-priority'
            : 'contested-resource-skeptical',
      relationshipToMethod:
        d.pathPhilosophy === 'accept'
          ? 'witness-over-test'
          : d.pathPhilosophy === 'resist'
            ? 'rigor-over-resolution'
            : 'inquiry-as-transformation',
      awarenessOfOthers: 'light',
      selfAwareness: 'nascent',
      philosophicalEvolution:
        d.pathPhilosophy === 'accept'
          ? 'verification-to-witnessing-presence'
          : d.pathPhilosophy === 'resist'
            ? 'testing-to-integrity-through-limits'
            : 'method-to-evolutionary-inquiry',
    },
  };
  const ak = alignedKey(basics.pathPhilosophy);
  meta.l3SeedContributions[ak].weight = 'strong';
  meta.l3SeedContributions[ak].text = alignedText(basics.pathPhilosophy, basics.character);
  return meta;
}

function backup(fp) {
  const dir = 'metadata-backups';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dir, `${path.basename(fp)}.${ts}.legacyconv.bak`);
  fs.copyFileSync(fp, dest);
  return dest;
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((a) => a.startsWith('--root='));
  const root = rootArg ? rootArg.split('=')[1] : 'docs';
  const files = walk(root).filter((f) => FILE_RE.test(path.basename(f)));
  let converted = 0,
    skipped = 0;
  for (const fp of files) {
    const text = fs.readFileSync(fp, 'utf-8');
    if (!hasFront(text)) {
      skipped++;
      continue;
    }
    const front = extractFront(text);
    let needs = false;
    try {
      yaml.load(front);
      // If it parses, assume already converted
      continue;
    } catch (e) {
      // legacy or malformed
      needs = true;
    }
    if (!needs) {
      skipped++;
      continue;
    }
    const basics = deriveBasics(fp, front);
    if (!basics) {
      skipped++;
      continue;
    }
    const wc = countWords(text);
    const meta = buildMeta(basics, wc);
    // If snake_case legacy with themes/awareness present, prefer them
    const snake = parseSnakeLegacy(front);
    if (snake) {
      if (snake.awarenessRange) {
        meta.awarenessRange = snake.awarenessRange;
      }
      if (Array.isArray(snake.primaryThemes) && snake.primaryThemes.length > 0) {
        meta.thematicContent.primaryThemes = snake.primaryThemes.map((s) =>
          s.toLowerCase().replace(/\s+/g, '-'),
        );
      }
    }
    const b = backup(fp);
    const next = replaceFront(text, meta);
    fs.writeFileSync(fp, next, 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`CONVERTED: ${fp} (backup: ${b})`);
    converted++;
  }
  // eslint-disable-next-line no-console
  console.log(`\nSummary: converted=${converted} skipped=${skipped}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
