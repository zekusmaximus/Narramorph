#!/usr/bin/env node

/**
 * Reproducible-artifact check (Batch 8.4).
 *
 * Builds twice from the current tree and compares the emitted asset filenames +
 * sha256 hashes. A tagged commit should yield a byte-stable artifact (the
 * reproducibility half of the 8.4 acceptance). Owner/CI-run — it runs two full
 * builds, so it is not part of the fast offline gate battery.
 *
 * Usage: npm run release:verify
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function snapshot() {
  const walk = (directory) => {
    const files = [];
    for (const entry of readdirSync(directory).sort()) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) {
        files.push(...walk(absolute));
      } else {
        files.push(absolute);
      }
    }
    return files;
  };
  const map = {};
  for (const absolute of walk(distDir)) {
    map[path.relative(distDir, absolute).split(path.sep).join('/')] = sha256(
      readFileSync(absolute),
    );
  }
  return map;
}

function build(label) {
  process.stdout.write(`Building (${label})…\n`);
  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: root });
  if (result.status !== 0) {
    process.stderr.write('Build failed.\n');
    process.exit(1);
  }
}

build('pass 1');
const first = snapshot();
build('pass 2');
const second = snapshot();

const diffs = [];
const allFiles = new Set([...Object.keys(first), ...Object.keys(second)]);
for (const file of [...allFiles].sort()) {
  if (first[file] !== second[file]) {
    diffs.push(`  ${file}: ${first[file] ?? '(absent)'} vs ${second[file] ?? '(absent)'}`);
  }
}

if (diffs.length === 0) {
  process.stdout.write(
    `reproducible: OK — ${Object.keys(second).length} assets identical across two builds.\n`,
  );
} else {
  process.stderr.write(`reproducible: FAIL — ${diffs.length} asset(s) differ between builds:\n`);
  process.stderr.write(diffs.join('\n') + '\n');
  process.exitCode = 1;
}
