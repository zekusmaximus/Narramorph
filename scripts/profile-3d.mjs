#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

import { chromium } from '@playwright/test';

import {
  createBundleGraphMeasurements,
  formatProfileMarkdown,
  summarizeFrameTimestamps,
  validateProfileResult,
} from './lib/profile-3d.mjs';

const root = process.cwd();
const outputDirectory = path.join(root, 'output', 'profile-3d');
const port = Number(process.env.PROFILE_3D_PORT ?? 4175);
const baseURL = `http://127.0.0.1:${port}`;
const settleDurationMs = Number(process.env.PROFILE_3D_SETTLE_MS ?? 1_500);
const requestedSampleDurationMs = Number(process.env.PROFILE_3D_SAMPLE_MS ?? 5_000);
const viewport = { width: 1_440, height: 900 };
const reducedMotion = 'no-preference';
const relevantFailure =
  /content security policy|blocked.*blob|worker module|troika|webgl.*(?:fail|error)|(?:fail|error).*webgl|context lost|webglcontextlost|unhandled rejection/i;
const expectedContextLoss = /(?:three\.webglrenderer:\s*)?context lost/i;
const forbiddenWorkerSignatures = [
  'worker module init function failed to rehydrate',
  'Worker module function was called but `init` did not return a callable function',
  'troika-three-text',
];

const delay = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

function assertConfiguration() {
  for (const [name, value] of [
    ['PROFILE_3D_PORT', port],
    ['PROFILE_3D_SETTLE_MS', settleDurationMs],
    ['PROFILE_3D_SAMPLE_MS', requestedSampleDurationMs],
  ]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive finite number.`);
    }
  }
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production CSP fixture exited before it was ready (${server.exitCode}).`);
    }
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        return;
      }
    } catch {
      // The fixture is still starting.
    }
    await delay(200);
  }
  throw new Error(`Production CSP fixture did not become ready at ${baseURL}.`);
}

async function stopServer(server) {
  if (server.exitCode !== null) {
    return;
  }
  server.kill();
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(5_000)]);
}

function startServer() {
  const server = spawn(process.execPath, ['scripts/serve-production-csp.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });
  server.profileOutput = () => output.trim();
  return server;
}

async function measureBundleGraphs() {
  const manifestPath = path.join(root, 'dist', '.vite', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const assetsByFile = new Map();

  for (const entry of Object.values(manifest)) {
    if (!entry.file?.endsWith('.js') || assetsByFile.has(entry.file)) {
      continue;
    }
    const contents = await readFile(path.join(root, 'dist', entry.file));
    assetsByFile.set(entry.file, {
      file: entry.file,
      bytes: contents.byteLength,
      gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
    });
  }

  const measurements = createBundleGraphMeasurements(manifest, assetsByFile);
  const offendingAssets = [];
  for (const asset of measurements.deferred3d.files) {
    const contents = await readFile(path.join(root, 'dist', asset.file));
    const signatures = forbiddenWorkerSignatures.filter((signature) =>
      contents.includes(signature),
    );
    if (signatures.length > 0) {
      offendingAssets.push(`${asset.file}: ${signatures.join(', ')}`);
    }
  }
  if (offendingAssets.length > 0) {
    throw new Error(
      `Deferred 3D graph contains Troika worker code:\n${offendingAssets.join('\n')}`,
    );
  }

  return measurements;
}

function validateCsp(csp) {
  if (!csp) {
    throw new Error('Production response did not include Content-Security-Policy.');
  }
  const scriptSource = csp.match(/(?:^|;\s*)script-src\s+([^;]+)/)?.[1]?.trim();
  const workerSource = csp.match(/(?:^|;\s*)worker-src\s+([^;]+)/)?.[1]?.trim();
  if (scriptSource !== "'self'" || workerSource !== "'self'") {
    throw new Error(
      `Production CSP must retain self-only script and worker sources (received script-src ${scriptSource ?? 'missing'}, worker-src ${workerSource ?? 'missing'}).`,
    );
  }
}

async function installTimingProbe(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('narramorph-intro-seen-version', '999');

    const state = {
      toggleStartedAt: null,
      sceneReadyAt: null,
      contextLossStartedAt: null,
      recoveryVisibleAt: null,
    };

    const isVisible = (element) =>
      element instanceof HTMLElement &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden';

    const checkMilestones = () => {
      const readyScene = document.querySelector(
        '[data-testid="three-dimensional-scene"][data-scene-ready="true"]',
      );
      if (state.toggleStartedAt !== null && state.sceneReadyAt === null && isVisible(readyScene)) {
        state.sceneReadyAt = performance.now();
      }

      const fallback = document.querySelector('[data-testid="webgl-fallback-status"]');
      const twoDimensionalMap = document.querySelector('[aria-label="Story map"]');
      if (
        state.contextLossStartedAt !== null &&
        state.recoveryVisibleAt === null &&
        isVisible(fallback) &&
        isVisible(twoDimensionalMap)
      ) {
        state.recoveryVisibleAt = performance.now();
      }
    };

    document.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        const toggle =
          target instanceof Element
            ? target.closest('button[aria-describedby="experimental-3d-description"]')
            : null;
        if (toggle?.textContent?.includes('Experimental 3D view')) {
          state.toggleStartedAt = performance.now();
        }
      },
      true,
    );

    new MutationObserver(checkMilestones).observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    Object.defineProperty(window, '__narramorph3dProfileProbe', {
      configurable: false,
      enumerable: false,
      value: Object.freeze({
        beginContextLoss: (canvas) => {
          state.contextLossStartedAt = performance.now();
          canvas.dispatchEvent(
            new Event('webglcontextlost', {
              bubbles: false,
              cancelable: true,
            }),
          );
        },
        read: () => ({ ...state }),
      }),
      writable: false,
    });
  });
}

