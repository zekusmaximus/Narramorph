import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { glob } from 'glob';

export const STORY_PACKAGE_CONTRACT = 'org.narramorph.story-package';
export const STORY_PACKAGE_SCHEMA_VERSION = '1.1.0';
export const CURRENT_APP_VERSION = '0.1.0';

type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface LicenseDeclaration {
  spdx: string;
  scope: string;
  attribution: string;
}

export interface ProvenanceLink {
  relation: string;
  repository: string;
  commit: string;
  releaseId: string;
  path?: string;
}

export interface SourceResource {
  sourcePath: string;
  packagePath: string;
  mediaType: string;
  purpose: string;
}

export interface ExplanationSource {
  stableKey: string;
  subjectType: 'character' | 'passage' | 'variation' | 'ending';
  subjectStableKey: string;
  kind: string;
  summary: string;
}

export interface StoryPackageSource {
  schemaVersion: string;
  storyId: string;
  storyVersion: string;
  title: string;
  sourceRoot: string;
  storyFile: string;
  characterFiles: string[];
  variationGlobs: string[];
  passageAliases?: Record<string, string>;
  sourceManuscriptCommit: string;
  editorialReleaseId: string;
  supportedAppRange: string;
  sourceDateEpoch: string;
  licenses: LicenseDeclaration[];
  provenance: ProvenanceLink[];
  resources?: SourceResource[];
  explanations?: ExplanationSource[];
}

export interface CharacterRecord {
  id: string;
  stableKey: string;
  slug: string;
  displayName: string;
}

export interface PassageRecord {
  id: string;
  stableKey: string;
  legacyId: string;
  characterId: string;
  layer: number;
  title: string;
  sourcePath: string;
}

export interface VariationRecord {
  id: string;
  stableKey: string;
  legacyId: string;
  passageId: string;
  proseBeatIds: string[];
  conditionIds: string[];
  sourcePath: string;
  contentDigest: string;
}

export interface ConditionRecord {
  id: string;
  stableKey: string;
  variationId: string;
  kind: string;
  value: JsonValue;
}

export interface ProseBeatRecord {
  id: string;
  stableKey: string;
  variationId: string;
  ordinal: number;
  contentDigest: string;
  byteLength: number;
}

export interface EdgeRecord {
  id: string;
  stableKey: string;
  fromPassageId: string;
  toPassageId: string;
}

export interface EndingRecord {
  id: string;
  stableKey: string;
  passageId: string;
}

export interface ExplanationRecord {
  id: string;
  stableKey: string;
  subjectType: ExplanationSource['subjectType'];
  subjectId: string;
  kind: string;
  summary: string;
}

export interface ResourceRecord {
  path: string;
  sha256: string;
  byteLength: number;
  mediaType: string;
  purpose: string;
}

export interface StoryPackageCatalog {
  characters: CharacterRecord[];
  passages: PassageRecord[];
  variations: VariationRecord[];
  conditions: ConditionRecord[];
  proseBeats: ProseBeatRecord[];
  edges: EdgeRecord[];
  endings: EndingRecord[];
  explanations: ExplanationRecord[];
  resources: ResourceRecord[];
}

export interface StoryPackageManifest {
  contract: string;
  schemaVersion: string;
  storyId: string;
  storyVersion: string;
  title: string;
  sourceManuscriptCommit: string;
  editorialReleaseId: string;
  licenses: LicenseDeclaration[];
  generatedAt: string;
  generation: {
    generator: string;
    generatorVersion: string;
    sourceDateEpoch: string;
    canonicalization: string;
  };
  contentHash: string;
  supportedAppRange: string;
  layerCounts: Record<string, number>;
  passageIds: string[];
  provenance: ProvenanceLink[];
  catalog: {
    path: string;
    sha256: string;
  };
}

export interface BuiltStoryPackage {
  manifest: StoryPackageManifest;
  catalog: StoryPackageCatalog;
  manifestBytes: string;
  catalogBytes: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: StoryPackageManifest;
  catalog?: StoryPackageCatalog;
}

const ID_PREFIXES = {
  character: 'chr',
  passage: 'psg',
  variation: 'var',
  condition: 'cnd',
  proseBeat: 'bet',
  edge: 'edg',
  ending: 'end',
  explanation: 'exp',
} as const;

