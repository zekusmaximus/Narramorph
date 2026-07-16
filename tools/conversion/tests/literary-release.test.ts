import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  createLiterarySliceStageReport,
  literaryCanonicalJson,
  loadAndVerifyLiteraryRelease,
  loadAndVerifyLiterarySlice,
  loadKnownLiteraryRelease,
  loadKnownLiterarySlice,
  renderSemanticDiff,
  summarizeContradictions,
  validateAcceptedLiteraryRelease,
  validateAcceptedLiterarySlice,
  validateContradictionRegister,
  validateLiteraryConcordance,
  validateLiteraryReleaseArtifact,
  validateLiterarySliceArtifact,
  type KnownLiteraryRelease,
  type KnownLiterarySlice,
  type LiteraryStageReport,
} from '../lib/literary-release';
import { sha256, type StoryPackageCatalog } from '../lib/story-package';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const releaseId = 'eternal-return-literary-v1.0.1';
const sliceId = 'archaeologist-opening-accept';

async function loadArtifactFixture(): Promise<{
  artifact: Record<string, unknown>;
  bytes: Uint8Array;
  known: KnownLiteraryRelease;
}> {
  const known = await loadKnownLiteraryRelease(repositoryRoot, releaseId);
  const bytes = await readFile(resolve(repositoryRoot, known.sourcePath));
  return {
    artifact: JSON.parse(bytes.toString('utf8')) as Record<string, unknown>,
    bytes,
    known,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function rehash(
  artifact: Record<string, unknown>,
  known: KnownLiteraryRelease,
): { artifact: Record<string, unknown>; bytes: Uint8Array; known: KnownLiteraryRelease } {
  const nextArtifact = clone(artifact);
  const nextKnown = clone(known);
  nextArtifact.contentSha256 = sha256(literaryCanonicalJson(nextArtifact.payload));
  nextKnown.contentSha256 = String(nextArtifact.contentSha256);
  const bytes = Buffer.from(literaryCanonicalJson(nextArtifact), 'utf8');
  nextKnown.assetSha256 = sha256(bytes);
  return { artifact: nextArtifact, bytes, known: nextKnown };
}

async function loadSliceFixture(): Promise<{
  artifact: Record<string, unknown>;
  bytes: Uint8Array;
  known: KnownLiterarySlice;
}> {
  const known = await loadKnownLiterarySlice(repositoryRoot, sliceId);
  const bytes = await readFile(resolve(repositoryRoot, known.sourcePath));
  return {
    artifact: JSON.parse(bytes.toString('utf8')) as Record<string, unknown>,
    bytes,
    known,
  };
}

function rehashSlice(
  artifact: Record<string, unknown>,
  known: KnownLiterarySlice,
): { artifact: Record<string, unknown>; bytes: Uint8Array; known: KnownLiterarySlice } {
  const nextArtifact = clone(artifact);
  const nextKnown = clone(known);
  nextArtifact.contentSha256 = sha256(literaryCanonicalJson(nextArtifact.payload));
  nextKnown.contentSha256 = String(nextArtifact.contentSha256);
  const bytes = Buffer.from(literaryCanonicalJson(nextArtifact), 'utf8');
  nextKnown.assetSha256 = sha256(bytes);
  return { artifact: nextArtifact, bytes, known: nextKnown };
}

describe('literary release intake', () => {
  it('verifies the allowlisted artifact and every canonical source hash declaration', async () => {
    const release = await loadAndVerifyLiteraryRelease(repositoryRoot, releaseId);

    expect(release.known.assetSha256).toBe(
      '19ffeffc1cf0de6440b16f1e9335d7c738edbf178e1a71f8e875d8960cb8d58e',
    );
    expect(release.context.chapters).toHaveLength(28);
    expect(release.context.voices).toHaveLength(3);
    expect(release.context.philosophicalConstraints).toHaveLength(13);
    expect(release.context.promisePayoffs).toHaveLength(36);
  });

  it('rejects unknown releases and incompatible application versions', async () => {
    await expect(loadKnownLiteraryRelease(repositoryRoot, 'unknown-release')).rejects.toThrow(
      'Unknown literary release',
    );
    await expect(loadKnownLiteraryRelease(repositoryRoot, releaseId, '2.0.0')).rejects.toThrow(
      'is incompatible',
    );
  });

  it('rejects malformed asset hashes before parsing canonical claims', async () => {
    const fixture = await loadArtifactFixture();
    const bytes = Buffer.from(fixture.bytes);
    bytes[bytes.length - 2] = bytes[bytes.length - 2] === 32 ? 33 : 32;

    expect(() => validateLiteraryReleaseArtifact(fixture.artifact, bytes, fixture.known)).toThrow(
      'asset hash mismatch',
    );
  });

  it('rejects a missing content license even when all candidate hashes are recomputed', async () => {
    const fixture = await loadArtifactFixture();
    const payload = fixture.artifact.payload as { manifest: Record<string, unknown> };
    payload.manifest.contentLicense = '';
    const candidate = rehash(fixture.artifact, fixture.known);

    expect(() =>
      validateLiteraryReleaseArtifact(candidate.artifact, candidate.bytes, candidate.known),
    ).toThrow('content license must be a non-empty string');
  });

  it('rejects unsafe source paths with otherwise valid hashes', async () => {
    const fixture = await loadArtifactFixture();
    const payload = fixture.artifact.payload as {
      sourceFiles: { context: Array<Record<string, unknown>> };
    };
    payload.sourceFiles.context[0]!.path = '../manuscript.md';
    const candidate = rehash(fixture.artifact, fixture.known);

    expect(() =>
      validateLiteraryReleaseArtifact(candidate.artifact, candidate.bytes, candidate.known),
    ).toThrow('unsafe path');
  });

  it('rejects duplicate and unstable canonical identifiers', async () => {
    const duplicateFixture = await loadArtifactFixture();
    const duplicatePayload = duplicateFixture.artifact.payload as {
      context: { chapters: Array<Record<string, unknown>> };
    };
    duplicatePayload.context.chapters[1]!.chapterId =
      duplicatePayload.context.chapters[0]!.chapterId;
    const duplicate = rehash(duplicateFixture.artifact, duplicateFixture.known);
    expect(() =>
      validateLiteraryReleaseArtifact(duplicate.artifact, duplicate.bytes, duplicate.known),
    ).toThrow('Duplicate canonical context ID');

    const unstableFixture = await loadArtifactFixture();
    const unstablePayload = unstableFixture.artifact.payload as {
      context: { chapters: Array<Record<string, unknown>> };
    };
    unstablePayload.context.chapters[0]!.chapterId = 'unstable chapter ID';
    const unstable = rehash(unstableFixture.artifact, unstableFixture.known);
    expect(() =>
      validateLiteraryReleaseArtifact(unstable.artifact, unstable.bytes, unstable.known),
    ).toThrow('not a stable identifier');
  });

  it('requires exactly one valid concordance mapping for every shipped passage', async () => {
    const release = await loadAndVerifyLiteraryRelease(repositoryRoot, releaseId);
    const concordance = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'story-packages/concordance/eternal-return.v1.json'),
        'utf8',
      ),
    ) as { mappings: unknown[] };
    const catalog = JSON.parse(
      await readFile(resolve(repositoryRoot, 'story-packages/eternal-return/catalog.json'), 'utf8'),
    ) as StoryPackageCatalog;

    expect(validateLiteraryConcordance(concordance, release, catalog).mappings).toHaveLength(19);
    concordance.mappings.pop();
    expect(() => validateLiteraryConcordance(concordance, release, catalog)).toThrow(
      'Unmapped shipped passages',
    );
  });

  it('renders a changed release as a human-readable semantic diff, never a prose rewrite', () => {
    const report = {
      schemaVersion: '1.0.0',
      releaseId: 'candidate-v2',
      generatedFrom: { sourceCommit: 'a'.repeat(40), contentSha256: 'b', assetSha256: 'c' },
      validation: {
        status: 'passed',
        applicationVersion: '0.1.0',
        applicationRange: '>=0.1.0 <0.2.0',
        passageCount: 19,
        concordanceCount: 19,
        canonicalContextCounts: {},
      },
      semanticDiff: {
        baselineReleaseId: releaseId,
        classification: 'changed-release',
        changes: [
          {
            field: 'sourceCommit',
            before: 'a'.repeat(40),
            after: 'd'.repeat(40),
            classification: 'changed',
          },
        ],
      },
      relationshipCounts: {
        'direct-adaptation': 0,
        'thematic-derivative': 18,
        'interactive-only-connective': 1,
        'independent-runtime': 0,
      },
      writeBoundary: {
        stagingOnly: true,
        runtimeProseMutation: 'forbidden',
        checkedInMetadataMutation: 'requires-separate-human-acceptance',
      },
    } satisfies LiteraryStageReport;

    const markdown = renderSemanticDiff(report);
    expect(markdown).toContain('Classification: `changed-release`');
    expect(markdown).toContain('Runtime prose mutation: `forbidden`');
    expect(markdown).toContain('| sourceCommit |');
  });

  it('validates the accepted release, package identity, and full concordance together', async () => {
    const intake = await validateAcceptedLiteraryRelease(repositoryRoot);

    expect(intake.packageManifest.storyVersion).toBe('1.1.0');
    expect(intake.packageManifest.editorialReleaseId).toBe(releaseId);
    expect(intake.concordance.mappings).toHaveLength(intake.catalog.passages.length);
  });

  it('verifies the connected literary slice through the release, package, graph, and concordance', async () => {
    const intake = await loadAndVerifyLiterarySlice(repositoryRoot, sliceId);

    expect(intake.slice.known.assetSha256).toBe(
      '6c47118a7d5f349c071b8656f69fac94ecea68f4cee45cea4509ce618c257d79',
    );
    expect(intake.slice.runtimeTargets.map((target) => target.passageStableKey)).toEqual([
      'arch-L1',
      'arch-L2-accept',
    ]);
    expect(intake.slice.mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          passageStableKey: 'arch-L1',
          voiceIds: ['archaeologist'],
          philosophicalConstraintIds: [
            'er-philosophy-key-concepts-tertiary-retention-stiegler',
            'er-philosophy-four-shackles-identity',
          ],
        }),
        expect.objectContaining({
          passageStableKey: 'arch-L2-accept',
          voiceIds: ['archaeologist'],
          philosophicalConstraintIds: [
            'er-philosophy-key-concepts-identity-dissolution-klossowski',
            'er-philosophy-key-concepts-eternal-return',
          ],
        }),
      ]),
    );
  });

  it('rejects unknown, tampered, disconnected, and concordance-divergent literary slices', async () => {
    await expect(loadKnownLiterarySlice(repositoryRoot, 'unknown-slice')).rejects.toThrow(
      'Unknown literary slice',
    );
    const intake = await loadAndVerifyLiteraryRelease(repositoryRoot, releaseId);
    const packageManifest = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'story-packages/eternal-return/manifest.json'),
        'utf8',
      ),
    );
    const catalog = JSON.parse(
      await readFile(resolve(repositoryRoot, 'story-packages/eternal-return/catalog.json'), 'utf8'),
    ) as StoryPackageCatalog;
    const concordance = validateLiteraryConcordance(
      JSON.parse(
        await readFile(
          resolve(repositoryRoot, 'story-packages/concordance/eternal-return.v1.json'),
          'utf8',
        ),
      ),
      intake,
      catalog,
    );
    const verifiedIntake = { release: intake, packageManifest, catalog, concordance };

    const tampered = await loadSliceFixture();
    const tamperedBytes = Buffer.from(tampered.bytes);
    tamperedBytes[tamperedBytes.length - 2] =
      tamperedBytes[tamperedBytes.length - 2] === 32 ? 33 : 32;
    expect(() =>
      validateLiterarySliceArtifact(
        tampered.artifact,
        tamperedBytes,
        tampered.known,
        verifiedIntake,
      ),
    ).toThrow('asset hash mismatch');

    const disconnectedFixture = await loadSliceFixture();
    const disconnectedPayload = disconnectedFixture.artifact.payload as {
      runtimeTargets: Array<{ connections: string[] }>;
    };
    disconnectedPayload.runtimeTargets[0]!.connections = [];
    const disconnected = rehashSlice(disconnectedFixture.artifact, disconnectedFixture.known);
    expect(() =>
      validateLiterarySliceArtifact(
        disconnected.artifact,
        disconnected.bytes,
        disconnected.known,
        verifiedIntake,
      ),
    ).toThrow('not the allowlisted connected L1-to-L2 pair');

    const divergentFixture = await loadSliceFixture();
    const divergentPayload = divergentFixture.artifact.payload as {
      mappings: Array<{ philosophicalConstraintIds: string[] }>;
    };
    divergentPayload.mappings[0]!.philosophicalConstraintIds.reverse();
    const divergent = rehashSlice(divergentFixture.artifact, divergentFixture.known);
    expect(() =>
      validateLiterarySliceArtifact(
        divergent.artifact,
        divergent.bytes,
        divergent.known,
        verifiedIntake,
      ),
    ).toThrow('does not match the concordance');
  });

  it('stages a machine-provenanced slice review without a prose write or manual copy step', async () => {
    const result = await createLiterarySliceStageReport(repositoryRoot, sliceId);

    expect(result.report.validation.passageStableKeys).toEqual(['arch-L1', 'arch-L2-accept']);
    expect(result.report.constraintChecks).toHaveLength(2);
    expect(result.report.provenance).toEqual({
      everyTransferredFieldMachineReadable: true,
      manualCopyPasteRequired: false,
    });
    expect(result.report.writeBoundary.runtimeProseMutation).toBe('forbidden');
    expect(result.reportSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('validates the accepted slice against the current release and Story Package', async () => {
    const intake = await validateAcceptedLiterarySlice(repositoryRoot);

    expect(intake.slice.known.sliceId).toBe(sliceId);
    expect(intake.packageManifest.storyVersion).toBe('1.1.0');
  });
});

describe('concordance coverage (schema 1.1.0)', () => {
  interface MutableConcordance {
    schemaVersion: string;
    coveragePolicy: { exemptions: Array<{ identityClass: string; count: number; rule: string }> };
    mappings: Array<{
      passageStableKey: string;
      variations: {
        coversAllVariations: boolean;
        variationCount: number;
        selectionAxes: string[];
        sampledVariationIds: string[];
      };
    }>;
    endings: Array<Record<string, unknown>>;
    characters: Array<Record<string, unknown>>;
    edges: { relationship: string; rule: string; edgeStableKeys: string[] };
    explanations: Array<Record<string, unknown>>;
    themesAndMotifs: Array<{ theme: string; kind: string; canonicalIds: string[] }>;
  }

  async function loadCoverageFixture(): Promise<{
    concordance: MutableConcordance;
    release: Awaited<ReturnType<typeof loadAndVerifyLiteraryRelease>>;
    catalog: StoryPackageCatalog;
  }> {
    const release = await loadAndVerifyLiteraryRelease(repositoryRoot, releaseId);
    const concordance = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'story-packages/concordance/eternal-return.v1.json'),
        'utf8',
      ),
    ) as MutableConcordance;
    const catalog = JSON.parse(
      await readFile(resolve(repositoryRoot, 'story-packages/eternal-return/catalog.json'), 'utf8'),
    ) as StoryPackageCatalog;
    return { concordance, release, catalog };
  }

  it('accounts for every shipped identity class: sections, family policies, and exemptions', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const validated = validateLiteraryConcordance(concordance, release, catalog);
    expect(validated.schemaVersion).toBe('1.1.0');
    expect(validated.mappings).toHaveLength(19);
    expect(
      validated.mappings.reduce((sum, mapping) => sum + mapping.variations.variationCount, 0),
    ).toBe(catalog.variations.length);
    expect(validated.endings).toHaveLength(catalog.endings.length);
    expect(validated.characters).toHaveLength(catalog.characters.length);
    expect(validated.edges.edgeStableKeys).toHaveLength(catalog.edges.length);
    expect(validated.explanations).toHaveLength(catalog.explanations.length);
    expect(validated.themesAndMotifs).toHaveLength(10);

    const withoutConditionExemption = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    withoutConditionExemption.coveragePolicy.exemptions =
      withoutConditionExemption.coveragePolicy.exemptions.filter(
        (exemption) => exemption.identityClass !== 'conditions',
      );
    expect(() => validateLiteraryConcordance(withoutConditionExemption, release, catalog)).toThrow(
      'neither mapped by a concordance section nor explicitly exempted',
    );
  });

  it('rejects variation-family policies that understate or misattribute the catalog', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const undercounted = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    const family = undercounted.mappings.find(
      (mapping) => mapping.passageStableKey === 'arch-L2-accept',
    )!;
    family.variations.variationCount = 80;
    expect(() => validateLiteraryConcordance(undercounted, release, catalog)).toThrow(
      'declares 80 variations but the catalog ships 81',
    );

    const foreignSample = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    const target = foreignSample.mappings.find(
      (mapping) => mapping.passageStableKey === 'arch-L2-accept',
    )!;
    target.variations.sampledVariationIds = ['algo-L2-accept-001'];
    expect(() => validateLiteraryConcordance(foreignSample, release, catalog)).toThrow(
      'does not belong to passage arch-L2-accept',
    );
  });

  it('requires every shipped ending and a faithful terminal-passage join', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const missingEnding = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    missingEnding.endings.pop();
    expect(() => validateLiteraryConcordance(missingEnding, release, catalog)).toThrow(
      'ending coverage does not match',
    );

    const wrongPassage = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    const [firstEnding, secondEnding] = wrongPassage.endings;
    firstEnding!.passageId = secondEnding!.passageId;
    expect(() => validateLiteraryConcordance(wrongPassage, release, catalog)).toThrow(
      'names the wrong terminal passage',
    );
  });

  it('enforces a complete, unambiguous character-to-voice join', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const doubleClaim = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    const human = doubleClaim.characters.find(
      (character) => character.characterStableKey === 'human',
    )!;
    human.canonicalCharacterId = 'er-character-algorithm';
    human.voiceIds = ['algorithm'];
    expect(() => validateLiteraryConcordance(doubleClaim, release, catalog)).toThrow(
      'claimed by more than one runtime character',
    );

    const thinComposite = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    const composite = thinComposite.characters.find(
      (character) => character.characterStableKey === 'multi-perspective',
    )!;
    composite.voiceIds = ['algorithm'];
    expect(() => validateLiteraryConcordance(thinComposite, release, catalog)).toThrow(
      'must span at least two voices',
    );
  });

  it('rejects edge-coverage drift in both directions', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const missingEdge = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    missingEdge.edges.edgeStableKeys = missingEdge.edges.edgeStableKeys.slice(1);
    expect(() => validateLiteraryConcordance(missingEdge, release, catalog)).toThrow(
      'missing shipped edge',
    );

    const phantomEdge = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    phantomEdge.edges.edgeStableKeys = [
      ...phantomEdge.edges.edgeStableKeys,
      'arch-L1->hum-L2-accept',
    ];
    expect(() => validateLiteraryConcordance(phantomEdge, release, catalog)).toThrow(
      'names unknown edge',
    );
  });

  it('keeps explanation records free of literary claims', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const reclassified = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    reclassified.explanations[0]!.classification = 'literary-adaptation';
    expect(() => validateLiteraryConcordance(reclassified, release, catalog)).toThrow(
      'must be classified as making no literary claim',
    );
  });

  it('binds themes and motifs to the runtime declaration and canonical vocabulary', async () => {
    const { concordance, release, catalog } = await loadCoverageFixture();

    const declaredThemes = {
      primary: ['digital consciousness', 'memory reconstruction', 'identity fluidity'],
      secondary: ['observation vs participation', 'temporal perception', 'data persistence'],
      motifs: ['fragments', 'echoes', 'layered reality', 'recursive loops'],
    };
    expect(() =>
      validateLiteraryConcordance(concordance, release, catalog, declaredThemes),
    ).not.toThrow();

    expect(() =>
      validateLiteraryConcordance(concordance, release, catalog, {
        ...declaredThemes,
        motifs: [...declaredThemes.motifs, 'unmapped motif'],
      }),
    ).toThrow('do not match the runtime story declaration');

    const unknownClaim = JSON.parse(JSON.stringify(concordance)) as MutableConcordance;
    unknownClaim.themesAndMotifs[0]!.canonicalIds = ['er-philosophy-nonexistent'];
    expect(() => validateLiteraryConcordance(unknownClaim, release, catalog)).toThrow(
      'references unknown canonical claim',
    );
  });

  it('validates the contradiction register and requires decisions once entries close', async () => {
    const intake = await validateAcceptedLiteraryRelease(repositoryRoot);
    expect(intake.contradictions).toBeDefined();
    const summary = summarizeContradictions(intake.contradictions!);
    expect(summary.total).toBe(intake.contradictions!.entries.length);
    expect(summary.openSevOne).toBe(
      intake.contradictions!.entries.filter(
        (entry) => entry.status === 'open' && entry.severity === 'sev-1',
      ).length,
    );
    expect(summary.open).toBeGreaterThanOrEqual(summary.openSevOne);

    const register = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'story-packages/concordance/contradictions.v1.json'),
        'utf8',
      ),
    ) as { entries: Array<Record<string, unknown>> };

    const undecided = JSON.parse(JSON.stringify(register)) as typeof register;
    const resolvedEntry = undecided.entries.find((entry) => entry.status === 'resolved')!;
    resolvedEntry.decision = null;
    expect(() => validateContradictionRegister(undecided, 'eternal-return')).toThrow(
      'records no decision',
    );

    const ownerless = JSON.parse(JSON.stringify(register)) as typeof register;
    ownerless.entries[0]!.owner = '';
    expect(() => validateContradictionRegister(ownerless, 'eternal-return')).toThrow('owner');

    const duplicate = JSON.parse(JSON.stringify(register)) as typeof register;
    duplicate.entries[1]!.id = duplicate.entries[0]!.id;
    expect(() => validateContradictionRegister(duplicate, 'eternal-return')).toThrow(
      'Duplicate contradiction entry ID',
    );
  });
});
