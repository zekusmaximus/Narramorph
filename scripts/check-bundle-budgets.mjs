#!/usr/bin/env node

import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const assetsDirectory = path.join(root, 'dist', 'assets');
const outputDirectory = path.join(root, 'output', 'bundle');
const budgetFile = path.join(root, 'config', 'bundle-budgets.json');
const manifestFile = path.join(root, 'dist', '.vite', 'manifest.json');

const configuration = JSON.parse(await readFile(budgetFile, 'utf8'));
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
const names = await readdir(assetsDirectory);
const assets = [];

for (const name of names.sort()) {
  if (!name.endsWith('.js') && !name.endsWith('.css')) {
    continue;
  }
  const contents = await readFile(path.join(assetsDirectory, name));
  assets.push({
    name,
    type: path.extname(name).slice(1),
    bytes: contents.byteLength,
    gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
  });
}

const javascript = assets.filter((asset) => asset.type === 'js');
const css = assets.filter((asset) => asset.type === 'css');
const largestJavaScript = [...javascript].sort((left, right) => right.bytes - left.bytes)[0];
const sum = (values, field) => values.reduce((total, value) => total + value[field], 0);
const assetsByFile = new Map(assets.map((asset) => [`assets/${asset.name}`, asset]));

const collectStaticImports = (entryKeys) => {
  const collected = new Set();

  const visit = (key) => {
    if (collected.has(key)) {
      return;
    }
    const entry = manifest[key];
    if (!entry) {
      throw new Error(`Manifest entry not found: ${key}`);
    }
    collected.add(key);
    for (const importedKey of entry.imports ?? []) {
      visit(importedKey);
    }
  };

  for (const key of entryKeys) {
    visit(key);
  }
  return collected;
};

const initialEntryKeys = collectStaticImports(['index.html', 'src/components/NodeMap/index.ts']);
const initialJavaScript = [...initialEntryKeys]
  .map((key) => assetsByFile.get(manifest[key].file))
  .filter((asset) => asset?.type === 'js');
const forbiddenInitialEntries = [...initialEntryKeys].filter(
  (key) =>
    key.includes('/content/') ||
    key.includes('/components/3d/') ||
    key.endsWith('/ContentPanel3D.tsx'),
);

const storyAssetsById = new Map();
for (const [key, entry] of Object.entries(manifest)) {
  const match = key.match(/^src\/data\/stories\/([^/]+)\/content\//);
  const asset = assetsByFile.get(entry.file);
  if (!match || asset?.type !== 'js') {
    continue;
  }
  const storyId = match[1];
  const storyAssets = storyAssetsById.get(storyId) ?? [];
  storyAssets.push(asset);
  storyAssetsById.set(storyId, storyAssets);
}

const storyPackages = Object.fromEntries(
  [...storyAssetsById.entries()].map(([storyId, storyAssets]) => [
    storyId,
    {
      bytes: sum(storyAssets, 'bytes'),
      gzipBytes: sum(storyAssets, 'gzipBytes'),
      assetCount: storyAssets.length,
    },
  ]),
);
const storyJavaScript = [...storyAssetsById.values()].flat();
const largestStoryJavaScript = [...storyJavaScript].sort(
  (left, right) => right.bytes - left.bytes,
)[0];
const largestStoryPackage = Object.values(storyPackages).sort(
  (left, right) => right.bytes - left.bytes,
)[0];

const measurements = {
  initialJsBytes: sum(initialJavaScript, 'bytes'),
  initialJsGzipBytes: sum(initialJavaScript, 'gzipBytes'),
  largestStoryChunkBytes: largestStoryJavaScript?.bytes ?? 0,
  largestStoryChunkGzipBytes: largestStoryJavaScript?.gzipBytes ?? 0,
  storyPackageBytes: largestStoryPackage?.bytes ?? 0,
  storyPackageGzipBytes: largestStoryPackage?.gzipBytes ?? 0,
  publicSourceMapCount: names.filter((name) => name.endsWith('.map')).length,
  totalJsBytes: sum(javascript, 'bytes'),
  totalJsGzipBytes: sum(javascript, 'gzipBytes'),
  largestJsBytes: largestJavaScript?.bytes ?? 0,
  largestJsGzipBytes: largestJavaScript?.gzipBytes ?? 0,
  totalCssBytes: sum(css, 'bytes'),
  totalCssGzipBytes: sum(css, 'gzipBytes'),
};

const failures = Object.entries(configuration.budgets)
  .filter(([name, limit]) => measurements[name] > limit)
  .map(
    ([name, limit]) =>
      `${name}: ${measurements[name].toLocaleString()} exceeds ${limit.toLocaleString()}`,
  );
if (forbiddenInitialEntries.length > 0) {
  failures.push(`opening graph contains deferred entries: ${forbiddenInitialEntries.join(', ')}`);
}

const formatBytes = (value) => `${(value / 1024).toFixed(2)} KiB`;
const rows = Object.entries(configuration.budgets).map(([name, limit]) => {
  const actual = measurements[name];
  const format = name.endsWith('Count') ? (value) => value.toLocaleString() : formatBytes;
  return `| ${name} | ${format(actual)} | ${format(limit)} | ${actual <= limit ? 'pass' : 'FAIL'} |`;
});
const markdown = [
  '# Bundle budget report',
  '',
  `Largest JavaScript asset: \`${largestJavaScript?.name ?? 'none'}\``,
  `Largest story asset: \`${largestStoryJavaScript?.name ?? 'none'}\``,
  `Opening graph: ${initialJavaScript.map((asset) => `\`${asset.name}\``).join(', ')}`,
  `Deferred story packages: ${Object.entries(storyPackages)
    .map(
      ([storyId, storyPackage]) =>
        `\`${storyId}\` (${formatBytes(storyPackage.bytes)} / ${formatBytes(storyPackage.gzipBytes)} gzip)`,
    )
    .join(', ')}`,
  '',
  '| Metric | Actual | Budget | Result |',
  '| --- | ---: | ---: | --- |',
  ...rows,
  '',
].join('\n');

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'bundle-report.json'),
  `${JSON.stringify(
    {
      measurements,
      budgets: configuration.budgets,
      initialEntries: [...initialEntryKeys],
      storyPackages,
      assets,
      failures,
    },
    null,
    2,
  )}\n`,
);
await writeFile(path.join(outputDirectory, 'bundle-report.md'), markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
}

process.stdout.write(markdown);
if (failures.length > 0) {
  process.stderr.write(`\nBundle budget failures:\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
}