type IdentityKind = keyof typeof ID_PREFIXES;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, '\n').normalize('NFC');
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value.normalize('NFC'));
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Canonical JSON rejects non-finite numbers.');
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJson(item)).join(',') + ']';
  }
  if (isRecord(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => {
        const item = value[key];
        if (item === undefined) {
          throw new Error('Canonical JSON rejects undefined properties.');
        }
        return JSON.stringify(key.normalize('NFC')) + ':' + canonicalJson(item);
      });
    return '{' + entries.join(',') + '}';
  }
  throw new Error('Unsupported canonical JSON value: ' + typeof value);
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function deriveOpaqueId(kind: IdentityKind, storyId: string, stableKey: string): string {
  const seed = STORY_PACKAGE_CONTRACT + '|v1|' + kind + '|' + storyId + '|' + stableKey;
  return 'spv1_' + ID_PREFIXES[kind] + '_' + sha256(seed).slice(0, 24);
}

export function isSafePackagePath(value: string): boolean {
  if (!value || isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.startsWith('\\\\')) {
    return false;
  }
  const normalized = value.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return !parts.some((part) => part === '' || part === '.' || part === '..');
}

function assertSafePackagePath(value: string, label: string): void {
  if (!isSafePackagePath(value)) {
    throw new Error(label + ' is not a safe package-relative path: ' + value);
  }
}

function parseSemver(value: string): [number, number, number] | null {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.exec(value);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left: [number, number, number], right: [number, number, number]): number {
  for (let index = 0; index < 3; index++) {
    const difference = left[index]! - right[index]!;
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

export function appVersionSatisfiesRange(appVersion: string, range: string): boolean {
  const version = parseSemver(appVersion);
  const match = /^>=(\S+) <(\S+)$/.exec(range);
  if (!version || !match) {
    return false;
  }
  const minimum = parseSemver(match[1] || '');
  const maximum = parseSemver(match[2] || '');
  return (
    !!minimum &&
    !!maximum &&
    compareSemver(version, minimum) >= 0 &&
    compareSemver(version, maximum) < 0
  );
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function asJsonValue(value: unknown): JsonValue {
  return JSON.parse(canonicalJson(value)) as JsonValue;
}

const NUMERIC_COMPARISONS = new Set(['eq', 'ne', 'gt', 'gte', 'lt', 'lte']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPassageIdArray(value: unknown, unique = false): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isNonEmptyString) &&
    (!unique || new Set(value).size === value.length)
  );
}

function isConditionExpression(value: unknown, depth = 0): boolean {
  if (!isRecord(value) || depth > 32 || typeof value.kind !== 'string') {
    return false;
  }
  if (['historyStartsWith', 'historyEndsWith', 'orderSeen'].includes(value.kind)) {
    return isPassageIdArray(value.passageIds);
  }
  if (value.kind === 'visitedImmediatelyAfter') {
    return isNonEmptyString(value.beforePassageId) && isNonEmptyString(value.afterPassageId);
  }
  if (value.kind === 'withinSteps') {
    return (
      isNonEmptyString(value.passageId) && Number.isInteger(value.steps) && Number(value.steps) >= 0
    );
  }
  if (value.kind === 'visitCount') {
    return (
      isNonEmptyString(value.passageId) &&
      NUMERIC_COMPARISONS.has(String(value.comparison)) &&
      Number.isInteger(value.value) &&
      Number(value.value) >= 0
    );
  }
  if (value.kind === 'visitedCountAcross') {
    return (
      isPassageIdArray(value.passageIds, true) &&
      NUMERIC_COMPARISONS.has(String(value.comparison)) &&
      Number.isInteger(value.value) &&
      Number(value.value) >= 0
    );
  }
  if (value.kind === 'all' || value.kind === 'any') {
    return (
      Array.isArray(value.conditions) &&
      value.conditions.length > 0 &&
      value.conditions.every((condition) => isConditionExpression(condition, depth + 1))
    );
  }
  if (value.kind === 'not') {
    return isConditionExpression(value.condition, depth + 1);
  }
  return false;
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.id.localeCompare(right.id));
}

interface SourceNode {
  id: string;
  layer: number;
  chapterTitle?: string;
  title?: string;
  contentFile: string;
  connections?: string[];
}

function parseCharacterSource(
  value: unknown,
  path: string,
): { character: string; nodes: SourceNode[] } {
  if (!isRecord(value) || typeof value.character !== 'string' || !Array.isArray(value.nodes)) {
    throw new Error('Malformed character source: ' + path);
  }
  const nodes = value.nodes.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.layer !== 'number' ||
      typeof item.contentFile !== 'string'
    ) {
      throw new Error('Malformed passage in character source: ' + path);
    }
    return {
      id: item.id,
      layer: item.layer,
      chapterTitle: typeof item.chapterTitle === 'string' ? item.chapterTitle : undefined,
      title: typeof item.title === 'string' ? item.title : undefined,
      contentFile: item.contentFile,
      connections: Array.isArray(item.connections)
        ? item.connections.filter((entry): entry is string => typeof entry === 'string')
        : [],
    };
  });
  return { character: value.character, nodes };
}

