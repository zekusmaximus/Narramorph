#!/usr/bin/env node

import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createLiteraryStageReport,
  explainShippedPassage,
  validateAcceptedLiteraryRelease,
} from './lib/literary-release';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main(): Promise<void> {
  const [command = 'validate-accepted', argument] = process.argv.slice(2);
  if (command === 'stage' && argument) {
    const result = await createLiteraryStageReport(repositoryRoot, argument);
    console.log(
      'staged ' +
        argument +
        ' report=' +
        relative(repositoryRoot, result.reportPath) +
        ' semanticDiff=' +
        relative(repositoryRoot, result.markdownPath) +
        ' classification=' +
        result.report.semanticDiff.classification,
    );
    return;
  }
  if (command === 'validate-accepted') {
    const intake = await validateAcceptedLiteraryRelease(repositoryRoot);
    console.log(
      'valid accepted literary release=' +
        intake.release.known.releaseId +
        ' package=' +
        intake.packageManifest.storyId +
        '@' +
        intake.packageManifest.storyVersion +
        ' passages=' +
        intake.catalog.passages.length +
        ' mappings=' +
        intake.concordance.mappings.length,
    );
    return;
  }
  if (command === 'explain' && argument) {
    console.log(JSON.stringify(await explainShippedPassage(repositoryRoot, argument), null, 2));
    return;
  }
  throw new Error(
    'Usage: literary-release.ts stage <release-id> | validate-accepted | explain <passage-id-or-stable-key>',
  );
}

await main();
