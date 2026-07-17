#!/usr/bin/env node

/**
 * One-command rollback helper (Batch 8.4).
 *
 * Prints the exact steps to restore the prior known-good application + story-package
 * combination. The fastest path is an instant Cloudflare Pages deployment promote;
 * the source-of-truth path is a git checkout + rebuild + redeploy. This is
 * owner/ops tooling — it prints the plan (and the current release identity) rather
 * than mutating anything, so a rollback is always a reviewed action.
 *
 * Rollback is save-safe by construction: the save schema is frozen at 1.3.0, so an
 * older app reads a newer app's save without a format change (see
 * src/domain/progress/rollbackSafety.test.ts). Rolling the app back never migrates
 * or rewrites a reader's local save.
 *
 * Usage:
 *   npm run release:rollback -- <target-git-ref>     # e.g. a prior release tag
 *   npm run release:rollback                          # prints the runbook + current identity
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const target = process.argv[2] || '<prior-release-tag>';

let current = null;
try {
  current = JSON.parse(
    readFileSync(path.join(root, 'output', 'release', 'release-manifest.json'), 'utf8'),
  );
} catch {
  // No manifest built yet — the runbook still applies.
}

const lines = [
  '# Rollback runbook — restore the prior known-good app + story package',
  '',
  current
    ? `Current build: app ${current.appVersion} · package ${current.storyPackage.storyId}@` +
      `${current.storyPackage.storyVersion} (${current.storyPackage.contentHash.slice(0, 12)}…) · ` +
      `save schema ${current.saveSchema}`
    : 'Current build: (no release-manifest found — run `npm run build && npm run release:manifest`)',
  '',
  '## Fastest path — Cloudflare Pages instant rollback (seconds, no rebuild)',
  '1. Cloudflare dashboard → Pages → the Narramorph project → Deployments.',
  `2. Find the prior known-good deployment (matching ${target}) and choose "Rollback to this deployment".`,
  '3. Verify https://narramorph.com serves the prior build (hard-refresh; HTML is no-cache).',
  '',
  '## Source-of-truth path — git + rebuild + redeploy',
  `1. git checkout ${target}`,
  '2. npm ci && npm run build && npm run release:manifest',
  '3. Redeploy dist/ (push the revert to the deployment branch, or upload the artifact).',
  '4. Confirm the release manifest records the intended app + package identity.',
  '',
  '## Save safety (no reader data is touched)',
  '- The save schema is frozen at 1.3.0; rolling the app back does not change the save',
  '  format. An older app loads a newer app’s save and preserves progress',
  '  (src/domain/progress/rollbackSafety.test.ts). No local save is migrated or rewritten.',
  '',
  '## After rollback',
  '- Record the rollback (date, from → to app/package, reason) in docs/RELEASE_ROLLBACK.md.',
  '- If monitoring is enabled, confirm the error that triggered the rollback stops in Sentry.',
  '',
];

process.stdout.write(lines.join('\n') + '\n');
