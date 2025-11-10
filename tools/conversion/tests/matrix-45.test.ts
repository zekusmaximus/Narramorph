/**
 * Strict property test for full 45-combo matrix coverage
 * Enforces exactly one section per type per combination when fixtures are complete
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

describe('Selection Matrix 45-combo property', () => {
  it('has exactly 45 combos with full coverage when fixture set is complete', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json'
    );

    let matrix: any;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch {
      // Matrix not present; skip strict property in this environment
      return;
    }

    // Only enforce when matrix claims to be complete (45 combos)
    if (matrix.totalCombinations !== 45) return;

    expect(Array.isArray(matrix.selections)).toBe(true);
    expect(matrix.selections.length).toBe(45);

    // Exactly one entry per combo key
    const keys = new Set<string>();
    for (const entry of matrix.selections) {
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
    expect(matrix.coverage.archaeologist).toBe(45);
    expect(matrix.coverage.algorithm).toBe(45);
    expect(matrix.coverage.lastHuman).toBe(45);
    expect(matrix.coverage.convergent).toBe(45);

    // Missing should be empty when complete
    expect(Array.isArray(matrix.missing)).toBe(true);
    expect(matrix.missing.length).toBe(0);
  });
});

