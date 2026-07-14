#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  assertValidStoryPackage,
  buildStoryPackage,
  type BuiltStoryPackage,
} from './lib/story-package';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const packages = [
  {
    name: 'clockwork-garden',
    source: 'story-packages/sources/clockwork-garden/source.json',
    output: 'story-packages/fixtures/clockwork-garden',
  },
  {
    name: 'tidal-signals',
    source: 'story-packages/sources/tidal-signals/source.json',
    output: 'story-packages/fixtures/tidal-signals',
  },
  {
    name: 'eternal-return',
    source: 'story-packages/sources/eternal-return.source.json',
    output: 'story-packages/eternal-return',
  },
] as const;

function absolute(path: string): string {
  return resolve(repositoryRoot, path);
}

function reportBuild(name: string, built: BuiltStoryPackage): void {
  console.log(
    [
      'built ' + name,
      'story=' + built.manifest.storyId + '@' + built.manifest.storyVersion,
      'passages=' + built.catalog.passages.length,
      'variations=' + built.catalog.variations.length,
      'hash=' + built.manifest.contentHash,
    ].join(' '),
  );
}

async function buildAll(): Promise<void> {
  for (const item of packages) {
    const built = await buildStoryPackage(absolute(item.source), absolute(item.output));
    reportBuild(item.name, built);
  }
}

async function validateAll(): Promise<void> {
  for (const item of packages) {
    const result = await assertValidStoryPackage(absolute(item.output));
    console.log(
      'valid ' +
        item.name +
        ' story=' +
        result.manifest?.storyId +
        '@' +
        result.manifest?.storyVersion +
        ' hash=' +
        result.manifest?.contentHash,
    );
  }
}

async function main(): Promise<void> {
  const [command = 'validate-all', first, second] = process.argv.slice(2);
  if (command === 'build-all') {
    await buildAll();
    return;
  }
  if (command === 'validate-all') {
    await validateAll();
    return;
  }
  if (command === 'build' && first && second) {
    const built = await buildStoryPackage(
      resolve(process.cwd(), first),
      resolve(process.cwd(), second),
    );
    reportBuild(first, built);
    return;
  }
  if (command === 'validate' && first) {
    const result = await assertValidStoryPackage(resolve(process.cwd(), first));
    console.log('valid ' + first + ' hash=' + result.manifest?.contentHash);
    return;
  }
  throw new Error(
    'Usage: story-package.ts build-all | validate-all | build <source.json> <output> | validate <package>',
  );
}

await main();
