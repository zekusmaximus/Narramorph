#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runCanonValidation } from './lib/canon-validator';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const asOf = new Date().toISOString();
  const report = await runCanonValidation(repositoryRoot, asOf);

  const reportDir = resolve(repositoryRoot, 'tools/conversion/reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = resolve(reportDir, 'canon-validation.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const { errors, warnings, waived, expiredWaivers, byRule } = report.summary;
  console.log(
    'canon validation corpus=' +
      report.corpus.variations +
      ' variations/' +
      report.corpus.families +
      ' families errors=' +
      errors +
      ' warnings=' +
      warnings +
      ' waived=' +
      waived +
      ' expiredWaivers=' +
      expiredWaivers +
      ' report=' +
      relative(repositoryRoot, reportPath),
  );
  const topRules = Object.entries(byRule)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([rule, count]) => rule + ':' + count)
    .join(' ');
  if (topRules) {
    console.log('top rules: ' + topRules);
  }
  if (strict && (errors > 0 || expiredWaivers > 0)) {
    console.error(
      'canon validation failed in strict mode (' +
        errors +
        ' errors, ' +
        expiredWaivers +
        ' expired waivers)',
    );
    process.exit(1);
  }
}

await main();
