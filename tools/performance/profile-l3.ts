import { performance } from 'node:perf_hooks';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { L3AssemblyView } from '../../src/components/UI/L3AssemblyView';
import type { ConditionContext } from '../../src/types';
import { buildL3AssemblyWithProfile, type L3AssemblyProfile } from '../../src/utils/l3Assembly';
import { performanceMonitor } from '../../src/utils/performanceMonitor';
import { clearVariationCache } from '../../src/utils/variationLoader';

interface TimingSummary {
  min: number;
  median: number;
  p95: number;
  max: number;
}

const contexts: readonly ConditionContext[] = [
  {
    nodeId: 'arch-L3',
    awareness: 80,
    journeyPattern: 'started-stayed',
    pathPhilosophy: 'accept',
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: {
      archaeologist: 70,
      algorithm: 20,
      lastHuman: 10,
    },
  },
  {
    nodeId: 'algo-L3',
    awareness: 50,
    journeyPattern: 'shifted-dominant',
    pathPhilosophy: 'resist',
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: {
      archaeologist: 50,
      algorithm: 45,
      lastHuman: 5,
    },
  },
  {
    nodeId: 'hum-L3',
    awareness: 25,
    journeyPattern: 'met-later',
    pathPhilosophy: 'invest',
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: {
      archaeologist: 34,
      algorithm: 33,
      lastHuman: 33,
    },
  },
];

function summarize(values: readonly number[]): TimingSummary {
  const sorted = [...values].sort((left, right) => left - right);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;

  return {
    min: sorted[0] ?? 0,
    median,
    p95,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

function selectContext(index: number): ConditionContext {
  const context = contexts[index % contexts.length];
  if (!context) {
    throw new Error('L3 profiling context is missing');
  }
  return context;
}

async function main(): Promise<void> {
  const requestedIterations = Number.parseInt(process.env.L3_PROFILE_ITERATIONS ?? '250', 10);
  const iterations =
    Number.isFinite(requestedIterations) && requestedIterations > 0 ? requestedIterations : 250;

  clearVariationCache();
  performanceMonitor.clear();

  const cold = await buildL3AssemblyWithProfile('eternal-return', selectContext(0));
  const profiles: L3AssemblyProfile[] = [];
  const reactRenderMs: number[] = [];
  const selectedVariationIds = new Set<string>();
  let renderedMarkupBytes = 0;

  for (let index = 0; index < iterations; index += 1) {
    const result = await buildL3AssemblyWithProfile('eternal-return', selectContext(index));
    profiles.push(result.profile);
    selectedVariationIds.add(
      [
        result.assembly.arch.variationId,
        result.assembly.algo.variationId,
        result.assembly.hum.variationId,
        result.assembly.conv.variationId,
      ].join('|'),
    );

    const renderStarted = performance.now();
    const markup = renderToStaticMarkup(
      createElement(L3AssemblyView, { assembly: result.assembly }),
    );
    reactRenderMs.push(performance.now() - renderStarted);
    renderedMarkupBytes += Buffer.byteLength(markup);
  }

  const report = {
    storyId: 'eternal-return',
    iterations,
    variationCounts: cold.profile.variationCounts,
    coldMs: {
      loading: cold.profile.loadingMs,
      selection: cold.profile.selectionMs,
      assembly: cold.profile.assemblyMs,
      total: cold.profile.totalMs,
    },
    warmMs: {
      loading: summarize(profiles.map((profile) => profile.loadingMs)),
      selection: summarize(profiles.map((profile) => profile.selectionMs)),
      assembly: summarize(profiles.map((profile) => profile.assemblyMs)),
      total: summarize(profiles.map((profile) => profile.totalMs)),
      reactRender: summarize(reactRenderMs),
    },
    outputCheck: {
      selectedAssemblySignatures: [...selectedVariationIds],
      renderedMarkupBytes,
    },
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main();
