#!/usr/bin/env node

/**
 * Private source-map upload + cleanup for error monitoring (Batch 8.3).
 *
 * Run in CI AFTER a build produced with `SENTRY_UPLOAD=true` (which emits HIDDEN
 * maps). This uploads the maps privately to Sentry and then DELETES every `.map`
 * under `dist` so no source map is ever published. It is owner/CI tooling, not part
 * of the offline gate battery.
 *
 * Behaviour:
 *   - With SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT set, uploads via
 *     `npx @sentry/cli sourcemaps upload` (release = VITE_APP_RELEASE if present).
 *   - Whether or not upload runs, it always removes every `.map` under dist before
 *     publish, so a misconfigured pipeline can never leak maps.
 *
 * Usage: SENTRY_UPLOAD=true npm run build && node scripts/upload-sourcemaps.mjs
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDir = path.join(root, 'dist');

const authToken = process.env.SENTRY_AUTH_TOKEN;
const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;
const release = process.env.VITE_APP_RELEASE;

function collectMaps(directory) {
  const maps = [];
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      maps.push(...collectMaps(absolute));
    } else if (entry.endsWith('.map')) {
      maps.push(absolute);
    }
  }
  return maps;
}

if (authToken && org && project) {
  const args = ['@sentry/cli', 'sourcemaps', 'upload', '--org', org, '--project', project];
  if (release) {
    args.push('--release', release);
  }
  args.push(path.join('dist', 'assets'));
  process.stdout.write(`Uploading source maps to Sentry (${org}/${project})…\n`);
  const result = spawnSync('npx', args, { stdio: 'inherit', cwd: root });
  if (result.status !== 0) {
    process.stderr.write('Source-map upload failed.\n');
    process.exitCode = 1;
  }
} else {
  process.stdout.write(
    'SENTRY_AUTH_TOKEN/ORG/PROJECT not set — skipping upload; still deleting maps so none publish.\n',
  );
}

let deleted = 0;
try {
  for (const mapFile of collectMaps(distDir)) {
    rmSync(mapFile);
    deleted += 1;
  }
} catch {
  // dist absent or unreadable — nothing to clean.
}
process.stdout.write(`Removed ${deleted} source map(s) from dist before publish.\n`);
