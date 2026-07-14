import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import {
  CURRENT_APP_VERSION,
  appVersionSatisfiesRange,
  assertValidStoryPackage,
  canonicalJson,
  isSafePackagePath,
  sha256,
  type PassageRecord,
  type StoryPackageCatalog,
  type StoryPackageManifest,
} from './story-package';

export const LITERARY_RELEASE_SCHEMA_VERSION = '1.0.0';
export const LITERARY_INTAKE_SCHEMA_VERSION = '1.0.0';

const RELATIONSHIPS = [
  'direct-adaptation',
  'thematic-derivative',
  'interactive-only-connective',
  'independent-runtime',
] as const;

export type LiteraryRelationship = (typeof RELATIONSHIPS)[number];

export interface KnownLiteraryRelease {
  releaseId: string;
  storyId: string;
  storyVersion: string;
  releaseSchemaVersion: string;
  sourceCommit: string;
  contentLicense: string;
  supportedAppRange: string;
  contentSha256: string;
  assetSha256: string;
  sourcePath: string;
  sourceUrl: string;
}

export interface CanonicalReference {
  chapterId: string;
  contextField: 'sceneSummary';
}

export interface ConcordanceMapping {
  passageId: string;
  passageStableKey: string;
  relationship: LiteraryRelationship;
  canonicalReferences: CanonicalReference[];
  voiceIds: string[];
  chronologyIds: string[];
  philosophicalConstraintIds: string[];
  promiseIds: string[];
  explanation: string;
}

export interface LiteraryConcordance {
  schemaVersion: string;
  storyId: string;
  literaryReleaseId: string;
  literaryReleaseContentSha256: string;
  relationshipDefinitions: Record<LiteraryRelationship, string>;
  mappings: ConcordanceMapping[];
}

export interface VerifiedLiteraryRelease {
  known: KnownLiteraryRelease;
  artifact: Record<string, unknown>;
  payload: Record<string, unknown>;
  manifest: Record<string, unknown>;
  context: Record<string, unknown[]>;
  identifierSets: Record<string, Set<string>>;
  assetBytes: Uint8Array;
}

export interface VerifiedLiteraryIntake {
  release: VerifiedLiteraryRelease;
  concordance: LiteraryConcordance;
  catalog: StoryPackageCatalog;
  packageManifest: StoryPackageManifest;
}

interface AcceptanceRecord {
  schemaVersion: string;
  acceptedReleaseId: string;
  acceptedContentSha256: string;
  acceptedAssetSha256: string;
  sourceCommit: string;
  sourcePath: string;
  concordancePath: string;
  concordanceSha256: string;
  storyPackage: {
    storyId: string;
    storyVersion: string;
    schemaVersion: string;
    contentHash: string;
    editorialReleaseId: string;
    sourceManuscriptCommit: string;
  };
  runtimeProsePolicy: string;
  reviewedSemanticDiff: {
    baselineReleaseId: string | null;
    classification: string;
    reportSha256: string;
  };
}

export interface SemanticChange {
  field: string;
  before: string | number | null;
  after: string | number | null;
  classification: 'added' | 'changed' | 'removed' | 'unchanged';
}

export interface LiteraryStageReport {
  schemaVersion: string;
  releaseId: string;
  generatedFrom: {
    sourceCommit: string;
    contentSha256: string;
    assetSha256: string;
  };
  validation: {
    status: 'passed';
    applicationVersion: string;
    applicationRange: string;
    passageCount: number;
    concordanceCount: number;
    canonicalContextCounts: Record<string, number>;
  };
  semanticDiff: {
    baselineReleaseId: string | null;
    classification: 'initial-intake' | 'no-semantic-change' | 'changed-release';
    changes: SemanticChange[];
  };
  relationshipCounts: Record<LiteraryRelationship, number>;
  writeBoundary: {
    stagingOnly: true;
    runtimeProseMutation: 'forbidden';
    checkedInMetadataMutation: 'requires-separate-human-acceptance';
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(label + ' must be an object.');
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(label + ' must be an array.');
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(label + ' must be a non-empty string.');
  }
  return value;
}

function requireSha256(value: unknown, label: string): string {
  const digest = requireString(value, label);
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new Error(label + ' must be a lowercase SHA-256 digest.');
  }
  return digest;
}

