import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

/**
 * App-version lockstep (Batch 8.4). The app version lives in three places that must
 * stay identical, and it must remain inside the frozen story package's supported
 * range (`>=0.1.0 <0.2.0`) so a bump can never drift or silently break content
 * loading. This test reads the files directly so a future edit to any one site is
 * caught in the gate battery.
 */
const root = process.cwd();

function readConst(file: string, name: string): string | null {
  const source = readFileSync(path.join(root, file), 'utf8');
  const match = new RegExp(`${name}\\s*=\\s*'([^']+)'`).exec(source);
  return match?.[1] ?? null;
}

function parseSemver(value: string): number[] {
  return value.split('.').map((part) => Number.parseInt(part, 10));
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) {
      return (a[i] || 0) - (b[i] || 0);
    }
  }
  return 0;
}

describe('app version lockstep', () => {
  const packageVersion = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const saveStateVersion = readConst('src/domain/progress/saveState.ts', 'CURRENT_APP_VERSION');
  const conversionVersion = readConst(
    'tools/conversion/lib/story-package.ts',
    'CURRENT_APP_VERSION',
  );

  it('keeps package.json, saveState, and story-package app versions identical', () => {
    expect(saveStateVersion).toBe(packageVersion);
    expect(conversionVersion).toBe(packageVersion);
  });

  it('keeps the app version inside the frozen package supported range', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'story-packages/eternal-return/manifest.json'), 'utf8'),
    );
    const match = /^>=(\S+) <(\S+)$/.exec(manifest.supportedAppRange);
    expect(match).not.toBeNull();
    const lower = match?.[1] ?? '0.0.0';
    const upper = match?.[2] ?? '0.0.0';
    const version = parseSemver(packageVersion);
    expect(compare(version, parseSemver(lower))).toBeGreaterThanOrEqual(0);
    expect(compare(version, parseSemver(upper))).toBeLessThan(0);
  });
});