interface RawVariation {
  raw: Record<string, unknown>;
  inheritedNodeId?: string;
}

function extractVariations(value: unknown, path: string): RawVariation[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!isRecord(item)) {
        throw new Error('Malformed variation entry: ' + path);
      }
      return { raw: item };
    });
  }
  if (!isRecord(value)) {
    throw new Error('Malformed variation source: ' + path);
  }
  if (Array.isArray(value.variations)) {
    return value.variations.map((item) => {
      if (!isRecord(item)) {
        throw new Error('Malformed variation entry: ' + path);
      }
      return {
        raw: item,
        inheritedNodeId: typeof value.nodeId === 'string' ? value.nodeId : undefined,
      };
    });
  }
  if (typeof value.id === 'string' && typeof value.content === 'string') {
    return [{ raw: value }];
  }
  throw new Error('No variations found in source: ' + path);
}

function conditionValues(raw: Record<string, unknown>): Record<string, JsonValue> {
  const values: Record<string, JsonValue> = {};
  const metadata = isRecord(raw.metadata) ? raw.metadata : {};
  const declared = isRecord(metadata.conditions) ? metadata.conditions : {};
  for (const [key, value] of Object.entries(declared)) {
    values[key] = asJsonValue(value);
  }
  for (const key of [
    'transformationState',
    'awarenessRange',
    'journeyPattern',
    'philosophyDominant',
    'awarenessLevel',
    'philosophy',
  ]) {
    if (raw[key] !== undefined && values[key] === undefined) {
      values[key] = asJsonValue(raw[key]);
    }
  }
  return values;
}

function sourcePathFrom(root: string, absolutePath: string): string {
  const value = relative(root, absolutePath).split(sep).join('/');
  assertSafePackagePath(value, 'Source path');
  return value;
}

function subjectIdForExplanation(
  source: ExplanationSource,
  storyId: string,
  characters: CharacterRecord[],
  passages: PassageRecord[],
  variations: VariationRecord[],
  endings: EndingRecord[],
): string {
  const groups = {
    character: characters,
    passage: passages,
    variation: variations,
    ending: endings,
  };
  const record = groups[source.subjectType].find(
    (item) => item.stableKey === source.subjectStableKey,
  );
  if (!record) {
    throw new Error(
      'Explanation ' +
        source.stableKey +
        ' references unknown ' +
        source.subjectType +
        ' stable key ' +
        source.subjectStableKey,
    );
  }
  void storyId;
  return record.id;
}

function manifestHashInput(
  manifest: Omit<StoryPackageManifest, 'contentHash'>,
  catalog: StoryPackageCatalog,
): unknown {
  return { manifest, catalog };
}

