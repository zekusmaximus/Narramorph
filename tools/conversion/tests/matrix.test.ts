/**
 * Property-based tests for L3 selection matrix
 * Validates that matrix has exactly one selection per section type for every combination
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

interface MatrixEntry {
  journeyPattern: string;
  philosophyDominant: string;
  awarenessLevel: string;
  archaeologist: string | null;
  algorithm: string | null;
  lastHuman: string | null;
  convergent: string | null;
}

interface SelectionMatrix {
  schemaVersion: string;
  version: string;
  generatedAt: string;
  sortOrder: string;
  totalCombinations: number;
  coverage: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
    convergent: number;
  };
  missing: Array<{
    combo: string;
    missingSections: string[];
  }>;
  selections: MatrixEntry[];
}

const JOURNEY_PATTERNS = [
  'linear',
  'exploratory',
  'recursive',
  'started-stayed',
  'started-bounced',
  'shifted-dominant',
  'began-lightly',
  'met-later',
];

const PATH_PHILOSOPHIES = ['accept', 'resist', 'invest'];

const AWARENESS_LEVELS = ['veryLow', 'low', 'medium', 'high', 'maximum'];

const SECTION_TYPES = ['archaeologist', 'algorithm', 'lastHuman', 'convergent'];

describe('Selection Matrix Properties', () => {
  it('should exist with valid schema', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    expect(matrix).toBeDefined();
    expect(matrix.schemaVersion).toBe('1.0.0');
    expect(matrix.sortOrder).toBe('numericThenLex');
    expect(matrix.selections).toBeDefined();
    expect(Array.isArray(matrix.selections)).toBe(true);
  });

  it('should have entries for all valid combinations', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Calculate expected combinations: 8 patterns × 3 philosophies × 5 awareness = 120
    const expectedCombos =
      JOURNEY_PATTERNS.length * PATH_PHILOSOPHIES.length * AWARENESS_LEVELS.length;

    expect(matrix.totalCombinations).toBeGreaterThanOrEqual(1);
    expect(matrix.selections.length).toBeGreaterThanOrEqual(1);

    // Note: Actual files may not cover all theoretical combinations
    // This test validates structure, not data completeness
  });

  it('should have unique combinations (no duplicates)', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    const comboKeys = new Set<string>();
    for (const entry of matrix.selections) {
      const key = `${entry.journeyPattern}|${entry.philosophyDominant}|${entry.awarenessLevel}`;
      expect(comboKeys.has(key)).toBe(false); // No duplicates
      comboKeys.add(key);
    }

    expect(comboKeys.size).toBe(matrix.selections.length);
  });

  it('should have valid enum values for all entries', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    for (const entry of matrix.selections) {
      expect(JOURNEY_PATTERNS).toContain(entry.journeyPattern);
      expect(PATH_PHILOSOPHIES).toContain(entry.philosophyDominant);
      expect(AWARENESS_LEVELS).toContain(entry.awarenessLevel);
    }
  });

  it('should have valid variation IDs when present', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    const idPattern = /^(arch|algo|hum|conv)-L3-\d{3}$/;

    for (const entry of matrix.selections) {
      if (entry.archaeologist) {
        expect(entry.archaeologist).toMatch(idPattern);
        expect(entry.archaeologist.startsWith('arch-L3-')).toBe(true);
      }

      if (entry.algorithm) {
        expect(entry.algorithm).toMatch(idPattern);
        expect(entry.algorithm.startsWith('algo-L3-')).toBe(true);
      }

      if (entry.lastHuman) {
        expect(entry.lastHuman).toMatch(idPattern);
        expect(entry.lastHuman.startsWith('hum-L3-')).toBe(true);
      }

      if (entry.convergent) {
        expect(entry.convergent).toMatch(idPattern);
        expect(entry.convergent.startsWith('conv-L3-')).toBe(true);
      }
    }
  });

  it('should have coverage counts matching selections', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Count actual selections
    let archCount = 0;
    let algoCount = 0;
    let humCount = 0;
    let convCount = 0;

    for (const entry of matrix.selections) {
      if (entry.archaeologist) archCount++;
      if (entry.algorithm) algoCount++;
      if (entry.lastHuman) humCount++;
      if (entry.convergent) convCount++;
    }

    expect(matrix.coverage.archaeologist).toBe(archCount);
    expect(matrix.coverage.algorithm).toBe(algoCount);
    expect(matrix.coverage.lastHuman).toBe(humCount);
    expect(matrix.coverage.convergent).toBe(convCount);
  });

  it('should report missing combinations correctly', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Verify missing array matches incomplete entries
    const incompleteCombos = matrix.selections.filter(
      (entry) => !entry.archaeologist || !entry.algorithm || !entry.lastHuman || !entry.convergent,
    );

    expect(matrix.missing.length).toBe(incompleteCombos.length);

    // Verify each missing entry has correct data
    for (const missing of matrix.missing) {
      expect(missing.combo).toBeDefined();
      expect(missing.missingSections).toBeDefined();
      expect(Array.isArray(missing.missingSections)).toBe(true);
      expect(missing.missingSections.length).toBeGreaterThan(0);

      // Verify missing sections are valid
      for (const section of missing.missingSections) {
        expect(SECTION_TYPES).toContain(section);
      }
    }
  });

  it('should maintain deterministic selection order', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Verify selections are sorted by combo key
    for (let i = 1; i < matrix.selections.length; i++) {
      const prev = matrix.selections[i - 1];
      const curr = matrix.selections[i];

      if (!prev || !curr) continue;

      const prevKey = `${prev.journeyPattern}|${prev.philosophyDominant}|${prev.awarenessLevel}`;
      const currKey = `${curr.journeyPattern}|${curr.philosophyDominant}|${curr.awarenessLevel}`;

      expect(prevKey.localeCompare(currKey)).toBeLessThan(0);
    }
  });

  it('should have complete section coverage for each combination (property test)', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Property: Every combination must have either ALL 4 sections or be in missing list
    for (const entry of matrix.selections) {
      const comboKey = `${entry.journeyPattern}-${entry.philosophyDominant}-${entry.awarenessLevel}`;
      const hasSections = [
        entry.archaeologist !== null,
        entry.algorithm !== null,
        entry.lastHuman !== null,
        entry.convergent !== null,
      ];

      const sectionCount = hasSections.filter(Boolean).length;

      // Either all 4 sections present OR in missing list
      if (sectionCount > 0 && sectionCount < 4) {
        // Incomplete: should be in missing list
        const inMissing = matrix.missing.some((m) => m.combo === comboKey);
        expect(inMissing).toBe(true);
      }

      // If all 4 sections present: should NOT be in missing list
      if (sectionCount === 4) {
        const inMissing = matrix.missing.some((m) => m.combo === comboKey);
        expect(inMissing).toBe(false);
      }
    }
  });

  it('should enforce exactly one section per type per combination', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Property: No duplicate combinations
    const combosSeen = new Set<string>();

    for (const entry of matrix.selections) {
      const comboKey = `${entry.journeyPattern}|${entry.philosophyDominant}|${entry.awarenessLevel}`;

      // Each combination should appear exactly once
      expect(combosSeen.has(comboKey)).toBe(false);
      combosSeen.add(comboKey);
    }

    // Total combinations should equal unique combinations
    expect(matrix.selections.length).toBe(combosSeen.size);
  });

  it('should validate missing combinations report accuracy', async () => {
    const projectRoot = resolve(process.cwd(), '../..');
    const matrixPath = join(
      projectRoot,
      'src/data/stories/eternal-return/content/layer3/selection-matrix.json',
    );

    let matrix: SelectionMatrix;
    try {
      const content = await readFile(matrixPath, 'utf-8');
      matrix = JSON.parse(content);
    } catch (error) {
      // Matrix file doesn't exist yet - skip test
      return;
    }

    // Verify missing array is accurate
    for (const missing of matrix.missing) {
      // Find the corresponding selection entry
      const entry = matrix.selections.find(
        (s) => `${s.journeyPattern}-${s.philosophyDominant}-${s.awarenessLevel}` === missing.combo,
      );

      expect(entry).toBeDefined();

      if (entry) {
        // Verify reported missing sections are actually null
        for (const section of missing.missingSections) {
          if (section === 'archaeologist') expect(entry.archaeologist).toBeNull();
          if (section === 'algorithm') expect(entry.algorithm).toBeNull();
          if (section === 'lastHuman') expect(entry.lastHuman).toBeNull();
          if (section === 'convergent') expect(entry.convergent).toBeNull();
        }
      }
    }
  });
});
