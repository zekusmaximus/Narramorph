import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CANON_RULES_SCHEMA_VERSION = '1.0.0';
export const CANON_WAIVERS_SCHEMA_VERSION = '1.0.0';

export interface CanonPattern {
  regex: string;
  note: string;
}

export interface CanonRules {
  schemaVersion: string;
  storyId: string;
  provenance: {
    sourceRepository: string;
    sourceCommit: string;
    portedAt: string;
    note: string;
    sourceFiles: string[];
  };
  shackles: Record<string, { description: string; patterns: CanonPattern[] }>;
  forbiddenMoves: Record<string, { description: string; patterns: CanonPattern[] }>;
  terminology: {
    description: string;
    forbiddenTerms: Array<{ id: string; regex: string; canonical: string; note: string }>;
  };
  chronology: {
    description: string;
    absoluteDatePatterns: CanonPattern[];
  };
  voices: {
    description: string;
    profiles: Record<
      string,
      {
        signaturePatterns: CanonPattern[];
        contamination: Record<string, CanonPattern[]>;
      }
    >;
  };
  designedRepetition: {
    description: string;
    phrases: string[];
    rhymes: string[];
  };
}

export interface CanonWaiver {
  id: string;
  ruleId: string;
  scope: { family?: string; variation?: string };
  rationale: string;
  approvedBy: string;
  expires: string;
  recordedAt: string;
}

export interface CanonWaiverFile {
  schemaVersion: string;
  storyId: string;
  description: string;
  waivers: CanonWaiver[];
}

export type CanonSeverity = 'error' | 'warning';

export interface CanonFinding {
  severity: CanonSeverity;
  ruleId: string;
  note: string;
  family: string;
  variationId: string;
  line: number;
  excerpt: string;
  waived: boolean;
  waiverId: string | null;
}

export interface CanonReport {
  schemaVersion: string;
  storyId: string;
  rulesProvenance: CanonRules['provenance'];
  asOf: string;
  corpus: { families: number; variations: number };
  summary: {
    errors: number;
    warnings: number;
    waived: number;
    expiredWaivers: number;
    byRule: Record<string, number>;
  };
  findings: CanonFinding[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(label + ' must be a non-empty string.');
  }
  return value;
}

function requirePatterns(value: unknown, label: string): CanonPattern[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(label + ' must be a non-empty array.');
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(label + ' item ' + index + ' must be an object.');
    }
    const regex = requireString(item.regex, label + ' item ' + index + ' regex');
    try {
      new RegExp(regex, 'i');
    } catch (error) {
      throw new Error(label + ' item ' + index + ' is not a valid pattern: ' + String(error));
    }
    return { regex, note: requireString(item.note, label + ' item ' + index + ' note') };
  });
}

export function validateCanonRules(value: unknown): CanonRules {
  if (!isRecord(value)) {
    throw new Error('Canon rules must be an object.');
  }
  if (value.schemaVersion !== CANON_RULES_SCHEMA_VERSION) {
    throw new Error('Unsupported canon rules schema: ' + String(value.schemaVersion));
  }
  const rules = value as unknown as CanonRules;
  requireString(rules.provenance?.sourceCommit, 'Canon rules source commit');
  for (const [name, group] of Object.entries(rules.shackles)) {
    requirePatterns(group.patterns, 'Shackle patterns for ' + name);
  }
  for (const [name, group] of Object.entries(rules.forbiddenMoves)) {
    requirePatterns(group.patterns, 'Forbidden-move patterns for ' + name);
  }
  for (const term of rules.terminology.forbiddenTerms) {
    requireString(term.id, 'Terminology rule id');
    requirePatterns([{ regex: term.regex, note: term.note }], 'Terminology rule ' + term.id);
  }
  requirePatterns(rules.chronology.absoluteDatePatterns, 'Chronology patterns');
  for (const [voiceId, profile] of Object.entries(rules.voices.profiles)) {
    requirePatterns(profile.signaturePatterns, 'Signature patterns for ' + voiceId);
    for (const [source, patterns] of Object.entries(profile.contamination)) {
      requirePatterns(patterns, 'Contamination patterns for ' + voiceId + ' from ' + source);
    }
  }
  if (!Array.isArray(rules.designedRepetition.phrases)) {
    throw new Error('Designed-repetition phrases must be an array.');
  }
  return rules;
}