async function sampleAnimationFrames(page) {
  const timestamps = await page.evaluate(
    (durationMs) =>
      new Promise((resolve) => {
        const samples = [];
        let startedAt = null;
        const sample = (timestamp) => {
          startedAt ??= timestamp;
          samples.push(timestamp);
          if (timestamp - startedAt >= durationMs) {
            resolve(samples);
          } else {
            requestAnimationFrame(sample);
          }
        };
        requestAnimationFrame(sample);
      }),
    requestedSampleDurationMs,
  );
  return summarizeFrameTimestamps(timestamps);
}

async function readJavaScriptHeap(context, page) {
  let session;
  try {
    session = await context.newCDPSession(page);
    await session.send('Performance.enable');
    const response = await session.send('Performance.getMetrics');
    const heap = response.metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value;
    if (Number.isFinite(heap) && heap >= 0) {
      return { available: true, bytes: heap, source: 'Chromium CDP JSHeapUsedSize' };
    }
  } catch {
    // CDP and precise heap counters are browser capabilities, not harness gates.
  } finally {
    await session?.detach().catch(() => undefined);
  }

  const heap = await page.evaluate(() => {
    const memory = performance.memory;
    return typeof memory?.usedJSHeapSize === 'number' ? memory.usedJSHeapSize : null;
  });
  return Number.isFinite(heap) && heap >= 0
    ? { available: true, bytes: heap, source: 'performance.memory.usedJSHeapSize' }
    : { available: false, bytes: null, source: null };
}