export async function buildStoryPackage(
  descriptorPath: string,
  outputDirectory: string,
): Promise<BuiltStoryPackage> {
  const descriptorValue = await readJson(descriptorPath);
  if (!isRecord(descriptorValue)) {
    throw new Error('Story package source descriptor must be a JSON object.');
  }
  const source = descriptorValue as unknown as StoryPackageSource;
  if (source.schemaVersion !== STORY_PACKAGE_SCHEMA_VERSION) {
    throw new Error(
      'Unsupported source descriptor schema version: ' + String(source.schemaVersion),
    );
  }
  if (!parseSemver(source.storyVersion)) {
    throw new Error('Story version is not semantic: ' + String(source.storyVersion));
  }
  if (!appVersionSatisfiesRange(CURRENT_APP_VERSION, source.supportedAppRange)) {
    throw new Error('Current app version is outside the declared supported range.');
  }
  if (!Array.isArray(source.licenses) || source.licenses.length === 0) {
    throw new Error('At least one content license is required.');
  }
  if (!Array.isArray(source.provenance) || source.provenance.length === 0) {
    throw new Error('At least one provenance link is required.');
  }

  const descriptorDirectory = dirname(resolve(descriptorPath));
  const sourceRoot = resolve(descriptorDirectory, source.sourceRoot);
  const outputRoot = resolve(outputDirectory);
  const storyValue = await readJson(resolve(sourceRoot, source.storyFile));
  if (!isRecord(storyValue) || !isRecord(storyValue.structure)) {
    throw new Error('Story source must contain a structure object.');
  }

  const characters: CharacterRecord[] = [];
  const passages: PassageRecord[] = [];
  const sourceNodes: SourceNode[] = [];
  const passageByLegacyId = new Map<string, PassageRecord>();

  for (const characterFile of [...source.characterFiles].sort()) {
    assertSafePackagePath(characterFile, 'Character source path');
    const parsed = parseCharacterSource(
      await readJson(resolve(sourceRoot, characterFile)),
      characterFile,
    );
    const character: CharacterRecord = {
      id: deriveOpaqueId('character', source.storyId, parsed.character),
      stableKey: parsed.character,
      slug: parsed.character,
      displayName: titleCase(parsed.character),
    };
    characters.push(character);
    for (const node of parsed.nodes) {
      assertSafePackagePath(node.contentFile, 'Passage source path');
      const passage: PassageRecord = {
        id: deriveOpaqueId('passage', source.storyId, node.id),
        stableKey: node.id,
        legacyId: node.id,
        characterId: character.id,
        layer: node.layer,
        title: node.chapterTitle || node.title || node.id,
        sourcePath: node.contentFile.replace(/\\/g, '/'),
      };
      if (passageByLegacyId.has(node.id)) {
        throw new Error('Duplicate passage stable key: ' + node.id);
      }
      passages.push(passage);
      sourceNodes.push(node);
      passageByLegacyId.set(node.id, passage);
    }
  }

  const edges: EdgeRecord[] = [];
  const edgeKeys = new Set<string>();
  for (const node of sourceNodes) {
    const from = passageByLegacyId.get(node.id);
    if (!from) {
      continue;
    }
    for (const targetLegacyId of node.connections || []) {
      const target = passageByLegacyId.get(targetLegacyId);
      if (!target) {
        throw new Error('Passage ' + node.id + ' references unknown target ' + targetLegacyId);
      }
      const stableKey = node.id + '->' + targetLegacyId;
      if (edgeKeys.has(stableKey)) {
        continue;
      }
      edgeKeys.add(stableKey);
      edges.push({
        id: deriveOpaqueId('edge', source.storyId, stableKey),
        stableKey,
        fromPassageId: from.id,
        toPassageId: target.id,
      });
    }
  }

  const variations: VariationRecord[] = [];
  const conditions: ConditionRecord[] = [];
  const proseBeats: ProseBeatRecord[] = [];
  const variationKeys = new Set<string>();
  const variationMatches = new Set<string>();
  for (const pattern of source.variationGlobs) {
    assertSafePackagePath(pattern, 'Variation source glob');
    const matches = await glob(pattern, {
      cwd: sourceRoot,
      nodir: true,
      windowsPathsNoEscape: true,
    });
    for (const match of matches) {
      variationMatches.add(match.replace(/\\/g, '/'));
    }
  }
  if (variationMatches.size === 0) {
    throw new Error('Variation source globs matched no files.');
  }

  for (const relativePath of [...variationMatches].sort()) {
    const absolutePath = resolve(sourceRoot, relativePath);
    const rawVariations = extractVariations(await readJson(absolutePath), relativePath);
    for (const entry of rawVariations) {
      const raw = entry.raw;
      const metadata = isRecord(raw.metadata) ? raw.metadata : {};
      const legacyId =
        typeof raw.id === 'string'
          ? raw.id
          : typeof metadata.variationId === 'string'
            ? metadata.variationId
            : typeof metadata.variation_id === 'string'
              ? metadata.variation_id
              : null;
      if (!legacyId || typeof raw.content !== 'string') {
        throw new Error('Variation is missing id or content in ' + relativePath);
      }
      if (variationKeys.has(legacyId)) {
        throw new Error('Duplicate variation stable key: ' + legacyId);
      }
      variationKeys.add(legacyId);

      const rawPassageId =
        entry.inheritedNodeId ||
        (typeof metadata.nodeId === 'string' ? metadata.nodeId : undefined) ||
        (typeof raw.sectionType === 'string' ? raw.sectionType : undefined) ||
        legacyId;
      const aliasedPassageId = source.passageAliases?.[rawPassageId] || rawPassageId;
      const passage = passageByLegacyId.get(aliasedPassageId);
      if (!passage) {
        throw new Error('Variation ' + legacyId + ' references unknown passage ' + rawPassageId);
      }

      const variationId = deriveOpaqueId('variation', source.storyId, legacyId);
      const beatStableKey = legacyId + ':0';
      const beatId = deriveOpaqueId('proseBeat', source.storyId, beatStableKey);
      const content = normalizeText(raw.content);
      const values = conditionValues(raw);
      const conditionIds: string[] = [];
      for (const [kind, value] of Object.entries(values).sort(([left], [right]) =>
        left.localeCompare(right),
      )) {
        const stableKey = legacyId + ':' + kind;
        const id = deriveOpaqueId('condition', source.storyId, stableKey);
        conditionIds.push(id);
        conditions.push({ id, stableKey, variationId, kind, value });
      }
      proseBeats.push({
        id: beatId,
        stableKey: beatStableKey,
        variationId,
        ordinal: 0,
        contentDigest: sha256(content),
        byteLength: Buffer.byteLength(content, 'utf8'),
      });
      variations.push({
        id: variationId,
        stableKey: legacyId,
        legacyId,
        passageId: passage.id,
        proseBeatIds: [beatId],
        conditionIds: conditionIds.sort(),
        sourcePath: sourcePathFrom(sourceRoot, absolutePath),
        contentDigest: sha256(content),
      });
    }
  }

  const endingLegacyIds = Array.isArray(storyValue.structure.endingNodes)
    ? storyValue.structure.endingNodes.filter((item): item is string => typeof item === 'string')
    : [];
  const endings = endingLegacyIds.map((legacyId) => {
    const passage = passageByLegacyId.get(legacyId);
    if (!passage) {
      throw new Error('Ending references unknown passage: ' + legacyId);
    }
    return {
      id: deriveOpaqueId('ending', source.storyId, legacyId),
      stableKey: legacyId,
      passageId: passage.id,
    };
  });

  const explanations = (source.explanations || []).map((explanation) => ({
    id: deriveOpaqueId('explanation', source.storyId, explanation.stableKey),
    stableKey: explanation.stableKey,
    subjectType: explanation.subjectType,
    subjectId: subjectIdForExplanation(
      explanation,
      source.storyId,
      characters,
      passages,
      variations,
      endings,
    ),
    kind: explanation.kind,
    summary: explanation.summary,
  }));

  const resources: ResourceRecord[] = [];
  for (const resource of [...(source.resources || [])].sort((left, right) =>
    left.packagePath.localeCompare(right.packagePath),
  )) {
    assertSafePackagePath(resource.sourcePath, 'Resource source path');
    assertSafePackagePath(resource.packagePath, 'Resource package path');
    const sourcePath = resolve(sourceRoot, resource.sourcePath);
    const bytes = await readFile(sourcePath);
    const outputPath = resolve(outputRoot, resource.packagePath);
    if (!outputPath.startsWith(outputRoot + sep)) {
      throw new Error('Resource output escaped package root: ' + resource.packagePath);
    }
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(sourcePath, outputPath);
    resources.push({
      path: resource.packagePath.replace(/\\/g, '/'),
      sha256: sha256(bytes),
      byteLength: bytes.byteLength,
      mediaType: resource.mediaType,
      purpose: resource.purpose,
    });
  }

  const catalog: StoryPackageCatalog = {
    characters: sortById(characters),
    passages: sortById(passages),
    variations: sortById(variations),
    conditions: sortById(conditions),
    proseBeats: sortById(proseBeats),
    edges: sortById(edges),
    endings: sortById(endings),
    explanations: sortById(explanations),
    resources: [...resources].sort((left, right) => left.path.localeCompare(right.path)),
  };
  const catalogBytes = canonicalJson(catalog) + '\n';
  const catalogHash = sha256(canonicalJson(catalog));
  const layerCounts = catalog.passages.reduce<Record<string, number>>((counts, passage) => {
    const layer = String(passage.layer);
    counts[layer] = (counts[layer] || 0) + 1;
    return counts;
  }, {});
  const manifestWithoutHash: Omit<StoryPackageManifest, 'contentHash'> = {
    contract: STORY_PACKAGE_CONTRACT,
    schemaVersion: source.schemaVersion,
    storyId: source.storyId,
    storyVersion: source.storyVersion,
    title: source.title,
    sourceManuscriptCommit: source.sourceManuscriptCommit,
    editorialReleaseId: source.editorialReleaseId,
    licenses: source.licenses,
    generatedAt: source.sourceDateEpoch,
    generation: {
      generator: '@narramorph/conversion-tools',
      generatorVersion: '1.2.0',
      sourceDateEpoch: source.sourceDateEpoch,
      canonicalization: 'narramorph-canonical-json-v1',
    },
    supportedAppRange: source.supportedAppRange,
    layerCounts,
    passageIds: catalog.passages.map((passage) => passage.id).sort(),
    provenance: source.provenance,
    catalog: { path: 'catalog.json', sha256: catalogHash },
  };
  const manifest: StoryPackageManifest = {
    ...manifestWithoutHash,
    contentHash: sha256(canonicalJson(manifestHashInput(manifestWithoutHash, catalog))),
  };
  const manifestBytes = canonicalJson(manifest) + '\n';

  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, 'catalog.json'), catalogBytes, 'utf8');
  await writeFile(resolve(outputRoot, 'manifest.json'), manifestBytes, 'utf8');

  return { manifest, catalog, manifestBytes, catalogBytes };
}

