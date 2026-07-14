import { describe, expect, it } from 'vitest';

import type { StoryData } from '@/types';

import {
  RuntimeContentValidationError,
  validateRuntimeContent,
  validateRuntimePackageInventory,
  validateRuntimeVariationFile,
} from './validateRuntimeContent';

describe('validateRuntimeVariationFile', () => {
  it('rejects fields that the migration-aware loader would normalize', () => {
    const errors = validateRuntimeVariationFile('content.json', {
      nodeId: 'arch-L1',
      totalVariations: 1,
      variations: [{ content: 'Text retained during migration.' }],
    });

    expect(errors).toEqual([
      'content.json: variations[0] missing id',
      'content.json: variations[0] has invalid transformationState',
    ]);
  });

  it('rejects a declared variation count mismatch', () => {
    const errors = validateRuntimeVariationFile('content.json', {
      nodeId: 'arch-L1',
      totalVariations: 2,
      variations: [{ id: 'arch-L1-I-001', transformationState: 'initial', content: 'Text' }],
    });

    expect(errors).toContain(
      'content.json: totalVariations (2) does not match variations.length (1)',
    );
  });

  it('rejects duplicate IDs and non-deterministic ordering', () => {
    const errors = validateRuntimeVariationFile('content.json', {
      nodeId: 'arch-L1',
      totalVariations: 3,
      variations: [
        { id: 'arch-L1-002', transformationState: 'initial', content: 'Two' },
        { id: 'arch-L1-001', transformationState: 'initial', content: 'One' },
        { id: 'arch-L1-001', transformationState: 'initial', content: 'Duplicate' },
      ],
    });

    expect(errors).toContain('content.json: duplicate variation ID arch-L1-001');
    expect(errors).toContain('content.json: records must be ordered by ID');
  });
});

describe('validateRuntimePackageInventory', () => {
  const storyData: StoryData = {
    metadata: {
      id: 'fixture',
      title: 'Fixture',
      author: 'Test',
      description: 'Test',
      version: '1.0.0',
      estimatedPlaytime: 1,
    },
    nodes: [
      {
        id: 'arch-L1',
        character: 'archaeologist',
        layer: 1,
        title: 'Fixture',
        position: { x: 0, y: 0 },
        content: { initial: 'Content', firstRevisit: '', metaAware: '' },
        connections: [],
        visualState: { defaultColor: '#000000', size: 1 },
        metadata: {
          estimatedReadTime: 1,
          thematicTags: [],
          narrativeAct: 1,
          criticalPath: true,
        },
      },
    ],
    connections: [],
    configuration: {
      startNodeId: 'arch-L1',
      endingNodeIds: [],
      requiredNodesForCompletion: [],
    },
  };

  const variation = {
    id: 'arch-L1-001',
    transformationState: 'initial',
    content: 'Content',
  };

  function inventory() {
    return {
      storyId: 'fixture',
      storyData,
      declaration: { structure: { totalNodes: 1, totalConnections: 0 } },
      manifest: {
        sourceRoot: 'archive/source-markdown',
        counts: {
          l1Variations: 1,
          l2Variations: 0,
          l3Variations: 4,
          l4Variations: 1,
          totalVariations: 6,
        },
      },
      variationFiles: [
        {
          path: '/fixture/layer1/arch-L1-variations.json',
          layer: 1 as const,
          data: { nodeId: 'arch-L1', totalVariations: 1, variations: [variation] },
        },
      ],
      l3Aggregates: {
        'algo-L3': [{ variationId: 'algo-L3-001' }],
        'arch-L3': [{ variationId: 'arch-L3-001' }],
        'conv-L3': [{ variationId: 'conv-L3-001' }],
        'hum-L3': [{ variationId: 'hum-L3-001' }],
      },
      l3IndividualPaths: [
        '/fixture/layer3/variations/algo-L3-001.json',
        '/fixture/layer3/variations/arch-L3-001.json',
        '/fixture/layer3/variations/conv-L3-001.json',
        '/fixture/layer3/variations/hum-L3-001.json',
      ],
      l4Aggregate: [{ id: 'final-preserve' }],
      l4IndividualPaths: ['/fixture/layer4/final-preserve.json'],
      selectionMatrix: [
        {
          fromNode: 'arch-L1',
          toNode: 'arch-L1-001',
          conditions: {},
          metadata: { variationId: 'arch-L1-001', variationType: 'Initial' },
        },
      ],
    };
  }

  it('accepts a complete and internally consistent package inventory', () => {
    expect(validateRuntimePackageInventory(inventory())).toEqual([]);
  });

  it('reports count, aggregate, orphan, and matrix-reference failures together', () => {
    const invalid = inventory();
    invalid.declaration.structure.totalNodes = 2;
    invalid.manifest.counts.totalVariations = 99;
    Reflect.deleteProperty(invalid.l3Aggregates, 'hum-L3');
    invalid.l3IndividualPaths.push('/fixture/layer3/variations/orphan-L3-001.json');
    invalid.selectionMatrix[0]!.toNode = 'missing-variation';

    const errors = validateRuntimePackageInventory(invalid);

    expect(errors.some((error) => error.includes('declared totalNodes'))).toBe(true);
    expect(errors.some((error) => error.includes('missing checked-in file for hum-L3'))).toBe(true);
    expect(errors.some((error) => error.includes('orphaned checked-in file'))).toBe(true);
    expect(errors.some((error) => error.includes('references missing variation'))).toBe(true);
    expect(errors.some((error) => error.includes('manifest totalVariations'))).toBe(true);
  });

  it('rejects a deliberately malformed synthetic story package for the intended reason', () => {
    const malformed = inventory();
    malformed.variationFiles = [];

    const errors = validateRuntimePackageInventory(malformed);

    expect(errors).toContain('fixture: node arch-L1 is missing its runtime variation file');
  });
});

describe('validateRuntimeContent', () => {
  it('strictly validates all content consumed by runtime loaders', async () => {
    await expect(validateRuntimeContent()).resolves.toBeUndefined();
  });

  it('provides an aggregate CI-friendly error', () => {
    expect(new RuntimeContentValidationError(['bad content']).message).toContain('- bad content');
  });
});