async function runBrowserJourney(bundle) {
  const browser = await chromium.launch({ headless: process.env.PROFILE_3D_HEADED !== '1' });
  let context;
  try {
    context = await browser.newContext({
      deviceScaleFactor: 1,
      reducedMotion,
      viewport,
    });
    const page = await context.newPage();
    const failures = [];
    let phase = 'normal';

    page.on('console', (message) => {
      const text = message.text();
      const expected = phase === 'intentional-context-loss' && expectedContextLoss.test(text);
      if (!expected && (message.type() === 'error' || relevantFailure.test(text))) {
        failures.push(`console(${message.type()}): ${text}`);
      }
    });
    page.on('pageerror', (error) => {
      failures.push(`pageerror: ${error.message}`);
    });

    await installTimingProbe(page);
    const response = await page.goto(`${baseURL}/?profile3d=1`, {
      waitUntil: 'domcontentloaded',
    });
    validateCsp(response?.headers()['content-security-policy']);

    const twoDimensionalMap = page.getByRole('region', { name: 'Story map' });
    await twoDimensionalMap.waitFor({ state: 'visible', timeout: 30_000 });
    const initialResources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((entry) => new URL(entry.name).pathname),
    );
    if (initialResources.some((name) => /NarromorphCanvas|ContentPanel3D/i.test(name))) {
      throw new Error('The deferred 3D graph loaded before the user selected the 3D toggle.');
    }

    await page.getByRole('button', { name: 'Experimental 3D view' }).click();
    const scene = page.getByTestId('three-dimensional-scene');
    await scene.waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="three-dimensional-scene"]')
          ?.getAttribute('data-scene-ready') === 'true',
      undefined,
      { timeout: 30_000 },
    );
    const readyTiming = await page.evaluate(() => window.__narramorph3dProfileProbe.read());
    if (readyTiming.toggleStartedAt === null || readyTiming.sceneReadyAt === null) {
      throw new Error('The scene-ready timing probe did not observe the UI toggle journey.');
    }

    await page.waitForTimeout(settleDurationMs);
    const frames = await sampleAnimationFrames(page);
    const renderer = await page.evaluate(
      () => window.__narramorph3dDiagnostics?.readRendererStatistics() ?? null,
    );
    if (renderer === null) {
      throw new Error('The opt-in renderer diagnostic snapshot was unavailable.');
    }
    const jsHeap = await readJavaScriptHeap(context, page);

    phase = 'intentional-context-loss';
    await scene.locator('canvas').evaluate((canvas) => {
      window.__narramorph3dProfileProbe.beginContextLoss(canvas);
    });
    const fallback = page.getByTestId('webgl-fallback-status');
    await fallback.waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByRole('region', { name: 'Story map' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    await page.waitForFunction(
      () => window.__narramorph3dProfileProbe.read().recoveryVisibleAt !== null,
      undefined,
      { timeout: 30_000 },
    );
    const recoveryTiming = await page.evaluate(() => window.__narramorph3dProfileProbe.read());
    const preference = await page.evaluate(() => localStorage.getItem('narramorph-3d-mode'));
    if (preference !== 'false') {
      throw new Error('Context-loss recovery did not clear the persisted 3D preference.');
    }
    if (recoveryTiming.contextLossStartedAt === null || recoveryTiming.recoveryVisibleAt === null) {
      throw new Error('Context-loss recovery timing was unavailable.');
    }

    await page.waitForTimeout(100);
    const browserEnvironment = await page.evaluate(() => ({
      browserPlatform: navigator.userAgentData?.platform ?? navigator.platform,
      devicePixelRatio: window.devicePixelRatio,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'reduce'
        : 'no-preference',
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }));

    return {
      schemaVersion: 1,
      status: 'pass',
      timestamp: new Date().toISOString(),
      environment: {
        browser: { name: 'chromium', version: browser.version() },
        os: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
        },
        ...browserEnvironment,
        settleDurationMs,
        requestedSampleDurationMs,
      },
      measurements: {
        timings: {
          toggleToSceneReadyMs: readyTiming.sceneReadyAt - readyTiming.toggleStartedAt,
          contextLossTo2dRecoveryMs:
            recoveryTiming.recoveryVisibleAt - recoveryTiming.contextLossStartedAt,
        },
        frames,
        renderer,
        jsHeap,
        bundle,
      },
      failures,
    };
  } finally {
    await context?.close();
    await browser.close();
  }
}

async function writeReports(result) {
  await mkdir(outputDirectory, { recursive: true });
  const json = `${JSON.stringify(result, null, 2)}\n`;
  const markdown = formatProfileMarkdown(result);
  const runName = result.timestamp.replace(/[:.]/g, '-');
  await Promise.all([
    writeFile(path.join(outputDirectory, 'latest.json'), json),
    writeFile(path.join(outputDirectory, 'latest.md'), markdown),
    writeFile(path.join(outputDirectory, `${runName}.json`), json),
    writeFile(path.join(outputDirectory, `${runName}.md`), markdown),
  ]);
  process.stdout.write(`${markdown}\nReports: ${path.relative(root, outputDirectory)}\n`);
}

async function main() {
  assertConfiguration();
  const bundle = await measureBundleGraphs();
  const server = startServer();
  try {
    await waitForServer(server);
    const result = await runBrowserJourney(bundle);
    validateProfileResult(result);
    await writeReports(result);
  } catch (error) {
    const serverOutput = server.profileOutput();
    if (serverOutput) {
      process.stderr.write(`Production fixture output:\n${serverOutput}\n`);
    }
    throw error;
  } finally {
    await stopServer(server);
  }
}

await main();