function requireSafePath(value: unknown, label: string): string {
  const path = requireString(value, label);
  if (!isSafePackagePath(path)) {
    throw new Error(label + ' is an unsafe path: ' + path);
  }
  return path;
}

function requireStableId(value: unknown, label: string): string {
  const id = requireString(value, label);
  if (id !== id.normalize('NFC') || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
    throw new Error(label + ' is not a stable identifier: ' + id);
  }
  return id;
}

function requireInside(root: string, candidate: string, label: string): void {
  const difference = relative(resolve(root), resolve(candidate));
  if (difference === '..' || difference.startsWith('..' + sep) || isAbsolute(difference)) {
    throw new Error(label + ' escapes its allowed root.');
  }
}

function normalizeLiteraryValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\r\n?/g, '\n').normalize('NFC');
  }
  if (Array.isArray(value)) {
    return value.map(normalizeLiteraryValue);
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replace(/\r\n?/g, '\n').normalize('NFC'),
        normalizeLiteraryValue(item),
      ]),
    );
  }
  return value;
}

export function literaryCanonicalJson(value: unknown): string {
  return canonicalJson(normalizeLiteraryValue(value)) + '\n';
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function parseKnownRelease(value: unknown, index: number): KnownLiteraryRelease {
  const item = requireRecord(value, 'Known release ' + index);
  return {
    releaseId: requireStableId(item.releaseId, 'Known release ID'),
    storyId: requireStableId(item.storyId, 'Known release story ID'),
    storyVersion: requireString(item.storyVersion, 'Known release story version'),
    releaseSchemaVersion: requireString(item.releaseSchemaVersion, 'Known release schema version'),
    sourceCommit: requireString(item.sourceCommit, 'Known release source commit'),
    contentLicense: requireString(item.contentLicense, 'Known release content license'),
    supportedAppRange: requireString(item.supportedAppRange, 'Known release application range'),
    contentSha256: requireSha256(item.contentSha256, 'Known release content hash'),
    assetSha256: requireSha256(item.assetSha256, 'Known release asset hash'),
    sourcePath: requireSafePath(item.sourcePath, 'Known release source path'),
    sourceUrl: requireString(item.sourceUrl, 'Known release source URL'),
  };
}

export async function loadKnownLiteraryRelease(
  repositoryRoot: string,
  releaseId: string,
  appVersion = CURRENT_APP_VERSION,
): Promise<KnownLiteraryRelease> {
  const registryPath = resolve(repositoryRoot, 'literary-releases/known-releases.json');
  const registry = requireRecord(await readJson(registryPath), 'Known-release registry');
  if (registry.schemaVersion !== LITERARY_INTAKE_SCHEMA_VERSION) {
    throw new Error('Unsupported known-release registry schema: ' + String(registry.schemaVersion));
  }
  const releases = requireArray(registry.releases, 'Known-release registry releases').map(
    parseKnownRelease,
  );
  const seen = new Set<string>();
  for (const release of releases) {
    if (seen.has(release.releaseId)) {
      throw new Error('Duplicate known release ID: ' + release.releaseId);
    }
    seen.add(release.releaseId);
  }
  const release = releases.find((item) => item.releaseId === releaseId);
  if (!release) {
    throw new Error('Unknown literary release: ' + releaseId);
  }
  if (!appVersionSatisfiesRange(appVersion, release.supportedAppRange)) {
    throw new Error(
      'Application ' + appVersion + ' is incompatible with literary release ' + releaseId + '.',
    );
  }
  return release;
}

function collectContextIdentifiers(
  context: Record<string, unknown[]>,
): Record<string, Set<string>> {
  const descriptors = [
    ['chapters', 'chapterId'],
    ['characters', 'characterId'],
    ['chronology', 'chronologyId'],
    ['excerpts', 'excerptId'],
    ['glossary', 'glossaryId'],
    ['philosophicalConstraints', 'constraintId'],
    ['promisePayoffs', 'promiseId'],
    ['voices', 'voiceId'],
  ] as const;
  const result: Record<string, Set<string>> = {};
  const global = new Set<string>();
  for (const [group, idKey] of descriptors) {
    const ids = new Set<string>();
    for (const [index, raw] of context[group]!.entries()) {
      const record = requireRecord(raw, group + ' record ' + index);
      const id = requireStableId(record[idKey], group + ' ' + idKey);
      if (ids.has(id) || global.has(id)) {
        throw new Error('Duplicate canonical context ID: ' + id);
      }
      ids.add(id);
      global.add(id);
    }
    result[group] = ids;
  }
  return result;
}

function validateContextPaths(context: Record<string, unknown[]>): void {
  for (const [group, values] of Object.entries(context)) {
    for (const [index, raw] of values.entries()) {
      const record = requireRecord(raw, group + ' record ' + index);
      if (record.sourcePath !== undefined) {
        requireSafePath(record.sourcePath, group + ' sourcePath');
      }
      if (group === 'chapters') {
        requireSafePath(record.file, 'Chapter manuscript file');
        const ordinal = record.ordinal;
        if (!Number.isInteger(ordinal) || Number(ordinal) < 1) {
          throw new Error('Chapter ordinal must be a positive integer.');
        }
        const expectedId = 'er-chapter-' + String(ordinal).padStart(3, '0');
        if (record.chapterId !== expectedId) {
          throw new Error('Unstable chapter ID: expected ' + expectedId + '.');
        }
        const summary = requireRecord(record.sceneSummary, 'Chapter scene summary');
        requireSafePath(summary.sourcePath, 'Chapter scene-summary source path');
      }
    }
  }
}

function validateSourceFiles(value: unknown): void {
  const groups = requireRecord(value, 'Literary release sourceFiles');
  const seen = new Set<string>();
  for (const required of ['context', 'manuscript']) {
    const files = requireArray(groups[required], 'Literary release sourceFiles.' + required);
    if (files.length === 0) {
      throw new Error('Literary release sourceFiles.' + required + ' must not be empty.');
    }
    for (const [index, raw] of files.entries()) {
      const record = requireRecord(raw, required + ' source file ' + index);
      const path = requireSafePath(record.path, required + ' source file path');
      requireSha256(record.sha256, required + ' source file hash');
      if (seen.has(path)) {
        throw new Error('Duplicate literary source path: ' + path);
      }
      seen.add(path);
    }
  }
}

export function validateLiteraryReleaseArtifact(
  value: unknown,
  assetBytes: Uint8Array,
  known: KnownLiteraryRelease,
  appVersion = CURRENT_APP_VERSION,
): VerifiedLiteraryRelease {
  if (!appVersionSatisfiesRange(appVersion, known.supportedAppRange)) {
    throw new Error(
      'Application ' +
        appVersion +
        ' is incompatible with literary release ' +
        known.releaseId +
        '.',
    );
  }
  if (sha256(assetBytes) !== known.assetSha256) {
    throw new Error('Literary release asset hash mismatch.');
  }
  const artifact = requireRecord(value, 'Literary release artifact');
  if (artifact.schemaVersion !== known.releaseSchemaVersion) {
    throw new Error('Unsupported literary release schema: ' + String(artifact.schemaVersion));
  }
  if (artifact.schemaVersion !== LITERARY_RELEASE_SCHEMA_VERSION) {
    throw new Error(
      'Importer does not support literary release schema ' + String(artifact.schemaVersion),
    );
  }
  const declaredContentHash = requireSha256(
    artifact.contentSha256,
    'Literary release content hash',
  );
  if (declaredContentHash !== known.contentSha256) {
    throw new Error('Literary release content hash is not allowlisted.');
  }
  const payload = requireRecord(artifact.payload, 'Literary release payload');
  if (sha256(literaryCanonicalJson(payload)) !== declaredContentHash) {
    throw new Error('Literary release payload hash mismatch.');
  }
  if (payload.format !== 'eternal-return-literary-release') {
    throw new Error('Unknown literary release format: ' + String(payload.format));
  }
  requireString(payload.doNotEdit, 'Literary release do-not-edit notice');
  const manifest = requireRecord(payload.manifest, 'Literary release manifest');
  requireString(manifest.contentLicense, 'Literary release content license');
  const exactFields: Array<[string, string]> = [
    ['editorialReleaseId', known.releaseId],
    ['storyId', known.storyId],
    ['storyVersion', known.storyVersion],
    ['sourceCommit', known.sourceCommit],
    ['contentLicense', known.contentLicense],
    ['contractSchemaVersion', LITERARY_RELEASE_SCHEMA_VERSION],
    ['policySchemaVersion', LITERARY_RELEASE_SCHEMA_VERSION],
    ['targetRepository', 'zekusmaximus/Narramorph'],
  ];
  for (const [field, expected] of exactFields) {
    if (manifest[field] !== expected) {
      throw new Error(
        'Literary release manifest ' + field + ' mismatch: expected ' + expected + '.',
      );
    }
  }
  if (!/^[0-9a-f]{40}$/.test(known.sourceCommit)) {
    throw new Error('Literary release source commit is malformed.');
  }
  const permission = requireRecord(manifest.permission, 'Literary release permission');
  requireSafePath(permission.path, 'Literary release permission path');
  if (permission.approvalRecordRequired !== true) {
    throw new Error('Literary release permission must require an approval record.');
  }
  validateSourceFiles(payload.sourceFiles);
  const rawContext = requireRecord(payload.context, 'Literary release context');
  const context: Record<string, unknown[]> = {};
  for (const group of [
    'chapters',
    'characters',
    'chronology',
    'excerpts',
    'glossary',
    'philosophicalConstraints',
    'promisePayoffs',
    'voices',
  ]) {
    context[group] = requireArray(rawContext[group], 'Literary release context.' + group);
  }
  if (context.chapters!.length === 0 || context.voices!.length === 0) {
    throw new Error('Literary release context is incomplete.');
  }
  const identifierSets = collectContextIdentifiers(context);
  validateContextPaths(context);
  return { known, artifact, payload, manifest, context, identifierSets, assetBytes };
}

export async function loadAndVerifyLiteraryRelease(
  repositoryRoot: string,
  releaseId: string,
  appVersion = CURRENT_APP_VERSION,
): Promise<VerifiedLiteraryRelease> {
  const known = await loadKnownLiteraryRelease(repositoryRoot, releaseId, appVersion);
  const sourcePath = resolve(repositoryRoot, known.sourcePath);
  requireInside(repositoryRoot, sourcePath, 'Known literary release source');
  const assetBytes = await readFile(sourcePath);
  let value: unknown;
  try {
    value = JSON.parse(assetBytes.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error('Malformed literary release JSON: ' + String(error));
  }
  return validateLiteraryReleaseArtifact(value, assetBytes, known, appVersion);
}

function requireStringArray(value: unknown, label: string): string[] {
  const items = requireArray(value, label).map((item, index) =>
    requireStableId(item, label + ' item ' + index),
  );
  if (items.length === 0) {
    throw new Error(label + ' must not be empty.');
  }
  if (new Set(items).size !== items.length) {
    throw new Error(label + ' contains duplicate IDs.');
  }
  return items;
}

function assertIdsExist(ids: string[], known: Set<string>, label: string): void {
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error(label + ' references unknown canonical claim ' + id + '.');
    }
  }
}