function validateOpaqueIds(catalog: StoryPackageCatalog, errors: string[]): void {
  const groups: Array<[string, Array<{ id: string; stableKey: string }>]> = [
    ['characters', catalog.characters],
    ['passages', catalog.passages],
    ['variations', catalog.variations],
    ['conditions', catalog.conditions],
    ['proseBeats', catalog.proseBeats],
    ['edges', catalog.edges],
    ['endings', catalog.endings],
    ['explanations', catalog.explanations],
  ];
  const ids = new Set<string>();
  for (const [groupName, records] of groups) {
    const stableKeys = new Set<string>();
    for (const record of records) {
      if (!/^spv1_(?:chr|psg|var|cnd|bet|edg|end|exp)_[0-9a-f]{24}$/.test(record.id)) {
        errors.push(groupName + ' contains malformed opaque ID ' + String(record.id));
      }
      if (ids.has(record.id)) {
        errors.push('Duplicate ID: ' + record.id);
      }
      ids.add(record.id);
      if (stableKeys.has(record.stableKey)) {
        errors.push('Duplicate stable key in ' + groupName + ': ' + record.stableKey);
      }
      stableKeys.add(record.stableKey);
    }
  }
}

function validateManifestShape(manifest: StoryPackageManifest, errors: string[]): boolean {
  const value = manifest as unknown as Record<string, unknown>;
  const strings = [
    'contract',
    'schemaVersion',
    'storyId',
    'storyVersion',
    'title',
    'sourceManuscriptCommit',
    'editorialReleaseId',
    'generatedAt',
    'contentHash',
    'supportedAppRange',
  ];
  const valid =
    strings.every((key) => typeof value[key] === 'string') &&
    Array.isArray(value.licenses) &&
    Array.isArray(value.passageIds) &&
    Array.isArray(value.provenance) &&
    isRecord(value.generation) &&
    isRecord(value.layerCounts) &&
    isRecord(value.catalog);
  if (!valid) {
    errors.push('Malformed package manifest shape.');
  }
  return valid;
}