export function validateCanonWaivers(
  value: unknown,
  asOf: string,
): {
  file: CanonWaiverFile;
  expired: CanonWaiver[];
} {
  if (!isRecord(value)) {
    throw new Error('Canon waivers must be an object.');
  }
  if (value.schemaVersion !== CANON_WAIVERS_SCHEMA_VERSION) {
    throw new Error('Unsupported canon waivers schema: ' + String(value.schemaVersion));
  }
  const file = value as unknown as CanonWaiverFile;
  const seen = new Set<string>();
  const expired: CanonWaiver[] = [];
  for (const waiver of file.waivers) {
    const id = requireString(waiver.id, 'Waiver id');
    if (!/^WVR-\d{3}$/.test(id)) {
      throw new Error('Waiver id must match WVR-NNN: ' + id);
    }
    if (seen.has(id)) {
      throw new Error('Duplicate waiver id: ' + id);
    }
    seen.add(id);
    requireString(waiver.ruleId, id + ' ruleId');
    requireString(waiver.rationale, id + ' rationale');
    requireString(waiver.approvedBy, id + ' approvedBy');
    const expires = requireString(waiver.expires, id + ' expires');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
      throw new Error(id + ' expires must be an ISO date (YYYY-MM-DD).');
    }
    if (!waiver.scope || (!waiver.scope.family && !waiver.scope.variation)) {
      throw new Error(id + ' must scope to a family or a variation.');
    }
    if (expires < asOf.slice(0, 10)) {
      expired.push(waiver);
    }
  }
  return { file, expired };
}

interface VariationText {
  variationId: string;
  family: string;
  content: string;
}

interface FamilyContext {
  voiceIds: string[];
  layer: number;
}

function familyOf(variationId: string): string {
  const match = /^(.*)-(\d{3})$/.exec(variationId);
  return match ? match[1]! : variationId;
}

function findWaiver(
  waivers: CanonWaiver[],
  expired: Set<string>,
  ruleId: string,
  family: string,
  variationId: string,
): CanonWaiver | null {
  for (const waiver of waivers) {
    if (expired.has(waiver.id)) continue;
    if (waiver.ruleId !== ruleId) continue;
    if (waiver.scope.variation && waiver.scope.variation !== variationId) continue;
    if (waiver.scope.family && waiver.scope.family !== family) continue;
    return waiver;
  }
  return null;
}

function insideDesignedRepetition(
  line: string,
  matchIndex: number,
  matchLength: number,
  phrases: string[],
): boolean {
  const lower = line.toLowerCase();
  for (const phrase of phrases) {
    const needle = phrase.toLowerCase();
    let from = 0;
    for (;;) {
      const at = lower.indexOf(needle, from);
      if (at === -1) break;
      if (matchIndex >= at && matchIndex + matchLength <= at + needle.length) {
        return true;
      }
      from = at + 1;
    }
  }
  return false;
}

export function checkVariation(
  variation: VariationText,
  context: FamilyContext,
  rules: CanonRules,
  waivers: CanonWaiver[],
  expiredWaiverIds: Set<string>,
): CanonFinding[] {
  const findings: CanonFinding[] = [];
  const lines = variation.content.split('\n');
  const phrases = rules.designedRepetition.phrases;

  const record = (
    severity: CanonSeverity,
    ruleId: string,
    note: string,
    lineNumber: number,
    line: string,
    matchIndex: number,
    matchLength: number,
  ): void => {
    if (insideDesignedRepetition(line, matchIndex, matchLength, phrases)) {
      return;
    }
    const waiver = findWaiver(
      waivers,
      expiredWaiverIds,
      ruleId,
      variation.family,
      variation.variationId,
    );
    findings.push({
      severity,
      ruleId,
      note,
      family: variation.family,
      variationId: variation.variationId,
      line: lineNumber,
      excerpt: line.trim().slice(0, 120),
      waived: waiver !== null,
      waiverId: waiver?.id ?? null,
    });
  };

  const scanLines = (patterns: CanonPattern[], severity: CanonSeverity, ruleId: string): void => {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex, 'i');
      for (const [index, line] of lines.entries()) {
        const match = regex.exec(line);
        if (match) {
          record(severity, ruleId, pattern.note, index + 1, line, match.index, match[0].length);
        }
      }
    }
  };

  for (const [name, group] of Object.entries(rules.shackles)) {
    scanLines(group.patterns, 'error', 'shackles.' + name);
  }
  for (const [name, group] of Object.entries(rules.forbiddenMoves)) {
    scanLines(group.patterns, 'error', 'forbidden-moves.' + name);
  }
  for (const term of rules.terminology.forbiddenTerms) {
    scanLines([{ regex: term.regex, note: term.note }], 'error', 'terminology.' + term.id);
  }
  scanLines(rules.chronology.absoluteDatePatterns, 'error', 'chronology.absolute-date');

  const dissolutionLicensed = context.layer >= 3 || context.voiceIds.length !== 1;
  if (!dissolutionLicensed) {
    const voiceId = context.voiceIds[0]!;
    const profile = rules.voices.profiles[voiceId];
    if (profile) {
      for (const [source, patterns] of Object.entries(profile.contamination)) {
        scanLines(patterns, 'warning', 'voice.contamination.' + source);
      }
      let signatureMatches = 0;
      for (const pattern of profile.signaturePatterns) {
        const regex = new RegExp(pattern.regex, 'gim');
        signatureMatches += (variation.content.match(regex) ?? []).length;
      }
      const words = variation.content.split(/\s+/).filter(Boolean).length;
      const strength = words > 0 ? (signatureMatches / words) * 1000 : 0;
      if (strength < 10) {
        record(
          'warning',
          'voice.signature',
          'Weak ' +
            voiceId +
            ' voice signature: ' +
            strength.toFixed(1) +
            ' matches/1000 words (target >= 10)',
          1,
          lines[0] ?? '',
          0,
          0,
        );
      }
    }
  }

  return findings;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function loadFamilyContexts(repositoryRoot: string): Promise<Map<string, FamilyContext>> {
  const concordance = (await readJson(
    resolve(repositoryRoot, 'story-packages/concordance/eternal-return.v1.json'),
  )) as {
    mappings: Array<{ passageStableKey: string; voiceIds: string[] }>;
  };
  const catalog = (await readJson(
    resolve(repositoryRoot, 'story-packages/eternal-return/catalog.json'),
  )) as {
    passages: Array<{ stableKey: string; layer: number }>;
  };
  const layers = new Map(catalog.passages.map((passage) => [passage.stableKey, passage.layer]));
  const contexts = new Map<string, FamilyContext>();
  for (const mapping of concordance.mappings) {
    const layer = layers.get(mapping.passageStableKey);
    if (layer === undefined) {
      throw new Error('Concordance mapping for unknown passage: ' + mapping.passageStableKey);
    }
    contexts.set(mapping.passageStableKey, { voiceIds: mapping.voiceIds, layer });
  }
  return contexts;
}

