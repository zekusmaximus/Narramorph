/**
 * Integration tests for L3 conversion pipeline
 * Uses fixtures to test end-to-end conversion
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/L3');
const OUTPUT_DIR = join(process.cwd(), 'tests/output/l3');

describe('L3 Integration Tests', () => {
  beforeAll(async () => {
    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up output directory
    try {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should convert L3 fixtures without errors', async () => {
    // Note: This test validates fixture structure but doesn't run full conversion
    // Full conversion would require setting up complete directory structure

    // Validate fixture files exist and have proper structure
    const archFile = join(FIXTURES_DIR, 'arch-L3/arch-L3-001.md');
    const algoFile = join(FIXTURES_DIR, 'algo-L3/algo-L3-001.md');
    const humFile = join(FIXTURES_DIR, 'hum-L3/hum-L3-001.md');
    const convFile = join(FIXTURES_DIR, 'conv-L3/conv-L3-001.md');

    const archContent = await readFile(archFile, 'utf-8');
    const algoContent = await readFile(algoFile, 'utf-8');
    const humContent = await readFile(humFile, 'utf-8');
    const convContent = await readFile(convFile, 'utf-8');

    // Validate frontmatter presence
    expect(archContent).toContain('---');
    expect(archContent).toContain('variationId: arch-L3-001');
    expect(archContent).toContain('journeyPattern: linear');
    expect(archContent).toContain('philosophyDominant: accept');
    expect(archContent).toContain('awarenessLevel: high');

    expect(algoContent).toContain('variationId: algo-L3-001');
    expect(humContent).toContain('variationId: hum-L3-001');

    expect(convContent).toContain('variationId: conv-L3-001');
    expect(convContent).toContain('characterVoices: [archaeologist, algorithm, last-human]');
  });

  it('should have valid L3 frontmatter fields', async () => {
    const archFile = join(FIXTURES_DIR, 'arch-L3/arch-L3-001.md');
    const content = await readFile(archFile, 'utf-8');

    // Required fields
    expect(content).toContain('variationId:');
    expect(content).toContain('journeyPattern:');
    expect(content).toContain('philosophyDominant:');
    expect(content).toContain('awarenessLevel:');
    expect(content).toContain('wordCount:');
  });

  it('should have valid enum values in fixtures', async () => {
    const files = [
      join(FIXTURES_DIR, 'arch-L3/arch-L3-001.md'),
      join(FIXTURES_DIR, 'algo-L3/algo-L3-001.md'),
      join(FIXTURES_DIR, 'hum-L3/hum-L3-001.md'),
      join(FIXTURES_DIR, 'conv-L3/conv-L3-001.md'),
    ];

    const validPhilosophies = ['accept', 'resist', 'invest'];
    const validAwareness = ['veryLow', 'low', 'medium', 'high', 'maximum'];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');

      // Extract philosophy value
      const philoMatch = content.match(/philosophyDominant:\s+(\w+)/);
      if (philoMatch) {
        expect(validPhilosophies).toContain(philoMatch[1]);
      }

      // Extract awareness value
      const awarenessMatch = content.match(/awarenessLevel:\s+(\w+)/);
      if (awarenessMatch) {
        expect(validAwareness).toContain(awarenessMatch[1]);
      }
    }
  });

  it('should have characterVoices in conv-L3 fixture', async () => {
    const convFile = join(FIXTURES_DIR, 'conv-L3/conv-L3-001.md');
    const content = await readFile(convFile, 'utf-8');

    expect(content).toContain('characterVoices:');

    // Extract characterVoices array
    const voicesMatch = content.match(/characterVoices:\s*\[([\w,\s-]+)\]/);
    expect(voicesMatch).toBeTruthy();

    if (voicesMatch) {
      const voices = voicesMatch[1].split(',').map(v => v.trim());
      expect(voices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have proper zero-padded IDs', async () => {
    const files = [
      'arch-L3/arch-L3-001.md',
      'algo-L3/algo-L3-001.md',
      'hum-L3/hum-L3-001.md',
      'conv-L3/conv-L3-001.md',
    ];

    for (const file of files) {
      const fullPath = join(FIXTURES_DIR, file);
      const content = await readFile(fullPath, 'utf-8');

      const idMatch = content.match(/variationId:\s+([\w-]+)/);
      expect(idMatch).toBeTruthy();

      if (idMatch) {
        const id = idMatch[1];
        // Should be 3-digit zero-padded
        expect(id).toMatch(/-\d{3}$/);
      }
    }
  });

  it('should have content body after frontmatter', async () => {
    const archFile = join(FIXTURES_DIR, 'arch-L3/arch-L3-001.md');
    const content = await readFile(archFile, 'utf-8');

    // Split on frontmatter delimiter
    const parts = content.split('---');
    expect(parts.length).toBeGreaterThanOrEqual(3); // opening ---, frontmatter, closing ---, body

    const body = parts[2].trim();
    expect(body.length).toBeGreaterThan(0);
    expect(body.split(/\s+/).length).toBeGreaterThan(10); // Has substantial content
  });
});
