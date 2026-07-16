#!/usr/bin/env node

import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createLiteraryStageReport,
  createLiterarySliceStageReport,
  explainAcceptedLiterarySlice,
  explainShippedPassage,
  summarizeContradictions,
  validateAcceptedLiteraryRelease,
  validateAcceptedLiterarySlice,
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
    const coveredVariations = intake.concordance.mappings.reduce(
      (sum, mapping) => sum + mapping.variations.variationCount,
      0,
    );
    const contradictions = intake.contradictions
      ? summarizeContradictions(intake.contradictions)
      : null;
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
        intake.concordance.mappings.length +
        ' coverage=variations:' +
        coveredVariations +
        ',endings:' +
        intake.concordance.endings.length +
        ',characters:' +
        intake.concordance.characters.length +
        ',edges:' +
        intake.concordance.edges.edgeStableKeys.length +
        ',explanations:' +
        intake.concordance.explanations.length +
        ',themes:' +
        intake.concordance.themesAndMotifs.length +
        (contradictions
          ? ' contradictions=total:' +
            contradictions.total +
            ',open:' +
            contradictions.open +
            ',open-sev-1:' +
            contradictions.openSevOne
          : ''),
    );
    return;
  }
  if (command === 'stage-slice' && argument) {
    const result = await createLiterarySliceStageReport(repositoryRoot, argument);
    console.log(
      'staged slice=' +
        argument +
        ' report=' +
        relative(repositoryRoot, result.reportPath) +
        ' review=' +
        relative(repositoryRoot, result.markdownPath) +
        ' classification=' +
        result.report.review.classification +
        ' reportSha256=' +
        result.reportSha256,
    );
    return;
  }
  if (command === 'validate-slice') {
    const intake = await validateAcceptedLiterarySlice(repositoryRoot);
    console.log(
      'valid accepted literary slice=' +
        intake.slice.known.sliceId +
        '@' +
        intake.slice.known.sliceVersion +
        ' release=' +
        intake.release.known.releaseId +
        ' package=' +
        intake.packageManifest.storyId +
        '@' +
        intake.packageManifest.storyVersion +
        ' path=' +
        intake.slice.known.passageStableKeys.join('->'),
    );
    return;
  }
  if (command === 'explain-slice') {
    console.log(JSON.stringify(await explainAcceptedLiterarySlice(repositoryRoot), null, 2));
    return;
  }
  if (command === 'explain' && argument) {
    console.log(JSON.stringify(await explainShippedPassage(repositoryRoot, argument), null, 2));
    return;
  }
  throw new Error(
    'Usage: literary-release.ts stage <release-id> | validate-accepted | explain <passage-id-or-stable-key> | stage-slice <slice-id> | validate-slice | explain-slice',
  );
}

await main();