async function loadCorpus(repositoryRoot: string): Promise<VariationText[]> {
  const contentRoot = resolve(repositoryRoot, 'src/data/stories/eternal-return/content');
  const variations: VariationText[] = [];

  const pushVariation = (raw: Record<string, unknown>): void => {
    const variationId = String(raw.id ?? '');
    const content = typeof raw.content === 'string' ? raw.content : '';
    if (!variationId || !content) return;
    variations.push({ variationId, family: familyOf(variationId), content });
  };

  for (const layer of ['layer1', 'layer2']) {
    const dir = resolve(contentRoot, layer);
    for (const file of await readdir(dir)) {
      if (!file.endsWith('-variations.json') || file.endsWith('.tmp')) continue;
      const parsed = (await readJson(resolve(dir, file))) as { variations?: unknown[] };
      for (const raw of parsed.variations ?? []) {
        if (raw && typeof raw === 'object') pushVariation(raw as Record<string, unknown>);
      }
    }
  }

  const l3dir = resolve(contentRoot, 'layer3/variations');
  for (const file of await readdir(l3dir)) {
    if (!file.endsWith('.json') || file.endsWith('.tmp')) continue;
    const parsed = (await readJson(resolve(l3dir, file))) as Record<string, unknown>;
    pushVariation(parsed);
  }

  const l4dir = resolve(contentRoot, 'layer4');
  for (const file of await readdir(l4dir)) {
    if (!/^final-[a-z]+\.json$/.test(file)) continue;
    const parsed = (await readJson(resolve(l4dir, file))) as Record<string, unknown>;
    pushVariation(parsed);
  }

  return variations;
}

export async function runCanonValidation(
  repositoryRoot: string,
  asOf: string,
): Promise<CanonReport> {
  const rules = validateCanonRules(
    await readJson(resolve(repositoryRoot, 'story-packages/concordance/canon-rules.v1.json')),
  );
  const { file: waiverFile, expired } = validateCanonWaivers(
    await readJson(resolve(repositoryRoot, 'story-packages/concordance/waivers.v1.json')),
    asOf,
  );
  const expiredIds = new Set(expired.map((waiver) => waiver.id));
  const contexts = await loadFamilyContexts(repositoryRoot);
  const corpus = await loadCorpus(repositoryRoot);

  const findings: CanonFinding[] = [];
  const families = new Set<string>();
  for (const variation of corpus) {
    families.add(variation.family);
    const context = contexts.get(variation.family);
    if (!context) {
      throw new Error('Runtime variation belongs to no mapped family: ' + variation.variationId);
    }
    findings.push(...checkVariation(variation, context, rules, waiverFile.waivers, expiredIds));
  }

  const byRule: Record<string, number> = {};
  let errors = 0;
  let warnings = 0;
  let waived = 0;
  for (const finding of findings) {
    byRule[finding.ruleId] = (byRule[finding.ruleId] ?? 0) + 1;
    if (finding.waived) {
      waived++;
    } else if (finding.severity === 'error') {
      errors++;
    } else {
      warnings++;
    }
  }

  return {
    schemaVersion: CANON_RULES_SCHEMA_VERSION,
    storyId: rules.storyId,
    rulesProvenance: rules.provenance,
    asOf,
    corpus: { families: families.size, variations: corpus.length },
    summary: { errors, warnings, waived, expiredWaivers: expired.length, byRule },
    findings,
  };
}
