import path from 'node:path';

const percentile = (sortedValues, fraction) => {
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * fraction) - 1);
  return sortedValues[Math.max(0, index)];
};

export function summarizeFrameTimestamps(timestamps) {
  if (!Array.isArray(timestamps) || timestamps.length < 2) {
    throw new Error('Frame sampling requires at least two rAF timestamps.');
  }

  const intervals = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]);
  if (intervals.some((interval) => !Number.isFinite(interval) || interval <= 0)) {
    throw new Error('Frame sampling produced non-monotonic or invalid timestamps.');
  }

  const durationMs = timestamps[timestamps.length - 1] - timestamps[0];
  const meanFrameMs = intervals.reduce((total, interval) => total + interval, 0) / intervals.length;
  const sortedIntervals = [...intervals].sort((left, right) => left - right);

  return {
    frameCount: intervals.length,
    durationMs,
    averageFps: 1_000 / meanFrameMs,
    meanFrameMs,
    p50FrameMs: percentile(sortedIntervals, 0.5),
    p95FrameMs: percentile(sortedIntervals, 0.95),
    maxFrameMs: sortedIntervals[sortedIntervals.length - 1],
  };
}

export function collectStaticGraph(manifest, entryKeys) {
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
}

function summarizeAssetKeys(manifest, keys, assetsByFile) {
  const files = new Map();
  for (const key of keys) {
    const file = manifest[key]?.file;
    if (!file || path.extname(file) !== '.js') {
      continue;
    }
    const asset = assetsByFile.get(file);
    if (!asset) {
      throw new Error(`Built JavaScript asset not measured: ${file}`);
    }
    files.set(file, asset);
  }

  const assets = [...files.values()].sort((left, right) => left.file.localeCompare(right.file));
  return {
    assetCount: assets.length,
    bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
    gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
    files: assets,
  };
}

export function createBundleGraphMeasurements(manifest, assetsByFile) {
  const initialEntryKeys = ['index.html', 'src/components/NodeMap/index.ts'];
  const threeDimensionalEntryKey = 'src/components/3d/NarromorphCanvas.tsx';
  const initialKeys = collectStaticGraph(manifest, initialEntryKeys);
  const threeDimensionalKeys = collectStaticGraph(manifest, [threeDimensionalEntryKey]);
  const deferredKeys = new Set([...threeDimensionalKeys].filter((key) => !initialKeys.has(key)));

  if (initialKeys.has(threeDimensionalEntryKey)) {
    throw new Error('The deferred 3D entry is present in the initial 2D graph.');
  }

  return {
    initial2d: {
      entryKeys: initialEntryKeys,
      ...summarizeAssetKeys(manifest, initialKeys, assetsByFile),
    },
    deferred3d: {
      entryKeys: [threeDimensionalEntryKey],
      ...summarizeAssetKeys(manifest, deferredKeys, assetsByFile),
    },
  };
}

const validFinite = (value) => typeof value === 'number' && Number.isFinite(value);

export function validateProfileResult(result) {
  const errors = [];
  const timings = result.measurements.timings;
  const frames = result.measurements.frames;
  const renderer = result.measurements.renderer;
  const bundle = result.measurements.bundle;

  if (!validFinite(timings.toggleToSceneReadyMs) || timings.toggleToSceneReadyMs <= 0) {
    errors.push('toggle-to-scene-ready latency must be a positive finite number');
  }
  if (!validFinite(timings.contextLossTo2dRecoveryMs) || timings.contextLossTo2dRecoveryMs <= 0) {
    errors.push('context-loss recovery latency must be a positive finite number');
  }
  if (
    !validFinite(frames.averageFps) ||
    frames.averageFps <= 0 ||
    !validFinite(frames.durationMs) ||
    frames.durationMs <= 0 ||
    frames.frameCount < 2
  ) {
    errors.push('rAF sampling must contain valid positive timing and FPS measurements');
  }
  for (const [name, value] of Object.entries(renderer)) {
    if (!Number.isInteger(value) || value < 0) {
      errors.push(`renderer statistic ${name} must be a non-negative integer`);
    }
  }
  for (const [name, graph] of Object.entries(bundle)) {
    if (graph.assetCount < 1 || graph.bytes <= 0 || graph.gzipBytes <= 0) {
      errors.push(`${name} bundle graph must contain measured JavaScript assets`);
    }
  }
  if (
    result.measurements.jsHeap.available &&
    (!validFinite(result.measurements.jsHeap.bytes) || result.measurements.jsHeap.bytes < 0)
  ) {
    errors.push('available JavaScript heap must be a non-negative finite number');
  }
  if (result.failures.length > 0) {
    errors.push(...result.failures);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid 3D profile:\n- ${errors.join('\n- ')}`);
  }
}

const formatMs = (value) => `${value.toFixed(1)} ms`;
const formatBytes = (value) => `${(value / 1_048_576).toFixed(2)} MiB`;
const formatKiB = (value) => `${(value / 1_024).toFixed(2)} KiB`;

export function formatProfileMarkdown(result) {
  const { environment, measurements } = result;
  const heap = measurements.jsHeap.available
    ? `${formatBytes(measurements.jsHeap.bytes)} (${measurements.jsHeap.source})`
    : 'unavailable';

  return [
    '# Experimental 3D performance profile',
    '',
    `Recorded: ${result.timestamp}`,
    `Browser: ${environment.browser.name} ${environment.browser.version}`,
    `Platform: ${environment.os.platform} ${environment.os.release} (${environment.os.arch}); browser platform ${environment.browserPlatform}`,
    `Viewport: ${environment.viewport.width}×${environment.viewport.height}; DPR ${environment.devicePixelRatio}; reduced motion ${environment.reducedMotion}`,
    `Sampling: ${environment.settleDurationMs} ms settle + ${environment.requestedSampleDurationMs} ms requested rAF window`,
    '',
    '| Diagnostic | Result |',
    '| --- | ---: |',
    `| Toggle → first scene-ready frame | ${formatMs(measurements.timings.toggleToSceneReadyMs)} |`,
    `| Steady-state average FPS | ${measurements.frames.averageFps.toFixed(1)} |`,
    `| Mean / p95 / max frame time | ${formatMs(measurements.frames.meanFrameMs)} / ${formatMs(measurements.frames.p95FrameMs)} / ${formatMs(measurements.frames.maxFrameMs)} |`,
    `| Actual rAF sample | ${formatMs(measurements.frames.durationMs)} (${measurements.frames.frameCount} intervals) |`,
    `| Renderer calls / triangles | ${measurements.renderer.calls} / ${measurements.renderer.triangles.toLocaleString()} |`,
    `| Renderer geometries / textures | ${measurements.renderer.geometries} / ${measurements.renderer.textures} |`,
    `| JavaScript heap | ${heap} |`,
    `| Context loss → visible 2D recovery | ${formatMs(measurements.timings.contextLossTo2dRecoveryMs)} |`,
    `| Initial 2D JavaScript graph | ${formatKiB(measurements.bundle.initial2d.bytes)} / ${formatKiB(measurements.bundle.initial2d.gzipBytes)} gzip (${measurements.bundle.initial2d.assetCount} assets) |`,
    `| Deferred 3D JavaScript graph | ${formatKiB(measurements.bundle.deferred3d.bytes)} / ${formatKiB(measurements.bundle.deferred3d.gzipBytes)} gzip (${measurements.bundle.deferred3d.assetCount} assets) |`,
    '',
    '> FPS, latency, memory, and renderer counters are diagnostic baselines, not CI budgets. Headless software WebGL does not substitute for the manual real-device/browser matrix.',
    '',
  ].join('\n');
}
