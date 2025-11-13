#!/usr/bin/env tsx
/**
 * Aggregates L3 and L4 individual variation files into section-based files
 * for compatibility with the matrix generator.
 *
 * Run after convert:l3 and convert:l4 to prepare files for matrix generation.
 */

import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';

interface L3Variation {
  id: string;
  variationId?: string;
  [key: string]: unknown;
}

interface L4Variation {
  id: string;
  [key: string]: unknown;
}

async function aggregateL3(): Promise<void> {
  const contentRoot = resolve(process.cwd(), '../../src/data/stories/eternal-return/content');
  const l3Dir = join(contentRoot, 'layer3/variations');

  console.log('📂 Aggregating L3 variations...');

  const files = await fs.readdir(l3Dir);
  const l3Files = files.filter((f) => f.endsWith('.json') && !f.endsWith('.tmp'));

  const grouped: Record<string, L3Variation[]> = {
    arch: [],
    algo: [],
    hum: [],
    conv: [],
  };

  for (const file of l3Files) {
    const content = JSON.parse(await fs.readFile(join(l3Dir, file), 'utf-8')) as L3Variation;

    // Map 'id' to 'variationId' for compatibility with matrix generator
    const variation: L3Variation = {
      variationId: content.id,
      ...content,
    };

    const prefix = file.split('-')[0];
    if (grouped[prefix]) {
      grouped[prefix].push(variation);
    }
  }

  // Write aggregated files
  let totalVariations = 0;
  for (const [type, variations] of Object.entries(grouped)) {
    if (variations.length > 0) {
      const outPath = join(contentRoot, 'layer3', `${type}-L3-variations.json`);
      await fs.writeFile(outPath, JSON.stringify(variations, null, 2), 'utf-8');
      console.log(`  ✓ ${type}-L3-variations.json: ${variations.length} variations`);
      totalVariations += variations.length;
    }
  }

  console.log(`\n✅ L3 aggregation complete: ${totalVariations} total variations\n`);
}

async function aggregateL4(): Promise<void> {
  const contentRoot = resolve(process.cwd(), '../../src/data/stories/eternal-return/content');
  const l4Dir = join(contentRoot, 'layer4');

  console.log('📂 Aggregating L4 variations...');

  const files = await fs.readdir(l4Dir);
  const l4Files = files.filter(
    (f) => f.startsWith('final-') && f.endsWith('.json') && !f.endsWith('.tmp'),
  );

  const l4Variations: L4Variation[] = [];
  for (const file of l4Files) {
    const content = JSON.parse(await fs.readFile(join(l4Dir, file), 'utf-8')) as L4Variation;
    l4Variations.push(content);
  }

  if (l4Variations.length > 0) {
    const l4OutPath = join(contentRoot, 'layer4', 'terminal-variations.json');
    await fs.writeFile(l4OutPath, JSON.stringify(l4Variations, null, 2), 'utf-8');
    console.log(`  ✓ terminal-variations.json: ${l4Variations.length} variations`);
  }

  console.log(`\n✅ L4 aggregation complete: ${l4Variations.length} total variations\n`);
}

async function main(): Promise<void> {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('L3/L4 VARIATION AGGREGATION');
    console.log('='.repeat(70) + '\n');

    await aggregateL3();
    await aggregateL4();

    console.log('='.repeat(70));
    console.log('✅ Aggregation complete!');
    console.log('   Run "npm run matrix:full" to generate the selection matrix');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error(
      '\n❌ Aggregation failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