export function validateLiteraryConcordance(
  value: unknown,
  release: VerifiedLiteraryRelease,
  catalog: StoryPackageCatalog,
): LiteraryConcordance {
  const root = requireRecord(value, 'Literary concordance');
  if (root.schemaVersion !== LITERARY_INTAKE_SCHEMA_VERSION) {
    throw new Error('Unsupported literary concordance schema: ' + String(root.schemaVersion));
  }
  if (root.storyId !== release.known.storyId) {
    throw new Error('Literary concordance story ID does not match the release.');
  }
  if (root.literaryReleaseId !== release.known.releaseId) {
    throw new Error('Literary concordance release ID does not match the release.');
  }
  if (root.literaryReleaseContentSha256 !== release.known.contentSha256) {
    throw new Error('Literary concordance release hash does not match the release.');
  }
  const definitions = requireRecord(
    root.relationshipDefinitions,
    'Literary concordance relationship definitions',
  );
  const relationshipDefinitions = {} as Record<LiteraryRelationship, string>;
  for (const relationship of RELATIONSHIPS) {
    relationshipDefinitions[relationship] = requireString(
      definitions[relationship],
      'Relationship definition ' + relationship,
    );
  }
  const passagesById = new Map(catalog.passages.map((passage) => [passage.id, passage]));
  const mappings: ConcordanceMapping[] = [];
  const mapped = new Set<string>();
  for (const [index, raw] of requireArray(
    root.mappings,
    'Literary concordance mappings',
  ).entries()) {
    const record = requireRecord(raw, 'Concordance mapping ' + index);
    const passageId = requireStableId(record.passageId, 'Concordance passage ID');
    const passage = passagesById.get(passageId);
    if (!passage) {
      throw new Error('Concordance references unknown shipped passage ' + passageId + '.');
    }
    if (mapped.has(passageId)) {
      throw new Error('Concordance maps shipped passage more than once: ' + passageId);
    }
    mapped.add(passageId);
    const stableKey = requireStableId(record.passageStableKey, 'Concordance passage stable key');
    if (stableKey !== passage.stableKey) {
      throw new Error('Concordance stable key mismatch for ' + passageId + '.');
    }
    const relationship = requireString(
      record.relationship,
      'Concordance relationship',
    ) as LiteraryRelationship;
    if (!RELATIONSHIPS.includes(relationship)) {
      throw new Error('Unknown literary relationship: ' + relationship);
    }
    const canonicalReferences = requireArray(
      record.canonicalReferences,
      'Concordance canonical references',
    ).map((reference, referenceIndex): CanonicalReference => {
      const item = requireRecord(reference, 'Canonical reference ' + referenceIndex);
      const chapterId = requireStableId(item.chapterId, 'Canonical chapter ID');
      if (!release.identifierSets.chapters!.has(chapterId)) {
        throw new Error('Concordance references unknown canonical claim ' + chapterId + '.');
      }
      if (item.contextField !== 'sceneSummary') {
        throw new Error('Canonical chapter reference must identify sceneSummary context.');
      }
      return { chapterId, contextField: 'sceneSummary' };
    });
    if (canonicalReferences.length === 0) {
      throw new Error('Concordance passage ' + passageId + ' has no chapter/scene mapping.');
    }
    const voiceIds = requireStringArray(record.voiceIds, 'Concordance voice IDs');
    const chronologyIds = requireStringArray(record.chronologyIds, 'Concordance chronology IDs');
    const philosophicalConstraintIds = requireStringArray(
      record.philosophicalConstraintIds,
      'Concordance philosophical constraint IDs',
    );
    const promiseIds = requireStringArray(record.promiseIds, 'Concordance promise IDs');
    assertIdsExist(voiceIds, release.identifierSets.voices!, 'Concordance voice IDs');
    assertIdsExist(chronologyIds, release.identifierSets.chronology!, 'Concordance chronology IDs');
    assertIdsExist(
      philosophicalConstraintIds,
      release.identifierSets.philosophicalConstraints!,
      'Concordance philosophical constraint IDs',
    );
    assertIdsExist(promiseIds, release.identifierSets.promisePayoffs!, 'Concordance promise IDs');
    mappings.push({
      passageId,
      passageStableKey: stableKey,
      relationship,
      canonicalReferences,
      voiceIds,
      chronologyIds,
      philosophicalConstraintIds,
      promiseIds,
      explanation: requireString(record.explanation, 'Concordance explanation'),
    });
  }
  const missing = catalog.passages.filter((passage) => !mapped.has(passage.id));
  if (missing.length > 0) {
    throw new Error(
      'Unmapped shipped passages: ' + missing.map((passage) => passage.stableKey).join(', '),
    );
  }
  if (mappings.length !== catalog.passages.length) {
    throw new Error('Concordance cardinality does not match the shipped passage catalog.');
  }
  return {
    schemaVersion: LITERARY_INTAKE_SCHEMA_VERSION,
    storyId: release.known.storyId,
    literaryReleaseId: release.known.releaseId,
    literaryReleaseContentSha256: release.known.contentSha256,
    relationshipDefinitions,
    mappings,
  };
}