function validateCatalogRecordShapes(catalog: StoryPackageCatalog, errors: string[]): boolean {
  const specifications: Array<{
    group: keyof StoryPackageCatalog;
    strings: string[];
    arrays?: string[];
    integers?: string[];
    required?: string[];
  }> = [
    { group: 'characters', strings: ['id', 'stableKey', 'slug', 'displayName'] },
    {
      group: 'passages',
      strings: ['id', 'stableKey', 'legacyId', 'characterId', 'title', 'sourcePath'],
      integers: ['layer'],
    },
    {
      group: 'variations',
      strings: ['id', 'stableKey', 'legacyId', 'passageId', 'sourcePath', 'contentDigest'],
      arrays: ['proseBeatIds', 'conditionIds'],
    },
    {
      group: 'conditions',
      strings: ['id', 'stableKey', 'variationId', 'kind'],
      required: ['value'],
    },
    {
      group: 'proseBeats',
      strings: ['id', 'stableKey', 'variationId', 'contentDigest'],
      integers: ['ordinal', 'byteLength'],
    },
    { group: 'edges', strings: ['id', 'stableKey', 'fromPassageId', 'toPassageId'] },
    { group: 'endings', strings: ['id', 'stableKey', 'passageId'] },
    {
      group: 'explanations',
      strings: ['id', 'stableKey', 'subjectType', 'subjectId', 'kind', 'summary'],
    },
    {
      group: 'resources',
      strings: ['path', 'sha256', 'mediaType', 'purpose'],
      integers: ['byteLength'],
    },
  ];
  let valid = true;
  for (const specification of specifications) {
    const records = catalog[specification.group] as unknown[];
    records.forEach((value, index) => {
      if (!isRecord(value)) {
        errors.push('Malformed ' + specification.group + ' record at index ' + index + '.');
        valid = false;
        return;
      }
      const stringsValid = specification.strings.every((key) => typeof value[key] === 'string');
      const arraysValid = (specification.arrays || []).every((key) => Array.isArray(value[key]));
      const integersValid = (specification.integers || []).every((key) =>
        Number.isInteger(value[key]),
      );
      const requiredValid = (specification.required || []).every((key) =>
        Object.prototype.hasOwnProperty.call(value, key),
      );
      if (!stringsValid || !arraysValid || !integersValid || !requiredValid) {
        errors.push('Malformed ' + specification.group + ' record at index ' + index + '.');
        valid = false;
      }
    });
  }
  return valid;
}

