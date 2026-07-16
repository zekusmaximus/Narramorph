import { cp, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildStoryPackage,
  canonicalJson,
  deriveOpaqueId,
  validateStoryPackage,
  type StoryPackageCatalog,
  type StoryPackageManifest,
} from '../lib/story-package';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const temporaryRoots: string[] = [];

const packageCases = [
  {
    name: 'clockwork-garden',
    descriptor: 'story-packages/sources/clockwork-garden/source.json',
    packageDirectory: 'story-packages/fixtures/clockwork-garden',
    passages: 2,
    variations: 2,
  },
  {
    name: 'tidal-signals',
    descriptor: 'story-packages/sources/tidal-signals/source.json',
    packageDirectory: 'story-packages/fixtures/tidal-signals',
    passages: 3,
    variations: 4,
  },
  {
    name: 'eternal-return',
    descriptor: 'story-packages/sources/eternal-return.source.json',
    packageDirectory: 'story-packages/eternal-return',
    passages: 19,
    variations: 1014,
  },
] as const;

function fromRoot(path: string): string {
  return resolve(repositoryRoot, path);
}

async function makeTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'narramorph-story-package-v1-'));
  temporaryRoots.push(root);
  return root;
}

async function directorySnapshot(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else {
        result[relative(root, path).replace(/\\/g, '/')] = (await readFile(path)).toString(
          'base64',
        );
      }
    }
  }
  await visit(root);
  return result;
}

async function loadPackage(packageDirectory: string): Promise<{
  manifest: StoryPackageManifest;
  catalog: StoryPackageCatalog;
}> {
  return {
    manifest: JSON.parse(
      await readFile(join(packageDirectory, 'manifest.json'), 'utf8'),
    ) as StoryPackageManifest,
    catalog: JSON.parse(
      await readFile(join(packageDirectory, 'catalog.json'), 'utf8'),
    ) as StoryPackageCatalog,
  };
}

async function writeCanonical(path: string, value: unknown): Promise<void> {
  await writeFile(path, canonicalJson(value) + '\n', 'utf8');
}