async function loadPackage(repositoryRoot: string): Promise<{
  manifest: StoryPackageManifest;
  catalog: StoryPackageCatalog;
}> {
  const packageRoot = resolve(repositoryRoot, 'story-packages/eternal-return');
  const result = await assertValidStoryPackage(packageRoot);
  return { manifest: result.manifest!, catalog: result.catalog! };
}

export async function verifyLiteraryIntake(
  repositoryRoot: string,
  releaseId: string,
  appVersion = CURRENT_APP_VERSION,
): Promise<VerifiedLiteraryIntake> {
  const release = await loadAndVerifyLiteraryRelease(repositoryRoot, releaseId, appVersion);
  const { manifest, catalog } = await loadPackage(repositoryRoot);
  const concordanceValue = await readJson(
    resolve(repositoryRoot, 'story-packages/concordance/eternal-return.v1.json'),
  );
  const concordance = validateLiteraryConcordance(concordanceValue, release, catalog);
  return { release, concordance, catalog, packageManifest: manifest };
}

function countRelationships(mappings: ConcordanceMapping[]): Record<LiteraryRelationship, number> {
  const result: Record<LiteraryRelationship, number> = {
    'direct-adaptation': 0,
    'thematic-derivative': 0,
    'interactive-only-connective': 0,
    'independent-runtime': 0,
  };
  for (const mapping of mappings) {
    result[mapping.relationship]++;
  }
  return result;
}

