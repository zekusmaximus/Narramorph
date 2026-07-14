#!/usr/bin/env node

import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const assetsDirectory = path.join(root, 'dist', 'assets');
const outputDirectory = path.join(root, 'output', 'bundle');
const budgetFile = path.join(root, 'config', 'bundle-budgets.json');

const configuration = JSON.parse(await readFile(budgetFile, 'utf8'));
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

const measurements = {
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

const formatBytes = (value) => `${(value / 1024).toFixed(2)} KiB`;
const rows = Object.entries(configuration.budgets).map(([name, limit]) => {
  const actual = measurements[name];
  return `| ${name} | ${formatBytes(actual)} | ${formatBytes(limit)} | ${actual <= limit ? 'pass' : 'FAIL'} |`;
});
const markdown = [
  '# Bundle budget report',
  '',
  `Largest JavaScript asset: \`${largestJavaScript?.name ?? 'none'}\``,
  '',
  '| Metric | Actual | Budget | Result |',
  '| --- | ---: | ---: | --- |',
  ...rows,
  '',
].join('\n');

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'bundle-report.json'),
  `${JSON.stringify({ measurements, budgets: configuration.budgets, assets, failures }, null, 2)}\n`,
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