async function mutableFixture(): Promise<string> {
  const root = await makeTemporaryRoot();
  const target = join(root, 'package');
  await cp(fromRoot('story-packages/fixtures/clockwork-garden'), target, { recursive: true });
  return target;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('Story Package Contract v1', () => {
  it.each(packageCases)('validates $name through the generic contract path', async (item) => {
    const result = await validateStoryPackage(fromRoot(item.packageDirectory));

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.catalog?.passages).toHaveLength(item.passages);
    expect(result.catalog?.variations).toHaveLength(item.variations);
  });

  it('keeps the runtime saved-journey identity synchronized with the shipped package', async () => {
    const { manifest } = await loadPackage(fromRoot('story-packages/eternal-return'));
    const identity = JSON.parse(
      await readFile(fromRoot('src/config/eternalReturnPackageIdentity.json'), 'utf8'),
    ) as Record<string, string>;

    expect(identity).toEqual({
      storyId: manifest.storyId,
      storyVersion: manifest.storyVersion,
      schemaVersion: manifest.schemaVersion,
      contentHash: manifest.contentHash,
    });
  });

  it.each(packageCases)(
    'builds $name byte-for-byte deterministically',
    async (item) => {
      const root = await makeTemporaryRoot();
      const first = join(root, 'first');
      const second = join(root, 'second');

      const firstBuild = await buildStoryPackage(fromRoot(item.descriptor), first);
      const secondBuild = await buildStoryPackage(fromRoot(item.descriptor), second);

      expect(secondBuild.manifest.contentHash).toBe(firstBuild.manifest.contentHash);
      expect(secondBuild.manifest.passageIds).toEqual(firstBuild.manifest.passageIds);
      expect(secondBuild.catalog.characters.map((record) => record.id)).toEqual(
        firstBuild.catalog.characters.map((record) => record.id),
      );
      expect(secondBuild.catalog.variations.map((record) => record.id)).toEqual(
        firstBuild.catalog.variations.map((record) => record.id),
      );
      expect(await directorySnapshot(second)).toEqual(await directorySnapshot(first));
    },
    30_000,
  );

  it('ingests authored multi-beat variations into per-alternative beat and expression records', async () => {
    const root = await makeTemporaryRoot();
    const copiedSource = join(root, 'clockwork-garden');
    await cp(fromRoot('story-packages/sources/clockwork-garden'), copiedSource, {
      recursive: true,
    });

    const startPath = join(copiedSource, 'data', 'content', 'start.json');
    const startSource = JSON.parse(await readFile(startPath, 'utf8')) as {
      variations: Array<Record<string, unknown> & { id: string; content: string }>;
    };
    const variation = startSource.variations[0]!;
    const bodyContent = variation.content;
    variation.beatJoiner = '\n\n';
    variation.proseBeats = [
      {
        id: 'garden-start-v1-b0-return',
        ordinal: 0,
        omitWhenUnmatched: true,
        alternatives: [
          {
            id: 'garden-start-v1-b0-return-alt',
            content: 'The paper bird has done this before.',
            condition: {
              kind: 'visitCount',
              passageId: 'garden-start',
              comparison: 'gte',
              value: 3,
            },
          },
        ],
      },
      {
        id: 'garden-start-v1-b1-body',
        ordinal: 1,
        alternatives: [{ id: 'garden-start-v1-b1-body-alt', content: bodyContent }],
      },
    ];
    await writeFile(startPath, JSON.stringify(startSource, null, 2) + '\n', 'utf8');

    const output = join(root, 'built');
    const built = await buildStoryPackage(join(copiedSource, 'source.json'), output);

    const variationRecord = built.catalog.variations.find(
      (record) => record.legacyId === 'garden-start-v1',
    );
    expect(variationRecord).toBeDefined();
    expect(variationRecord!.proseBeatIds).toHaveLength(2);

    const returnBeat = built.catalog.proseBeats.find(
      (record) => record.stableKey === 'garden-start-v1-b0-return-alt',
    );
    const bodyBeat = built.catalog.proseBeats.find(
      (record) => record.stableKey === 'garden-start-v1-b1-body-alt',
    );
    expect(returnBeat).toBeDefined();
    expect(bodyBeat).toBeDefined();
    expect(returnBeat!.ordinal).toBe(0);
    expect(returnBeat!.omitWhenUnmatched).toBe(true);
    expect(returnBeat!.conditionId).toBeDefined();
    expect(bodyBeat!.ordinal).toBe(1);
    expect(bodyBeat!.omitWhenUnmatched).toBeUndefined();
    expect(bodyBeat!.conditionId).toBeUndefined();

    const expressionCondition = built.catalog.conditions.find(
      (record) => record.id === returnBeat!.conditionId,
    );
    expect(expressionCondition).toBeDefined();
    expect(expressionCondition!.kind).toBe('expression');
    expect((expressionCondition!.value as { kind: string }).kind).toBe('visitCount');
    expect(variationRecord!.conditionIds).toContain(returnBeat!.conditionId);

    const validation = await validateStoryPackage(output);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
  });

  it('rejects an authored beat alternative that is missing a stable id', async () => {
    const root = await makeTemporaryRoot();
    const copiedSource = join(root, 'clockwork-garden');
    await cp(fromRoot('story-packages/sources/clockwork-garden'), copiedSource, {
      recursive: true,
    });
    const startPath = join(copiedSource, 'data', 'content', 'start.json');
    const startSource = JSON.parse(await readFile(startPath, 'utf8')) as {
      variations: Array<Record<string, unknown> & { content: string }>;
    };
    startSource.variations[0]!.proseBeats = [
      { ordinal: 0, alternatives: [{ content: 'no id here' }] },
    ];
    await writeFile(startPath, JSON.stringify(startSource, null, 2) + '\n', 'utf8');

    await expect(
      buildStoryPackage(join(copiedSource, 'source.json'), join(root, 'built')),
    ).rejects.toThrow(/missing a stable id/);
  });

  it('keeps opaque identities stable when titles and source files are renamed', async () => {
    const root = await makeTemporaryRoot();
    const copiedSource = join(root, 'clockwork-garden');
    await cp(fromRoot('story-packages/sources/clockwork-garden'), copiedSource, {
      recursive: true,
    });
    const baseline = await buildStoryPackage(
      join(copiedSource, 'source.json'),
      join(root, 'baseline'),
    );

    const characterPath = join(copiedSource, 'data', 'characters.json');
    const characterSource = JSON.parse(await readFile(characterPath, 'utf8')) as {
      nodes: Array<{ id: string; chapterTitle: string; contentFile: string }>;
    };
    const opening = characterSource.nodes.find((node) => node.id === 'garden-start');
    expect(opening).toBeDefined();
    opening!.chapterTitle = 'Renamed Synthetic Opening';
    opening!.contentFile = 'content/renamed-start.json';
    await writeFile(characterPath, JSON.stringify(characterSource, null, 2) + '\n', 'utf8');
    await rename(
      join(copiedSource, 'data', 'content', 'start.json'),
      join(copiedSource, 'data', 'content', 'renamed-start.json'),
    );

    const renamed = await buildStoryPackage(
      join(copiedSource, 'source.json'),
      join(root, 'renamed'),
    );

    expect(renamed.catalog.passages.map(({ stableKey, id }) => ({ stableKey, id }))).toEqual(
      baseline.catalog.passages.map(({ stableKey, id }) => ({ stableKey, id })),
    );
    expect(renamed.catalog.variations.map(({ stableKey, id }) => ({ stableKey, id }))).toEqual(
      baseline.catalog.variations.map(({ stableKey, id }) => ({ stableKey, id })),
    );
    expect(renamed.manifest.contentHash).not.toBe(baseline.manifest.contentHash);
  });

  it('derives identity only from contract namespace, kind, story, and stable key', () => {
    expect(deriveOpaqueId('passage', 'example-story', 'opening')).toBe(
      deriveOpaqueId('passage', 'example-story', 'opening'),
    );
    expect(deriveOpaqueId('passage', 'example-story', 'opening')).not.toBe(
      deriveOpaqueId('variation', 'example-story', 'opening'),
    );
  });

  it('serializes and validates recursive condition expressions', async () => {
    const { catalog } = await loadPackage(fromRoot('story-packages/fixtures/clockwork-garden'));
    const expression = catalog.conditions.find((condition) => condition.kind === 'expression');

    expect(expression?.value).toMatchObject({
      kind: 'all',
      conditions: [
        { kind: 'historyStartsWith', passageIds: ['garden-start'] },
        { kind: 'not', condition: { kind: 'visitCount', passageId: 'garden-return' } },
      ],
    });
  });

  it('rejects malformed recursive condition expressions', async () => {
    const fixture = await mutableFixture();
    const { catalog } = await loadPackage(fixture);
    const expression = catalog.conditions.find((condition) => condition.kind === 'expression');
    expect(expression).toBeDefined();
    expression!.value = { kind: 'any', conditions: [] };
    await writeCanonical(join(fixture, 'catalog.json'), catalog);

    const result = await validateStoryPackage(fixture);

    expect(result.errors).toContain(`Condition expression is malformed: ${expression!.id}`);
  });

  it('rejects malformed package JSON', async () => {
    const fixture = await mutableFixture();
    await writeFile(join(fixture, 'manifest.json'), '{broken', 'utf8');

    const result = await validateStoryPackage(fixture);

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Malformed package');
  });

  it('rejects malformed catalog records without throwing', async () => {
    const fixture = await mutableFixture();
    const { catalog } = await loadPackage(fixture);
    (catalog.passages as unknown[])[0] = null;
    await writeCanonical(join(fixture, 'catalog.json'), catalog);

    const result = await validateStoryPackage(fixture);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Malformed passages record at index 0.');
  });

  it('rejects a malformed manifest shape without throwing', async () => {
    const fixture = await mutableFixture();
    const { manifest } = await loadPackage(fixture);
    delete (manifest as Partial<StoryPackageManifest>).passageIds;
    await writeCanonical(join(fixture, 'manifest.json'), manifest);

    const result = await validateStoryPackage(fixture);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Malformed package manifest shape.');
  });

  it('rejects missing license metadata', async () => {
    const fixture = await mutableFixture();
    const { manifest } = await loadPackage(fixture);
    manifest.licenses = [];
    await writeCanonical(join(fixture, 'manifest.json'), manifest);

    const result = await validateStoryPackage(fixture);

    expect(result.errors).toContain('At least one content license is required.');
  });

  it('rejects duplicate opaque IDs', async () => {
    const fixture = await mutableFixture();
    const { catalog } = await loadPackage(fixture);
    catalog.variations.push({ ...catalog.variations[0]! });
    await writeCanonical(join(fixture, 'catalog.json'), catalog);

    const result = await validateStoryPackage(fixture);

    expect(result.errors.some((error) => error.startsWith('Duplicate ID:'))).toBe(true);
  });

  it('rejects unsafe package-relative paths', async () => {
    const fixture = await mutableFixture();
    const { catalog } = await loadPackage(fixture);
    catalog.resources[0]!.path = '../outside.txt';
    await writeCanonical(join(fixture, 'catalog.json'), catalog);

    const result = await validateStoryPackage(fixture);

    expect(result.errors.some((error) => error.includes('unsafe package path'))).toBe(true);
  });

  it('rejects resource hash tampering', async () => {
    const fixture = await mutableFixture();
    await writeFile(join(fixture, 'assets', 'note.txt'), 'tampered\n', 'utf8');

    const result = await validateStoryPackage(fixture);

    expect(
      result.errors.some((error) => error.includes('Resource hash or byte length mismatch')),
    ).toBe(true);
  });

  it('rejects declared package content-hash tampering', async () => {
    const fixture = await mutableFixture();
    const { manifest } = await loadPackage(fixture);
    manifest.contentHash = '0'.repeat(64);
    await writeCanonical(join(fixture, 'manifest.json'), manifest);

    const result = await validateStoryPackage(fixture);

    expect(result.errors).toContain('Package content hash mismatch.');
  });

  it('rejects unsupported schema and app versions', async () => {
    const fixture = await mutableFixture();
    const { manifest } = await loadPackage(fixture);
    manifest.schemaVersion = '2.0.0';
    await writeCanonical(join(fixture, 'manifest.json'), manifest);

    const schemaResult = await validateStoryPackage(fixture);
    const appResult = await validateStoryPackage(
      fromRoot('story-packages/fixtures/clockwork-garden'),
      '2.0.0',
    );

    expect(schemaResult.errors).toContain('Unsupported schema version: 2.0.0');
    expect(appResult.errors.some((error) => error.includes('is incompatible'))).toBe(true);
  });
});