async function readOptionalAcceptance(repositoryRoot: string): Promise<AcceptanceRecord | null> {
  try {
    return (await readJson(
      resolve(repositoryRoot, 'literary-releases/accepted/eternal-return.json'),
    )) as AcceptanceRecord;
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    if (code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function semanticChange(
  field: string,
  before: string | number | null,
  after: string | number | null,
): SemanticChange {
  return {
    field,
    before,
    after,
    classification:
      before === after
        ? 'unchanged'
        : before === null
          ? 'added'
          : after === null
            ? 'removed'
            : 'changed',
  };
}

function buildSemanticChanges(
  intake: VerifiedLiteraryIntake,
  acceptance: AcceptanceRecord | null,
): SemanticChange[] {
  return [
    semanticChange(
      'literaryReleaseId',
      acceptance?.acceptedReleaseId ?? null,
      intake.release.known.releaseId,
    ),
    semanticChange(
      'sourceCommit',
      acceptance?.sourceCommit ?? null,
      intake.release.known.sourceCommit,
    ),
    semanticChange(
      'releaseContentSha256',
      acceptance?.acceptedContentSha256 ?? null,
      intake.release.known.contentSha256,
    ),
    semanticChange(
      'releaseAssetSha256',
      acceptance?.acceptedAssetSha256 ?? null,
      intake.release.known.assetSha256,
    ),
    semanticChange(
      'storyPackageVersion',
      acceptance?.storyPackage.storyVersion ?? null,
      intake.packageManifest.storyVersion,
    ),
    semanticChange(
      'storyPackageContentHash',
      acceptance?.storyPackage.contentHash ?? null,
      intake.packageManifest.contentHash,
    ),
    semanticChange(
      'canonicalChapterCount',
      acceptance ? intake.release.context.chapters!.length : null,
      intake.release.context.chapters!.length,
    ),
    semanticChange(
      'shippedPassageCount',
      acceptance ? intake.catalog.passages.length : null,
      intake.catalog.passages.length,
    ),
  ];
}

export async function createLiteraryStageReport(
  repositoryRoot: string,
  releaseId: string,
): Promise<{ report: LiteraryStageReport; reportPath: string; markdownPath: string }> {
  const intake = await verifyLiteraryIntake(repositoryRoot, releaseId);
  const acceptance = await readOptionalAcceptance(repositoryRoot);
  const changes = buildSemanticChanges(intake, acceptance);
  const changed = changes.some((change) => change.classification !== 'unchanged');
  const classification = acceptance
    ? changed
      ? 'changed-release'
      : 'no-semantic-change'
    : 'initial-intake';
  const report: LiteraryStageReport = {
    schemaVersion: LITERARY_INTAKE_SCHEMA_VERSION,
    releaseId,
    generatedFrom: {
      sourceCommit: intake.release.known.sourceCommit,
      contentSha256: intake.release.known.contentSha256,
      assetSha256: intake.release.known.assetSha256,
    },
    validation: {
      status: 'passed',
      applicationVersion: CURRENT_APP_VERSION,
      applicationRange: intake.release.known.supportedAppRange,
      passageCount: intake.catalog.passages.length,
      concordanceCount: intake.concordance.mappings.length,
      canonicalContextCounts: Object.fromEntries(
        Object.entries(intake.release.context).map(([key, values]) => [key, values.length]),
      ),
    },
    semanticDiff: {
      baselineReleaseId: acceptance?.acceptedReleaseId ?? null,
      classification,
      changes,
    },
    relationshipCounts: countRelationships(intake.concordance.mappings),
    writeBoundary: {
      stagingOnly: true,
      runtimeProseMutation: 'forbidden',
      checkedInMetadataMutation: 'requires-separate-human-acceptance',
    },
  };
  const outputRoot = resolve(repositoryRoot, 'build/literary-import-staging', releaseId);
  requireInside(
    resolve(repositoryRoot, 'build/literary-import-staging'),
    outputRoot,
    'Staging output',
  );
  await mkdir(outputRoot, { recursive: true });
  const reportPath = resolve(outputRoot, 'report.json');
  const markdownPath = resolve(outputRoot, 'semantic-diff.md');
  await writeFile(reportPath, canonicalJson(report) + '\n', 'utf8');
  await writeFile(markdownPath, renderSemanticDiff(report), 'utf8');
  return { report, reportPath, markdownPath };
}

export function renderSemanticDiff(report: LiteraryStageReport): string {
  const lines = [
    '# Literary release semantic diff',
    '',
    '- Candidate: `' + report.releaseId + '`',
    '- Baseline: `' + (report.semanticDiff.baselineReleaseId ?? 'none') + '`',
    '- Classification: `' + report.semanticDiff.classification + '`',
    '- Validation: `passed`',
    '- Runtime prose mutation: `forbidden`',
    '',
    '| Field | Before | After | Classification |',
    '| --- | --- | --- | --- |',
  ];
  for (const change of report.semanticDiff.changes) {
    lines.push(
      '| ' +
        change.field +
        ' | `' +
        String(change.before ?? 'none') +
        '` | `' +
        String(change.after ?? 'none') +
        '` | ' +
        change.classification +
        ' |',
    );
  }
  lines.push('', 'The importer wrote this report only to the ignored staging directory.', '');
  return lines.join('\n');
}

function requireAcceptance(value: unknown): AcceptanceRecord {
  const record = requireRecord(value, 'Literary release acceptance');
  const storyPackage = requireRecord(record.storyPackage, 'Accepted Story Package');
  const reviewed = requireRecord(record.reviewedSemanticDiff, 'Reviewed semantic diff');
  return {
    schemaVersion: requireString(record.schemaVersion, 'Acceptance schema version'),
    acceptedReleaseId: requireStableId(record.acceptedReleaseId, 'Accepted release ID'),
    acceptedContentSha256: requireSha256(
      record.acceptedContentSha256,
      'Accepted release content hash',
    ),
    acceptedAssetSha256: requireSha256(record.acceptedAssetSha256, 'Accepted release asset hash'),
    sourceCommit: requireString(record.sourceCommit, 'Accepted source commit'),
    sourcePath: requireSafePath(record.sourcePath, 'Accepted source path'),
    concordancePath: requireSafePath(record.concordancePath, 'Accepted concordance path'),
    concordanceSha256: requireSha256(record.concordanceSha256, 'Accepted concordance hash'),
    storyPackage: {
      storyId: requireStableId(storyPackage.storyId, 'Accepted Story Package ID'),
      storyVersion: requireString(storyPackage.storyVersion, 'Accepted Story Package version'),
      schemaVersion: requireString(storyPackage.schemaVersion, 'Accepted Story Package schema'),
      contentHash: requireSha256(storyPackage.contentHash, 'Accepted Story Package hash'),
      editorialReleaseId: requireStableId(
        storyPackage.editorialReleaseId,
        'Accepted Story Package release ID',
      ),
      sourceManuscriptCommit: requireString(
        storyPackage.sourceManuscriptCommit,
        'Accepted Story Package source commit',
      ),
    },
    runtimeProsePolicy: requireString(record.runtimeProsePolicy, 'Runtime prose policy'),
    reviewedSemanticDiff: {
      baselineReleaseId:
        reviewed.baselineReleaseId === null
          ? null
          : requireStableId(reviewed.baselineReleaseId, 'Semantic diff baseline release'),
      classification: requireString(reviewed.classification, 'Semantic diff classification'),
      reportSha256: requireSha256(reviewed.reportSha256, 'Reviewed semantic diff hash'),
    },
  };
}

export async function validateAcceptedLiteraryRelease(
  repositoryRoot: string,
): Promise<VerifiedLiteraryIntake> {
  const acceptancePath = resolve(repositoryRoot, 'literary-releases/accepted/eternal-return.json');
  const acceptance = requireAcceptance(await readJson(acceptancePath));
  if (acceptance.schemaVersion !== LITERARY_INTAKE_SCHEMA_VERSION) {
    throw new Error('Unsupported literary acceptance schema: ' + acceptance.schemaVersion);
  }
  const intake = await verifyLiteraryIntake(repositoryRoot, acceptance.acceptedReleaseId);
  const expected = intake.release.known;
  const checks: Array<[string, string, string]> = [
    ['content hash', acceptance.acceptedContentSha256, expected.contentSha256],
    ['asset hash', acceptance.acceptedAssetSha256, expected.assetSha256],
    ['source commit', acceptance.sourceCommit, expected.sourceCommit],
    ['source path', acceptance.sourcePath, expected.sourcePath],
    ['Story Package story ID', acceptance.storyPackage.storyId, intake.packageManifest.storyId],
    [
      'Story Package version',
      acceptance.storyPackage.storyVersion,
      intake.packageManifest.storyVersion,
    ],
    [
      'Story Package schema',
      acceptance.storyPackage.schemaVersion,
      intake.packageManifest.schemaVersion,
    ],
    ['Story Package hash', acceptance.storyPackage.contentHash, intake.packageManifest.contentHash],
    [
      'Story Package editorial release',
      acceptance.storyPackage.editorialReleaseId,
      intake.packageManifest.editorialReleaseId,
    ],
    [
      'Story Package source commit',
      acceptance.storyPackage.sourceManuscriptCommit,
      intake.packageManifest.sourceManuscriptCommit,
    ],
  ];
  for (const [label, actual, expectedValue] of checks) {
    if (actual !== expectedValue) {
      throw new Error('Accepted ' + label + ' does not match verified intake.');
    }
  }
  const concordancePath = resolve(repositoryRoot, acceptance.concordancePath);
  requireInside(repositoryRoot, concordancePath, 'Accepted concordance');
  if (sha256(await readFile(concordancePath)) !== acceptance.concordanceSha256) {
    throw new Error('Accepted concordance hash mismatch.');
  }
  if (acceptance.runtimeProsePolicy !== 'metadata-only; never overwrite runtime prose') {
    throw new Error('Accepted runtime prose policy is not restrictive enough.');
  }
  return intake;
}

function contextRecordById(values: unknown[], idKey: string, id: string): Record<string, unknown> {
  const result = values
    .map((value) => requireRecord(value, 'Context record'))
    .find((value) => value[idKey] === id);
  if (!result) {
    throw new Error('Missing verified context record ' + id + '.');
  }
  return result;
}

export async function explainShippedPassage(
  repositoryRoot: string,
  passageIdOrStableKey: string,
): Promise<Record<string, unknown>> {
  const intake = await validateAcceptedLiteraryRelease(repositoryRoot);
  const passage = intake.catalog.passages.find(
    (item) => item.id === passageIdOrStableKey || item.stableKey === passageIdOrStableKey,
  );
  if (!passage) {
    throw new Error('Unknown shipped passage: ' + passageIdOrStableKey);
  }
  const mapping = intake.concordance.mappings.find((item) => item.passageId === passage.id)!;
  return {
    passage: {
      id: passage.id,
      stableKey: passage.stableKey,
      title: passage.title,
      layer: passage.layer,
    },
    relationship: mapping.relationship,
    explanation: mapping.explanation,
    canonicalScenes: mapping.canonicalReferences.map((reference) => {
      const chapter = contextRecordById(
        intake.release.context.chapters!,
        'chapterId',
        reference.chapterId,
      );
      const summary = requireRecord(chapter.sceneSummary, 'Canonical scene summary');
      return {
        chapterId: reference.chapterId,
        chapterTitle: chapter.title,
        movement: chapter.movement,
        voice: chapter.voice,
        timeline: chapter.timeline,
        sceneSummaryKind: summary.kind,
        sceneSourceId: summary.sourceId,
      };
    }),
    voiceIds: mapping.voiceIds,
    chronologyIds: mapping.chronologyIds,
    philosophicalConstraintIds: mapping.philosophicalConstraintIds,
    promiseIds: mapping.promiseIds,
    provenance: {
      literaryReleaseId: intake.release.known.releaseId,
      sourceCommit: intake.release.known.sourceCommit,
      releaseContentSha256: intake.release.known.contentSha256,
      storyPackageVersion: intake.packageManifest.storyVersion,
      storyPackageContentHash: intake.packageManifest.contentHash,
    },
  };
}

export function passageByStableKey(
  catalog: StoryPackageCatalog,
  stableKey: string,
): PassageRecord | undefined {
  return catalog.passages.find((passage) => passage.stableKey === stableKey);
}
