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
export const LITERARY_CONCORDANCE_SCHEMA_VERSION = '1.1.0';
export const CONTRADICTION_REGISTER_SCHEMA_VERSION = '1.0.0';
export const LITERARY_SLICE_SCHEMA_VERSION = '1.0.0';
export const LITERARY_SLICE_INTAKE_SCHEMA_VERSION = '1.0.0';

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

export interface VariationFamilyPolicy {
  coversAllVariations: true;
  variationCount: number;
  selectionAxes: string[];
  sampledVariationIds: string[];
  samplingNote?: string;
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
  variations: VariationFamilyPolicy;
}

export interface CoverageExemption {
  identityClass: string;
  count: number;
  rule: string;
}

export interface ConcordanceCoveragePolicy {
  description: string;
  auditReference: string;
  exemptions: CoverageExemption[];
}

export interface ConcordanceEndingMapping {
  endingId: string;
  endingStableKey: string;
  passageId: string;
  endingPhilosophy: string;
  explanation: string;
}

export type ConcordanceCharacterKind = 'canonical-voice' | 'runtime-composite';

export interface ConcordanceCharacterMapping {
  characterId: string;
  characterStableKey: string;
  kind: ConcordanceCharacterKind;
  canonicalCharacterId: string | null;
  voiceIds: string[];
  explanation: string;
}

export interface ConcordanceEdgeCoverage {
  relationship: 'interactive-only-connective';
  rule: string;
  edgeStableKeys: string[];
}

export interface ConcordanceExplanationMapping {
  explanationId: string;
  explanationStableKey: string;
  classification: string;
  explanation: string;
}

export type ConcordanceThemeKind = 'primary-theme' | 'secondary-theme' | 'motif';

export interface ConcordanceThemeMapping {
  theme: string;
  kind: ConcordanceThemeKind;
  canonicalIds: string[];
  explanation: string;
}

export interface RuntimeThemeDeclaration {
  primary: string[];
  secondary: string[];
  motifs: string[];
}

export interface LiteraryConcordance {
  schemaVersion: string;
  storyId: string;
  literaryReleaseId: string;
  literaryReleaseContentSha256: string;
  relationshipDefinitions: Record<LiteraryRelationship, string>;
  coveragePolicy: ConcordanceCoveragePolicy;
  mappings: ConcordanceMapping[];
  endings: ConcordanceEndingMapping[];
  characters: ConcordanceCharacterMapping[];
  edges: ConcordanceEdgeCoverage;
  explanations: ConcordanceExplanationMapping[];
  themesAndMotifs: ConcordanceThemeMapping[];
}

export type ContradictionSeverity = 'sev-1' | 'sev-2' | 'sev-3';
export type ContradictionStatus = 'open' | 'accepted-as-is' | 'resolved';

export interface ContradictionEntry {
  id: string;
  title: string;
  category: string;
  severity: ContradictionSeverity;
  description: string;
  evidence: string[];
  owner: string;
  status: ContradictionStatus;
  decision: string | null;
  resolvedBy: string | null;
  recordedAt: string;
}

export interface ContradictionRegister {
  schemaVersion: string;
  storyId: string;
  severityDefinitions: Record<ContradictionSeverity, string>;
  statusDefinitions: Record<ContradictionStatus, string>;
  entries: ContradictionEntry[];
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
  contradictions?: ContradictionRegister;
}

export interface KnownLiterarySlice {
  sliceId: string;
  sliceVersion: string;
  storyId: string;
  releaseId: string;
  sourceCommit: string;
  contentSha256: string;
  assetSha256: string;
  sourcePath: string;
  sourceUrl: string;
  runtimeGraphPath: string;
  passageStableKeys: string[];
}

export interface LiterarySliceTarget {
  passageId: string;
  passageStableKey: string;
  layer: number;
  connections: string[];
}

export interface LiterarySliceMapping {
  passageStableKey: string;
  relationship: LiteraryRelationship;
  chapterIds: string[];
  voiceIds: string[];
  chronologyIds: string[];
  philosophicalConstraintIds: string[];
  promiseIds: string[];
  themeClaims: string[];
}

export interface VerifiedLiterarySlice {
  known: KnownLiterarySlice;
  artifact: Record<string, unknown>;
  payload: Record<string, unknown>;
  manifest: Record<string, unknown>;
  baseRelease: Record<string, unknown>;
  context: Record<string, unknown[]>;
  runtimeTargets: LiterarySliceTarget[];
  mappings: LiterarySliceMapping[];
  assetBytes: Uint8Array;
}

export interface VerifiedLiterarySliceIntake extends VerifiedLiteraryIntake {
  slice: VerifiedLiterarySlice;
}

interface LiterarySliceAcceptance {
  schemaVersion: string;
  acceptedSliceId: string;
  acceptedSliceVersion: string;
  acceptedContentSha256: string;
  acceptedAssetSha256: string;
  sourceCommit: string;
  sourcePath: string;
  baseReleaseId: string;
  baseReleaseContentSha256: string;
  runtimeGraphPath: string;
  passageStableKeys: string[];
  concordancePath: string;
  concordanceSha256: string;
  storyPackage: AcceptanceRecord['storyPackage'];
  runtimeProsePolicy: string;
  reviewedStage: {
    classification: string;
    reportSha256: string;
  };
  runtimeContentProof: {
    trackedFileCount: number;
    beforeTreeSha256: string;
    afterTreeSha256: string;
  };
}