function validateReferences(
  manifest: StoryPackageManifest,
  catalog: StoryPackageCatalog,
  errors: string[],
): void {
  const characterIds = new Set(catalog.characters.map((item) => item.id));
  const passageIds = new Set(catalog.passages.map((item) => item.id));
  const variationIds = new Set(catalog.variations.map((item) => item.id));
  const conditionIds = new Set(catalog.conditions.map((item) => item.id));
  const proseBeatIds = new Set(catalog.proseBeats.map((item) => item.id));
  for (const passage of catalog.passages) {
    if (!characterIds.has(passage.characterId)) {
      errors.push('Passage references unknown character: ' + passage.id);
    }
    if (!isSafePackagePath(passage.sourcePath)) {
      errors.push('Passage contains unsafe source path: ' + passage.sourcePath);
    }
  }
  for (const variation of catalog.variations) {
    if (!passageIds.has(variation.passageId)) {
      errors.push('Variation references unknown passage: ' + variation.id);
    }
    if (!isSafePackagePath(variation.sourcePath)) {
      errors.push('Variation contains unsafe source path: ' + variation.sourcePath);
    }
    for (const id of variation.conditionIds) {
      if (!conditionIds.has(id)) {
        errors.push('Variation references unknown condition: ' + id);
      }
    }
    for (const id of variation.proseBeatIds) {
      if (!proseBeatIds.has(id)) {
        errors.push('Variation references unknown prose beat: ' + id);
      }
    }
    if (!/^[0-9a-f]{64}$/.test(variation.contentDigest)) {
      errors.push('Variation contains malformed content digest: ' + variation.id);
    }
  }
  for (const condition of catalog.conditions) {
    if (!variationIds.has(condition.variationId)) {
      errors.push('Condition references unknown variation: ' + condition.id);
    }
    if (condition.kind === 'expression' && !isConditionExpression(condition.value)) {
      errors.push('Condition expression is malformed: ' + condition.id);
    }
  }
  for (const beat of catalog.proseBeats) {
    if (!variationIds.has(beat.variationId)) {
      errors.push('Prose beat references unknown variation: ' + beat.id);
    }
    if (!/^[0-9a-f]{64}$/.test(beat.contentDigest)) {
      errors.push('Prose beat contains malformed content digest: ' + beat.id);
    }
  }
  for (const edge of catalog.edges) {
    if (!passageIds.has(edge.fromPassageId) || !passageIds.has(edge.toPassageId)) {
      errors.push('Edge references unknown passage: ' + edge.id);
    }
  }
  for (const ending of catalog.endings) {
    if (!passageIds.has(ending.passageId)) {
      errors.push('Ending references unknown passage: ' + ending.id);
    }
  }
  const explanationSubjectIds = new Set([
    ...characterIds,
    ...passageIds,
    ...variationIds,
    ...catalog.endings.map((ending) => ending.id),
  ]);
  for (const explanation of catalog.explanations) {
    if (!explanationSubjectIds.has(explanation.subjectId)) {
      errors.push('Explanation references unknown subject: ' + explanation.id);
    }
  }
  const expectedPassageIds = [...passageIds].sort();
  if (canonicalJson(manifest.passageIds) !== canonicalJson(expectedPassageIds)) {
    errors.push('Manifest passageIds do not match the catalog.');
  }
  const expectedLayerCounts = catalog.passages.reduce<Record<string, number>>((counts, passage) => {
    const key = String(passage.layer);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  if (canonicalJson(manifest.layerCounts) !== canonicalJson(expectedLayerCounts)) {
    errors.push('Manifest layerCounts do not match the catalog.');
  }
}

function hasCatalogShape(value: unknown): value is StoryPackageCatalog {
  if (!isRecord(value)) {
    return false;
  }
  return [
    'characters',
    'passages',
    'variations',
    'conditions',
    'proseBeats',
    'edges',
    'endings',
    'explanations',
    'resources',
  ].every((key) => Array.isArray(value[key]));
}

export async function validateStoryPackage(
  packageDirectory: string,
  appVersion = CURRENT_APP_VERSION,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const root = resolve(packageDirectory);
  let manifestRaw: string;
  let catalogRaw: string;
  let manifestValue: unknown;
  let catalogValue: unknown;
  try {
    manifestRaw = await readFile(resolve(root, 'manifest.json'), 'utf8');
    catalogRaw = await readFile(resolve(root, 'catalog.json'), 'utf8');
    manifestValue = JSON.parse(manifestRaw) as unknown;
    catalogValue = JSON.parse(catalogRaw) as unknown;
  } catch (error) {
    return { valid: false, errors: ['Malformed package: ' + String(error)] };
  }
  if (!isRecord(manifestValue) || !hasCatalogShape(catalogValue)) {
    return { valid: false, errors: ['Malformed package manifest or catalog shape.'] };
  }
  const manifest = manifestValue as unknown as StoryPackageManifest;
  const catalog = catalogValue;
  const manifestShapeValid = validateManifestShape(manifest, errors);

  if (manifest.contract !== STORY_PACKAGE_CONTRACT) {
    errors.push('Unsupported package contract identifier.');
  }
  const schemaVersion = parseSemver(manifest.schemaVersion);
  if (!schemaVersion || schemaVersion[0] !== 1) {
    errors.push('Unsupported schema version: ' + String(manifest.schemaVersion));
  }
  if (!parseSemver(manifest.storyVersion)) {
    errors.push('Story version is not semantic: ' + String(manifest.storyVersion));
  }
  if (!appVersionSatisfiesRange(appVersion, manifest.supportedAppRange)) {
    errors.push(
      'App version ' + appVersion + ' is incompatible with ' + String(manifest.supportedAppRange),
    );
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceManuscriptCommit)) {
    errors.push('sourceManuscriptCommit must be a full lowercase Git commit SHA.');
  }
  if (typeof manifest.editorialReleaseId !== 'string' || manifest.editorialReleaseId.length === 0) {
    errors.push('editorialReleaseId is required.');
  }
  if (!Array.isArray(manifest.licenses) || manifest.licenses.length === 0) {
    errors.push('At least one content license is required.');
  } else if (
    manifest.licenses.some(
      (license) =>
        !license ||
        typeof license.spdx !== 'string' ||
        typeof license.scope !== 'string' ||
        typeof license.attribution !== 'string',
    )
  ) {
    errors.push('Every license requires spdx, scope, and attribution fields.');
  }
  if (
    typeof manifest.generatedAt !== 'string' ||
    Number.isNaN(Date.parse(manifest.generatedAt)) ||
    manifest.generatedAt !== manifest.generation?.sourceDateEpoch
  ) {
    errors.push('generatedAt must equal the deterministic sourceDateEpoch.');
  }
  if (!Array.isArray(manifest.provenance) || manifest.provenance.length === 0) {
    errors.push('At least one provenance link is required.');
  }
  if (!manifest.catalog || manifest.catalog.path !== 'catalog.json') {
    errors.push('Manifest catalog path must be catalog.json.');
  }

  const catalogRecordsValid = validateCatalogRecordShapes(catalog, errors);
  if (catalogRecordsValid) {
    validateOpaqueIds(catalog, errors);
  }
  if (catalogRecordsValid && manifestShapeValid) {
    validateReferences(manifest, catalog, errors);
  }

  for (const resource of catalogRecordsValid ? catalog.resources : []) {
    if (!resource || typeof resource.path !== 'string' || !isSafePackagePath(resource.path)) {
      errors.push('Resource contains an unsafe package path: ' + String(resource?.path));
      continue;
    }
    const resourcePath = resolve(root, resource.path);
    if (!resourcePath.startsWith(root + sep)) {
      errors.push('Resource escaped package root: ' + resource.path);
      continue;
    }
    try {
      const bytes = await readFile(resourcePath);
      const resourceStat = await stat(resourcePath);
      if (!resourceStat.isFile()) {
        errors.push('Resource is not a file: ' + resource.path);
      }
      if (sha256(bytes) !== resource.sha256 || bytes.byteLength !== resource.byteLength) {
        errors.push('Resource hash or byte length mismatch: ' + resource.path);
      }
      if (!/^[0-9a-f]{64}$/.test(resource.sha256)) {
        errors.push('Resource contains malformed SHA-256 digest: ' + resource.path);
      }
    } catch {
      errors.push('Resource is missing: ' + resource.path);
    }
  }

  const canonicalCatalog = canonicalJson(catalog);
  if (!/^[0-9a-f]{64}$/.test(manifest.catalog?.sha256 || '')) {
    errors.push('Catalog SHA-256 digest is malformed.');
  }
  if (manifest.catalog?.sha256 !== sha256(canonicalCatalog)) {
    errors.push('Catalog hash mismatch.');
  }
  const { contentHash: declaredHash, ...manifestWithoutHash } = manifest;
  const expectedContentHash = sha256(
    canonicalJson(manifestHashInput(manifestWithoutHash, catalog)),
  );
  if (!/^[0-9a-f]{64}$/.test(declaredHash)) {
    errors.push('Package content hash is malformed.');
  }
  if (declaredHash !== expectedContentHash) {
    errors.push('Package content hash mismatch.');
  }
  if (manifestRaw !== canonicalJson(manifest) + '\n') {
    errors.push('Manifest bytes are not canonical JSON plus one LF.');
  }
  if (catalogRaw !== canonicalCatalog + '\n') {
    errors.push('Catalog bytes are not canonical JSON plus one LF.');
  }

  return { valid: errors.length === 0, errors, manifest, catalog };
}

export async function assertValidStoryPackage(
  packageDirectory: string,
  appVersion = CURRENT_APP_VERSION,
): Promise<ValidationResult> {
  const result = await validateStoryPackage(packageDirectory, appVersion);
  if (!result.valid) {
    throw new Error('Story package validation failed:\n- ' + result.errors.join('\n- '));
  }
  return result;
}
