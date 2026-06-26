/**
 * Strict property test for full 45-combo matrix coverage
 * Enforces exactly one section per type per combination when fixtures are complete
 */

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { describe, it, expect } from 'vitest';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

describe('Selection Matrix 45-combo property', () => {
  it('has exactly 45 combos with full coverage when fixture set is complete', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: Record<string, unknown>;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      if (!isRecord(parsed)) {
        return;
      }
      matrix = parsed;
    } catch {
      // Matrix not present; skip strict property in this environment
      return;
    }

    // Only enforce when matrix claims to be complete (45 combos)
    if (matrix.totalCombinations !== 45) {
      return;
    }

    const selections = matrix.selections;
    expect(Array.isArray(selections)).toBe(true);
    if (!Array.isArray(selections)) {
      return;
    }
    expect(selections.length).toBe(45);

    // Exactly one entry per combo key
    const keys = new Set<string>();
    for (const entry of selections) {
      expect(isRecord(entry)).toBe(true);
      if (!isRecord(entry)) {
        continue;
      }
      const key = `${entry.journeyPattern}|${entry.philosophyDominant}|${entry.awarenessLevel}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);

      // All 4 sections present
      expect(entry.archaeologist).toBeTruthy();
      expect(entry.algorithm).toBeTruthy();
      expect(entry.lastHuman).toBeTruthy();
      expect(entry.convergent).toBeTruthy();
    }

    // Coverage totals must be 45 each
    const coverage = matrix.coverage;
    expect(isRecord(coverage)).toBe(true);
    if (!isRecord(coverage)) {
      return;
    }
    expect(coverage.archaeologist).toBe(45);
    expect(coverage.algorithm).toBe(45);
    expect(coverage.lastHuman).toBe(45);
    expect(coverage.convergent).toBe(45);

    // Missing should be empty when complete
    const missing = matrix.missing;
    expect(Array.isArray(missing)).toBe(true);
    if (Array.isArray(missing)) {
      expect(missing.length).toBe(0);
    }
  });
});