export interface LiterarySliceStageReport {
  schemaVersion: string;
  sliceId: string;
  sliceVersion: string;
  baseReleaseId: string;
  generatedFrom: {
    sourceCommit: string;
    contentSha256: string;
    assetSha256: string;
  };
  validation: {
    status: 'passed';
    applicationVersion: string;
    storyPackageVersion: string;
    runtimeGraphPath: string;
    passageStableKeys: string[];
    canonicalContextCounts: Record<string, number>;
  };
  constraintChecks: Array<{
    passageStableKey: string;
    relationship: LiteraryRelationship;
    voiceIds: string[];
    philosophicalConstraintIds: string[];
    status: 'passed';
  }>;
  review: {
    baselineSliceId: string | null;
    classification: 'initial-intake' | 'no-semantic-change' | 'changed-slice';
  };
  provenance: {
    everyTransferredFieldMachineReadable: true;
    manualCopyPasteRequired: false;
  };
  writeBoundary: {
    stagingOnly: true;
    runtimeProseMutation: 'forbidden';
    checkedInMetadataMutation: 'requires-separate-human-acceptance';
  };
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

function validateVariationFamilyPolicy(
  value: unknown,
  passage: PassageRecord,
  familyCount: number,
  familyStableKeys: Set<string>,
): VariationFamilyPolicy {
  const record = requireRecord(value, 'Variation policy for ' + passage.stableKey);
  if (record.coversAllVariations !== true) {
    throw new Error(
      'Variation policy for ' + passage.stableKey + ' must declare coversAllVariations: true.',
    );
  }
  if (record.variationCount !== familyCount) {
    throw new Error(
      'Variation policy for ' +
        passage.stableKey +
        ' declares ' +
        String(record.variationCount) +
        ' variations but the catalog ships ' +
        String(familyCount) +
        '.',
    );
  }
  const selectionAxes = requireStringArray(
    record.selectionAxes,
    'Variation selection axes for ' + passage.stableKey,
  );
  const sampledVariationIds = requireStringArray(
    record.sampledVariationIds,
    'Sampled variation IDs for ' + passage.stableKey,
  );
  for (const sampled of sampledVariationIds) {
    if (!familyStableKeys.has(sampled)) {
      throw new Error(
        'Sampled variation ' + sampled + ' does not belong to passage ' + passage.stableKey + '.',
      );
    }
  }
  const policy: VariationFamilyPolicy = {
    coversAllVariations: true,
    variationCount: familyCount,
    selectionAxes,
    sampledVariationIds,
  };
  if (record.samplingNote !== undefined) {
    policy.samplingNote = requireString(
      record.samplingNote,
      'Sampling note for ' + passage.stableKey,
    );
  }
  return policy;
}

function validateCoveragePolicy(
  value: unknown,
  catalog: StoryPackageCatalog,
  sectionCoveredClasses: ReadonlySet<string>,
): ConcordanceCoveragePolicy {
  const record = requireRecord(value, 'Concordance coverage policy');
  const exemptions: CoverageExemption[] = [];
  const exempted = new Set<string>();
  for (const [index, raw] of requireArray(
    record.exemptions,
    'Concordance coverage exemptions',
  ).entries()) {
    const item = requireRecord(raw, 'Coverage exemption ' + index);
    const identityClass = requireString(item.identityClass, 'Coverage exemption identity class');
    if (sectionCoveredClasses.has(identityClass)) {
      throw new Error(
        'Coverage exemption ' + identityClass + ' conflicts with a mapped concordance section.',
      );
    }
    if (exempted.has(identityClass)) {
      throw new Error('Duplicate coverage exemption: ' + identityClass);
    }
    exempted.add(identityClass);
    if (typeof item.count !== 'number' || !Number.isInteger(item.count) || item.count < 0) {
      throw new Error('Coverage exemption ' + identityClass + ' has an invalid count.');
    }
    exemptions.push({
      identityClass,
      count: item.count,
      rule: requireString(item.rule, 'Coverage exemption rule for ' + identityClass),
    });
  }
  const exemptedCatalogCounts: Record<string, number> = {
    conditions: catalog.conditions.length,
    proseBeats: catalog.proseBeats.length,
    resources: catalog.resources.length,
  };
  for (const [identityClass, expectedCount] of Object.entries(exemptedCatalogCounts)) {
    const exemption = exemptions.find((item) => item.identityClass === identityClass);
    if (!exemption) {
      throw new Error(
        'Catalog identity class ' +
          identityClass +
          ' is neither mapped by a concordance section nor explicitly exempted.',
      );
    }
    if (exemption.count !== expectedCount) {
      throw new Error(
        'Coverage exemption ' +
          identityClass +
          ' declares ' +
          String(exemption.count) +
          ' identities but the catalog ships ' +
          String(expectedCount) +
          '.',
      );
    }
  }
  const accounted = new Set([...sectionCoveredClasses, ...exempted]);
  for (const identityClass of Object.keys(catalog)) {
    if (!accounted.has(identityClass)) {
      throw new Error(
        'Catalog identity class ' +
          identityClass +
          ' is neither mapped by a concordance section nor explicitly exempted.',
      );
    }
  }
  return {
    description: requireString(record.description, 'Concordance coverage policy description'),
    auditReference: requireString(record.auditReference, 'Concordance coverage audit reference'),
    exemptions,
  };
}

export function validateContradictionRegister(
  value: unknown,
  storyId: string,
): ContradictionRegister {
  const root = requireRecord(value, 'Contradiction register');
  if (root.schemaVersion !== CONTRADICTION_REGISTER_SCHEMA_VERSION) {
    throw new Error('Unsupported contradiction register schema: ' + String(root.schemaVersion));
  }
  if (root.storyId !== storyId) {
    throw new Error('Contradiction register story ID does not match the release.');
  }
  const severities: ContradictionSeverity[] = ['sev-1', 'sev-2', 'sev-3'];
  const statuses: ContradictionStatus[] = ['open', 'accepted-as-is', 'resolved'];
  const severityDefinitions = requireRecord(
    root.severityDefinitions,
    'Contradiction severity definitions',
  );
  const statusDefinitions = requireRecord(
    root.statusDefinitions,
    'Contradiction status definitions',
  );
  for (const severity of severities) {
    requireString(severityDefinitions[severity], 'Severity definition ' + severity);
  }
  for (const status of statuses) {
    requireString(statusDefinitions[status], 'Status definition ' + status);
  }
  const entries: ContradictionEntry[] = [];
  const seen = new Set<string>();
  for (const [index, raw] of requireArray(root.entries, 'Contradiction entries').entries()) {
    const record = requireRecord(raw, 'Contradiction entry ' + index);
    const id = requireString(record.id, 'Contradiction entry ID');
    if (!/^CTR-\d{3}$/.test(id)) {
      throw new Error('Contradiction entry ID must match CTR-NNN: ' + id);
    }
    if (seen.has(id)) {
      throw new Error('Duplicate contradiction entry ID: ' + id);
    }
    seen.add(id);
    const severity = requireString(record.severity, id + ' severity') as ContradictionSeverity;
    if (!severities.includes(severity)) {
      throw new Error(id + ' has unknown severity: ' + severity);
    }
    const status = requireString(record.status, id + ' status') as ContradictionStatus;
    if (!statuses.includes(status)) {
      throw new Error(id + ' has unknown status: ' + status);
    }
    const evidence = requireArray(record.evidence, id + ' evidence').map((item, itemIndex) =>
      requireString(item, id + ' evidence item ' + itemIndex),
    );
    if (evidence.length === 0) {
      throw new Error(id + ' must cite at least one piece of evidence.');
    }
    const decision =
      record.decision === null ? null : requireString(record.decision, id + ' decision');
    if (status !== 'open' && decision === null) {
      throw new Error(id + ' is ' + status + ' but records no decision.');
    }
    const resolvedBy =
      record.resolvedBy === null ? null : requireString(record.resolvedBy, id + ' resolvedBy');
    if (status === 'resolved' && resolvedBy === null) {
      throw new Error(id + ' is resolved but records no resolvedBy reference.');
    }
    const recordedAt = requireString(record.recordedAt, id + ' recordedAt');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAt)) {
      throw new Error(id + ' recordedAt must be an ISO date (YYYY-MM-DD).');
    }
    entries.push({
      id,
      title: requireString(record.title, id + ' title'),
      category: requireString(record.category, id + ' category'),
      severity,
      description: requireString(record.description, id + ' description'),
      evidence,
      owner: requireString(record.owner, id + ' owner'),
      status,
      decision,
      resolvedBy,
      recordedAt,
    });
  }
  return {
    schemaVersion: CONTRADICTION_REGISTER_SCHEMA_VERSION,
    storyId,
    severityDefinitions: severityDefinitions as Record<ContradictionSeverity, string>,
    statusDefinitions: statusDefinitions as Record<ContradictionStatus, string>,
    entries,
  };
}

