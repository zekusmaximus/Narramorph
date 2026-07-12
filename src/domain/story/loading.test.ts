import { describe, expect, it, vi } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';
import type { Connection, StoryData, StoryNode } from '@/types';

import { loadStoryState } from './loading';

const node = (id: string, x: number, y: number): StoryNode => ({
  id,
  character: 'archaeologist',
  layer: 1,
  title: id,
  position: { x, y },
  content: { initial: 'Content', firstRevisit: '', metaAware: '' },
  connections: [],
  visualState: { defaultColor: '#000000', size: 1 },
  metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: true },
});

const connection: Connection = {
  id: 'one-two',
  sourceId: 'one',
  targetId: 'two',
  type: 'temporal',
  label: '',
  bidirectional: false,
  visualProperties: { color: '#000000', weight: 1, animated: false },
};

function story(nodes: StoryNode[], connections: Connection[] = []): StoryData {
  return {
    metadata: {
      id: 'test-story',
      title: 'Test Story',
      author: 'Test',
      description: 'Test',
      version: '1.0.0',
      estimatedPlaytime: 1,
    },
    nodes,
    connections,
    configuration: {
      startNodeId: nodes[0]?.id ?? '',
      endingNodeIds: [],
      requiredNodesForCompletion: [],
    },
  };
}

describe('loadStoryState', () => {
  it('prepares an atomic success transition with maps, progress, unlocks, and viewport', async () => {
    const storyData = story([node('one', 100, 200), node('two', 500, 600)], [connection]);
    const unlockConfigs = new Map();
    const result = await loadStoryState('test-story', {
      loadStoryContent: vi.fn().mockResolvedValue(storyData),
      loadUnlockConfig: vi.fn(() => unlockConfigs),
      createInitialProgress,
    });

    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') {
      return;
    }

    expect([...result.state.nodes.keys()]).toEqual(['one', 'two']);
    expect([...result.state.connections.keys()]).toEqual(['one-two']);
    expect(result.state.progress.visitedNodes).toEqual({});
    expect(result.state.unlockConfigs).toBe(unlockConfigs);
    expect(result.state.viewport).toEqual({
      bounds: { minX: 0, maxX: 600, minY: 100, maxY: 700 },
      center: { x: 300, y: 400 },
    });
  });

  it('preserves the existing viewport when an injected loader returns an empty story', async () => {
    const result = await loadStoryState('empty-story', {
      loadStoryContent: vi.fn().mockResolvedValue(story([])),
      loadUnlockConfig: vi.fn(() => new Map()),
      createInitialProgress,
    });

    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') {
      return;
    }
    expect(result.state.nodes.size).toBe(0);
    expect(result.state.viewport).toBeNull();
  });

  it('maps content failures to the existing reader-facing error', async () => {
    const contentError = new Error('Story metadata not found for missing');
    contentError.name = 'ContentLoadError';

    const result = await loadStoryState('missing', {
      loadStoryContent: vi.fn().mockRejectedValue(contentError),
      loadUnlockConfig: vi.fn(() => new Map()),
      createInitialProgress,
    });

    expect(result).toMatchObject({
      status: 'failed',
      cause: contentError,
      error: { message: 'Story loading failed: Story metadata not found for missing' },
    });
  });

  it('contains unexpected unlock-loader failures without creating a partial transition', async () => {
    const unlockError = new Error('Malformed unlock configuration');
    const result = await loadStoryState('test-story', {
      loadStoryContent: vi.fn().mockResolvedValue(story([node('one', 0, 0)])),
      loadUnlockConfig: vi.fn(() => {
        throw unlockError;
      }),
      createInitialProgress,
    });

    expect(result).toMatchObject({
      status: 'failed',
      cause: unlockError,
      error: { message: 'Unexpected error loading story: Malformed unlock configuration' },
    });
  });
});
