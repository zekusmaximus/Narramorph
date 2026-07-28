import { describe, expect, it } from 'vitest';

import {
  collectStaticGraph,
  createBundleGraphMeasurements,
  formatProfileMarkdown,
  summarizeFrameTimestamps,
  validateProfileResult,
} from '../../../scripts/lib/profile-3d.mjs';

describe('3D profile helpers', () => {
  it('aggregates monotonic rAF timestamps', () => {
    const summary = summarizeFrameTimestamps([100, 116, 133, 150]);
    expect(summary).toMatchObject({
      frameCount: 3,
      durationMs: 50,
      p50FrameMs: 17,
      p95FrameMs: 17,
      maxFrameMs: 17,
    });
    expect(summary.averageFps).toBeCloseTo(60);
    expect(summary.meanFrameMs).toBeCloseTo(50 / 3);
    expect(() => summarizeFrameTimestamps([100, 100])).toThrow(/non-monotonic/);
  });

  it('extracts distinct initial and deferred manifest graphs', () => {
    const manifest = {
      'index.html': { file: 'assets/index.js', imports: ['shared'] },
      'src/components/NodeMap/index.ts': {
        file: 'assets/map.js',
        imports: ['shared'],
      },
      'src/components/3d/NarromorphCanvas.tsx': {
        file: 'assets/three.js',
        imports: ['shared', 'three-vendor'],
      },
      shared: { file: 'assets/shared.js' },
      'three-vendor': { file: 'assets/three-vendor.js' },
    };
    const asset = (file, bytes) => ({ file, bytes, gzipBytes: Math.round(bytes / 2) });
    const assets = new Map([
      ['assets/index.js', asset('assets/index.js', 100)],
      ['assets/map.js', asset('assets/map.js', 200)],
      ['assets/shared.js', asset('assets/shared.js', 50)],
      ['assets/three.js', asset('assets/three.js', 400)],
      ['assets/three-vendor.js', asset('assets/three-vendor.js', 300)],
    ]);

    expect([...collectStaticGraph(manifest, ['index.html'])]).toEqual(['index.html', 'shared']);
    expect(createBundleGraphMeasurements(manifest, assets)).toMatchObject({
      initial2d: { assetCount: 3, bytes: 350, gzipBytes: 175 },
      deferred3d: { assetCount: 2, bytes: 700, gzipBytes: 350 },
    });
  });

  it('validates diagnostics and formats unavailable heap explicitly', () => {
    const result = {
      timestamp: '2026-07-28T12:00:00.000Z',
      environment: {
        browser: { name: 'chromium', version: '151.0' },
        os: { platform: 'win32', release: '11', arch: 'x64' },
        browserPlatform: 'Win32',
        viewport: { width: 1440, height: 900 },
        devicePixelRatio: 1,
        reducedMotion: 'no-preference',
        settleDurationMs: 1_500,
        requestedSampleDurationMs: 5_000,
      },
      measurements: {
        timings: { toggleToSceneReadyMs: 800, contextLossTo2dRecoveryMs: 40 },
        frames: {
          averageFps: 60,
          durationMs: 5_000,
          frameCount: 300,
          meanFrameMs: 16.67,
          p95FrameMs: 16.8,
          maxFrameMs: 20,
        },
        renderer: {
          calls: 40,
          triangles: 50_000,
          points: 0,
          lines: 0,
          geometries: 40,
          textures: 3,
        },
        jsHeap: { available: false, bytes: null, source: null },
        bundle: {
          initial2d: { assetCount: 3, bytes: 600_000, gzipBytes: 200_000 },
          deferred3d: { assetCount: 1, bytes: 900_000, gzipBytes: 250_000 },
        },
      },
      failures: [],
    };

    expect(() => validateProfileResult(result)).not.toThrow();
    expect(formatProfileMarkdown(result)).toContain('| JavaScript heap | unavailable |');
    expect(formatProfileMarkdown(result)).toContain('diagnostic baselines, not CI budgets');

    result.measurements.jsHeap = { available: true, bytes: Number.NaN, source: 'test' };
    expect(() => validateProfileResult(result)).toThrow(/available JavaScript heap/);
  });
});