export function summarizeContradictions(register: ContradictionRegister): {
  total: number;
  open: number;
  openSevOne: number;
} {
  const open = register.entries.filter((entry) => entry.status === 'open');
  return {
    total: register.entries.length,
    open: open.length,
    openSevOne: open.filter((entry) => entry.severity === 'sev-1').length,
  };
}

export function validateLiteraryConcordance(
  value: unknown,
  release: VerifiedLiteraryRelease,
  catalog: StoryPackageCatalog,
  runtimeThemes?: RuntimeThemeDeclaration | null,
): LiteraryConcordance {
  const root = requireRecord(value, 'Literary concordance');
  if (root.schemaVersion !== LITERARY_CONCORDANCE_SCHEMA_VERSION) {
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
  const variationCounts = new Map<string, number>();
  const variationKeysByPassage = new Map<string, Set<string>>();
  for (const variation of catalog.variations) {
    variationCounts.set(variation.passageId, (variationCounts.get(variation.passageId) ?? 0) + 1);
    let keys = variationKeysByPassage.get(variation.passageId);
    if (!keys) {
      keys = new Set();
      variationKeysByPassage.set(variation.passageId, keys);
    }
    keys.add(variation.stableKey);
  }
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
    const variations = validateVariationFamilyPolicy(
      record.variations,
      passage,
      variationCounts.get(passageId) ?? 0,
      variationKeysByPassage.get(passageId) ?? new Set<string>(),
    );
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
      variations,
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
  const mappedVariationTotal = mappings.reduce(
    (sum, mapping) => sum + mapping.variations.variationCount,
    0,
  );
  if (mappedVariationTotal !== catalog.variations.length) {
    throw new Error(
      'Concordance variation coverage (' +
        String(mappedVariationTotal) +
        ') does not match the shipped variation catalog (' +
        String(catalog.variations.length) +
        ').',
    );
  }

  const endingsById = new Map(catalog.endings.map((ending) => [ending.id, ending]));
  const endings: ConcordanceEndingMapping[] = [];
  const endingSeen = new Set<string>();
  for (const [index, raw] of requireArray(root.endings, 'Concordance endings').entries()) {
    const record = requireRecord(raw, 'Concordance ending ' + index);
    const endingId = requireStableId(record.endingId, 'Concordance ending ID');
    const ending = endingsById.get(endingId);
    if (!ending) {
      throw new Error('Concordance references unknown shipped ending ' + endingId + '.');
    }
    if (endingSeen.has(endingId)) {
      throw new Error('Concordance maps shipped ending more than once: ' + endingId);
    }
    endingSeen.add(endingId);
    const endingStableKey = requireStableId(
      record.endingStableKey,
      'Concordance ending stable key',
    );
    if (endingStableKey !== ending.stableKey) {
      throw new Error('Concordance ending stable key mismatch for ' + endingId + '.');
    }
    const passageId = requireStableId(record.passageId, 'Concordance ending passage ID');
    if (passageId !== ending.passageId) {
      throw new Error('Concordance ending ' + endingId + ' names the wrong terminal passage.');
    }
    if (!mapped.has(passageId)) {
      throw new Error('Concordance ending ' + endingId + ' targets an unmapped passage.');
    }
    endings.push({
      endingId,
      endingStableKey,
      passageId,
      endingPhilosophy: requireString(record.endingPhilosophy, 'Concordance ending philosophy'),
      explanation: requireString(record.explanation, 'Concordance ending explanation'),
    });
  }
  if (endings.length !== catalog.endings.length) {
    throw new Error('Concordance ending coverage does not match the shipped ending catalog.');
  }

  const charactersById = new Map(catalog.characters.map((character) => [character.id, character]));
  const characters: ConcordanceCharacterMapping[] = [];
  const characterSeen = new Set<string>();
  const claimedCanonicalCharacters = new Set<string>();
  for (const [index, raw] of requireArray(root.characters, 'Concordance characters').entries()) {
    const record = requireRecord(raw, 'Concordance character ' + index);
    const characterId = requireStableId(record.characterId, 'Concordance character ID');
    const character = charactersById.get(characterId);
    if (!character) {
      throw new Error('Concordance references unknown shipped character ' + characterId + '.');
    }
    if (characterSeen.has(characterId)) {
      throw new Error('Concordance maps shipped character more than once: ' + characterId);
    }
    characterSeen.add(characterId);
    const characterStableKey = requireStableId(
      record.characterStableKey,
      'Concordance character stable key',
    );
    if (characterStableKey !== character.stableKey) {
      throw new Error('Concordance character stable key mismatch for ' + characterId + '.');
    }
    const kind = requireString(
      record.kind,
      'Concordance character kind',
    ) as ConcordanceCharacterKind;
    if (kind !== 'canonical-voice' && kind !== 'runtime-composite') {
      throw new Error(
        'Concordance character ' + characterStableKey + ' has unknown kind ' + kind + '.',
      );
    }
    const voiceIds = requireStringArray(
      record.voiceIds,
      'Concordance character voice IDs for ' + characterStableKey,
    );
    assertIdsExist(
      voiceIds,
      release.identifierSets.voices!,
      'Concordance character voice IDs for ' + characterStableKey,
    );
    let canonicalCharacterId: string | null = null;
    if (kind === 'canonical-voice') {
      canonicalCharacterId = requireStableId(
        record.canonicalCharacterId,
        'Concordance canonical character ID for ' + characterStableKey,
      );
      if (!release.identifierSets.characters!.has(canonicalCharacterId)) {
        throw new Error(
          'Concordance character ' +
            characterStableKey +
            ' references unknown canonical character ' +
            canonicalCharacterId +
            '.',
        );
      }
      if (claimedCanonicalCharacters.has(canonicalCharacterId)) {
        throw new Error(
          'Canonical character ' +
            canonicalCharacterId +
            ' is claimed by more than one runtime character.',
        );
      }
      claimedCanonicalCharacters.add(canonicalCharacterId);
      if (voiceIds.length !== 1) {
        throw new Error(
          'Canonical-voice character ' + characterStableKey + ' must declare exactly one voice.',
        );
      }
    } else {
      if (record.canonicalCharacterId !== null) {
        throw new Error(
          'Runtime-composite character ' +
            characterStableKey +
            ' must declare canonicalCharacterId: null.',
        );
      }
      if (voiceIds.length < 2) {
        throw new Error(
          'Runtime-composite character ' + characterStableKey + ' must span at least two voices.',
        );
      }
    }
    characters.push({
      characterId,
      characterStableKey,
      kind,
      canonicalCharacterId,
      voiceIds,
      explanation: requireString(
        record.explanation,
        'Concordance character explanation for ' + characterStableKey,
      ),
    });
  }
  if (characters.length !== catalog.characters.length) {
    throw new Error('Concordance character coverage does not match the shipped character catalog.');
  }
  for (const canonicalCharacterId of release.identifierSets.characters!) {
    if (!claimedCanonicalCharacters.has(canonicalCharacterId)) {
      throw new Error(
        'Canonical character ' + canonicalCharacterId + ' is not claimed by any runtime character.',
      );
    }
  }

  const edgesRecord = requireRecord(root.edges, 'Concordance edge coverage');
  if (edgesRecord.relationship !== 'interactive-only-connective') {
    throw new Error('Concordance edge coverage must declare interactive-only-connective.');
  }
  const edgeStableKeys = requireArray(
    edgesRecord.edgeStableKeys,
    'Concordance edge stable keys',
  ).map((item, index) => requireString(item, 'Concordance edge stable key ' + index));
  const declaredEdges = new Set(edgeStableKeys);
  if (declaredEdges.size !== edgeStableKeys.length) {
    throw new Error('Concordance edge stable keys contain duplicates.');
  }
  const shippedEdges = new Set(catalog.edges.map((edge) => edge.stableKey));
  for (const stableKey of shippedEdges) {
    if (!declaredEdges.has(stableKey)) {
      throw new Error('Concordance edge coverage is missing shipped edge ' + stableKey + '.');
    }
  }
  for (const stableKey of declaredEdges) {
    if (!shippedEdges.has(stableKey)) {
      throw new Error('Concordance edge coverage names unknown edge ' + stableKey + '.');
    }
  }
  const edges: ConcordanceEdgeCoverage = {
    relationship: 'interactive-only-connective',
    rule: requireString(edgesRecord.rule, 'Concordance edge coverage rule'),
    edgeStableKeys,
  };

  const explanationsById = new Map(
    catalog.explanations.map((explanation) => [explanation.id, explanation]),
  );
  const explanations: ConcordanceExplanationMapping[] = [];
  const explanationSeen = new Set<string>();
  for (const [index, raw] of requireArray(
    root.explanations,
    'Concordance explanations',
  ).entries()) {
    const record = requireRecord(raw, 'Concordance explanation ' + index);
    const explanationId = requireStableId(record.explanationId, 'Concordance explanation ID');
    const explanation = explanationsById.get(explanationId);
    if (!explanation) {
      throw new Error('Concordance references unknown shipped explanation ' + explanationId + '.');
    }
    if (explanationSeen.has(explanationId)) {
      throw new Error('Concordance maps shipped explanation more than once: ' + explanationId);
    }
    explanationSeen.add(explanationId);
    const explanationStableKey = requireStableId(
      record.explanationStableKey,
      'Concordance explanation stable key',
    );
    if (explanationStableKey !== explanation.stableKey) {
      throw new Error('Concordance explanation stable key mismatch for ' + explanationId + '.');
    }
    const classification = requireString(
      record.classification,
      'Concordance explanation classification',
    );
    if (!classification.endsWith('-no-literary-claim')) {
      throw new Error(
        'Concordance explanation ' +
          explanationStableKey +
          ' must be classified as making no literary claim.',
      );
    }
    explanations.push({
      explanationId,
      explanationStableKey,
      classification,
      explanation: requireString(record.explanation, 'Concordance explanation text'),
    });
  }
  if (explanations.length !== catalog.explanations.length) {
    throw new Error(
      'Concordance explanation coverage does not match the shipped explanation catalog.',
    );
  }

  const themeKinds: ConcordanceThemeKind[] = ['primary-theme', 'secondary-theme', 'motif'];
  const canonicalThemeIds = new Set([
    ...release.identifierSets.philosophicalConstraints!,
    ...release.identifierSets.glossary!,
  ]);
  const themesAndMotifs: ConcordanceThemeMapping[] = [];
  const themeSeen = new Set<string>();
  for (const [index, raw] of requireArray(
    root.themesAndMotifs,
    'Concordance themes and motifs',
  ).entries()) {
    const record = requireRecord(raw, 'Concordance theme ' + index);
    const theme = requireString(record.theme, 'Concordance theme name');
    if (themeSeen.has(theme)) {
      throw new Error('Concordance maps theme more than once: ' + theme);
    }
    themeSeen.add(theme);
    const kind = requireString(record.kind, 'Concordance theme kind') as ConcordanceThemeKind;
    if (!themeKinds.includes(kind)) {
      throw new Error('Concordance theme ' + theme + ' has unknown kind ' + kind + '.');
    }
    const canonicalIds = requireStringArray(
      record.canonicalIds,
      'Concordance canonical IDs for theme ' + theme,
    );
    for (const canonicalId of canonicalIds) {
      if (!canonicalThemeIds.has(canonicalId)) {
        throw new Error(
          'Concordance theme ' + theme + ' references unknown canonical claim ' + canonicalId + '.',
        );
      }
    }
    themesAndMotifs.push({
      theme,
      kind,
      canonicalIds,
      explanation: requireString(record.explanation, 'Concordance theme explanation for ' + theme),
    });
  }
  if (runtimeThemes) {
    const declared: Array<[ConcordanceThemeKind, string[]]> = [
      ['primary-theme', runtimeThemes.primary],
      ['secondary-theme', runtimeThemes.secondary],
      ['motif', runtimeThemes.motifs],
    ];
    for (const [kind, expected] of declared) {
      const actual = themesAndMotifs
        .filter((entry) => entry.kind === kind)
        .map((entry) => entry.theme);
      if (!sameOrderedStrings(actual, expected)) {
        throw new Error(
          'Concordance ' +
            kind +
            ' entries do not match the runtime story declaration: expected [' +
            expected.join(', ') +
            '], found [' +
            actual.join(', ') +
            '].',
        );
      }
    }
  }

  const sectionCoveredClasses = new Set([
    'passages',
    'variations',
    'edges',
    'endings',
    'characters',
    'explanations',
  ]);
  const coveragePolicy = validateCoveragePolicy(
    root.coveragePolicy,
    catalog,
    sectionCoveredClasses,
  );

  return {
    schemaVersion: LITERARY_CONCORDANCE_SCHEMA_VERSION,
    storyId: release.known.storyId,
    literaryReleaseId: release.known.releaseId,
    literaryReleaseContentSha256: release.known.contentSha256,
    relationshipDefinitions,
    coveragePolicy,
    mappings,
    endings,
    characters,
    edges,
    explanations,
    themesAndMotifs,
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

async function loadRuntimeThemeDeclaration(
  repositoryRoot: string,
): Promise<RuntimeThemeDeclaration> {
  const story = requireRecord(
    await readJson(resolve(repositoryRoot, 'src/data/stories/eternal-return/story.json')),
    'Runtime story declaration',
  );
  const themes = requireRecord(story.themes, 'Runtime story themes');
  const readList = (value: unknown, label: string): string[] =>
    requireArray(value, label).map((item, index) => requireString(item, label + ' item ' + index));
  return {
    primary: readList(themes.primary, 'Runtime primary themes'),
    secondary: readList(themes.secondary, 'Runtime secondary themes'),
    motifs: readList(themes.motifs, 'Runtime motifs'),
  };
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
  const runtimeThemes = await loadRuntimeThemeDeclaration(repositoryRoot);
  const concordance = validateLiteraryConcordance(
    concordanceValue,
    release,
    catalog,
    runtimeThemes,
  );
  const contradictions = validateContradictionRegister(
    await readJson(resolve(repositoryRoot, 'story-packages/concordance/contradictions.v1.json')),
    release.known.storyId,
  );
  return { release, concordance, catalog, packageManifest: manifest, contradictions };
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

function parseKnownSlice(value: unknown, index: number): KnownLiterarySlice {
  const item = requireRecord(value, 'Known literary slice ' + index);
  const passageStableKeys = requireStringArray(
    item.passageStableKeys,
    'Known literary slice passage stable keys',
  );
  if (passageStableKeys.length !== 2) {
    throw new Error('Known literary slice must identify exactly two passages.');
  }
  return {
    sliceId: requireStableId(item.sliceId, 'Known literary slice ID'),
    sliceVersion: requireString(item.sliceVersion, 'Known literary slice version'),
    storyId: requireStableId(item.storyId, 'Known literary slice story ID'),
    releaseId: requireStableId(item.releaseId, 'Known literary slice release ID'),
    sourceCommit: requireString(item.sourceCommit, 'Known literary slice source commit'),
    contentSha256: requireSha256(item.contentSha256, 'Known literary slice content hash'),
    assetSha256: requireSha256(item.assetSha256, 'Known literary slice asset hash'),
    sourcePath: requireSafePath(item.sourcePath, 'Known literary slice source path'),
    sourceUrl: requireString(item.sourceUrl, 'Known literary slice source URL'),
    runtimeGraphPath: requireSafePath(
      item.runtimeGraphPath,
      'Known literary slice runtime graph path',
    ),
    passageStableKeys,
  };
}

export async function loadKnownLiterarySlice(
  repositoryRoot: string,
  sliceId: string,
): Promise<KnownLiterarySlice> {
  const registry = requireRecord(
    await readJson(resolve(repositoryRoot, 'literary-releases/known-slices.json')),
    'Known literary-slice registry',
  );
  if (registry.schemaVersion !== LITERARY_SLICE_INTAKE_SCHEMA_VERSION) {
    throw new Error(
      'Unsupported known literary-slice registry schema: ' + String(registry.schemaVersion),
    );
  }
  const slices = requireArray(registry.slices, 'Known literary-slice registry slices').map(
    parseKnownSlice,
  );
  if (new Set(slices.map((slice) => slice.sliceId)).size !== slices.length) {
    throw new Error('Duplicate known literary slice ID.');
  }
  const result = slices.find((slice) => slice.sliceId === sliceId);
  if (!result) {
    throw new Error('Unknown literary slice: ' + sliceId);
  }
  if (!/^[0-9a-f]{40}$/.test(result.sourceCommit)) {
    throw new Error('Known literary slice source commit is malformed.');
  }
  return result;
}

function sameOrderedStrings(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function requirePossiblyEmptyStringArray(value: unknown, label: string): string[] {
  const items = requireArray(value, label).map((item, index) =>
    requireStableId(item, label + ' item ' + index),
  );
  if (new Set(items).size !== items.length) {
    throw new Error(label + ' contains duplicate IDs.');
  }
  return items;
}

function requireSliceContext(
  rawContext: unknown,
  release: VerifiedLiteraryRelease,
): Record<string, unknown[]> {
  const context = requireRecord(rawContext, 'Literary slice context');
  const descriptors = [
    ['chapters', 'chapterId'],
    ['chronology', 'chronologyId'],
    ['philosophicalConstraints', 'constraintId'],
    ['promisePayoffs', 'promiseId'],
    ['voices', 'voiceId'],
  ] as const;
  const result: Record<string, unknown[]> = {};
  for (const [group, idKey] of descriptors) {
    const values = requireArray(context[group], 'Literary slice context.' + group);
    if (values.length === 0) {
      throw new Error('Literary slice context.' + group + ' must not be empty.');
    }
    const ids = new Set<string>();
    const releaseById = new Map(
      release.context[group]!.map((raw) => {
        const record = requireRecord(raw, 'Released context.' + group);
        return [requireStableId(record[idKey], 'Released context ID'), record] as const;
      }),
    );
    for (const raw of values) {
      const record = requireRecord(raw, 'Literary slice context.' + group + ' record');
      const id = requireStableId(record[idKey], 'Literary slice context ID');
      if (ids.has(id)) {
        throw new Error('Duplicate literary slice context ID: ' + id);
      }
      ids.add(id);
      const released = releaseById.get(id);
      if (!released || canonicalJson(released) !== canonicalJson(record)) {
        throw new Error('Literary slice context is not an exact base-release subset: ' + id);
      }
    }
    result[group] = values;
  }
  return result;
}

export function validateLiterarySliceArtifact(
  value: unknown,
  assetBytes: Uint8Array,
  known: KnownLiterarySlice,
  intake: VerifiedLiteraryIntake,
): VerifiedLiterarySlice {
  if (sha256(assetBytes) !== known.assetSha256) {
    throw new Error('Literary slice asset hash mismatch.');
  }
  const artifact = requireRecord(value, 'Literary slice artifact');
  if (artifact.schemaVersion !== LITERARY_SLICE_SCHEMA_VERSION) {
    throw new Error('Unsupported literary slice schema: ' + String(artifact.schemaVersion));
  }
  const declaredContentHash = requireSha256(artifact.contentSha256, 'Literary slice content hash');
  if (declaredContentHash !== known.contentSha256) {
    throw new Error('Literary slice content hash is not allowlisted.');
  }
  const payload = requireRecord(artifact.payload, 'Literary slice payload');
  if (sha256(literaryCanonicalJson(payload)) !== declaredContentHash) {
    throw new Error('Literary slice payload hash mismatch.');
  }
  if (payload.format !== 'eternal-return-literary-slice') {
    throw new Error('Unknown literary slice format: ' + String(payload.format));
  }
  requireString(payload.doNotEdit, 'Literary slice do-not-edit notice');

  const baseRelease = requireRecord(payload.baseRelease, 'Literary slice base release');
  const expectedBase: Record<string, string> = {
    artifactFile: known.releaseId + '.json',
    contentSha256: intake.release.known.contentSha256,
    editorialReleaseId: known.releaseId,
    schemaVersion: LITERARY_RELEASE_SCHEMA_VERSION,
    sourceCommit: known.sourceCommit,
  };
  for (const [field, expected] of Object.entries(expectedBase)) {
    if (baseRelease[field] !== expected) {
      throw new Error('Literary slice base-release ' + field + ' mismatch.');
    }
  }

  const manifest = requireRecord(payload.manifest, 'Literary slice manifest');
  const exactManifest: Record<string, string> = {
    sliceId: known.sliceId,
    sliceVersion: known.sliceVersion,
    storyId: known.storyId,
    sourceCommit: known.sourceCommit,
    targetRepository: 'zekusmaximus/Narramorph',
    contentLicense: intake.release.known.contentLicense,
  };
  for (const [field, expected] of Object.entries(exactManifest)) {
    if (manifest[field] !== expected) {
      throw new Error('Literary slice manifest ' + field + ' mismatch.');
    }
  }
  for (const sourceName of ['selectionSource', 'schemaSource']) {
    const source = requireRecord(manifest[sourceName], 'Literary slice ' + sourceName);
    requireSafePath(source.path, 'Literary slice ' + sourceName + ' path');
    requireSha256(source.sha256, 'Literary slice ' + sourceName + ' hash');
  }

  const context = requireSliceContext(payload.context, intake.release);
  const runtimeTargets = requireArray(payload.runtimeTargets, 'Literary slice runtime targets').map(
    (raw, index): LiterarySliceTarget => {
      const target = requireRecord(raw, 'Literary slice runtime target ' + index);
      const passageStableKey = requireStableId(
        target.passageStableKey,
        'Literary slice passage stable key',
      );
      const passageId = requireStableId(target.passageId, 'Literary slice passage ID');
      const layer = Number(target.layer);
      if (!Number.isInteger(layer) || ![1, 2].includes(layer)) {
        throw new Error('Literary slice passage layer must be 1 or 2.');
      }
      const passage = intake.catalog.passages.find((candidate) => candidate.id === passageId);
      if (!passage || passage.stableKey !== passageStableKey || passage.layer !== layer) {
        throw new Error('Literary slice target does not match the shipped passage catalog.');
      }
      return {
        passageId,
        passageStableKey,
        layer,
        connections: requirePossiblyEmptyStringArray(
          target.connections,
          'Literary slice target connections',
        ),
      };
    },
  );
  if (
    runtimeTargets.length !== 2 ||
    !sameOrderedStrings(
      runtimeTargets.map((target) => target.passageStableKey),
      known.passageStableKeys,
    ) ||
    !runtimeTargets[0]!.connections.includes(runtimeTargets[1]!.passageStableKey)
  ) {
    throw new Error('Literary slice targets are not the allowlisted connected L1-to-L2 pair.');
  }

  const contextIds = {
    chapters: new Set(
      context.chapters!.map((raw) =>
        requireString(requireRecord(raw, 'Chapter').chapterId, 'chapter ID'),
      ),
    ),
    chronology: new Set(
      context.chronology!.map((raw) =>
        requireString(requireRecord(raw, 'Chronology').chronologyId, 'chronology ID'),
      ),
    ),
    philosophicalConstraints: new Set(
      context.philosophicalConstraints!.map((raw) =>
        requireString(requireRecord(raw, 'Constraint').constraintId, 'constraint ID'),
      ),
    ),
    promisePayoffs: new Set(
      context.promisePayoffs!.map((raw) =>
        requireString(requireRecord(raw, 'Promise').promiseId, 'promise ID'),
      ),
    ),
    voices: new Set(
      context.voices!.map((raw) => requireString(requireRecord(raw, 'Voice').voiceId, 'voice ID')),
    ),
  };
  const mappings = requireArray(payload.mappings, 'Literary slice mappings').map(
    (raw, index): LiterarySliceMapping => {
      const mapping = requireRecord(raw, 'Literary slice mapping ' + index);
      const passageStableKey = requireStableId(
        mapping.passageStableKey,
        'Literary slice mapping passage key',
      );
      const relationship = requireString(
        mapping.relationship,
        'Literary slice relationship',
      ) as LiteraryRelationship;
      if (!RELATIONSHIPS.includes(relationship)) {
        throw new Error('Unknown literary slice relationship: ' + relationship);
      }
      const result: LiterarySliceMapping = {
        passageStableKey,
        relationship,
        chapterIds: requireStringArray(mapping.chapterIds, 'Literary slice chapter IDs'),
        voiceIds: requireStringArray(mapping.voiceIds, 'Literary slice voice IDs'),
        chronologyIds: requireStringArray(mapping.chronologyIds, 'Literary slice chronology IDs'),
        philosophicalConstraintIds: requireStringArray(
          mapping.philosophicalConstraintIds,
          'Literary slice philosophical constraint IDs',
        ),
        promiseIds: requireStringArray(mapping.promiseIds, 'Literary slice promise IDs'),
        themeClaims: requireStringArray(mapping.themeClaims, 'Literary slice theme claims'),
      };
      assertIdsExist(result.chapterIds, contextIds.chapters, 'Literary slice chapter IDs');
      assertIdsExist(result.voiceIds, contextIds.voices, 'Literary slice voice IDs');
      assertIdsExist(result.chronologyIds, contextIds.chronology, 'Literary slice chronology IDs');
      assertIdsExist(
        result.philosophicalConstraintIds,
        contextIds.philosophicalConstraints,
        'Literary slice philosophical constraint IDs',
      );
      assertIdsExist(result.promiseIds, contextIds.promisePayoffs, 'Literary slice promise IDs');

      const concordance = intake.concordance.mappings.find(
        (candidate) => candidate.passageStableKey === passageStableKey,
      );
      if (!concordance) {
        throw new Error('Literary slice target has no shipped concordance mapping.');
      }
      const concordanceChapterIds = concordance.canonicalReferences.map(
        (reference) => reference.chapterId,
      );
      if (
        concordance.relationship !== relationship ||
        !sameOrderedStrings(concordanceChapterIds, result.chapterIds) ||
        !sameOrderedStrings(concordance.voiceIds, result.voiceIds) ||
        !sameOrderedStrings(concordance.chronologyIds, result.chronologyIds) ||
        !sameOrderedStrings(
          concordance.philosophicalConstraintIds,
          result.philosophicalConstraintIds,
        ) ||
        !sameOrderedStrings(concordance.promiseIds, result.promiseIds)
      ) {
        throw new Error(
          'Literary slice voice/philosophy/provenance mapping does not match the concordance.',
        );
      }
      return result;
    },
  );
  if (
    mappings.length !== runtimeTargets.length ||
    !sameOrderedStrings(
      mappings.map((mapping) => mapping.passageStableKey),
      runtimeTargets.map((target) => target.passageStableKey),
    )
  ) {
    throw new Error('Literary slice mappings do not match its ordered runtime targets.');
  }

  const validation = requireRecord(manifest.validation, 'Literary slice validation summary');
  const selectedCounts = requireRecord(
    validation.selectedContextCounts,
    'Literary slice selected-context counts',
  );
  if (
    validation.mappingCount !== mappings.length ||
    validation.runtimeTargetCount !== runtimeTargets.length ||
    Object.entries(context).some(([group, values]) => selectedCounts[group] !== values.length)
  ) {
    throw new Error('Literary slice validation summary does not match the artifact.');
  }
  return {
    known,
    artifact,
    payload,
    manifest,
    baseRelease,
    context,
    runtimeTargets,
    mappings,
    assetBytes,
  };
}

async function validateLiterarySliceRuntimeGraph(
  repositoryRoot: string,
  slice: VerifiedLiterarySlice,
): Promise<void> {
  const graphPath = resolve(repositoryRoot, slice.known.runtimeGraphPath);
  requireInside(repositoryRoot, graphPath, 'Literary slice runtime graph');
  const graph = requireRecord(await readJson(graphPath), 'Literary slice runtime graph');
  const nodes = requireArray(graph.nodes, 'Literary slice runtime graph nodes').map((raw) =>
    requireRecord(raw, 'Literary slice runtime graph node'),
  );
  for (const target of slice.runtimeTargets) {
    const node = nodes.find((candidate) => candidate.id === target.passageStableKey);
    if (!node || node.layer !== target.layer) {
      throw new Error('Literary slice target does not match its runtime graph node.');
    }
    const graphConnections = requirePossiblyEmptyStringArray(
      node.connections,
      'Literary slice runtime graph connections',
    );
    if (target.connections.some((connection) => !graphConnections.includes(connection))) {
      throw new Error('Literary slice connection does not exist in the runtime graph.');
    }
  }
  if (
    !requirePossiblyEmptyStringArray(
      nodes.find((node) => node.id === slice.runtimeTargets[0]!.passageStableKey)!.connections,
      'Literary slice opening connections',
    ).includes(slice.runtimeTargets[1]!.passageStableKey)
  ) {
    throw new Error('Literary slice L1-to-L2 edge is absent from the runtime graph.');
  }
}

export async function loadAndVerifyLiterarySlice(
  repositoryRoot: string,
  sliceId: string,
): Promise<VerifiedLiterarySliceIntake> {
  const known = await loadKnownLiterarySlice(repositoryRoot, sliceId);
  const intake = await verifyLiteraryIntake(repositoryRoot, known.releaseId);
  if (
    known.storyId !== intake.release.known.storyId ||
    known.sourceCommit !== intake.release.known.sourceCommit
  ) {
    throw new Error('Known literary slice does not match its verified base release.');
  }
  const sourcePath = resolve(repositoryRoot, known.sourcePath);
  requireInside(repositoryRoot, sourcePath, 'Known literary slice source');
  const assetBytes = await readFile(sourcePath);
  let value: unknown;
  try {
    value = JSON.parse(assetBytes.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error('Malformed literary slice JSON: ' + String(error));
  }
  const slice = validateLiterarySliceArtifact(value, assetBytes, known, intake);
  await validateLiterarySliceRuntimeGraph(repositoryRoot, slice);
  return { ...intake, slice };
}

function requireSliceAcceptance(value: unknown): LiterarySliceAcceptance {
  const record = requireRecord(value, 'Literary slice acceptance');
  const storyPackage = requireRecord(record.storyPackage, 'Accepted slice Story Package');
  const reviewedStage = requireRecord(record.reviewedStage, 'Reviewed literary slice stage');
  const runtimeContentProof = requireRecord(
    record.runtimeContentProof,
    'Literary slice runtime content proof',
  );
  const trackedFileCount = Number(runtimeContentProof.trackedFileCount);
  if (!Number.isInteger(trackedFileCount) || trackedFileCount < 1) {
    throw new Error('Literary slice runtime content proof file count is invalid.');
  }
  return {
    schemaVersion: requireString(record.schemaVersion, 'Literary slice acceptance schema'),
    acceptedSliceId: requireStableId(record.acceptedSliceId, 'Accepted literary slice ID'),
    acceptedSliceVersion: requireString(
      record.acceptedSliceVersion,
      'Accepted literary slice version',
    ),
    acceptedContentSha256: requireSha256(
      record.acceptedContentSha256,
      'Accepted literary slice content hash',
    ),
    acceptedAssetSha256: requireSha256(
      record.acceptedAssetSha256,
      'Accepted literary slice asset hash',
    ),
    sourceCommit: requireString(record.sourceCommit, 'Accepted literary slice source commit'),
    sourcePath: requireSafePath(record.sourcePath, 'Accepted literary slice source path'),
    baseReleaseId: requireStableId(record.baseReleaseId, 'Accepted slice base release ID'),
    baseReleaseContentSha256: requireSha256(
      record.baseReleaseContentSha256,
      'Accepted slice base release hash',
    ),
    runtimeGraphPath: requireSafePath(
      record.runtimeGraphPath,
      'Accepted literary slice runtime graph path',
    ),
    passageStableKeys: requireStringArray(
      record.passageStableKeys,
      'Accepted literary slice passage keys',
    ),
    concordancePath: requireSafePath(
      record.concordancePath,
      'Accepted literary slice concordance path',
    ),
    concordanceSha256: requireSha256(
      record.concordanceSha256,
      'Accepted literary slice concordance hash',
    ),
    storyPackage: {
      storyId: requireStableId(storyPackage.storyId, 'Accepted slice Story Package ID'),
      storyVersion: requireString(
        storyPackage.storyVersion,
        'Accepted slice Story Package version',
      ),
      schemaVersion: requireString(
        storyPackage.schemaVersion,
        'Accepted slice Story Package schema',
      ),
      contentHash: requireSha256(storyPackage.contentHash, 'Accepted slice Story Package hash'),
      editorialReleaseId: requireStableId(
        storyPackage.editorialReleaseId,
        'Accepted slice Story Package release',
      ),
      sourceManuscriptCommit: requireString(
        storyPackage.sourceManuscriptCommit,
        'Accepted slice Story Package source commit',
      ),
    },
    runtimeProsePolicy: requireString(
      record.runtimeProsePolicy,
      'Accepted literary slice runtime prose policy',
    ),
    reviewedStage: {
      classification: requireString(
        reviewedStage.classification,
        'Accepted literary slice stage classification',
      ),
      reportSha256: requireSha256(
        reviewedStage.reportSha256,
        'Accepted literary slice stage report hash',
      ),
    },
    runtimeContentProof: {
      trackedFileCount,
      beforeTreeSha256: requireSha256(
        runtimeContentProof.beforeTreeSha256,
        'Literary slice before runtime tree hash',
      ),
      afterTreeSha256: requireSha256(
        runtimeContentProof.afterTreeSha256,
        'Literary slice after runtime tree hash',
      ),
    },
  };
}

async function readOptionalSliceAcceptance(
  repositoryRoot: string,
): Promise<LiterarySliceAcceptance | null> {
  try {
    return requireSliceAcceptance(
      await readJson(
        resolve(repositoryRoot, 'literary-releases/accepted/eternal-return-vertical-slice.json'),
      ),
    );
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    if (code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export function renderLiterarySliceReview(report: LiterarySliceStageReport): string {
  const lines = [
    '# Literary vertical-slice review',
    '',
    '- Slice: `' + report.sliceId + '@' + report.sliceVersion + '`',
    '- Base literary release: `' + report.baseReleaseId + '`',
    '- Classification: `' + report.review.classification + '`',
    '- Runtime path: `' + report.validation.passageStableKeys.join(' → ') + '`',
    '- Runtime prose mutation: `forbidden`',
    '- Manual copy/paste required: `false`',
    '',
    '| Passage | Relationship | Voice constraints | Philosophy constraints | Status |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const check of report.constraintChecks) {
    lines.push(
      '| ' +
        check.passageStableKey +
        ' | ' +
        check.relationship +
        ' | ' +
        check.voiceIds.join(', ') +
        ' | ' +
        check.philosophicalConstraintIds.join(', ') +
        ' | passed |',
    );
  }
  lines.push(
    '',
    'All transferred fields resolve through checked-in machine-readable provenance.',
    '',
  );
  return lines.join('\n');
}

export async function createLiterarySliceStageReport(
  repositoryRoot: string,
  sliceId: string,
): Promise<{
  report: LiterarySliceStageReport;
  reportPath: string;
  markdownPath: string;
  reportSha256: string;
}> {
  const intake = await loadAndVerifyLiterarySlice(repositoryRoot, sliceId);
  const acceptance = await readOptionalSliceAcceptance(repositoryRoot);
  const sameIdentity =
    acceptance?.acceptedSliceId === intake.slice.known.sliceId &&
    acceptance.acceptedSliceVersion === intake.slice.known.sliceVersion &&
    acceptance.acceptedContentSha256 === intake.slice.known.contentSha256 &&
    acceptance.acceptedAssetSha256 === intake.slice.known.assetSha256 &&
    acceptance.baseReleaseId === intake.release.known.releaseId &&
    acceptance.storyPackage.contentHash === intake.packageManifest.contentHash;
  const classification = acceptance
    ? sameIdentity
      ? 'no-semantic-change'
      : 'changed-slice'
    : 'initial-intake';
  const report: LiterarySliceStageReport = {
    schemaVersion: LITERARY_SLICE_INTAKE_SCHEMA_VERSION,
    sliceId: intake.slice.known.sliceId,
    sliceVersion: intake.slice.known.sliceVersion,
    baseReleaseId: intake.release.known.releaseId,
    generatedFrom: {
      sourceCommit: intake.slice.known.sourceCommit,
      contentSha256: intake.slice.known.contentSha256,
      assetSha256: intake.slice.known.assetSha256,
    },
    validation: {
      status: 'passed',
      applicationVersion: CURRENT_APP_VERSION,
      storyPackageVersion: intake.packageManifest.storyVersion,
      runtimeGraphPath: intake.slice.known.runtimeGraphPath,
      passageStableKeys: [...intake.slice.known.passageStableKeys],
      canonicalContextCounts: Object.fromEntries(
        Object.entries(intake.slice.context).map(([group, values]) => [group, values.length]),
      ),
    },
    constraintChecks: intake.slice.mappings.map((mapping) => ({
      passageStableKey: mapping.passageStableKey,
      relationship: mapping.relationship,
      voiceIds: mapping.voiceIds,
      philosophicalConstraintIds: mapping.philosophicalConstraintIds,
      status: 'passed',
    })),
    review: {
      baselineSliceId: acceptance?.acceptedSliceId ?? null,
      classification,
    },
    provenance: {
      everyTransferredFieldMachineReadable: true,
      manualCopyPasteRequired: false,
    },
    writeBoundary: {
      stagingOnly: true,
      runtimeProseMutation: 'forbidden',
      checkedInMetadataMutation: 'requires-separate-human-acceptance',
    },
  };
  const outputRoot = resolve(
    repositoryRoot,
    'build/literary-import-staging',
    intake.release.known.releaseId,
    'slices',
    sliceId,
  );
  requireInside(
    resolve(repositoryRoot, 'build/literary-import-staging'),
    outputRoot,
    'Literary slice staging output',
  );
  await mkdir(outputRoot, { recursive: true });
  const reportPath = resolve(outputRoot, 'report.json');
  const markdownPath = resolve(outputRoot, 'review.md');
  const reportBytes = canonicalJson(report) + '\n';
  await writeFile(reportPath, reportBytes, 'utf8');
  await writeFile(markdownPath, renderLiterarySliceReview(report), 'utf8');
  return { report, reportPath, markdownPath, reportSha256: sha256(reportBytes) };
}

export async function validateAcceptedLiterarySlice(
  repositoryRoot: string,
): Promise<VerifiedLiterarySliceIntake> {
  const acceptance = requireSliceAcceptance(
    await readJson(
      resolve(repositoryRoot, 'literary-releases/accepted/eternal-return-vertical-slice.json'),
    ),
  );
  if (acceptance.schemaVersion !== LITERARY_SLICE_INTAKE_SCHEMA_VERSION) {
    throw new Error('Unsupported literary slice acceptance schema: ' + acceptance.schemaVersion);
  }
  const intake = await loadAndVerifyLiterarySlice(repositoryRoot, acceptance.acceptedSliceId);
  const checks: Array<[string, string, string]> = [
    ['slice version', acceptance.acceptedSliceVersion, intake.slice.known.sliceVersion],
    ['slice content hash', acceptance.acceptedContentSha256, intake.slice.known.contentSha256],
    ['slice asset hash', acceptance.acceptedAssetSha256, intake.slice.known.assetSha256],
    ['slice source commit', acceptance.sourceCommit, intake.slice.known.sourceCommit],
    ['slice source path', acceptance.sourcePath, intake.slice.known.sourcePath],
    ['base release ID', acceptance.baseReleaseId, intake.release.known.releaseId],
    [
      'base release content hash',
      acceptance.baseReleaseContentSha256,
      intake.release.known.contentSha256,
    ],
    ['runtime graph path', acceptance.runtimeGraphPath, intake.slice.known.runtimeGraphPath],
    ['Story Package ID', acceptance.storyPackage.storyId, intake.packageManifest.storyId],
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
      'Story Package release',
      acceptance.storyPackage.editorialReleaseId,
      intake.packageManifest.editorialReleaseId,
    ],
    [
      'Story Package source commit',
      acceptance.storyPackage.sourceManuscriptCommit,
      intake.packageManifest.sourceManuscriptCommit,
    ],
  ];
  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error('Accepted literary slice ' + label + ' does not match verified intake.');
    }
  }
  if (!sameOrderedStrings(acceptance.passageStableKeys, intake.slice.known.passageStableKeys)) {
    throw new Error('Accepted literary slice passage keys do not match verified intake.');
  }
  const concordancePath = resolve(repositoryRoot, acceptance.concordancePath);
  requireInside(repositoryRoot, concordancePath, 'Accepted literary slice concordance');
  if (sha256(await readFile(concordancePath)) !== acceptance.concordanceSha256) {
    throw new Error('Accepted literary slice concordance hash mismatch.');
  }
  if (acceptance.runtimeProsePolicy !== 'metadata-only; never overwrite runtime prose') {
    throw new Error('Accepted literary slice runtime prose policy is not restrictive enough.');
  }
  if (
    acceptance.reviewedStage.classification !== 'initial-intake' ||
    acceptance.runtimeContentProof.beforeTreeSha256 !==
      acceptance.runtimeContentProof.afterTreeSha256
  ) {
    throw new Error('Accepted literary slice review or no-prose proof is invalid.');
  }
  return intake;
}

export async function explainAcceptedLiterarySlice(
  repositoryRoot: string,
): Promise<Record<string, unknown>> {
  const intake = await validateAcceptedLiterarySlice(repositoryRoot);
  return {
    slice: {
      id: intake.slice.known.sliceId,
      version: intake.slice.known.sliceVersion,
      rationale: intake.slice.manifest.rationale,
    },
    path: intake.slice.mappings.map((sliceMapping) => {
      const concordance = intake.concordance.mappings.find(
        (mapping) => mapping.passageStableKey === sliceMapping.passageStableKey,
      )!;
      return {
        passageStableKey: sliceMapping.passageStableKey,
        passageId: intake.slice.runtimeTargets.find(
          (target) => target.passageStableKey === sliceMapping.passageStableKey,
        )!.passageId,
        relationship: sliceMapping.relationship,
        themeClaims: sliceMapping.themeClaims,
        voiceIds: sliceMapping.voiceIds,
        philosophicalConstraintIds: sliceMapping.philosophicalConstraintIds,
        canonicalChapterIds: sliceMapping.chapterIds,
        promiseIds: sliceMapping.promiseIds,
        explanation: concordance.explanation,
      };
    }),
    provenance: {
      literaryReleaseId: intake.release.known.releaseId,
      sourceCommit: intake.slice.known.sourceCommit,
      releaseContentSha256: intake.release.known.contentSha256,
      sliceContentSha256: intake.slice.known.contentSha256,
      sliceAssetSha256: intake.slice.known.assetSha256,
      storyPackageVersion: intake.packageManifest.storyVersion,
      storyPackageContentHash: intake.packageManifest.contentHash,
      everyTransferredFieldMachineReadable: true,
      manualCopyPasteRequired: false,
    },
  };
}
