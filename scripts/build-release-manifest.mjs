#!/usr/bin/env node

/**
 * Release-manifest generator (Batch 8.4).
 *
 * Records the identities that define a release — app version, story-package identity
 * + frozen content hash, app↔package compatibility range, concordance sha256,
 * accepted literary release, save schema, build commit — plus sha256 checksums of
 * every built asset. Run after `build`:
 *   npm run build && npm run release:manifest
 *
 * Outputs (git-ignored build products):
 *   output/release/release-manifest.json  — the machine-readable release record
 *   output/release/SHA256SUMS             — `sha256␠␠path` lines for verification
 *
 * Deterministic: no wall-clock read. The build commit comes from GIT_SHA/GITHUB_SHA
 * and an optional builtAt from SOURCE_DATE_EPOCH, so a tagged commit yields a stable
 * manifest (the reproducibility acceptance).
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'output', 'release');

const readJson = (relative) => JSON.parse(readFileSync(path.join(root, relative), 'utf8'));
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const pkg = readJson('package.json');
const identity = readJson('src/config/eternalReturnPackageIdentity.json');
const packageManifest = readJson('story-packages/eternal-return/manifest.json');
const acceptedLiterary = readJson('literary-releases/accepted/eternal-return.json');

// Save schema is the source of truth in saveState.ts; read it rather than duplicate.
const saveStateSource = readFileSync(path.join(root, 'src/domain/progress/saveState.ts'), 'utf8');
const saveSchemaMatch = /CURRENT_SAVE_VERSION\s*=\s*'([^']+)'/.exec(saveStateSource);
const saveSchema = saveSchemaMatch ? saveSchemaMatch[1] : null;

const buildCommit = process.env.GIT_SHA || process.env.GITHUB_SHA || 'unknown';
const builtAt = process.env.SOURCE_DATE_EPOCH || null;

// Walk dist for every emitted file and hash it (sorted for a stable manifest).
const collectFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory).sort()) {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...collectFiles(absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
};

let assets = {};
try {
  const files = collectFiles(distDir);
  assets = Object.fromEntries(
    files.map((absolute) => [
      path.relative(distDir, absolute).split(path.sep).join('/'),
      sha256(readFileSync(absolute)),
    ]),
  );
} catch {
  process.stderr.write('No dist/ found — run `npm run build` first.\n');
  process.exitCode = 1;
  process.exit();
}

const manifest = {
  appVersion: pkg.version,
  buildCommit,
  builtAt,
  storyPackage: {
    storyId: identity.storyId,
    storyVersion: identity.storyVersion,
    schemaVersion: identity.schemaVersion,
    contentHash: identity.contentHash,
  },
  compatibility: {
    // The frozen package declares which app versions it supports; the app version
    // must satisfy it (Batch 8.4 keeps the app inside this range).
    supportedAppRange: packageManifest.supportedAppRange,
    appSatisfiesRange: satisfiesRange(pkg.version, packageManifest.supportedAppRange),
  },
  concordanceSha256: acceptedLiterary.concordanceSha256,
  literaryRelease: acceptedLiterary.acceptedReleaseId,
  saveSchema,
  assetCount: Object.keys(assets).length,
  assets,
};

function satisfiesRange(version, range) {
  const match = /^>=(\S+) <(\S+)$/.exec(range || '');
  if (!match) {
    return null;
  }
  const parse = (value) => value.split('.').map((part) => Number.parseInt(part, 10));
  const cmp = (a, b) => {
    for (let i = 0; i < 3; i += 1) {
      if ((a[i] || 0) !== (b[i] || 0)) {
        return (a[i] || 0) - (b[i] || 0);
      }
    }
    return 0;
  };
  const v = parse(version);
  return cmp(v, parse(match[1])) >= 0 && cmp(v, parse(match[2])) < 0;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const sums = Object.entries(assets)
  .map(([file, hash]) => `${hash}  ${file}`)
  .join('\n');
writeFileSync(path.join(outDir, 'SHA256SUMS'), `${sums}\n`);

process.stdout.write(
  `release-manifest: app ${manifest.appVersion} · package ${manifest.storyPackage.storyId}@` +
    `${manifest.storyPackage.storyVersion} (${manifest.storyPackage.contentHash.slice(0, 8)}…) · ` +
    `${manifest.assetCount} assets checksummed · appSatisfiesRange=${manifest.compatibility.appSatisfiesRange}\n`,
);

if (manifest.compatibility.appSatisfiesRange === false) {
  process.stderr.write(
    `release-manifest: FAIL — app ${manifest.appVersion} is outside the package range ` +
      `${manifest.compatibility.supportedAppRange}.\n`,
  );
  process.exitCode = 1;
}
